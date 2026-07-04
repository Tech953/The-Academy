import { useState, useCallback, useRef, useEffect, KeyboardEvent } from 'react';
import {
  academyDocs, newDoc, newBlock, docWordCount, docToPlainText,
  AcademyDoc, DocBlock, BlockType, DOCS_ROOT, DOC_EXT,
} from '@/lib/academyDocuments';
import { virtualFS } from '@/lib/virtualFilesystem';

// ─── Block types ───────────────────────────────────────────────────────────────

const BLOCK_TYPES: BlockType[] = [
  'paragraph', 'heading1', 'heading2', 'heading3', 'code', 'quote', 'math', 'annotation', 'divider',
];
const BLOCK_TYPE_NAMES: Record<BlockType, string> = {
  paragraph: 'Paragraph', heading1: 'Heading 1', heading2: 'Heading 2', heading3: 'Heading 3',
  code: 'Code Block', quote: 'Block Quote', math: 'Math / Formula', annotation: 'Annotation', divider: 'Divider',
};
const BLOCK_SHORT: Record<BlockType, string> = {
  paragraph: 'P', heading1: 'H1', heading2: 'H2', heading3: 'H3',
  code: '<>', quote: '"', math: 'Σ', annotation: '†', divider: '—',
};
const RICH_TYPES: BlockType[] = ['paragraph', 'heading1', 'heading2', 'heading3', 'quote'];
function isRich(t: BlockType) { return RICH_TYPES.includes(t); }

// ─── Templates ─────────────────────────────────────────────────────────────────

interface DocTemplate { name: string; subject: string; tags: string[]; blocks: Omit<DocBlock, 'id'>[] }
const TEMPLATES: DocTemplate[] = [
  {
    name: 'Five-Paragraph Essay', subject: 'Writing', tags: ['essay', 'rla'],
    blocks: [
      { type: 'heading1', content: 'Essay Title' },
      { type: 'heading3', content: 'Introduction' },
      { type: 'paragraph', content: 'Hook sentence. Background information. Thesis statement.' },
      { type: 'heading3', content: 'Body Paragraph 1' },
      { type: 'paragraph', content: 'Topic sentence. Evidence. Analysis. Transition.' },
      { type: 'heading3', content: 'Body Paragraph 2' },
      { type: 'paragraph', content: 'Topic sentence. Evidence. Analysis. Transition.' },
      { type: 'heading3', content: 'Body Paragraph 3' },
      { type: 'paragraph', content: 'Topic sentence. Evidence. Analysis. Transition.' },
      { type: 'heading3', content: 'Conclusion' },
      { type: 'paragraph', content: 'Restate thesis. Summary of main points. Closing thought.' },
    ],
  },
  {
    name: 'Lab Report', subject: 'Science', tags: ['science', 'lab'],
    blocks: [
      { type: 'heading1', content: 'Lab Report Title' },
      { type: 'heading2', content: 'Hypothesis' },
      { type: 'paragraph', content: 'If [condition], then [result] because [reasoning].' },
      { type: 'heading2', content: 'Materials' },
      { type: 'paragraph', content: 'List all materials used in this experiment.' },
      { type: 'heading2', content: 'Procedure' },
      { type: 'paragraph', content: 'Step-by-step procedure numbered list.' },
      { type: 'heading2', content: 'Data & Observations' },
      { type: 'paragraph', content: 'Record measurements and observations here.' },
      { type: 'heading2', content: 'Analysis' },
      { type: 'math', content: 'y = mx + b' },
      { type: 'paragraph', content: 'Explain what the data shows.' },
      { type: 'heading2', content: 'Conclusion' },
      { type: 'paragraph', content: 'Did results support the hypothesis? What were sources of error?' },
    ],
  },
  {
    name: 'Math Worksheet', subject: 'Math', tags: ['math', 'worksheet'],
    blocks: [
      { type: 'heading1', content: 'Math Practice' },
      { type: 'heading3', content: 'Concept Review' },
      { type: 'paragraph', content: 'Key formulas and definitions for this topic.' },
      { type: 'math', content: 'ax² + bx + c = 0' },
      { type: 'heading3', content: 'Practice Problems' },
      { type: 'paragraph', content: '1. ' },
      { type: 'paragraph', content: '2. ' },
      { type: 'paragraph', content: '3. ' },
      { type: 'heading3', content: 'Show Your Work' },
      { type: 'math', content: '' },
      { type: 'heading3', content: 'Reflection' },
      { type: 'annotation', content: 'What was most challenging? What strategy helped?', citation: 'self-reflection' },
    ],
  },
  {
    name: 'Study Notes', subject: 'General', tags: ['notes', 'study'],
    blocks: [
      { type: 'heading1', content: 'Study Notes — [Topic]' },
      { type: 'heading2', content: 'Key Concepts' },
      { type: 'paragraph', content: 'Main ideas from this study session.' },
      { type: 'heading2', content: 'Vocabulary' },
      { type: 'paragraph', content: 'Term 1: definition.' },
      { type: 'paragraph', content: 'Term 2: definition.' },
      { type: 'heading2', content: 'Important Details' },
      { type: 'paragraph', content: 'Dates, names, formulas, or other specifics.' },
      { type: 'heading2', content: 'Questions to Review' },
      { type: 'paragraph', content: 'What do I still not understand?' },
    ],
  },
  {
    name: 'Research Paper', subject: 'Research', tags: ['research', 'academic'],
    blocks: [
      { type: 'heading1', content: 'Research Paper Title' },
      { type: 'paragraph', content: 'Author Name · Date · Course' },
      { type: 'divider', content: '' },
      { type: 'heading2', content: 'Abstract' },
      { type: 'paragraph', content: 'Brief summary of the research purpose, methods, results, and conclusion.' },
      { type: 'heading2', content: 'Introduction' },
      { type: 'paragraph', content: 'Background, research question, and significance of the study.' },
      { type: 'heading2', content: 'Methods' },
      { type: 'paragraph', content: 'Describe the approach, data sources, or experimental design.' },
      { type: 'heading2', content: 'Results' },
      { type: 'paragraph', content: 'Present findings objectively.' },
      { type: 'heading2', content: 'Discussion' },
      { type: 'paragraph', content: 'Interpret results, address limitations, compare to existing research.' },
      { type: 'heading2', content: 'Conclusion' },
      { type: 'paragraph', content: 'Summary and implications of findings.' },
      { type: 'heading2', content: 'References' },
      { type: 'annotation', content: 'Author, A. (Year). Title. Journal, Volume(Issue), pages.', citation: 'APA format' },
    ],
  },
];

// ─── Design tokens ─────────────────────────────────────────────────────────────

const D = {
  chrome:   '#1f1f1f',
  toolbar:  '#2b2b2b',
  sidebar:  '#242424',
  border:   '#3a3a3a',
  text:     '#c8c8c8',
  textDim:  '#707070',
  textHi:   '#f0f0f0',
  accent:   '#4a9eff',
  paper:    '#ffffff',
  paperBg:  '#3c3c3c',
  paperText:'#1a1a1a',
  paperDim: '#555555',
  codeBg:   '#f3f4f6',
  codeText: '#1a1a1a',
  quoteBdr: '#c8c8c8',
  annotBg:  '#fef9e7',
  annotBdr: '#f0c040',
  mathBg:   '#f0f4ff',
};

// ─── Utilities ─────────────────────────────────────────────────────────────────

function autoResize(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = `${el.scrollHeight}px`;
}

function estimateReadingTime(words: number): string {
  const mins = Math.ceil(words / 200);
  return mins < 1 ? '< 1 min' : `~${mins} min read`;
}

// ─── Rich block (contentEditable) ─────────────────────────────────────────────

interface RichBlockProps {
  block: DocBlock;
  focused: boolean;
  onFocus: () => void;
  onChange: (html: string) => void;
  onDelete: () => void;
  onNewBelow: () => void;
  onFocusPrev: () => void;
  typeMenuOpen: boolean;
  onToggleTypeMenu: () => void;
  onCloseTypeMenu: () => void;
}

function RichBlock({ block, focused, onFocus, onChange, onDelete, onNewBelow, onFocusPrev, typeMenuOpen, onToggleTypeMenu, onCloseTypeMenu }: RichBlockProps) {
  const divRef = useRef<HTMLDivElement | null>(null);
  const lastContent = useRef(block.content);

  useEffect(() => {
    const el = divRef.current;
    if (!el || el.innerHTML === block.content || block.content === lastContent.current) return;
    el.innerHTML = block.content;
    lastContent.current = block.content;
  }, [block.content]);

  const textStyle: React.CSSProperties = (() => {
    const base: React.CSSProperties = {
      flex: 1, outline: 'none', minHeight: 26,
      wordBreak: 'break-word', color: D.paperText, padding: '2px 0',
    };
    switch (block.type) {
      case 'heading1': return { ...base, fontSize: 26, fontWeight: '700', fontFamily: "Georgia, 'Times New Roman', serif", lineHeight: 1.25, marginBottom: 2, color: '#0a0a0a', borderBottom: '1px solid #e0e0e0', paddingBottom: 6 };
      case 'heading2': return { ...base, fontSize: 18, fontWeight: '600', fontFamily: "Georgia, 'Times New Roman', serif", lineHeight: 1.3, color: '#1a1a1a' };
      case 'heading3': return { ...base, fontSize: 13, fontWeight: '600', fontFamily: "system-ui, sans-serif", letterSpacing: 0.6, color: '#444', textTransform: 'uppercase' };
      case 'quote':    return { ...base, fontStyle: 'italic', color: '#555', fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 14, lineHeight: 1.75, paddingLeft: 14, borderLeft: `3px solid ${D.quoteBdr}`, background: '#fafafa' };
      default:         return { ...base, fontFamily: 'inherit', fontSize: 'inherit', lineHeight: 'inherit' };
    }
  })();

  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start', padding: '2px 0', position: 'relative' }}>
      <button onMouseDown={e => { e.preventDefault(); onToggleTypeMenu(); }}
        title={`Block type: ${BLOCK_TYPE_NAMES[block.type]}`}
        style={{
          background: 'transparent', border: `1px solid ${focused ? '#ccc' : 'transparent'}`,
          color: focused ? '#aaa' : 'transparent',
          fontFamily: '"Courier New", monospace', fontSize: 8, padding: '2px 4px',
          cursor: 'pointer', flexShrink: 0, marginTop: 6, minWidth: 22, textAlign: 'center',
          borderRadius: 2, transition: 'all 0.1s',
        }}>
        {BLOCK_SHORT[block.type]}
      </button>
      {typeMenuOpen && (
        <BlockTypeMenu currentType={block.type}
          onSelect={t => { if (!isRich(t)) onChange(divRef.current?.textContent ?? ''); onCloseTypeMenu(); }}
          onClose={onCloseTypeMenu}
          onChange={() => {}}
        />
      )}
      <div ref={divRef} contentEditable suppressContentEditableWarning style={textStyle}
        onFocus={onFocus}
        onInput={e => { const html = (e.currentTarget as HTMLDivElement).innerHTML; lastContent.current = html; onChange(html); }}
        onKeyDown={e => {
          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onNewBelow(); }
          if (e.key === 'Backspace' && (divRef.current?.textContent ?? '') === '') { e.preventDefault(); onDelete(); onFocusPrev(); }
          if (e.key === 'Escape') onCloseTypeMenu();
        }}
        data-placeholder={`${BLOCK_TYPE_NAMES[block.type]}…`}
      />
      {focused && (
        <button onClick={onDelete} title="Delete block"
          style={{ background: 'transparent', border: '1px solid #ddd', color: '#bbb',
            fontFamily: 'system-ui', fontSize: 11, padding: '1px 6px', cursor: 'pointer',
            flexShrink: 0, marginTop: 5, borderRadius: 2 }}>
          ×
        </button>
      )}
    </div>
  );
}

