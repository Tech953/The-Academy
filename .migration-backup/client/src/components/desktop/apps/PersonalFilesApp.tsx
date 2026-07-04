import { useState, useCallback } from 'react';
import {
  FolderHeart, FileText, BookOpen, Mail, Heart,
  Plus, Trash2, ArrowLeft, Edit2, Check, X, Star, ChevronRight,
} from 'lucide-react';
import { useCrtTheme } from '@/contexts/CrtThemeContext';
import { useGameState, Email } from '@/contexts/GameStateContext';
import { getEarnedMemories, MEMORY_CATALOG, RARITY_COLORS, getCategoryColor } from '@/lib/memoriesStore';
import type { MemoryCatalogEntry, EarnedMemory } from '@/lib/memoriesStore';
import type { JournalEntry, JournalEntryType } from '@/lib/academy-engine/phase1/studentJournal';
import { loadSavedEmailIds as loadSavedIds, persistSavedEmailIds as persistSavedIds } from '@/lib/savedEmailsStore';

// ─── Private Notes Store ───────────────────────────────────────
const PRIVATE_NOTES_KEY = 'academy-private-notes';
interface PrivateNote { id: string; title: string; body: string; createdAt: string; updatedAt: string; }

function loadPrivateNotes(): PrivateNote[] {
  try { return JSON.parse(localStorage.getItem(PRIVATE_NOTES_KEY) || '[]'); }
  catch { return []; }
}
function persistPrivateNotes(notes: PrivateNote[]): void {
  localStorage.setItem(PRIVATE_NOTES_KEY, JSON.stringify(notes));
}

// ─── Journal Reader ────────────────────────────────────────────
function loadJournalEntries(studentId: string): JournalEntry[] {
  try { return JSON.parse(localStorage.getItem(`academy_journal_${studentId}`) || '[]'); }
  catch { return []; }
}

