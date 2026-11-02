import test from 'node:test';
import assert from 'node:assert/strict';
import {
  detectHighFriction,
  calculateReadiness,
  contrastructStatement,
  evaluateJointRoomReadiness,
  analyzeZeFrankCleanFight,
  HYPOTHETICAL_CONTRASTRUCTION_EXAMPLES
} from './mediationRules';
import { Message, MediationSession } from '../types/mediation';

test('detectHighFriction identifies contentious phrases', () => {
  const result1 = detectHighFriction('You never help and you are totally selfish');
  assert.equal(result1.isHighFriction, true);
  assert.match(result1.matchedTrigger || '', /never|selfish/i);

  const result2 = detectHighFriction('I felt sad when we could not have dinner yesterday.');
  assert.equal(result2.isHighFriction, false);
});

test('contrastructStatement derives vulnerable core needs, area of contrast, and constructed common ground', () => {
  const insight = contrastructStatement(
    'He never helps around the house and ignores the chores!',
    'Alex',
    'Jordan'
  );

  assert.equal(insight.originalQuote, 'He never helps around the house and ignores the chores!');
  assert.match(insight.ambiguousPart, /never helps/i);
  assert.match(insight.underlyingNeed, /partnership/i);
  assert.match(insight.agreeableSense, /Alex is physically drained/i);
  assert.ok(insight.areaOfContrast?.length);
  assert.ok(insight.constructedCommonGround?.length);
  assert.match(insight.constructedCommonGround || '', /peaceful sanctuary|respect/i);
  assert.ok(insight.bridgeProposal?.length);
});

test('HYPOTHETICAL_CONTRASTRUCTION_EXAMPLES contains detailed couples dispute walkthroughs', () => {
  assert.ok(HYPOTHETICAL_CONTRASTRUCTION_EXAMPLES.length >= 3);
  const ex = HYPOTHETICAL_CONTRASTRUCTION_EXAMPLES[0];
  assert.equal(ex.partnerAName, 'Alex');
  assert.equal(ex.partnerBName, 'Jordan');
  assert.ok(ex.validationAndMirroring.length > 20);
  assert.ok(ex.nonAccusatoryMisinterpretation.length > 20);
  assert.ok(ex.contrastHighlight.length > 20);
  assert.ok(ex.constructedCommonGround.length > 20);
  assert.ok(ex.clarifyingInquiry.length > 10);
  assert.ok(ex.bridgedPerspective.length > 10);
});

test('calculateReadiness calculates score and handles threshold criteria', () => {
  const emptyMsgsA: Message[] = [];
  const emptyMsgsB: Message[] = [];

  const initialReadiness = calculateReadiness(emptyMsgsA, emptyMsgsB, [], [], []);
  assert.equal(initialReadiness.readyForDirectChat, false);
  assert.ok(initialReadiness.score < 50);

  const advancedMsgsA: Message[] = [
    {
      id: '1',
      sender: 'partner_a',
      recipient: 'ai_middleman',
      chatType: 'private_a',
      text: 'I am overwhelmed with managing the home.',
      timestamp: 1000
    },
    {
      id: '2',
      sender: 'partner_a',
      recipient: 'ai_middleman',
      chatType: 'private_a',
      text: 'I really just miss having quality time and feeling like a team.',
      timestamp: 2000
    }
  ];

  const advancedMsgsB: Message[] = [
    {
      id: '3',
      sender: 'partner_b',
      recipient: 'ai_middleman',
      chatType: 'private_b',
      text: 'Work has been so crushing that I shut down in the evenings.',
      timestamp: 1500
    },
    {
      id: '4',
      sender: 'partner_b',
      recipient: 'ai_middleman',
      chatType: 'private_b',
      text: 'I love Alex and want to be there, I just feel inadequate and exhausted.',
      timestamp: 2500
    }
  ];

  const highReadiness = calculateReadiness(
    advancedMsgsA,
    advancedMsgsB,
    ['Partnership in daily tasks', 'Quality connection time'],
    ['Relief from overwhelm', 'Recognition of effort without criticism'],
    ['Both deeply love each other', 'Both feel exhausted and want peace at home']
  );

  assert.equal(highReadiness.readyForDirectChat, true);
  assert.ok(highReadiness.score >= 70);
});

