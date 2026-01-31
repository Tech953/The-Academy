/**
 * Research Notebook App
 * Student research journals with auto-capture, manual entries, and searchable indexing.
 */

import { useState, useEffect } from 'react';
import { BookOpen, Search, Plus, Tag, Clock, Filter, Trash2 } from 'lucide-react';
import { StudentJournal, type JournalEntry, type JournalEntryType } from '@/lib/academy-engine';

interface ResearchNotebookAppProps {
  windowId: string;
  studentId?: string;
}

const ACCENT_COLORS = {
  green: '#00ff41',
  cyan: '#00d4ff',
  amber: '#ffb000',
  purple: '#bf00ff',
  pink: '#ff0080'
};

const ENTRY_TYPE_COLORS: Record<JournalEntryType, string> = {
  attempt: ACCENT_COLORS.green,
  reflection: ACCENT_COLORS.cyan,
  hypothesis: ACCENT_COLORS.purple,
  confusion: ACCENT_COLORS.amber,
  milestone: ACCENT_COLORS.pink
};

export function ResearchNotebookApp({ windowId, studentId = 'default-student' }: ResearchNotebookAppProps) {
  const [journal] = useState(() => new StudentJournal(studentId));
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<JournalEntryType | 'all'>('all');
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [newEntryType, setNewEntryType] = useState<'reflection' | 'hypothesis' | 'confusion'>('reflection');
  const [newEntryContent, setNewEntryContent] = useState('');
  const [newEntrySkill, setNewEntrySkill] = useState('');

  useEffect(() => {
    loadEntries();
  }, [filterType, searchQuery]);

  const loadEntries = () => {
    let allEntries = journal.getAllEntries();
    
    if (filterType !== 'all') {
      allEntries = allEntries.filter(e => e.type === filterType);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      allEntries = allEntries.filter(e => 
        e.studentResponse?.toLowerCase().includes(query) ||
        e.skillNode?.toLowerCase().includes(query) ||
        e.tags.some(t => t.toLowerCase().includes(query))
      );
    }
    
    setEntries(allEntries.reverse());
  };

  const handleAddEntry = () => {
    if (!newEntryContent.trim()) return;
    
    if (newEntryType === 'reflection') {
      journal.addReflection(newEntryContent, newEntrySkill || undefined);
    } else if (newEntryType === 'hypothesis') {
      journal.addHypothesis(newEntryContent, newEntrySkill || undefined);
    } else if (newEntryType === 'confusion') {
      journal.addConfusion(newEntryContent, newEntrySkill || undefined);
    }
    
    setNewEntryContent('');
    setNewEntrySkill('');
    setShowNewEntry(false);
    loadEntries();
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const stats = journal.getStats();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: '#0a0a0a',
      color: ACCENT_COLORS.green,
      fontFamily: '"Courier New", monospace',
      fontSize: '13px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px',
        borderBottom: `1px solid ${ACCENT_COLORS.green}40`,
        background: '#0d0d0d'
      }}>
        <BookOpen size={20} color={ACCENT_COLORS.cyan} />
        <span style={{ color: ACCENT_COLORS.cyan, fontWeight: 'bold' }}>RESEARCH NOTEBOOK</span>
        <span style={{ color: '#666', marginLeft: 'auto' }}>
          {stats.totalEntries} entries | {Math.round(stats.successRate * 100)}% success rate
        </span>
      </div>

      <div style={{
        display: 'flex',
        gap: '8px',
        padding: '12px',
        borderBottom: `1px solid ${ACCENT_COLORS.green}20`
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          background: '#111',
          padding: '6px 12px',
          borderRadius: '4px',
          border: `1px solid ${ACCENT_COLORS.green}30`,
          flex: 1
        }}>
          <Search size={16} color={ACCENT_COLORS.green} />
          <input
            type="text"
            placeholder="Search entries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              color: ACCENT_COLORS.green,
              outline: 'none',
              width: '100%',
              fontFamily: 'inherit'
            }}
          />
        </div>
        
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as JournalEntryType | 'all')}
          style={{
            background: '#111',
            border: `1px solid ${ACCENT_COLORS.green}30`,
            color: ACCENT_COLORS.green,
            padding: '6px 12px',
            borderRadius: '4px',
            fontFamily: 'inherit',
            cursor: 'pointer'
          }}
        >
          <option value="all">All Types</option>
          <option value="attempt">Attempts</option>
          <option value="reflection">Reflections</option>
          <option value="hypothesis">Hypotheses</option>
          <option value="confusion">Confusions</option>
          <option value="milestone">Milestones</option>
        </select>

        <button
          onClick={() => setShowNewEntry(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: ACCENT_COLORS.cyan + '20',
            border: `1px solid ${ACCENT_COLORS.cyan}`,
            color: ACCENT_COLORS.cyan,
            padding: '6px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontFamily: 'inherit'
          }}
        >
          <Plus size={16} />
          New Entry
        </button>
      </div>

      {showNewEntry && (
        <div style={{
          padding: '12px',
          background: '#111',
          borderBottom: `1px solid ${ACCENT_COLORS.cyan}40`
        }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            {(['reflection', 'hypothesis', 'confusion'] as const).map(type => (
              <button
                key={type}
                onClick={() => setNewEntryType(type)}
                style={{
                  padding: '4px 12px',
                  background: newEntryType === type ? ENTRY_TYPE_COLORS[type] + '30' : 'transparent',
                  border: `1px solid ${ENTRY_TYPE_COLORS[type]}`,
                  color: ENTRY_TYPE_COLORS[type],
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: '11px',
                  textTransform: 'capitalize'
                }}
              >
                {type}
              </button>
            ))}
          </div>
          
          <input
            type="text"
            placeholder="Related skill (optional)"
            value={newEntrySkill}
            onChange={(e) => setNewEntrySkill(e.target.value)}
            style={{
              width: '100%',
              background: '#0a0a0a',
              border: `1px solid ${ACCENT_COLORS.green}30`,
              color: ACCENT_COLORS.green,
              padding: '8px',
              borderRadius: '4px',
              marginBottom: '8px',
              fontFamily: 'inherit'
            }}
          />
          
          <textarea
            placeholder="Write your thoughts..."
            value={newEntryContent}
            onChange={(e) => setNewEntryContent(e.target.value)}
            style={{
              width: '100%',
              height: '80px',
              background: '#0a0a0a',
              border: `1px solid ${ACCENT_COLORS.green}30`,
              color: ACCENT_COLORS.green,
              padding: '8px',
              borderRadius: '4px',
              resize: 'none',
              fontFamily: 'inherit'
            }}
          />
          
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <button
              onClick={handleAddEntry}
              style={{
                padding: '6px 16px',
                background: ACCENT_COLORS.green + '20',
                border: `1px solid ${ACCENT_COLORS.green}`,
                color: ACCENT_COLORS.green,
                borderRadius: '4px',
                cursor: 'pointer',
                fontFamily: 'inherit'
              }}
            >
              Save Entry
            </button>
            <button
              onClick={() => setShowNewEntry(false)}
              style={{
                padding: '6px 16px',
                background: 'transparent',
                border: `1px solid #666`,
                color: '#666',
                borderRadius: '4px',
                cursor: 'pointer',
                fontFamily: 'inherit'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div style={{ 
        flex: 1, 
        overflow: 'auto',
        padding: '12px'
      }}>
        {entries.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            color: '#666', 
            padding: '40px' 
          }}>
            <BookOpen size={40} style={{ marginBottom: '12px', opacity: 0.5 }} />
            <p>No journal entries yet.</p>
            <p style={{ fontSize: '11px' }}>Start learning to automatically capture your progress,</p>
            <p style={{ fontSize: '11px' }}>or add a reflection manually.</p>
          </div>
        ) : (
          entries.map(entry => (
            <div
              key={entry.id}
              style={{
                background: '#111',
                border: `1px solid ${ENTRY_TYPE_COLORS[entry.type]}30`,
                borderLeft: `3px solid ${ENTRY_TYPE_COLORS[entry.type]}`,
                borderRadius: '4px',
                padding: '12px',
                marginBottom: '8px'
              }}
            >
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <span style={{ 
                  color: ENTRY_TYPE_COLORS[entry.type],
                  textTransform: 'uppercase',
                  fontSize: '11px',
                  fontWeight: 'bold'
                }}>
                  {entry.type}
                </span>
                <span style={{ color: '#666', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={12} />
                  {formatDate(entry.timestamp)}
                </span>
              </div>
              
              {entry.skillNode && (
                <div style={{ 
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: ACCENT_COLORS.purple + '20',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  marginBottom: '8px',
                  fontSize: '11px',
                  color: ACCENT_COLORS.purple
                }}>
                  <Tag size={10} />
                  {entry.skillNode}
                </div>
              )}
              
              {entry.studentResponse && (
                <p style={{ 
                  margin: '8px 0',
                  lineHeight: 1.5,
                  color: '#ccc'
                }}>
                  {entry.studentResponse}
                </p>
              )}
              
              {entry.outcome && (
                <div style={{
                  display: 'inline-block',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  background: entry.outcome === 'success' 
                    ? ACCENT_COLORS.green + '20' 
                    : entry.outcome === 'struggle'
                    ? ACCENT_COLORS.amber + '20'
                    : '#333',
                  color: entry.outcome === 'success' 
                    ? ACCENT_COLORS.green 
                    : entry.outcome === 'struggle'
                    ? ACCENT_COLORS.amber
                    : '#999'
                }}>
                  {entry.outcome}
                </div>
              )}
              
              {entry.reflectionPrompts && entry.reflectionPrompts.length > 0 && (
                <div style={{ 
                  marginTop: '8px',
                  padding: '8px',
                  background: '#0a0a0a',
                  borderRadius: '4px',
                  fontSize: '11px',
                  color: '#888'
                }}>
                  <span style={{ color: ACCENT_COLORS.cyan }}>Reflection prompts:</span>
                  <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                    {entry.reflectionPrompts.map((prompt, i) => (
                      <li key={i}>{prompt}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {entry.tags.length > 0 && (
                <div style={{ 
                  display: 'flex', 
                  gap: '4px', 
                  flexWrap: 'wrap',
                  marginTop: '8px'
                }}>
                  {entry.tags.map((tag, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: '10px',
                        color: '#666',
                        background: '#1a1a1a',
                        padding: '2px 6px',
                        borderRadius: '3px'
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
