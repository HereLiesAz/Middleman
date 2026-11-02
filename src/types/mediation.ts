export type PartnerId = 'partner_a' | 'partner_b';
export type SenderType = 'partner_a' | 'partner_b' | 'ai_middleman';
export type ChatType = 'private_a' | 'private_b' | 'joint';

export interface ContentVsFeelings {
  contentLayer: string; // The factual/logistical dispute (chores, dinner, schedule)
  feelingsLayer: string; // The vulnerable emotional reaction (fear of abandonment, unappreciated, invisible)
}

export interface IntentSandwich {
  anchorOfCare: string; // "I love you and value our relationship deeply..."
  vulnerableTruth: string; // "...which is why it hurts when..."
  reassuranceOfCommitment: string; // "...because I want us to be a strong team together."
}

export interface ContrastructionInsight {
  originalQuote: string;
  ambiguousPart: string;
  underlyingNeed: string;
  agreeableSense: string;
  areaOfContrast?: string;
  constructedCommonGround?: string;
  bridgeProposal?: string;
  toneRecommendation?: string;
  contentVsFeelings?: ContentVsFeelings;
  intentSandwich?: IntentSandwich;
  cleanFightAlerts?: string[];
}

export interface Message {
  id: string;
  sender: SenderType;
  recipient: 'partner_a' | 'partner_b' | 'both' | 'ai_middleman';
  chatType: ChatType;
  text: string;
  timestamp: number;
  validationSummary?: string;
  misinterpretationSpotlight?: string;
  contrastructionInsight?: ContrastructionInsight;
  contentVsFeelings?: ContentVsFeelings;
  intentSandwich?: IntentSandwich;
  cleanFightAlerts?: string[];
  isClarifyingQuestion?: boolean;
  isIntervention?: boolean;
  deliveredToPartner?: boolean;
}

export interface UserInteractionRecord {
  timestamp: number;
  speakerText: string;
  middlemanValidation: string;
  identifiedPerspective: string;
  clarifiedNeed?: string;
}

export interface UserProfile {
  userId: string;
  partnerId: PartnerId;
  name: string;
  avatarSeed: string;
  roleDescription: string;
  relationshipLength?: string;
  perspectiveSummary: string;
  communicationTendencies: string[];
  identifiedTriggers: string[];
  underlyingNeeds: string[];
  readinessScore: number;
  interactionHistory: UserInteractionRecord[];
}

export interface ReadinessBreakdown {
  emotionalDeescalation: number; // 0 - 100
  mutualEmpathy: number;         // 0 - 100
  sharedGoalsIdentified: number; // 0 - 100
  score: number;                 // weighted composite
  readyForDirectChat: boolean;
  summary: string;
}

export interface BridgeNotes {
  partnerACoreNeeds: string[];
  partnerBCoreNeeds: string[];
  commonGround: string[];
  unresolvedAmbiguities: string[];
  middlemanSummary: string;
}

export interface MediationSession {
  id: string;
  scenarioTitle: string;
  scenarioDescription: string;
  partnerA: UserProfile;
  partnerB: UserProfile;
  privateMessagesA: Message[];
  privateMessagesB: Message[];
  jointMessages: Message[];
  jointRoomUnlocked: boolean;
  jointRoomUnlockReason?: string;
  readiness: ReadinessBreakdown;
  bridgeNotes: BridgeNotes;
  lastUpdated: number;
}

export interface HypotheticalDisagreementExample {
  id: string;
  title: string;
  context: string;
  partnerAName: string;
  partnerBName: string;
  rawStatementA: string;
  rawStatementB: string;
  validationAndMirroring: string;
  nonAccusatoryMisinterpretation: string;
  contrastHighlight: string;
  constructedCommonGround: string;
  clarifyingInquiry: string;
  bridgedPerspective: string;
  contentVsFeelings?: ContentVsFeelings;
  intentSandwich?: IntentSandwich;
}
