import React, { useState, useEffect } from 'react';
import { Header, ViewMode } from './components/Header';
import { DualChamberView } from './components/DualChamberView';
import { JointSanctuaryView } from './components/JointSanctuaryView';
import { ChatView } from './components/ChatView';
import { ContrastructionModal } from './components/ContrastructionModal';
import { BridgeNotesDrawer } from './components/BridgeNotesDrawer';
import { ScenarioModal } from './components/ScenarioModal';
import { UserProfileModal } from './components/UserProfileModal';
import { ZeFrankPlaybookModal } from './components/ZeFrankPlaybookModal';
import { TimeoutModal } from './components/TimeoutModal';
import { MediationSession, PartnerId } from './types/mediation';
import {
  Lock,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Activity,
  Layers,
  ArrowRight
} from 'lucide-react';

export default function App() {
  const [session, setSession] = useState<MediationSession | null>(null);
  const [activeView, setActiveView] = useState<ViewMode>('split');
  const [isLoading, setIsLoading] = useState(false);
  const [isScenarioModalOpen, setIsScenarioModalOpen] = useState(false);
  const [isContrastructionModalOpen, setIsContrastructionModalOpen] = useState(false);
  const [isUserProfileModalOpen, setIsUserProfileModalOpen] = useState(false);
  const [isBridgeNotesOpen, setIsBridgeNotesOpen] = useState(false);
  const [isZeFrankPlaybookOpen, setIsZeFrankPlaybookOpen] = useState(false);
  const [isTimeoutModalOpen, setIsTimeoutModalOpen] = useState(false);
  const [forceUnlockJoint, setForceUnlockJoint] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [privacyToast, setPrivacyToast] = useState<string | null>(null);

  // Fetch session
  const fetchSession = async () => {
    try {
      const res = await fetch('/api/mediation/session');
      if (res.ok) {
        const data = await res.json();
        setSession(data);
      }
    } catch (err) {
      console.error('Failed to load session:', err);
      setErrorNotice('Could not connect to Middleman backend.');
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  // Send message for Partner A
  const handleSendMessageA = async (text: string) => {
    if (!session) return;
    setIsLoading(true);
    setErrorNotice(null);
    try {
      const res = await fetch('/api/mediation/private-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerId: 'partner_a',
          userId: session.partnerA.userId,
          text
        })
      });
      if (!res.ok) throw new Error('Message transmission failed');
      const updated = await res.json();
      setSession(updated);

      if (updated.jointRoomUnlocked && !session.jointRoomUnlocked) {
        setPrivacyToast('Consensus threshold reached (70%). The Joint Sanctuary is now unlocked.');
      }
    } catch (err: any) {
      console.error('Send error:', err);
      setErrorNotice(err.message || 'Error communicating with Middleman.');
    } finally {
      setIsLoading(false);
    }
  };

  // Send message for Partner B
  const handleSendMessageB = async (text: string) => {
    if (!session) return;
    setIsLoading(true);
    setErrorNotice(null);
    try {
      const res = await fetch('/api/mediation/private-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerId: 'partner_b',
          userId: session.partnerB.userId,
          text
        })
      });
      if (!res.ok) throw new Error('Message transmission failed');
      const updated = await res.json();
      setSession(updated);

      if (updated.jointRoomUnlocked && !session.jointRoomUnlocked) {
        setPrivacyToast('Consensus threshold reached (70%). The Joint Sanctuary is now unlocked.');
      }
    } catch (err: any) {
      console.error('Send error:', err);
      setErrorNotice(err.message || 'Error communicating with Middleman.');
    } finally {
      setIsLoading(false);
    }
  };

  // Send message in Joint Sanctuary
  const handleSendJointMessage = async (text: string, senderId: PartnerId) => {
    if (!session) return;
    setIsLoading(true);
    setErrorNotice(null);
    try {
      const res = await fetch('/api/mediation/joint-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId,
          text
        })
      });
      if (!res.ok) throw new Error('Joint message failed');
      const updated = await res.json();
      setSession(updated);
    } catch (err: any) {
      console.error('Joint send error:', err);
      setErrorNotice(err.message || 'Error in Joint Sanctuary.');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset or change scenario
  const handleSelectScenario = async (scenarioId: string, customData?: any) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/mediation/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioId,
          ...customData
        })
      });
      if (res.ok) {
        const data = await res.json();
        setSession(data);
        setActiveView('split');
        setForceUnlockJoint(false);
      }
    } catch (err) {
      console.error('Failed to change scenario:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Ze Frank timeout request to backend
  const handleTriggerTimeout = async (partnerId: PartnerId) => {
    if (!session) return;
    try {
      const activeUser = partnerId === 'partner_a' ? session.partnerA : session.partnerB;
      const res = await fetch('/api/mediation/timeout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerId,
          userId: activeUser.userId,
          chatType: activeView === 'joint' ? 'joint' : 'private'
        })
      });
      if (res.ok) {
        const updated = await res.json();
        setSession(updated);
        setIsTimeoutModalOpen(true);
      }
    } catch (err) {
      console.error('Failed to trigger timeout:', err);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-[#141312] flex flex-col items-center justify-center text-[#e8e4dc]">
        <div className="w-8 h-8 rounded-full border border-[#d4975c] border-t-transparent animate-spin mb-4" />
        <p className="font-editorial text-lg text-[#c7baa7] italic">Preparing Middleman's Acoustic Chambers...</p>
      </div>
    );
  }

  const isJointAvailable = session.jointRoomUnlocked || forceUnlockJoint;

  return (
    <div className="h-screen overflow-hidden bg-[#121110] text-[#e8e4dc] flex flex-col font-ui selection:bg-[#d4975c]/25 selection:text-[#f7f5f0]">
      {/* Master Mediation Control Header */}
      <Header
        session={session}
        activeView={activeView}
        onSelectView={setActiveView}
        onOpenScenarios={() => setIsScenarioModalOpen(true)}
        onOpenContrastructionLab={() => setIsContrastructionModalOpen(true)}
        onOpenBridgeNotes={() => setIsBridgeNotesOpen(true)}
        onOpenUserProfile={() => setIsUserProfileModalOpen(true)}
        onOpenZeFrankPlaybook={() => setIsZeFrankPlaybookOpen(true)}
        onOpenTimeoutModal={() => setIsTimeoutModalOpen(true)}
      />

      {/* Mediation Status Context Ribbon */}
      <div className="bg-[#181715] border-b border-[#25221e] px-4 py-2 text-xs">
        <div className="max-w-[1720px] mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[#9c958a]">
            <span className="text-[#d4975c] font-medium uppercase font-mono text-[10px]">
              Active Dispute:
            </span>
            <span className="text-[#f4efe6] font-medium">{session.scenarioTitle}</span>
            <span className="text-[#5c564c] hidden md:inline">—</span>
            <span className="text-[#8c8578] hidden md:inline truncate max-w-xl">
              {session.scenarioDescription}
            </span>
          </div>

          <div className="flex items-center gap-4 text-[#8c8578] text-[11px]">
            <div className="flex items-center gap-1.5 font-mono">
              <span>Bridge Readiness:</span>
              <span className={`font-bold ${session.readiness.score >= 70 ? 'text-[#9bb098]' : 'text-[#d4975c]'}`}>
                {session.readiness.score}%
              </span>
            </div>

            <button
              onClick={() => setIsBridgeNotesOpen(true)}
              className="text-[#9bb098] hover:text-[#c4d6c1] transition-colors"
            >
              Mediation Dossier ({session.bridgeNotes.commonGround.length} shared anchors)
            </button>
          </div>
        </div>
      </div>

      {/* Privacy Notice Banner if Triggered */}
      {privacyToast && (
        <div className="bg-[#1b221d] border-b border-[#2d3a30] text-[#cde0cb] px-4 py-2 text-xs flex items-center justify-between animate-in fade-in duration-300">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-[#9bb098] shrink-0" />
            <span>{privacyToast}</span>
          </div>
          <button
            onClick={() => setPrivacyToast(null)}
            className="text-[#8ea38a] hover:text-white text-xs underline ml-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Error Banner */}
      {errorNotice && (
        <div className="bg-[#261c1a] border-b border-[#452823] text-[#e0a89d] px-4 py-2 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-[#c96f53]" />
            <span>{errorNotice}</span>
          </div>
          <button
            onClick={() => setErrorNotice(null)}
            className="text-[#9c958a] hover:text-[#e8e4dc] text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* MAIN SPATIAL WORKSPACE                                   */}
      {/* ======================================================== */}
      <main className="flex-1 max-w-[1720px] w-full mx-auto p-2 sm:p-3 flex flex-col overflow-hidden">
        {/* VIEW 1: Dual Horizon Split-Chamber Theatre (The Master Experience) */}
        {activeView === 'split' && (
          <div className="flex-1 h-full flex flex-col overflow-hidden">
            <DualChamberView
              session={session}
              onSendMessageA={handleSendMessageA}
              onSendMessageB={handleSendMessageB}
              isLoading={isLoading}
              onOpenJointRoom={() => setActiveView('joint')}
              onOpenContrastructionLab={() => setIsContrastructionModalOpen(true)}
              onOpenZeFrankModal={() => setIsZeFrankPlaybookOpen(true)}
              onTriggerTimeout={handleTriggerTimeout}
              onFocusChamber={(id) => setActiveView(id === 'partner_a' ? 'private_a' : 'private_b')}
              forceUnlockJoint={forceUnlockJoint}
              setForceUnlockJoint={setForceUnlockJoint}
            />
          </div>
        )}

        {/* VIEW 2: Partner A Dedicated Focus Chamber */}
        {activeView === 'private_a' && (
          <div className="h-[calc(100vh-140px)] min-h-[550px] max-w-4xl mx-auto w-full">
            <ChatView
              partnerA={session.partnerA}
              partnerB={session.partnerB}
              messages={session.privateMessagesA}
              chatType="private_a"
              currentPartnerId="partner_a"
              jointRoomUnlocked={session.jointRoomUnlocked}
              onSendMessage={(text) => handleSendMessageA(text)}
              isLoading={isLoading}
              scenarioTitle={session.scenarioTitle}
            />
          </div>
        )}

        {/* VIEW 3: Partner B Dedicated Focus Chamber */}
        {activeView === 'private_b' && (
          <div className="h-[calc(100vh-140px)] min-h-[550px] max-w-4xl mx-auto w-full">
            <ChatView
              partnerA={session.partnerA}
              partnerB={session.partnerB}
              messages={session.privateMessagesB}
              chatType="private_b"
              currentPartnerId="partner_b"
              jointRoomUnlocked={session.jointRoomUnlocked}
              onSendMessage={(text) => handleSendMessageB(text)}
              isLoading={isLoading}
              scenarioTitle={session.scenarioTitle}
            />
          </div>
        )}

        {/* VIEW 4: Facilitated Joint Sanctuary */}
        {activeView === 'joint' && (
          <div className="flex-1 flex flex-col">
            {!isJointAvailable ? (
              <div className="max-w-md mx-auto my-auto bg-[#181716] border border-[#2e2a25] rounded-2xl p-8 text-center space-y-4 shadow-xl">
                <div className="w-12 h-12 rounded-xl bg-[#26211c] border border-[#3e3428] flex items-center justify-center text-[#d4975c] mx-auto">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="font-editorial text-xl text-[#f4efe6]">
                  A Protected Pause in Dialogue
                </h3>
                <p className="text-xs text-[#9c958a] leading-relaxed">
                  Direct confrontation without de-escalation inflicts lasting emotional injury. In Middleman, separate rooms remain strictly confidential until both partners reach the readiness threshold.
                </p>

                <div className="bg-[#141312] border border-[#282521] p-3.5 rounded-lg text-left space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#8c8579]">Readiness Score:</span>
                    <span className="font-mono text-[#d4975c] font-bold">
                      {session.readiness.score}% / 70% Required
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[#22201d] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#d4975c] transition-all duration-500"
                      style={{ width: `${session.readiness.score}%` }}
                    />
                  </div>
                  <p className="text-[11px] font-editorial italic text-[#c4bcaa]">
                    "{session.readiness.summary}"
                  </p>
                </div>

                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => setActiveView('split')}
                    className="px-4 py-2 bg-[#d4975c] hover:bg-[#c28448] text-[#141312] text-xs font-semibold rounded-lg transition-colors"
                  >
                    Return to Dual Chambers
                  </button>
                  <button
                    onClick={() => setForceUnlockJoint(true)}
                    className="px-3 py-2 text-xs text-[#8c8579] hover:text-[#e8e4dc] border border-[#302c27] rounded-lg transition-colors"
                  >
                    Facilitator Override
                  </button>
                </div>
              </div>
            ) : (
              <JointSanctuaryView
                session={session}
                onSendMessage={handleSendJointMessage}
                isLoading={isLoading}
                onReturnToChambers={() => setActiveView('split')}
                onTriggerTimeout={handleTriggerTimeout}
                onOpenZeFrankModal={() => setIsZeFrankPlaybookOpen(true)}
              />
            )}
          </div>
        )}
      </main>

      {/* ======================================================== */}
      {/* MODALS & DRAWERS                                         */}
      {/* ======================================================== */}
      <ContrastructionModal
        isOpen={isContrastructionModalOpen}
        onClose={() => setIsContrastructionModalOpen(false)}
        onApplyBridge={(text) => handleSendMessageA(text)}
      />

      <ScenarioModal
        isOpen={isScenarioModalOpen}
        onClose={() => setIsScenarioModalOpen(false)}
        currentScenarioTitle={session.scenarioTitle}
        onSelectScenario={handleSelectScenario}
      />

      <UserProfileModal
        isOpen={isUserProfileModalOpen}
        onClose={() => setIsUserProfileModalOpen(false)}
        activeProfile={session.partnerA}
        otherProfile={session.partnerB}
        onSwitchUser={(id) => {
          setActiveView(id === 'partner_a' ? 'private_a' : 'private_b');
          setIsUserProfileModalOpen(false);
        }}
      />

      <BridgeNotesDrawer
        isOpen={isBridgeNotesOpen}
        onClose={() => setIsBridgeNotesOpen(false)}
        session={session}
        onEnterJointRoom={() => {
          setActiveView('joint');
          setIsBridgeNotesOpen(false);
        }}
      />

      <ZeFrankPlaybookModal
        isOpen={isZeFrankPlaybookOpen}
        onClose={() => setIsZeFrankPlaybookOpen(false)}
        onTriggerTimeout={() => handleTriggerTimeout('partner_a')}
      />

      <TimeoutModal
        isOpen={isTimeoutModalOpen}
        onClose={() => setIsTimeoutModalOpen(false)}
        partnerName={session.partnerA.name}
      />
    </div>
  );
}
