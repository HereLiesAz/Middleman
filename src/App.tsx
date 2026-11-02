import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ChatView } from './components/ChatView';
import { ContrastructionModal } from './components/ContrastructionModal';
import { BridgeNotesDrawer } from './components/BridgeNotesDrawer';
import { ScenarioModal } from './components/ScenarioModal';
import { MediationSession, PartnerId, Message } from './types/mediation';
import {
  Lock,
  Unlock,
  AlertCircle,
  Sparkles,
  HeartHandshake,
  ArrowRight,
  Info
} from 'lucide-react';

export default function App() {
  const [session, setSession] = useState<MediationSession | null>(null);
  const [activeView, setActiveView] = useState<'partner_a' | 'partner_b' | 'split' | 'joint'>('partner_a');
  const [isLoading, setIsLoading] = useState(false);
  const [isScenarioModalOpen, setIsScenarioModalOpen] = useState(false);
  const [isContrastructionModalOpen, setIsContrastructionModalOpen] = useState(false);
  const [isBridgeNotesOpen, setIsBridgeNotesOpen] = useState(false);
  const [forceUnlockJoint, setForceUnlockJoint] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Fetch current session
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

  // Send message handler
  const handleSendMessage = async (text: string, senderId?: PartnerId) => {
    if (!session) return;
    setIsLoading(true);
    setErrorNotice(null);

    try {
      if (activeView === 'joint') {
        const res = await fetch('/api/mediation/joint-message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            senderId: senderId || 'partner_a',
            text
          })
        });
        if (!res.ok) throw new Error('Joint message failed');
        const updated = await res.json();
        setSession(updated);
      } else {
        const partner = senderId || (activeView === 'partner_b' ? 'partner_b' : 'partner_a');
        const res = await fetch('/api/mediation/private-message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            partnerId: partner,
            text
          })
        });
        if (!res.ok) throw new Error('Private message failed');
        const updated = await res.json();
        setSession(updated);

        // If newly unlocked, give user an encouraging hint
        if (updated.jointRoomUnlocked && !session.jointRoomUnlocked) {
          setIsBridgeNotesOpen(true);
        }
      }
    } catch (err: any) {
      console.error('Send error:', err);
      setErrorNotice(err.message || 'Error communicating with Middleman.');
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
        setActiveView('partner_a');
        setForceUnlockJoint(false);
      }
    } catch (err) {
      console.error('Failed to change scenario:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center text-stone-200">
        <Sparkles className="w-8 h-8 text-teal-400 animate-spin mb-3" />
        <p className="text-sm font-medium">Initializing Middleman Mediation Engine...</p>
      </div>
    );
  }

  const isJointAvailable = session.jointRoomUnlocked || forceUnlockJoint;

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        session={session}
        activeView={activeView}
        onSelectView={setActiveView}
        onOpenScenarios={() => setIsScenarioModalOpen(true)}
        onOpenContrastructionInfo={() => setIsContrastructionModalOpen(true)}
        onOpenBridgeNotes={() => setIsBridgeNotesOpen(true)}
      />

      {/* Scenario Context Bar */}
      <div className="bg-stone-900/60 border-b border-stone-800/80 px-4 py-2">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-teal-400">Current Dispute:</span>
            <span className="text-stone-200 font-medium">{session.scenarioTitle}</span>
            <span className="text-stone-500 hidden sm:inline">—</span>
            <span className="text-stone-400 hidden sm:inline truncate max-w-md">
              {session.scenarioDescription}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-stone-400">
              <span>Readiness:</span>
              <span className="font-mono text-teal-300 font-bold">
                {session.readiness.score}%
              </span>
            </div>

            <button
              onClick={() => setIsBridgeNotesOpen(true)}
              className="text-emerald-400 hover:text-emerald-300 underline font-medium"
            >
              View Analysis
            </button>
          </div>
        </div>
      </div>

      {/* Error banner if any */}
      {errorNotice && (
        <div className="bg-rose-950/80 border-b border-rose-800 text-rose-200 px-4 py-2 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span>{errorNotice}</span>
          </div>
          <button
            onClick={() => setErrorNotice(null)}
            className="text-stone-400 hover:text-stone-200 text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 md:p-6 flex flex-col">
        {/* VIEW 1: Partner A Private Chat */}
        {activeView === 'partner_a' && (
          <div className="h-[calc(100vh-140px)] min-h-[500px]">
            <ChatView
              partnerA={session.partnerA}
              partnerB={session.partnerB}
              messages={session.privateMessagesA}
              chatType="private_a"
              currentPartnerId="partner_a"
              jointRoomUnlocked={session.jointRoomUnlocked}
              onSendMessage={(text) => handleSendMessage(text, 'partner_a')}
              isLoading={isLoading}
              scenarioTitle={session.scenarioTitle}
            />
          </div>
        )}

        {/* VIEW 2: Partner B Private Chat */}
        {activeView === 'partner_b' && (
          <div className="h-[calc(100vh-140px)] min-h-[500px]">
            <ChatView
              partnerA={session.partnerA}
              partnerB={session.partnerB}
              messages={session.privateMessagesB}
              chatType="private_b"
              currentPartnerId="partner_b"
              jointRoomUnlocked={session.jointRoomUnlocked}
              onSendMessage={(text) => handleSendMessage(text, 'partner_b')}
              isLoading={isLoading}
              scenarioTitle={session.scenarioTitle}
            />
          </div>
        )}

        {/* VIEW 3: Split Dual View (Side-by-side) */}
        {activeView === 'split' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[calc(100vh-140px)] min-h-[500px]">
            {/* Left Column: Partner A */}
            <div className="h-full">
              <ChatView
                partnerA={session.partnerA}
                partnerB={session.partnerB}
                messages={session.privateMessagesA}
                chatType="private_a"
                currentPartnerId="partner_a"
                jointRoomUnlocked={session.jointRoomUnlocked}
                onSendMessage={(text) => handleSendMessage(text, 'partner_a')}
                isLoading={isLoading}
                scenarioTitle={session.scenarioTitle}
              />
            </div>

            {/* Right Column: Partner B */}
            <div className="h-full">
              <ChatView
                partnerA={session.partnerA}
                partnerB={session.partnerB}
                messages={session.privateMessagesB}
                chatType="private_b"
                currentPartnerId="partner_b"
                jointRoomUnlocked={session.jointRoomUnlocked}
                onSendMessage={(text) => handleSendMessage(text, 'partner_b')}
                isLoading={isLoading}
                scenarioTitle={session.scenarioTitle}
              />
            </div>
          </div>
        )}

        {/* VIEW 4: Joint Mediation Room */}
        {activeView === 'joint' && (
          <div className="h-[calc(100vh-140px)] min-h-[500px]">
            {!isJointAvailable ? (
              <div className="h-full bg-stone-950 border border-stone-800 rounded-2xl flex flex-col items-center justify-center p-6 text-center max-w-xl mx-auto shadow-xl">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4">
                  <Lock className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-semibold text-stone-100">
                  Joint Room is Currently Locked
                </h3>
                <p className="text-xs text-stone-400 mt-2 leading-relaxed">
                  Per the Middleman mediation protocol, separate chats stay separate until the AI determines both parties are ready to talk directly without explosive escalation.
                </p>

                <div className="w-full bg-stone-900 border border-stone-800 p-4 rounded-xl mt-5 text-left space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-stone-300 font-medium">Readiness Threshold:</span>
                    <span className="font-mono text-amber-400 font-bold">
                      {session.readiness.score}% / 70%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-stone-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-teal-500 transition-all"
                      style={{ width: `${session.readiness.score}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-stone-400 italic">
                    {session.readiness.summary}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 mt-6">
                  <button
                    onClick={() => setActiveView('partner_a')}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-medium rounded-xl transition-colors"
                  >
                    Continue Dialogue as {session.partnerA.name}
                  </button>

                  <button
                    onClick={() => setActiveView('partner_b')}
                    className="px-4 py-2 bg-amber-700 hover:bg-amber-600 text-white text-xs font-medium rounded-xl transition-colors"
                  >
                    Continue Dialogue as {session.partnerB.name}
                  </button>

                  <button
                    onClick={() => setForceUnlockJoint(true)}
                    className="px-3 py-2 text-stone-400 hover:text-stone-200 text-xs font-medium border border-stone-800 hover:bg-stone-900 rounded-xl transition-colors"
                    title="Allow entering for testing/demonstration"
                  >
                    Facilitator Override (Unlock Now)
                  </button>
                </div>
              </div>
            ) : (
              <ChatView
                partnerA={session.partnerA}
                partnerB={session.partnerB}
                messages={session.jointMessages}
                chatType="joint"
                jointRoomUnlocked={true}
                onSendMessage={(text, senderId) => handleSendMessage(text, senderId)}
                isLoading={isLoading}
                scenarioTitle={session.scenarioTitle}
              />
            )}
          </div>
        )}
      </main>

      {/* Modals & Drawers */}
      <ContrastructionModal
        isOpen={isContrastructionModalOpen}
        onClose={() => setIsContrastructionModalOpen(false)}
      />

      <BridgeNotesDrawer
        isOpen={isBridgeNotesOpen}
        onClose={() => setIsBridgeNotesOpen(false)}
        session={session}
        onEnterJointRoom={() => {
          setActiveView('joint');
          setForceUnlockJoint(true);
        }}
      />

      <ScenarioModal
        isOpen={isScenarioModalOpen}
        onClose={() => setIsScenarioModalOpen(false)}
        onSelectScenario={handleSelectScenario}
        currentScenarioTitle={session.scenarioTitle}
      />
    </div>
  );
}
