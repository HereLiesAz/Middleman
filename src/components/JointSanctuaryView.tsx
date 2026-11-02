import React, { useState, useRef, useEffect } from 'react';
import { MediationSession, PartnerId, Message } from '../types/mediation';
import { MessageItem } from './MessageItem';
import { IntentComposer } from './IntentComposer';
import {
  HeartHandshake,
  ShieldCheck,
  Timer,
  Scale,
  Sparkles,
  ArrowLeft,
  Users
} from 'lucide-react';

interface JointSanctuaryViewProps {
  session: MediationSession;
  onSendMessage: (text: string, senderId: PartnerId) => Promise<void>;
  isLoading: boolean;
  onReturnToChambers: () => void;
  onTriggerTimeout: (partnerId: PartnerId) => void;
  onOpenZeFrankModal: () => void;
}

export const JointSanctuaryView: React.FC<JointSanctuaryViewProps> = ({
  session,
  onSendMessage,
  isLoading,
  onReturnToChambers,
  onTriggerTimeout,
  onOpenZeFrankModal
}) => {
  const { partnerA, partnerB, jointMessages, scenarioTitle } = session;
  const [activeSender, setActiveSender] = useState<PartnerId>('partner_a');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [jointMessages, isLoading]);

  const currentSpeaker = activeSender === 'partner_a' ? partnerA : partnerB;
  const recipient = activeSender === 'partner_a' ? partnerB : partnerA;

  const jointPrompts = activeSender === 'partner_a'
    ? [
        `I want to apologize for assuming you didn't care about our anniversary.`,
        `I know you're terrified about company layoffs, and I want to support you.`,
        `Can we agree on a ritual so we never feel completely lost to each other during crunch times?`,
        `I love you and want us to face the future together.`
      ]
    : [
        `I am so sorry I broke down on our anniversary dinner. You deserve to feel celebrated.`,
        `I panicked about our rent and security, but that's no excuse to dismiss your hurt.`,
        `Let's set a boundary where work phones stay outside the bedroom.`,
        `You are my priority, even when I'm overwhelmed.`
      ];

  return (
    <div className="w-full h-full flex flex-col bg-[#161514] border border-[#2b2723] rounded-xl overflow-hidden shadow-sm max-w-5xl mx-auto min-h-[750px]">
      {/* Sanctuary Top Bar */}
      <div className="bg-[#1b1917] border-b border-[#2b2723] px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onReturnToChambers}
            className="p-1.5 text-[#9c958a] hover:text-[#f5efe6] hover:bg-[#25221e] rounded transition-colors flex items-center gap-1 text-xs"
            title="Return to Dual Chambers"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Chambers</span>
          </button>

          <div className="w-8 h-8 rounded-lg bg-[#1f2821] border border-[#2d3a30] flex items-center justify-center text-[#9bb098]">
            <HeartHandshake className="w-4 h-4" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-editorial text-base text-[#f5efe6] font-medium">
                Facilitated Joint Sanctuary
              </h2>
              <span className="text-[10px] bg-[#1f2821] text-[#9bb098] border border-[#2d3a30] px-2 py-0.5 rounded font-mono">
                DIRECT DIALOGUE WITH MIDDLEMAN BUFFER
              </span>
            </div>
            <p className="text-xs text-[#8a8276]">
              Both {partnerA.name} and {partnerB.name} speak here. Middleman clarifies meaning in real time to prevent injury.
            </p>
          </div>
        </div>

        {/* Sender Switcher */}
        <div className="flex items-center gap-1.5 bg-[#121110] p-1 rounded-lg border border-[#2a2622]">
          <span className="text-[10px] text-[#797266] uppercase font-mono px-2">Speaking as:</span>
          <button
            type="button"
            onClick={() => setActiveSender('partner_a')}
            className={`px-3 py-1 text-xs font-semibold rounded transition-all ${
              activeSender === 'partner_a'
                ? 'bg-[#292520] text-[#f5efe6] shadow-xs'
                : 'text-[#8c8579] hover:text-[#e8e4dc]'
            }`}
          >
            {partnerA.name}
          </button>
          <button
            type="button"
            onClick={() => setActiveSender('partner_b')}
            className={`px-3 py-1 text-xs font-semibold rounded transition-all ${
              activeSender === 'partner_b'
                ? 'bg-[#292520] text-[#f5efe6] shadow-xs'
                : 'text-[#8c8579] hover:text-[#e8e4dc]'
            }`}
          >
            {partnerB.name}
          </button>
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#141312] custom-scrollbar">
        {jointMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-[#787165]">
            <div className="w-12 h-12 rounded-xl bg-[#1e2720] border border-[#2d3a30] flex items-center justify-center text-[#9bb098] mb-3">
              <Sparkles className="w-6 h-6" />
            </div>
            <p className="font-editorial text-lg text-[#f5efe6]">The Joint Sanctuary is Open</p>
            <p className="text-xs text-[#8c8579] mt-1.5 max-w-md leading-relaxed">
              Both perspectives have been validated. Speak with kindness and intention. Middleman is present to catch inflammatory statements and maintain safety.
            </p>
          </div>
        ) : (
          jointMessages.map((msg) => (
            <MessageItem
              key={msg.id}
              message={msg}
              partnerA={partnerA}
              partnerB={partnerB}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Sanctuary Intent Composer */}
      <IntentComposer
        currentPartner={currentSpeaker}
        otherPartner={recipient}
        onSendMessage={(text) => onSendMessage(text, activeSender)}
        isLoading={isLoading}
        onTriggerTimeout={() => onTriggerTimeout(activeSender)}
        prompts={jointPrompts}
        placeholder={`Message directly to ${recipient.name}...`}
        isJointRoom={true}
      />
    </div>
  );
};
