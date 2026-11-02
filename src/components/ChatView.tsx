import React, { useState, useRef, useEffect } from 'react';
import {
  Message,
  UserProfile,
  PartnerId,
  ChatType
} from '../types/mediation';
import { MessageItem } from './MessageItem';
import {
  Send,
  Lock,
  HeartHandshake,
  MessageSquare,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';

interface ChatViewProps {
  partnerA: UserProfile;
  partnerB: UserProfile;
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
  const [justSent, setJustSent] = useState(false);
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
    setJustSent(false);
    if (isJoint) {
      await onSendMessage(text, jointSender);
    } else {
      await onSendMessage(text, currentPartnerId);
    }
    setJustSent(true);
    setTimeout(() => setJustSent(false), 2000);
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
    <div className="flex flex-col h-full bg-[#181716] border border-[#2b2824] rounded-xl overflow-hidden shadow-sm">
      {/* Room Sub-Header: Quiet, Serene Orientation */}
      <div className="bg-[#1f1d1b] border-b border-[#2b2824] px-5 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#2b2723] border border-[#3b3630] flex items-center justify-center text-[#d4975c]">
            {isJoint ? (
              <HeartHandshake className="w-4 h-4 text-[#9bb098]" />
            ) : (
              <span className="font-editorial text-sm font-semibold">
                {currentPartner.name.charAt(0)}
              </span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-editorial text-base text-[#f4efe6]">
                {isJoint
                  ? 'Facilitated Joint Dialogue'
                  : `${currentPartner.name}'s Confidential Room`}
              </h2>
              <span className="text-[11px] text-[#857e72]">
                {isJoint ? '· Direct with Middleman' : '· Shielded from partner'}
              </span>
            </div>
            <p className="text-xs text-[#9c958a] mt-0.5">
              {isJoint
                ? `Direct conversation between ${partnerA.name} and ${partnerB.name}. Middleman buffers and clarifies in real time.`
                : `Messages sent here are heard ONLY by Middleman. Your partner cannot view this chat.`}
            </p>
          </div>
        </div>

        {/* Sender Switcher when in Joint Mode */}
        {isJoint && (
          <div className="flex items-center gap-1 bg-[#131211] p-1 rounded-lg border border-[#2a2825]">
            <span className="text-[11px] text-[#787166] px-2 font-medium">Speaking as:</span>
            <button
              type="button"
              onClick={() => setJointSender('partner_a')}
              className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                jointSender === 'partner_a'
                  ? 'bg-[#292623] text-[#f4efe6]'
                  : 'text-[#8f887d] hover:text-[#e8e4dc]'
              }`}
            >
              {partnerA.name}
            </button>
            <button
              type="button"
              onClick={() => setJointSender('partner_b')}
              className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                jointSender === 'partner_b'
                  ? 'bg-[#292623] text-[#f4efe6]'
                  : 'text-[#8f887d] hover:text-[#e8e4dc]'
              }`}
            >
              {partnerB.name}
            </button>
          </div>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar bg-[#141312]">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-[#7d776e]">
            <MessageSquare className="w-8 h-8 text-[#3d3832] mb-3" />
            <p className="font-editorial text-base text-[#c7baa7]">This chamber is quiet.</p>
            <p className="text-xs text-[#7d776e] mt-1 max-w-sm leading-relaxed">
              Express what happened without fear of inflaming the argument. Middleman listens, validates, and helps build understanding.
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

        <div ref={messagesEndRef} />
      </div>

      {/* Thought Starters / Prompts Bar */}
      <div className="px-5 py-2.5 bg-[#1a1917] border-t border-[#2b2824]">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs text-[#8f887d] scrollbar-none">
          <span className="text-[11px] text-[#706a61] uppercase tracking-wider shrink-0 font-medium">
            Reflective prompts:
          </span>
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setInputText(prompt)}
              className="shrink-0 bg-[#23211f] hover:bg-[#2b2825] text-[#b8b0a2] hover:text-[#f4efe6] px-3 py-1 rounded-md border border-[#332f2a] transition-colors text-left max-w-xs truncate text-xs"
              title={prompt}
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form with Conveyance Deforming Offer Action */}
      <form
        onSubmit={handleSubmit}
        className="p-3.5 bg-[#191816] border-t border-[#2b2824] flex items-center gap-3"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={
            isJoint
              ? `Direct message to ${jointSender === 'partner_a' ? partnerB.name : partnerA.name}...`
              : `Express what you're experiencing (only Middleman hears this)...`
          }
          disabled={isLoading}
          className="flex-1 bg-[#131211] border border-[#332f2a] rounded-lg px-4 py-2.5 text-sm text-[#f4efe6] placeholder-[#6e685f] focus:outline-none focus:border-[#d4975c] transition-colors disabled:opacity-50"
        />

        {/* Convey Offer Action: Deforms under its own load without detached spinners */}
        <button
          type="submit"
          disabled={(!inputText.trim() && !isLoading) || isLoading}
          className={`h-10 px-5 text-xs font-medium rounded-lg flex items-center justify-center gap-2 transition-all duration-300 ${
            isLoading
              ? 'bg-[#2b241e] text-[#d4975c] border border-[#d4975c]/40 cursor-wait min-w-[150px]'
              : justSent
              ? 'bg-[#1e261f] text-[#9bb098] border border-[#9bb098]/40 min-w-[90px]'
              : !inputText.trim()
              ? 'bg-[#23211f] text-[#615b52] border border-[#2e2a26] cursor-not-allowed'
              : 'bg-[#d4975c] hover:bg-[#c4874d] text-[#141312] font-semibold cursor-pointer shadow-xs active:scale-98'
          }`}
        >
          {isLoading ? (
            <span className="flex items-center gap-2 font-editorial italic text-xs animate-calm-pulse">
              Contemplating...
            </span>
          ) : justSent ? (
            <span className="flex items-center gap-1.5 text-xs font-ui">
              Received
            </span>
          ) : (
            <>
              <span>Send</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </form>
    </div>
  );
};
