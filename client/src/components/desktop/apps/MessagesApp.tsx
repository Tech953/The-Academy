import { useState } from 'react';
import { MessageCircle, User, ArrowLeft, Send } from 'lucide-react';
import { useGameState, DirectMessage } from '@/contexts/GameStateContext';

const NEON_GREEN = '#00ff00';
const NEON_CYAN = '#00ffff';

export default function MessagesApp() {
  const { messages, markMessageRead, unreadMessageCount } = useGameState();
  const [selectedMessage, setSelectedMessage] = useState<DirectMessage | null>(null);
  const [replyText, setReplyText] = useState('');

  const handleMessageClick = (message: DirectMessage) => {
    setSelectedMessage(message);
    if (!message.read) {
      markMessageRead(message.id);
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

  const messageListStyle: React.CSSProperties = {
    flex: 1,
    overflow: 'auto',
    padding: '8px',
  };

  const messageItemStyle = (message: DirectMessage): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    padding: '12px',
    marginBottom: '4px',
    background: message.read ? 'transparent' : `${NEON_GREEN}10`,
    border: `1px solid ${message.read ? NEON_GREEN + '20' : NEON_GREEN + '40'}`,
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
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  if (selectedMessage) {
    return (
      <div style={containerStyle}>
        <div style={headerStyle}>
          <button 
            onClick={() => setSelectedMessage(null)}
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
          <span>{selectedMessage.from}</span>
        </div>
        
        <div style={{ flex: 1, overflow: 'auto', padding: '16px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'flex-start', 
            gap: '12px',
            marginBottom: '16px',
          }}>
            <div style={avatarStyle}>
              <User size={16} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '2px' }}>
                {selectedMessage.from}
              </div>
              {selectedMessage.fromTitle && (
                <div style={{ fontSize: '10px', opacity: 0.6, marginBottom: '8px' }}>
                  {selectedMessage.fromTitle}
                </div>
              )}
              <div style={{ 
                background: `${NEON_GREEN}10`,
                border: `1px solid ${NEON_GREEN}30`,
                padding: '12px',
                fontSize: '12px',
                lineHeight: 1.6,
              }}>
                {selectedMessage.content}
              </div>
              <div style={{ fontSize: '9px', opacity: 0.5, marginTop: '4px' }}>
                {formatTime(selectedMessage.timestamp)}
              </div>
            </div>
          </div>
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
            placeholder="Type a reply..."
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
          <button style={{
            background: `${NEON_GREEN}20`,
            border: `1px solid ${NEON_GREEN}`,
            color: NEON_GREEN,
            padding: '8px 16px',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}>
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

      <div style={messageListStyle}>
        {messages.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px 20px', 
            opacity: 0.5,
            fontSize: '12px',
          }}>
            No messages yet
          </div>
        ) : (
          messages.map(message => (
            <div 
              key={message.id} 
              style={messageItemStyle(message)}
              onClick={() => handleMessageClick(message)}
              onMouseEnter={(e) => e.currentTarget.style.background = `${NEON_GREEN}15`}
              onMouseLeave={(e) => e.currentTarget.style.background = message.read ? 'transparent' : `${NEON_GREEN}10`}
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
                      fontWeight: message.read ? 'normal' : 'bold',
                    }}>
                      {message.from}
                    </span>
                    {message.fromTitle && (
                      <span style={{ fontSize: '10px', opacity: 0.5, marginLeft: '8px' }}>
                        {message.fromTitle}
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '9px', opacity: 0.5, flexShrink: 0 }}>
                    {formatTime(message.timestamp)}
                  </span>
                </div>
                <div style={{ 
                  fontSize: '11px', 
                  opacity: 0.7,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {message.content}
                </div>
              </div>
              {!message.read && (
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: NEON_GREEN,
                  flexShrink: 0,
                  marginTop: '4px',
                  boxShadow: `0 0 6px ${NEON_GREEN}`,
                }} />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
