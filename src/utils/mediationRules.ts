import {
  MediationSession,
  ReadinessBreakdown,
  ContrastructionInsight,
  Message
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
 * Pure deterministic calculation based on conversation progress and need identification.
 */
export function calculateReadiness(
  messagesA: Message[],
  messagesB: Message[],
  needsA: string[],
  needsB: string[],
  commonGround: string[]
): ReadinessBreakdown {
  // Count user messages from each partner (excluding Middleman messages)
  const userMsgsA = messagesA.filter((m) => m.sender === 'partner_a');
  const userMsgsB = messagesB.filter((m) => m.sender === 'partner_b');

  const countA = userMsgsA.length;
  const countB = userMsgsB.length;

  // Emotional de-escalation increases as partners engage in private dialogue with the AI
  // and explore nuances rather than just throwing a single angry remark.
  const depthFactor = Math.min(100, (countA + countB) * 12);

  // Check recent tone in both chats
  const recentTexts = [
    ...userMsgsA.slice(-2).map((m) => m.text),
    ...userMsgsB.slice(-2).map((m) => m.text)
  ].join(' ');
  const frictionCheck = detectHighFriction(recentTexts);
  const frictionPenalty = frictionCheck.isHighFriction ? 15 : 0;

  const emotionalDeescalation = Math.max(10, Math.min(100, Math.round(depthFactor - frictionPenalty + 20)));

  // Mutual empathy: relies on underlying needs discovered and articulated
  const needsScore = Math.min(100, (needsA.length * 25) + (needsB.length * 25));
  const mutualEmpathy = Math.max(10, Math.min(100, Math.round(needsScore)));

  // Shared goals identified
  const sharedGoalsScore = Math.min(100, commonGround.length * 35);
  const sharedGoalsIdentified = Math.max(10, Math.min(100, Math.round(sharedGoalsScore)));

  // Weighted composite:
  // 35% emotional de-escalation, 40% mutual empathy/needs, 25% shared goals
  const composite = Math.round(
    (emotionalDeescalation * 0.35) +
    (mutualEmpathy * 0.40) +
    (sharedGoalsIdentified * 0.25)
  );

  const score = Math.max(5, Math.min(100, composite));

  // Threshold criteria:
  // Both partners must have sent at least 2 messages, both must have at least 1 identified core need,
  // and score must reach 70+.
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
 * Follows the rhetorical method:
 * - Keeps original words intact
 * - Pinpoints the ambiguous part (where subjective interpretations clash)
 * - Identifies the vulnerable, unspoken core value/need
 * - Reinterprets in an agreeable, compassionate sense consistent with the original
 */
export function contrastructStatement(
  statement: string,
  speakerName: string,
  listenerName: string
): ContrastructionInsight {
  const lower = statement.toLowerCase();

  // Pattern 1: Never helps / doesn't care
  if (lower.includes('never help') || lower.includes("doesn't help") || lower.includes('chores') || lower.includes('around the house')) {
    return {
      originalQuote: statement,
      ambiguousPart: "The absolute phrase 'never helps' vs. uncoordinated effort",
      underlyingNeed: 'Partnership and feeling supported when carrying daily domestic weight',
      agreeableSense: `${speakerName} is physically drained and feeling alone with burdens, longing to feel like a coordinated team with ${listenerName}.`,
      bridgeProposal: `I want to feel like we're true teammates tackling daily life together, because carrying it alone leaves me depleted.`,
      toneRecommendation: 'Speak to the desire for teamwork rather than listing faults.'
    };
  }

  // Pattern 2: Ignoring / doesn't listen / dismissive
  if (lower.includes('ignore') || lower.includes("doesn't listen") || lower.includes("don't listen") || lower.includes('dismiss')) {
    return {
      originalQuote: statement,
      ambiguousPart: "Interpretation of silence or delay as lack of care vs. distraction/fatigue",
      underlyingNeed: 'Emotional presence and validation that their thoughts matter',
      agreeableSense: `${speakerName} values connection so deeply that perceived distance feels like emotional abandonment.`,
      bridgeProposal: `When things are quiet or unresolved between us, I feel disconnected and worried that our closeness is slipping.`,
      toneRecommendation: 'Express the longing for closeness instead of assuming indifference.'
    };
  }

  // Pattern 3: Work / time / priorities / anniversary
  if (lower.includes('work') || lower.includes('time') || lower.includes('forgot') || lower.includes('priority') || lower.includes('late')) {
    return {
      originalQuote: statement,
      ambiguousPart: "Equating late hours/forgetfulness with lack of love vs. external pressure",
      underlyingNeed: 'Priority, reassurance of specialness, and predictable quality time',
      agreeableSense: `${speakerName} cherishes dedicated moments with ${listenerName} and feels unanchored when schedules displace quality time.`,
      bridgeProposal: `Having undivided time together is how I feel cherished, and I miss that connection between us.`,
      toneRecommendation: 'Affirm how precious their time together is.'
    };
  }

  // Default contrastructive parsing
  return {
    originalQuote: statement,
    ambiguousPart: 'The gap between the immediate frustration and the unspoken emotional context',
    underlyingNeed: 'Mutual respect, psychological safety, and reciprocal consideration',
    agreeableSense: `${speakerName} wants to protect the relationship and needs clarity to feel secure and heard by ${listenerName}.`,
    bridgeProposal: `I want us to understand each other clearly so we can resolve this without hurting each other.`,
    toneRecommendation: 'Approach with curiosity and shared goodwill.'
  };
}

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
