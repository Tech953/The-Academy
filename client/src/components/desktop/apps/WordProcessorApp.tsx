import { useState, useCallback, useRef, useEffect, KeyboardEvent } from 'react';
import { useCrtTheme } from '@/contexts/CrtThemeContext';
import {
  academyDocs, newDoc, newBlock, docWordCount, docToPlainText,
  AcademyDoc, DocBlock, BlockType, DOCS_ROOT, DOC_EXT,
} from '@/lib/academyDocuments';
import { virtualFS } from '@/lib/virtualFilesystem';

// ─── Constants ────────────────────────────────────────────────────────────────

const BLOCK_LABELS: Record<BlockType, string> = {
  paragraph: 'P', heading1: 'H1', heading2: 'H2', heading3: 'H3',
  code: '</', quote: '"', math: 'Σ', annotation: '†', divider: '—',
};

const BLOCK_TYPES: BlockType[] = [
  'paragraph', 'heading1', 'heading2', 'heading3', 'code', 'quote', 'math', 'annotation', 'divider',
];

const BLOCK_TYPE_NAMES: Record<BlockType, string> = {
  paragraph: 'Paragraph', heading1: 'Heading 1', heading2: 'Heading 2', heading3: 'Heading 3',
  code: 'Code', quote: 'Quote', math: 'Math / Formula', annotation: 'Annotation', divider: 'Divider',
};

// ─── Auto-resize textarea ─────────────────────────────────────────────────────

function autoResize(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = `${el.scrollHeight}px`;
}

// ─── Block editor row ─────────────────────────────────────────────────────────

interface BlockRowProps {
  block: DocBlock;
  color: string;
  accentColors: { green: string; amber: string; red: string; cyan: string; purple: string; pink: string };
  focused: boolean;
  onFocus: () => void;
  onChange: (updates: Partial<DocBlock>) => void;
  onDelete: () => void;
  onNewBelow: () => void;
  onFocusPrev: () => void;
  blockRef: (el: HTMLTextAreaElement | null) => void;
  typeMenuOpen: boolean;
  onToggleTypeMenu: () => void;
  onCloseTypeMenu: () => void;
}

