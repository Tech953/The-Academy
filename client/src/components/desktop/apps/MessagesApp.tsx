import { useState } from 'react';
import { MessageCircle, User, ArrowLeft, Send } from 'lucide-react';
import { useGameState, DirectMessage, Conversation } from '@/contexts/GameStateContext';

const NEON_GREEN = '#00ff00';
const NEON_CYAN = '#00ffff';

export default function MessagesApp() {
  const { messages, conversations, markMessageRead, unreadMessageCount, sendMessage, character } = useGameState();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [replyText, setReplyText] = useState('');

  const handleConversationClick = (conv: Conversation) => {
    setSelectedConversation(conv);
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const containerStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    background: '#0a0a0a',
    fontFamily: '"Courier New", monospace',
    color: NEON_GREEN,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  };

  const headerStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 'bold',
    padding: '12px 16px',
    textShadow: `0 0 10px ${NEON_GREEN}`,
    borderBottom: `1px solid ${NEON_GREEN}40`,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexShrink: 0,
  };

  const conversationListStyle: React.CSSProperties = {
    flex: 1,
    overflow: 'auto',
    padding: '8px',
  };

  const conversationItemStyle = (hasUnread: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    padding: '12px',
    marginBottom: '4px',
    background: hasUnread ? `${NEON_GREEN}10` : 'transparent',
    border: `1px solid ${hasUnread ? NEON_GREEN + '40' : NEON_GREEN + '20'}`,
    cursor: 'pointer',
    transition: 'background 0.2s',
  });

  const avatarStyle: React.CSSProperties = {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: `${NEON_GREEN}20`,
    border: `1px solid ${NEON_GREEN}40`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
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

  const getUnreadCount = (conv: Conversation): number => {
    return conv.messages.filter(m => !m.read && !m.isFromPlayer).length;
  };

  if (selectedConversation) {
    const currentConv = conversations.find(c => c.participantName === selectedConversation.participantName) || selectedConversation;
    
    return (
      <div style={containerStyle}>
        <div style={headerStyle}>
          <button 
            onClick={() => setSelectedConversation(null)}
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: NEON_GREEN, 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <ArrowLeft size={16} />
          </button>
          <span>{currentConv.participantName}</span>
          {currentConv.participantTitle && (
            <span style={{ fontSize: '10px', opacity: 0.6, marginLeft: 'auto' }}>
              {currentConv.participantTitle}
            </span>
          )}
        </div>
        
        <div style={{ 
          flex: 1, 
          overflow: 'auto', 
          padding: '16px', 
          display: 'flex', 
          flexDirection: 'column',
          gap: '12px',
        }}>
          {currentConv.messages.map((msg, idx) => (
            <div 
              key={msg.id}
              style={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                gap: '12px',
                flexDirection: msg.isFromPlayer ? 'row-reverse' : 'row',
              }}
            >
              <div style={{
                ...avatarStyle,
                background: msg.isFromPlayer ? `${NEON_CYAN}20` : `${NEON_GREEN}20`,
                border: `1px solid ${msg.isFromPlayer ? NEON_CYAN : NEON_GREEN}40`,
              }}>
                <User size={14} />
              </div>
              <div style={{ 
                flex: 1, 
                maxWidth: '70%',
              }}>
                <div style={{ 
                  fontSize: '10px', 
                  opacity: 0.6, 
                  marginBottom: '4px',
                  textAlign: msg.isFromPlayer ? 'right' : 'left',
                }}>
                  {msg.isFromPlayer ? 'You' : msg.from} - {formatTime(msg.timestamp)}
                </div>
                <div style={{ 
                  background: msg.isFromPlayer ? `${NEON_CYAN}15` : `${NEON_GREEN}10`,
                  border: `1px solid ${msg.isFromPlayer ? NEON_CYAN : NEON_GREEN}30`,
                  padding: '10px 12px',
                  fontSize: '12px',
                  lineHeight: 1.5,
                  color: msg.isFromPlayer ? NEON_CYAN : NEON_GREEN,
                }}>
                  {msg.content}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ 
          borderTop: `1px solid ${NEON_GREEN}30`,
          padding: '12px',
          display: 'flex',
          gap: '8px',
        }}>
          <input 
            type="text"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            style={{
              flex: 1,
              background: 'transparent',
              border: `1px solid ${NEON_GREEN}40`,
              color: NEON_GREEN,
              padding: '8px 12px',
              fontFamily: 'inherit',
              fontSize: '12px',
              outline: 'none',
            }}
          />
          <button 
            onClick={handleSendMessage}
            disabled={!replyText.trim()}
            style={{
              background: replyText.trim() ? `${NEON_GREEN}30` : `${NEON_GREEN}10`,
              border: `1px solid ${replyText.trim() ? NEON_GREEN : NEON_GREEN + '40'}`,
              color: NEON_GREEN,
              padding: '8px 16px',
              cursor: replyText.trim() ? 'pointer' : 'default',
              fontFamily: 'inherit',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              opacity: replyText.trim() ? 1 : 0.5,
            }}
          >
            <Send size={12} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <MessageCircle size={16} />
        <span>CHATLINK</span>
        {unreadMessageCount > 0 && (
          <span style={{ 
            background: NEON_GREEN, 
            color: '#000', 
            padding: '2px 6px', 
            fontSize: '10px',
            fontWeight: 'bold',
            marginLeft: 'auto',
          }}>
            {unreadMessageCount} NEW
          </span>
        )}
      </div>

      <div style={conversationListStyle}>
        {conversations.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px 20px', 
            opacity: 0.5,
            fontSize: '12px',
          }}>
            No conversations yet
          </div>
        ) : (
          conversations.map(conv => {
            const unreadCount = getUnreadCount(conv);
            const lastMessage = conv.messages[conv.messages.length - 1];
            
            return (
              <div 
                key={conv.id} 
                style={conversationItemStyle(unreadCount > 0)}
                onClick={() => handleConversationClick(conv)}
                onMouseEnter={(e) => e.currentTarget.style.background = `${NEON_GREEN}15`}
                onMouseLeave={(e) => e.currentTarget.style.background = unreadCount > 0 ? `${NEON_GREEN}10` : 'transparent'}
              >
                <div style={avatarStyle}>
                  <User size={14} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    marginBottom: '4px',
                  }}>
                    <div>
                      <span style={{ 
                        fontSize: '12px', 
                        fontWeight: unreadCount > 0 ? 'bold' : 'normal',
                      }}>
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
                  <div style={{ 
                    fontSize: '11px', 
                    opacity: 0.7,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {lastMessage?.isFromPlayer ? 'You: ' : ''}{lastMessage?.content}
                  </div>
                </div>
                {unreadCount > 0 && (
                  <div style={{
                    minWidth: '18px',
                    height: '18px',
                    borderRadius: '9px',
                    background: NEON_GREEN,
                    color: '#000',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
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
    </div>
  );
}
