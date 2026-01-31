import { useState } from 'react';
import { Mail, MailOpen, Inbox, Send, Archive, Trash2, ArrowLeft } from 'lucide-react';
import { useGameState, Email } from '@/contexts/GameStateContext';

const NEON_GREEN = '#00ff00';
const NEON_CYAN = '#00ffff';
const NEON_AMBER = '#ffaa00';
const NEON_PURPLE = '#cc66ff';
const NEON_RED = '#ff3366';

const CATEGORY_COLORS: Record<string, string> = {
  academic: NEON_AMBER,
  faction: NEON_PURPLE,
  personal: NEON_CYAN,
  system: NEON_GREEN,
};

export default function AcademyEmailApp() {
  const { emails, markEmailRead, unreadEmailCount } = useGameState();
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filteredEmails = filter === 'unread' ? emails.filter(e => !e.read) : emails;

  const handleEmailClick = (email: Email) => {
    setSelectedEmail(email);
    if (!email.read) {
      markEmailRead(email.id);
    }
  };

  const containerStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    background: '#0a0a0a',
    fontFamily: '"Courier New", monospace',
    color: NEON_CYAN,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  };

  const headerStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 'bold',
    padding: '12px 16px',
    textShadow: `0 0 10px ${NEON_CYAN}`,
    borderBottom: `1px solid ${NEON_CYAN}40`,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexShrink: 0,
  };

  const sidebarStyle: React.CSSProperties = {
    width: '100%',
    display: 'flex',
    gap: '8px',
    padding: '8px 16px',
    borderBottom: `1px solid ${NEON_CYAN}20`,
    flexShrink: 0,
  };

  const filterBtnStyle = (active: boolean): React.CSSProperties => ({
    background: active ? `${NEON_CYAN}20` : 'transparent',
    border: `1px solid ${active ? NEON_CYAN : NEON_CYAN + '40'}`,
    color: NEON_CYAN,
    padding: '4px 12px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: '11px',
  });

  const emailListStyle: React.CSSProperties = {
    flex: 1,
    overflow: 'auto',
    padding: '8px',
  };

  const emailItemStyle = (email: Email): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    padding: '10px 12px',
    marginBottom: '4px',
    background: email.read ? 'transparent' : `${NEON_CYAN}10`,
    border: `1px solid ${email.read ? NEON_CYAN + '20' : NEON_CYAN + '40'}`,
    cursor: 'pointer',
    transition: 'background 0.2s',
  });

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  if (selectedEmail) {
    return (
      <div style={containerStyle}>
        <div style={headerStyle}>
          <button 
            onClick={() => setSelectedEmail(null)}
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: NEON_CYAN, 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <ArrowLeft size={16} />
          </button>
          <MailOpen size={16} />
          <span>VIEW MESSAGE</span>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
          <div style={{ 
            borderBottom: `1px solid ${NEON_CYAN}30`, 
            paddingBottom: '12px', 
            marginBottom: '16px' 
          }}>
            <div style={{ 
              fontSize: '14px', 
              fontWeight: 'bold', 
              marginBottom: '8px',
              color: CATEGORY_COLORS[selectedEmail.category] || NEON_CYAN,
            }}>
              {selectedEmail.subject}
            </div>
            <div style={{ fontSize: '11px', opacity: 0.7, marginBottom: '4px' }}>
              From: {selectedEmail.from}
            </div>
            <div style={{ fontSize: '10px', opacity: 0.5 }}>
              {formatTime(selectedEmail.timestamp)}
            </div>
          </div>
          <div style={{ 
            fontSize: '12px', 
            lineHeight: 1.6, 
            whiteSpace: 'pre-wrap',
            opacity: 0.9,
          }}>
            {selectedEmail.body}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <Mail size={16} />
        <span>ACADEMY E-MAIL</span>
        {unreadEmailCount > 0 && (
          <span style={{ 
            background: NEON_CYAN, 
            color: '#000', 
            padding: '2px 6px', 
            fontSize: '10px',
            fontWeight: 'bold',
            marginLeft: 'auto',
          }}>
            {unreadEmailCount} NEW
          </span>
        )}
      </div>
      
      <div style={sidebarStyle}>
        <button style={filterBtnStyle(filter === 'all')} onClick={() => setFilter('all')}>
          <Inbox size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
          All ({emails.length})
        </button>
        <button style={filterBtnStyle(filter === 'unread')} onClick={() => setFilter('unread')}>
          <Mail size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
          Unread ({unreadEmailCount})
        </button>
      </div>

      <div style={emailListStyle}>
        {filteredEmails.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px 20px', 
            opacity: 0.5,
            fontSize: '12px',
          }}>
            {filter === 'unread' ? 'No unread messages' : 'No messages'}
          </div>
        ) : (
          filteredEmails.map(email => (
            <div 
              key={email.id} 
              style={emailItemStyle(email)}
              onClick={() => handleEmailClick(email)}
              onMouseEnter={(e) => e.currentTarget.style.background = `${NEON_CYAN}15`}
              onMouseLeave={(e) => e.currentTarget.style.background = email.read ? 'transparent' : `${NEON_CYAN}10`}
            >
              {email.read ? (
                <MailOpen size={14} style={{ opacity: 0.5, flexShrink: 0, marginTop: '2px' }} />
              ) : (
                <Mail size={14} style={{ color: NEON_CYAN, flexShrink: 0, marginTop: '2px' }} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ 
                  fontSize: '11px', 
                  fontWeight: email.read ? 'normal' : 'bold',
                  marginBottom: '2px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {email.subject}
                </div>
                <div style={{ 
                  fontSize: '10px', 
                  opacity: 0.6,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {email.from}
                </div>
              </div>
              <div style={{ 
                fontSize: '9px', 
                opacity: 0.5, 
                flexShrink: 0,
                textAlign: 'right',
              }}>
                <div>{formatTime(email.timestamp)}</div>
                <div style={{ 
                  color: CATEGORY_COLORS[email.category],
                  marginTop: '2px',
                  textTransform: 'uppercase',
                  fontSize: '8px',
                }}>
                  {email.category}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
