import { useState, useCallback } from 'react';
import { Mail, MailOpen, Inbox, Send, ArrowLeft, Reply, PenLine, UserPlus, X, Loader, Star } from 'lucide-react';
import { useGameState, Email } from '@/contexts/GameStateContext';
import { useI18n } from '@/contexts/I18nContext';
import { useRadiantAI } from '@/hooks/useRadiantAI';
import { NPCEntity } from '@/lib/radiantAI';
import NPCDirectoryPanel, { NPCContactStatus } from './NPCDirectoryPanel';
import { toggleSavedEmailId } from '@/lib/savedEmailsStore';

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

interface ComposeState {
  to: string;
  toRole: string;
  subject: string;
  body: string;
  npcId: string | null;
}

export default function AcademyEmailApp() {
  const { emails, markEmailRead, unreadEmailCount, addEmail, isEnrolled, character } = useGameState();
  const { processInteraction, getRelationshipWithPlayer } = useRadiantAI();
  const { t } = useI18n();
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [replyMode, setReplyMode] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [replySending, setReplySending] = useState(false);
  const [showDirectory, setShowDirectory] = useState(false);
  const [composeState, setComposeState] = useState<ComposeState | null>(null);
  const [composeSending, setComposeSending] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('academy-saved-email-ids') || '[]')); }
    catch { return new Set(); }
  });

  const getCategoryLabel = (category: string) => t(`desktop.email.category.${category}`);

  const getTranslatedEmail = (email: Email) => {
    const emailKeyMap: Record<string, { subject: string; from: string; body: string }> = {
      'email-welcome': { subject: t('email.welcome.subject'), from: t('email.welcome.from'), body: t('email.welcome.body') },
      'email-schedule': { subject: t('email.schedule.subject'), from: t('email.schedule.from'), body: t('email.schedule.body') },
      'email-faction': { subject: t('email.faction.subject'), from: t('email.faction.from'), body: t('email.faction.body') },
    };
    const translation = emailKeyMap[email.id];
    return translation ? { ...email, ...translation } : email;
  };

  const filteredEmails = filter === 'unread' ? emails.filter(e => !e.read) : emails;

  const handleEmailClick = (email: Email) => {
    setSelectedEmail(email);
    setReplyMode(false);
    setReplyContent('');
    setShowDirectory(false);
    setComposeState(null);
    if (!email.read) markEmailRead(email.id);
  };

  const handleSendReply = () => {
    if (!selectedEmail || !replyContent.trim()) return;
    setReplySending(true);
    setTimeout(() => {
      const responses = [
        `Thank you for your message. I've noted your thoughts and will respond more fully soon.`,
        `Your reply has been received. I appreciate you taking the time to write back.`,
        `Thank you for getting in touch. Your message is important to me.`,
      ];
      setTimeout(() => {
        addEmail({
          from: selectedEmail.from,
          subject: `Re: ${selectedEmail.subject}`,
          body: responses[Math.floor(Math.random() * responses.length)],
          category: selectedEmail.category,
        });
      }, 2000 + Math.random() * 5000);
      setReplySending(false);
      setReplyMode(false);
      setReplyContent('');
    }, 1000);
  };

  const handleSelectNPC = useCallback((npc: NPCEntity, status: NPCContactStatus) => {
    setShowDirectory(false);
    setComposeState({
      to: npc.name,
      toRole: npc.role === 'Teacher' ? 'Faculty' : npc.faction ? `${npc.faction}` : 'Student',
      subject: '',
      body: '',
      npcId: npc.id,
    });
  }, []);

  const handleSendCompose = () => {
    if (!composeState || !composeState.subject.trim() || !composeState.body.trim()) return;
    setComposeSending(true);

    addEmail({
      from: `${character.name} (You)`,
      subject: `[Sent] ${composeState.subject}`,
      body: `To: ${composeState.to}\n\n${composeState.body}`,
      category: 'personal',
    });

    if (composeState.npcId) {
      processInteraction(composeState.npcId, 'positive', 'positive');
    }

    const delay = 3000 + Math.random() * 8000;
    setTimeout(() => {
      const rel = composeState.npcId ? getRelationshipWithPlayer(composeState.npcId) : null;
      const affinity = rel?.affinity ?? 0;
      const npcName = composeState.to;
      const subject = composeState.subject;

      let body = '';
      if (affinity < 0) {
        body = `I received your email, ${character.name}. I'll be honest — I wasn't expecting to hear from you. I'll give your message some thought. Don't expect a quick follow-up.\n\n— ${npcName}`;
      } else if (affinity < 25) {
        body = `Hi ${character.name},\n\nThanks for reaching out regarding "${subject}". I'll look into it and get back to you when I have something useful to say.\n\nBest,\n${npcName}`;
      } else if (affinity < 60) {
        body = `Hey ${character.name}!\n\nGot your message about "${subject}". Great to hear from you — let's definitely follow up on this. I have some thoughts I'd like to share.\n\n— ${npcName}`;
      } else {
        body = `${character.name}!\n\nYes — absolutely. "${subject}" is something I've been thinking about too. We should talk in person, but here's my take for now:\n\nThis matters. Let's make sure we follow through on it together.\n\n— ${npcName}`;
      }

      addEmail({
        from: npcName,
        subject: `Re: ${subject}`,
        body,
        category: 'personal',
      });
    }, delay);

    setTimeout(() => {
      setComposeSending(false);
      setComposeState(null);
    }, 1200);
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  const containerStyle: React.CSSProperties = {
    width: '100%', height: '100%',
    background: '#0a0a0a',
    fontFamily: '"Courier New", monospace',
    color: NEON_CYAN,
    display: 'flex', flexDirection: 'column',
    overflow: 'hidden',
    position: 'relative',
  };

  const headerStyle: React.CSSProperties = {
    fontSize: '14px', fontWeight: 'bold',
    padding: '10px 14px',
    textShadow: `0 0 10px ${NEON_CYAN}`,
    borderBottom: `1px solid ${NEON_CYAN}40`,
    display: 'flex', alignItems: 'center', gap: '8px',
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

  if (!isEnrolled) {
    return (
      <div style={{ width: '100%', height: '100%', background: '#0a0a0a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: '"Courier New", monospace', color: NEON_GREEN, gap: '16px', padding: '24px', textAlign: 'center' }}>
        <Mail size={40} style={{ color: NEON_CYAN, opacity: 0.4 }} />
        <div style={{ color: NEON_CYAN, fontSize: '14px', letterSpacing: '2px', textTransform: 'uppercase' }}>Academy Email</div>
        <div style={{ color: '#555', fontSize: '11px', lineHeight: '1.8', maxWidth: '280px' }}>
          Your inbox is waiting. Enroll in a class to activate Academy communications and receive emails from faculty, staff, and fellow students.
        </div>
        <div style={{ color: NEON_GREEN, fontSize: '10px', opacity: 0.6, border: `1px solid ${NEON_GREEN}33`, padding: '8px 16px', letterSpacing: '1px' }}>
          TYPE: ENROLL IN THE ACADEMY TERMINAL
        </div>
      </div>
    );
  }

  if (selectedEmail) {
    const translatedSelected = getTranslatedEmail(selectedEmail);
    return (
      <div style={containerStyle}>
        <div style={headerStyle}>
          <button
            onClick={() => { setSelectedEmail(null); setReplyMode(false); }}
            style={{ background: 'transparent', border: 'none', color: NEON_CYAN, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <ArrowLeft size={16} />
          </button>
          <MailOpen size={15} />
          <span style={{ flex: 1, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {translatedSelected.subject}
          </span>
          <button
            onClick={() => {
              const wasAdded = toggleSavedEmailId(selectedEmail.id);
              setSavedIds(prev => {
                const next = new Set(prev);
                if (wasAdded) next.add(selectedEmail.id); else next.delete(selectedEmail.id);
                return next;
              });
            }}
            title={savedIds.has(selectedEmail.id) ? 'Remove from Personal Files' : 'Save to Personal Files'}
            style={{
              background: savedIds.has(selectedEmail.id) ? `${NEON_AMBER}20` : 'transparent',
              border: `1px solid ${NEON_AMBER}60`,
              color: NEON_AMBER,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center',
              padding: '4px 8px',
            }}
          >
            <Star size={12} fill={savedIds.has(selectedEmail.id) ? NEON_AMBER : 'transparent'} />
          </button>
          <button
            onClick={() => setReplyMode(!replyMode)}
            style={{
              background: replyMode ? `${NEON_GREEN}30` : 'transparent',
              border: `1px solid ${NEON_GREEN}60`,
              color: NEON_GREEN,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '4px',
              padding: '4px 10px', fontSize: '11px',
              fontFamily: 'inherit',
            }}
          >
            <Reply size={12} />
            {t('desktop.email.reply')}
          </button>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
          <div style={{ borderBottom: `1px solid ${NEON_CYAN}30`, paddingBottom: '12px', marginBottom: '16px' }}>
            <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: CATEGORY_COLORS[selectedEmail.category] || NEON_CYAN }}>
              {translatedSelected.subject}
            </div>
            <div style={{ fontSize: '11px', opacity: 0.7, marginBottom: '4px' }}>
              {t('desktop.email.from')}: {translatedSelected.from}
            </div>
            <div style={{ fontSize: '10px', opacity: 0.5 }}>
              {formatTime(selectedEmail.timestamp)}
            </div>
          </div>
          <div style={{ fontSize: '12px', lineHeight: 1.6, whiteSpace: 'pre-wrap', opacity: 0.9 }}>
            {translatedSelected.body}
          </div>

          {replyMode && (
            <div style={{ marginTop: '20px', borderTop: `1px solid ${NEON_GREEN}40`, paddingTop: '16px' }}>
              <div style={{ fontSize: '11px', color: NEON_GREEN, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <PenLine size={12} />
                {t('desktop.email.composingTo')} {selectedEmail.from}
              </div>
              <textarea
                value={replyContent}
                onChange={e => setReplyContent(e.target.value)}
                placeholder={t('desktop.email.placeholder')}
                style={{
                  width: '100%', height: '100px',
                  background: '#0f0f0f', border: `1px solid ${NEON_GREEN}40`,
                  color: NEON_GREEN, padding: '10px',
                  fontFamily: 'inherit', fontSize: '12px',
                  resize: 'none', outline: 'none', boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <button
                  onClick={handleSendReply}
                  disabled={replySending || !replyContent.trim()}
                  style={{
                    background: `${NEON_GREEN}30`, border: `1px solid ${NEON_GREEN}`,
                    color: NEON_GREEN, padding: '6px 16px',
                    cursor: replySending || !replyContent.trim() ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit', fontSize: '11px',
                    display: 'flex', alignItems: 'center', gap: '6px',
                    opacity: replySending || !replyContent.trim() ? 0.5 : 1,
                  }}
                >
                  <Send size={12} />
                  {replySending ? t('desktop.email.sending') : t('desktop.email.sendReply')}
                </button>
                <button
                  onClick={() => { setReplyMode(false); setReplyContent(''); }}
                  style={{ background: 'transparent', border: `1px solid ${NEON_CYAN}40`, color: NEON_CYAN, padding: '6px 12px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '11px' }}
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

  if (composeState) {
    return (
      <div style={containerStyle}>
        <div style={headerStyle}>
          <button
            onClick={() => setComposeState(null)}
            style={{ background: 'transparent', border: 'none', color: NEON_CYAN, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <ArrowLeft size={16} />
          </button>
          <PenLine size={15} />
          <span style={{ flex: 1, fontSize: 12 }}>COMPOSE — {composeState.to}</span>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${NEON_CYAN}20`, paddingBottom: 10 }}>
            <span style={{ fontSize: 10, color: `${NEON_CYAN}70`, width: 50, flexShrink: 0 }}>TO:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: NEON_CYAN, fontWeight: 'bold' }}>{composeState.to}</span>
              <span style={{ fontSize: 9, color: `${NEON_AMBER}90`, background: `${NEON_AMBER}15`, padding: '2px 6px' }}>
                {composeState.toRole}
              </span>
            </div>
            <button
              onClick={() => { setComposeState(null); setShowDirectory(true); }}
              style={{ marginLeft: 'auto', background: 'transparent', border: `1px solid ${NEON_CYAN}30`, color: `${NEON_CYAN}60`, padding: '3px 8px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 9, display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <UserPlus size={9} />
              CHANGE
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${NEON_CYAN}20`, paddingBottom: 10 }}>
            <span style={{ fontSize: 10, color: `${NEON_CYAN}70`, width: 50, flexShrink: 0 }}>SUBJECT:</span>
            <input
              type="text"
              value={composeState.subject}
              onChange={e => setComposeState(s => s ? { ...s, subject: e.target.value } : s)}
              placeholder="Email subject..."
              style={{
                flex: 1, background: 'transparent', border: 'none',
                color: NEON_CYAN, fontFamily: 'inherit', fontSize: 12, outline: 'none',
              }}
            />
          </div>

          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 10, color: `${NEON_CYAN}70`, display: 'block', marginBottom: 6 }}>MESSAGE:</span>
            <textarea
              value={composeState.body}
              onChange={e => setComposeState(s => s ? { ...s, body: e.target.value } : s)}
              placeholder={`Write to ${composeState.to}...`}
              style={{
                width: '100%', height: '160px',
                background: '#0f0f0f', border: `1px solid ${NEON_CYAN}30`,
                color: NEON_CYAN, padding: '10px',
                fontFamily: 'inherit', fontSize: 12,
                resize: 'none', outline: 'none', boxSizing: 'border-box',
                lineHeight: 1.6,
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleSendCompose}
              disabled={composeSending || !composeState.subject.trim() || !composeState.body.trim()}
              style={{
                background: `${NEON_CYAN}25`, border: `1px solid ${NEON_CYAN}`,
                color: NEON_CYAN, padding: '8px 20px',
                cursor: composeSending || !composeState.subject.trim() || !composeState.body.trim() ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', fontSize: 11,
                display: 'flex', alignItems: 'center', gap: 6,
                opacity: composeSending || !composeState.subject.trim() || !composeState.body.trim() ? 0.5 : 1,
              }}
            >
              {composeSending ? <Loader size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={12} />}
              {composeSending ? 'SENDING...' : 'SEND'}
            </button>
            <button
              onClick={() => setComposeState(null)}
              style={{ background: 'transparent', border: `1px solid ${NEON_CYAN}30`, color: `${NEON_CYAN}70`, padding: '8px 14px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 11 }}
            >
              DISCARD
            </button>
          </div>
        </div>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {showDirectory && (
        <NPCDirectoryPanel
          mode="email"
          onClose={() => setShowDirectory(false)}
          onSelectNPC={handleSelectNPC}
          alreadyConnected={[]}
        />
      )}

      <div style={headerStyle}>
        <Mail size={15} />
        <span style={{ flex: 1 }}>{t('desktop.email.title')}</span>
        {unreadEmailCount > 0 && (
          <span style={{ background: NEON_CYAN, color: '#000', padding: '2px 6px', fontSize: '10px', fontWeight: 'bold' }}>
            {unreadEmailCount} {t('desktop.email.new')}
          </span>
        )}
        <button
          onClick={() => setShowDirectory(true)}
          title="Compose to NPC"
          style={{
            background: `${NEON_CYAN}18`, border: `1px solid ${NEON_CYAN}50`,
            color: NEON_CYAN, padding: '4px 8px',
            cursor: 'pointer', fontFamily: 'inherit', fontSize: 10,
            display: 'flex', alignItems: 'center', gap: 4,
            letterSpacing: '0.5px',
          }}
        >
          <PenLine size={11} />
          COMPOSE
        </button>
      </div>

      <div style={{ display: 'flex', gap: '8px', padding: '8px 14px', borderBottom: `1px solid ${NEON_CYAN}20`, flexShrink: 0 }}>
        <button style={filterBtnStyle(filter === 'all')} onClick={() => setFilter('all')}>
          <Inbox size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
          {t('desktop.email.all')} ({emails.length})
        </button>
        <button style={filterBtnStyle(filter === 'unread')} onClick={() => setFilter('unread')}>
          <Mail size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
          {t('desktop.email.unread')} ({unreadEmailCount})
        </button>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
        {filteredEmails.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', opacity: 0.5, fontSize: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <Mail size={32} style={{ opacity: 0.3 }} />
            <div>{filter === 'unread' ? t('desktop.email.noUnread') : t('desktop.email.noMessages')}</div>
            {filter === 'all' && (
              <button
                onClick={() => setShowDirectory(true)}
                style={{
                  background: `${NEON_CYAN}15`, border: `1px solid ${NEON_CYAN}40`,
                  color: NEON_CYAN, padding: '8px 16px',
                  cursor: 'pointer', fontSize: 11, fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <UserPlus size={12} />
                Compose to an NPC
              </button>
            )}
          </div>
        ) : (
          filteredEmails.map(email => {
            const translatedEmail = getTranslatedEmail(email);
            return (
              <div
                key={email.id}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: '10px',
                  padding: '10px 12px', marginBottom: '4px',
                  background: email.read ? 'transparent' : `${NEON_CYAN}10`,
                  border: `1px solid ${email.read ? NEON_CYAN + '20' : NEON_CYAN + '40'}`,
                  cursor: 'pointer', transition: 'background 0.2s',
                }}
                onClick={() => handleEmailClick(email)}
                onMouseEnter={e => (e.currentTarget.style.background = `${NEON_CYAN}15`)}
                onMouseLeave={e => (e.currentTarget.style.background = email.read ? 'transparent' : `${NEON_CYAN}10`)}
              >
                {email.read
                  ? <MailOpen size={14} style={{ opacity: 0.5, flexShrink: 0, marginTop: '2px' }} />
                  : <Mail size={14} style={{ color: NEON_CYAN, flexShrink: 0, marginTop: '2px' }} />
                }
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '11px', fontWeight: email.read ? 'normal' : 'bold', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {translatedEmail.subject}
                  </div>
                  <div style={{ fontSize: '10px', opacity: 0.6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {translatedEmail.from}
                  </div>
                </div>
                <div style={{ fontSize: '9px', opacity: 0.5, flexShrink: 0, textAlign: 'right' }}>
                  <div>{formatTime(email.timestamp)}</div>
                  <div style={{ color: CATEGORY_COLORS[email.category], marginTop: '2px', textTransform: 'uppercase', fontSize: '8px' }}>
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