test('evaluateJointRoomReadiness gates direct chat correctly', () => {
  const mockSession: MediationSession = {
    id: 'test-session',
    scenarioTitle: 'Test Scenario',
    scenarioDescription: 'Testing gate',
    partnerA: {
      userId: 'usr_alex_123',
      partnerId: 'partner_a',
      name: 'Alex',
      roleDescription: 'Partner A',
      avatarSeed: 'alex',
      perspectiveSummary: 'Feels unappreciated',
      communicationTendencies: ['Direct', 'Expressive'],
      identifiedTriggers: ['Broken plans'],
      underlyingNeeds: [],
      readinessScore: 30,
      interactionHistory: []
    },
    partnerB: {
      userId: 'usr_jordan_456',
      partnerId: 'partner_b',
      name: 'Jordan',
      roleDescription: 'Partner B',
      avatarSeed: 'jordan',
      perspectiveSummary: 'Carrying financial pressure',
      communicationTendencies: ['Avoidant under stress'],
      identifiedTriggers: ['Criticism'],
      underlyingNeeds: [],
      readinessScore: 20,
      interactionHistory: []
    },
    privateMessagesA: [],
    privateMessagesB: [],
    jointMessages: [],
    jointRoomUnlocked: false,
    readiness: {
      emotionalDeescalation: 20,
      mutualEmpathy: 10,
      sharedGoalsIdentified: 10,
      score: 15,
      readyForDirectChat: false,
      summary: 'Beginning'
    },
    bridgeNotes: {
      partnerACoreNeeds: [],
      partnerBCoreNeeds: [],
      commonGround: [],
      unresolvedAmbiguities: [],
      middlemanSummary: ''
    },
    lastUpdated: Date.now()
  };

  const gate = evaluateJointRoomReadiness(mockSession);
  assert.equal(gate.isReady, false);
});

test('analyzeZeFrankCleanFight flags generalizations, threats, and decouples content vs feelings', () => {
  // Case 1: Generalization & weaponized swearing
  const result1 = analyzeZeFrankCleanFight('You always ruin every single holiday, you idiot!', 'Alex', 'Jordan');
  assert.equal(result1.hasGeneralization, true);
  assert.equal(result1.hasWeaponizedAttack, true);
  assert.ok(result1.cleanFightAlerts.some(a => a.includes('Always')));
  assert.ok(result1.cleanFightAlerts.some(a => a.includes('swearing')));

  // Case 2: Relationship threat for leverage
  const result2 = analyzeZeFrankCleanFight("If you don't do this, maybe we should just break up.", 'Sam', 'Morgan');
  assert.equal(result2.hasRelationshipThreat, true);
  assert.ok(result2.cleanFightAlerts.some(a => a.includes('threaten')));

  // Case 3: Two-layer decoupling & Intent Sandwich
  const result3 = analyzeZeFrankCleanFight('I had to do all the dishes and take out the trash again.', 'Morgan', 'Sam');
  assert.match(result3.contentLayer, /chore|task/i);
  assert.match(result3.feelingsLayer, /exhaustion|load|partner/i);
  assert.ok(result3.intentSandwich.anchorOfCare.includes('Sam'));
  assert.ok(result3.intentSandwich.vulnerableTruth.length > 10);
  assert.ok(result3.intentSandwich.reassuranceOfCommitment.length > 10);
});

test('contrastructStatement includes Ze Frank two-layer analysis and Intent Sandwich', () => {
  const insight = contrastructStatement('You never help with the chores!', 'Morgan', 'Sam');
  assert.ok(insight.contentVsFeelings);
  assert.match(insight.contentVsFeelings.contentLayer, /chore|task/i);
  assert.match(insight.contentVsFeelings.feelingsLayer, /exhaustion|carrying/i);
  assert.ok(insight.intentSandwich);
  assert.match(insight.intentSandwich.anchorOfCare, /Sam/i);
  assert.ok(insight.cleanFightAlerts && insight.cleanFightAlerts.length > 0);
});
