import React, { useState } from 'react';
import {
  Message,
  PartnerProfile,
  ContrastructionInsight
} from '../types/mediation';
import {
  Scale,
  Sparkles,
  HelpCircle,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Send,
  HeartHandshake
} from 'lucide-react';

interface MessageItemProps {
  message: Message;
  partnerA: PartnerProfile;
  partnerB: PartnerProfile;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  partnerA,
  partnerB
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const isFromAI = message.sender === 'ai_middleman';
  const isFromPartnerA = message.sender === 'partner_a';
  const isFromPartnerB = message.sender === 'partner_b';

  const senderName = isFromAI
    ? 'Middleman AI'
    : isFromPartnerA
    ? partnerA.name
    : partnerB.name;

  const senderBg = isFromAI
    ? 'bg-stone-800 text-stone-100 border-stone-700'
    : isFromPartnerA
    ? 'bg-emerald-950/40 text-emerald-100 border-emerald-800/50'
    : 'bg-amber-950/40 text-amber-100 border-amber-800/50';

  const avatarColor = isFromAI
    ? 'bg-gradient-to-tr from-teal-500 to-emerald-600 text-white'
    : isFromPartnerA
    ? 'bg-emerald-600 text-white'
    : 'bg-amber-600 text-white';

  const timeString = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div
      className={`flex flex-col gap-1.5 p-3 rounded-2xl border transition-all ${senderBg} ${
        message.isIntervention ? 'ring-1 ring-amber-500/50 bg-stone-900/90' : ''
      }`}
    >
      {/* Header bar: Avatar, Name, Role badge, and Time */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${avatarColor}`}
          >
            {isFromAI ? <Scale className="w-3.5 h-3.5" /> : senderName.charAt(0)}
          </div>
          <span className="font-semibold text-stone-200">{senderName}</span>

          {isFromAI && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-teal-950 text-teal-300 border border-teal-800/60 flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" /> Neutral Middleman
            </span>
          )}

          {message.deliveredToPartner && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800/60 flex items-center gap-1">
              <HeartHandshake className="w-2.5 h-2.5" /> Perspective Bridge
            </span>
          )}

          {message.isIntervention && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800/60 flex items-center gap-1">
              <ShieldAlert className="w-2.5 h-2.5" /> Mediation Buffer
            </span>
          )}
        </div>
        <span className="text-stone-400 text-[11px]">{timeString}</span>
      </div>

      {/* Message Body Content */}
      <div className="text-sm text-stone-200 whitespace-pre-wrap leading-relaxed pl-8">
        {message.text}
      </div>

      {/* Contrastruction Insight Card (if present on Middleman's response) */}
      {message.contrastructionInsight && (
        <div className="mt-2 ml-8 rounded-xl bg-stone-900/90 border border-stone-700/80 p-3 shadow-inner">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full flex items-center justify-between text-xs font-medium text-amber-300 hover:text-amber-200 transition-colors"
          >
            <div className="flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              <span>Rhetorical Contrastruction Breakdown</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-stone-400">
              <span>{showDetails ? 'Hide analysis' : 'Inspect method'}</span>
              {showDetails ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </div>
          </button>

          {showDetails && (
            <div className="mt-3 space-y-2 text-xs border-t border-stone-800 pt-2.5 text-stone-300">
              <div>
                <span className="text-stone-400 font-semibold uppercase tracking-wider text-[10px] block">
                  1. Raw Words Under Analysis:
                </span>
                <p className="italic text-stone-200 bg-stone-950/60 p-1.5 rounded border border-stone-800 mt-0.5">
                  "{message.contrastructionInsight.originalQuote}"
                </p>
              </div>

              <div>
                <span className="text-amber-400 font-semibold uppercase tracking-wider text-[10px] block">
                  2. Ambiguous Locus (The Semantic Gap):
                </span>
                <p className="text-stone-300 mt-0.5">
                  {message.contrastructionInsight.ambiguousPart}
                </p>
              </div>

              <div>
                <span className="text-emerald-400 font-semibold uppercase tracking-wider text-[10px] block">
                  3. Unspoken Core Human Need:
                </span>
                <p className="text-stone-200 mt-0.5">
                  {message.contrastructionInsight.underlyingNeed}
                </p>
              </div>

              <div>
                <span className="text-teal-400 font-semibold uppercase tracking-wider text-[10px] block">
                  4. Agreeable Recontextualization (Contrastruction):
                </span>
                <p className="text-teal-100 bg-teal-950/40 p-2 rounded border border-teal-900/60 mt-0.5 leading-relaxed">
                  {message.contrastructionInsight.agreeableSense}
                </p>
              </div>

              {message.contrastructionInsight.bridgeProposal && (
                <div>
                  <span className="text-blue-400 font-semibold uppercase tracking-wider text-[10px] block">
                    5. Middleman's Bridge Proposal:
                  </span>
                  <p className="text-blue-100 bg-blue-950/30 p-2 rounded border border-blue-900/50 mt-0.5 italic">
                    "{message.contrastructionInsight.bridgeProposal}"
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
