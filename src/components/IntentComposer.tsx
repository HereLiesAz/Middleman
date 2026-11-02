import React, { useState } from 'react';
import {
  Send,
  Sparkles,
  Timer,
  ShieldCheck,
  ChevronUp,
  ChevronDown,
  ArrowRight,
  Eye,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { ContrastructionInsight, PartnerId, UserProfile } from '../types/mediation';

interface IntentComposerProps {
  currentPartner: UserProfile;
  otherPartner: UserProfile;
  onSendMessage: (text: string) => Promise<void>;
  isLoading: boolean;
  onTriggerTimeout?: () => void;
  prompts: string[];
  placeholder?: string;
  isJointRoom?: boolean;
}

export const IntentComposer: React.FC<IntentComposerProps> = ({
  currentPartner,
  otherPartner,
  onSendMessage,
  isLoading,
  onTriggerTimeout,
  prompts,
  placeholder,
  isJointRoom = false
}) => {
  const [inputText, setInputText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<ContrastructionInsight | null>(null);
  const [showAnalysisDrawer, setShowAnalysisDrawer] = useState(false);
  const [justSent, setJustSent] = useState(false);

  const handleDeconstruct = async () => {
    if (!inputText.trim()) return;
    setIsAnalyzing(true);
    setShowAnalysisDrawer(true);
    try {
      const res = await fetch('/api/mediation/contrastruct-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText,
          speakerName: currentPartner.name,
          listenerName: otherPartner.name
        })
      });
      if (res.ok) {
        const data = await res.json();
        setAnalysisResult(data);
      }
    } catch (err) {
      console.error('Failed to analyze statement:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    const textToSend = inputText;
    setInputText('');
    setShowAnalysisDrawer(false);
    setAnalysisResult(null);
    setJustSent(true);
    await onSendMessage(textToSend);
    setTimeout(() => setJustSent(false), 2000);
  };

  const handleApplyBridge = (refinedText: string) => {
    setInputText(refinedText);
  };

  return (
    <div className="bg-[#181716] border-t border-[#2a2723] p-3 sm:p-4 flex flex-col gap-2.5 transition-all">
      {/* Reflective Prompts Bar */}
      {prompts.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs text-[#8f887d] custom-scrollbar">
          <span className="text-[10px] tracking-wider uppercase text-[#716a5f] font-mono shrink-0">
            {currentPartner.name}'s Prompts:
          </span>
          {prompts.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setInputText(p);
                setAnalysisResult(null);
              }}
              className="shrink-0 bg-[#22201d] hover:bg-[#2b2723] hover:text-[#f3ede4] text-[#a89e90] text-xs px-2.5 py-1 rounded border border-[#332f29] transition-all text-left truncate max-w-[280px]"
              title={p}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Real-time Deconstruction Drawer (Ze Frank + Azrienoch Contrastruction) */}
      {showAnalysisDrawer && (
        <div className="bg-[#1e1c19] border border-[#3a342c] rounded-lg p-3 text-xs space-y-2.5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-[#2d2924] pb-1.5">
            <div className="flex items-center gap-1.5 text-[#d4975c]">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="font-editorial text-sm font-semibold tracking-wide">
                Middleman Contrastruction & Clean Fight Lens
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowAnalysisDrawer(false)}
              className="text-[#8c8579] hover:text-[#e8e4dc] text-[11px]"
            >
              Close Lens
            </button>
          </div>

          {isAnalyzing ? (
            <div className="flex items-center gap-2 text-[#9c9486] py-2">
              <div className="w-3.5 h-3.5 rounded-full border border-[#d4975c] border-t-transparent animate-spin" />
              <span className="italic font-editorial text-xs">Decoupling Content vs. Feelings & Finding Common Ground...</span>
            </div>
          ) : analysisResult ? (
            <div className="space-y-2">
              {/* Ze Frank Alerts if any */}
              {analysisResult.cleanFightAlerts && analysisResult.cleanFightAlerts.length > 0 && (
                <div className="bg-[#241c19] border border-[#4a2e25] rounded p-2 text-[#e3a896] text-[11px] space-y-1">
                  <div className="font-semibold flex items-center gap-1 text-[#f08c6a]">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Ze Frank Clean Fight Warning:</span>
                  </div>
                  {analysisResult.cleanFightAlerts.map((alert, i) => (
                    <p key={i} className="leading-snug pl-4">{alert}</p>
                  ))}
                </div>
              )}

              {/* Two Layers */}
              {analysisResult.contentVsFeelings && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-[#161514] border border-[#2b2723] p-2 rounded">
                    <span className="font-mono uppercase text-[9px] text-[#8e8678] block mb-0.5">
                      Layer 1: Content Stated
                    </span>
                    <p className="text-[#c7bfb3] leading-relaxed">
                      {analysisResult.contentVsFeelings.contentLayer}
                    </p>
                  </div>

                  <div className="bg-[#1b221d] border border-[#2d3a30] p-2 rounded">
                    <span className="font-mono uppercase text-[9px] text-[#9bb098] block mb-0.5">
                      Layer 2: Underlying Vulnerability
                    </span>
                    <p className="text-[#d8e6d6] leading-relaxed">
                      {analysisResult.contentVsFeelings.feelingsLayer}
                    </p>
                  </div>
                </div>
              )}

              {/* Contrastruction Reframe */}
              <div className="bg-[#151413] border border-[#2e2a25] p-2 rounded text-[11px] space-y-1">
                <div className="flex items-center justify-between text-[#d4975c]">
                  <span className="font-mono uppercase text-[9px]">
                    Agreeable Sense (Without Denying Your Words)
                  </span>
                  {analysisResult.bridgeProposal && (
                    <button
                      type="button"
                      onClick={() => handleApplyBridge(analysisResult.bridgeProposal!)}
                      className="text-[10px] text-[#d4975c] hover:underline flex items-center gap-1 font-medium"
                    >
                      Use Refined Bridge <ArrowRight className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
                <p className="text-[#ddd6ca] leading-relaxed italic font-editorial text-xs">
                  "{analysisResult.agreeableSense}"
                </p>
                {analysisResult.bridgeProposal && (
                  <p className="text-[#a8a092] text-[10px] pt-1">
                    <strong className="text-[#c9beae]">Suggested phrasing:</strong> "{analysisResult.bridgeProposal}"
                  </p>
                )}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Main Input Text Area & Actions */}
      <div className="relative bg-[#141312] border border-[#312c26] rounded-xl focus-within:border-[#d4975c] transition-colors p-2.5">
        <textarea
          rows={2}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder={
            isJointRoom
              ? `Speak directly to ${otherPartner.name} (Middleman moderates)...`
              : `Express what happened to Middleman. Jordan cannot see this...`
          }
          disabled={isLoading}
          className="w-full bg-transparent text-sm text-[#f5efe6] placeholder-[#6d665c] resize-none focus:outline-none custom-scrollbar leading-relaxed"
        />

        <div className="flex items-center justify-between pt-2 border-t border-[#23201d] text-xs">
          {/* Privacy & Safety indicator */}
          <div className="flex items-center gap-2 text-[#7d766b]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#9bb098]" />
            <span className="text-[11px] font-mono">
              {isJointRoom ? 'Facilitated Dialogue' : 'Acoustic Shield Active · Protected'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* 60-Second Timeout Trigger */}
            {onTriggerTimeout && (
              <button
                type="button"
                onClick={onTriggerTimeout}
                className="px-2.5 py-1 text-[11px] text-[#9c958a] hover:text-[#e8e4dc] hover:bg-[#25221e] rounded border border-[#332f2a] transition-colors flex items-center gap-1"
                title="Ze Frank Clean Fight: Request a mandatory 60s breathing timeout"
              >
                <Timer className="w-3 h-3 text-[#d4975c]" />
                <span className="hidden sm:inline">60s Timeout</span>
              </button>
            )}

            {/* Contrastruct Lens Button */}
            <button
              type="button"
              onClick={handleDeconstruct}
              disabled={!inputText.trim() || isAnalyzing}
              className="px-2.5 py-1 text-[11px] text-[#d4975c] hover:bg-[#27211b] disabled:opacity-40 disabled:hover:bg-transparent rounded border border-[#423326] transition-colors flex items-center gap-1"
              title="Deconstruct your statement using Contrastruction before sending"
            >
              <Sparkles className="w-3 h-3" />
              <span>{showAnalysisDrawer ? 'Hide Lens' : 'Test Contrastruction'}</span>
            </button>

            {/* Submit Button */}
            <button
              type="button"
              onClick={() => handleSend()}
              disabled={!inputText.trim() || isLoading}
              className={`h-7 px-3 text-xs font-semibold rounded flex items-center gap-1.5 transition-all ${
                isLoading
                  ? 'bg-[#29221c] text-[#d4975c] border border-[#d4975c]/40 cursor-wait'
                  : justSent
                  ? 'bg-[#1b251d] text-[#9bb098] border border-[#9bb098]/40'
                  : !inputText.trim()
                  ? 'bg-[#24211e] text-[#615a51] cursor-not-allowed'
                  : 'bg-[#d4975c] hover:bg-[#c28448] text-[#141312] cursor-pointer shadow-xs active:scale-95'
              }`}
            >
              {isLoading ? (
                <span className="italic font-editorial text-[11px]">Transducing...</span>
              ) : justSent ? (
                <>
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Heard</span>
                </>
              ) : (
                <>
                  <span>Send</span>
                  <Send className="w-3 h-3" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
