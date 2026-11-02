import {
  MediationSession,
  ReadinessBreakdown,
  ContrastructionInsight,
  Message,
  UserProfile,
  HypotheticalDisagreementExample
} from '../types/mediation';

/**
 * Highly contentious phrases that often signal defensiveness or attacks in couple conflicts.
 */
const HIGH_FRICTION_PATTERNS = [
  /\bnever\b/i,
  /\balways\b/i,
  /\byou don'?t care\b/i,
  /\bselfish\b/i,
  /\bidiot\b/i,
  /\bstupid\b/i,
  /\byou ruined\b/i,
  /\bit'?s all your fault\b/i,
  /\bmanipulative\b/i,
  /\bshut up\b/i,
  /\byou always\b/i,
  /\byou never\b/i,
  /\bworthless\b/i
];

/**
 * Ze Frank Clean Fighting Rules patterns:
 * 1. Overarching generalizations (Always/Never)
 * 2. Relationship threats (Breakup/Divorce as leverage)
 * 3. Weaponized swearing / character assassinations
 */
const ZE_FRANK_GENERALIZATION_PATTERN = /\b(always|never|every single time|constantly|without fail)\b/i;
const ZE_FRANK_RELATIONSHIP_THREAT_PATTERN = /\b(break up|divorce|leaving you|leave you|walk out|done with this|done with you|shouldn't be together|call it quits)\b/i;
const ZE_FRANK_WEAPONIZED_SWEAR_PATTERN = /\b(fucking|f\*cking|bitch|bastard|asshole|dipshit|moron|piece of shit|stupid|idiot)\b/i;

export interface ZeFrankAnalysisResult {
  hasGeneralization: boolean;
  hasRelationshipThreat: boolean;
  hasWeaponizedAttack: boolean;
  cleanFightAlerts: string[];
  contentLayer: string;
  feelingsLayer: string;
  intentSandwich: {
    anchorOfCare: string;
    vulnerableTruth: string;
    reassuranceOfCommitment: string;
  };
}

/**
 * Analyzes statement against Ze Frank's "How to Fight as a Couple" principles:
 * - Decouples Content Argument from Feelings Argument
 * - Flags overarching generalizations ("always/never")
 * - Flags relationship threats as destructive leverage
 * - Constructs an "Intent Sandwich" to bridge communication safely
 */
export function analyzeZeFrankCleanFight(
  text: string,
  speakerName = 'Partner',
  listenerName = 'Partner'
): ZeFrankAnalysisResult {
  const alerts: string[] = [];
  const lower = text.toLowerCase();

  const hasGeneralization = ZE_FRANK_GENERALIZATION_PATTERN.test(text);
  if (hasGeneralization) {
    alerts.push("Ze Frank Rule #3: Avoid 'Always' and 'Never'. Generalizations turn a single situation into a total character attack.");
  }

  const hasRelationshipThreat = ZE_FRANK_RELATIONSHIP_THREAT_PATTERN.test(text);
  if (hasRelationshipThreat) {
    alerts.push("Ze Frank Rule #4: Never threaten the relationship for leverage. Threatening breakups or walking out destroys foundational safety.");
  }

  const hasWeaponizedAttack = ZE_FRANK_WEAPONIZED_SWEAR_PATTERN.test(text);
  if (hasWeaponizedAttack) {
    alerts.push("Ze Frank Rule #2: No weaponized swearing at your partner. Keep frustration directed at the problem, not personal insults.");
  }

  // Decouple Content Argument vs. Feelings Argument
  let contentLayer = "The specific logistical dilemma, event, or task at hand.";
  let feelingsLayer = "The vulnerable emotional reaction and need for security underneath.";

  if (lower.includes('chore') || lower.includes('dish') || lower.includes('clean') || lower.includes('house') || lower.includes('trash')) {
    contentLayer = "Logistical division of household chores and daily domestic responsibilities.";
    feelingsLayer = "Feelings of exhaustion, carrying an invisible mental load, and fear of being an unappreciated domestic manager rather than an equal partner.";
  } else if (lower.includes('work') || lower.includes('anniversary') || lower.includes('late') || lower.includes('office') || lower.includes('dinner')) {
    contentLayer = "Schedule conflicts, late work hours, and disrupted milestone celebrations.";
    feelingsLayer = "Heartache over feeling deprioritized and invisible, contrasted with intense terror over financial instability and safeguarding the home.";
  } else if (lower.includes('family') || lower.includes('parent') || lower.includes('in-law') || lower.includes('thanksgiving') || lower.includes('holiday')) {
    contentLayer = "Holiday travel schedules, duration of visits, and extended family commitments.";
    feelingsLayer = "Exhaustion and need for sanctuary versus anticipatory grief and family loyalty as aging parents decline.";
  } else {
    contentLayer = "The immediate disagreement and conflicting behavioral expectations.";
    feelingsLayer = "The unspoken longing to feel safe, respected, and emotionally prioritized by your partner.";
  }

  // Construct Ze Frank Intent Sandwich
  const intentSandwich = {
    anchorOfCare: `I love you, ${listenerName}, and our relationship matters deeply to me, which is why I want to talk through this...`,
    vulnerableTruth: `When this happened, the feeling layer for me was feeling overwhelmed, unheard, and worried that we were drifting apart.`,
    reassuranceOfCommitment: `I am sharing this because I want us to be a close, joyous team, not adversaries fighting over the facts.`
  };

  return {
    hasGeneralization,
    hasRelationshipThreat,
    hasWeaponizedAttack,
    cleanFightAlerts: alerts,
    contentLayer,
    feelingsLayer,
    intentSandwich
  };
}

/**
 * Detects whether a message has high emotional charge requiring Middleman intervention.
 */
export function detectHighFriction(text: string): {
  isHighFriction: boolean;
  matchedTrigger?: string;
} {
  for (const pattern of HIGH_FRICTION_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      return { isHighFriction: true, matchedTrigger: match[0] };
    }
  }
  return { isHighFriction: false };
}

