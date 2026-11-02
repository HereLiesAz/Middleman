import React from 'react';
import {
  Scale,
  BookOpen,
  User,
  Users,
  Lock,
  ArrowRightLeft,
  Timer,
  FolderGit2,
  FileText,
  Columns,
  Sparkles
} from 'lucide-react';
import { MediationSession, PartnerId, UserProfile } from '../types/mediation';

export type ViewMode = 'split' | 'private_a' | 'private_b' | 'joint';

interface HeaderProps {
  session: MediationSession;
  activeView: ViewMode;
  onSelectView: (view: ViewMode) => void;
  onOpenScenarios: () => void;
  onOpenContrastructionLab: () => void;
  onOpenBridgeNotes: () => void;
  onOpenUserProfile: () => void;
  onOpenZeFrankPlaybook: () => void;
  onOpenTimeoutModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  session,
  activeView,
  onSelectView,
  onOpenScenarios,
  onOpenContrastructionLab,
  onOpenBridgeNotes,
  onOpenUserProfile,
  onOpenZeFrankPlaybook,
  onOpenTimeoutModal
}) => {
  const { readiness, jointRoomUnlocked, partnerA, partnerB } = session;

  return (
    <header className="bg-[#181716] border-b border-[#2a2825] text-[#e8e4dc] sticky top-0 z-30 transition-colors">
      <div className="max-w-[1720px] mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-2">
          {/* Brand Identity */}
          <div className="flex items-center space-x-3 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-[#242220] border border-[#38342f] flex items-center justify-center text-[#d4975c]">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-editorial text-xl font-medium tracking-normal text-[#f4efe6]">
                  Middleman
                </span>
                <span className="text-[10px] text-[#9c958a] tracking-wider uppercase font-mono hidden md:inline">
                  AI Conflict Mediator & Rhetorical Transducer
                </span>
              </div>
            </div>
          </div>

          {/* Master View Mode Switcher: Spatial Dual Theatre vs Focused Solo vs Joint */}
          <nav className="flex items-center bg-[#131211] p-1 rounded-lg border border-[#2a2825] overflow-x-auto scrollbar-none">
            {/* Dual Horizon Theatre Tab */}
            <button
              onClick={() => onSelectView('split')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all shrink-0 ${
                activeView === 'split'
                  ? 'bg-[#262421] text-[#f4efe6] shadow-xs border border-[#3a352e]'
                  : 'text-[#8f887d] hover:text-[#e8e4dc]'
              }`}
              title="Dual-Chamber Horizon: Both chambers + Middleman bridge visible simultaneously"
            >
              <Columns className="w-3.5 h-3.5 text-[#d4975c]" />
              <span>Dual Horizon</span>
              <span className="hidden lg:inline text-[9px] text-[#716a5f] font-mono">[Master]</span>
            </button>

            {/* Partner A Private Room */}
            <button
              onClick={() => onSelectView('private_a')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all shrink-0 ${
                activeView === 'private_a'
                  ? 'bg-[#262421] text-[#f4efe6] shadow-xs border border-[#3a352e]'
                  : 'text-[#8f887d] hover:text-[#e8e4dc]'
              }`}
              title={`Confidential chamber for ${partnerA.name}`}
            >
              <User className="w-3.5 h-3.5 text-[#d4975c]" />
              <span>{partnerA.name}'s Room</span>
            </button>

            {/* Partner B Private Room */}
            <button
              onClick={() => onSelectView('private_b')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all shrink-0 ${
                activeView === 'private_b'
                  ? 'bg-[#262421] text-[#f4efe6] shadow-xs border border-[#3a352e]'
                  : 'text-[#8f887d] hover:text-[#e8e4dc]'
              }`}
              title={`Confidential chamber for ${partnerB.name}`}
            >
              <User className="w-3.5 h-3.5 text-[#d4975c]" />
              <span>{partnerB.name}'s Room</span>
            </button>

            {/* Joint Room Tab */}
            <button
              onClick={() => onSelectView('joint')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all shrink-0 ${
                activeView === 'joint'
                  ? 'bg-[#262421] text-[#f4efe6] shadow-xs border border-[#3a352e]'
                  : jointRoomUnlocked
                  ? 'text-[#9bb098] hover:text-[#f4efe6]'
                  : 'text-[#615b52] hover:text-[#8f887d]'
              }`}
              title={
                jointRoomUnlocked
                  ? 'Joint Room Unlocked: Facilitated direct dialogue'
                  : `Joint Room Protected (${readiness.score}% readiness reached)`
              }
            >
              {jointRoomUnlocked ? (
                <Users className="w-3.5 h-3.5 text-[#9bb098]" />
              ) : (
                <Lock className="w-3 h-3 text-[#615b52]" />
              )}
              <span>Joint Sanctuary</span>
              <span className="text-[10px] text-[#787166] font-mono">
                {jointRoomUnlocked ? 'Open' : `${readiness.score}%`}
              </span>
            </button>
          </nav>

          {/* Right Action Tools */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Contrastruction Rhetoric Lab */}
            <button
              onClick={onOpenContrastructionLab}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-[#d4975c] bg-[#221d18] hover:bg-[#2b241d] border border-[#3f3123] rounded-md transition-colors"
              title="Interactive Contrastruction Laboratory & Rhetoric Workbench"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline font-medium">Rhetoric Lab</span>
            </button>

            {/* Clean Fight Playbook */}
            <button
              onClick={onOpenZeFrankPlaybook}
              className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-[#b8b0a2] hover:text-[#f4efe6] hover:bg-[#23211f] rounded-md transition-colors"
              title="Ze Frank's Clean Fight Principles"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#d4975c]" />
              <span className="hidden lg:inline">Clean Fight</span>
            </button>

            {/* 60s Timeout */}
            <button
              onClick={onOpenTimeoutModal}
              className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-[#b8b0a2] hover:text-[#f4efe6] hover:bg-[#23211f] rounded-md transition-colors"
              title="Take a 60-second breathing timeout"
            >
              <Timer className="w-3.5 h-3.5 text-[#c96f53]" />
              <span className="hidden lg:inline">Timeout</span>
            </button>

            {/* Middleman Dossier */}
            <button
              onClick={onOpenBridgeNotes}
              className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-[#b8b0a2] hover:text-[#f4efe6] hover:bg-[#23211f] rounded-md transition-colors"
              title="Perspective tracking & negotiated ground"
            >
              <FileText className="w-3.5 h-3.5 text-[#9bb098]" />
              <span className="hidden lg:inline">Dossier</span>
            </button>

            {/* Scenario Switcher */}
            <button
              onClick={onOpenScenarios}
              className="p-1.5 text-[#8f887d] hover:text-[#e8e4dc] hover:bg-[#23211f] rounded-md transition-colors"
              title="Change dispute scenario"
            >
              <FolderGit2 className="w-3.5 h-3.5" />
            </button>

            {/* Profiles */}
            <button
              onClick={onOpenUserProfile}
              className="p-1.5 text-[#8f887d] hover:text-[#e8e4dc] hover:bg-[#23211f] rounded-md transition-colors"
              title="User profiles & interaction histories"
            >
              <User className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
