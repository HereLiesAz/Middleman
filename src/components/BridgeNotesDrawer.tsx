import React from 'react';
import {
  MediationSession,
  PartnerProfile
} from '../types/mediation';
import {
  X,
  Scale,
  Sparkles,
  Lock,
  Unlock,
  CheckCircle,
  AlertCircle,
  Heart,
  Target,
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
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end animate-fadeIn">
      <div className="w-full max-w-md bg-stone-900 border-l border-stone-800 h-full flex flex-col shadow-2xl">
        {/* Drawer Header */}
        <div className="p-4 bg-stone-950/80 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-stone-100">
                Middleman's Bridge Dossier
              </h3>
              <p className="text-[11px] text-stone-400">
                Readiness tracking & negotiated ground
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 text-stone-300 text-xs custom-scrollbar">
          {/* Readiness Section */}
          <div className="p-4 rounded-xl bg-stone-950/70 border border-stone-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-stone-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                {jointRoomUnlocked ? (
                  <Unlock className="w-3.5 h-3.5 text-teal-400" />
                ) : (
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                )}
                Direct Dialogue Readiness
              </span>
              <span className="font-mono text-sm font-bold text-teal-300">
                {readiness.score}%
              </span>
            </div>

            {/* Overall Bar */}
            <div className="w-full h-2.5 bg-stone-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  readiness.score >= 70
                    ? 'bg-gradient-to-r from-teal-500 to-emerald-400'
                    : 'bg-gradient-to-r from-amber-500 to-teal-500'
                }`}
                style={{ width: `${readiness.score}%` }}
              />
            </div>

            <p className="text-[11px] text-stone-400 italic">
              {readiness.summary}
            </p>

            {/* Sub Indices */}
            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-stone-800/80 text-[10px]">
              <div>
                <span className="text-stone-500 block">De-escalation</span>
                <span className="font-mono text-stone-200 font-semibold">
                  {readiness.emotionalDeescalation}%
                </span>
              </div>
              <div>
                <span className="text-stone-500 block">Mutual Empathy</span>
                <span className="font-mono text-stone-200 font-semibold">
                  {readiness.mutualEmpathy}%
                </span>
              </div>
              <div>
                <span className="text-stone-500 block">Shared Goals</span>
                <span className="font-mono text-stone-200 font-semibold">
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
                className="w-full py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-medium text-xs rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-md mt-2"
              >
                <span>Enter Joint Mediation Room</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Partner A Core Needs */}
          <div className="p-3.5 rounded-xl bg-stone-950/60 border border-emerald-900/40 space-y-2">
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-xs">
              <Heart className="w-3.5 h-3.5" />
              <span>{partnerA.name}'s Core Unspoken Needs:</span>
            </div>
            {partnerA.underlyingNeeds.length === 0 ? (
              <p className="text-stone-500 text-[11px] italic">
                Middleman is currently asking clarifying questions to identify {partnerA.name}'s core values.
              </p>
            ) : (
              <ul className="space-y-1 pl-1">
                {partnerA.underlyingNeeds.map((need, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-stone-300 text-[11px]">
                    <span className="text-emerald-500 mt-0.5">•</span>
                    <span>{need}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Partner B Core Needs */}
          <div className="p-3.5 rounded-xl bg-stone-950/60 border border-amber-900/40 space-y-2">
            <div className="flex items-center gap-1.5 text-amber-400 font-semibold text-xs">
              <Heart className="w-3.5 h-3.5" />
              <span>{partnerB.name}'s Core Unspoken Needs:</span>
            </div>
            {partnerB.underlyingNeeds.length === 0 ? (
              <p className="text-stone-500 text-[11px] italic">
                Middleman is currently asking clarifying questions to identify {partnerB.name}'s core values.
              </p>
            ) : (
              <ul className="space-y-1 pl-1">
                {partnerB.underlyingNeeds.map((need, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-stone-300 text-[11px]">
                    <span className="text-amber-500 mt-0.5">•</span>
                    <span>{need}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Identified Common Ground */}
          <div className="p-3.5 rounded-xl bg-stone-950/60 border border-teal-900/40 space-y-2">
            <div className="flex items-center gap-1.5 text-teal-400 font-semibold text-xs">
              <Target className="w-3.5 h-3.5" />
              <span>Identified Common Ground:</span>
            </div>
            {bridgeNotes.commonGround.length === 0 ? (
              <p className="text-stone-500 text-[11px] italic">
                As both partners contrastruct their perspectives, shared values will be compiled here.
              </p>
            ) : (
              <ul className="space-y-1.5 pl-1">
                {bridgeNotes.commonGround.map((ground, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-stone-300 text-[11px]">
                    <CheckCircle className="w-3 h-3 text-teal-400 shrink-0 mt-0.5" />
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
