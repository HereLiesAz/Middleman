import React, { useState } from 'react';
import {
  Message,
  UserProfile
} from '../types/mediation';
import {
  Scale,
  ChevronDown,
  ChevronUp,
  Heart,
  Eye,
  ShieldCheck,
  Compass
} from 'lucide-react';

interface MessageItemProps {
  message: Message;
  partnerA: UserProfile;
  partnerB: UserProfile;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  partnerA,
  partnerB
}) => {
  const [showMethodInspection, setShowMethodInspection] = useState(false);

  const isFromAI = message.sender === 'ai_middleman';
  const isFromPartnerA = message.sender === 'partner_a';
  const isFromPartnerB = message.sender === 'partner_b';

  const senderName = isFromAI
    ? 'Middleman'
    : isFromPartnerA
    ? partnerA.name
    : partnerB.name;

  const timeString = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

  // For User Messages: Restrained, human, warm note
  if (!isFromAI) {
    const isA = isFromPartnerA;
    return (
      <div
        className={`flex flex-col gap-1.5 p-4 rounded-xl border transition-all ${
          isA
            ? 'bg-[#1b1e1c] border-[#29332c] text-[#e3ece4] ml-0 mr-auto max-w-2xl'
            : 'bg-[#201d1a] border-[#383129] text-[#eee7df] ml-auto mr-0 max-w-2xl'
        }`}
      >
        <div className="flex items-center justify-between text-xs pb-1 border-b border-white/5">
          <div className="flex items-center gap-2">
            <span className="font-semibold tracking-wide text-xs">
              {senderName}
            </span>
            <span className="text-[11px] text-[#7d776e]">
              to Middleman
            </span>
          </div>
          <span className="text-[11px] text-[#7d776e] font-mono">{timeString}</span>
        </div>

        <div className="text-sm font-ui leading-relaxed text-[#ded8cf] whitespace-pre-wrap pt-1">
          {message.text}
        </div>

        {message.deliveredToPartner && (
          <div className="pt-2 text-[11px] text-[#8ea38a] flex items-center gap-1.5 border-t border-white/5 mt-1">
            <Compass className="w-3 h-3 text-[#9bb098]" />
            <span>Bridged to joint room by Middleman</span>
          </div>
        )}
      </div>
    );
  }

  // For Middleman AI: Dignified, calming, cohesive editorial counsel
  const twoLayer = message.contentVsFeelings || message.contrastructionInsight?.contentVsFeelings;

  return (
    <div
      className={`flex flex-col gap-3 p-5 rounded-xl border transition-all bg-[#191816] border-[#2d2a26] max-w-3xl mx-auto w-full shadow-xs ${
        message.isIntervention ? 'ring-1 ring-[#d4975c]/30' : ''
      }`}
    >
      {/* Header: Quiet Dignity */}
      <div className="flex items-center justify-between text-xs pb-2 border-b border-[#262421]">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-[#25221e] border border-[#3d372e] flex items-center justify-center text-[#d4975c]">
            <Scale className="w-3.5 h-3.5" />
          </div>
          <span className="font-editorial text-sm font-medium text-[#f4efe6]">
            Middleman
          </span>
          <span className="text-[#878074] text-xs">
            · Confidential Reflection
          </span>
          {message.isIntervention && (
            <span className="text-[11px] text-[#d4975c] font-medium">
              · Mediation Buffer
            </span>
          )}
        </div>
        <span className="text-[11px] text-[#6d675c] font-mono">{timeString}</span>
      </div>

      {/* Empathetic Validation: Warm lead-in if not already opening the message body */}
      {message.validationSummary && !message.text.includes(message.validationSummary) && (
        <div className="border-l-2 border-[#8ea38a] pl-3.5 py-0.5">
          <p className="font-editorial italic text-sm text-[#c7d5c4] leading-relaxed">
            "{message.validationSummary}"
          </p>
        </div>
      )}

      {/* Misinterpretation Reframe: Non-accusatory perspective lens */}
      {message.misinterpretationSpotlight && (
        <div className="bg-[#1e1c19] border border-[#332f29] rounded-lg p-3 text-xs text-[#d1c8ba]">
          <div className="text-[11px] text-[#d4975c] font-medium uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Eye className="w-3 h-3" />
            <span>Perspective Reframe</span>
          </div>
          <p className="leading-relaxed text-[#c4bcaa]">
            {message.misinterpretationSpotlight}
          </p>
        </div>
      )}

      {/* Ze Frank Clean Fight Notice (if triggered) */}
      {message.cleanFightAlerts && message.cleanFightAlerts.length > 0 && (
        <div className="bg-[#211b18] border border-[#3d2c25] rounded-lg p-3 text-xs text-[#deb4a4]">
          <div className="text-[11px] text-[#e08968] font-medium uppercase tracking-wider mb-1">
            Clean Fight Reflection
          </div>
          <ul className="space-y-1 text-[#d8b0a1] leading-relaxed">
            {message.cleanFightAlerts.map((alert, i) => (
              <li key={i}>· {alert}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Ze Frank Two-Layer Decoupling: Content vs Feelings */}
      {twoLayer && (
        <div className="bg-[#151413] border border-[#2b2824] rounded-lg p-3.5 space-y-2.5">
          <div className="text-[11px] text-[#9c958a] uppercase tracking-wider font-medium">
            Ze Frank Decoupling: Content vs. Feelings
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="border-l border-[#3a3732] pl-3 py-0.5">
              <span className="text-[10px] text-[#7a746a] uppercase tracking-wide block mb-0.5">
                Logistics & Content:
              </span>
              <p className="text-[#bbb3a6] leading-relaxed font-ui">
                {twoLayer.contentLayer}
              </p>
            </div>
            <div className="border-l border-[#d4975c]/70 pl-3 py-0.5">
              <span className="text-[10px] text-[#d4975c] uppercase tracking-wide block mb-0.5">
                Underlying Vulnerability:
              </span>
              <p className="text-[#f0e9df] leading-relaxed font-editorial italic text-xs">
                {twoLayer.feelingsLayer}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Primary Message Text from Middleman */}
      <div className="font-ui text-sm text-[#ded8cf] leading-relaxed whitespace-pre-wrap">
        {message.text}
      </div>

      {/* Contrastruction Insight (Methodology Inspection) */}
      {message.contrastructionInsight && (
        <div className="border-t border-[#262421] pt-2">
          <button
            onClick={() => setShowMethodInspection(!showMethodInspection)}
            className="flex items-center gap-1.5 text-[11px] text-[#9c958a] hover:text-[#d4975c] transition-colors py-1"
          >
            <span>Rhetorical Contrastruction Inspection</span>
            {showMethodInspection ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>

          {showMethodInspection && (
            <div className="mt-2.5 p-3.5 bg-[#141312] border border-[#282623] rounded-lg text-xs space-y-2.5 text-[#b8b0a2]">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[#706a61] block">
                  Original Words:
                </span>
                <p className="italic text-[#ded8cf] font-editorial mt-0.5">
                  "{message.contrastructionInsight.originalQuote}"
                </p>
              </div>

              <div>
                <span className="text-[10px] uppercase tracking-wider text-[#d4975c] block">
                  Semantic Gap (Ambiguous Locus):
                </span>
                <p className="text-[#c4bcaa] mt-0.5">
                  {message.contrastructionInsight.ambiguousPart}
                </p>
              </div>

              {message.contrastructionInsight.areaOfContrast && (
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-[#c96f53] block">
                    Area of Contrast:
                  </span>
                  <p className="text-[#d8b0a1] mt-0.5">
                    {message.contrastructionInsight.areaOfContrast}
                  </p>
                </div>
              )}

              {message.contrastructionInsight.constructedCommonGround && (
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-[#8ea38a] block">
                    Constructed Common Ground:
                  </span>
                  <p className="text-[#cde0cb] font-editorial italic mt-0.5">
                    {message.contrastructionInsight.constructedCommonGround}
                  </p>
                </div>
              )}

              <div>
                <span className="text-[10px] uppercase tracking-wider text-[#706a61] block">
                  Core Human Need:
                </span>
                <p className="text-[#e8e4dc] mt-0.5 font-medium">
                  {message.contrastructionInsight.underlyingNeed}
                </p>
              </div>

              {message.contrastructionInsight.bridgeProposal && (
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-[#d4975c] block">
                    Bridge to Partner:
                  </span>
                  <p className="text-[#d4975c] font-editorial italic mt-0.5">
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