/**
 * Calculates current readiness breakdown for direct communication between partners.
 */
export function calculateReadiness(
  messagesA: Message[],
  messagesB: Message[],
  needsA: string[],
  needsB: string[],
  commonGround: string[]
): ReadinessBreakdown {
  const userMsgsA = messagesA.filter((m) => m.sender === 'partner_a');
  const userMsgsB = messagesB.filter((m) => m.sender === 'partner_b');

  const countA = userMsgsA.length;
  const countB = userMsgsB.length;

  const depthFactor = Math.min(100, (countA + countB) * 12);

  const recentTexts = [
    ...userMsgsA.slice(-2).map((m) => m.text),
    ...userMsgsB.slice(-2).map((m) => m.text)
  ].join(' ');
  const frictionCheck = detectHighFriction(recentTexts);
  const frictionPenalty = frictionCheck.isHighFriction ? 15 : 0;

  const emotionalDeescalation = Math.max(10, Math.min(100, Math.round(depthFactor - frictionPenalty + 20)));
  const needsScore = Math.min(100, (needsA.length * 25) + (needsB.length * 25));
  const mutualEmpathy = Math.max(10, Math.min(100, Math.round(needsScore)));
  const sharedGoalsScore = Math.min(100, commonGround.length * 35);
  const sharedGoalsIdentified = Math.max(10, Math.min(100, Math.round(sharedGoalsScore)));

  const composite = Math.round(
    (emotionalDeescalation * 0.35) +
    (mutualEmpathy * 0.40) +
    (sharedGoalsIdentified * 0.25)
  );

  const score = Math.max(5, Math.min(100, composite));

  const readyForDirectChat =
    countA >= 2 &&
    countB >= 2 &&
    needsA.length >= 1 &&
    needsB.length >= 1 &&
    score >= 70;

  let summary = 'Partners are beginning private mediation with Middleman.';
  if (readyForDirectChat) {
    summary = 'Both partners have clarified core needs and misunderstandings. Ready for facilitated direct dialogue.';
  } else if (countA >= 1 && countB >= 1 && (needsA.length > 0 || needsB.length > 0)) {
    summary = 'Underlying needs are emerging. Middleman is continuing private inquiry to align perspectives.';
  } else if (countA > countB) {
    summary = 'Awaiting further perspective from Partner B to ensure both sides are equally heard.';
  } else if (countB > countA) {
    summary = 'Awaiting further perspective from Partner A to ensure both sides are equally heard.';
  }

  return {
    emotionalDeescalation,
    mutualEmpathy,
    sharedGoalsIdentified,
    score,
    readyForDirectChat,
    summary
  };
}

/**
 * Creates a deterministic contrastruction breakdown for a given statement.
 * Implements contrastruction by:
 * 1. Preserving exact words
 * 2. Highlighting area of contrast in subjective lenses
 * 3. Constructing common ground around the shared human value
 * 4. Finding an agreeable recontextualization
 */
