import React, { useState } from 'react';
import { X, FolderGit2, Check, Sparkles, PlusCircle } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-stone-900 border border-stone-700 max-w-xl w-full rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-stone-950/80 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-600/20 border border-teal-500/40 flex items-center justify-center text-teal-400">
              <FolderGit2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-stone-100">
                Select Couple Mediation Scenario
              </h3>
              <p className="text-xs text-stone-400">
                Choose a realistic dispute or enter your own
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

        {/* Tabs */}
        <div className="flex border-b border-stone-800 bg-stone-950/40 px-4 pt-2">
          <button
            onClick={() => setActiveTab('presets')}
            className={`px-4 py-2 text-xs font-medium border-b-2 transition-all ${
              activeTab === 'presets'
                ? 'border-teal-500 text-teal-400'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            Pre-built Disagreements
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`px-4 py-2 text-xs font-medium border-b-2 transition-all ${
              activeTab === 'custom'
                ? 'border-teal-500 text-teal-400'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            Custom Conflict
          </button>
        </div>

        {/* Body */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1 custom-scrollbar">
          {activeTab === 'presets' ? (
            <div className="space-y-2.5">
              {presets.map((preset) => {
                const isSelected = currentScenarioTitle === preset.title;
                return (
                  <button
                    key={preset.id}
                    onClick={() => {
                      onSelectScenario(preset.id);
                      onClose();
                    }}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all flex flex-col gap-1 ${
                      isSelected
                        ? 'bg-teal-950/40 border-teal-600/70 shadow-sm ring-1 ring-teal-500/30'
                        : 'bg-stone-950/60 border-stone-800 hover:border-stone-700 hover:bg-stone-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-stone-100 text-sm">
                        {preset.title}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-800 text-stone-300">
                        {preset.partners}
                      </span>
                    </div>
                    <p className="text-xs text-stone-400 leading-relaxed mt-1">
                      {preset.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          ) : (
            <form onSubmit={handleCustomSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-300 font-medium mb-1">
                  Partner A Name:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maya"
                  value={customA}
                  onChange={(e) => setCustomA(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-stone-100 placeholder-stone-600 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-stone-300 font-medium mb-1">
                  Partner B Name:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. David"
                  value={customB}
                  onChange={(e) => setCustomB(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-stone-100 placeholder-stone-600 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-stone-300 font-medium mb-1">
                  Conflict Topic / Core Issue:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Disagreement over moving cities or saving money"
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-stone-100 placeholder-stone-600 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-3 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-medium rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Initialize Custom Session</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
