import React from 'react';
import { UserProfile, PartnerId } from '../types/mediation';
import {
  X,
  ArrowRightLeft,
  Clock,
  ShieldCheck
} from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProfile: UserProfile;
  otherProfile: UserProfile;
  onSwitchUser: (partnerId: PartnerId) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  activeProfile,
  otherProfile,
  onSwitchUser
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-[#181716] border border-[#2b2824] max-w-2xl w-full rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-[#1d1b19] border-b border-[#262421] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#282420] border border-[#3d372e] flex items-center justify-center text-[#d4975c] font-editorial text-base font-medium">
              {activeProfile.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-editorial text-lg text-[#f4efe6]">
                  {activeProfile.name}'s Profile & Dossier
                </h3>
              </div>
              <p className="text-xs text-[#8a8377]">
                {activeProfile.relationshipLength || 'Active confidential mediation'}
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

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-[#c7baa7] custom-scrollbar">
          {/* Privacy Guarantee Note */}
          <div className="p-3.5 rounded-lg bg-[#141a15] border border-[#253629] flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-[#9bb098] shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-medium text-[#cde0cb] block text-xs">
                Emotional Privacy Shield
              </span>
              <p className="text-[#a4b8a2] leading-relaxed text-xs">
                Raw messages sent in your private room are never shown to {otherProfile.name}. Middleman shields each partner from emotional injury. Only mutual, de-escalated perspective bridges are delivered.
              </p>
            </div>
          </div>

          {/* Perspective Summary Dossier */}
          <div className="p-4 rounded-lg bg-[#141312] border border-[#282623] space-y-3">
            <span className="text-[11px] text-[#9c958a] uppercase tracking-wider font-medium block">
              Middleman's Evolving Perspective Dossier:
            </span>
            <p className="font-editorial italic text-xs text-[#ded8cf] leading-relaxed pl-3 border-l border-[#d4975c]">
              "{activeProfile.perspectiveSummary}"
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded bg-[#191816] border border-[#262421]">
                <span className="text-[10px] text-[#736c62] uppercase block mb-1">
                  Communication Tendencies:
                </span>
                <ul className="space-y-1">
                  {activeProfile.communicationTendencies.map((tendency, i) => (
                    <li key={i} className="text-[#bbb3a6] flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-[#d4975c]"></span>
                      <span>{tendency}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3 rounded bg-[#191816] border border-[#262421]">
                <span className="text-[10px] text-[#736c62] uppercase block mb-1">
                  Identified Triggers:
                </span>
                <ul className="space-y-1">
                  {activeProfile.identifiedTriggers.map((trigger, i) => (
                    <li key={i} className="text-[#bbb3a6] flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-[#c96f53]"></span>
                      <span>{trigger}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Interaction History with Middleman */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-[11px] text-[#9c958a] font-medium">
              <span>Private Interactions Logged</span>
              <span className="font-mono">{activeProfile.interactionHistory.length}</span>
            </div>

            {activeProfile.interactionHistory.length === 0 ? (
              <div className="p-4 rounded-lg bg-[#141312] border border-[#282623] text-center text-[#736c62]">
                No interactions logged yet.
              </div>
            ) : (
              <div className="space-y-2.5">
                {activeProfile.interactionHistory.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-lg bg-[#141312] border border-[#282623] space-y-2"
                  >
                    <div className="flex items-center justify-between text-[10px] text-[#736c62]">
                      <span className="font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(item.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      {item.clarifiedNeed && (
                        <span className="text-[#d4975c] font-medium">
                          Core Need: {item.clarifiedNeed}
                        </span>
                      )}
                    </div>

                    <div className="text-[#ded8cf] italic font-editorial text-xs pl-2 border-l border-[#3d3832]">
                      "{item.speakerText}"
                    </div>

                    <div className="text-[#a8a195] text-xs pt-1">
                      <strong className="text-[#9bb098] font-medium">Middleman:</strong>{' '}
                      {item.middlemanValidation}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer: Perspective Switcher */}
        <div className="p-4 bg-[#161514] border-t border-[#262421] flex items-center justify-between">
          <button
            onClick={() => {
              onSwitchUser(otherProfile.partnerId);
              onClose();
            }}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#25221e] hover:bg-[#2e2a25] text-[#d4975c] rounded-md transition-colors text-xs font-medium border border-[#3b352e]"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Switch Perspective to {otherProfile.name}</span>
          </button>

          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs text-[#bbb2a4] hover:text-[#f4efe6] border border-[#2e2a26] rounded-md transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
