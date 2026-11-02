import React, { useRef, useEffect } from 'react';
import { MediationSession, PartnerId, UserProfile, Message } from '../types/mediation';
import { MessageItem } from './MessageItem';
import { IntentComposer } from './IntentComposer';
import {
  Lock,
  Unlock,
  ShieldCheck,
  Scale,
  Sparkles,
  Timer,
  HeartHandshake,
  Layers,
  ArrowRight,
  Eye,
  Activity,
  Maximize2
} from 'lucide-react';

interface DualChamberViewProps {
  session: MediationSession;
  onSendMessageA: (text: string) => Promise<void>;
  onSendMessageB: (text: string) => Promise<void>;
  isLoading: boolean;
  onOpenJointRoom: () => void;
  onOpenContrastructionLab: () => void;
  onOpenZeFrankModal: () => void;
  onTriggerTimeout: (partnerId: PartnerId) => void;
  onFocusChamber: (partnerId: PartnerId) => void;
  forceUnlockJoint: boolean;
  setForceUnlockJoint: (val: boolean) => void;
}

export const DualChamberView: React.FC<DualChamberViewProps> = ({
  session,
  onSendMessageA,
  onSendMessageB,
  isLoading,
  onOpenJointRoom,
  onOpenContrastructionLab,
  onOpenZeFrankModal,
  onTriggerTimeout,
  onFocusChamber,
  forceUnlockJoint,
  setForceUnlockJoint
}) => {
  const { partnerA, partnerB, privateMessagesA, privateMessagesB, readiness } = session;
  const messagesEndARef = useRef<HTMLDivElement>(null);
  const messagesEndBRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndARef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [privateMessagesA]);

  useEffect(() => {
    messagesEndBRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [privateMessagesB]);

  const isJointAvailable = session.jointRoomUnlocked || forceUnlockJoint;

  const promptsA = [
    `I feel like my feelings don't matter and I'm always the one who has to compromise.`,
    `Whenever I try to talk about our schedule, they get angry and shut down.`,
    `I just desperately need them to understand how lonely I feel carrying this.`,
    `I don't want to fight, I just want reassurance that we are okay.`
  ];

  const promptsB = [
    `They never acknowledge how much pressure I'm under to keep us afloat.`,
    `It feels like no matter what I do, it's never enough and I'm always criticized.`,
    `I shut down because every conversation turns into an attack on my character.`,
    `I want to be close too, but I need peace at home without constant nitpicking.`
  ];

  return (
    <div className="w-full h-full flex flex-col xl:flex-row gap-3 max-w-[1720px] mx-auto overflow-hidden">
      {/* ======================================================== */}
      {/* CHAMBER A: Partner A's Strictly Protected Acoustic Room */}
      {/* ======================================================== */}
      <div className="flex-1 flex flex-col bg-[#161514] border border-[#2b2723] rounded-xl overflow-hidden shadow-sm transition-all relative">
        {/* Acoustic Barrier Header */}
        <div className="bg-[#1b1917] border-b border-[#2b2723] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#24211d] border border-[#3b352c] flex items-center justify-center font-editorial font-bold text-sm text-[#d4975c]">
              {partnerA.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-editorial text-base text-[#f5efe6] font-medium">
                  {partnerA.name}'s Chamber
                </h3>
                <span className="text-[10px] bg-[#1a241d] text-[#9bb098] border border-[#2d3a30] px-2 py-0.5 rounded font-mono">
                  ACOUSTIC SHIELD ACTIVE
                </span>
              </div>
              <p className="text-[11px] text-[#8a8276] truncate max-w-xs">
                {partnerA.roleDescription || 'Private, confidential dialogue with Middleman.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onFocusChamber('partner_a')}
              className="p-1.5 text-[#857e72] hover:text-[#e8e4dc] hover:bg-[#25221e] rounded transition-colors"
              title="Expand to Full View"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Unfiltered Confidential Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#141312] custom-scrollbar">
          {privateMessagesA.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#756f64]">
              <p className="font-editorial text-sm italic text-[#baa996]">Alex's chamber is in silence.</p>
              <p className="text-xs text-[#6e685f] mt-1 max-w-xs">
                Express what hurt you. Jordan cannot read this. Middleman listens without judgment.
              </p>
            </div>
          ) : (
            privateMessagesA.map((msg) => (
              <MessageItem
                key={msg.id}
                message={msg}
                partnerA={partnerA}
                partnerB={partnerB}
              />
            ))
          )}
          <div ref={messagesEndARef} />
        </div>

        {/* Intent Composer for Partner A */}
        <IntentComposer
          currentPartner={partnerA}
          otherPartner={partnerB}
          onSendMessage={onSendMessageA}
          isLoading={isLoading}
          onTriggerTimeout={() => onTriggerTimeout('partner_a')}
          prompts={promptsA}
          placeholder={`Tell Middleman what happened (strictly private from ${partnerB.name})...`}
        />
      </div>

      {/* ======================================================== */}
      {/* CENTER BRIDGE: The Middleman Transducer & Consensus Deck */}
      {/* ======================================================== */}
      <div className="w-full xl:w-[360px] 2xl:w-[390px] shrink-0 flex flex-col gap-3.5 bg-[#181716] border border-[#2d2924] rounded-xl p-4 shadow-sm text-xs">
        {/* Bridge Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#2b2723]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#27231e] border border-[#3d362c] flex items-center justify-center text-[#d4975c]">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <span className="font-editorial text-sm font-semibold text-[#f5efe6] block leading-tight">
                Middleman Bridge
              </span>
              <span className="text-[10px] text-[#8a8376] font-mono">
                Consensus & Contrastruction Deck
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#9bb098] animate-pulse" />
            <span className="text-[10px] text-[#9bb098] font-mono uppercase">Transducing</span>
          </div>
        </div>

        {/* Dial: Readiness for Direct Contact */}
        <div className="bg-[#141312] border border-[#292521] p-3.5 rounded-lg space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#a8a092] font-medium flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-[#d4975c]" />
              Readiness Threshold
            </span>
            <span className="font-mono text-[#d4975c] font-bold text-sm">
              {readiness.score}% / 70%
            </span>
          </div>

          <div className="w-full h-2 bg-[#22201d] rounded-full overflow-hidden border border-[#2d2924]">
            <div
              className={`h-full transition-all duration-700 ${
                readiness.score >= 70 ? 'bg-[#9bb098]' : 'bg-[#d4975c]'
              }`}
              style={{ width: `${Math.min(100, readiness.score)}%` }}
            />
          </div>

          <p className="font-editorial italic text-xs text-[#c4baa8] leading-relaxed">
            "{readiness.summary}"
          </p>

          <div className="grid grid-cols-3 gap-1.5 pt-1 text-[10px] font-mono text-[#787165]">
            <div className="bg-[#1b1a18] p-1.5 rounded text-center border border-[#25221e]">
              <span className="block text-[#a8a092] font-semibold">{readiness.emotionalDeescalation}%</span>
              <span>De-escalation</span>
            </div>
            <div className="bg-[#1b1a18] p-1.5 rounded text-center border border-[#25221e]">
              <span className="block text-[#a8a092] font-semibold">{readiness.mutualEmpathy}%</span>
              <span>Empathy</span>
            </div>
            <div className="bg-[#1b1a18] p-1.5 rounded text-center border border-[#25221e]">
              <span className="block text-[#a8a092] font-semibold">{readiness.sharedGoalsIdentified}%</span>
              <span>Shared Need</span>
            </div>
          </div>
        </div>

        {/* Ze Frank Two-Layer Radar */}
        <div className="bg-[#151413] border border-[#2a2622] p-3 rounded-lg space-y-2">
          <div className="flex items-center justify-between text-[#d4975c]">
            <span className="font-mono uppercase text-[10px] tracking-wider flex items-center gap-1">
              <Layers className="w-3 h-3" />
              Ze Frank Two-Layer Conflict
            </span>
            <button
              onClick={onOpenZeFrankModal}
              className="text-[10px] text-[#a8a092] hover:text-[#f5efe6] underline"
            >
              Playbook
            </button>
          </div>

          <div className="space-y-1.5 text-[11px]">
            <div className="bg-[#1b1917] p-2 rounded border border-[#2b2723]">
              <span className="text-[9px] font-mono text-[#8f887d] uppercase block">
                Level 1: Stated Content
              </span>
              <p className="text-[#d8d1c5] leading-snug">
                {session.scenarioTitle}
              </p>
            </div>

            <div className="bg-[#191f1b] p-2 rounded border border-[#27332b]">
              <span className="text-[9px] font-mono text-[#9bb098] uppercase block">
                Level 2: The Vulnerable Feeling Layer
              </span>
              <p className="text-[#cce0cb] leading-snug">
                Fear of abandonment & feeling taken for granted vs. anxiety over economic security.
              </p>
            </div>
          </div>
        </div>

        {/* Joint Dialogue Status & Launch */}
        <div className="mt-auto pt-2 space-y-2">
          <button
            onClick={onOpenJointRoom}
            disabled={!isJointAvailable}
            className={`w-full py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              isJointAvailable
                ? 'bg-[#9bb098] hover:bg-[#8ca189] text-[#141312] shadow-sm cursor-pointer'
                : 'bg-[#211f1d] text-[#6d665b] border border-[#2e2a25] cursor-not-allowed'
            }`}
          >
            {isJointAvailable ? (
              <>
                <Unlock className="w-3.5 h-3.5" />
                <span>Enter Facilitated Joint Sanctuary</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5" />
                <span>Joint Room Protected ({readiness.score}% / 70%)</span>
              </>
            )}
          </button>

          <div className="flex items-center justify-between text-[11px] text-[#8a8376] px-1">
            <button
              onClick={() => setForceUnlockJoint(!forceUnlockJoint)}
              className="hover:text-[#d4975c] transition-colors"
            >
              {forceUnlockJoint ? 'Reset Safety Gate' : 'Facilitator Unlock Override'}
            </button>
            <button
              onClick={onOpenContrastructionLab}
              className="text-[#d4975c] hover:underline flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" />
              <span>Rhetoric Lab</span>
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* CHAMBER B: Partner B's Strictly Protected Acoustic Room */}
      {/* ======================================================== */}
      <div className="flex-1 flex flex-col bg-[#161514] border border-[#2b2723] rounded-xl overflow-hidden shadow-sm transition-all relative">
        {/* Acoustic Barrier Header */}
        <div className="bg-[#1b1917] border-b border-[#2b2723] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#24211d] border border-[#3b352c] flex items-center justify-center font-editorial font-bold text-sm text-[#d4975c]">
              {partnerB.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-editorial text-base text-[#f5efe6] font-medium">
                  {partnerB.name}'s Chamber
                </h3>
                <span className="text-[10px] bg-[#1a241d] text-[#9bb098] border border-[#2d3a30] px-2 py-0.5 rounded font-mono">
                  ACOUSTIC SHIELD ACTIVE
                </span>
              </div>
              <p className="text-[11px] text-[#8a8276] truncate max-w-xs">
                {partnerB.roleDescription || 'Private, confidential dialogue with Middleman.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onFocusChamber('partner_b')}
              className="p-1.5 text-[#857e72] hover:text-[#e8e4dc] hover:bg-[#25221e] rounded transition-colors"
              title="Expand to Full View"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Unfiltered Confidential Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#141312] custom-scrollbar">
          {privateMessagesB.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#756f64]">
              <p className="font-editorial text-sm italic text-[#baa996]">Jordan's chamber is in silence.</p>
              <p className="text-xs text-[#6e685f] mt-1 max-w-xs">
                Express what hurt you. Alex cannot read this. Middleman listens without judgment.
              </p>
            </div>
          ) : (
            privateMessagesB.map((msg) => (
              <MessageItem
                key={msg.id}
                message={msg}
                partnerA={partnerA}
                partnerB={partnerB}
              />
            ))
          )}
          <div ref={messagesEndBRef} />
        </div>

        {/* Intent Composer for Partner B */}
        <IntentComposer
          currentPartner={partnerB}
          otherPartner={partnerA}
          onSendMessage={onSendMessageB}
          isLoading={isLoading}
          onTriggerTimeout={() => onTriggerTimeout('partner_b')}
          prompts={promptsB}
          placeholder={`Tell Middleman what happened (strictly private from ${partnerA.name})...`}
        />
      </div>
    </div>
  );
};
