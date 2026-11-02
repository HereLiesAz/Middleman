import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import {
  calculateReadiness,
  contrastructStatement,
  detectHighFriction
} from './src/utils/mediationRules.js';
import {
  MediationSession,
  Message,
  PartnerId,
  ChatType
} from './src/types/mediation.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// Initialize GoogleGenAI client with valid key check
const rawApiKey = process.env.GEMINI_API_KEY || '';
const apiKey = (rawApiKey && rawApiKey !== 'MY_GEMINI_API_KEY' && rawApiKey.trim().length > 10) ? rawApiKey.trim() : '';
let aiClient: GoogleGenAI | null = null;
if (apiKey) {
  aiClient = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
}

function withTimeout<T>(promise: Promise<T>, ms = 6000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('AI generation timed out')), ms)
    )
  ]);
}

/**
 * Pre-configured realistic conflict scenarios
 */
const DEFAULT_SCENARIOS = [
  {
    id: 'anniversary_overwork',
    title: 'The Forgotten Anniversary & Overwork',
    description: 'Alex feels heartbroken and deprioritized after Jordan worked late on their 5th anniversary. Jordan is terrified of upcoming layoffs and worked late trying to protect their family finances.',
    partnerA: {
      id: 'partner_a' as PartnerId,
      name: 'Alex',
      roleDescription: 'Feeling neglected, unappreciated, and emotionally abandoned on an important milestone.',
      avatarSeed: 'alex',
      readinessScore: 15,
      perceivedGrievances: ['Worked late on anniversary', 'Always puts job before relationship', 'Does not apologize sincerely'],
      underlyingNeeds: ['Reassurance of priority', 'Dedicated romantic connection', 'Feeling treasured']
    },
    partnerB: {
      id: 'partner_b' as PartnerId,
      name: 'Jordan',
      roleDescription: 'Carrying intense anxiety over impending company layoffs and feeling misunderstood and unappreciated for working so hard.',
      avatarSeed: 'jordan',
      readinessScore: 15,
      perceivedGrievances: ['Constant guilt trips', 'Unrealistic expectations when career is on the line', 'Efforts to provide go unnoticed'],
      underlyingNeeds: ['Grace and empathy under high pressure', 'Relief from financial anxiety', 'Emotional partnership instead of blame']
    },
    initialMessageA: "Jordan completely blew off our 5th anniversary dinner to stay late at the office! They act like their job is the only thing that matters, and when I cried about it, they just rolled their eyes and said 'I'm trying to provide for us'. It feels like I'm completely invisible.",
    initialMessageB: "Alex is acting like I deliberately tried to hurt them. My company announced a 30% workforce reduction yesterday, and my team was in crisis mode until 9 PM. If I lose this job, we lose our apartment. I don't get why they can't see the pressure I'm under!"
  },
  {
    id: 'chores_mental_load',
    title: 'Chores & The Invisible Mental Load',
    description: 'Morgan is exhausted from carrying all household planning, groceries, and cleaning. Sam feels constantly nitpicked, criticized, and that nothing they do is ever right.',
    partnerA: {
      id: 'partner_a' as PartnerId,
      name: 'Morgan',
      roleDescription: 'Burnt out by being the household manager and default chore-doer.',
      avatarSeed: 'morgan',
      readinessScore: 20,
      perceivedGrievances: ['Default housekeeper', 'Has to ask repeatedly for basic help', 'Mess left everywhere'],
      underlyingNeeds: ['True domestic partnership', 'Relief from carrying mental load alone', 'Feeling respected']
    },
    partnerB: {
      id: 'partner_b' as PartnerId,
      name: 'Sam',
      roleDescription: 'Feeling defensive, walk-on-eggshells, and that their contributions are ignored.',
      avatarSeed: 'sam',
      readinessScore: 20,
      perceivedGrievances: ['Never does anything right according to Morgan', 'Treated like an incompetent child', 'Immediate hostility when walking through the door'],
      underlyingNeeds: ['Appreciation for genuine attempts', 'Clear collaborative agreement without contempt', 'Emotional warmth']
    },
    initialMessageA: "I am sick and tired of having to ask 4 times just for the dishes to be put in the dishwasher. I work full time too, but somehow I'm also expected to be the cook, maid, and scheduler. I'm drowning.",
    initialMessageB: "I literally spent two hours fixing the gutters and doing the laundry on Saturday, and Morgan didn't even notice. All she did was snap at me because the folded towels weren't stacked how she likes. I feel like I can never win."
  },
  {
    id: 'holiday_inlaws',
    title: 'Holiday Travel & In-Law Boundaries',
    description: 'Riley wants a peaceful holiday at home after a brutal year; Taylor made promises to parents for an extensive multi-state family marathon.',
    partnerA: {
      id: 'partner_a' as PartnerId,
      name: 'Riley',
      roleDescription: 'Needs rest, decompression, and healthy boundaries with demanding extended family.',
      avatarSeed: 'riley',
      readinessScore: 25,
      perceivedGrievances: ['Decisions made without consultation', 'Exhausting family obligations', 'Needs are secondary to in-laws'],
      underlyingNeeds: ['Autonomy in holiday planning', 'Rest and nervous system safety', 'Being prioritized as nuclear family']
    },
    partnerB: {
      id: 'partner_b' as PartnerId,
      name: 'Taylor',
      roleDescription: 'Struggling with family guilt, aging parents, and tradition.',
      avatarSeed: 'taylor',
      readinessScore: 25,
      perceivedGrievances: ['Partner refuses to engage with family', 'Guilt from aging parents', 'Feelings caught in the middle'],
      underlyingNeeds: ['Family continuity and connection', 'Support from partner in front of parents', 'Harmony']
    },
    initialMessageA: "Taylor told their mother we would spend the entire Thanksgiving week at their house without even talking to me first. I've had panic attacks all month from work and just desperately need 3 quiet days to recover.",
    initialMessageB: "My parents are getting older and my dad's health is declining. This might be one of our last Thanksgivings all together. Riley acting like my family is a prison sentence makes me feel isolated and resentful."
  }
];

