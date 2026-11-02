import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Layers,
  ShieldCheck,
  Heart,
  Timer,
  Check,
  ArrowRight
} from 'lucide-react';

interface ZeFrankPlaybookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerTimeout: () => void;
}

export const ZeFrankPlaybookModal: React.FC<ZeFrankPlaybookModalProps> = ({
  isOpen,
  onClose,
  onTriggerTimeout
}) => {
  const [activeTab, setActiveTab] = useState<'content-feelings' | 'ground-rules' | 'intent-sandwich' | 'timeouts'>('content-feelings');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-[#181716] border border-[#2b2824] rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#262421] bg-[#1d1b19]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#262320] border border-[#3b352e] flex items-center justify-center text-[#d4975c]">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-editorial text-lg text-[#f4efe6]">
                Ze Frank's Clean Fight Principles
              </h3>
              <p className="text-xs text-[#9c958a]">
                A practical guide to disagreeing without destroying intimacy
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#8f887d] hover:text-[#f4efe6] hover:bg-[#282522] rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation: Restrained & Typographic */}
        <div className="flex items-center gap-2 px-5 pt-2.5 border-b border-[#262421] bg-[#161514] overflow-x-auto scrollbar-none text-xs">
          <button
            onClick={() => setActiveTab('content-feelings')}
            className={`pb-2.5 px-2 font-medium transition-colors border-b-2 ${
              activeTab === 'content-feelings'
                ? 'border-[#d4975c] text-[#f4efe6]'
                : 'border-transparent text-[#8a8377] hover:text-[#e8e4dc]'
            }`}
          >
            Content vs. Feelings
          </button>

          <button
            onClick={() => setActiveTab('ground-rules')}
            className={`pb-2.5 px-2 font-medium transition-colors border-b-2 ${
              activeTab === 'ground-rules'
                ? 'border-[#d4975c] text-[#f4efe6]'
                : 'border-transparent text-[#8a8377] hover:text-[#e8e4dc]'
            }`}
          >
            Clean Fight Rules
          </button>

          <button
            onClick={() => setActiveTab('intent-sandwich')}
            className={`pb-2.5 px-2 font-medium transition-colors border-b-2 ${
              activeTab === 'intent-sandwich'
                ? 'border-[#d4975c] text-[#f4efe6]'
                : 'border-transparent text-[#8a8377] hover:text-[#e8e4dc]'
            }`}
          >
            The Intent Sandwich
          </button>

          <button
            onClick={() => setActiveTab('timeouts')}
            className={`pb-2.5 px-2 font-medium transition-colors border-b-2 ${
              activeTab === 'timeouts'
                ? 'border-[#d4975c] text-[#f4efe6]'
                : 'border-transparent text-[#8a8377] hover:text-[#e8e4dc]'
            }`}
          >
            60s Timeouts
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar text-xs leading-relaxed text-[#c7baa7]">
          {activeTab === 'content-feelings' && (
            <div className="space-y-4">
              <div className="border-l-2 border-[#d4975c] pl-4 py-1">
                <p className="font-editorial italic text-sm text-[#f4efe6]">
                  "In every couple's dispute, there are two distinct arguments happening at once: what happened logistically, and what each person felt emotionally."
                </p>
                <p className="text-[11px] text-[#8a8377] mt-1 font-ui">
                  Debating factual logistics while either nervous system is flooded is futile. The underlying feelings must be recognized first.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
                <div className="bg-[#141312] border border-[#2b2824] p-4 rounded-lg space-y-2">
                  <span className="text-[11px] uppercase tracking-wider text-[#9c958a] font-medium block">
                    Layer 1: The Content Argument
                  </span>
                  <p className="text-[#bbb3a6] text-xs">
                    The surface timeline, logistics, and who-did-what facts:
                  </p>
                  <ul className="text-[#8f887d] space-y-1 list-disc list-inside text-xs">
                    <li>Who forgot to call before leaving work</li>
                    <li>How much money was spent on tickets</li>
                    <li>What time dinner was scheduled</li>
                  </ul>
                  <p className="text-[11px] text-[#c96f53] pt-1 italic font-editorial">
                    Factual victory rarely brings emotional closeness.
                  </p>
                </div>

                <div className="bg-[#141312] border border-[#3b352e] p-4 rounded-lg space-y-2">
                  <span className="text-[11px] uppercase tracking-wider text-[#d4975c] font-medium block">
                    Layer 2: The Feelings Argument
                  </span>
                  <p className="text-[#bbb3a6] text-xs">
                    The vulnerable emotional stakes underneath:
                  </p>
                  <ul className="text-[#d8cfc2] space-y-1 list-disc list-inside text-xs font-editorial italic">
                    <li>"I felt invisible and unvalued."</li>
                    <li>"I'm terrified of letting you down."</li>
                    <li>"I feel alone carrying the mental load."</li>
                  </ul>
                  <p className="text-[11px] text-[#9bb098] pt-1">
                    Middleman validates the feelings layer before addressing logistics.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ground-rules' && (
            <div className="space-y-3.5">
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-[#141312] border border-[#282623] rounded-lg">
                  <strong className="text-[#f4efe6] block font-medium mb-0.5">
                    1. Zero Physical Intimidation
                  </strong>
                  <p className="text-[#9c958a]">
                    Absolute zero tolerance. No slamming doors, blocking exits, or aggressive posturing.
                  </p>
                </div>

                <div className="p-3 bg-[#141312] border border-[#282623] rounded-lg">
                  <strong className="text-[#f4efe6] block font-medium mb-0.5">
                    2. No Weaponized Profanity
                  </strong>
                  <p className="text-[#9c958a]">
                    Expressing stress is normal, but direct character slurs ("you idiot") cause lasting trauma.
                  </p>
                </div>

                <div className="p-3 bg-[#141312] border border-[#282623] rounded-lg">
                  <strong className="text-[#f4efe6] block font-medium mb-0.5">
                    3. Eliminate Absolute Words ("Always", "Never")
                  </strong>
                  <p className="text-[#9c958a]">
                    Generalizations turn an isolated error into an existential character assassination. Address the specific event.
                  </p>
                </div>

                <div className="p-3 bg-[#141312] border border-[#282623] rounded-lg">
                  <strong className="text-[#f4efe6] block font-medium mb-0.5">
                    4. Never Threaten the Relationship for Leverage
                  </strong>
                  <p className="text-[#9c958a]">
                    Threatening divorce or breakup during an argument erodes the foundational security of the relationship.
                  </p>
                </div>

                <div className="p-3 bg-[#141312] border border-[#282623] rounded-lg">
                  <strong className="text-[#f4efe6] block font-medium mb-0.5">
                    5. One Fight at a Time
                  </strong>
                  <p className="text-[#9c958a]">
                    Do not bring up an archive of grievances from years ago. Solve today's friction today.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'intent-sandwich' && (
            <div className="space-y-3.5">
              <p className="text-xs text-[#9c958a] leading-relaxed">
                When delivering sensitive critique, anchor the conversation in your enduring commitment first. Security lowers emotional defenses.
              </p>

              <div className="space-y-2.5">
                <div className="bg-[#141312] border-l-2 border-[#9bb098] p-3.5 rounded-r-lg">
                  <span className="text-[10px] uppercase tracking-wider text-[#9bb098] block mb-1 font-medium">
                    1. The Opening Anchor of Commitment
                  </span>
                  <p className="font-editorial italic text-xs text-[#f4efe6]">
                    "I love you, and our partnership is the most important thing to me. I'm sharing this because I want us to be close..."
                  </p>
                </div>

                <div className="bg-[#141312] border-l-2 border-[#d4975c] p-3.5 rounded-r-lg">
                  <span className="text-[10px] uppercase tracking-wider text-[#d4975c] block mb-1 font-medium">
                    2. The Vulnerable Honest Need
                  </span>
                  <p className="font-editorial italic text-xs text-[#f4efe6]">
                    "...when you left without letting me know, I felt anxious and wondered if our plans mattered..."
                  </p>
                </div>

                <div className="bg-[#141312] border-l-2 border-[#9bb098] p-3.5 rounded-r-lg">
                  <span className="text-[10px] uppercase tracking-wider text-[#9bb098] block mb-1 font-medium">
                    3. The Reassurance of Partnership
                  </span>
                  <p className="font-editorial italic text-xs text-[#f4efe6]">
                    "...because I want us to feel like an aligned team who can trust each other through busy weeks."
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'timeouts' && (
            <div className="space-y-4">
              <p className="text-xs text-[#9c958a] leading-relaxed">
                Ze Frank notes that when heart rates exceed 100 BPM during an argument, fight-or-flight takes over and higher neurological empathy shuts off. A timeout is not stonewalling—it is mutual protection.
              </p>

              <div className="bg-[#141312] border border-[#2b2824] p-4 rounded-lg space-y-2">
                <span className="text-[11px] text-[#d4975c] font-medium block">
                  The Clean Timeout Script:
                </span>
                <p className="font-editorial italic text-xs text-[#f4efe6] leading-relaxed">
                  "I love you too much to say something harmful while my nervous system is flooded. Let's take 60 seconds to breathe and return to each other."
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs text-[#8a8377]">Heart rate feeling elevated right now?</span>
                <button
                  onClick={() => {
                    onClose();
                    onTriggerTimeout();
                  }}
                  className="px-4 py-2 bg-[#d4975c] hover:bg-[#c4874d] text-[#141312] font-semibold text-xs rounded-md transition-colors"
                >
                  Start 60s Breathing Session
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#262421] bg-[#161514] flex items-center justify-between text-xs text-[#8a8377]">
          <span className="font-editorial italic">From Ze Frank's Clean Conflict Playbook</span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs text-[#d1c8ba] hover:text-[#f4efe6] border border-[#332f2a] rounded-md transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