// ─── Block type menu ───────────────────────────────────────────────────────────

function BlockTypeMenu({ currentType, onSelect, onClose, onChange }: {
  currentType: BlockType;
  onSelect: (t: BlockType) => void;
  onClose: () => void;
  onChange: (u: Partial<DocBlock>) => void;
}) {
  const sections = [
    { label: 'TEXT', types: ['paragraph', 'heading1', 'heading2', 'heading3'] as BlockType[] },
    { label: 'SPECIAL', types: ['quote', 'code', 'math', 'annotation', 'divider'] as BlockType[] },
  ];
  return (
    <div style={{ position: 'absolute', left: 32, top: 0, zIndex: 400, background: '#fff',
      border: '1px solid #ddd', minWidth: 190, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', borderRadius: 4 }}
      onMouseDown={e => e.stopPropagation()}>
      {sections.map(sec => (
        <div key={sec.label}>
          <div style={{ padding: '5px 12px 2px', fontSize: 9, color: '#999', letterSpacing: 1, fontFamily: 'system-ui' }}>
            {sec.label}
          </div>
          {sec.types.map(t => (
            <button key={t}
              onMouseDown={e => { e.preventDefault(); onChange({ type: t }); onSelect(t); }}
              style={{
                background: currentType === t ? '#f0f7ff' : 'transparent',
                border: 'none', borderBottom: '1px solid #f0f0f0',
                color: currentType === t ? '#1a6fd4' : '#333',
                fontFamily: 'system-ui, sans-serif', fontSize: 12,
                padding: '7px 14px', cursor: 'pointer', textAlign: 'left',
                display: 'flex', gap: 10, alignItems: 'center', width: '100%',
              }}>
              <span style={{ width: 20, fontSize: 9, color: currentType === t ? '#1a6fd4' : '#999', flexShrink: 0, textAlign: 'center', fontFamily: '"Courier New", monospace' }}>
                {BLOCK_SHORT[t]}
              </span>
              {BLOCK_TYPE_NAMES[t]}
            </button>
          ))}
        </div>
      ))}
      <button onMouseDown={e => { e.preventDefault(); onClose(); }}
        style={{ background: 'transparent', border: 'none', borderTop: '1px solid #eee',
          color: '#999', fontFamily: 'system-ui', fontSize: 11,
          padding: '6px 14px', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
        Cancel
      </button>
    </div>
  );
}

// ─── Block row ─────────────────────────────────────────────────────────────────

interface BlockRowProps {
  block: DocBlock;
  focused: boolean;
  onFocus: () => void;
  onChange: (u: Partial<DocBlock>) => void;
  onDelete: () => void;
  onNewBelow: () => void;
  onFocusPrev: () => void;
  blockRef: (el: HTMLTextAreaElement | null) => void;
  typeMenuOpen: boolean;
  onToggleTypeMenu: () => void;
  onCloseTypeMenu: () => void;
}

function BlockRow({ block, focused, onFocus, onChange, onDelete, onNewBelow, onFocusPrev, blockRef, typeMenuOpen, onToggleTypeMenu, onCloseTypeMenu }: BlockRowProps) {
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  const setRef = (el: HTMLTextAreaElement | null) => {
    taRef.current = el;
    blockRef(el);
    if (el) autoResize(el);
  };
  useEffect(() => { autoResize(taRef.current); }, [block.content]);

  if (isRich(block.type)) {
    return (
      <RichBlock block={block} focused={focused}
        onFocus={onFocus}
        onChange={html => onChange({ content: html })}
        onDelete={onDelete} onNewBelow={onNewBelow} onFocusPrev={onFocusPrev}
        typeMenuOpen={typeMenuOpen} onToggleTypeMenu={onToggleTypeMenu} onCloseTypeMenu={onCloseTypeMenu}
      />
    );
  }

  if (block.type === 'divider') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 0', position: 'relative', cursor: 'pointer' }}
        onClick={onFocus}>
        <button onMouseDown={e => { e.preventDefault(); onToggleTypeMenu(); }}
          style={{ background: 'transparent', border: focused ? '1px solid #ccc' : '1px solid transparent', color: '#aaa',
            fontFamily: '"Courier New", monospace', fontSize: 8, padding: '2px 4px', cursor: 'pointer', borderRadius: 2 }}>
          {BLOCK_SHORT[block.type]}
        </button>
        <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #d0d0d0', margin: 0 }} />
        {focused && (
          <button onClick={onDelete}
            style={{ background: 'transparent', border: '1px solid #ddd', color: '#bbb',
              fontSize: 11, padding: '1px 6px', cursor: 'pointer', borderRadius: 2 }}>
            ×
          </button>
        )}
        {typeMenuOpen && <BlockTypeMenu currentType={block.type} onSelect={() => {}} onClose={onCloseTypeMenu} onChange={u => onChange(u)} />}
      </div>
    );
  }

  const taStyle: React.CSSProperties = (() => {
    const base: React.CSSProperties = {
      flex: 1, background: 'transparent', border: 'none', outline: 'none',
      resize: 'none', overflow: 'hidden', padding: '2px 0', width: '100%', minHeight: 26,
      color: D.paperText,
    };
    if (block.type === 'code') return {
      ...base, fontFamily: '"Fira Code", "Cascadia Code", "Courier New", monospace',
      fontSize: 12, lineHeight: 1.65, background: D.codeBg, color: D.codeText,
      padding: '12px 16px', borderRadius: 4, border: '1px solid #e0e0e0',
    };
    if (block.type === 'math') return {
      ...base, textAlign: 'center', fontFamily: '"Courier New", monospace',
      fontSize: 15, letterSpacing: 1.2, background: D.mathBg, padding: '10px 16px',
      borderRadius: 4, border: '1px solid #cce0ff', color: '#1a3a6a',
    };
    if (block.type === 'annotation') return {
      ...base, fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: 'italic',
      fontSize: 12.5, color: '#7a6020', lineHeight: 1.7, background: D.annotBg,
      padding: '8px 14px', borderLeft: `3px solid ${D.annotBdr}`, borderRadius: '0 4px 4px 0',
    };
    return base;
  })();

  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start', padding: '2px 0', position: 'relative' }}>
      <button onMouseDown={e => { e.preventDefault(); onToggleTypeMenu(); }}
        title={`Block type: ${BLOCK_TYPE_NAMES[block.type]}`}
        style={{
          background: 'transparent', border: `1px solid ${focused ? '#ccc' : 'transparent'}`,
          color: focused ? '#aaa' : 'transparent',
          fontFamily: '"Courier New", monospace', fontSize: 8, padding: '2px 4px',
          cursor: 'pointer', flexShrink: 0, marginTop: 5, minWidth: 22, textAlign: 'center', borderRadius: 2,
        }}>
        {BLOCK_SHORT[block.type]}
      </button>
      {typeMenuOpen && <BlockTypeMenu currentType={block.type} onSelect={() => onCloseTypeMenu()} onClose={onCloseTypeMenu} onChange={u => { onChange(u); onCloseTypeMenu(); }} />}

      <div style={{ flex: 1, minWidth: 0 }}>
        {block.type === 'code' && (
          <div style={{ fontSize: 9, color: '#888', fontFamily: '"Courier New", monospace',
            letterSpacing: 1, marginBottom: 4, display: 'flex', gap: 6, alignItems: 'center' }}>
            <span>LANG</span>
            <input value={block.lang ?? ''} onChange={e => onChange({ lang: e.target.value })}
              placeholder="text" style={{ background: 'transparent', border: 'none', outline: 'none',
                color: '#777', fontFamily: '"Courier New", monospace', fontSize: 9, width: 60 }} />
          </div>
        )}
        <textarea ref={setRef} value={block.content}
          onChange={e => onChange({ content: e.target.value })}
          onKeyDown={(e: KeyboardEvent<HTMLTextAreaElement>) => {
            if (e.key === 'Enter' && !e.shiftKey && block.type !== 'code') { e.preventDefault(); onNewBelow(); }
            if (e.key === 'Backspace' && block.content === '') { e.preventDefault(); onDelete(); onFocusPrev(); }
            if (e.key === 'Escape') onCloseTypeMenu();
          }}
          onFocus={onFocus} style={taStyle} rows={1}
          placeholder={`${BLOCK_TYPE_NAMES[block.type]}…`}
        />
        {block.type === 'annotation' && (
          <input value={block.citation ?? ''} onChange={e => onChange({ citation: e.target.value })}
            placeholder="Source / citation (optional)"
            style={{ display: 'block', background: 'transparent', border: 'none', outline: 'none',
              color: '#b08030', fontFamily: '"Courier New", monospace', fontSize: 9, marginTop: 3, width: '100%' }} />
        )}
      </div>
      {focused && (
        <button onClick={onDelete} title="Delete block"
          style={{ background: 'transparent', border: '1px solid #ddd', color: '#bbb',
            fontSize: 11, padding: '1px 6px', cursor: 'pointer', flexShrink: 0, marginTop: 5, borderRadius: 2 }}>
          ×
        </button>
      )}
    </div>
  );
}

// ─── Find & Replace panel ──────────────────────────────────────────────────────

function FindReplacePanel({ doc, onUpdateBlocks, onClose }: {
  doc: AcademyDoc;
  onUpdateBlocks: (blocks: DocBlock[]) => void;
  onClose: () => void;
}) {
  const [find, setFind] = useState('');
  const [replace, setReplace] = useState('');
  const [matchCount, setMatchCount] = useState(0);
  const [caseSensitive, setCaseSensitive] = useState(false);

  useEffect(() => {
    if (!find.trim()) { setMatchCount(0); return; }
    const text = doc.blocks.map(b => b.content).join('\n');
    const flags = caseSensitive ? 'g' : 'gi';
    try {
      const matches = text.match(new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags));
      setMatchCount(matches?.length ?? 0);
    } catch { setMatchCount(0); }
  }, [find, doc.blocks, caseSensitive]);

  const doReplace = () => {
    if (!find.trim()) return;
    const flags = caseSensitive ? 'g' : 'gi';
    const pattern = new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
    const updated = doc.blocks.map(b => ({ ...b, content: b.content.replace(pattern, replace) }));
    onUpdateBlocks(updated);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 14px',
      borderBottom: `1px solid ${D.border}`, background: '#333', flexShrink: 0, flexWrap: 'wrap' }}>
      <span style={{ fontSize: 10, color: D.textDim, fontFamily: 'system-ui' }}>Find</span>
      <input value={find} onChange={e => setFind(e.target.value)} placeholder="Search…" autoFocus
        style={{ background: '#fff', border: '1px solid #aaa', outline: 'none', color: '#111',
          fontFamily: 'system-ui', fontSize: 12, padding: '3px 8px', borderRadius: 3, width: 160 }} />
      <span style={{ fontSize: 10, color: D.textDim, fontFamily: 'system-ui' }}>Replace</span>
      <input value={replace} onChange={e => setReplace(e.target.value)} placeholder="Replace with…"
        style={{ background: '#fff', border: '1px solid #aaa', outline: 'none', color: '#111',
          fontFamily: 'system-ui', fontSize: 12, padding: '3px 8px', borderRadius: 3, width: 160 }}
        onKeyDown={e => { if (e.key === 'Enter') doReplace(); }} />
      <button onClick={doReplace}
        style={{ background: '#4a9eff', border: 'none', color: '#fff', fontFamily: 'system-ui', fontSize: 11, padding: '4px 12px', cursor: 'pointer', borderRadius: 3 }}>
        Replace All
      </button>
      <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: D.textDim, cursor: 'pointer', fontFamily: 'system-ui' }}>
        <input type="checkbox" checked={caseSensitive} onChange={e => setCaseSensitive(e.target.checked)} style={{ cursor: 'pointer' }} />
        Case sensitive
      </label>
      {find.trim() && (
        <span style={{ fontSize: 10, color: matchCount > 0 ? '#a0c878' : D.textDim, fontFamily: 'system-ui' }}>
          {matchCount} match{matchCount !== 1 ? 'es' : ''}
        </span>
      )}
      <div style={{ flex: 1 }} />
      <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: D.textDim, fontSize: 16, cursor: 'pointer', padding: '0 4px', lineHeight: 1 }}>×</button>
    </div>
  );
}