/**
 * Creates or resets a session
 */
function createInitialSession(scenarioId = 'anniversary_overwork'): MediationSession {
  const template = DEFAULT_SCENARIOS.find((s) => s.id === scenarioId) || DEFAULT_SCENARIOS[0];

  const now = Date.now();
  const session: MediationSession = {
    id: 'session-' + Date.now(),
    scenarioTitle: template.title,
    scenarioDescription: template.description,
    partnerA: { ...template.partnerA },
    partnerB: { ...template.partnerB },
    privateMessagesA: [
      {
        id: 'msg-init-a',
        sender: 'ai_middleman',
        recipient: 'partner_a',
        chatType: 'private_a',
        text: `Hello ${template.partnerA.name}. I'm Middleman. I am here as your neutral, confidential mediator. Messages here are strictly between you and me. I will listen to your perspective with compassion, ask clarifying questions, and help bridge the gap with ${template.partnerB.name} using contrastruction—finding the agreeable, deeply human needs beneath the frustration. When you're ready, tell me what happened from your point of view.`,
        timestamp: now - 30000
      }
    ],
    privateMessagesB: [
      {
        id: 'msg-init-b',
        sender: 'ai_middleman',
        recipient: 'partner_b',
        chatType: 'private_b',
        text: `Hello ${template.partnerB.name}. I'm Middleman. I'm talking to both you and ${template.partnerA.name} in separate, private rooms. You can speak freely and honestly to me. My role is to help you feel heard, discover what's truly at stake, and help bridge misunderstandings without shoving blame into anyone's face. How are you holding up, and what is your side of things?`,
        timestamp: now - 25000
      }
    ],
    jointMessages: [],
    jointRoomUnlocked: false,
    readiness: {
      emotionalDeescalation: 25,
      mutualEmpathy: 20,
      sharedGoalsIdentified: 15,
      score: 20,
      readyForDirectChat: false,
      summary: 'Mediation begun. Separate chats are active to understand both perspectives.'
    },
    bridgeNotes: {
      partnerACoreNeeds: [],
      partnerBCoreNeeds: [],
      commonGround: [
        'Both partners care deeply about the relationship and want to feel understood.',
        'Both partners are feeling the strain of unspoken pressures.'
      ],
      unresolvedAmbiguities: [
        'Unclear intent behind recent actions',
        'Different meanings assigned to silence and stress'
      ],
      middlemanSummary: 'Initial stage: gathering raw feelings and re-framing them through contrastruction.'
    },
    lastUpdated: now
  };

  return session;
}

