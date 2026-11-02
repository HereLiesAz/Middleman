import React from 'react';
import {
  HeartHandshake,
  Scale,
  BookOpen,
  FolderGit2,
  Columns,
  User,
  Users,
  Lock,
  Sparkles,
  BarChart3
} from 'lucide-react';
import { MediationSession, PartnerId } from '../types/mediation';

interface HeaderProps {
  session: MediationSession;
  activeView: 'partner_a' | 'partner_b' | 'split' | 'joint';
  onSelectView: (view: 'partner_a' | 'partner_b' | 'split' | 'joint') => void;
  onOpenScenarios: () => void;
  onOpenContrastructionInfo: () => void;
  onOpenBridgeNotes: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  session,
  activeView,
  onSelectView,
  onOpenScenarios,
  onOpenContrastructionInfo,
  onOpenBridgeNotes
}) => {
  const { readiness, jointRoomUnlocked, partnerA, partnerB } = session;

  return (
    <header className="bg-stone-900 border-b border-stone-800 text-stone-100 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Tagline */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-sm ring-1 ring-emerald-400/30">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-lg tracking-tight text-stone-100">
                  Middleman
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 font-medium">
                  AI Conflict Mediator
                </span>
              </div>
              <p className="text-xs text-stone-400 hidden sm:block">
                Bridging couples through rhetorical contrastruction & compassionate inquiry
              </p>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="flex items-center bg-stone-950/70 p-1 rounded-xl border border-stone-800 overflow-x-auto max-w-[65%] sm:max-w-none scrollbar-none">
            {/* Partner A Tab */}
            <button
              onClick={() => onSelectView('partner_a')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-lg transition-colors shrink-0 ${
                activeView === 'partner_a'
                  ? 'bg-emerald-700/80 text-emerald-100 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
              }`}
              title={`Private session for ${partnerA.name}`}
            >
              <User className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{partnerA.name}</span>
              <span className="hidden sm:inline text-[10px] px-1 rounded bg-stone-800 text-stone-300">
                Private
              </span>
            </button>

            {/* Partner B Tab */}
            <button
              onClick={() => onSelectView('partner_b')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-lg transition-colors shrink-0 ${
                activeView === 'partner_b'
                  ? 'bg-amber-700/80 text-amber-100 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
              }`}
              title={`Private session for ${partnerB.name}`}
            >
              <User className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{partnerB.name}</span>
              <span className="hidden sm:inline text-[10px] px-1 rounded bg-stone-800 text-stone-300">
                Private
              </span>
            </button>

            {/* Split View Tab (Desktop/Tablet) */}
            <button
              onClick={() => onSelectView('split')}
              className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors shrink-0 ${
                activeView === 'split'
                  ? 'bg-stone-700 text-stone-100 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
              }`}
              title="Split View (Watch both sides simultaneously)"
            >
              <Columns className="w-3.5 h-3.5 text-stone-300" />
              <span>Dual View</span>
            </button>

            {/* Joint Room Tab */}
            <button
              onClick={() => onSelectView('joint')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-lg transition-all shrink-0 ${
                activeView === 'joint'
                  ? 'bg-teal-600 text-white shadow-sm ring-1 ring-teal-400/40'
                  : jointRoomUnlocked
                  ? 'text-teal-300 bg-teal-950/50 hover:bg-teal-900/60 ring-1 ring-teal-500/40'
                  : 'text-stone-500 hover:text-stone-400'
              }`}
              title={
                jointRoomUnlocked
                  ? 'Joint Room Unlocked: Direct conversation mediated by Middleman'
                  : `Joint Room Locked (${readiness.score}% readiness reached)`
              }
            >
              {jointRoomUnlocked ? (
                <Users className="w-3.5 h-3.5 text-teal-300 shrink-0" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-stone-500 shrink-0" />
              )}
              <span>Joint</span>
              <span
                className={`text-[10px] px-1 py-0.2 rounded font-mono ${
                  jointRoomUnlocked
                    ? 'bg-teal-400/20 text-teal-200'
                    : 'bg-stone-800 text-stone-400'
                }`}
              >
                {jointRoomUnlocked ? 'OPEN' : `${readiness.score}%`}
              </span>
            </button>
          </nav>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2">
            {/* Scenarios Button */}
            <button
              onClick={onOpenScenarios}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-stone-800/80 text-stone-300 hover:bg-stone-700 hover:text-stone-100 transition-colors border border-stone-700"
              title="Change conflict scenario or start fresh"
            >
              <FolderGit2 className="w-3.5 h-3.5 text-stone-400" />
              <span className="hidden lg:inline">Scenarios</span>
            </button>

            {/* Contrastruction Info Button */}
            <button
              onClick={onOpenContrastructionInfo}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-stone-800/80 text-stone-300 hover:bg-stone-700 hover:text-stone-100 transition-colors border border-stone-700"
              title="What is Contrastruction?"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden lg:inline">Contrastruction</span>
            </button>

            {/* Bridge Dossier / Readiness Drawer Toggle */}
            <button
              onClick={onOpenBridgeNotes}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-emerald-950/70 text-emerald-300 hover:bg-emerald-900/80 transition-colors border border-emerald-800/60"
              title="Open Middleman's Bridge Notes & Readiness"
            >
              <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Bridge Notes</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
