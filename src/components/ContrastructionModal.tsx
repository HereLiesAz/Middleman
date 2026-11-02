import React from 'react';
import { BookOpen, X, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

interface ContrastructionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ContrastructionModal: React.FC<ContrastructionModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-stone-900 border border-stone-700 max-w-2xl w-full rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-stone-950/80 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-stone-100">
                The Rhetorical Art of Contrastruction
              </h3>
              <p className="text-xs text-stone-400">
                From Jeff Smith-Luedke's <em>The Neo-Machiavellian / The Absurdity of Philosophy</em>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-sm text-stone-300 leading-relaxed custom-scrollbar">
          <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/40 text-amber-200 text-xs">
            <span className="font-semibold block mb-1">Source Excerpt:</span>
            "The idea is that you take an argument you disagree with, and make it agreeable. Don't do this by changing the text, but by changing the sense of the text, or by changing its context... There is always a bit of ambiguity in the sense of a word... Reinterpret it so that you agree with the argument, and your reinterpretation is wholly consistent with the original."
          </div>

          <h4 className="font-semibold text-stone-100 text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-400" />
            How Middleman Uses Contrastruction for Couples in Conflict:
          </h4>

          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-stone-950/60 border border-stone-800">
              <span className="font-medium text-stone-100 block text-xs uppercase tracking-wider text-teal-400">
                1. Respect the Exact Words Spoken
              </span>
              <p className="text-xs text-stone-300 mt-1">
                We never tell a fighting partner "You shouldn't have said that" or "That's inaccurate." That only breeds defensiveness. We keep their exact words intact.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-stone-950/60 border border-stone-800">
              <span className="font-medium text-stone-100 block text-xs uppercase tracking-wider text-amber-400">
                2. Probe the Ambiguities (The Semantic Gap)
              </span>
              <p className="text-xs text-stone-300 mt-1">
                Every word contains room for interpretation. When someone shouts <em>"You never care!"</em>, the ambiguity is between actual lack of affection vs. the desperate feeling of emotional distance.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-stone-950/60 border border-stone-800">
              <span className="font-medium text-stone-100 block text-xs uppercase tracking-wider text-rose-400">
                3. Uncover the Unreasoned Core Values
              </span>
              <p className="text-xs text-stone-300 mt-1">
                Behind angry complaints lie seminal, unexpressed human values: wanting safety, longing for partnership, fear of being discarded, exhaustion under invisible burdens.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-stone-950/60 border border-stone-800">
              <span className="font-medium text-stone-100 block text-xs uppercase tracking-wider text-emerald-400">
                4. Shift to Curious & Compassionate Inquiry
              </span>
              <p className="text-xs text-stone-300 mt-1">
                Rather than debating who is right or wrong, Middleman adopts genuine curiosity ("Can you walk me through what that felt like in that moment?"), inviting the speaker to unpack their vulnerability.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-stone-950/60 border border-stone-800">
              <span className="font-medium text-stone-100 block text-xs uppercase tracking-wider text-blue-400">
                5. Bridge Perspective Without Shoving
              </span>
              <p className="text-xs text-stone-300 mt-1">
                Middleman talks <em>for</em> each partner, formulating an agreeable bridge statement that conveys the speaker's true heart to their partner without detonating a bomb of accusations.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-stone-950/80 border-t border-stone-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium rounded-xl transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
