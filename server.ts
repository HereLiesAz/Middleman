import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import {
  calculateReadiness,
  contrastructStatement,
  detectHighFriction,
  HYPOTHETICAL_CONTRASTRUCTION_EXAMPLES
} from './src/utils/mediationRules.js';
import {
  MediationSession,
  Message,
  PartnerId,
  ChatType,
  UserProfile,
  UserInteractionRecord
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
 * Pre-configured realistic conflict scenarios with rich UserProfiles
 */
const DEFAULT_SCENARIOS = [
  {
    id: 'anniversary_overwork',
    title: 'The Forgotten Anniversary & Overwork',
    description: 'Alex feels heartbroken and deprioritized after Jordan worked late on their 5th anniversary. Jordan is terrified of upcoming layoffs and worked late trying to protect their family finances.',
    partnerA: {
      userId: 'usr_alex_882',
      partnerId: 'partner_a' as PartnerId,
      name: 'Alex',
      roleDescription: 'Feeling neglected, unappreciated, and emotionally abandoned on an important milestone.',
      avatarSeed: 'alex',
      relationshipLength: '5 years married',
      perspectiveSummary: 'Alex feels that emotional presence and sacred milestone rituals are the true measure of commitment. When work interferes with personal time, Alex experiences it as feeling invisible and replaceable.',
      communicationTendencies: ['Expressive and emotionally direct', 'Seeks immediate verbal reassurance', 'Vulnerable to feeling dismissed'],
      identifiedTriggers: ['Broken milestone promises', 'Dismissive body language', 'Unilateral schedule shifts'],
      underlyingNeeds: ['Reassurance of priority', 'Dedicated romantic connection', 'Feeling treasured'],
      readinessScore: 15,
      interactionHistory: []
    },
    partnerB: {
      userId: 'usr_jordan_914',
      partnerId: 'partner_b' as PartnerId,
      name: 'Jordan',
      roleDescription: 'Carrying intense anxiety over impending company layoffs and feeling misunderstood and unappreciated for working so hard.',
      avatarSeed: 'jordan',
      relationshipLength: '5 years married',
      perspectiveSummary: 'Jordan measures love and devotion through duty, financial protection, and safeguarding the couple’s future. In moments of crisis, Jordan retreats into problem-solving and work.',
      communicationTendencies: ['Task-oriented and analytical', 'Avoidant when feeling criticized', 'Needs calm space before opening up'],
      identifiedTriggers: ['Being accused of not caring', 'Sudden emotional confrontations', 'Perceived lack of appreciation for hard work'],
      underlyingNeeds: ['Grace and empathy under high pressure', 'Relief from financial anxiety', 'Emotional partnership instead of blame'],
      readinessScore: 15,
      interactionHistory: []
    },
    initialMessageA: "Jordan completely blew off our 5th anniversary dinner to stay late at the office! They act like their job is the only thing that matters, and when I cried about it, they just rolled their eyes and said 'I'm trying to provide for us'. It feels like I'm completely invisible.",
    initialMessageB: "Alex is acting like I deliberately tried to hurt them. My company announced a 30% workforce reduction yesterday, and my team was in crisis mode until 9 PM. If I lose this job, we lose our apartment. I don't get why they can't see the pressure I'm under!"
  },
  {
    id: 'chores_mental_load',
    title: 'Chores & The Invisible Mental Load',
    description: 'Morgan is exhausted from carrying all household planning, groceries, and cleaning. Sam feels constantly nitpicked, criticized, and that nothing they do is ever right.',
    partnerA: {
      userId: 'usr_morgan_341',
      partnerId: 'partner_a' as PartnerId,
      name: 'Morgan',
      roleDescription: 'Burnt out by being the household manager and default chore-doer.',
      avatarSeed: 'morgan',
      relationshipLength: '4 years living together',
      perspectiveSummary: 'Morgan perceives domestic chaos as sensory overload and a sign of isolation in daily partnership. Craves proactive teamwork where duties do not need to be assigned.',
      communicationTendencies: ['Exhaustion-driven venting', 'Desires proactive initiative', 'Frustrated by having to ask repeatedly'],
      identifiedTriggers: ['Passive delays', 'Half-finished chores', 'Being called a nag'],
      underlyingNeeds: ['True domestic partnership', 'Relief from carrying mental load alone', 'Feeling respected'],
      readinessScore: 20,
      interactionHistory: []
    },
    partnerB: {
      userId: 'usr_sam_512',
      partnerId: 'partner_b' as PartnerId,
      name: 'Sam',
      roleDescription: 'Feeling defensive, walk-on-eggshells, and that their contributions are ignored.',
      avatarSeed: 'sam',
      relationshipLength: '4 years living together',
      perspectiveSummary: 'Sam feels that whatever effort is given goes unnoticed or criticized for not matching Morgan’s exact standard. Retreats into hesitation to avoid failure.',
      communicationTendencies: ['Defensive withdrawal', 'Craves positive reinforcement', 'Sensitive to perceived disapproval'],
      identifiedTriggers: ['Immediate criticism upon entering the room', 'Micromanagement', 'Comparison to ideals'],
      underlyingNeeds: ['Appreciation for genuine attempts', 'Clear collaborative agreement without contempt', 'Emotional warmth'],
      readinessScore: 20,
      interactionHistory: []
    },
    initialMessageA: "I am sick and tired of having to ask 4 times just for the dishes to be put in the dishwasher. I work full time too, but somehow I'm also expected to be the cook, maid, and scheduler. I'm drowning.",
    initialMessageB: "I literally spent two hours fixing the gutters and doing the laundry on Saturday, and Morgan didn't even notice. All she did was snap at me because the folded towels weren't stacked how she likes. I feel like I can never win."
  },
  {
    id: 'holiday_inlaws',
    title: 'Holiday Travel & In-Law Boundaries',
    description: 'Riley wants a peaceful holiday at home after a brutal year; Taylor made promises to parents for an extensive multi-state family marathon.',
    partnerA: {
      userId: 'usr_riley_620',
      partnerId: 'partner_a' as PartnerId,
      name: 'Riley',
      roleDescription: 'Needs rest, decompression, and healthy boundaries with demanding extended family.',
      avatarSeed: 'riley',
      relationshipLength: '6 years together',
      perspectiveSummary: 'Riley experiences prolonged family visits as overwhelming and emotionally draining, needing home as a restorative sanctuary for mental health.',
      communicationTendencies: ['Clear boundary seeking', 'Values quiet decompression', 'Needs autonomy in schedule'],
      identifiedTriggers: ['Decisions made without consultation', 'Over-scheduling', 'Guilt-tripping'],
      underlyingNeeds: ['Autonomy in holiday planning', 'Rest and nervous system safety', 'Being prioritized as nuclear family'],
      readinessScore: 25,
      interactionHistory: []
    },
    partnerB: {
      userId: 'usr_taylor_739',
      partnerId: 'partner_b' as PartnerId,
      name: 'Taylor',
      roleDescription: 'Struggling with family guilt, aging parents, and tradition.',
      avatarSeed: 'taylor',
      relationshipLength: '6 years together',
      perspectiveSummary: 'Taylor is deeply conscious of parents aging and feels an urgent desire to preserve holiday rituals and family continuity while time allows.',
      communicationTendencies: ['Relational peacemaker', 'Torn between partner and family', 'Prone to taking on guilt'],
      identifiedTriggers: ['Partner dismissing family importance', 'Feeling torn in two directions', 'Fear of future regret'],
      underlyingNeeds: ['Family continuity and connection', 'Support from partner in front of parents', 'Harmony'],
      readinessScore: 25,
      interactionHistory: []
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
    partnerA: { ...template.partnerA, interactionHistory: [] },
    partnerB: { ...template.partnerB, interactionHistory: [] },
    privateMessagesA: [
      {
        id: 'msg-init-a',
        sender: 'ai_middleman',
        recipient: 'partner_a',
        chatType: 'private_a',
        text: `Hello ${template.partnerA.name}. I'm Middleman. I am here as your confidential, private mediator. Everything you share here is strictly protected—${template.partnerB.name} cannot see your private room. I will listen to your perspective with compassion, ask clarifying questions, and help bridge the gap using contrastruction without causing emotional injury. When you're ready, tell me what happened from your point of view.`,
        timestamp: now - 30000
      }
    ],
    privateMessagesB: [
      {
        id: 'msg-init-b',
        sender: 'ai_middleman',
        recipient: 'partner_b',
        chatType: 'private_b',
        text: `Hello ${template.partnerB.name}. I'm Middleman. I'm talking to both you and ${template.partnerA.name} in separate, private rooms. Your raw messages stay strictly between you and me to protect both of you from emotional injuries. My role is to help you feel heard, discover what's truly at stake, and bridge misunderstandings neutrally. How are you holding up, and what is your side of things?`,
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
      summary: 'Mediation begun. Separate chats are active to protect partners from direct emotional injuries.'
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

/**
 * Filter session to STRICTLY protect each partner's private chat.
 * A partner must NEVER see the other partner's raw private chat!
 */
function sanitizeSessionForUser(session: MediationSession, viewingUserId?: string): MediationSession {
  // Determine if viewing as partner A or partner B
  const isPartnerA = !viewingUserId || viewingUserId === session.partnerA.userId;
  const isPartnerB = viewingUserId === session.partnerB.userId;

  return {
    ...session,
    // Strictly shield private messages of the opposite partner!
    privateMessagesA: isPartnerA ? session.privateMessagesA : [],
    privateMessagesB: isPartnerB ? session.privateMessagesB : [],
    // Joint messages only visible if unlocked
    jointMessages: session.jointRoomUnlocked ? session.jointMessages : []
  };
}

// API: Get current session (privacy filtered by userId)
app.get('/api/mediation/session', (req: Request, res: Response) => {
  const userId = req.query.userId as string | undefined;
  const sanitized = sanitizeSessionForUser(activeSession, userId);
  res.json(sanitized);
});

// API: List scenarios
app.get('/api/mediation/scenarios', (req: Request, res: Response) => {
  res.json(DEFAULT_SCENARIOS);
});

// API: Get user profiles with interaction histories
app.get('/api/mediation/profiles', (req: Request, res: Response) => {
  res.json({
    partnerA: activeSession.partnerA,
    partnerB: activeSession.partnerB
  });
});

// API: Get hypothetical contrastruction examples
app.get('/api/mediation/contrastruction-examples', (req: Request, res: Response) => {
  res.json(HYPOTHETICAL_CONTRASTRUCTION_EXAMPLES);
});

// API: Analyze and contrastruct arbitrary statement in real time
app.post('/api/mediation/contrastruct-analyze', (req: Request, res: Response) => {
  const { text, speakerName, listenerName } = req.body;
  if (!text || typeof text !== 'string') {
    res.status(400).json({ error: 'Text string is required' });
    return;
  }
  const insight = contrastructStatement(
    text,
    speakerName || activeSession.partnerA.name,
    listenerName || activeSession.partnerB.name
  );
  res.json(insight);
});

// API: Update user profile
app.put('/api/mediation/profile/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;
  const { name, roleDescription, relationshipLength, perspectiveSummary } = req.body;

  const target = activeSession.partnerA.userId === userId
    ? activeSession.partnerA
    : activeSession.partnerB.userId === userId
    ? activeSession.partnerB
    : null;

  if (!target) {
    res.status(404).json({ error: 'Profile not found' });
    return;
  }

  if (name) target.name = name.trim();
  if (roleDescription) target.roleDescription = roleDescription.trim();
  if (relationshipLength) target.relationshipLength = relationshipLength.trim();
  if (perspectiveSummary) target.perspectiveSummary = perspectiveSummary.trim();

  activeSession.lastUpdated = Date.now();
  res.json(target);
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
        userId: 'usr_' + customPartnerA.toLowerCase().replace(/\s+/g, '_') + '_' + (Date.now() % 1000),
        partnerId: 'partner_a',
        name: customPartnerA,
        roleDescription: 'Partner A in conflict',
        avatarSeed: 'partner_a',
        relationshipLength: 'Couples relationship',
        perspectiveSummary: `${customPartnerA} is sharing their honest perspective on ${customTopic || 'the current disagreement'}.`,
        communicationTendencies: ['Direct expression of needs', 'Seeking clarity'],
        identifiedTriggers: ['Feeling unheard'],
        underlyingNeeds: [],
        readinessScore: 20,
        interactionHistory: []
      },
      partnerB: {
        userId: 'usr_' + customPartnerB.toLowerCase().replace(/\s+/g, '_') + '_' + ((Date.now() + 1) % 1000),
        partnerId: 'partner_b',
        name: customPartnerB,
        roleDescription: 'Partner B in conflict',
        avatarSeed: 'partner_b',
        relationshipLength: 'Couples relationship',
        perspectiveSummary: `${customPartnerB} is sharing their honest perspective on ${customTopic || 'the current disagreement'}.`,
        communicationTendencies: ['Protecting against defensiveness', 'Seeking understanding'],
        identifiedTriggers: ['Criticism and assumptions'],
        underlyingNeeds: [],
        readinessScore: 20,
        interactionHistory: []
      },
      privateMessagesA: [
        {
          id: 'msg-init-a',
          sender: 'ai_middleman',
          recipient: 'partner_a',
          chatType: 'private_a',
          text: `Hello ${customPartnerA}. I am Middleman, your private conflict mediator. Everything you say here stays between us—${customPartnerB} cannot see this room. I will listen to your perspective with compassion, ask clarifying questions, and help bridge the gap using contrastruction without causing emotional injury. What is on your mind?`,
          timestamp: Date.now()
        }
      ],
      privateMessagesB: [
        {
          id: 'msg-init-b',
          sender: 'ai_middleman',
          recipient: 'partner_b',
          chatType: 'private_b',
          text: `Hello ${customPartnerB}. I am Middleman. I am listening to both you and ${customPartnerA} in separate private rooms so you can speak without fear of being attacked or injured. Tell me how you are feeling about the situation.`,
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
  res.json(sanitizeSessionForUser(activeSession));
});

/**
 * Handle private message to Middleman AI
 */
app.post('/api/mediation/private-message', async (req: Request, res: Response) => {
  try {
    const { partnerId, text, userId } = req.body;
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

    // Baseline fallback contrastruction
    const baseInsight = contrastructStatement(text, speaker.name, otherPartner.name);

    let aiResponseContent = {
      validationSummary: `I hear how intensely frustrating and lonely this situation feels for you, ${speaker.name}. Carrying this without feeling acknowledged takes a heavy emotional toll.`,
      misinterpretationSpotlight: `When actions feel hurtful, it is completely natural for our minds to assume ${otherPartner.name} simply doesn't care. However, external pressure or fear often masquerades as indifference.`,
      contrastAndCommonGround: {
        areaOfContrast: baseInsight.areaOfContrast || `${speaker.name} and ${otherPartner.name} are viewing the issue through different emotional filters.`,
        constructedCommonGround: baseInsight.constructedCommonGround || `Both partners want to feel valued and peaceful in their home.`
      },
      middlemanReply: '',
      clarifyingQuestion: `When this happened, what was the biggest thing you needed ${otherPartner.name} to understand about what you were going through?`,
      contrastruction: baseInsight,
      contentVsFeelings: baseInsight.contentVsFeelings,
      intentSandwich: baseInsight.intentSandwich,
      cleanFightAlerts: baseInsight.cleanFightAlerts || [],
      bridgedMessageForPartner: null as string | null,
      updatedPerspectiveSummary: `${speaker.name} is seeking acknowledgement and reassurance that their needs matter in the partnership.`,
      identifiedCoreNeeds: [baseInsight.underlyingNeed],
      identifiedCommonGround: ['Both value feeling respected and connected at home']
    };

    if (aiClient) {
      try {
        const pastSpeakerInteractions = speaker.interactionHistory
          .slice(-3)
          .map((h) => `[Interaction] Said: "${h.speakerText}" -> Need: ${h.clarifiedNeed || 'unspecified'}`)
          .join('\n') || 'None recorded yet';

        const prompt = `
You are "Middleman", an exceptionally compassionate, thoughtful, and neutral couples mediator and negotiator.
You are in a private 1-on-1 mediation session with ${speaker.name}.

USER PROFILES & INTERACTION HISTORY:
- SPEAKER:
  * User ID: ${speaker.userId}
  * Name: ${speaker.name}
  * Current Perspective Summary: ${speaker.perspectiveSummary}
  * Communication Tendencies: ${speaker.communicationTendencies.join(', ')}
  * Identified Triggers: ${speaker.identifiedTriggers.join(', ')}
  * Recent Interaction History with Middleman:
${pastSpeakerInteractions}

- OTHER PARTNER:
  * User ID: ${otherPartner.userId}
  * Name: ${otherPartner.name}
  * Current Perspective Summary: ${otherPartner.perspectiveSummary}
  * Core Needs Discovered: ${otherPartner.underlyingNeeds.join(', ') || 'Still being uncovered'}

SCENARIO CONTEXT:
${activeSession.scenarioTitle}: ${activeSession.scenarioDescription}

SPEAKER (${speaker.name}) JUST SAID:
"${text}"

RECENT PRIVATE MESSAGES IN THIS SESSION:
${activeSession[chatKey].slice(-4).map((m) => `${m.sender}: ${m.text}`).join('\n')}

WHAT ${otherPartner.name} HAS SHARED PRIVATELY (Do not betray secrets; use this to build mutual understanding):
${activeSession[otherChatKey].filter((m) => m.sender !== 'ai_middleman').slice(-3).map((m) => `${otherPartner.name}: ${m.text}`).join('\n') || 'None yet'}

MANDATORY RHETORICAL CONTRASTRUCTION & ZE FRANK CLEAN FIGHT PROTOCOL:
1. ZE FRANK TWO-LAYER DECOUPLING (CONTENT VS. FEELINGS):
   - Decouple the CONTENT ARGUMENT (logistical facts, chores, dinner, who forgot what) from the FEELINGS ARGUMENT (feeling rejected, abandoned, inadequate, invisible).
   - Address and validate the Feelings Argument first before ever debating the Content Argument.
2. CLEAN FIGHT SAFEGUARDS:
   - Identify if the speaker used totalizing words ("always", "never") or relationship threats ("maybe we should break up"). Soften and reframe without accusation.
3. VALIDATION & SUMMARIZATION FIRST:
   - Before offering neutral commentary or probing questions, summarize ${speaker.name}'s message with profound empathy so they feel 100% heard, validated, and never rushed.
4. NON-ACCUSATORY MISINTERPRETATION SPOTLIGHT:
   - Identify potential misinterpretations without being accusatory or dismissive. Gently illuminate the gap between what was felt/assumed vs. alternative explanations or intentions.
5. CONTRASTRUCTION: HIGHLIGHT CONTRAST & CONSTRUCT COMMON GROUND:
   - Highlight the area of contrast: explain the differing subjective lenses of ${speaker.name} and ${otherPartner.name}.
   - Construct common ground: bridge both partners to their shared underlying human value (love, security, teamwork, respect).
   - Recontextualize ${speaker.name}'s exact words into an agreeable, vulnerable sense wholly consistent with their original statement.
6. THE INTENT SANDWICH (ZE FRANK TECHNIQUE):
   - Formulate bridged communication sandwiched in safety:
     * Anchor of Care: "I love you and value our relationship..."
     * Vulnerable Core Need: "...which is why it hurts when..."
     * Reassurance of Commitment: "...because I want us to be a close team."
7. GENTLE CLARIFYING INQUIRY:
   - Ask a thoughtful, curious clarifying question that bridges the perspective gap.

Respond with strict JSON matching this schema:
{
  "validationSummary": "Compassionate, deeply validating summary of ${speaker.name}'s feelings ensuring they feel heard first",
  "misinterpretationSpotlight": "Non-accusatory observation highlighting how actions or words could be misinterpreted vs likely underlying pressures",
  "contrastAndCommonGround": {
    "areaOfContrast": "Contrast between ${speaker.name}'s lens and ${otherPartner.name}'s lens",
    "constructedCommonGround": "The shared human value or goal uniting both partners"
  },
  "contentVsFeelings": {
    "contentLayer": "The logistical fact/chore/dispute layer",
    "feelingsLayer": "The vulnerable emotional reaction layer underneath"
  },
  "intentSandwich": {
    "anchorOfCare": "Declaration of overarching care and value of the relationship",
    "vulnerableTruth": "The vulnerable unstated pain or fear",
    "reassuranceOfCommitment": "Reassurance that the goal is partnership and closeness"
  },
  "cleanFightAlerts": ["Any gentle reflections on always/never generalizations or relationship threats"],
  "middlemanReply": "The complete, thoughtful, comforting conversational response to ${speaker.name}",
  "clarifyingQuestion": "A curious, gentle clarifying question to explore ambiguous context",
  "contrastruction": {
    "originalQuote": "The exact quote from speaker",
    "ambiguousPart": "The ambiguous phrasing where interpretations clashed",
    "underlyingNeed": "The unstated vulnerable core human value/need",
    "agreeableSense": "The recontextualization in an agreeable, compassionate sense consistent with their words",
    "bridgeProposal": "How Middleman would lovingly phrase this need to ${otherPartner.name}",
    "toneRecommendation": "Gentle guidance for how to hold this feeling"
  },
  "bridgedMessageForPartner": "An Intent Sandwich message Middleman can deliver into ${otherPartner.name}'s private chat speaking for ${speaker.name} without accusation, OR null if not ready yet",
  "updatedPerspectiveSummary": "Updated 1-2 sentence perspective summary of ${speaker.name} based on this interaction",
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
                  validationSummary: { type: Type.STRING },
                  misinterpretationSpotlight: { type: Type.STRING },
                  contrastAndCommonGround: {
                    type: Type.OBJECT,
                    properties: {
                      areaOfContrast: { type: Type.STRING },
                      constructedCommonGround: { type: Type.STRING }
                    },
                    required: ['areaOfContrast', 'constructedCommonGround']
                  },
                  contentVsFeelings: {
                    type: Type.OBJECT,
                    properties: {
                      contentLayer: { type: Type.STRING },
                      feelingsLayer: { type: Type.STRING }
                    },
                    required: ['contentLayer', 'feelingsLayer']
                  },
                  intentSandwich: {
                    type: Type.OBJECT,
                    properties: {
                      anchorOfCare: { type: Type.STRING },
                      vulnerableTruth: { type: Type.STRING },
                      reassuranceOfCommitment: { type: Type.STRING }
                    },
                    required: ['anchorOfCare', 'vulnerableTruth', 'reassuranceOfCommitment']
                  },
                  cleanFightAlerts: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
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
                  updatedPerspectiveSummary: { type: Type.STRING },
                  identifiedCoreNeeds: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  identifiedCommonGround: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  }
                },
                required: [
                  'validationSummary',
                  'misinterpretationSpotlight',
                  'contrastAndCommonGround',
                  'middlemanReply',
                  'clarifyingQuestion',
                  'contrastruction'
                ]
              }
            }
          }),
          6000
        );

        const parsed = JSON.parse(response.text || '{}');
        aiResponseContent = {
          ...aiResponseContent,
          ...parsed,
          contentVsFeelings: parsed.contentVsFeelings || baseInsight.contentVsFeelings,
          intentSandwich: parsed.intentSandwich || baseInsight.intentSandwich,
          cleanFightAlerts: parsed.cleanFightAlerts || baseInsight.cleanFightAlerts || [],
          contrastruction: {
            ...baseInsight,
            ...(parsed.contrastruction || {}),
            areaOfContrast: parsed.contrastAndCommonGround?.areaOfContrast || baseInsight.areaOfContrast,
            constructedCommonGround: parsed.contrastAndCommonGround?.constructedCommonGround || baseInsight.constructedCommonGround,
            contentVsFeelings: parsed.contentVsFeelings || baseInsight.contentVsFeelings,
            intentSandwich: parsed.intentSandwich || baseInsight.intentSandwich,
            cleanFightAlerts: parsed.cleanFightAlerts || baseInsight.cleanFightAlerts
          }
        };
      } catch (err) {
        console.warn('Gemini call failed or timed out, using intelligent heuristic contrastruction fallback', err);
        aiResponseContent.middlemanReply = `${aiResponseContent.validationSummary}\n\n${aiResponseContent.misinterpretationSpotlight}`;
      }
    }

    // Save interaction record to speaker's UserProfile history
    speaker.interactionHistory.push({
      timestamp: Date.now(),
      speakerText: text.trim(),
      middlemanValidation: aiResponseContent.validationSummary,
      identifiedPerspective: aiResponseContent.contrastruction.agreeableSense,
      clarifiedNeed: aiResponseContent.contrastruction.underlyingNeed
    });

    if (aiResponseContent.updatedPerspectiveSummary) {
      speaker.perspectiveSummary = aiResponseContent.updatedPerspectiveSummary;
    }

    // Compose Middleman's full message
    const fullMiddlemanText = aiResponseContent.middlemanReply.includes(aiResponseContent.clarifyingQuestion)
      ? aiResponseContent.middlemanReply
      : `${aiResponseContent.middlemanReply}\n\n${aiResponseContent.clarifyingQuestion}`;

    // Add Middleman message to this partner's chat
    const aiMsg: Message = {
      id: 'msg-' + (Date.now() + 1),
      sender: 'ai_middleman',
      recipient: partnerId,
      chatType: partnerId === 'partner_a' ? 'private_a' : 'private_b',
      text: fullMiddlemanText,
      timestamp: Date.now() + 1,
      validationSummary: aiResponseContent.validationSummary,
      misinterpretationSpotlight: aiResponseContent.misinterpretationSpotlight,
      contrastructionInsight: aiResponseContent.contrastruction,
      contentVsFeelings: aiResponseContent.contentVsFeelings,
      intentSandwich: aiResponseContent.intentSandwich,
      cleanFightAlerts: aiResponseContent.cleanFightAlerts,
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
    // (Playing the middleman - speaking FOR each side without inflammatory words!)
    if (aiResponseContent.bridgedMessageForPartner && aiResponseContent.bridgedMessageForPartner.trim()) {
      const bridgeMsg: Message = {
        id: 'msg-bridge-' + (Date.now() + 2),
        sender: 'ai_middleman',
        recipient: otherPartner.partnerId,
        chatType: otherPartner.partnerId === 'partner_a' ? 'private_a' : 'private_b',
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
    // Return sanitized session for viewing partner
    const currentViewerId = userId || speaker.userId;
    res.json(sanitizeSessionForUser(activeSession, currentViewerId));
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

/**
 * Handle Ze Frank Structured Timeout request
 */
app.post('/api/mediation/timeout', (req: Request, res: Response) => {
  const { partnerId, userId, chatType } = req.body;
  const speaker = partnerId === 'partner_a' ? activeSession.partnerA : activeSession.partnerB;
  const otherPartner = partnerId === 'partner_a' ? activeSession.partnerB : activeSession.partnerA;

  const timeoutMessageText = `⏸️ **Ze Frank Clean Fight Timeout Called:**\n${speaker.name} has called for a brief timeout. This is one of the highest-leverage skills in conflict resolution: recognizing when emotional flooding prevents true listening.\n\nTake 60 seconds to breathe slowly (4 seconds in, 4 seconds hold, 4 seconds out). When your heart rate settles, you can return to the conversation not as adversaries fighting over the facts, but as teammates solving an emotional disconnect together.`;

  if (chatType === 'joint') {
    const jointTimeoutMsg: Message = {
      id: 'msg-timeout-' + Date.now(),
      sender: 'ai_middleman',
      recipient: 'both',
      chatType: 'joint',
      text: timeoutMessageText,
      timestamp: Date.now(),
      isIntervention: true
    };
    activeSession.jointMessages.push(jointTimeoutMsg);
  } else {
    const privateKey = partnerId === 'partner_a' ? 'privateMessagesA' : 'privateMessagesB';
    const privateTimeoutMsg: Message = {
      id: 'msg-timeout-' + Date.now(),
      sender: 'ai_middleman',
      recipient: partnerId,
      chatType: partnerId === 'partner_a' ? 'private_a' : 'private_b',
      text: timeoutMessageText,
      timestamp: Date.now(),
      isIntervention: true
    };
    activeSession[privateKey].push(privateTimeoutMsg);
  }

  activeSession.lastUpdated = Date.now();
  const currentViewerId = userId || speaker.userId;
  res.json(sanitizeSessionForUser(activeSession, currentViewerId));
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
