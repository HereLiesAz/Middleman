import test from 'node:test';
import assert from 'node:assert/strict';
import {
  detectHighFriction,
  calculateReadiness,
  contrastructStatement,
  evaluateJointRoomReadiness
} from './mediationRules';
import { Message, MediationSession } from '../types/mediation';

test('detectHighFriction identifies contentious phrases', () => {
  const result1 = detectHighFriction('You never help and you are totally selfish');
  assert.equal(result1.isHighFriction, true);
  assert.match(result1.matchedTrigger || '', /never|selfish/i);

  const result2 = detectHighFriction('I felt sad when we could not have dinner yesterday.');
  assert.equal(result2.isHighFriction, false);
});

test('contrastructStatement derives vulnerable core needs and agreeable sense', () => {
  const insight = contrastructStatement(
    'He never helps around the house and ignores the chores!',
    'Alex',
    'Jordan'
  );

  assert.equal(insight.originalQuote, 'He never helps around the house and ignores the chores!');
  assert.match(insight.ambiguousPart, /never helps/i);
  assert.match(insight.underlyingNeed, /partnership/i);
  assert.match(insight.agreeableSense, /Alex is physically drained/i);
  assert.ok(insight.bridgeProposal?.length);
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
      id: 'partner_a',
      name: 'Alex',
      roleDescription: 'Partner A',
      avatarSeed: 'alex',
      readinessScore: 30,
      perceivedGrievances: ['Chores'],
      underlyingNeeds: []
    },
    partnerB: {
      id: 'partner_b',
      name: 'Jordan',
      roleDescription: 'Partner B',
      avatarSeed: 'jordan',
      readinessScore: 20,
      perceivedGrievances: ['Criticism'],
      underlyingNeeds: []
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
