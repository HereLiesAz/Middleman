import React, { useState } from 'react';
import { X, FolderGit2, Plus } from 'lucide-react';

interface ScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectScenario: (scenarioId: string, customData?: any) => void;
  currentScenarioTitle: string;
}

export const ScenarioModal: React.FC<ScenarioModalProps> = ({
  isOpen,
  onClose,
  onSelectScenario,
  currentScenarioTitle
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');
  const [customA, setCustomA] = useState('');
  const [customB, setCustomB] = useState('');
  const [customTopic, setCustomTopic] = useState('');

  if (!isOpen) return null;

  const presets = [
    {
      id: 'anniversary_overwork',
      title: 'The Forgotten Anniversary & Overwork',
      partners: 'Alex & Jordan',
      desc: 'Alex feels devastated when Jordan stayed late at work on their 5th anniversary. Jordan is terrified of company layoffs and feels crushed that their dedication to providing is received with resentment.'
    },
    {
      id: 'chores_mental_load',
      title: 'Chores & The Invisible Mental Load',
      partners: 'Morgan & Sam',
      desc: 'Morgan is burnt out carrying all domestic management and meal planning. Sam feels constantly scrutinized and that nothing they do around the house is ever appreciated.'
    },
    {
      id: 'holiday_inlaws',
      title: 'Holiday Travel & In-Law Boundaries',
      partners: 'Riley & Taylor',
      desc: 'Riley desperately needs rest and decompression at home after burnout; Taylor promised their family they would travel across states for an intense week of gatherings.'
    }
  ];

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customA.trim() || !customB.trim()) return;
    onSelectScenario('custom', {
      customPartnerA: customA.trim(),
      customPartnerB: customB.trim(),
      customTopic: customTopic.trim() || 'Custom Couple Dispute'
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-[#181716] border border-[#2b2824] max-w-lg w-full rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-[#1d1b19] border-b border-[#262421] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#282420] border border-[#3d372e] flex items-center justify-center text-[#d4975c]">
              <FolderGit2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-editorial text-lg text-[#f4efe6]">
                Select Dispute Scenario
              </h3>
              <p className="text-xs text-[#9c958a]">
                Choose an archetype or configure your own
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

        {/* Tabs */}
        <div className="flex border-b border-[#262421] bg-[#161514] px-5 pt-2.5 gap-2 text-xs">
          <button
            onClick={() => setActiveTab('presets')}
            className={`pb-2.5 px-2 font-medium border-b-2 transition-colors ${
              activeTab === 'presets'
                ? 'border-[#d4975c] text-[#f4efe6]'
                : 'border-transparent text-[#8a8377] hover:text-[#e8e4dc]'
            }`}
          >
            Pre-built Disagreements
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`pb-2.5 px-2 font-medium border-b-2 transition-colors ${
              activeTab === 'custom'
                ? 'border-[#d4975c] text-[#f4efe6]'
                : 'border-transparent text-[#8a8377] hover:text-[#e8e4dc]'
            }`}
          >
            Custom Conflict
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1 custom-scrollbar text-xs">
          {activeTab === 'presets' ? (
            <div className="space-y-3">
              {presets.map((preset) => {
                const isSelected = currentScenarioTitle === preset.title;
                return (
                  <button
                    key={preset.id}
                    onClick={() => {
                      onSelectScenario(preset.id);
                      onClose();
                    }}
                    className={`w-full text-left p-4 rounded-lg border transition-all flex flex-col gap-1.5 ${
                      isSelected
                        ? 'bg-[#211e1b] border-[#d4975c] shadow-xs'
                        : 'bg-[#141312] border-[#282623] hover:border-[#38332c] hover:bg-[#1a1917]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-editorial text-sm font-medium text-[#f4efe6]">
                        {preset.title}
                      </span>
                      <span className="text-[11px] text-[#8a8377]">
                        {preset.partners}
                      </span>
                    </div>
                    <p className="text-xs text-[#a8a195] leading-relaxed">
                      {preset.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          ) : (
            <form onSubmit={handleCustomSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[#bbb3a6] font-medium mb-1">
                  Partner A Name:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maya"
                  value={customA}
                  onChange={(e) => setCustomA(e.target.value)}
                  className="w-full bg-[#141312] border border-[#2e2b27] rounded-md px-3 py-2 text-[#f4efe6] placeholder-[#615b52] focus:outline-none focus:border-[#d4975c]"
                />
              </div>

              <div>
                <label className="block text-[#bbb3a6] font-medium mb-1">
                  Partner B Name:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. David"
                  value={customB}
                  onChange={(e) => setCustomB(e.target.value)}
                  className="w-full bg-[#141312] border border-[#2e2b27] rounded-md px-3 py-2 text-[#f4efe6] placeholder-[#615b52] focus:outline-none focus:border-[#d4975c]"
                />
              </div>

              <div>
                <label className="block text-[#bbb3a6] font-medium mb-1">
                  Conflict Topic / Core Issue:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Disagreement over relocating or holiday commitments"
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  className="w-full bg-[#141312] border border-[#2e2b27] rounded-md px-3 py-2 text-[#f4efe6] placeholder-[#615b52] focus:outline-none focus:border-[#d4975c]"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-2.5 bg-[#d4975c] hover:bg-[#c4874d] text-[#141312] font-semibold rounded-md transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Initialize Custom Session</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