function BlockRow({
  block, color, accentColors, focused,
  onFocus, onChange, onDelete, onNewBelow, onFocusPrev,
  blockRef, typeMenuOpen, onToggleTypeMenu, onCloseTypeMenu,
}: BlockRowProps) {
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  const setRef = (el: HTMLTextAreaElement | null) => {
    taRef.current = el;
    blockRef(el);
    if (el) autoResize(el);
  };

  useEffect(() => { autoResize(taRef.current); }, [block.content]);

  const blockAccent = (() => {
    switch (block.type) {
      case 'heading1': case 'heading2': case 'heading3': return color;
      case 'code':        return accentColors.green;
      case 'quote':       return accentColors.amber;
      case 'math':        return accentColors.purple;
      case 'annotation':  return accentColors.cyan;
      default:            return color;
    }
  })();

  const textStyle: React.CSSProperties = (() => {
    const base: React.CSSProperties = {
      flex: 1, background: 'transparent', border: 'none', outline: 'none',
      color, fontFamily: 'Courier New, monospace', resize: 'none', overflow: 'hidden',
      padding: '2px 0', width: '100%', minHeight: 24, lineHeight: 1.7,
    };
    switch (block.type) {
      case 'heading1':   return { ...base, fontSize: 20, letterSpacing: 2, fontWeight: 'bold', textTransform: 'uppercase', lineHeight: 1.4 };
      case 'heading2':   return { ...base, fontSize: 15, letterSpacing: 1, fontWeight: 'bold', lineHeight: 1.5 };
      case 'heading3':   return { ...base, fontSize: 12, letterSpacing: 0.5, color: `${color}cc` };
      case 'code':       return { ...base, fontSize: 11, color: accentColors.green, background: `${accentColors.green}08`, padding: '8px 10px', lineHeight: 1.6 };
      case 'quote':      return { ...base, fontStyle: 'italic', color: `${color}cc`, paddingLeft: 4, borderLeft: `2px solid ${accentColors.amber}50` };
      case 'math':       return { ...base, textAlign: 'center', color: accentColors.purple, letterSpacing: 1 };
      case 'annotation': return { ...base, fontSize: 11, color: `${accentColors.cyan}dd`, background: `${accentColors.cyan}0a`, padding: '6px 10px' };
      default:           return base;
    }
  })();

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && block.type !== 'code') {
      e.preventDefault();
      onNewBelow();
    }
    if (e.key === 'Backspace' && block.content === '') {
      e.preventDefault();
      onDelete();
      onFocusPrev();
    }
    if (e.key === 'Escape') onCloseTypeMenu();
  };

  if (block.type === 'divider') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', position: 'relative' }}
        onClick={onFocus}>
        <button onClick={(e) => { e.stopPropagation(); onToggleTypeMenu(); }}
          style={{ background: 'transparent', border: `1px solid ${color}30`, color: `${color}60`,
            fontFamily: 'Courier New, monospace', fontSize: 8, padding: '2px 5px', cursor: 'pointer', letterSpacing: 1, flexShrink: 0 }}>
          {BLOCK_LABELS[block.type]}
        </button>
        <div style={{ flex: 1, height: 1, background: `${color}30` }} />
        {focused && (
          <button onClick={onDelete}
            style={{ background: 'transparent', border: `1px solid ${accentColors.red}40`, color: accentColors.red,
              fontFamily: 'Courier New, monospace', fontSize: 9, padding: '2px 6px', cursor: 'pointer', flexShrink: 0 }}>
            ×
          </button>
        )}
        {typeMenuOpen && <TypeMenu currentType={block.type} color={color} onChange={onChange} onClose={onCloseTypeMenu} />}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start', padding: '3px 0', position: 'relative' }}>
      <button
        onClick={(e) => { e.stopPropagation(); onToggleTypeMenu(); }}
        title={`Block type: ${BLOCK_TYPE_NAMES[block.type]}`}
        style={{
          background: focused ? `${blockAccent}15` : 'transparent',
          border: `1px solid ${focused ? blockAccent + '50' : color + '20'}`,
          color: focused ? blockAccent : `${color}40`,
          fontFamily: 'Courier New, monospace', fontSize: 8, padding: '2px 5px', cursor: 'pointer',
          letterSpacing: 0.5, flexShrink: 0, marginTop: 4, transition: 'all 0.15s', minWidth: 28, textAlign: 'center',
        }}>
        {BLOCK_LABELS[block.type]}
      </button>

      {typeMenuOpen && <TypeMenu currentType={block.type as BlockType} color={color} onChange={(u) => { onChange(u); onCloseTypeMenu(); }} onClose={onCloseTypeMenu} />}

      <div style={{ flex: 1, minWidth: 0 }}>
        {block.type === 'code' && (
          <div style={{ fontSize: 9, color: `${accentColors.green}60`, fontFamily: 'Courier New, monospace',
            letterSpacing: 1, marginBottom: 2, display: 'flex', gap: 6, alignItems: 'center' }}>
            <span>LANG:</span>
            <input value={block.lang ?? ''} onChange={e => onChange({ lang: e.target.value })}
              placeholder="text" style={{ background: 'transparent', border: 'none', outline: 'none',
                color: accentColors.green, fontFamily: 'Courier New, monospace', fontSize: 9, width: 60 }} />
          </div>
        )}
        <textarea
          ref={setRef}
          value={block.content}
          onChange={e => onChange({ content: e.target.value })}
          onKeyDown={handleKeyDown}
          onFocus={onFocus}
          style={textStyle}
          rows={1}
          placeholder={`${BLOCK_TYPE_NAMES[block.type as BlockType]}…`}
        />
        {block.type === 'annotation' && (
          <input value={block.citation ?? ''} onChange={e => onChange({ citation: e.target.value })}
            placeholder="citation source (optional)"
            style={{ display: 'block', background: 'transparent', border: 'none', outline: 'none',
              color: `${accentColors.cyan}50`, fontFamily: 'Courier New, monospace', fontSize: 9, marginTop: 2, width: '100%' }} />
        )}
      </div>

      {focused && (
        <button onClick={onDelete}
          title="Delete block"
          style={{ background: 'transparent', border: `1px solid ${accentColors.red}30`, color: `${accentColors.red}70`,
            fontFamily: 'Courier New, monospace', fontSize: 9, padding: '2px 6px', cursor: 'pointer',
            flexShrink: 0, marginTop: 4, transition: 'all 0.15s' }}>
          ×
        </button>
      )}
    </div>
  );
}

