import React, { useState, useRef, useEffect } from 'react';
import {
  Message,
  PartnerProfile,
  PartnerId,
  ChatType
} from '../types/mediation';
import { MessageItem } from './MessageItem';
import {
  Send,
  Lock,
  Sparkles,
  HeartHandshake,
  ShieldCheck,
  Flame,
  ArrowRight,
  MessageSquare
} from 'lucide-react';

interface ChatViewProps {
  partnerA: PartnerProfile;
  partnerB: PartnerProfile;
  messages: Message[];
  chatType: ChatType;
  currentPartnerId?: PartnerId; // for private rooms
  jointRoomUnlocked: boolean;
  onSendMessage: (text: string, senderId?: PartnerId) => Promise<void>;
  isLoading: boolean;
  scenarioTitle: string;
}

export const ChatView: React.FC<ChatViewProps> = ({
  partnerA,
  partnerB,
  messages,
  chatType,
  currentPartnerId = 'partner_a',
  jointRoomUnlocked,
  onSendMessage,
  isLoading,
  scenarioTitle
}) => {
  const [inputText, setInputText] = useState('');
  const [jointSender, setJointSender] = useState<PartnerId>('partner_a');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isJoint = chatType === 'joint';
  const currentPartner = currentPartnerId === 'partner_a' ? partnerA : partnerB;
  const otherPartner = currentPartnerId === 'partner_a' ? partnerB : partnerA;

  // Auto-scroll when messages change or loading
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    const text = inputText;
    setInputText('');
    if (isJoint) {
      await onSendMessage(text, jointSender);
    } else {
      await onSendMessage(text, currentPartnerId);
    }
  };

  // Quick prompt suggestions based on partner perspective
  const quickPrompts = isJoint
    ? [
        `I want to apologize for getting defensive earlier.`,
        `Can we talk about how we can share the pressure going forward?`,
        `When you were late, I took it as a sign you didn't care, but I understand now you were overwhelmed.`,
        `I really love you and want us to feel like a team again.`
      ]
    : currentPartnerId === 'partner_a'
    ? [
        `I feel like my feelings don't matter and I'm always the one who has to compromise.`,
        `Whenever I try to talk about our schedule, they get angry and shut down.`,
        `I just desperately need them to understand how lonely I feel carrying this.`,
        `I don't want to fight, I just want reassurance that we are okay.`
      ]
    : [
        `They never acknowledge how much pressure I'm under to keep us afloat.`,
        `It feels like no matter what I do, it's never enough and I'm always criticized.`,
        `I shut down because every conversation turns into an attack on my character.`,
        `I want to be close too, but I need peace at home without constant nitpicking.`
      ];

  return (
    <div className="flex flex-col h-full bg-stone-950 border border-stone-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Sub-Header Banner */}
      <div className="bg-stone-900/90 border-b border-stone-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isJoint ? (
            <div className="w-8 h-8 rounded-lg bg-teal-600/30 border border-teal-500/50 flex items-center justify-center text-teal-400">
              <HeartHandshake className="w-4 h-4" />
            </div>
          ) : (
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                currentPartnerId === 'partner_a'
                  ? 'bg-emerald-600/30 border border-emerald-500/50 text-emerald-300'
                  : 'bg-amber-600/30 border border-amber-500/50 text-amber-300'
              }`}
            >
              {currentPartner.name.charAt(0)}
            </div>
          )}

          <div>
            <h2 className="text-sm font-semibold text-stone-100 flex items-center gap-2">
              {isJoint ? (
                <>
                  <span>Joint Room: Direct Dialogue</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-950 text-teal-300 border border-teal-800">
                    Facilitated by Middleman
                  </span>
                </>
              ) : (
                <>
                  <span>{currentPartner.name}'s Confidential Room</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-800 text-stone-300 border border-stone-700 flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> Private to AI
                  </span>
                </>
              )}
            </h2>
            <p className="text-xs text-stone-400">
              {isJoint
                ? `Direct conversation between ${partnerA.name} & ${partnerB.name}. Middleman is actively buffering and clarifying.`
                : `Messages sent here are heard ONLY by Middleman. Middleman talks FOR you to bridge to ${otherPartner.name}.`}
            </p>
          </div>
        </div>

        {/* Sender Switcher when in Joint Mode */}
        {isJoint && (
          <div className="flex items-center gap-1.5 bg-stone-950 p-1 rounded-xl border border-stone-800">
            <span className="text-[11px] text-stone-400 px-2 font-medium">Send as:</span>
            <button
              type="button"
              onClick={() => setJointSender('partner_a')}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                jointSender === 'partner_a'
                  ? 'bg-emerald-700 text-white'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              {partnerA.name}
            </button>
            <button
              type="button"
              onClick={() => setJointSender('partner_b')}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                jointSender === 'partner_b'
                  ? 'bg-amber-700 text-white'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              {partnerB.name}
            </button>
          </div>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-400">
            <MessageSquare className="w-10 h-10 text-stone-600 mb-2" />
            <p className="text-sm font-medium text-stone-300">No messages in this room yet.</p>
            <p className="text-xs text-stone-500 mt-1">
              Start by typing your perspective or choose a quick prompt below.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageItem
              key={msg.id}
              message={msg}
              partnerA={partnerA}
              partnerB={partnerB}
            />
          ))
        )}

        {/* Typing indicator */}
        {isLoading && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-stone-900 border border-stone-800 text-xs text-stone-300 w-fit">
            <Sparkles className="w-3.5 h-3.5 text-teal-400 animate-spin" />
            <span>Middleman is analyzing ambiguities and contrastructing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Bar */}
      <div className="px-4 py-2 bg-stone-900/50 border-t border-stone-800/80">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs text-stone-400 scrollbar-none">
          <span className="text-[11px] font-medium text-stone-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Flame className="w-3 h-3 text-amber-500" /> Ideas:
          </span>
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setInputText(prompt)}
              className="shrink-0 bg-stone-800/80 hover:bg-stone-700 text-stone-300 hover:text-stone-100 px-2.5 py-1 rounded-lg border border-stone-700/60 transition-colors text-left max-w-xs truncate"
              title={prompt}
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleSubmit}
        className="p-3 bg-stone-900 border-t border-stone-800 flex items-center gap-2"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={
            isJoint
              ? `Speak directly to ${jointSender === 'partner_a' ? partnerB.name : partnerA.name}...`
              : `Tell Middleman what happened (only heard by AI)...`
          }
          disabled={isLoading}
          className="flex-1 bg-stone-950 border border-stone-700 rounded-xl px-4 py-2.5 text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 disabled:opacity-50"
        />

        <button
          type="submit"
          disabled={!inputText.trim() || isLoading}
          className="px-4 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
        >
          <span>Send</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
