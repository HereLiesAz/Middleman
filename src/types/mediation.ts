export type PartnerId = 'partner_a' | 'partner_b';
export type SenderType = 'partner_a' | 'partner_b' | 'ai_middleman';
export type ChatType = 'private_a' | 'private_b' | 'joint';

export interface ContrastructionInsight {
  originalQuote: string;
  ambiguousPart: string;
  underlyingNeed: string;
  agreeableSense: string;
  bridgeProposal?: string;
  toneRecommendation?: string;
}

export interface Message {
  id: string;
  sender: SenderType;
  recipient: 'partner_a' | 'partner_b' | 'both' | 'ai_middleman';
  chatType: ChatType;
  text: string;
  timestamp: number;
  contrastructionInsight?: ContrastructionInsight;
  isClarifyingQuestion?: boolean;
  isIntervention?: boolean;
  deliveredToPartner?: boolean;
}

export interface PartnerProfile {
  id: PartnerId;
  name: string;
  roleDescription: string;
  avatarSeed: string;
  readinessScore: number;
  perceivedGrievances: string[];
  underlyingNeeds: string[];
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
  partnerA: PartnerProfile;
  partnerB: PartnerProfile;
  privateMessagesA: Message[];
  privateMessagesB: Message[];
  jointMessages: Message[];
  jointRoomUnlocked: boolean;
  jointRoomUnlockReason?: string;
  readiness: ReadinessBreakdown;
  bridgeNotes: BridgeNotes;
  lastUpdated: number;
}
