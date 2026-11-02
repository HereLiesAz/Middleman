import React from 'react';
import {
  MediationSession
} from '../types/mediation';
import {
  X,
  Scale,
  Lock,
  Unlock,
  Check,
  ArrowRight
} from 'lucide-react';

interface BridgeNotesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  session: MediationSession;
  onEnterJointRoom: () => void;
}

export const BridgeNotesDrawer: React.FC<BridgeNotesDrawerProps> = ({
  isOpen,
  onClose,
  session,
  onEnterJointRoom
}) => {
  if (!isOpen) return null;

  const { readiness, bridgeNotes, partnerA, partnerB, jointRoomUnlocked } = session;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-xs flex justify-end animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-[#181716] border-l border-[#2b2824] h-full flex flex-col shadow-2xl">
        {/* Drawer Header */}
        <div className="p-4 bg-[#1d1b19] border-b border-[#262421] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-[#282420] border border-[#3d372e] flex items-center justify-center text-[#d4975c]">
              <Scale className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="font-editorial text-base text-[#f4efe6]">
                Middleman's Perspective Dossier
              </h3>
              <p className="text-[11px] text-[#8a8377]">
                Readiness diagnostics & mapped common ground
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-[#8a8377] hover:text-[#f4efe6] hover:bg-[#282522] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs text-[#c7baa7] custom-scrollbar">
          {/* Readiness Diagnostic Card */}
          <div className="p-4 rounded-lg bg-[#141312] border border-[#282623] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[#9c958a] uppercase tracking-wider font-medium flex items-center gap-1.5">
                {jointRoomUnlocked ? (
                  <Unlock className="w-3 h-3 text-[#9bb098]" />
                ) : (
                  <Lock className="w-3 h-3 text-[#d4975c]" />
                )}
                Dialogue Readiness
              </span>
              <span className="font-mono text-sm font-semibold text-[#f4efe6]">
                {readiness.score}%
              </span>
            </div>

            {/* Quiet Hairline Bar */}
            <div className="w-full h-1.5 bg-[#252320] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#d4975c] transition-all duration-500"
                style={{ width: `${readiness.score}%` }}
              />
            </div>

            <p className="font-editorial italic text-xs text-[#bbb2a4]">
              "{readiness.summary}"
            </p>

            {/* Diagnostic Breakdown */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#23211e] text-[10px]">
              <div>
                <span className="text-[#736c62] block">De-escalation</span>
                <span className="font-mono text-[#dcd6cc] font-medium text-xs">
                  {readiness.emotionalDeescalation}%
                </span>
              </div>
              <div>
                <span className="text-[#736c62] block">Empathy</span>
                <span className="font-mono text-[#dcd6cc] font-medium text-xs">
                  {readiness.mutualEmpathy}%
                </span>
              </div>
              <div>
                <span className="text-[#736c62] block">Shared Ground</span>
                <span className="font-mono text-[#dcd6cc] font-medium text-xs">
                  {readiness.sharedGoalsIdentified}%
                </span>
              </div>
            </div>

            {jointRoomUnlocked && (
              <button
                onClick={() => {
                  onClose();
                  onEnterJointRoom();
                }}
                className="w-full py-2 bg-[#d4975c] hover:bg-[#c4874d] text-[#141312] font-semibold text-xs rounded-md flex items-center justify-center gap-2 transition-colors mt-2"
              >
                <span>Enter Facilitated Joint Dialogue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Partner A Core Vulnerabilities */}
          <div className="p-4 rounded-lg bg-[#141312] border border-[#282623] space-y-2">
            <div className="text-[11px] text-[#f4efe6] font-medium">
              {partnerA.name}'s Core Unspoken Needs:
            </div>
            {partnerA.underlyingNeeds.length === 0 ? (
              <p className="text-[#706a61] text-xs italic">
                Middleman is asking clarifying questions to identify {partnerA.name}'s core values.
              </p>
            ) : (
              <ul className="space-y-1.5 pl-1">
                {partnerA.underlyingNeeds.map((need, i) => (
                  <li key={i} className="flex items-start gap-2 text-[#c4bcaa] text-xs leading-relaxed">
                    <span className="text-[#d4975c] mt-0.5 font-bold">·</span>
                    <span>{need}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Partner B Core Vulnerabilities */}
          <div className="p-4 rounded-lg bg-[#141312] border border-[#282623] space-y-2">
            <div className="text-[11px] text-[#f4efe6] font-medium">
              {partnerB.name}'s Core Unspoken Needs:
            </div>
            {partnerB.underlyingNeeds.length === 0 ? (
              <p className="text-[#706a61] text-xs italic">
                Middleman is asking clarifying questions to identify {partnerB.name}'s core values.
              </p>
            ) : (
              <ul className="space-y-1.5 pl-1">
                {partnerB.underlyingNeeds.map((need, i) => (
                  <li key={i} className="flex items-start gap-2 text-[#c4bcaa] text-xs leading-relaxed">
                    <span className="text-[#d4975c] mt-0.5 font-bold">·</span>
                    <span>{need}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Identified Common Ground */}
          <div className="p-4 rounded-lg bg-[#141312] border border-[#282623] space-y-2">
            <div className="text-[11px] text-[#9bb098] font-medium">
              Negotiated Common Ground:
            </div>
            {bridgeNotes.commonGround.length === 0 ? (
              <p className="text-[#706a61] text-xs italic">
                As both partners contrastruct their perspectives, negotiated points will emerge here.
              </p>
            ) : (
              <ul className="space-y-2 pl-1">
                {bridgeNotes.commonGround.map((ground, i) => (
                  <li key={i} className="flex items-start gap-2 text-[#dcd6cc] text-xs leading-relaxed">
                    <Check className="w-3.5 h-3.5 text-[#9bb098] shrink-0 mt-0.5" />
                    <span>{ground}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