let activeSession = createInitialSession('anniversary_overwork');

// API: Get current session
app.get('/api/mediation/session', (req: Request, res: Response) => {
  res.json(activeSession);
});

// API: List scenarios
app.get('/api/mediation/scenarios', (req: Request, res: Response) => {
  res.json(DEFAULT_SCENARIOS);
});

// API: Reset session with scenario
app.post('/api/mediation/reset', (req: Request, res: Response) => {
  const { scenarioId, customPartnerA, customPartnerB, customTopic } = req.body;
  if (scenarioId === 'custom' && customPartnerA && customPartnerB) {
    activeSession = {
      id: 'session-' + Date.now(),
      scenarioTitle: customTopic || 'Custom Disagreement',
      scenarioDescription: 'Mediation session between ' + customPartnerA + ' and ' + customPartnerB,
      partnerA: {
        id: 'partner_a',
        name: customPartnerA,
        roleDescription: 'Partner A in conflict',
        avatarSeed: 'partner_a',
        readinessScore: 20,
        perceivedGrievances: [],
        underlyingNeeds: []
      },
      partnerB: {
        id: 'partner_b',
        name: customPartnerB,
        roleDescription: 'Partner B in conflict',
        avatarSeed: 'partner_b',
        readinessScore: 20,
        perceivedGrievances: [],
        underlyingNeeds: []
      },
      privateMessagesA: [
        {
          id: 'msg-init-a',
          sender: 'ai_middleman',
          recipient: 'partner_a',
          chatType: 'private_a',
          text: `Hello ${customPartnerA}. I am Middleman, your private conflict mediator. Everything you say here stays between us until we find the right, constructive way to bridge it to ${customPartnerB}. What is on your mind?`,
          timestamp: Date.now()
        }
      ],
      privateMessagesB: [
        {
          id: 'msg-init-b',
          sender: 'ai_middleman',
          recipient: 'partner_b',
          chatType: 'private_b',
          text: `Hello ${customPartnerB}. I am Middleman. I am listening to both you and ${customPartnerA} in separate private rooms so you can speak without fear of being attacked. Tell me how you are feeling about the situation.`,
          timestamp: Date.now()
        }
      ],
      jointMessages: [],
      jointRoomUnlocked: false,
      readiness: {
        emotionalDeescalation: 20,
        mutualEmpathy: 15,
        sharedGoalsIdentified: 15,
        score: 18,
        readyForDirectChat: false,
        summary: 'New custom session initialized.'
      },
      bridgeNotes: {
        partnerACoreNeeds: [],
        partnerBCoreNeeds: [],
        commonGround: ['Desire for healthy communication'],
        unresolvedAmbiguities: ['Core trigger points to be explored'],
        middlemanSummary: 'Gathering initial context from both partners.'
      },
      lastUpdated: Date.now()
    };
  } else {
    activeSession = createInitialSession(scenarioId);
  }
  res.json(activeSession);
});

/**
 * Handle private message to Middleman AI
 */
