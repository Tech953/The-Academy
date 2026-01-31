import { useState } from 'react';
import { Mail, MailOpen, Inbox, Send, Archive, Trash2, ArrowLeft, Reply, PenLine } from 'lucide-react';
import { useGameState, Email } from '@/contexts/GameStateContext';
import { useI18n } from '@/contexts/I18nContext';

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
  const { emails, markEmailRead, unreadEmailCount, addEmail } = useGameState();
  const { t } = useI18n();
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [replyMode, setReplyMode] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [replySending, setReplySending] = useState(false);
  
  // Helper to translate category labels
  const getCategoryLabel = (category: string) => {
    const key = `desktop.email.category.${category}`;
    return t(key);
  };
  
  // Helper to translate default email content based on email ID
  const getTranslatedEmail = (email: Email) => {
    const emailKeyMap: Record<string, { subject: string; from: string; body: string }> = {
      'email-welcome': {
        subject: t('email.welcome.subject'),
        from: t('email.welcome.from'),
        body: t('email.welcome.body'),
      },
      'email-schedule': {
        subject: t('email.schedule.subject'),
        from: t('email.schedule.from'),
        body: t('email.schedule.body'),
      },
      'email-faction': {
        subject: t('email.faction.subject'),
        from: t('email.faction.from'),
        body: t('email.faction.body'),
      },
    };
    
    const translation = emailKeyMap[email.id];
    if (translation) {
      return { ...email, ...translation };
    }
    return email;
  };

  const filteredEmails = filter === 'unread' ? emails.filter(e => !e.read) : emails;

  const handleEmailClick = (email: Email) => {
    setSelectedEmail(email);
    setReplyMode(false);
    setReplyContent('');
    if (!email.read) {
      markEmailRead(email.id);
    }
  };
  
  const handleSendReply = () => {
    if (!selectedEmail || !replyContent.trim()) return;
    
    setReplySending(true);
    
    setTimeout(() => {
      const responseTemplates = [
        `Thank you for your message. I've noted your thoughts and will respond more fully soon.`,
        `Your reply has been received. I appreciate you taking the time to write back.`,
        `Thank you for getting in touch. Your message is important to me.`,
      ];
      
      setTimeout(() => {
        addEmail({
          from: selectedEmail.from,
          subject: `Re: ${selectedEmail.subject}`,
          body: responseTemplates[Math.floor(Math.random() * responseTemplates.length)],
          category: selectedEmail.category,
        });
      }, 2000 + Math.random() * 5000);
      
      setReplySending(false);
      setReplyMode(false);
      setReplyContent('');
    }, 1000);
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
            onClick={() => { setSelectedEmail(null); setReplyMode(false); }}
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
          <span>{t('desktop.email.viewMessage')}</span>
          <button 
            onClick={() => setReplyMode(!replyMode)}
            style={{ 
              background: replyMode ? `${NEON_GREEN}30` : 'transparent', 
              border: `1px solid ${NEON_GREEN}60`, 
              color: NEON_GREEN, 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 10px',
              marginLeft: 'auto',
              fontSize: '11px',
              fontFamily: 'inherit',
            }}
          >
            <Reply size={12} />
            {t('desktop.email.reply')}
          </button>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
          {(() => {
            const translatedSelected = getTranslatedEmail(selectedEmail);
            return (
              <>
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
                    {translatedSelected.subject}
                  </div>
                  <div style={{ fontSize: '11px', opacity: 0.7, marginBottom: '4px' }}>
                    {t('desktop.email.from')}: {translatedSelected.from}
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
                  {translatedSelected.body}
                </div>
              </>
            );
          })()}
          
          {replyMode && (
            <div style={{ 
              marginTop: '20px', 
              borderTop: `1px solid ${NEON_GREEN}40`,
              paddingTop: '16px',
            }}>
              <div style={{ 
                fontSize: '11px', 
                color: NEON_GREEN, 
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                <PenLine size={12} />
                {t('desktop.email.composingTo')} {selectedEmail.from}
              </div>
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder={t('desktop.email.placeholder')}
                style={{
                  width: '100%',
                  height: '100px',
                  background: '#0f0f0f',
                  border: `1px solid ${NEON_GREEN}40`,
                  color: NEON_GREEN,
                  padding: '10px',
                  fontFamily: 'inherit',
                  fontSize: '12px',
                  resize: 'none',
                  outline: 'none',
                }}
              />
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <button
                  onClick={handleSendReply}
                  disabled={replySending || !replyContent.trim()}
                  style={{
                    background: replySending ? `${NEON_GREEN}20` : `${NEON_GREEN}30`,
                    border: `1px solid ${NEON_GREEN}`,
                    color: NEON_GREEN,
                    padding: '6px 16px',
                    cursor: replySending || !replyContent.trim() ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit',
                    fontSize: '11px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    opacity: replySending || !replyContent.trim() ? 0.5 : 1,
                  }}
                >
                  <Send size={12} />
                  {replySending ? t('desktop.email.sending') : t('desktop.email.sendReply')}
                </button>
                <button
                  onClick={() => { setReplyMode(false); setReplyContent(''); }}
                  style={{
                    background: 'transparent',
                    border: `1px solid ${NEON_CYAN}40`,
                    color: NEON_CYAN,
                    padding: '6px 12px',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontSize: '11px',
                  }}
                >
                  {t('desktop.email.cancel')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <Mail size={16} />
        <span>{t('desktop.email.title')}</span>
        {unreadEmailCount > 0 && (
          <span style={{ 
            background: NEON_CYAN, 
            color: '#000', 
            padding: '2px 6px', 
            fontSize: '10px',
            fontWeight: 'bold',
            marginLeft: 'auto',
          }}>
            {unreadEmailCount} {t('desktop.email.new')}
          </span>
        )}
      </div>
      
      <div style={sidebarStyle}>
        <button style={filterBtnStyle(filter === 'all')} onClick={() => setFilter('all')}>
          <Inbox size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
          {t('desktop.email.all')} ({emails.length})
        </button>
        <button style={filterBtnStyle(filter === 'unread')} onClick={() => setFilter('unread')}>
          <Mail size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
          {t('desktop.email.unread')} ({unreadEmailCount})
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
            {filter === 'unread' ? t('desktop.email.noUnread') : t('desktop.email.noMessages')}
          </div>
        ) : (
          filteredEmails.map(email => {
            const translatedEmail = getTranslatedEmail(email);
            return (
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
                  {translatedEmail.subject}
                </div>
                <div style={{ 
                  fontSize: '10px', 
                  opacity: 0.6,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {translatedEmail.from}
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
                  {getCategoryLabel(email.category)}
                </div>
              </div>
            </div>
          );
          })
        )}
      </div>
    </div>
  );
}
