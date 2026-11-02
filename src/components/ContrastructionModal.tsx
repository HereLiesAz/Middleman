import React, { useState } from 'react';
import {
  BookOpen,
  X,
  Sparkles,
  ArrowRight,
  Layers,
  CheckCircle2,
  AlertCircle,
  Copy,
  ChevronRight
} from 'lucide-react';
import { ContrastructionInsight } from '../types/mediation';

interface ContrastructionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyBridge?: (bridgeText: string) => void;
}

export const ContrastructionModal: React.FC<ContrastructionModalProps> = ({
  isOpen,
  onClose,
  onApplyBridge
}) => {
  const [activeTab, setActiveTab] = useState<'lab' | 'philosophy' | 'classics'>('lab');
  const [testInput, setTestInput] = useState(
    "You completely ruined our anniversary because your stupid job is all you care about!"
  );
  const [speakerName, setSpeakerName] = useState('Alex');
  const [listenerName, setListenerName] = useState('Jordan');
  const [isLoading, setIsLoading] = useState(false);
  const [insight, setInsight] = useState<ContrastructionInsight | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleRunContrastruction = async () => {
    if (!testInput.trim()) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/mediation/contrastruct-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: testInput,
          speakerName,
          listenerName
        })
      });
      if (res.ok) {
        const data = await res.json();
        setInsight(data);
      }
    } catch (err) {
      console.error('Contrastruction run failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const sampleDisputes = [
    {
      label: "Anniversary & Overwork",
      text: "You completely blew off our anniversary dinner to stay late at the office! You don't care about us.",
      speaker: "Alex",
      listener: "Jordan"
    },
    {
      label: "Invisible Domestic Chores",
      text: "I do literally everything in this house while you just sit on the couch and pretend nothing needs doing.",
      speaker: "Morgan",
      listener: "Sam"
    },
    {
      label: "Azrienoch's Classic (Semantic Sense)",
      text: "I beat my wife at chess every weekend, but people always misunderstand what that means.",
      speaker: "Speaker",
      listener: "Opponent"
    },
    {
      label: "Holiday Travel & In-Laws",
      text: "We always have to go to your family's house and spend every holiday miserable with your parents.",
      speaker: "Chris",
      listener: "Taylor"
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#181716] border border-[#2e2a25] max-w-4xl w-full rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 bg-[#1e1c19] border-b border-[#2a2723] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#282420] border border-[#3d372e] flex items-center justify-center text-[#d4975c]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-editorial text-lg text-[#f5efe6] font-medium">
                  The Contrastruction Laboratory
                </h3>
                <span className="text-[10px] bg-[#29221b] text-[#d4975c] border border-[#423326] px-2 py-0.5 rounded font-mono">
                  AZRIENOCH RHETORIC ENGINE
                </span>
              </div>
              <p className="text-xs text-[#9c958a]">
                Reinterpreting the context so both opponents agree without denying the words spoken.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8a8377] hover:text-[#f4efe6] hover:bg-[#282522] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="bg-[#141312] border-b border-[#262421] px-5 flex items-center gap-4 text-xs font-medium">
          <button
            onClick={() => setActiveTab('lab')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'lab'
                ? 'border-[#d4975c] text-[#f5efe6]'
                : 'border-transparent text-[#8a8377] hover:text-[#e8e4dc]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#d4975c]" />
            <span>Interactive Deconstruction Lab</span>
          </button>

          <button
            onClick={() => setActiveTab('classics')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'classics'
                ? 'border-[#d4975c] text-[#f5efe6]'
                : 'border-transparent text-[#8a8377] hover:text-[#e8e4dc]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Case Studies & Examples</span>
          </button>

          <button
            onClick={() => setActiveTab('philosophy')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'philosophy'
                ? 'border-[#d4975c] text-[#f5efe6]'
                : 'border-transparent text-[#8a8377] hover:text-[#e8e4dc]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>The Conveyance Doctrine</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar text-xs">
          {activeTab === 'lab' && (
            <div className="space-y-4">
              {/* Presets */}
              <div>
                <span className="text-[10px] font-mono uppercase text-[#797266] block mb-1.5">
                  Load Realistic Disagreement:
                </span>
                <div className="flex flex-wrap gap-2">
                  {sampleDisputes.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setTestInput(s.text);
                        setSpeakerName(s.speaker);
                        setListenerName(s.listener);
                        setInsight(null);
                      }}
                      className="bg-[#201d1a] hover:bg-[#2a2622] text-[#c4bbaa] px-2.5 py-1 rounded border border-[#312c26] text-xs transition-colors"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Form */}
              <div className="bg-[#151413] border border-[#2b2723] p-4 rounded-xl space-y-3">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[10px] font-mono uppercase text-[#888074] block mb-1">
                      Speaker Name
                    </label>
                    <input
                      type="text"
                      value={speakerName}
                      onChange={(e) => setSpeakerName(e.target.value)}
                      className="w-full bg-[#1b1917] border border-[#312c26] rounded px-2.5 py-1.5 text-[#f5efe6] focus:border-[#d4975c] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono uppercase text-[#888074] block mb-1">
                      Partner / Opponent Name
                    </label>
                    <input
                      type="text"
                      value={listenerName}
                      onChange={(e) => setListenerName(e.target.value)}
                      className="w-full bg-[#1b1917] border border-[#312c26] rounded px-2.5 py-1.5 text-[#f5efe6] focus:border-[#d4975c] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-mono uppercase text-[#888074] block mb-1">
                    Unfiltered Grievance / Stated Argument
                  </label>
                  <textarea
                    rows={3}
                    value={testInput}
                    onChange={(e) => setTestInput(e.target.value)}
                    className="w-full bg-[#1b1917] border border-[#312c26] rounded-lg p-2.5 text-sm text-[#f5efe6] focus:border-[#d4975c] outline-none leading-relaxed resize-none custom-scrollbar"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-[#797266]">
                    Applies Azrienoch's "absurdity of philosophy" rhetorical recontextualization
                  </span>
                  <button
                    type="button"
                    onClick={handleRunContrastruction}
                    disabled={!testInput.trim() || isLoading}
                    className="px-4 py-2 bg-[#d4975c] hover:bg-[#c28448] text-[#141312] font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <span className="font-editorial italic">Transducing...</span>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Run Contrastruction Engine</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Results Breakdown */}
              {insight && (
                <div className="space-y-3 animate-in fade-in duration-300">
                  <div className="text-[11px] font-mono uppercase text-[#d4975c] tracking-wider flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#9bb098]" />
                    <span>Rhetorical Reconstruction Analysis</span>
                  </div>

                  {/* 4-Step Matrix */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-[#1a1816] border border-[#2b2723] p-3.5 rounded-xl space-y-1">
                      <span className="font-mono text-[10px] text-[#d4975c] uppercase block">
                        Step 1: Spoken Words Honored
                      </span>
                      <p className="font-editorial italic text-xs text-[#f5efe6]">
                        "{insight.originalQuote}"
                      </p>
                      <p className="text-[11px] text-[#8a8376] pt-1">
                        Never reject or invalidate the phrase. The words represent real emotional pressure.
                      </p>
                    </div>

                    <div className="bg-[#1a1816] border border-[#2b2723] p-3.5 rounded-xl space-y-1">
                      <span className="font-mono text-[10px] text-[#9bb098] uppercase block">
                        Step 2: Semantic Ambiguity Located
                      </span>
                      <p className="text-xs text-[#dce4da]">
                        {insight.ambiguousPart}
                      </p>
                      <p className="text-[11px] text-[#8a8376] pt-1">
                        Words like "always" or "only care" conceal the genuine stakes beneath extreme hyperbole.
                      </p>
                    </div>

                    <div className="bg-[#1a1816] border border-[#2b2723] p-3.5 rounded-xl space-y-1">
                      <span className="font-mono text-[10px] text-[#d4975c] uppercase block">
                        Step 3: Area of Contrast
                      </span>
                      <p className="text-xs text-[#d4cbbe] leading-relaxed">
                        {insight.areaOfContrast}
                      </p>
                    </div>

                    <div className="bg-[#1a1816] border border-[#2b2723] p-3.5 rounded-xl space-y-1">
                      <span className="font-mono text-[10px] text-[#9bb098] uppercase block">
                        Step 4: Constructed Common Ground
                      </span>
                      <p className="text-xs text-[#c9e0c8] leading-relaxed">
                        {insight.constructedCommonGround}
                      </p>
                    </div>
                  </div>

                  {/* Agreeable Sense & Bridge Formulation */}
                  <div className="bg-[#161f18] border border-[#2d3a30] p-4 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-[#9bb098]">
                      <span className="font-mono uppercase text-[10px] tracking-wider font-semibold">
                        The Agreeable Recontextualization
                      </span>
                      {onApplyBridge && insight.bridgeProposal && (
                        <button
                          type="button"
                          onClick={() => {
                            onApplyBridge(insight.bridgeProposal!);
                            onClose();
                          }}
                          className="text-xs text-[#9bb098] hover:underline flex items-center gap-1 font-semibold"
                        >
                          Send to Active Room <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    <p className="font-editorial text-sm italic text-[#e4f0e3] leading-relaxed">
                      "{insight.agreeableSense}"
                    </p>

                    {insight.bridgeProposal && (
                      <div className="pt-2 border-t border-[#2a382d]">
                        <span className="text-[10px] text-[#8ea38a] font-mono uppercase block mb-1">
                          Bridge Statement for Partner:
                        </span>
                        <div className="flex items-center justify-between bg-[#111713] p-2.5 rounded border border-[#263629]">
                          <span className="text-xs text-[#d4e4d2]">"{insight.bridgeProposal}"</span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(insight.bridgeProposal!);
                              setCopied(true);
                              setTimeout(() => setCopied(false), 2000);
                            }}
                            className="p-1 text-[#8ea38a] hover:text-[#e4f0e3] ml-2"
                            title="Copy to clipboard"
                          >
                            {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-[#9bb098]" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'classics' && (
            <div className="space-y-4">
              <div className="border-l-2 border-[#d4975c] pl-3 py-1">
                <h4 className="font-editorial text-base text-[#f5efe6]">
                  Canonical Contrastruction Scenarios from Azrienoch's Treatise
                </h4>
                <p className="text-xs text-[#8e877a]">
                  From <em>You're Stupid: How to Argue Effectively, or The Neo-Machiavellian</em>
                </p>
              </div>

              <div className="space-y-3">
                <div className="bg-[#151413] border border-[#2a2622] p-4 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-[#d4975c]">
                    <span className="font-bold text-xs">Example 1: "I beat my wife"</span>
                    <span className="text-[10px] font-mono text-[#797266]">Semantic Sense Ambiguity</span>
                  </div>
                  <p className="text-xs text-[#c7bfb3] leading-relaxed">
                    When someone says "I beat my wife", it could mean physical violence, or it could mean winning a board game. Context is that unsaid part of the words we say that helps us make sense of things. In order to contrastruct an argument you disagree with, you must reinterpret it so that you agree with the argument, and your reinterpretation is wholly consistent with the original.
                  </p>
                </div>

                <div className="bg-[#151413] border border-[#2a2622] p-4 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-[#d4975c]">
                    <span className="font-bold text-xs">Example 2: "He killed my father" vs "He murdered my father"</span>
                    <span className="text-[10px] font-mono text-[#797266]">Instructional Nuance</span>
                  </div>
                  <p className="text-xs text-[#c7bfb3] leading-relaxed">
                    All language is instructional. Saying "He murdered my father" introduces a moral indictment and specific instruction on how the listener must judge the actor. Contrastruction exposes the instruction embedded inside semantic choices without dismissing the speaker's emotional reality.
                  </p>
                </div>

                <div className="bg-[#151413] border border-[#2a2622] p-4 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-[#9bb098]">
                    <span className="font-bold text-xs">Example 3: Couples Fighting over Broken Milestone</span>
                    <span className="text-[10px] font-mono text-[#797266]">Couples Application</span>
                  </div>
                  <p className="text-xs text-[#c7bfb3] leading-relaxed">
                    <em>"You don't care about our marriage."</em><br />
                    <strong>Contrastruction:</strong> The speaker's words are consistent with an overwhelming desire for dedicated, sacred time together. The partner's defensive workaholic stance is consistent with an overwhelming desire to protect their shared roof. Both are driven by devotion to the couple's future, expressed in contrasting semantic currencies.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'philosophy' && (
            <div className="space-y-4">
              <div className="border-l-2 border-[#d4975c] pl-4 py-1">
                <span className="text-[10px] uppercase tracking-wider text-[#d4975c] font-mono block mb-1">
                  The Absurdity of Philosophy Excerpt:
                </span>
                <p className="font-editorial italic text-sm text-[#f5efe6] leading-relaxed">
                  "To avoid this embarrassment, I developed a tool in The Absurdity of Philosophy called contrastruction. The idea is that you take an argument you disagree with, and make it agreeable. Don't do this by changing the text, but by changing the sense of the text, or by changing its context... Reinterpret it so that you agree with the argument, and your reinterpretation is wholly consistent with the original."
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <div className="p-3.5 rounded-lg bg-[#141312] border border-[#282623] space-y-1">
                  <span className="text-[11px] text-[#f4efe6] font-semibold block">
                    1. Zero Invalidation of Spoken Words
                  </span>
                  <p className="text-[#a8a195] text-xs">
                    In a fight, telling your partner "That's not true" or "You shouldn't feel that" guarantees escalation. Middleman accepts every word verbatim, shifting only the explanatory context.
                  </p>
                </div>

                <div className="p-3.5 rounded-lg bg-[#141312] border border-[#282623] space-y-1">
                  <span className="text-[11px] text-[#f4efe6] font-semibold block">
                    2. Uncover Unreasoned Core Values
                  </span>
                  <p className="text-[#a8a195] text-xs">
                    Azrienoch notes that core values are reasonless and wordless—they simply are. Trying to logic someone out of a core value is futile. Contrastruction aligns with those values instead of fighting them.
                  </p>
                </div>

                <div className="p-3.5 rounded-lg bg-[#141312] border border-[#282623] space-y-1">
                  <span className="text-[11px] text-[#f4efe6] font-semibold block">
                    3. The Middleman Synthesis
                  </span>
                  <p className="text-[#a8a195] text-xs">
                    By holding both private chambers simultaneously, Middleman acts as the rhetorical catalyst, converting mutual defensiveness into mutual recognition.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