app.post('/api/mediation/private-message', async (req: Request, res: Response) => {
  try {
    const { partnerId, text } = req.body;
    if (!partnerId || !text || !text.trim()) {
      res.status(400).json({ error: 'partnerId and text are required' });
      return;
    }

    const speaker = partnerId === 'partner_a' ? activeSession.partnerA : activeSession.partnerB;
    const otherPartner = partnerId === 'partner_a' ? activeSession.partnerB : activeSession.partnerA;
    const chatKey = partnerId === 'partner_a' ? 'privateMessagesA' : 'privateMessagesB';
    const otherChatKey = partnerId === 'partner_a' ? 'privateMessagesB' : 'privateMessagesA';

    // Append the partner's message to private chat
    const userMsg: Message = {
      id: 'msg-' + Date.now(),
      sender: partnerId,
      recipient: 'ai_middleman',
      chatType: partnerId === 'partner_a' ? 'private_a' : 'private_b',
      text: text.trim(),
      timestamp: Date.now()
    };
    activeSession[chatKey].push(userMsg);

    // Call Gemini to generate Middleman response with contrastruction
    let aiResponseContent = {
      middlemanReply: '',
      clarifyingQuestion: '',
      contrastruction: contrastructStatement(text, speaker.name, otherPartner.name),
      bridgedMessageForPartner: null as string | null,
      identifiedCoreNeeds: [] as string[],
      identifiedCommonGround: [] as string[]
    };

    if (aiClient) {
      try {
        const prompt = `
You are "Middleman", an expert couples mediator and thoughtful neutral negotiator.
You are in a private 1-on-1 mediation session with ${speaker.name}.
The other partner is ${otherPartner.name}.

SCENARIO CONTEXT:
${activeSession.scenarioTitle}: ${activeSession.scenarioDescription}

SPEAKER (${speaker.name}) JUST SAID:
"${text}"

RECENT PRIVATE CONVERSATION WITH ${speaker.name}:
${activeSession[chatKey].slice(-4).map((m) => `${m.sender}: ${m.text}`).join('\n')}

WHAT THE OTHER PARTNER (${otherPartner.name}) HAS SHARED SO FAR:
${activeSession[otherChatKey].filter((m) => m.sender !== 'ai_middleman').slice(-3).map((m) => `${otherPartner.name}: ${m.text}`).join('\n') || 'None yet'}

RHETORICAL CONTRASTRUCTION METHOD (from Jeff Smith-Luedke's "You're Stupid / The Neo-Machiavellian"):
- Contrastruction takes an argument or complaint and makes it agreeable WITHOUT altering the speaker's actual words, but by shifting the sense or context of the ambiguous parts.
- Words are ambiguous; behind anger, resentment, and blame lie unreasoned, seminal core human values and needs (e.g., craving partnership, feeling abandoned, longing for safety, feeling overwhelmed, wanting reassurance).
- Adopt a tone of genuine, gentle curiosity and compassion (never headstrong, judgmental, or shoving misinterpretation in their face).
- Ask a thoughtful clarifying question to explore the ambiguous, vulnerable context beneath their words.
- Formulate a bridged proposal: how Middleman can speak FOR ${speaker.name} to ${otherPartner.name} in an agreeable, compassionate way that ${otherPartner.name} can receive without becoming defensive.
- Determine if any newly identified core needs or common ground have emerged.

Respond with strict JSON matching this schema:
{
  "middlemanReply": "Compassionate, deeply empathetic response to ${speaker.name} validating their experience without taking sides or judging.",
  "clarifyingQuestion": "A curious, gentle clarifying question that unearths the deeper ambiguity or need (e.g., 'When you felt X, what did you wish they knew in that exact moment?')",
  "contrastruction": {
    "originalQuote": "The exact phrase or sentence from the speaker",
    "ambiguousPart": "The ambiguous phrasing where interpretations clashed",
    "underlyingNeed": "The unstated vulnerable core human value/need",
    "agreeableSense": "The recontextualization in an agreeable, compassionate sense consistent with their words",
    "bridgeProposal": "How Middleman would lovingly phrase this need to ${otherPartner.name}",
    "toneRecommendation": "Gentle guidance for how to hold this feeling"
  },
  "bridgedMessageForPartner": "A message Middleman can deliver into ${otherPartner.name}'s private chat to gently introduce ${speaker.name}'s side without accusation, OR null if not ready yet",
  "identifiedCoreNeeds": ["1 or 2 concise bullet points of ${speaker.name}'s core values/needs"],
  "identifiedCommonGround": ["Any shared values or hopes both partners share"]
}
`;

        const response = await withTimeout(
          aiClient.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                middlemanReply: { type: Type.STRING },
                clarifyingQuestion: { type: Type.STRING },
                contrastruction: {
                  type: Type.OBJECT,
                  properties: {
                    originalQuote: { type: Type.STRING },
                    ambiguousPart: { type: Type.STRING },
                    underlyingNeed: { type: Type.STRING },
                    agreeableSense: { type: Type.STRING },
                    bridgeProposal: { type: Type.STRING },
                    toneRecommendation: { type: Type.STRING }
                  },
                  required: ['originalQuote', 'ambiguousPart', 'underlyingNeed', 'agreeableSense']
                },
                bridgedMessageForPartner: { type: Type.STRING, nullable: true },
                identifiedCoreNeeds: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                identifiedCommonGround: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                }
              },
              required: ['middlemanReply', 'clarifyingQuestion', 'contrastruction']
            }
          }
        }), 6000);

        const parsed = JSON.parse(response.text || '{}');
        aiResponseContent = {
          ...aiResponseContent,
          ...parsed
        };
      } catch (err) {
        console.warn('Gemini call failed or timed out, using intelligent heuristic contrastruction fallback', err);
        // Fallback uses deterministic contrastructStatement
        const fallbackInsight = contrastructStatement(text, speaker.name, otherPartner.name);
        aiResponseContent = {
          middlemanReply: `I hear you loud and clear, ${speaker.name}. It makes complete sense why that would feel so frustrating and exhausting. You're carrying a lot right now, and wanting to feel valued by ${otherPartner.name} is completely understandable.`,
          clarifyingQuestion: `Could you tell me a little more about what you were hoping ${otherPartner.name} would notice or say in that moment?`,
          contrastruction: fallbackInsight,
          bridgedMessageForPartner: `${speaker.name} shared that underneath the immediate frustration, they are feeling overwhelmed and deeply want to feel like you two are a coordinated team.`,
          identifiedCoreNeeds: [fallbackInsight.underlyingNeed],
          identifiedCommonGround: ['Both value mutual consideration and want to be appreciated']
        };
      }
    } else {
      // Deterministic heuristic mode when no API key configured
      const fallbackInsight = contrastructStatement(text, speaker.name, otherPartner.name);
      aiResponseContent = {
        middlemanReply: `I hear how much weight you are carrying, ${speaker.name}. Feeling unheard in these moments makes everything heavier. Thank you for being candid with me.`,
        clarifyingQuestion: `When this happened, what was the biggest unmet need you felt in that moment?`,
        contrastruction: fallbackInsight,
        bridgedMessageForPartner: `${speaker.name} opened up about feeling depleted and wanting more reciprocal teamwork between you two.`,
        identifiedCoreNeeds: [fallbackInsight.underlyingNeed],
        identifiedCommonGround: ['Desire for peace and mutual understanding']
      };
    }

    // Combine middleman reply with clarifying question for natural reading
    const fullMiddlemanText = `${aiResponseContent.middlemanReply}\n\n${aiResponseContent.clarifyingQuestion}`;

    // Add Middleman message to this partner's chat
    const aiMsg: Message = {
      id: 'msg-' + (Date.now() + 1),
      sender: 'ai_middleman',
      recipient: partnerId,
      chatType: partnerId === 'partner_a' ? 'private_a' : 'private_b',
      text: fullMiddlemanText,
      timestamp: Date.now() + 1,
      contrastructionInsight: aiResponseContent.contrastruction,
      isClarifyingQuestion: true
    };
    activeSession[chatKey].push(aiMsg);

    // Update speaker profile's identified needs
    if (aiResponseContent.identifiedCoreNeeds && aiResponseContent.identifiedCoreNeeds.length > 0) {
      speaker.underlyingNeeds = Array.from(new Set([...speaker.underlyingNeeds, ...aiResponseContent.identifiedCoreNeeds]));
    }
    if (aiResponseContent.identifiedCommonGround && aiResponseContent.identifiedCommonGround.length > 0) {
      activeSession.bridgeNotes.commonGround = Array.from(new Set([...activeSession.bridgeNotes.commonGround, ...aiResponseContent.identifiedCommonGround]));
    }

    // Check if Middleman should deliver a bridged message into other partner's feed
    // (Playing the middleman - speaking FOR each side!)
    if (aiResponseContent.bridgedMessageForPartner && aiResponseContent.bridgedMessageForPartner.trim()) {
      const bridgeMsg: Message = {
        id: 'msg-bridge-' + (Date.now() + 2),
        sender: 'ai_middleman',
        recipient: otherPartner.id,
        chatType: otherPartner.id === 'partner_a' ? 'private_a' : 'private_b',
        text: `🕊️ **Perspective Bridge from Middleman:**\n${speaker.name} shared something meaningful with me. Looking past the immediate heat of the moment, here is what they are really experiencing:\n\n*"${aiResponseContent.bridgedMessageForPartner}"*\n\nThey aren't trying to attack you—they're longing to feel connected and supported by you. How does hearing that land for you?`,
        timestamp: Date.now() + 2,
        deliveredToPartner: true
      };
      activeSession[otherChatKey].push(bridgeMsg);
    }

    // Recalculate Readiness & check for Joint Room unlock!
    const readiness = calculateReadiness(
      activeSession.privateMessagesA,
      activeSession.privateMessagesB,
      activeSession.partnerA.underlyingNeeds,
      activeSession.partnerB.underlyingNeeds,
      activeSession.bridgeNotes.commonGround
    );
    activeSession.readiness = readiness;
    activeSession.partnerA.readinessScore = readiness.score;
    activeSession.partnerB.readinessScore = readiness.score;

    if (readiness.readyForDirectChat && !activeSession.jointRoomUnlocked) {
      activeSession.jointRoomUnlocked = true;
      activeSession.jointRoomUnlockReason = 'Both partners have clarified their core needs and de-escalated defensiveness.';

      // Announce unlock in both private rooms
      const unlockNoticeA: Message = {
        id: 'msg-unlock-a-' + Date.now(),
        sender: 'ai_middleman',
        recipient: 'partner_a',
        chatType: 'private_a',
        text: `✨ **Middleman Milestone Reached:** Both you and ${otherPartner.name} have expressed your core needs with vulnerability. I believe you are both ready to enter the **Joint Mediation Room** to talk directly. I will be right there with you as your live buffer and mediator!`,
        timestamp: Date.now() + 3
      };
      const unlockNoticeB: Message = {
        id: 'msg-unlock-b-' + Date.now(),
        sender: 'ai_middleman',
        recipient: 'partner_b',
        chatType: 'private_b',
        text: `✨ **Middleman Milestone Reached:** Both you and ${speaker.name} have clarified the core misunderstandings. The **Joint Mediation Room** is now open! You can now speak directly to each other, with me actively assisting.`,
        timestamp: Date.now() + 4
      };
      activeSession.privateMessagesA.push(unlockNoticeA);
      activeSession.privateMessagesB.push(unlockNoticeB);

      // Seed joint room initial message
      if (activeSession.jointMessages.length === 0) {
        activeSession.jointMessages.push({
          id: 'msg-joint-welcome',
          sender: 'ai_middleman',
          recipient: 'both',
          chatType: 'joint',
          text: `Welcome ${activeSession.partnerA.name} and ${activeSession.partnerB.name}. You have both put in the courageous emotional work to speak honestly and unpack your true needs. In this room, you can speak directly to one another. I will remain here with you as your active mediator. If conversation gets heated or ambiguous, I'll step in with gentle contrastruction and reflections. Take a deep breath. Who would like to start?`,
          timestamp: Date.now() + 5
        });
      }
    }

    activeSession.lastUpdated = Date.now();
    res.json(activeSession);
  } catch (error) {
    console.error('Error in private-message:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

/**
 * Handle direct message in Joint Mediation Room
 */
app.post('/api/mediation/joint-message', async (req: Request, res: Response) => {
  try {
    const { senderId, text } = req.body;
    if (!senderId || !text || !text.trim()) {
      res.status(400).json({ error: 'senderId and text are required' });
      return;
    }

    const senderProfile = senderId === 'partner_a' ? activeSession.partnerA : activeSession.partnerB;
    const receiverProfile = senderId === 'partner_a' ? activeSession.partnerB : activeSession.partnerA;

    // Direct message between partners
    const directMsg: Message = {
      id: 'msg-joint-' + Date.now(),
      sender: senderId,
      recipient: senderId === 'partner_a' ? 'partner_b' : 'partner_a',
      chatType: 'joint',
      text: text.trim(),
      timestamp: Date.now()
    };
    activeSession.jointMessages.push(directMsg);

    // Analyze with friction detection
    const friction = detectHighFriction(text);

    // Middleman generates active intervention or encouragement
    let mediatorReply = '';
    if (aiClient) {
      try {
        const prompt = `
You are "Middleman", an expert couples mediator actively facilitating a LIVE DIRECT conversation between ${senderProfile.name} and ${receiverProfile.name} in the Joint Mediation Room.

${senderProfile.name} just said to ${receiverProfile.name}:
"${text}"

RECENT CONVERSATION IN JOINT ROOM:
${activeSession.jointMessages.slice(-5).map((m) => `${m.sender}: ${m.text}`).join('\n')}

GUIDELINES FOR MIDDLEMAN IN JOINT ROOM:
- If the message has sharp edges, blame, "always/never", or defensiveness: Intervene gently. Use contrastruction: help ${receiverProfile.name} hear the underlying hurt or vulnerable need in ${senderProfile.name}'s words, and invite ${receiverProfile.name} to respond to that need rather than the spike.
- If the message is constructive, vulnerable, or apologetic: Validate the courage it took and encourage them forward.
- Keep your intervention concise (2-4 sentences max), warm, grounded, and non-preachy. Never take sides or shame anyone.
`;
        const response = await withTimeout(
          aiClient.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: prompt
          }),
          6000
        );
        mediatorReply = response.text || '';
      } catch (err) {
        console.warn('Gemini joint mediation failed, using rule-based intervention', err);
      }
    }

    if (!mediatorReply) {
      if (friction.isHighFriction) {
        const contrastruction = contrastructStatement(text, senderProfile.name, receiverProfile.name);
        mediatorReply = `Let's pause right here for a gentle breath. ${receiverProfile.name}, when you hear "${friction.matchedTrigger}", it's easy to want to defend yourself. But look at what ${senderProfile.name} is really expressing: ${contrastruction.agreeableSense} ${senderProfile.name}, does that capture the core of what you want ${receiverProfile.name} to understand?`;
      } else {
        mediatorReply = `Thank you for sharing that openly, ${senderProfile.name}. ${receiverProfile.name}, what did you hear in what ${senderProfile.name} just said?`;
      }
    }

    // Append Middleman's live moderation
    const aiIntervention: Message = {
      id: 'msg-joint-ai-' + Date.now(),
      sender: 'ai_middleman',
      recipient: 'both',
      chatType: 'joint',
      text: mediatorReply,
      timestamp: Date.now() + 10,
      isIntervention: true
    };
    activeSession.jointMessages.push(aiIntervention);

    activeSession.lastUpdated = Date.now();
    res.json(activeSession);
  } catch (error) {
    console.error('Error in joint-message:', error);
    res.status(500).json({ error: 'Failed to process joint message' });
  }
});

// Start Server & Vite Integration
async function main() {
  const isProd = process.env.NODE_ENV === 'production';

  if (isProd) {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Middleman mediation server listening on http://0.0.0.0:${PORT}`);
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