function TypeMenu({ currentType, color, onChange, onClose }: {
  currentType: BlockType; color: string;
  onChange: (u: Partial<DocBlock>) => void;
  onClose: () => void;
}) {
  return (
    <div style={{
      position: 'absolute', left: 36, top: 0, zIndex: 100,
      background: '#000', border: `1px solid ${color}50`,
      display: 'flex', flexDirection: 'column', minWidth: 140,
    }}>
      {BLOCK_TYPES.map(t => (
        <button key={t}
          onClick={() => onChange({ type: t })}
          style={{
            background: currentType === t ? `${color}15` : 'transparent',
            border: 'none', borderBottom: `1px solid ${color}10`,
            color: currentType === t ? color : `${color}70`,
            fontFamily: 'Courier New, monospace', fontSize: 10, padding: '5px 10px',
            cursor: 'pointer', textAlign: 'left', display: 'flex', gap: 8, alignItems: 'center',
          }}>
          <span style={{ width: 20, color: currentType === t ? color : `${color}50`, flexShrink: 0 }}>
            {BLOCK_LABELS[t]}
          </span>
          {BLOCK_TYPE_NAMES[t]}
        </button>
      ))}
      <button onClick={onClose}
        style={{ background: 'transparent', border: 'none', color: `${color}40`,
          fontFamily: 'Courier New, monospace', fontSize: 9, padding: '4px 10px', cursor: 'pointer', textAlign: 'left' }}>
        CANCEL
      </button>
    </div>
  );
}

// ─── File sidebar ─────────────────────────────────────────────────────────────