export function contrastructStatement(
  statement: string,
  speakerName: string,
  listenerName: string
): ContrastructionInsight {
  const lower = statement.toLowerCase();
  const zeFrank = analyzeZeFrankCleanFight(statement, speakerName, listenerName);

  // Pattern 1: Chores / Division of Labor
  if (lower.includes('never help') || lower.includes("doesn't help") || lower.includes('chores') || lower.includes('around the house')) {
    return {
      originalQuote: statement,
      ambiguousPart: "The absolute phrase 'never helps' vs. uncoordinated effort",
      underlyingNeed: 'Partnership and feeling supported when carrying daily domestic weight',
      areaOfContrast: `${speakerName} experiences unfinished chores as an invisible, lonely burden, whereas ${listenerName} may perceive chore requests as constant criticism or micromanagement.`,
      constructedCommonGround: `Both ${speakerName} and ${listenerName} desire a home that feels like a peaceful sanctuary of teamwork, rather than a place of exhaustion and monitoring.`,
      agreeableSense: `${speakerName} is physically drained and feeling alone with burdens, longing to feel like a coordinated team with ${listenerName}.`,
      bridgeProposal: `I want to feel like we're true teammates tackling daily life together, because carrying it alone leaves me depleted.`,
      toneRecommendation: 'Speak to the desire for teamwork rather than listing faults.',
      contentVsFeelings: {
        contentLayer: "The division of daily chores and household tasks.",
        feelingsLayer: "Exhaustion, feeling alone carrying the home, and wanting to feel valued by your partner."
      },
      intentSandwich: {
        anchorOfCare: `I love you, ${listenerName}, and our life together means everything to me...`,
        vulnerableTruth: `...which is why carrying the chores alone makes me feel so physically drained and disconnected from you...`,
        reassuranceOfCommitment: `...because I want our home to be a peaceful team sanctuary where we both feel supported.`
      },
      cleanFightAlerts: zeFrank.cleanFightAlerts
    };
  }

  // Pattern 2: Ignoring / Emotional Distance
  if (lower.includes('ignore') || lower.includes("doesn't listen") || lower.includes("don't listen") || lower.includes('dismiss')) {
    return {
      originalQuote: statement,
      ambiguousPart: "Interpretation of silence or delay as lack of care vs. distraction/fatigue",
      underlyingNeed: 'Emotional presence and validation that their thoughts matter',
      areaOfContrast: `${speakerName} interprets quietness or delayed replies as emotional withdrawal, whereas ${listenerName} may withdraw to avoid conflict or recover from sensory overload.`,
      constructedCommonGround: `Both value closeness and connection, but conflict triggers different defensive reflexes: one pursues reassurance, while the other seeks temporary shelter.`,
      agreeableSense: `${speakerName} values connection so deeply that perceived distance feels like emotional abandonment.`,
      bridgeProposal: `When things are quiet or unresolved between us, I feel disconnected and worried that our closeness is slipping.`,
      toneRecommendation: 'Express the longing for closeness instead of assuming indifference.',
      contentVsFeelings: {
        contentLayer: "Communication timing, conversational pacing, and responsiveness.",
        feelingsLayer: "Panic that silence signals fading love versus needing quiet to avoid fight-or-flight."
      },
      intentSandwich: {
        anchorOfCare: `I adore you, ${listenerName}, and I cherish having you close in my life...`,
        vulnerableTruth: `...which is why when you go quiet, I feel panicked that I've lost your warmth...`,
        reassuranceOfCommitment: `...and I'm sharing this because your presence brings me comfort, and I want to find a rhythm that feels safe for both of us.`
      },
      cleanFightAlerts: zeFrank.cleanFightAlerts
    };
  }

  // Pattern 3: Work / Priorities / Anniversary
  if (lower.includes('work') || lower.includes('time') || lower.includes('forgot') || lower.includes('priority') || lower.includes('late')) {
    return {
      originalQuote: statement,
      ambiguousPart: "Equating late hours/forgetfulness with lack of love vs. external pressure",
      underlyingNeed: 'Priority, reassurance of specialness, and predictable quality time',
      areaOfContrast: `${speakerName} measures love through undivided attention and milestone presence, whereas ${listenerName} measures care through hard work, protection, and securing their shared future.`,
      constructedCommonGround: `Both partners are deeply invested in their future together; one through preserving the romantic bond, the other through safeguarding stability.`,
      agreeableSense: `${speakerName} cherishes dedicated moments with ${listenerName} and feels unanchored when schedules displace quality time.`,
      bridgeProposal: `Having undivided time together is how I feel cherished, and I miss that connection between us.`,
      toneRecommendation: 'Affirm how precious their time together is.',
      contentVsFeelings: {
        contentLayer: "Office overtime hours, schedule prioritization, and milestone dinner plans.",
        feelingsLayer: "Grief over feeling secondary to work versus acute anxiety over livelihood and family safety."
      },
      intentSandwich: {
        anchorOfCare: `You are my favorite person, ${listenerName}, and celebrating our milestone together meant the world to me...`,
        vulnerableTruth: `...which is why sitting alone felt like a heartbreak rather than just a delayed dinner...`,
        reassuranceOfCommitment: `...because I want us to build a life where our relationship feels like our safe, protected harbor.`
      },
      cleanFightAlerts: zeFrank.cleanFightAlerts
    };
  }

  // Default contrastructive parsing
  return {
    originalQuote: statement,
    ambiguousPart: 'The gap between the immediate frustration and the unspoken emotional context',
    underlyingNeed: 'Mutual respect, psychological safety, and reciprocal consideration',
    areaOfContrast: `${speakerName} perceives the current friction as a lack of consideration, whereas ${listenerName} may feel misjudged and unable to satisfy expectations.`,
    constructedCommonGround: `Both partners want to be respected and loved without having to constantly defend their character or intentions.`,
    agreeableSense: `${speakerName} wants to protect the relationship and needs clarity to feel secure and heard by ${listenerName}.`,
    bridgeProposal: `I want us to understand each other clearly so we can resolve this without hurting each other.`,
    toneRecommendation: 'Approach with curiosity and shared goodwill.',
    contentVsFeelings: {
      contentLayer: zeFrank.contentLayer,
      feelingsLayer: zeFrank.feelingsLayer
    },
    intentSandwich: zeFrank.intentSandwich,
    cleanFightAlerts: zeFrank.cleanFightAlerts
  };
}