// ─── Toolbar button helpers ────────────────────────────────────────────────────

const TB: React.CSSProperties = {
  background: 'transparent',
  border: `1px solid ${D.border}`,
  color: D.text,
  fontFamily: 'system-ui, sans-serif',
  fontSize: 11,
  padding: '2px 8px',
  cursor: 'pointer',
  lineHeight: '16px',
  borderRadius: 2,
  whiteSpace: 'nowrap',
};

const TBActive: React.CSSProperties = {
  ...TB,
  background: '#3a3a3a',
  borderColor: '#5a5a5a',
  color: D.textHi,
};

const TBAccent: React.CSSProperties = {
  ...TB,
  background: '#1a4a88',
  borderColor: '#2a6aaa',
  color: '#c8deff',
};

function Sep() {
  return <div style={{ width: 1, height: 14, background: D.border, margin: '0 2px', flexShrink: 0 }} />;
}

// ─── Document format ───────────────────────────────────────────────────────────

const FONT_FAMILIES = [
  { label: 'Aptos (Body)',     value: "system-ui, 'Segoe UI', sans-serif" },
  { label: 'Calibri',         value: "'Calibri', 'Gill Sans', sans-serif" },
  { label: 'Arial',           value: "Arial, sans-serif" },
  { label: 'Verdana',         value: "Verdana, Geneva, sans-serif" },
  { label: 'Georgia (Serif)', value: "Georgia, 'Times New Roman', serif" },
  { label: 'Times New Roman', value: "'Times New Roman', serif" },
  { label: 'Garamond',        value: "Garamond, 'EB Garamond', serif" },
  { label: 'Courier New',     value: "'Courier New', monospace" },
];

const MARGIN_PRESETS: Record<string, { label: string; h: number; v: number }> = {
  normal:   { label: 'Normal (1")',     h: 72,  v: 64 },
  narrow:   { label: 'Narrow (0.5")',   h: 36,  v: 36 },
  wide:     { label: 'Wide (2")',       h: 144, v: 72 },
  moderate: { label: 'Moderate (0.75")',h: 54,  v: 54 },
};

type PageNumberPos = 'none' | 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';

interface DocFormat {
  fontFamily: string;
  fontSize: number;
  lineSpacing: number;
  marginPreset: string;
  spellCheck: boolean;
  orientation: 'portrait' | 'landscape';
  headerEnabled: boolean;
  footerEnabled: boolean;
  headerText: string;
  footerText: string;
  pageNumberPos: PageNumberPos;
  pageNumberStart: number;
  differentFirstPage: boolean;
}
const DEFAULT_FMT: DocFormat = {
  fontFamily: "Georgia, 'Times New Roman', serif",
  fontSize: 13,
  lineSpacing: 1.85,
  marginPreset: 'normal',
  spellCheck: true,
  orientation: 'portrait',
  headerEnabled: false,
  footerEnabled: false,
  headerText: '',
  footerText: '',
  pageNumberPos: 'none',
  pageNumberStart: 1,
  differentFirstPage: false,
};

// ─── Ribbon sub-components ──────────────────────────────────────────────────────

const PAGE_NUM_OPTIONS: { label: string; val: PageNumberPos }[] = [
  { label: '— None',          val: 'none' },
  { label: '↖ Top Left',      val: 'top-left' },
  { label: '↑ Top Center',    val: 'top-center' },
  { label: '↗ Top Right',     val: 'top-right' },
  { label: '↙ Bottom Left',   val: 'bottom-left' },
  { label: '↓ Bottom Center', val: 'bottom-center' },
  { label: '↘ Bottom Right',  val: 'bottom-right' },
];

function HeaderFooterGroup({ fmt, onFmt }: { fmt: DocFormat; onFmt: (u: Partial<DocFormat>) => void }) {
  const [showPnMenu, setShowPnMenu] = useState(false);

  const toggleHeader = () => {
    const next = !fmt.headerEnabled;
    onFmt({ headerEnabled: next });
  };
  const toggleFooter = () => {
    const next = !fmt.footerEnabled;
    onFmt({ footerEnabled: next });
  };
  const setPnPos = (val: PageNumberPos) => {
    setShowPnMenu(false);
    if (val.startsWith('top'))         onFmt({ pageNumberPos: val, headerEnabled: true });
    else if (val.startsWith('bottom')) onFmt({ pageNumberPos: val, footerEnabled: true });
    else                               onFmt({ pageNumberPos: val });
  };

  return (
    <RibbonGroup label="Header & Footer">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Header + Footer toggle row */}
        <div style={{ display: 'flex', gap: 3 }}>
          <button onMouseDown={e => { e.preventDefault(); toggleHeader(); }}
            title={fmt.headerEnabled ? 'Close Header' : 'Edit Header'}
            style={{ ...(fmt.headerEnabled ? TBActive : TB), fontSize: 10, padding: '2px 9px', whiteSpace: 'nowrap' }}>
            Header {fmt.headerEnabled ? '▲' : '▾'}
          </button>
          <button onMouseDown={e => { e.preventDefault(); toggleFooter(); }}
            title={fmt.footerEnabled ? 'Close Footer' : 'Edit Footer'}
            style={{ ...(fmt.footerEnabled ? TBActive : TB), fontSize: 10, padding: '2px 9px', whiteSpace: 'nowrap' }}>
            Footer {fmt.footerEnabled ? '▲' : '▾'}
          </button>
        </div>
        {/* Page Number dropdown */}
        <div style={{ position: 'relative' }}>
          <button onMouseDown={e => { e.preventDefault(); setShowPnMenu(v => !v); }}
            title="Insert page number"
            style={{ ...(fmt.pageNumberPos !== 'none' ? TBActive : TB), fontSize: 10, padding: '2px 9px', whiteSpace: 'nowrap', width: '100%' }}>
            Page # {fmt.pageNumberPos !== 'none' ? `(${fmt.pageNumberPos.replace('top-','↑').replace('bottom-','↓')})` : '▾'}
          </button>
          {showPnMenu && (
            <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 700, background: '#252525', border: '1px solid #444', minWidth: 170, boxShadow: '0 6px 18px rgba(0,0,0,0.5)', borderRadius: 4 }}>
              {PAGE_NUM_OPTIONS.map(opt => (
                <button key={opt.val} onMouseDown={e => { e.preventDefault(); setPnPos(opt.val); }}
                  style={{ display: 'block', width: '100%', textAlign: 'left', background: fmt.pageNumberPos === opt.val ? '#2e3c50' : 'transparent', border: 'none', borderBottom: '1px solid #333', color: fmt.pageNumberPos === opt.val ? '#7cb9e8' : '#ccc', fontFamily: 'system-ui', fontSize: 11, padding: '7px 12px', cursor: 'pointer' }}>
                  {opt.label}
                </button>
              ))}
              <div style={{ padding: '6px 12px', borderTop: '1px solid #333', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 9, color: '#888' }}>Start #</span>
                <input type="number" min={0} max={999} value={fmt.pageNumberStart}
                  onChange={e => onFmt({ pageNumberStart: Math.max(0, parseInt(e.target.value) || 1) })}
                  style={{ width: 44, background: '#111', border: '1px solid #444', color: '#ccc', fontSize: 11, padding: '2px 5px', borderRadius: 3 }} />
              </div>
            </div>
          )}
        </div>
        {/* Different first page */}
        <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
          <input type="checkbox" checked={fmt.differentFirstPage}
            onChange={e => onFmt({ differentFirstPage: e.target.checked })}
            style={{ accentColor: D.accent }} />
          <span style={{ fontSize: 9, color: D.textDim, whiteSpace: 'nowrap' }}>Diff. first page</span>
        </label>
      </div>
    </RibbonGroup>
  );
}

function RibbonGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', flexShrink: 0, minWidth: 'max-content',
      borderRight: `1px solid ${D.border}`, paddingRight: 8, marginRight: 2, paddingBottom: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 3, flex: 1, paddingBottom: 4, flexWrap: 'wrap' }}>
        {children}
      </div>
      <div style={{ fontSize: 8, color: D.textDim, textAlign: 'center', letterSpacing: 0.5,
        paddingTop: 2, borderTop: `1px solid ${D.border}40`, fontFamily: 'system-ui', userSelect: 'none' }}>
        {label}
      </div>
    </div>
  );
}

interface RibbonBarProps {
  fmt: DocFormat;
  onFmt: (u: Partial<DocFormat>) => void;
  showTemplates: boolean;
  onTemplate: (t: DocTemplate) => void;
  onToggleTemplates: () => void;
  focusedId: string | null;
  addBlock: (afterId: string, type: BlockType) => void;
  addBlockAtEnd: (type?: BlockType) => void;
  showFind: boolean;
  onToggleFind: () => void;
  wordCount: number;
  charCount: number;
  saveNow: () => void;
  createNew: () => void;
  undo: () => void;
  redo: () => void;
  exportText: () => void;
  downloadTxt: () => void;
  printDoc: () => void;
  currentPath: string | null;
  saveStatus: SaveStatus;
}