function FileSidebar({ color, currentPath, onOpen, onNew }: {
  color: string;
  currentPath: string | null;
  onOpen: (path: string) => void;
  onNew: () => void;
}) {
  const [docs, setDocs] = useState(() => {
    academyDocs.seedDefaults();
    return academyDocs.listAll();
  });
  const [search, setSearch] = useState('');

  const refresh = () => setDocs(academyDocs.listAll());
  useEffect(() => { refresh(); }, [currentPath]);

  const filtered = search.trim()
    ? docs.filter(d => d.name.toLowerCase().includes(search.toLowerCase()) || d.preview.toLowerCase().includes(search.toLowerCase()))
    : docs;

  return (
    <div style={{ width: 168, flexShrink: 0, borderRight: `1px solid ${color}20`,
      display: 'flex', flexDirection: 'column', overflow: 'hidden', background: `${color}03` }}>
      <div style={{ padding: '8px 10px 6px', borderBottom: `1px solid ${color}15` }}>
        <div style={{ fontSize: 9, color: `${color}50`, fontFamily: 'Courier New, monospace', letterSpacing: 1 }}>DOCUMENTS</div>
        <button onClick={onNew} style={{ marginTop: 6, width: '100%', background: `${color}12`,
          border: `1px solid ${color}40`, color, fontFamily: 'Courier New, monospace', fontSize: 10,
          padding: '4px 0', cursor: 'pointer', letterSpacing: 1 }}>
          + NEW DOCUMENT
        </button>
      </div>

      <div style={{ padding: '6px 8px', borderBottom: `1px solid ${color}10` }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="search…"
          style={{ width: '100%', background: 'transparent', border: `1px solid ${color}25`, outline: 'none',
            color, fontFamily: 'Courier New, monospace', fontSize: 10, padding: '3px 7px', boxSizing: 'border-box' }} />
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filtered.length === 0 && (
          <div style={{ padding: 12, fontSize: 10, color: `${color}35`, fontFamily: 'Courier New, monospace', textAlign: 'center' }}>
            {search ? 'No matches.' : 'No documents yet.'}
          </div>
        )}
        {filtered.map(doc => (
          <button key={doc.path}
            onClick={() => onOpen(doc.path)}
            style={{
              width: '100%', textAlign: 'left', background: currentPath === doc.path ? `${color}15` : 'transparent',
              border: 'none', borderBottom: `1px solid ${color}08`, borderLeft: `2px solid ${currentPath === doc.path ? color : 'transparent'}`,
              color: currentPath === doc.path ? color : `${color}70`,
              fontFamily: 'Courier New, monospace', fontSize: 10, padding: '7px 10px', cursor: 'pointer',
            }}>
            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.name}</div>
            {doc.preview && (
              <div style={{ fontSize: 9, color: `${color}35`, marginTop: 2, overflow: 'hidden',
                textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {doc.preview}
              </div>
            )}
          </button>
        ))}
      </div>

      <div style={{ padding: '6px 10px', borderTop: `1px solid ${color}15`, fontSize: 9,
        color: `${color}30`, fontFamily: 'Courier New, monospace' }}>
        {docs.length} doc{docs.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

type SaveStatus = 'saved' | 'unsaved' | 'saving';

export function WordProcessorApp() {
  const { colors, accentColors } = useCrtTheme();
  const c = colors.primary;

  // ── Document state ──
  const [doc, setDoc] = useState<AcademyDoc>(() => { academyDocs.seedDefaults(); return newDoc(); });
  const [currentPath, setCurrentPath] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [typeMenuId, setTypeMenuId] = useState<string | null>(null);

  // ── Undo / redo ──
  const historyRef = useRef<DocBlock[][]>([]);
  const historyIdxRef = useRef(-1);

  const pushHistory = useCallback((blocks: DocBlock[]) => {
    historyRef.current = historyRef.current.slice(0, historyIdxRef.current + 1);
    historyRef.current.push(blocks.map(b => ({ ...b })));
    if (historyRef.current.length > 40) { historyRef.current.shift(); }
    else { historyIdxRef.current++; }
  }, []);

  const undo = useCallback(() => {
    if (historyIdxRef.current > 0) {
      historyIdxRef.current--;
      setDoc(prev => ({ ...prev, blocks: [...historyRef.current[historyIdxRef.current]] }));
      setSaveStatus('unsaved');
    }
  }, []);

  const redo = useCallback(() => {
    if (historyIdxRef.current < historyRef.current.length - 1) {
      historyIdxRef.current++;
      setDoc(prev => ({ ...prev, blocks: [...historyRef.current[historyIdxRef.current]] }));
      setSaveStatus('unsaved');
    }
  }, []);

  // ── Autosave ──
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();
  const doSave = useCallback(() => {
    if (!currentPath) return;
    setSaveStatus('saving');
    setTimeout(() => {
      const result = academyDocs.save(doc, currentPath);
      setSaveStatus(result.success ? 'saved' : 'unsaved');
    }, 80);
  }, [doc, currentPath]);

  const queueSave = useCallback(() => {
    setSaveStatus('unsaved');
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(doSave, 2200);
  }, [doSave]);

  useEffect(() => () => clearTimeout(saveTimer.current), []);

  // ── Block refs (for focus management) ──
  const blockRefs = useRef(new Map<string, HTMLTextAreaElement>());
  const focusBlock = useCallback((id: string) => {
    setFocusedId(id);
    setTimeout(() => {
      const el = blockRefs.current.get(id);
      if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
    }, 20);
  }, []);

  // ── Block operations ──
  const addBlock = useCallback((afterId: string, type: BlockType = 'paragraph') => {
    setDoc(prev => {
      const idx = prev.blocks.findIndex(b => b.id === afterId);
      const nb = newBlock(type);
      const blocks = [...prev.blocks.slice(0, idx + 1), nb, ...prev.blocks.slice(idx + 1)];
      pushHistory(blocks);
      setTimeout(() => focusBlock(nb.id), 30);
      return { ...prev, blocks };
    });
    queueSave();
  }, [focusBlock, pushHistory, queueSave]);

  const updateBlock = useCallback((id: string, updates: Partial<DocBlock>) => {
    setDoc(prev => ({
      ...prev,
      blocks: prev.blocks.map(b => b.id === id ? { ...b, ...updates } : b),
    }));
    queueSave();
  }, [queueSave]);

  const deleteBlock = useCallback((id: string) => {
    setDoc(prev => {
      if (prev.blocks.length <= 1) return prev;
      const blocks = prev.blocks.filter(b => b.id !== id);
      pushHistory(blocks);
      return { ...prev, blocks };
    });
    queueSave();
  }, [pushHistory, queueSave]);

  const focusPrev = useCallback((id: string) => {
    const idx = doc.blocks.findIndex(b => b.id === id);
    if (idx > 0) focusBlock(doc.blocks[idx - 1].id);
  }, [doc.blocks, focusBlock]);

  const addBlockAtEnd = useCallback((type: BlockType = 'paragraph') => {
    const nb = newBlock(type);
    setDoc(prev => {
      const blocks = [...prev.blocks, nb];
      pushHistory(blocks);
      return { ...prev, blocks };
    });
    setTimeout(() => focusBlock(nb.id), 30);
    queueSave();
  }, [focusBlock, pushHistory, queueSave]);

  // ── File operations ──
  const openDoc = useCallback((path: string) => {
    clearTimeout(saveTimer.current);
    const loaded = academyDocs.load(path);
    if (loaded) {
      setDoc(loaded);
      setCurrentPath(path);
      setSaveStatus('saved');
      historyRef.current = [loaded.blocks.map(b => ({ ...b }))];
      historyIdxRef.current = 0;
    }
  }, []);

  const createNew = useCallback(() => {
    clearTimeout(saveTimer.current);
    const d = newDoc();
    setDoc(d);
    setCurrentPath(null);
    setSaveStatus('unsaved');
    historyRef.current = [];
    historyIdxRef.current = -1;
  }, []);

  const saveAs = useCallback(() => {
    setSaveStatus('saving');
    const result = academyDocs.save(doc, currentPath ?? undefined);
    if (result.success) {
      setCurrentPath(result.path);
      setSaveStatus('saved');
    } else {
      setSaveStatus('unsaved');
    }
  }, [doc, currentPath]);

  const exportText = useCallback(() => {
    const text = docToPlainText(doc);
    navigator.clipboard.writeText(text).catch(() => {});
  }, [doc]);

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 's') { e.preventDefault(); saveAs(); }
        if (e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
        if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) { e.preventDefault(); redo(); }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [saveAs, undo, redo]);

  // ── Render ──
  const wordCount = docWordCount(doc);
  const statusColor = saveStatus === 'saved' ? accentColors.green : saveStatus === 'saving' ? accentColors.amber : `${c}60`;
  const statusText  = saveStatus === 'saved' ? 'SAVED' : saveStatus === 'saving' ? 'SAVING…' : 'UNSAVED';

  const toolBtnStyle: React.CSSProperties = {
    background: 'transparent', border: `1px solid ${c}35`, color: `${c}80`,
    fontFamily: 'Courier New, monospace', fontSize: 9, padding: '3px 9px', cursor: 'pointer', letterSpacing: 1,
  };

  return (
    <div
      style={{ display: 'flex', height: '100%', background: '#000', color: c, fontFamily: 'Courier New, monospace', overflow: 'hidden' }}
      onClick={() => setTypeMenuId(null)}>

      {/* ── Sidebar ── */}
      <FileSidebar
        color={c}
        currentPath={currentPath}
        onOpen={openDoc}
        onNew={createNew}
      />

      {/* ── Editor ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
          borderBottom: `1px solid ${c}20`, background: `${c}04`, flexShrink: 0, flexWrap: 'wrap' }}>
          <button onClick={saveAs} style={{ ...toolBtnStyle, color: accentColors.green, borderColor: `${accentColors.green}50` }}>
            SAVE
          </button>
          <button onClick={createNew} style={toolBtnStyle}>NEW</button>
          <div style={{ width: 1, height: 14, background: `${c}20`, margin: '0 4px' }} />
          <button onClick={undo} title="Ctrl+Z" style={toolBtnStyle}>UNDO</button>
          <button onClick={redo} title="Ctrl+Y" style={toolBtnStyle}>REDO</button>
          <div style={{ width: 1, height: 14, background: `${c}20`, margin: '0 4px' }} />
          {(['heading1', 'heading2', 'code', 'quote', 'annotation'] as BlockType[]).map(type => (
            <button key={type}
              onClick={() => { if (focusedId) addBlock(focusedId, type); else addBlockAtEnd(type); }}
              title={`Insert ${BLOCK_TYPE_NAMES[type]}`}
              style={{ ...toolBtnStyle, fontSize: 8 }}>
              {BLOCK_LABELS[type]}
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <button onClick={exportText} title="Copy as plain text" style={{ ...toolBtnStyle, fontSize: 8 }}>
            COPY TEXT
          </button>
          {currentPath && (
            <span style={{ fontSize: 8, color: `${c}35`, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentPath.replace('/home/student', '~')}
            </span>
          )}
        </div>

        {/* Document area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px' }}>
          <div style={{ maxWidth: 680 }}>

            {/* Title */}
            <input
              value={doc.title}
              onChange={e => { setDoc(prev => ({ ...prev, title: e.target.value })); queueSave(); }}
              placeholder="Document Title"
              style={{
                display: 'block', width: '100%', background: 'transparent', border: 'none',
                borderBottom: `1px solid ${c}20`, outline: 'none', color: c,
                fontFamily: 'Courier New, monospace', fontSize: 18, fontWeight: 'bold',
                letterSpacing: 2, padding: '4px 0 8px', marginBottom: 16, textTransform: 'uppercase',
              }}
            />

            {/* Subject + Tags row */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: `${c}50` }}>
                <span>SUBJECT:</span>
                <input value={doc.subject} onChange={e => { setDoc(prev => ({ ...prev, subject: e.target.value })); queueSave(); }}
                  placeholder="—"
                  style={{ background: 'transparent', border: 'none', outline: 'none', color: `${c}80`, fontFamily: 'Courier New, monospace', fontSize: 10, width: 100 }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: `${c}50` }}>
                <span>TAGS:</span>
                <input
                  value={doc.tags.join(', ')}
                  onChange={e => {
                    const tags = e.target.value.split(',').map(t => t.trim()).filter(Boolean);
                    setDoc(prev => ({ ...prev, tags })); queueSave();
                  }}
                  placeholder="tag1, tag2"
                  style={{ background: 'transparent', border: 'none', outline: 'none', color: `${c}80`, fontFamily: 'Courier New, monospace', fontSize: 10, width: 160 }}
                />
              </div>
            </div>

            {/* Blocks */}
            <div>
              {doc.blocks.map(block => (
                <BlockRow
                  key={block.id}
                  block={block}
                  color={c}
                  accentColors={accentColors}
                  focused={focusedId === block.id}
                  onFocus={() => setFocusedId(block.id)}
                  onChange={updates => updateBlock(block.id, updates)}
                  onDelete={() => deleteBlock(block.id)}
                  onNewBelow={() => addBlock(block.id)}
                  onFocusPrev={() => focusPrev(block.id)}
                  blockRef={el => {
                    if (el) blockRefs.current.set(block.id, el);
                    else blockRefs.current.delete(block.id);
                  }}
                  typeMenuOpen={typeMenuId === block.id}
                  onToggleTypeMenu={() => setTypeMenuId(id => id === block.id ? null : block.id)}
                  onCloseTypeMenu={() => setTypeMenuId(null)}
                />
              ))}
            </div>

            {/* Add block buttons */}
            <div style={{ marginTop: 16, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {(['paragraph', 'heading1', 'heading2', 'code', 'quote', 'math', 'annotation', 'divider'] as BlockType[]).map(type => (
                <button key={type}
                  onClick={() => {
                    if (focusedId) addBlock(focusedId, type);
                    else addBlockAtEnd(type);
                  }}
                  style={{
                    background: 'transparent', border: `1px solid ${c}25`, color: `${c}45`,
                    fontFamily: 'Courier New, monospace', fontSize: 9, padding: '3px 8px', cursor: 'pointer',
                    letterSpacing: 0.5, transition: 'all 0.15s',
                  }}>
                  + {BLOCK_LABELS[type]}
                </button>
              ))}
            </div>

          </div>
        </div>

        {/* Status bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '4px 12px', borderTop: `1px solid ${c}15`, background: `${c}04`,
          fontSize: 9, fontFamily: 'Courier New, monospace', flexShrink: 0, gap: 12, flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', gap: 12, color: `${c}50` }}>
            <span>BLOCKS: <span style={{ color: `${c}80` }}>{doc.blocks.length}</span></span>
            <span>WORDS: <span style={{ color: `${c}80` }}>{wordCount}</span></span>
            <span>VER: <span style={{ color: `${c}80` }}>{doc.version}</span></span>
          </div>
          <span style={{ color: statusColor, letterSpacing: 1 }}>{statusText}</span>
        </div>
      </div>
    </div>
  );
}