/**
 * Rich, concrete examples of how the AI uses the contrastruction dialogue technique in couples disagreements.
 */
export const HYPOTHETICAL_CONTRASTRUCTION_EXAMPLES: HypotheticalDisagreementExample[] = [
  {
    id: 'example-anniversary-overwork',
    title: 'The Late Anniversary Dinner & Overwork Dilemma',
    context: 'Alex prepared a 5th-anniversary celebration; Jordan worked until 9:00 PM due to company layoffs announced that morning.',
    partnerAName: 'Alex',
    partnerBName: 'Jordan',
    rawStatementA: "Jordan completely blew off our anniversary! Their job will always come before me, and they don't give a damn about our marriage.",
    rawStatementB: "Alex is throwing a childish tantrum. My division is undergoing 30% layoffs and if I don't perform, we lose our mortgage.",
    validationAndMirroring: "Alex, what I'm hearing is the profound heartache and loneliness of sitting at a decorated table alone on your 5th anniversary. It makes total sense that feeling like an afterthought on a milestone hurts deeply.",
    nonAccusatoryMisinterpretation: "When someone is late or cancels on an anniversary, our brain easily fills in the blanks with: 'They chose work because they don't cherish me.' But notice that Jordan's action might be driven by panic rather than indifference.",
    contrastHighlight: "Alex expresses love and security through dedicated, sacred milestone time. Jordan expresses love and protection through working fiercely to ensure the couple does not lose their home.",
    constructedCommonGround: "Both of you are fiercely fighting for the survival of this partnership—Alex is protecting the emotional intimacy, while Jordan is protecting the financial security. You are actually fighting for the same house from two different doors.",
    clarifyingInquiry: "Alex, if Jordan was able to look you in the eyes and reassure you that you are indeed their highest priority, what would that reassurance need to look like?",
    bridgedPerspective: "Jordan, Alex isn't angry because they resent your career; Alex is hurting because they cherish your closeness so much that an empty chair felt like emotional abandonment.",
    contentVsFeelings: {
      contentLayer: "Logistics: The 7:30 PM dinner reservation and working late at the office.",
      feelingsLayer: "Feelings: Alex feels abandoned and deprioritized; Jordan is gripped with terror over job loss and home foreclosure."
    },
    intentSandwich: {
      anchorOfCare: "Jordan, you are my life partner and I love our marriage deeply...",
      vulnerableTruth: "...which is why sitting alone on our anniversary made me feel invisible and terrified that our bond was slipping...",
      reassuranceOfCommitment: "...because I want us to be a team that navigates career stress together without losing each other."
    }
  },
  {
    id: 'example-chores-mental-load',
    title: 'The Chore Standoff & Invisible Mental Load',
    context: 'Morgan manages school schedules, laundry, and meals; Sam feels nitpicked and that whatever they clean is redone or criticized.',
    partnerAName: 'Morgan',
    partnerBName: 'Sam',
    rawStatementA: "I have to ask four times just to get the trash taken out. I am sick of parenting my own spouse like an unpaid maid.",
    rawStatementB: "Nothing I do is ever good enough for Morgan. I cleaned the garage for four hours and she just glared at the sink.",
    validationAndMirroring: "Morgan, I hear how deeply depleted you are. Carrying the mental calendar and feeling like the default manager leaves you with zero bandwidth, and it makes complete sense you want relief.",
    nonAccusatoryMisinterpretation: "It's natural to interpret Sam's delays as 'They expect me to be their mother.' However, Sam may be paralyzed by feeling that any attempt will simply invite scrutiny or failure.",
    contrastHighlight: "Morgan experiences clutter and undone tasks as sensory overload and loneliness. Sam experiences sudden chore reminders as a test of competence they are doomed to fail.",
    constructedCommonGround: "Neither of you wants a parent-child dynamic in your marriage. Both of you want to be treated as competent, respected equals who feel peaceful and unburdened in your living room.",
    clarifyingInquiry: "Morgan, what is one daily task that would give you the most breathing room if Sam took complete ownership of it from start to finish?",
    bridgedPerspective: "Sam, Morgan isn't asking for perfection or trying to micromanage you; Morgan is drowning under the invisible weight of daily management and desperately wants you as an equal teammate.",
    contentVsFeelings: {
      contentLayer: "Logistics: Taking out trash, cleaning the garage, folding laundry.",
      feelingsLayer: "Feelings: Morgan feels completely alone carrying the mental load; Sam feels scrutinized, inadequate, and criticized."
    },
    intentSandwich: {
      anchorOfCare: "Sam, I cherish our life and I value everything you contribute...",
      vulnerableTruth: "...which is why having to carry all the household planning leaves me feeling exhausted, lonely, and resentful...",
      reassuranceOfCommitment: "...because I want us to be equal partners enjoying our home in peace together."
    }
  },
  {
    id: 'example-inlaws-holidays',
    title: 'The In-Laws Holiday Marathon vs. Emotional Burnout',
    context: 'Taylor promised their parents the whole family would visit out of state for Thanksgiving; Riley is recovering from clinical work burnout.',
    partnerAName: 'Riley',
    partnerBName: 'Taylor',
    rawStatementA: "Taylor made travel plans with their mother behind my back. My mental health means nothing compared to pleasing their family.",
    rawStatementB: "My father is 78 and his health is failing. This might be our last Thanksgiving together and Riley is being selfishly cold.",
    validationAndMirroring: "Riley, it is completely valid to feel blindsided and overwhelmed when major holiday travel is committed without your agreement, especially when your nervous system is already running on fumes.",
    nonAccusatoryMisinterpretation: "When Taylor makes that promise, it feels like: 'They prioritize their parents over my wellbeing.' But Taylor's reaction may stem from terrifying grief about an aging parent rather than disregard for you.",
    contrastHighlight: "Riley needs restorative quiet and self-preservation to heal from burnout. Taylor is wrestling with anticipatory grief and family loyalty as parental health declines.",
    constructedCommonGround: "Both of you value family deeply—Riley values protecting the health of your immediate partnership, while Taylor values honoring precious remaining moments with parents.",
    clarifyingInquiry: "Riley, is there a compromised format—like a shorter 36-hour visit with private hotel space—that would respect your rest while allowing Taylor to be with their father?",
    bridgedPerspective: "Taylor, Riley isn't trying to cut you off from your dad; Riley is experiencing acute exhaustion and needs a way to support your family time without having a breakdown.",
    contentVsFeelings: {
      contentLayer: "Logistics: Thanksgiving week travel dates, airline tickets, and stay arrangements.",
      feelingsLayer: "Feelings: Riley is suffering from sensory overload and burnout; Taylor is overwhelmed by anticipatory grief for an aging father."
    },
    intentSandwich: {
      anchorOfCare: "Taylor, I love you and I love your family...",
      vulnerableTruth: "...which is why feeling committed without consultation made me panic about breaking down from burnout...",
      reassuranceOfCommitment: "...because I want to support you seeing your dad in a way where we both stay healthy."
    }
  }
];

/**
 * Checks if session is eligible to unlock or enter the Joint Room.
 */
export function evaluateJointRoomReadiness(session: MediationSession): {
  isReady: boolean;
  score: number;
  message: string;
} {
  const readiness = calculateReadiness(
    session.privateMessagesA,
    session.privateMessagesB,
    session.partnerA.underlyingNeeds,
    session.partnerB.underlyingNeeds,
    session.bridgeNotes.commonGround
  );

  return {
    isReady: readiness.readyForDirectChat,
    score: readiness.score,
    message: readiness.summary
  };
}
