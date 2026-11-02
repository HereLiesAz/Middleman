import React, { useState } from 'react';
import {
  HYPOTHETICAL_CONTRASTRUCTION_EXAMPLES
} from '../utils/mediationRules';
import {
  Scale,
  X,
  Compass,
  ArrowRight
} from 'lucide-react';

interface ContrastructionShowcaseProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ContrastructionShowcase: React.FC<ContrastructionShowcaseProps> = ({
  isOpen,
  onClose
}) => {
  const [selectedExampleId, setSelectedExampleId] = useState<string>(
    HYPOTHETICAL_CONTRASTRUCTION_EXAMPLES[0].id
  );

  if (!isOpen) return null;

  const currentExample =
    HYPOTHETICAL_CONTRASTRUCTION_EXAMPLES.find((e) => e.id === selectedExampleId) ||
    HYPOTHETICAL_CONTRASTRUCTION_EXAMPLES[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-[#181716] border border-[#2b2824] max-w-4xl w-full rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 bg-[#1d1b19] border-b border-[#262421] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#282420] border border-[#3d372e] flex items-center justify-center text-[#d4975c]">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-editorial text-lg text-[#f4efe6]">
                Contrastruction in Couples Mediation
              </h3>
              <p className="text-xs text-[#9c958a]">
                Highlighting areas of contrast to construct deep common ground
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

        {/* Method Explanation Ribbon */}
        <div className="bg-[#141312] border-b border-[#262421] px-5 py-3 text-xs text-[#b8b0a2]">
          <p className="leading-relaxed font-ui">
            <strong className="text-[#d4975c] font-medium">The Rhetorical Method:</strong> In heated conflict, raw words mask unspoken emotional needs. Contrastruction does not dismiss the words; it gently contrasts differing subjective lenses, disarms misinterpretations, and constructs enduring common ground around shared values.
          </p>
        </div>

        {/* Scenario Selectors */}
        <div className="flex border-b border-[#262421] bg-[#161514] overflow-x-auto px-5 pt-2.5 gap-2 scrollbar-none">
          {HYPOTHETICAL_CONTRASTRUCTION_EXAMPLES.map((ex) => (
            <button
              key={ex.id}
              onClick={() => setSelectedExampleId(ex.id)}
              className={`pb-2 px-3 text-xs font-medium border-b-2 transition-colors shrink-0 ${
                selectedExampleId === ex.id
                  ? 'border-[#d4975c] text-[#f4efe6]'
                  : 'border-transparent text-[#8a8377] hover:text-[#e8e4dc]'
              }`}
            >
              {ex.title}
            </button>
          ))}
        </div>

        {/* Body Walkthrough */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-[#c7baa7] custom-scrollbar">
          {/* Dispute Context */}
          <div className="p-4 rounded-lg bg-[#141312] border border-[#282623]">
            <span className="text-[11px] uppercase tracking-wider text-[#d4975c] font-medium block mb-1">
              Dispute Context:
            </span>
            <p className="text-[#ded8cf] leading-relaxed">
              {currentExample.context}
            </p>
          </div>

          {/* Raw Statements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div className="p-3.5 rounded-lg bg-[#1e1b19] border border-[#332b26] space-y-1">
              <span className="text-[11px] uppercase tracking-wider text-[#d4975c] font-medium block">
                {currentExample.partnerAName}'s Raw Statement:
              </span>
              <p className="font-editorial italic text-xs text-[#f4efe6] pt-1">
                "{currentExample.rawStatementA}"
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-[#1e1b19] border border-[#332b26] space-y-1">
              <span className="text-[11px] uppercase tracking-wider text-[#d4975c] font-medium block">
                {currentExample.partnerBName}'s Raw Defense:
              </span>
              <p className="font-editorial italic text-xs text-[#f4efe6] pt-1">
                "{currentExample.rawStatementB}"
              </p>
            </div>
          </div>

          {/* 4-Phase Flow */}
          <div className="space-y-3 pt-2">
            <div className="text-[11px] uppercase tracking-wider text-[#9c958a] font-medium">
              Middleman's 4-Phase Mediation Sequence:
            </div>

            {/* 1. Validation */}
            <div className="p-4 rounded-lg bg-[#141312] border border-[#282623] space-y-1.5">
              <div className="text-[11px] text-[#9bb098] font-medium">
                1. Empathetic Validation & Mirroring
              </div>
              <p className="font-editorial italic text-[#ded8cf] leading-relaxed pl-3 border-l border-[#9bb098]">
                "{currentExample.validationAndMirroring}"
              </p>
            </div>

            {/* 2. Non-Accusatory Misinterpretation Check */}
            <div className="p-4 rounded-lg bg-[#141312] border border-[#282623] space-y-1.5">
              <div className="text-[11px] text-[#d4975c] font-medium">
                2. Non-Accusatory Misinterpretation Lens
              </div>
              <p className="text-[#ded8cf] leading-relaxed pl-3 border-l border-[#d4975c]">
                {currentExample.nonAccusatoryMisinterpretation}
              </p>
            </div>

            {/* 3. Contrast & Common Ground */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div className="p-4 rounded-lg bg-[#141312] border border-[#282623] space-y-1">
                <span className="text-[11px] text-[#c96f53] font-medium block">
                  3a. Highlighting Area of Contrast
                </span>
                <p className="text-[#ded8cf] leading-relaxed">
                  {currentExample.contrastHighlight}
                </p>
              </div>

              <div className="p-4 rounded-lg bg-[#141312] border border-[#282623] space-y-1">
                <span className="text-[11px] text-[#9bb098] font-medium block">
                  3b. Constructing Common Ground
                </span>
                <p className="text-[#ded8cf] leading-relaxed">
                  {currentExample.constructedCommonGround}
                </p>
              </div>
            </div>

            {/* 4. Clarifying Inquiry */}
            <div className="p-4 rounded-lg bg-[#141312] border border-[#282623] space-y-1.5">
              <div className="text-[11px] text-[#d4975c] font-medium">
                4. Clarifying Inquiry (Unpacking Unmet Need)
              </div>
              <p className="font-editorial italic text-[#ded8cf] leading-relaxed pl-3 border-l border-[#d4975c]">
                "{currentExample.clarifyingInquiry}"
              </p>
            </div>

            {/* Ze Frank Two Layer */}
            {currentExample.contentVsFeelings && (
              <div className="p-4 rounded-lg bg-[#141312] border border-[#282623] space-y-2">
                <span className="text-[11px] uppercase tracking-wider text-[#9c958a] font-medium block">
                  Ze Frank Two-Layer Decoupling:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded bg-[#191816] border border-[#262421]">
                    <span className="text-[10px] uppercase text-[#736c62] block mb-0.5">
                      Content Layer (Logistics):
                    </span>
                    <p className="text-[#bbb3a6]">
                      {currentExample.contentVsFeelings.contentLayer}
                    </p>
                  </div>
                  <div className="p-3 rounded bg-[#191816] border border-[#262421]">
                    <span className="text-[10px] uppercase text-[#d4975c] block mb-0.5">
                      Feelings Layer (Vulnerability):
                    </span>
                    <p className="text-[#f4efe6] font-editorial italic">
                      {currentExample.contentVsFeelings.feelingsLayer}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Perspective Bridge */}
            <div className="p-4 rounded-lg bg-[#141312] border border-[#282623] space-y-1.5">
              <div className="text-[11px] text-[#9bb098] font-medium flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5" />
                <span>How Middleman Bridges This Perspective to {currentExample.partnerBName}:</span>
              </div>
              <p className="font-editorial italic text-[#f4efe6] leading-relaxed pl-3 border-l border-[#9bb098]">
                "{currentExample.bridgedPerspective}"
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#161514] border-t border-[#262421] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#262320] hover:bg-[#302c28] text-[#f4efe6] text-xs font-medium rounded-md transition-colors"
          >
            Close Showcase
          </button>
        </div>
      </div>
    </div>
  );
};