// ─── Shared helpers ────────────────────────────────────────────
function fmtDate(ts: string | Date): string {
  const d = typeof ts === 'string' ? new Date(ts) : ts;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

const ENTRY_TYPE_COLOR: Record<JournalEntryType, string> = {
  attempt: '#ffaa00',
  reflection: '#00ffff',
  hypothesis: '#cc66ff',
  confusion: '#ff3366',
  milestone: '#00ff88',
};

type Section = 'root' | 'journal' | 'notes' | 'letters' | 'keepsakes';

// ─── Sub-views ─────────────────────────────────────────────────

function JournalView({ accentColor, studentId }: { accentColor: string; studentId: string }) {
  const entries = loadJournalEntries(studentId);
  const [selected, setSelected] = useState<JournalEntry | null>(null);
  const [showNewReflection, setShowNewReflection] = useState(false);
  const [reflectionText, setReflectionText] = useState('');
  const [saved, setSaved] = useState(false);

  const sorted = [...entries].sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const handleSaveReflection = useCallback(() => {
    if (!reflectionText.trim()) return;
    const newEntry: JournalEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toISOString(),
      studentId,
      type: 'reflection',
      studentResponse: reflectionText.trim(),
      tags: ['#reflection', '#personal'],
    };
    const key = `academy_journal_${studentId}`;
    const current: JournalEntry[] = JSON.parse(localStorage.getItem(key) || '[]');
    localStorage.setItem(key, JSON.stringify([...current, newEntry]));
    setReflectionText('');
    setShowNewReflection(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [reflectionText, studentId]);

  if (selected) {
    const typeColor = ENTRY_TYPE_COLOR[selected.type] || accentColor;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: `1px solid ${accentColor}30`, flexShrink: 0 }}>
          <button onClick={() => setSelected(null)} style={{ background: 'transparent', border: 'none', color: accentColor, cursor: 'pointer', padding: 4, display: 'flex' }}>
            <ArrowLeft size={14} />
          </button>
          <span style={{ fontSize: 10, color: typeColor, textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 'bold' }}>
            {selected.type}
          </span>
          <span style={{ fontSize: 10, color: `${accentColor}50`, marginLeft: 'auto' }}>
            {fmtDate(selected.timestamp)}
          </span>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
          {selected.skillNode && (
            <div style={{ fontSize: 10, color: `${accentColor}60`, marginBottom: 10, fontStyle: 'italic' }}>
              Skill: {selected.skillNode.replace(/_/g, ' ')}
            </div>
          )}
          {selected.studentResponse && (
            <p style={{ fontSize: 12, color: '#ffffffcc', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>
              {selected.studentResponse}
            </p>
          )}
          {selected.systemObservations && selected.systemObservations.length > 0 && (
            <div style={{ marginTop: 14, padding: '10px 12px', background: `${accentColor}08`, border: `1px solid ${accentColor}20` }}>
              <div style={{ fontSize: 10, color: `${accentColor}60`, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>System Observations</div>
              {selected.systemObservations.map((obs, i) => (
                <div key={i} style={{ fontSize: 11, color: '#ffffff60', lineHeight: 1.5 }}>— {obs}</div>
              ))}
            </div>
          )}
          {selected.reflectionPrompts && selected.reflectionPrompts.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 10, color: `${accentColor}60`, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Reflection Prompts</div>
              {selected.reflectionPrompts.map((p, i) => (
                <div key={i} style={{ fontSize: 11, color: `${accentColor}80`, lineHeight: 1.6, marginBottom: 4 }}>• {p}</div>
              ))}
            </div>
          )}
          {selected.tags.length > 0 && (
            <div style={{ marginTop: 14, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {selected.tags.map(tag => (
                <span key={tag} style={{ fontSize: 9, color: `${accentColor}60`, background: `${accentColor}10`, padding: '2px 7px', borderRadius: 10 }}>
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderBottom: `1px solid ${accentColor}20`, flexShrink: 0 }}>
        <span style={{ flex: 1, fontSize: 10, color: `${accentColor}50` }}>
          {sorted.length} {sorted.length === 1 ? 'entry' : 'entries'}
        </span>
        {saved && <span style={{ fontSize: 10, color: '#00ff88' }}>Saved</span>}
        <button
          onClick={() => setShowNewReflection(v => !v)}
          style={{ display: 'flex', alignItems: 'center', gap: 5, background: `${accentColor}15`, border: `1px solid ${accentColor}40`, color: accentColor, padding: '4px 10px', cursor: 'pointer', fontSize: 10, fontFamily: 'inherit' }}
        >
          <Plus size={11} /> New Reflection
        </button>
      </div>

      {showNewReflection && (
        <div style={{ padding: '10px 14px', borderBottom: `1px solid ${accentColor}20`, flexShrink: 0, background: `${accentColor}06` }}>
          <textarea
            autoFocus
            placeholder="Write a reflection, thought, or hypothesis..."
            value={reflectionText}
            onChange={e => setReflectionText(e.target.value)}
            style={{
              width: '100%', boxSizing: 'border-box', minHeight: 80,
              background: '#000', border: `1px solid ${accentColor}40`, color: '#ffffffcc',
              fontFamily: '"Courier New", monospace', fontSize: 11, padding: 8, resize: 'vertical', outline: 'none',
            }}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 6, justifyContent: 'flex-end' }}>
            <button onClick={() => { setShowNewReflection(false); setReflectionText(''); }} style={{ background: 'transparent', border: `1px solid #ffffff20`, color: '#ffffff50', padding: '4px 10px', cursor: 'pointer', fontSize: 10, fontFamily: 'inherit' }}>Cancel</button>
            <button onClick={handleSaveReflection} style={{ background: `${accentColor}20`, border: `1px solid ${accentColor}60`, color: accentColor, padding: '4px 10px', cursor: 'pointer', fontSize: 10, fontFamily: 'inherit' }}>Save Entry</button>
          </div>
        </div>
      )}

      <div style={{ flex: 1, overflow: 'auto' }}>
        {sorted.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: `${accentColor}40`, fontSize: 11, lineHeight: 1.7 }}>
            No journal entries yet.<br />
            Complete assignments and exercises to build your academic journal.
          </div>
        ) : (
          sorted.map(entry => {
            const typeColor = ENTRY_TYPE_COLOR[entry.type] || accentColor;
            const preview = entry.studentResponse?.slice(0, 90) || entry.systemObservations?.[0]?.slice(0, 90) || '';
            return (
              <button
                key={entry.id}
                onClick={() => setSelected(entry)}
                style={{
                  width: '100%', textAlign: 'left', background: 'transparent', border: 'none',
                  borderBottom: `1px solid ${accentColor}15`, padding: '10px 14px',
                  cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 4,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 9, color: typeColor, textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 'bold', flexShrink: 0 }}>
                    {entry.type}
                  </span>
                  {entry.skillNode && (
                    <span style={{ fontSize: 9, color: `${accentColor}50`, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {entry.skillNode.replace(/_/g, ' ')}
                    </span>
                  )}
                  <span style={{ fontSize: 9, color: `${accentColor}35`, marginLeft: 'auto', flexShrink: 0 }}>
                    {fmtDate(entry.timestamp)}
                  </span>
                </div>
                {preview && (
                  <div style={{ fontSize: 11, color: '#ffffff55', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {preview}{preview.length >= 90 ? '…' : ''}
                  </div>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

function PrivateNotesView({ accentColor }: { accentColor: string }) {
  const [notes, setNotes] = useState<PrivateNote[]>(() => loadPrivateNotes());
  const [selected, setSelected] = useState<PrivateNote | null>(null);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');

  const refresh = () => setNotes(loadPrivateNotes());

  const handleCreate = () => {
    if (!newTitle.trim() && !newBody.trim()) return;
    const note: PrivateNote = {
      id: `note-${Date.now()}`,
      title: newTitle.trim() || 'Untitled',
      body: newBody.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [note, ...notes];
    persistPrivateNotes(updated);
    setNotes(updated);
    setNewTitle('');
    setNewBody('');
    setShowNew(false);
  };

  const handleDelete = (id: string) => {
    const updated = notes.filter(n => n.id !== id);
    persistPrivateNotes(updated);
    setNotes(updated);
    if (selected?.id === id) setSelected(null);
  };

  const handleSaveEdit = () => {
    if (!selected) return;
    const updated = notes.map(n => n.id === selected.id
      ? { ...n, title: editTitle.trim() || 'Untitled', body: editBody, updatedAt: new Date().toISOString() }
      : n
    );
    persistPrivateNotes(updated);
    setNotes(updated);
    setSelected({ ...selected, title: editTitle.trim() || 'Untitled', body: editBody });
    setEditing(false);
  };

  if (selected) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: `1px solid ${accentColor}30`, flexShrink: 0 }}>
          <button onClick={() => { setSelected(null); setEditing(false); refresh(); }} style={{ background: 'transparent', border: 'none', color: accentColor, cursor: 'pointer', padding: 4, display: 'flex' }}>
            <ArrowLeft size={14} />
          </button>
          <span style={{ flex: 1, fontSize: 12, color: '#fff', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {selected.title}
          </span>
          <button onClick={() => { setEditing(v => !v); setEditTitle(selected.title); setEditBody(selected.body); }}
            style={{ background: 'transparent', border: `1px solid ${accentColor}40`, color: accentColor, cursor: 'pointer', padding: '3px 8px', fontSize: 10, display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'inherit' }}>
            <Edit2 size={10} /> {editing ? 'Cancel' : 'Edit'}
          </button>
          <button onClick={() => handleDelete(selected.id)} style={{ background: 'transparent', border: `1px solid #ff336640`, color: '#ff3366', cursor: 'pointer', padding: '3px 8px', fontSize: 10, display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'inherit' }}>
            <Trash2 size={10} />
          </button>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
          {editing ? (
            <>
              <input
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                placeholder="Title"
                style={{ width: '100%', boxSizing: 'border-box', background: '#000', border: `1px solid ${accentColor}40`, color: '#fff', fontFamily: '"Courier New", monospace', fontSize: 13, padding: '6px 8px', outline: 'none', marginBottom: 8 }}
              />
              <textarea
                value={editBody}
                onChange={e => setEditBody(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', minHeight: 200, background: '#000', border: `1px solid ${accentColor}40`, color: '#ffffffcc', fontFamily: '"Courier New", monospace', fontSize: 12, padding: 8, resize: 'vertical', outline: 'none', lineHeight: 1.7 }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                <button onClick={handleSaveEdit} style={{ display: 'flex', alignItems: 'center', gap: 5, background: `${accentColor}20`, border: `1px solid ${accentColor}60`, color: accentColor, padding: '5px 12px', cursor: 'pointer', fontSize: 10, fontFamily: 'inherit' }}>
                  <Check size={11} /> Save Changes
                </button>
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 10, color: `${accentColor}40`, marginBottom: 10 }}>
                Last updated {fmtDate(selected.updatedAt)}
              </div>
              <p style={{ fontSize: 12, color: '#ffffffcc', lineHeight: 1.8, margin: 0, whiteSpace: 'pre-wrap' }}>
                {selected.body || <span style={{ color: `${accentColor}30`, fontStyle: 'italic' }}>Empty note.</span>}
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderBottom: `1px solid ${accentColor}20`, flexShrink: 0 }}>
        <span style={{ flex: 1, fontSize: 10, color: `${accentColor}50` }}>{notes.length} {notes.length === 1 ? 'note' : 'notes'}</span>
        <button onClick={() => setShowNew(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 5, background: `${accentColor}15`, border: `1px solid ${accentColor}40`, color: accentColor, padding: '4px 10px', cursor: 'pointer', fontSize: 10, fontFamily: 'inherit' }}>
          <Plus size={11} /> New Note
        </button>
      </div>

      {showNew && (
        <div style={{ padding: '10px 14px', borderBottom: `1px solid ${accentColor}20`, background: `${accentColor}06`, flexShrink: 0 }}>
          <input
            autoFocus
            placeholder="Title (optional)"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            style={{ width: '100%', boxSizing: 'border-box', background: '#000', border: `1px solid ${accentColor}40`, color: '#fff', fontFamily: '"Courier New", monospace', fontSize: 12, padding: '5px 8px', outline: 'none', marginBottom: 6 }}
          />
          <textarea
            placeholder="Write your note here..."
            value={newBody}
            onChange={e => setNewBody(e.target.value)}
            style={{ width: '100%', boxSizing: 'border-box', minHeight: 70, background: '#000', border: `1px solid ${accentColor}40`, color: '#ffffffcc', fontFamily: '"Courier New", monospace', fontSize: 11, padding: 8, resize: 'vertical', outline: 'none' }}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 6, justifyContent: 'flex-end' }}>
            <button onClick={() => { setShowNew(false); setNewTitle(''); setNewBody(''); }} style={{ background: 'transparent', border: `1px solid #ffffff20`, color: '#ffffff50', padding: '4px 10px', cursor: 'pointer', fontSize: 10, fontFamily: 'inherit' }}>Cancel</button>
            <button onClick={handleCreate} style={{ background: `${accentColor}20`, border: `1px solid ${accentColor}60`, color: accentColor, padding: '4px 10px', cursor: 'pointer', fontSize: 10, fontFamily: 'inherit' }}>Save Note</button>
          </div>
        </div>
      )}

      <div style={{ flex: 1, overflow: 'auto' }}>
        {notes.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: `${accentColor}40`, fontSize: 11, lineHeight: 1.7 }}>
            No private notes yet.<br />Click "New Note" to start writing.
          </div>
        ) : (
          notes.map(note => (
            <button
              key={note.id}
              onClick={() => setSelected(note)}
              style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', borderBottom: `1px solid ${accentColor}15`, padding: '10px 14px', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ flex: 1, fontSize: 12, color: '#ffffffcc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {note.title}
                </span>
                <span style={{ fontSize: 9, color: `${accentColor}35`, flexShrink: 0 }}>{fmtDate(note.updatedAt)}</span>
                <ChevronRight size={12} color={`${accentColor}40`} style={{ flexShrink: 0 }} />
              </div>
              {note.body && (
                <div style={{ fontSize: 11, color: '#ffffff40', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 3 }}>
                  {note.body.slice(0, 80)}{note.body.length > 80 ? '…' : ''}
                </div>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}

function SavedLettersView({ accentColor, emails }: { accentColor: string; emails: Email[] }) {
  const [savedIds, setSavedIds] = useState<Set<string>>(() => loadSavedIds());
  const [selected, setSelected] = useState<Email | null>(null);

  const savedEmails = emails.filter(e => savedIds.has(e.id));

  const unsave = (id: string) => {
    const next = new Set(savedIds);
    next.delete(id);
    persistSavedIds(next);
    setSavedIds(next);
    if (selected?.id === id) setSelected(null);
  };

  if (selected) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: `1px solid ${accentColor}30`, flexShrink: 0 }}>
          <button onClick={() => setSelected(null)} style={{ background: 'transparent', border: 'none', color: accentColor, cursor: 'pointer', padding: 4, display: 'flex' }}>
            <ArrowLeft size={14} />
          </button>
          <span style={{ flex: 1, fontSize: 12, color: '#fff', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {selected.subject}
          </span>
          <button onClick={() => unsave(selected.id)} style={{ background: 'transparent', border: `1px solid #ff336640`, color: '#ff3366', cursor: 'pointer', padding: '3px 8px', fontSize: 10, display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'inherit' }}>
            <X size={10} /> Unsave
          </button>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: `${accentColor}60` }}>From: <span style={{ color: `${accentColor}90` }}>{selected.from}</span></div>
            <div style={{ fontSize: 10, color: `${accentColor}40`, marginTop: 3 }}>{fmtDate(selected.timestamp)}</div>
          </div>
          <p style={{ fontSize: 12, color: '#ffffffcc', lineHeight: 1.8, margin: 0, whiteSpace: 'pre-wrap' }}>
            {selected.body}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '8px 14px', borderBottom: `1px solid ${accentColor}20`, flexShrink: 0 }}>
        <span style={{ fontSize: 10, color: `${accentColor}50` }}>{savedEmails.length} saved {savedEmails.length === 1 ? 'letter' : 'letters'}</span>
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        {savedEmails.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: `${accentColor}40`, fontSize: 11, lineHeight: 1.7 }}>
            No saved letters yet.<br />
            <span style={{ fontSize: 10 }}>Star emails from your inbox to save them here.</span>
          </div>
        ) : (
          savedEmails.map(email => (
            <button
              key={email.id}
              onClick={() => setSelected(email)}
              style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', borderBottom: `1px solid ${accentColor}15`, padding: '10px 14px', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Star size={11} color={accentColor} fill={accentColor} style={{ flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 12, color: '#ffffffcc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {email.subject}
                </span>
                <span style={{ fontSize: 9, color: `${accentColor}35`, flexShrink: 0 }}>{fmtDate(email.timestamp)}</span>
              </div>
              <div style={{ fontSize: 10, color: `${accentColor}50`, marginTop: 3, marginLeft: 19 }}>{email.from}</div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

interface EnrichedMemory { catalog: MemoryCatalogEntry; earned: EarnedMemory; }

function KeepsakesView({ accentColor }: { accentColor: string }) {
  const earnedRaw = getEarnedMemories();
  const enriched: EnrichedMemory[] = earnedRaw
    .map(e => ({ earned: e, catalog: MEMORY_CATALOG.find(m => m.id === e.id) }))
    .filter((x): x is EnrichedMemory => x.catalog !== undefined)
    .sort((a, b) => new Date(b.earned.earnedAt).getTime() - new Date(a.earned.earnedAt).getTime());

  const [selected, setSelected] = useState<EnrichedMemory | null>(null);

  if (selected) {
    const rarityColor = RARITY_COLORS[selected.catalog.rarity];
    const catColor = getCategoryColor(selected.catalog.category);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: `1px solid ${rarityColor}40`, flexShrink: 0 }}>
          <button onClick={() => setSelected(null)} style={{ background: 'transparent', border: 'none', color: accentColor, cursor: 'pointer', padding: 4, display: 'flex' }}>
            <ArrowLeft size={14} />
          </button>
          <span style={{ flex: 1, fontSize: 12, color: '#fff', fontWeight: 'bold' }}>{selected.catalog.title}</span>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 9, color: rarityColor, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 'bold' }}>
              {selected.catalog.rarity}
            </span>
            <span style={{ fontSize: 9, color: catColor, background: `${catColor}15`, padding: '1px 8px', borderRadius: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {selected.catalog.category}
            </span>
            <span style={{ fontSize: 9, color: `${accentColor}40`, marginLeft: 'auto' }}>
              Collected {fmtDate(selected.earned.earnedAt)}
            </span>
          </div>
          <p style={{ fontSize: 12, color: '#ffffffcc', lineHeight: 1.8, margin: 0 }}>
            {selected.catalog.description}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '8px 14px', borderBottom: `1px solid ${accentColor}20`, flexShrink: 0 }}>
        <span style={{ fontSize: 10, color: `${accentColor}50` }}>{enriched.length} {enriched.length === 1 ? 'keepsake' : 'keepsakes'} collected</span>
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        {enriched.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: `${accentColor}40`, fontSize: 11, lineHeight: 1.7 }}>
            No keepsakes yet.<br />Earn memories through gameplay to collect them here.
          </div>
        ) : (
          enriched.map(item => {
            const rarityColor = RARITY_COLORS[item.catalog.rarity];
            const catColor = getCategoryColor(item.catalog.category);
            return (
              <button
                key={item.catalog.id}
                onClick={() => setSelected(item)}
                style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', borderBottom: `1px solid ${accentColor}15`, padding: '10px 14px', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Heart size={12} color={rarityColor} style={{ flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 12, color: '#ffffffcc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.catalog.title}
                  </span>
                  <span style={{ fontSize: 9, color: rarityColor, fontWeight: 'bold', textTransform: 'uppercase', flexShrink: 0 }}>{item.catalog.rarity}</span>
                  <ChevronRight size={12} color={`${accentColor}40`} style={{ flexShrink: 0 }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3, marginLeft: 20 }}>
                  <span style={{ fontSize: 9, color: catColor, background: `${catColor}12`, padding: '1px 6px', borderRadius: 8 }}>{item.catalog.category}</span>
                  <span style={{ fontSize: 9, color: `${accentColor}35` }}>{fmtDate(item.earned.earnedAt)}</span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Root Folder List ──────────────────────────────────────────
const SECTIONS = [
  { id: 'journal' as Section, label: 'Journal Entries', icon: BookOpen, desc: 'Academic learning records & reflections' },
  { id: 'notes' as Section, label: 'Private Notes', icon: FileText, desc: 'Personal notes and thoughts' },
  { id: 'letters' as Section, label: 'Saved Letters', icon: Mail, desc: 'Starred emails from your inbox' },
  { id: 'keepsakes' as Section, label: 'Keepsakes', icon: Heart, desc: 'Memories and milestones collected' },
];

const SECTION_TITLES: Record<Section, string> = {
  root: 'Personal Files',
  journal: 'Journal Entries',
  notes: 'Private Notes',
  letters: 'Saved Letters',
  keepsakes: 'Keepsakes',
};

// ─── Main App ──────────────────────────────────────────────────
export default function PersonalFilesApp() {
  const { accentColors } = useCrtTheme();
  const { emails, character } = useGameState();
  const [section, setSection] = useState<Section>('root');

  const accentColor = accentColors.pink;
  const studentId = character.name.toLowerCase().replace(/\s+/g, '_') || 'student';

  const renderSection = () => {
    switch (section) {
      case 'journal': return <JournalView accentColor={accentColor} studentId={studentId} />;
      case 'notes': return <PrivateNotesView accentColor={accentColor} />;
      case 'letters': return <SavedLettersView accentColor={accentColor} emails={emails} />;
      case 'keepsakes': return <KeepsakesView accentColor={accentColor} />;
      default: return null;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: '"Courier New", monospace', color: accentColor, background: '#000' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: `1px solid ${accentColor}40`, flexShrink: 0, background: `${accentColor}06` }}>
        {section !== 'root' && (
          <button onClick={() => setSection('root')} style={{ background: 'transparent', border: 'none', color: accentColor, cursor: 'pointer', padding: '2px 4px', display: 'flex' }}>
            <ArrowLeft size={14} />
          </button>
        )}
        <FolderHeart size={16} color={accentColor} style={{ flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontWeight: 'bold', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
          {SECTION_TITLES[section]}
        </span>
      </div>

      {section === 'root' ? (
        <div style={{ flex: 1, overflow: 'auto', padding: '14px 12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {SECTIONS.map(({ id, label, icon: Icon, desc }) => (
              <button
                key={id}
                onClick={() => setSection(id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px',
                  background: 'transparent',
                  border: `1px solid ${accentColor}30`,
                  color: accentColor,
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: 'inherit',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${accentColor}10`; (e.currentTarget as HTMLElement).style.borderColor = `${accentColor}70`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.borderColor = `${accentColor}30`; }}
              >
                <Icon size={18} color={accentColor} style={{ flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 'bold' }}>{label}</div>
                  <div style={{ fontSize: 10, color: `${accentColor}60`, marginTop: 2 }}>{desc}</div>
                </div>
                <ChevronRight size={14} color={`${accentColor}50`} />
              </button>
            ))}
          </div>
          <p style={{ marginTop: 20, fontSize: 10, color: `${accentColor}30`, textAlign: 'center' }}>
            Your personal memories and files.
          </p>
        </div>
      ) : (
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {renderSection()}
        </div>
      )}
    </div>
  );
}

