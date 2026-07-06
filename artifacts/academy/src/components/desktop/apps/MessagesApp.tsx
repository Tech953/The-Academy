import { useState, useCallback } from 'react';
import { MessageCircle, User, ArrowLeft, Send, UserPlus, Wifi, WifiOff, Zap } from 'lucide-react';
import { useGameState, DirectMessage, Conversation } from '@/contexts/GameStateContext';
import { useRadiantAI } from '@/hooks/useRadiantAI';
import { NPCEntity } from '@/lib/radiantAI';
import NPCDirectoryPanel, { DirectoryMode, NPCContactStatus } from './NPCDirectoryPanel';

const NEON_GREEN = '#00ff00';
const NEON_CYAN = '#00ffff';
const NEON_AMBER = '#ffaa00';
const NEON_RED = '#ff3366';
const NEON_GOLD = '#ffd700';

export default function MessagesApp() {
  const { messages, conversations, markMessageRead, unreadMessageCount, sendMessage, addMessage, character, isEnrolled } = useGameState();
  const { processInteraction } = useRadiantAI();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [replyText, setReplyText] = useState('');
  const [showDirectory, setShowDirectory] = useState(false);
  const [connectingNPC, setConnectingNPC] = useState<string | null>(null);

  const handleConversationClick = (conv: Conversation) => {
    setSelectedConversation(conv);
    setShowDirectory(false);
    conv.messages.forEach(m => {
      if (!m.read && !m.isFromPlayer) {
        markMessageRead(m.id);
      }
    });
  };

  const handleSendMessage = () => {
    if (!replyText.trim() || !selectedConversation) return;
    sendMessage(selectedConversation.participantName, replyText);
    setReplyText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const alreadyConnected = conversations.map(c => c.participantName);

  const handleSelectNPC = useCallback((npc: NPCEntity, status: NPCContactStatus) => {
    setShowDirectory(false);

    const alreadyExists = conversations.find(c => c.participantName === npc.name);
    if (alreadyExists) {
      setSelectedConversation(alreadyExists);
      return;
    }

    setConnectingNPC(npc.name);

    const greeting = status.isCold
      ? `[Connection request sent to ${npc.name}. As a stranger, a response is not guaranteed — but your request has been logged in the network.]`
      : status.tier >= 4
      ? `[Secure channel established with ${npc.name}. High affinity detected — connection auto-accepted.]`
      : `[Connection request sent to ${npc.name}. You are registered as ${status.label.toLowerCase()} — they should respond soon.]`;

    addMessage({
      from: 'SYSTEM',
      content: greeting,
      isFromPlayer: false,
      conversationId: npc.name,
    });

    processInteraction(npc.id, 'conversation', 'neutral');

    setTimeout(() => {
      const intro = buildNPCIntro(npc, status, character.name);
      addMessage({
        from: npc.name,
        content: intro,
        isFromPlayer: false,
        conversationId: npc.name,
      });
      setConnectingNPC(null);

      setSelectedConversation({
        id: npc.id,
        participantName: npc.name,
        participantTitle: npc.role === 'Teacher' ? 'Faculty Member' : npc.faction ? `${npc.faction} · Student` : 'Fellow Student',
        messages: [],
        lastActivity: new Date(),
      });
    }, status.isCold ? 4000 : status.tier >= 3 ? 800 : 2000);
  }, [conversations, addMessage, processInteraction, character.name]);

  const containerStyle: React.CSSProperties = {
    width: '100%', height: '100%',
    background: '#0a0a0a',
    fontFamily: '"Courier New", monospace',
    color: NEON_GREEN,
    display: 'flex', flexDirection: 'column',
    overflow: 'hidden',
    position: 'relative',
  };

  const headerStyle: React.CSSProperties = {
    fontSize: '14px', fontWeight: 'bold',
    padding: '10px 14px',
    textShadow: `0 0 10px ${NEON_GREEN}`,
    borderBottom: `1px solid ${NEON_GREEN}40`,
    display: 'flex', alignItems: 'center', gap: '8px',
    flexShrink: 0,
  };

  const avatarStyle: React.CSSProperties = {
    width: '32px', height: '32px', borderRadius: '50%',
    background: `${NEON_GREEN}20`,
    border: `1px solid ${NEON_GREEN}40`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  const getUnreadCount = (conv: Conversation): number =>
    conv.messages.filter(m => !m.read && !m.isFromPlayer).length;

  if (selectedConversation) {
    const currentConv = conversations.find(c => c.participantName === selectedConversation.participantName) || selectedConversation;
    const isSystem = currentConv.participantName === 'SYSTEM';

    return (
      <div style={containerStyle}>
        <div style={headerStyle}>
          <button
            onClick={() => setSelectedConversation(null)}
            style={{ background: 'transparent', border: 'none', color: NEON_GREEN, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <ArrowLeft size={16} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
            <div style={{
              ...avatarStyle, width: 28, height: 28,
              background: `${NEON_GREEN}20`,
              fontSize: 11, fontWeight: 'bold', color: NEON_GREEN,
            }}>
              {isSystem ? <Zap size={12} /> : <User size={12} />}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentConv.participantName}
              </div>
              {currentConv.participantTitle && (
                <div style={{ fontSize: 9, opacity: 0.5, letterSpacing: '0.3px' }}>
                  {currentConv.participantTitle}
                </div>
              )}
            </div>
          </div>
          {connectingNPC === currentConv.participantName && (
            <div style={{ fontSize: 9, color: NEON_AMBER, animation: 'pulse 1.5s infinite', letterSpacing: '0.5px' }}>
              CONNECTING...
            </div>
          )}
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {currentConv.messages.length === 0 ? (
            <div style={{ textAlign: 'center', opacity: 0.4, fontSize: 11, padding: '40px 20px' }}>
              {connectingNPC === currentConv.participantName ? 'Awaiting response...' : 'No messages yet. Say hello.'}
            </div>
          ) : (
            currentConv.messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: '12px',
                  flexDirection: msg.isFromPlayer ? 'row-reverse' : 'row',
                }}
              >
                <div style={{
                  ...avatarStyle,
                  background: msg.isFromPlayer ? `${NEON_CYAN}20` : msg.from === 'SYSTEM' ? '#ffffff08' : `${NEON_GREEN}20`,
                  border: `1px solid ${msg.isFromPlayer ? NEON_CYAN : msg.from === 'SYSTEM' ? '#ffffff20' : NEON_GREEN}40`,
                  width: 28, height: 28,
                }}>
                  {msg.from === 'SYSTEM' ? <Zap size={11} color="#ffffff40" /> : <User size={11} />}
                </div>
                <div style={{ flex: 1, maxWidth: '72%' }}>
                  <div style={{ fontSize: '10px', opacity: 0.5, marginBottom: '4px', textAlign: msg.isFromPlayer ? 'right' : 'left' }}>
                    {msg.isFromPlayer ? 'You' : msg.from} · {formatTime(msg.timestamp)}
                  </div>
                  <div style={{
                    background: msg.isFromPlayer ? `${NEON_CYAN}15` : msg.from === 'SYSTEM' ? `#ffffff06` : `${NEON_GREEN}10`,
                    border: `1px solid ${msg.isFromPlayer ? NEON_CYAN : msg.from === 'SYSTEM' ? '#ffffff15' : NEON_GREEN}30`,
                    padding: '10px 12px', fontSize: '12px', lineHeight: 1.5,
                    color: msg.isFromPlayer ? NEON_CYAN : msg.from === 'SYSTEM' ? '#ffffff50' : NEON_GREEN,
                    fontStyle: msg.from === 'SYSTEM' ? 'italic' : 'normal',
                  }}>
                    {msg.content}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ borderTop: `1px solid ${NEON_GREEN}30`, padding: '12px', display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            style={{
              flex: 1, background: 'transparent',
              border: `1px solid ${NEON_GREEN}40`,
              color: NEON_GREEN, padding: '8px 12px',
              fontFamily: 'inherit', fontSize: '12px', outline: 'none',
            }}
          />
          <button
            onClick={handleSendMessage}
            disabled={!replyText.trim()}
            style={{
              background: replyText.trim() ? `${NEON_GREEN}30` : `${NEON_GREEN}10`,
              border: `1px solid ${replyText.trim() ? NEON_GREEN : NEON_GREEN + '40'}`,
              color: NEON_GREEN, padding: '8px 16px',
              cursor: replyText.trim() ? 'pointer' : 'default',
              fontFamily: 'inherit', fontSize: '12px',
              display: 'flex', alignItems: 'center', gap: '4px',
              opacity: replyText.trim() ? 1 : 0.5,
            }}
          >
            <Send size={12} />
          </button>
        </div>
      </div>
    );
  }

  if (!isEnrolled) {
    return (
      <div style={{ width: '100%', height: '100%', background: '#0a0a0a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: '"Courier New", monospace', color: NEON_GREEN, gap: '16px', padding: '24px', textAlign: 'center' }}>
        <MessageCircle size={40} style={{ color: NEON_GREEN, opacity: 0.4 }} />
        <div style={{ color: NEON_GREEN, fontSize: '14px', letterSpacing: '2px', textTransform: 'uppercase' }}>ChatLink</div>
        <div style={{ color: '#555', fontSize: '11px', lineHeight: '1.8', maxWidth: '280px' }}>
          Your message network is offline. Enroll in a class to connect with classmates, faculty, and your companion Cub.
        </div>
        <div style={{ color: NEON_GREEN, fontSize: '10px', opacity: 0.6, border: `1px solid ${NEON_GREEN}33`, padding: '8px 16px', letterSpacing: '1px' }}>
          TYPE: ENROLL IN THE ACADEMY TERMINAL
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {showDirectory && (
        <NPCDirectoryPanel
          mode="chat"
          onClose={() => setShowDirectory(false)}
          onSelectNPC={handleSelectNPC}
          alreadyConnected={alreadyConnected}
        />
      )}

      <div style={headerStyle}>
        <MessageCircle size={15} />
        <span style={{ flex: 1 }}>CHATLINK</span>
        {unreadMessageCount > 0 && (
          <span style={{
            background: NEON_GREEN, color: '#000',
            padding: '2px 6px', fontSize: '10px', fontWeight: 'bold',
          }}>
            {unreadMessageCount} NEW
          </span>
        )}
        <button
          onClick={() => setShowDirectory(true)}
          title="Add NPC Contact"
          style={{
            background: `${NEON_GREEN}18`, border: `1px solid ${NEON_GREEN}50`,
            color: NEON_GREEN, padding: '4px 8px',
            cursor: 'pointer', fontFamily: 'inherit', fontSize: 10,
            display: 'flex', alignItems: 'center', gap: 4,
            letterSpacing: '0.5px',
          }}
        >
          <UserPlus size={11} />
          ADD
        </button>
      </div>

      {connectingNPC && (
        <div style={{
          padding: '8px 14px', background: `${NEON_AMBER}10`,
          borderBottom: `1px solid ${NEON_AMBER}30`,
          fontSize: 10, color: NEON_AMBER,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span style={{ animation: 'pulse 1s infinite' }}>●</span>
          Requesting connection to {connectingNPC}...
        </div>
      )}

      <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
        {conversations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', opacity: 0.5, fontSize: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <MessageCircle size={32} style={{ opacity: 0.3 }} />
            <div>No conversations yet</div>
            <button
              onClick={() => setShowDirectory(true)}
              style={{
                background: `${NEON_GREEN}15`,
                border: `1px solid ${NEON_GREEN}40`,
                color: NEON_GREEN,
                padding: '8px 16px',
                cursor: 'pointer',
                fontSize: 11,
                fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <UserPlus size={12} />
              Find Contacts in RadiantAI Network
            </button>
          </div>
        ) : (
          conversations.map(conv => {
            const unreadCount = getUnreadCount(conv);
            const lastMessage = conv.messages[conv.messages.length - 1];

            return (
              <div
                key={conv.id}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: '10px',
                  padding: '12px', marginBottom: '4px',
                  background: unreadCount > 0 ? `${NEON_GREEN}10` : 'transparent',
                  border: `1px solid ${unreadCount > 0 ? NEON_GREEN + '40' : NEON_GREEN + '20'}`,
                  cursor: 'pointer', transition: 'background 0.2s',
                }}
                onClick={() => handleConversationClick(conv)}
                onMouseEnter={e => (e.currentTarget.style.background = `${NEON_GREEN}15`)}
                onMouseLeave={e => (e.currentTarget.style.background = unreadCount > 0 ? `${NEON_GREEN}10` : 'transparent')}
              >
                <div style={avatarStyle}>
                  {conv.participantName === 'SYSTEM' ? <Zap size={13} /> : <User size={14} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                    <div>
                      <span style={{ fontSize: '12px', fontWeight: unreadCount > 0 ? 'bold' : 'normal' }}>
                        {conv.participantName}
                      </span>
                      {conv.participantTitle && (
                        <span style={{ fontSize: '10px', opacity: 0.5, marginLeft: '8px' }}>
                          {conv.participantTitle}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '9px', opacity: 0.5, flexShrink: 0 }}>
                      {formatTime(conv.lastActivity)}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', opacity: 0.7, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {lastMessage?.isFromPlayer ? 'You: ' : ''}{lastMessage?.content}
                  </div>
                </div>
                {unreadCount > 0 && (
                  <div style={{
                    minWidth: '18px', height: '18px', borderRadius: '9px',
                    background: NEON_GREEN, color: '#000',
                    fontSize: '10px', fontWeight: 'bold',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: `0 0 6px ${NEON_GREEN}`,
                  }}>
                    {unreadCount}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}

function buildNPCIntro(npc: NPCEntity, status: NPCContactStatus, playerName: string): string {
  const isTeacher = npc.role === 'Teacher';
  const isCold = status.isCold;
  const isAlly = status.tier >= 4;
  const isFriend = status.tier === 3;

  if (isTeacher) {
    if (isCold) return `Hello. I received a connection request from this terminal. If you have academic questions, I will try to respond during my office hours. Who are you?`;
    if (isFriend || isAlly) return `${playerName}! Good to hear from you on ChatLink. Feel free to reach out with anything — coursework, Academy matters, or just to talk. What's on your mind?`;
    return `Hello ${playerName}. I see you've connected through the Academy network. I'm available for academic guidance and general questions. How can I help?`;
  }

  if (isCold) return `Uh... hey? Your name popped up in my ChatLink feed. I don't think we've met properly. I'm ${npc.name}${npc.faction ? `, part of the ${npc.faction}` : ''}. What's up?`;
  if (isAlly) return `${playerName}! Finally — I've been hoping you'd reach out properly. We should talk more. What's going on?`;
  if (isFriend) return `Hey! Glad you added me. ${npc.faction ? `The ${npc.faction} crowd has been keeping me busy, but ` : ''}I'm always around to chat. What's up?`;
  return `Oh hey, ${playerName}. I saw your request come through. I've seen you around the Academy — good to finally be connected.`;
}