function RibbonBar({
  fmt, onFmt,
  showTemplates, onTemplate, onToggleTemplates,
  focusedId, addBlock, addBlockAtEnd,
  showFind, onToggleFind,
  wordCount, charCount,
  saveNow, createNew, undo, redo,
  exportText, downloadTxt, printDoc,
  currentPath, saveStatus,
}: RibbonBarProps) {
  const [activeTab, setActiveTab] = useState<'Home' | 'Insert' | 'Layout' | 'Review'>('Home');
  const [showColors,  setShowColors]  = useState<'fore' | 'hi' | null>(null);
  const [showMargins, setShowMargins] = useState(false);
  const [showSpacing, setShowSpacing] = useState(false);

  const exec = (cmd: string, val?: string) => { try { document.execCommand(cmd, false, val ?? undefined); } catch { /* noop */ } };

  const insertBlock = (type: BlockType) => {
    if (focusedId) addBlock(focusedId, type);
    else addBlockAtEnd(type);
  };

  const insertHyperlink = () => {
    const url = window.prompt('Enter URL:', 'https://');
    if (url) exec('createLink', url);
  };

  const insertDate = () => {
    const d = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    exec('insertText', d);
  };

  const xb = (label: string, cmd: string, val?: string, title?: string, s?: React.CSSProperties) => (
    <button key={label + cmd} onMouseDown={e => { e.preventDefault(); exec(cmd, val); }} title={title ?? label}
      style={{ ...TB, ...s }}>{label}</button>
  );

  const COLORS = ['#111111','#1a4a88','#c0392b','#27ae60','#8e44ad','#d35400','#777777','#000080','#8B0000','#006400','#b8860b','#008080'];
  const HI     = ['#ffff00','#00ff00','#00ffff','#ff00ff','#ff8800','#d4f0ff','#fffacd','#d4ffd4','#ffd4d4','#e8d4ff'];

  const statusColor = saveStatus === 'saved' ? '#4caf50' : saveStatus === 'saving' ? '#f0a030' : '#e74c3c';
  const statusLabel = saveStatus === 'saved' ? '● Saved' : saveStatus === 'saving' ? '● Saving…' : '● Unsaved';

  // ── Quick-access bar ──────────────────────────────────────────────────────────
  const quickBar = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '3px 10px', background: '#252525', borderBottom: `1px solid ${D.border}`, flexShrink: 0 }}>
      <button onClick={saveNow} title="Save (Ctrl+S)" style={{ ...TB, fontSize: 10, padding: '1px 7px' }}>Save</button>
      <button onClick={createNew} title="New document" style={{ ...TB, fontSize: 10, padding: '1px 7px' }}>New</button>
      <Sep />
      <button onMouseDown={e => { e.preventDefault(); undo(); }} title="Undo (Ctrl+Z)" style={{ ...TB, fontSize: 12, padding: '0 6px' }}>↩</button>
      <button onMouseDown={e => { e.preventDefault(); redo(); }} title="Redo (Ctrl+Y)" style={{ ...TB, fontSize: 12, padding: '0 6px' }}>↪</button>
      <Sep />
      <button onClick={downloadTxt} title="Download .txt" style={{ ...TB, fontSize: 10, padding: '1px 7px' }}>Download</button>
      <button onClick={printDoc} title="Print (Ctrl+P)" style={{ ...TB, fontSize: 10, padding: '1px 7px' }}>Print</button>
      <div style={{ flex: 1 }} />
      {currentPath && (
        <span style={{ fontSize: 9, color: D.textDim, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>
          {currentPath.split('/').pop()}
        </span>
      )}
      <span style={{ fontSize: 9, color: statusColor, whiteSpace: 'nowrap' }}>{statusLabel}</span>
    </div>
  );

  // ── Tab strip ──────────────────────────────────────────────────────────────────
  const tabStrip = (
    <div style={{ display: 'flex', background: D.chrome, borderBottom: `1px solid ${D.border}`, paddingLeft: 6, flexShrink: 0 }}>
      {(['Home','Insert','Layout','Review'] as const).map(tab => (
        <button key={tab} onClick={() => setActiveTab(tab)} style={{
          background: activeTab === tab ? D.toolbar : 'transparent',
          border: 'none', borderBottom: activeTab === tab ? `2px solid ${D.accent}` : '2px solid transparent',
          color: activeTab === tab ? D.textHi : D.textDim,
          fontFamily: 'system-ui, sans-serif', fontSize: 11, padding: '5px 14px',
          cursor: 'pointer', letterSpacing: 0.2, transition: 'color 0.1s',
        }}>{tab}</button>
      ))}
    </div>
  );

  // ── HOME tab ──────────────────────────────────────────────────────────────────
  const homeTab = (
    <div style={{ display: 'flex', alignItems: 'stretch', padding: '5px 8px 2px', gap: 4, overflowX: 'auto', minHeight: 64 }}>

      {/* Clipboard */}
      <RibbonGroup label="Clipboard">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <button onMouseDown={e => { e.preventDefault(); exec('paste'); }} title="Paste (Ctrl+V)"
            style={{ ...TB, fontSize: 10, padding: '3px 10px', whiteSpace: 'nowrap', height: 28 }}>Paste</button>
          <div style={{ display: 'flex', gap: 2 }}>
            <button onMouseDown={e => { e.preventDefault(); exec('cut'); }} title="Cut (Ctrl+X)"
              style={{ ...TB, fontSize: 10, flex: 1, padding: '1px 4px', whiteSpace: 'nowrap' }}>Cut</button>
            <button onMouseDown={e => { e.preventDefault(); exec('copy'); }} title="Copy (Ctrl+C)"
              style={{ ...TB, fontSize: 10, flex: 1, padding: '1px 4px', whiteSpace: 'nowrap' }}>Copy</button>
          </div>
        </div>
      </RibbonGroup>

      {/* Font */}
      <RibbonGroup label="Font">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Row 1: family + size */}
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <select value={fmt.fontFamily} onChange={e => onFmt({ fontFamily: e.target.value })}
              style={{ background: D.chrome, border: `1px solid ${D.border}`, color: D.text, fontFamily: 'system-ui', fontSize: 11, padding: '2px 4px', borderRadius: 2, width: 134, cursor: 'pointer' }}>
              {FONT_FAMILIES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
            <input type="number" value={fmt.fontSize} min={6} max={96}
              onChange={e => onFmt({ fontSize: Math.max(6, Math.min(96, parseInt(e.target.value) || 12)) })}
              style={{ background: D.chrome, border: `1px solid ${D.border}`, color: D.text, fontFamily: 'system-ui', fontSize: 11, padding: '2px 4px', borderRadius: 2, width: 44, textAlign: 'center' }} />
          </div>
          {/* Row 2: Bold Italic Underline Strike | Sub Sup | Colors | Clear */}
          <div style={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            {xb('B', 'bold',        undefined, 'Bold (Ctrl+B)',      { fontWeight: 'bold', width: 24, textAlign: 'center', padding: '2px 0' })}
            {xb('I', 'italic',      undefined, 'Italic (Ctrl+I)',    { fontStyle: 'italic', width: 22, textAlign: 'center', padding: '2px 0' })}
            {xb('U', 'underline',   undefined, 'Underline (Ctrl+U)',  { textDecoration: 'underline', width: 22, textAlign: 'center', padding: '2px 0' })}
            {xb('S', 'strikeThrough', undefined,'Strikethrough',     { textDecoration: 'line-through', width: 22, textAlign: 'center', padding: '2px 0', color: D.textDim })}
            <Sep />
            {xb('x₂','subscript',   undefined, 'Subscript',          { fontSize: 10, width: 24, textAlign: 'center', padding: '2px 0' })}
            {xb('x²','superscript', undefined, 'Superscript',        { fontSize: 10, width: 24, textAlign: 'center', padding: '2px 0' })}
            <Sep />
            {/* Font color */}
            <div style={{ position: 'relative' }}>
              <button onMouseDown={e => { e.preventDefault(); setShowColors(c => c === 'fore' ? null : 'fore'); setShowMargins(false); setShowSpacing(false); }}
                title="Font Color" style={{ ...TB, fontSize: 10, padding: '1px 5px', display: 'flex', alignItems: 'center', gap: 2 }}>
                <span style={{ display: 'inline-block', fontWeight: 'bold', fontSize: 12, lineHeight: 1 }}>A</span>
                <span style={{ display: 'inline-block', width: 14, height: 3, background: '#c0392b' }} />
                <span style={{ fontSize: 8 }}>▾</span>
              </button>
              {showColors === 'fore' && (
                <div onMouseDown={e => e.stopPropagation()} style={{ position: 'absolute', top: '100%', left: 0, zIndex: 600, background: '#1e1e1e', border: `1px solid ${D.border}`, padding: 6, display: 'flex', flexWrap: 'wrap', gap: 3, width: 130, boxShadow: '0 4px 14px rgba(0,0,0,0.6)' }}>
                  {COLORS.map(c => (
                    <button key={c} onMouseDown={e => { e.preventDefault(); exec('foreColor', c); setShowColors(null); }}
                      style={{ width: 17, height: 17, background: c, border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', borderRadius: 2, padding: 0 }} />
                  ))}
                </div>
              )}
            </div>
            {/* Highlight color */}
            <div style={{ position: 'relative' }}>
              <button onMouseDown={e => { e.preventDefault(); setShowColors(c => c === 'hi' ? null : 'hi'); setShowMargins(false); setShowSpacing(false); }}
                title="Highlight Color" style={{ ...TB, fontSize: 10, padding: '1px 5px', display: 'flex', alignItems: 'center', gap: 2 }}>
                <span style={{ display: 'inline-block', width: 14, height: 11, background: '#ffff00', border: '1px solid #bbb' }} />
                <span style={{ fontSize: 8 }}>▾</span>
              </button>
              {showColors === 'hi' && (
                <div onMouseDown={e => e.stopPropagation()} style={{ position: 'absolute', top: '100%', left: 0, zIndex: 600, background: '#1e1e1e', border: `1px solid ${D.border}`, padding: 6, display: 'flex', flexWrap: 'wrap', gap: 3, width: 120, boxShadow: '0 4px 14px rgba(0,0,0,0.6)' }}>
                  {HI.map(c => (
                    <button key={c} onMouseDown={e => { e.preventDefault(); exec('hiliteColor', c); setShowColors(null); }}
                      style={{ width: 17, height: 17, background: c, border: '1px solid #999', cursor: 'pointer', borderRadius: 2, padding: 0 }} />
                  ))}
                </div>
              )}
            </div>
            <Sep />
            {xb('✕ Clear','removeFormat',undefined,'Clear Formatting',{ fontSize: 10, color: D.textDim, padding: '2px 6px', whiteSpace: 'nowrap' })}
          </div>
        </div>
      </RibbonGroup>

      {/* Paragraph */}
      <RibbonGroup label="Paragraph">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div style={{ display: 'flex', gap: 2 }}>
            {[['≡←','justifyLeft','Left'],['≡','justifyCenter','Center'],['≡→','justifyRight','Right'],['≡=','justifyFull','Justify']].map(
              ([l,c,t]) => xb(l,c,undefined,`Align ${t}`,{ width: 26, textAlign: 'center', padding: '2px 0', fontSize: 12 })
            )}
          </div>
          <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            {xb('• —','insertUnorderedList',undefined,'Bullet List',    { fontSize: 10, padding: '2px 6px', whiteSpace: 'nowrap' })}
            {xb('1. —','insertOrderedList',undefined, 'Numbered List',   { fontSize: 10, padding: '2px 6px', whiteSpace: 'nowrap' })}
            <Sep />
            {xb('→','indent', undefined,'Indent',   { width: 22, textAlign: 'center', padding: '2px 0' })}
            {xb('←','outdent',undefined,'Outdent',  { width: 22, textAlign: 'center', padding: '2px 0' })}
          </div>
        </div>
      </RibbonGroup>

      {/* Styles */}
      <RibbonGroup label="Styles">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div style={{ display: 'flex', gap: 2 }}>
            {(['paragraph','heading1','heading2','heading3'] as BlockType[]).map(t => (
              <button key={t} onClick={() => insertBlock(t)} title={`Insert ${BLOCK_TYPE_NAMES[t]}`}
                style={{ ...TB, fontSize: 10, width: 30, textAlign: 'center', padding: '2px 0', color: D.textDim, fontFamily: '"Courier New",monospace' }}>
                {BLOCK_SHORT[t]}
              </button>
            ))}
          </div>
          <div style={{ position: 'relative' }}>
            <button onMouseDown={e => { e.preventDefault(); onToggleTemplates(); }}
              style={{ ...(showTemplates ? TBActive : TB), fontSize: 10, padding: '2px 8px', width: '100%', whiteSpace: 'nowrap' }}>
              Templates ▾
            </button>
            {showTemplates && (
              <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 600, background: '#fff', border: '1px solid #ccc', minWidth: 220, boxShadow: '0 6px 20px rgba(0,0,0,0.18)', borderRadius: 4 }}>
                <div style={{ padding: '7px 14px 4px', fontSize: 9, color: '#999', letterSpacing: 1, fontFamily: 'system-ui', borderBottom: '1px solid #eee' }}>DOCUMENT TEMPLATES</div>
                {TEMPLATES.map(t => (
                  <button key={t.name} onMouseDown={e => { e.preventDefault(); onTemplate(t); }}
                    style={{ display: 'block', width: '100%', textAlign: 'left', background: 'transparent', border: 'none', borderBottom: '1px solid #f0f0f0', color: '#333', fontFamily: 'system-ui', fontSize: 12, padding: '9px 14px', cursor: 'pointer' }}>
                    <div style={{ fontWeight: 500, marginBottom: 2 }}>{t.name}</div>
                    <div style={{ fontSize: 10, color: '#999' }}>{t.subject} · {t.tags.join(', ')}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </RibbonGroup>
    </div>
  );

  // ── INSERT tab ────────────────────────────────────────────────────────────────
  const insertTab = (
    <div style={{ display: 'flex', alignItems: 'stretch', padding: '5px 8px 2px', gap: 4, overflowX: 'auto', minHeight: 64 }}>

      <RibbonGroup label="Pages">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <button onClick={() => insertBlock('divider')} title="Insert section break"
            style={{ ...TB, fontSize: 10, padding: '2px 10px', whiteSpace: 'nowrap' }}>— Page Break</button>
          <button onClick={() => insertBlock('annotation')} title="Insert blank annotation"
            style={{ ...TB, fontSize: 10, padding: '2px 10px', whiteSpace: 'nowrap', color: D.textDim }}>Blank Section</button>
        </div>
      </RibbonGroup>

      <RibbonGroup label="Content Blocks">
        <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap', maxWidth: 240, alignItems: 'flex-start' }}>
          {([['H1','heading1'],['H2','heading2'],['H3','heading3'],['"','quote'],['<>','code'],['Σ','math'],['†','annotation'],['—','divider']] as [string, BlockType][]).map(
            ([label, type]) => (
              <button key={type} onClick={() => insertBlock(type)} title={`Insert ${BLOCK_TYPE_NAMES[type]}`}
                style={{ ...TB, fontSize: 10, padding: '3px 8px', color: D.textDim, fontFamily: '"Courier New",monospace' }}>
                {label}
              </button>
            )
          )}
        </div>
      </RibbonGroup>

      <RibbonGroup label="Links">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <button onMouseDown={e => { e.preventDefault(); insertHyperlink(); }} title="Insert hyperlink"
            style={{ ...TB, fontSize: 10, padding: '2px 10px', whiteSpace: 'nowrap' }}>Link</button>
          <button onMouseDown={e => { e.preventDefault(); exec('unlink'); }} title="Remove hyperlink"
            style={{ ...TB, fontSize: 10, padding: '2px 10px', whiteSpace: 'nowrap', color: D.textDim }}>Unlink</button>
        </div>
      </RibbonGroup>

      <RibbonGroup label="Text">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <button onMouseDown={e => { e.preventDefault(); insertDate(); }} title="Insert today's date"
            style={{ ...TB, fontSize: 10, padding: '2px 10px', whiteSpace: 'nowrap' }}>Date & Time</button>
          <button onMouseDown={e => { e.preventDefault(); exec('insertHorizontalRule'); }} title="Insert horizontal rule"
            style={{ ...TB, fontSize: 10, padding: '2px 10px', whiteSpace: 'nowrap', color: D.textDim }}>H. Rule</button>
        </div>
      </RibbonGroup>

      {/* ── Header & Footer ── */}
      <HeaderFooterGroup fmt={fmt} onFmt={onFmt} />

      <RibbonGroup label="Symbols">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, maxWidth: 160 }}>
          {[['©','©'],['®','®'],['™','™'],['°','°'],['±','±'],['≈','≈'],['≠','≠'],['÷','÷'],['×','×'],['½','½'],['¼','¼'],['¾','¾'],['…','…'],['—','—'],['–','–']].map(([sym, val]) => (
            <button key={sym} onMouseDown={e => { e.preventDefault(); exec('insertText', val); }} title={sym}
              style={{ ...TB, fontSize: 11, width: 24, textAlign: 'center', padding: '2px 0', fontFamily: 'serif' }}>
              {sym}
            </button>
          ))}
        </div>
      </RibbonGroup>
    </div>
  );

  // ── LAYOUT tab ────────────────────────────────────────────────────────────────
  const layoutTab = (
    <div style={{ display: 'flex', alignItems: 'stretch', padding: '5px 8px 2px', gap: 4, overflowX: 'auto', minHeight: 64 }}>

      <RibbonGroup label="Page Setup">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 10, color: D.textDim, fontFamily: 'system-ui', whiteSpace: 'nowrap' }}>Margins:</span>
            <div style={{ position: 'relative' }}>
              <button onMouseDown={e => { e.preventDefault(); setShowMargins(s => !s); setShowColors(null); setShowSpacing(false); }}
                style={{ ...TB, fontSize: 10, padding: '2px 8px', whiteSpace: 'nowrap' }}>
                {MARGIN_PRESETS[fmt.marginPreset]?.label ?? 'Normal'} ▾
              </button>
              {showMargins && (
                <div onMouseDown={e => e.stopPropagation()} style={{ position: 'absolute', top: '100%', left: 0, zIndex: 600, background: '#1e1e1e', border: `1px solid ${D.border}`, minWidth: 150, boxShadow: '0 4px 14px rgba(0,0,0,0.6)' }}>
                  {Object.entries(MARGIN_PRESETS).map(([key, val]) => (
                    <button key={key} onMouseDown={e => { e.preventDefault(); onFmt({ marginPreset: key }); setShowMargins(false); }}
                      style={{ display: 'block', width: '100%', textAlign: 'left', background: fmt.marginPreset === key ? '#2e3c50' : 'transparent', border: 'none', borderBottom: `1px solid ${D.border}`, color: fmt.marginPreset === key ? D.accent : D.text, fontFamily: 'system-ui', fontSize: 11, padding: '7px 12px', cursor: 'pointer' }}>
                      {val.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 10, color: D.textDim, fontFamily: 'system-ui', whiteSpace: 'nowrap' }}>Orientation:</span>
            <button onMouseDown={e => { e.preventDefault(); onFmt({ orientation: fmt.orientation === 'landscape' ? 'portrait' : 'landscape' }); }}
              style={{ ...TB, fontSize: 10, padding: '2px 8px', whiteSpace: 'nowrap' }}>
              {fmt.orientation === 'landscape' ? 'Landscape' : 'Portrait'}
            </button>
          </div>
        </div>
      </RibbonGroup>

      <RibbonGroup label="Paragraph">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 10, color: D.textDim, fontFamily: 'system-ui', whiteSpace: 'nowrap' }}>Line Spacing:</span>
            <div style={{ position: 'relative' }}>
              <button onMouseDown={e => { e.preventDefault(); setShowSpacing(s => !s); setShowColors(null); setShowMargins(false); }}
                style={{ ...TB, fontSize: 10, padding: '2px 8px', whiteSpace: 'nowrap' }}>
                {fmt.lineSpacing.toFixed(2)} ▾
              </button>
              {showSpacing && (
                <div onMouseDown={e => e.stopPropagation()} style={{ position: 'absolute', top: '100%', left: 0, zIndex: 600, background: '#1e1e1e', border: `1px solid ${D.border}`, minWidth: 80, boxShadow: '0 4px 14px rgba(0,0,0,0.6)' }}>
                  {[1.0, 1.15, 1.5, 1.85, 2.0, 2.5, 3.0].map(n => (
                    <button key={n} onMouseDown={e => { e.preventDefault(); onFmt({ lineSpacing: n }); setShowSpacing(false); }}
                      style={{ display: 'block', width: '100%', textAlign: 'left', background: fmt.lineSpacing === n ? '#2e3c50' : 'transparent', border: 'none', borderBottom: `1px solid ${D.border}`, color: fmt.lineSpacing === n ? D.accent : D.text, fontFamily: 'system-ui', fontSize: 11, padding: '7px 12px', cursor: 'pointer' }}>
                      {n.toFixed(2)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            {xb('→ Indent','indent',  undefined,'Indent',  { fontSize: 10, padding: '2px 8px', whiteSpace: 'nowrap' })}
            {xb('← Outdent','outdent',undefined,'Outdent', { fontSize: 10, padding: '2px 8px', whiteSpace: 'nowrap' })}
          </div>
        </div>
      </RibbonGroup>

      <RibbonGroup label="Font Size">
        <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap', maxWidth: 180 }}>
          {[['XS','1'],['S','2'],['M','3'],['L','4'],['XL','5'],['2X','6']].map(([lbl, sz]) => (
            <button key={lbl} onMouseDown={e => { e.preventDefault(); exec('fontSize', sz); }} title={`Font size: ${lbl}`}
              style={{ ...TB, fontSize: 9, padding: '3px 7px', color: D.textDim }}>
              {lbl}
            </button>
          ))}
        </div>
      </RibbonGroup>
    </div>
  );

  // ── REVIEW tab ────────────────────────────────────────────────────────────────
  const reviewTab = (
    <div style={{ display: 'flex', alignItems: 'stretch', padding: '5px 8px 2px', gap: 4, overflowX: 'auto', minHeight: 64 }}>

      <RibbonGroup label="Proofing">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <button onMouseDown={e => { e.preventDefault(); onFmt({ spellCheck: !fmt.spellCheck }); }}
            style={{ ...(fmt.spellCheck ? TBActive : TB), fontSize: 10, padding: '2px 10px', whiteSpace: 'nowrap' }}>
            Spelling {fmt.spellCheck ? 'ON' : 'OFF'}
          </button>
          <a href="https://www.merriam-webster.com/thesaurus" target="_blank" rel="noopener noreferrer"
            style={{ ...TB as React.CSSProperties, fontSize: 10, padding: '2px 10px', textDecoration: 'none', color: D.textDim, display: 'block', textAlign: 'center', whiteSpace: 'nowrap' }}>
            Thesaurus ↗
          </a>
        </div>
      </RibbonGroup>

      <RibbonGroup label="Language">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <a href="https://translate.google.com" target="_blank" rel="noopener noreferrer"
            style={{ ...TB as React.CSSProperties, fontSize: 10, padding: '2px 10px', textDecoration: 'none', color: D.text, display: 'block', textAlign: 'center', whiteSpace: 'nowrap' }}>
            Translate ↗
          </a>
          <a href="https://www.merriam-webster.com/dictionary" target="_blank" rel="noopener noreferrer"
            style={{ ...TB as React.CSSProperties, fontSize: 10, padding: '2px 10px', textDecoration: 'none', color: D.textDim, display: 'block', textAlign: 'center', whiteSpace: 'nowrap' }}>
            Dictionary ↗
          </a>
        </div>
      </RibbonGroup>

      <RibbonGroup label="Find">
        <button onMouseDown={e => { e.preventDefault(); onToggleFind(); }}
          style={{ ...(showFind ? TBActive : TB), fontSize: 10, padding: '4px 12px', whiteSpace: 'nowrap' }}>
          Find & Replace
        </button>
      </RibbonGroup>

      <RibbonGroup label="Comments">
        <button onClick={() => insertBlock('annotation')} title="Insert new comment/annotation"
          style={{ ...TB, fontSize: 10, padding: '4px 12px', whiteSpace: 'nowrap' }}>
          New Comment
        </button>
      </RibbonGroup>

      <RibbonGroup label="Statistics">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 11, fontFamily: 'system-ui', color: D.text }}>
          <span style={{ whiteSpace: 'nowrap' }}>Words: <strong style={{ color: D.textHi }}>{wordCount.toLocaleString()}</strong></span>
          <span style={{ whiteSpace: 'nowrap' }}>Chars: <strong style={{ color: D.textHi }}>{charCount.toLocaleString()}</strong></span>
        </div>
      </RibbonGroup>

      <RibbonGroup label="Share">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <button onClick={exportText} title="Copy as plain text"
            style={{ ...TB, fontSize: 10, padding: '2px 10px', whiteSpace: 'nowrap' }}>Copy Text</button>
          <button onClick={downloadTxt} title="Download .txt"
            style={{ ...TB, fontSize: 10, padding: '2px 10px', whiteSpace: 'nowrap', color: D.textDim }}>Download</button>
        </div>
      </RibbonGroup>
    </div>
  );

  return (
    <div style={{ flexShrink: 0, position: 'relative' }}
      onClick={() => { setShowColors(null); setShowMargins(false); setShowSpacing(false); }}>
      {quickBar}
      {tabStrip}
      <div style={{ background: D.toolbar, borderBottom: `1px solid ${D.border}` }}
        onClick={e => e.stopPropagation()}>
        {activeTab === 'Home'   && homeTab}
        {activeTab === 'Insert' && insertTab}
        {activeTab === 'Layout' && layoutTab}
        {activeTab === 'Review' && reviewTab}
      </div>
    </div>
  );
}

// ─── File sidebar ──────────────────────────────────────────────────────────────

function FileSidebar({ currentPath, onOpen, onNew }: {
  currentPath: string | null;
  onOpen: (path: string) => void;
  onNew: () => void;
}) {
  const [docs, setDocs] = useState(() => { academyDocs.seedDefaults(); return academyDocs.listAll(); });
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const refresh = () => setDocs(academyDocs.listAll());
  useEffect(() => { refresh(); }, [currentPath]);

  const handleDelete = (path: string) => {
    if (confirmDelete === path) {
      virtualFS.deleteFile(path);
      refresh();
      setConfirmDelete(null);
    } else {
      setConfirmDelete(path);
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  };

  const filtered = search.trim()
    ? docs.filter(d => d.name.toLowerCase().includes(search.toLowerCase()) || d.preview.toLowerCase().includes(search.toLowerCase()))
    : docs;

  return (
    <div style={{ width: 168, flexShrink: 0, borderRight: `1px solid ${D.border}`,
      display: 'flex', flexDirection: 'column', overflow: 'hidden', background: D.sidebar }}>

      <div style={{ padding: '10px 10px 8px', borderBottom: `1px solid ${D.border}` }}>
        <div style={{ fontSize: 9, color: D.textDim, fontFamily: 'system-ui', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 7 }}>
          Documents
        </div>
        <button onClick={onNew} style={{
          width: '100%', background: '#1a4a88', border: '1px solid #2a6aaa',
          color: '#c8deff', fontFamily: 'system-ui', fontSize: 11, padding: '5px 0',
          cursor: 'pointer', borderRadius: 3,
        }}>
          + New Document
        </button>
      </div>

      <div style={{ padding: '6px 8px', borderBottom: `1px solid ${D.border}` }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
          style={{ width: '100%', background: '#1a1a1a', border: `1px solid ${D.border}`, outline: 'none',
            color: D.text, fontFamily: 'system-ui', fontSize: 11, padding: '4px 8px',
            boxSizing: 'border-box', borderRadius: 3 }} />
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filtered.length === 0 && (
          <div style={{ padding: 16, fontSize: 11, color: D.textDim, fontFamily: 'system-ui', textAlign: 'center', lineHeight: 1.5 }}>
            {search ? 'No matches.' : 'No documents yet.'}
          </div>
        )}
        {filtered.map(doc => (
          <div key={doc.path} style={{ position: 'relative' }}>
            <button onClick={() => onOpen(doc.path)}
              style={{
                width: '100%', textAlign: 'left',
                background: currentPath === doc.path ? '#2e3c50' : 'transparent',
                border: 'none', borderBottom: `1px solid ${D.border}`,
                borderLeft: `2px solid ${currentPath === doc.path ? D.accent : 'transparent'}`,
                color: currentPath === doc.path ? '#c8deff' : D.text,
                fontFamily: 'system-ui', fontSize: 11,
                padding: '8px 10px', cursor: 'pointer',
              }}>
              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 18 }}>
                {doc.name}
              </div>
              {doc.preview && (
                <div style={{ fontSize: 9, color: D.textDim, marginTop: 2,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {doc.preview}
                </div>
              )}
            </button>
            <button
              onClick={e => { e.stopPropagation(); handleDelete(doc.path); }}
              title={confirmDelete === doc.path ? 'Confirm delete' : 'Delete'}
              style={{
                position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)',
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: confirmDelete === doc.path ? '#e74c3c' : D.textDim,
                fontSize: 12, padding: '2px 5px',
              }}>
              {confirmDelete === doc.path ? '?' : '×'}
            </button>
          </div>
        ))}
      </div>

      <div style={{ padding: '5px 10px', borderTop: `1px solid ${D.border}`, fontSize: 9,
        color: D.textDim, fontFamily: 'system-ui' }}>
        {docs.length} doc{docs.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}

// ─── Main App ──────────────────────────────────────────────────────────────────

type SaveStatus = 'saved' | 'unsaved' | 'saving';

export function WordProcessorApp() {
  const [doc, setDoc] = useState<AcademyDoc>(() => { academyDocs.seedDefaults(); return newDoc(); });
  const [currentPath, setCurrentPath] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [typeMenuId, setTypeMenuId] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showFind, setShowFind] = useState(false);
  const [fmt, setFmt] = useState<DocFormat>(() => {
    try { return { ...DEFAULT_FMT, ...JSON.parse(localStorage.getItem('academy-wp-fmt') ?? 'null') }; }
    catch { return DEFAULT_FMT; }
  });
  const onFmt = useCallback((updates: Partial<DocFormat>) => {
    setFmt(prev => {
      const next = { ...prev, ...updates };
      localStorage.setItem('academy-wp-fmt', JSON.stringify(next));
      return next;
    });
  }, []);

  const historyRef = useRef<DocBlock[][]>([]);
  const historyIdxRef = useRef(-1);

  const pushHistory = useCallback((blocks: DocBlock[]) => {
    historyRef.current = historyRef.current.slice(0, historyIdxRef.current + 1);
    historyRef.current.push(blocks.map(b => ({ ...b })));
    if (historyRef.current.length > 60) historyRef.current.shift();
    else historyIdxRef.current++;
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

  const saveTimer = useRef<ReturnType<typeof setTimeout>>();
  const doSave = useCallback((docToSave: AcademyDoc, path: string | null) => {
    setSaveStatus('saving');
    setTimeout(() => {
      const result = academyDocs.save(docToSave, path ?? undefined);
      if (result.success) { setCurrentPath(result.path); setSaveStatus('saved'); }
      else setSaveStatus('unsaved');
    }, 80);
  }, []);

  const queueSave = useCallback((d: AcademyDoc, p: string | null) => {
    setSaveStatus('unsaved');
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => doSave(d, p), 2200);
  }, [doSave]);

  useEffect(() => () => clearTimeout(saveTimer.current), []);

  const blockRefs = useRef(new Map<string, HTMLTextAreaElement>());
  const focusBlock = useCallback((id: string) => {
    setFocusedId(id);
    setTimeout(() => {
      const el = blockRefs.current.get(id);
      if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
    }, 20);
  }, []);

  const addBlock = useCallback((afterId: string, type: BlockType = 'paragraph') => {
    setDoc(prev => {
      const idx = prev.blocks.findIndex(b => b.id === afterId);
      const nb = newBlock(type);
      const blocks = [...prev.blocks.slice(0, idx + 1), nb, ...prev.blocks.slice(idx + 1)];
      pushHistory(blocks);
      setTimeout(() => focusBlock(nb.id), 30);
      const updated = { ...prev, blocks };
      queueSave(updated, currentPath);
      return updated;
    });
  }, [focusBlock, pushHistory, queueSave, currentPath]);

  const updateBlock = useCallback((id: string, updates: Partial<DocBlock>) => {
    setDoc(prev => {
      const updated = { ...prev, blocks: prev.blocks.map(b => b.id === id ? { ...b, ...updates } : b) };
      queueSave(updated, currentPath);
      return updated;
    });
  }, [queueSave, currentPath]);

  const deleteBlock = useCallback((id: string) => {
    setDoc(prev => {
      if (prev.blocks.length <= 1) return prev;
      const blocks = prev.blocks.filter(b => b.id !== id);
      pushHistory(blocks);
      const updated = { ...prev, blocks };
      queueSave(updated, currentPath);
      return updated;
    });
  }, [pushHistory, queueSave, currentPath]);

  const focusPrev = useCallback((id: string) => {
    const idx = doc.blocks.findIndex(b => b.id === id);
    if (idx > 0) focusBlock(doc.blocks[idx - 1].id);
  }, [doc.blocks, focusBlock]);

  const addBlockAtEnd = useCallback((type: BlockType = 'paragraph') => {
    const nb = newBlock(type);
    setDoc(prev => {
      const blocks = [...prev.blocks, nb];
      pushHistory(blocks);
      const updated = { ...prev, blocks };
      queueSave(updated, currentPath);
      return updated;
    });
    setTimeout(() => focusBlock(nb.id), 30);
  }, [focusBlock, pushHistory, queueSave, currentPath]);

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

  const saveNow = useCallback(() => {
    clearTimeout(saveTimer.current);
    doSave(doc, currentPath);
  }, [doc, currentPath, doSave]);

  const applyTemplate = useCallback((t: DocTemplate) => {
    const blocks = t.blocks.map(b => ({ ...newBlock(b.type, b.content), lang: b.lang, citation: b.citation }));
    const updated = { ...doc, title: t.name, subject: t.subject, tags: t.tags, blocks };
    pushHistory(blocks);
    setDoc(updated);
    queueSave(updated, currentPath);
    setShowTemplates(false);
  }, [doc, currentPath, pushHistory, queueSave]);

  const exportText = useCallback(() => {
    navigator.clipboard.writeText(docToPlainText(doc)).catch(() => {});
  }, [doc]);

  const downloadTxt = useCallback(() => {
    const text = docToPlainText(doc);
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.title.replace(/[^a-z0-9]/gi, '_') || 'document'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [doc]);

  const printDoc = useCallback(() => {
    const text = docToPlainText(doc);
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>${doc.title}</title><style>body{font-family:Georgia,serif;font-size:12pt;line-height:1.7;padding:60pt 80pt;max-width:none;color:#111;}h1{font-size:24pt;margin-bottom:16pt;}h2{font-size:18pt;}pre{font-size:10pt;background:#f5f5f5;padding:10pt;}</style></head><body><pre style="white-space:pre-wrap;font-family:inherit;">${text.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</pre></body></html>`);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  }, [doc]);

  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 's') { e.preventDefault(); saveNow(); }
        if (e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
        if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) { e.preventDefault(); redo(); }
        if (e.key === 'f') { e.preventDefault(); setShowFind(s => !s); }
        if (e.key === 'p') { e.preventDefault(); printDoc(); }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [saveNow, undo, redo, printDoc]);

  const wordCount = docWordCount(doc);
  const charCount = doc.blocks.reduce((sum, b) => sum + (b.content?.replace(/<[^>]*>/g, '') ?? '').length, 0);

  return (
    <div
      style={{ display: 'flex', height: '100%', background: D.chrome, color: D.text, fontFamily: 'system-ui', overflow: 'hidden' }}
      onClick={() => { setTypeMenuId(null); setShowTemplates(false); }}>

      <FileSidebar currentPath={currentPath} onOpen={openDoc} onNew={createNew} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* ── Ribbon ── */}
        <RibbonBar
          fmt={fmt} onFmt={onFmt}
          showTemplates={showTemplates}
          onTemplate={applyTemplate}
          onToggleTemplates={() => setShowTemplates(s => !s)}
          focusedId={focusedId}
          addBlock={addBlock}
          addBlockAtEnd={addBlockAtEnd}
          showFind={showFind}
          onToggleFind={() => setShowFind(s => !s)}
          wordCount={wordCount}
          charCount={charCount}
          saveNow={saveNow}
          createNew={createNew}
          undo={undo}
          redo={redo}
          exportText={exportText}
          downloadTxt={downloadTxt}
          printDoc={printDoc}
          currentPath={currentPath}
          saveStatus={saveStatus}
        />

        {/* ── Find & Replace ── */}
        {showFind && (
          <FindReplacePanel doc={doc}
            onUpdateBlocks={blocks => {
              const updated = { ...doc, blocks };
              pushHistory(blocks);
              setDoc(updated);
              queueSave(updated, currentPath);
            }}
            onClose={() => setShowFind(false)}
          />
        )}

        {/* ── Page canvas ── */}
        <div style={{ flex: 1, overflowY: 'auto', background: D.paperBg, padding: '28px 32px 48px' }}>

          {/* Paper sheet — flex column so header/footer zones sit outside body padding */}
          {(() => {
            const mH = MARGIN_PRESETS[fmt.marginPreset]?.h ?? 72;
            const mV = MARGIN_PRESETS[fmt.marginPreset]?.v ?? 64;
            const pageNum = fmt.pageNumberStart;
            const pageNumStr = String(pageNum);
            const pnPos = fmt.pageNumberPos;
            const pnAlign = pnPos.endsWith('left') ? 'left' : pnPos.endsWith('right') ? 'right' : 'center';
            const isTopPn    = pnPos.startsWith('top');
            const isBottomPn = pnPos.startsWith('bottom');

            const zoneStyle: React.CSSProperties = {
              position: 'relative', padding: `10px ${mH}px`,
              fontFamily: fmt.fontFamily, fontSize: Math.max(10, fmt.fontSize - 2),
            };
            const pageNumEl = (pos: 'top' | 'bottom') => {
              const active = (pos === 'top' && isTopPn) || (pos === 'bottom' && isBottomPn);
              if (!active) return null;
              return (
                <div style={{
                  textAlign: pnAlign as any, color: '#999', fontSize: 10,
                  fontFamily: fmt.fontFamily, pointerEvents: 'none',
                  position: 'absolute', left: mH, right: mH,
                  ...(pos === 'top' ? { bottom: 10 } : { top: 10 }),
                }}>
                  {pageNumStr}
                </div>
              );
            };

            return (
              <div style={{
                maxWidth: fmt.orientation === 'landscape' ? 1020 : 720,
                margin: '0 auto',
                background: D.paper,
                boxShadow: '0 2px 8px rgba(0,0,0,0.45), 0 0 0 1px rgba(0,0,0,0.2)',
                minHeight: fmt.orientation === 'landscape' ? 640 : 960,
                display: 'flex', flexDirection: 'column',
                fontFamily: fmt.fontFamily, fontSize: fmt.fontSize, lineHeight: fmt.lineSpacing,
              }}>

                {/* ── Header zone ── */}
                {fmt.headerEnabled && (
                  <div style={{
                    ...zoneStyle, borderBottom: '1px dashed #c8c8c8',
                    minHeight: 52, display: 'flex', alignItems: 'center',
                  }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                      <textarea
                        rows={1}
                        value={fmt.headerText}
                        onChange={e => onFmt({ headerText: e.target.value })}
                        placeholder="Type header text…"
                        style={{
                          display: 'block', width: '100%', background: 'transparent', border: 'none',
                          outline: 'none', resize: 'none', overflow: 'hidden', color: '#555',
                          fontFamily: fmt.fontFamily, fontSize: Math.max(10, fmt.fontSize - 2),
                          lineHeight: 1.4, padding: 0,
                        }}
                        onInput={e => {
                          const t = e.currentTarget;
                          t.style.height = 'auto';
                          t.style.height = t.scrollHeight + 'px';
                        }}
                      />
                    </div>
                    {pageNumEl('top')}
                    <span style={{ position: 'absolute', top: 6, right: mH, fontSize: 8, color: '#ccc', letterSpacing: 1, fontFamily: 'system-ui', userSelect: 'none' }}>HEADER</span>
                  </div>
                )}

                {/* ── Body ── */}
                <div style={{ flex: 1, padding: `${mV}px ${mH}px` }}>

                  {/* Document title */}
                  <input
                    value={doc.title}
                    onChange={e => {
                      const updated = { ...doc, title: e.target.value };
                      setDoc(updated);
                      queueSave(updated, currentPath);
                    }}
                    placeholder="Untitled Document"
                    style={{
                      display: 'block', width: '100%', background: 'transparent', border: 'none', outline: 'none',
                      fontSize: 28, fontWeight: '700', color: '#0a0a0a', marginBottom: 6,
                      fontFamily: "Georgia, 'Times New Roman', serif",
                      letterSpacing: -0.5,
                      borderBottom: '2px solid #e8e8e8', paddingBottom: 8,
                    }}
                  />

                  {/* Subject + Tags row */}
                  <div style={{ display: 'flex', gap: 20, marginBottom: 28, marginTop: 8 }}>
                    <input
                      value={doc.subject}
                      onChange={e => { const u = { ...doc, subject: e.target.value }; setDoc(u); queueSave(u, currentPath); }}
                      placeholder="Subject"
                      style={{ background: 'transparent', border: 'none', outline: 'none', borderBottom: '1px solid #e0e0e0',
                        color: '#666', fontFamily: 'system-ui', fontSize: 11, padding: '2px 0', width: 140 }}
                    />
                    <input
                      value={doc.tags?.join(', ') ?? ''}
                      onChange={e => { const u = { ...doc, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) }; setDoc(u); queueSave(u, currentPath); }}
                      placeholder="Tags (comma separated)"
                      style={{ background: 'transparent', border: 'none', outline: 'none', borderBottom: '1px solid #e0e0e0',
                        color: '#888', fontFamily: 'system-ui', fontSize: 11, padding: '2px 0', flex: 1 }}
                    />
                  </div>

                  {/* Block list */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {doc.blocks.map((block) => (
                      <BlockRow
                        key={block.id}
                        block={block}
                        focused={focusedId === block.id}
                        onFocus={() => setFocusedId(block.id)}
                        onChange={u => updateBlock(block.id, u)}
                        onDelete={() => deleteBlock(block.id)}
                        onNewBelow={() => addBlock(block.id)}
                        onFocusPrev={() => focusPrev(block.id)}
                        blockRef={el => { if (el) blockRefs.current.set(block.id, el); else blockRefs.current.delete(block.id); }}
                        typeMenuOpen={typeMenuId === block.id}
                        onToggleTypeMenu={() => setTypeMenuId(prev => prev === block.id ? null : block.id)}
                        onCloseTypeMenu={() => setTypeMenuId(null)}
                      />
                    ))}
                  </div>

                  {/* Add block button */}
                  <button
                    onClick={() => addBlockAtEnd()}
                    style={{
                      display: 'block', width: '100%', marginTop: 20, background: 'transparent',
                      border: '1px dashed #d0d0d0', color: '#bbb', fontFamily: 'system-ui', fontSize: 11,
                      padding: '8px 0', cursor: 'pointer', borderRadius: 3,
                      transition: 'border-color 0.15s, color 0.15s',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#aaa'; (e.currentTarget as HTMLButtonElement).style.color = '#888'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#d0d0d0'; (e.currentTarget as HTMLButtonElement).style.color = '#bbb'; }}
                  >
                    + Add Block
                  </button>
                </div>

                {/* ── Footer zone ── */}
                {fmt.footerEnabled && (
                  <div style={{
                    ...zoneStyle, borderTop: '1px dashed #c8c8c8',
                    minHeight: 52, display: 'flex', alignItems: 'center',
                  }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                      <textarea
                        rows={1}
                        value={fmt.footerText}
                        onChange={e => onFmt({ footerText: e.target.value })}
                        placeholder="Type footer text…"
                        style={{
                          display: 'block', width: '100%', background: 'transparent', border: 'none',
                          outline: 'none', resize: 'none', overflow: 'hidden', color: '#555',
                          fontFamily: fmt.fontFamily, fontSize: Math.max(10, fmt.fontSize - 2),
                          lineHeight: 1.4, padding: 0,
                        }}
                        onInput={e => {
                          const t = e.currentTarget;
                          t.style.height = 'auto';
                          t.style.height = t.scrollHeight + 'px';
                        }}
                      />
                    </div>
                    {pageNumEl('bottom')}
                    <span style={{ position: 'absolute', bottom: 6, right: mH, fontSize: 8, color: '#ccc', letterSpacing: 1, fontFamily: 'system-ui', userSelect: 'none' }}>FOOTER</span>
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* ── Status bar ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 14px',
          borderTop: `1px solid ${D.border}`, background: '#1a1a1a', flexShrink: 0 }}>
          <span style={{ fontSize: 9, color: D.textDim, fontFamily: 'system-ui' }}>
            {currentPath ? currentPath.replace('/home/student', '~') : '— new document'}
          </span>
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 9, color: D.textDim }}>{doc.blocks.length} block{doc.blocks.length !== 1 ? 's' : ''}</span>
          <span style={{ fontSize: 9, color: D.textDim }}>{wordCount} words</span>
          <span style={{ fontSize: 9, color: D.textDim }}>{charCount} chars</span>
          <span style={{ fontSize: 9, color: D.textDim }}>{estimateReadingTime(wordCount)}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: saveStatus === 'saved' ? '#4caf50' : saveStatus === 'saving' ? '#f0a030' : '#e74c3c' }} />
            <span style={{ fontSize: 9, color: saveStatus === 'saved' ? '#4caf50' : saveStatus === 'saving' ? '#f0a030' : '#e74c3c', fontFamily: 'system-ui' }}>
              {saveStatus === 'saved' ? 'Saved' : saveStatus === 'saving' ? 'Saving…' : 'Unsaved'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
