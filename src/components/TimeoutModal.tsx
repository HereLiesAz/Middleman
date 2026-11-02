import React, { useState, useEffect } from 'react';
import { Wind, X, RotateCcw, Check } from 'lucide-react';

interface TimeoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmTimeoutToBackend?: () => void;
  partnerName: string;
}

export const TimeoutModal: React.FC<TimeoutModalProps> = ({
  isOpen,
  onClose,
  onConfirmTimeoutToBackend,
  partnerName
}) => {
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [breathPhase, setBreathPhase] = useState<'Inhale' | 'Hold' | 'Exhale' | 'Settle'>('Inhale');
  const [phaseSeconds, setPhaseSeconds] = useState(4);
  const [isActive, setIsActive] = useState(true);

  // 60-second countdown
  useEffect(() => {
    if (!isOpen) {
      setSecondsLeft(60);
      setIsActive(true);
      return;
    }

    if (!isActive || secondsLeft <= 0) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, isActive, secondsLeft]);

  // Box Breathing cycle (4s Inhale, 4s Hold, 4s Exhale, 4s Settle)
  useEffect(() => {
    if (!isOpen || !isActive || secondsLeft <= 0) return;

    const breathInterval = setInterval(() => {
      setPhaseSeconds((prev) => {
        if (prev <= 1) {
          setBreathPhase((current) => {
            if (current === 'Inhale') return 'Hold';
            if (current === 'Hold') return 'Exhale';
            if (current === 'Exhale') return 'Settle';
            return 'Inhale';
          });
          return 4;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(breathInterval);
  }, [isOpen, isActive, secondsLeft]);

  if (!isOpen) return null;

  const handleComplete = () => {
    if (onConfirmTimeoutToBackend) {
      onConfirmTimeoutToBackend();
    }
    onClose();
  };

  const handleRestart = () => {
    setSecondsLeft(60);
    setBreathPhase('Inhale');
    setPhaseSeconds(4);
    setIsActive(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-[#191816] border border-[#2b2824] rounded-xl w-full max-w-sm p-6 flex flex-col items-center text-center shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-[#8f887d] hover:text-[#f4efe6] hover:bg-[#242220] rounded-md transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Calm Icon */}
        <div className="w-10 h-10 rounded-lg bg-[#24211e] border border-[#3b352e] flex items-center justify-center text-[#d4975c] mb-3">
          <Wind className="w-5 h-5" />
        </div>

        <h3 className="font-editorial text-xl text-[#f4efe6] mb-1">
          A Nervous System Pause
        </h3>
        <p className="text-xs text-[#9c958a] mb-6 max-w-xs leading-relaxed">
          Ze Frank's rule for conflict: When your pulse elevates, empathy shuts down. Take 60 seconds to reset.
        </p>

        {/* Meditative Breathing Guide */}
        <div className="relative w-40 h-40 flex items-center justify-center mb-6">
          <div
            className={`absolute inset-0 rounded-full border transition-all duration-1000 ${
              breathPhase === 'Inhale'
                ? 'scale-105 border-[#d4975c]/70 bg-[#d4975c]/5'
                : breathPhase === 'Hold'
                ? 'scale-105 border-[#9bb098]/70 bg-[#9bb098]/5'
                : breathPhase === 'Exhale'
                ? 'scale-95 border-[#8a8479]/60 bg-[#8a8479]/5'
                : 'scale-90 border-[#3d3832] bg-transparent'
            }`}
          />

          <div className="z-10 flex flex-col items-center justify-center">
            <span className="font-editorial text-2xl italic tracking-wide text-[#f4efe6]">
              {breathPhase}
            </span>
            <span className="text-xs text-[#d4975c] font-mono mt-1">
              {phaseSeconds}s
            </span>
            <span className="text-[10px] text-[#6d675c] font-mono mt-2">
              {secondsLeft}s remaining
            </span>
          </div>
        </div>

        {/* Grounding Principle */}
        <div className="bg-[#141312] border border-[#262421] rounded-lg p-3 mb-6 text-xs text-[#bbb2a4] font-editorial italic max-w-xs leading-relaxed">
          "We are not adversaries in a courtroom; we are two people who care for each other trying to bridge a gap."
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2.5 w-full">
          <button
            onClick={handleRestart}
            className="p-2.5 rounded-lg border border-[#332f2a] bg-[#1e1c1a] hover:bg-[#262320] text-[#9c958a] transition-colors"
            title="Restart 60s"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleComplete}
            className="flex-1 py-2.5 px-4 rounded-lg bg-[#d4975c] hover:bg-[#c4874d] text-[#141312] font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
          >
            <Check className="w-4 h-4" />
            <span>I Am Ready to Resume</span>
          </button>
        </div>
      </div>
    </div>
  );
};
