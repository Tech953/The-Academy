import { useState, useCallback, useRef, useEffect, KeyboardEvent } from 'react';
import { useCrtTheme } from '@/contexts/CrtThemeContext';
import {
  academyDocs, newDoc, newBlock, docWordCount, docToPlainText,
  AcademyDoc, DocBlock, BlockType, DOCS_ROOT, DOC_EXT,
} from '@/lib/academyDocuments';
import { virtualFS } from '@/lib/virtualFilesystem';

// ─── Block types ──────────────────────────────────────────────────────────────

const BLOCK_TYPES: BlockType[] = [
  'paragraph', 'heading1', 'heading2', 'heading3', 'code', 'quote', 'math', 'annotation', 'divider',
];

const BLOCK_TYPE_NAMES: Record<BlockType, string> = {
  paragraph: 'Paragraph', heading1: 'Heading 1', heading2: 'Heading 2', heading3: 'Heading 3',
  code: 'Code Block', quote: 'Block Quote', math: 'Math / Formula', annotation: 'Annotation / Note', divider: 'Divider',
};

const BLOCK_SHORT: Record<BlockType, string> = {
  paragraph: 'P', heading1: 'H1', heading2: 'H2', heading3: 'H3',
  code: '<>', quote: '"', math: 'Σ', annotation: '†', divider: '—',
};

const RICH_TYPES: BlockType[] = ['paragraph', 'heading1', 'heading2', 'heading3', 'quote'];
function isRich(t: BlockType) { return RICH_TYPES.includes(t); }

// ─── Templates ────────────────────────────────────────────────────────────────

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

// ─── Utility: auto-resize textarea ───────────────────────────────────────────

function autoResize(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = `${el.scrollHeight}px`;
}

function estimateReadingTime(words: number): string {
  const mins = Math.ceil(words / 200);
  return mins < 1 ? '< 1 min read' : `${mins} min read`;
}

// ─── RichBlock (contentEditable for formatted text) ──────────────────────────

interface RichBlockProps {
  block: DocBlock;
  color: string;
  accent: { green: string; amber: string; cyan: string; purple: string; red: string; pink: string };
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

function RichBlock({ block, color, accent, focused, onFocus, onChange, onDelete, onNewBelow, onFocusPrev, typeMenuOpen, onToggleTypeMenu, onCloseTypeMenu }: RichBlockProps) {
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
      flex: 1, outline: 'none', minHeight: 26, lineHeight: 1.8,
      wordBreak: 'break-word', color, fontFamily: '"Courier New", monospace', padding: '2px 0',
    };
    switch (block.type) {
      case 'heading1': return { ...base, fontSize: 22, letterSpacing: 1.5, fontWeight: 'bold', lineHeight: 1.3, marginBottom: 4 };
      case 'heading2': return { ...base, fontSize: 16, letterSpacing: 0.8, fontWeight: 'bold', lineHeight: 1.4, marginBottom: 2 };
      case 'heading3': return { ...base, fontSize: 12, letterSpacing: 0.5, color: `${color}bb`, fontWeight: 'bold' };
      case 'quote':    return { ...base, fontStyle: 'italic', color: `${color}cc`, paddingLeft: 12, borderLeft: `3px solid ${accent.amber}60` };
      default:         return base;
    }
  })();

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '2px 0', position: 'relative' }}>
      <button onMouseDown={e => { e.preventDefault(); onToggleTypeMenu(); }}
        title={`Block type: ${BLOCK_TYPE_NAMES[block.type]}`}
        style={{
          background: focused ? `${color}12` : 'transparent',
          border: `1px solid ${focused ? color + '45' : color + '15'}`,
          color: focused ? `${color}90` : `${color}30`,
          fontFamily: '"Courier New", monospace', fontSize: 8, padding: '3px 6px',
          cursor: 'pointer', flexShrink: 0, marginTop: 5, minWidth: 30, textAlign: 'center',
          borderRadius: 2, letterSpacing: 0.5,
        }}>
        {BLOCK_SHORT[block.type]}
      </button>
      {typeMenuOpen && (
        <BlockTypeMenu currentType={block.type} color={color}
          onSelect={t => { if (!isRich(t)) onChange(divRef.current?.textContent ?? ''); onCloseTypeMenu(); }}
          onClose={onCloseTypeMenu}
          onChange={updates => {}}
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
          style={{ background: 'transparent', border: `1px solid ${accent.red}30`, color: `${accent.red}60`,
            fontFamily: '"Courier New", monospace', fontSize: 10, padding: '2px 7px', cursor: 'pointer',
            flexShrink: 0, marginTop: 5, borderRadius: 2 }}>
          ✕
        </button>
      )}
    </div>
  );
}

// ─── BlockTypeMenu ────────────────────────────────────────────────────────────

function BlockTypeMenu({ currentType, color, onSelect, onClose, onChange }: {
  currentType: BlockType; color: string;
  onSelect: (t: BlockType) => void;
  onClose: () => void;
  onChange: (u: Partial<DocBlock>) => void;
}) {
  const sections = [
    { label: 'TEXT', types: ['paragraph', 'heading1', 'heading2', 'heading3'] as BlockType[] },
    { label: 'SPECIAL', types: ['quote', 'code', 'math', 'annotation', 'divider'] as BlockType[] },
  ];
  return (
    <div style={{ position: 'absolute', left: 40, top: 0, zIndex: 200, background: '#0a0a0a',
      border: `1px solid ${color}40`, minWidth: 180, boxShadow: `0 4px 16px rgba(0,0,0,0.8)` }}
      onMouseDown={e => e.stopPropagation()}>
      {sections.map(sec => (
        <div key={sec.label}>
          <div style={{ padding: '5px 10px 2px', fontSize: 8, color: `${color}40`, letterSpacing: 1, fontFamily: '"Courier New", monospace' }}>
            {sec.label}
          </div>
          {sec.types.map(t => (
            <button key={t}
              onMouseDown={e => { e.preventDefault(); onChange({ type: t }); onSelect(t); }}
              style={{
                background: currentType === t ? `${color}18` : 'transparent',
                border: 'none', borderBottom: `1px solid ${color}08`,
                color: currentType === t ? color : `${color}75`,
                fontFamily: '"Courier New", monospace', fontSize: 10,
                padding: '6px 12px', cursor: 'pointer', textAlign: 'left',
                display: 'flex', gap: 10, alignItems: 'center', width: '100%',
              }}>
              <span style={{ width: 22, fontSize: 9, color: currentType === t ? color : `${color}45`, flexShrink: 0, textAlign: 'center' }}>
                {BLOCK_SHORT[t]}
              </span>
              {BLOCK_TYPE_NAMES[t]}
            </button>
          ))}
        </div>
      ))}
      <button onMouseDown={e => { e.preventDefault(); onClose(); }}
        style={{ background: 'transparent', border: 'none', borderTop: `1px solid ${color}15`,
          color: `${color}35`, fontFamily: '"Courier New", monospace', fontSize: 9,
          padding: '5px 12px', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
        Cancel
      </button>
    </div>
  );
}

// ─── BlockRow ─────────────────────────────────────────────────────────────────

interface BlockRowProps {
  block: DocBlock;
  color: string;
  accent: { green: string; amber: string; red: string; cyan: string; purple: string; pink: string };
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

function BlockRow({ block, color, accent, focused, onFocus, onChange, onDelete, onNewBelow, onFocusPrev, blockRef, typeMenuOpen, onToggleTypeMenu, onCloseTypeMenu }: BlockRowProps) {
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  const setRef = (el: HTMLTextAreaElement | null) => {
    taRef.current = el;
    blockRef(el);
    if (el) autoResize(el);
  };
  useEffect(() => { autoResize(taRef.current); }, [block.content]);

  if (isRich(block.type)) {
    return (
      <RichBlock block={block} color={color} accent={accent} focused={focused}
        onFocus={onFocus}
        onChange={html => onChange({ content: html })}
        onDelete={onDelete} onNewBelow={onNewBelow} onFocusPrev={onFocusPrev}
        typeMenuOpen={typeMenuOpen} onToggleTypeMenu={onToggleTypeMenu} onCloseTypeMenu={onCloseTypeMenu}
      />
    );
  }

  if (block.type === 'divider') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', position: 'relative', cursor: 'pointer' }}
        onClick={onFocus}>
        <button onMouseDown={e => { e.preventDefault(); onToggleTypeMenu(); }}
          style={{ background: 'transparent', border: `1px solid ${color}20`, color: `${color}50`,
            fontFamily: '"Courier New", monospace', fontSize: 8, padding: '2px 5px', cursor: 'pointer', borderRadius: 2 }}>
          {BLOCK_SHORT[block.type]}
        </button>
        <div style={{ flex: 1, height: 1, background: `${color}25` }} />
        {focused && (
          <button onClick={onDelete}
            style={{ background: 'transparent', border: `1px solid ${accent.red}30`, color: `${accent.red}60`,
              fontFamily: '"Courier New", monospace', fontSize: 10, padding: '2px 7px', cursor: 'pointer', borderRadius: 2 }}>
            ✕
          </button>
        )}
        {typeMenuOpen && <BlockTypeMenu currentType={block.type} color={color} onSelect={() => {}} onClose={onCloseTypeMenu} onChange={u => onChange(u)} />}
      </div>
    );
  }

  const blockAccent = block.type === 'code' ? accent.green : block.type === 'math' ? accent.purple : block.type === 'annotation' ? accent.cyan : color;

  const textStyle: React.CSSProperties = (() => {
    const base: React.CSSProperties = {
      flex: 1, background: 'transparent', border: 'none', outline: 'none',
      color, fontFamily: '"Courier New", monospace', resize: 'none', overflow: 'hidden',
      padding: '2px 0', width: '100%', minHeight: 26, lineHeight: 1.8,
    };
    switch (block.type) {
      case 'code':       return { ...base, fontSize: 11, color: accent.green, background: `${accent.green}06`, padding: '10px 14px', lineHeight: 1.6, fontFamily: '"Courier New", monospace' };
      case 'math':       return { ...base, textAlign: 'center', color: accent.purple, letterSpacing: 1, fontSize: 13 };
      case 'annotation': return { ...base, fontSize: 11, color: `${accent.cyan}dd`, background: `${accent.cyan}08`, padding: '8px 12px', fontStyle: 'italic' };
      default:           return base;
    }
  })();

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '2px 0', position: 'relative' }}>
      <button onMouseDown={e => { e.preventDefault(); onToggleTypeMenu(); }}
        title={`Block type: ${BLOCK_TYPE_NAMES[block.type]}`}
        style={{
          background: focused ? `${blockAccent}12` : 'transparent',
          border: `1px solid ${focused ? blockAccent + '45' : color + '15'}`,
          color: focused ? `${blockAccent}90` : `${color}30`,
          fontFamily: '"Courier New", monospace', fontSize: 8, padding: '3px 6px',
          cursor: 'pointer', flexShrink: 0, marginTop: 5, minWidth: 30, textAlign: 'center', borderRadius: 2,
        }}>
        {BLOCK_SHORT[block.type]}
      </button>
      {typeMenuOpen && <BlockTypeMenu currentType={block.type} color={color} onSelect={() => onCloseTypeMenu()} onClose={onCloseTypeMenu} onChange={u => { onChange(u); onCloseTypeMenu(); }} />}

      <div style={{ flex: 1, minWidth: 0 }}>
        {block.type === 'code' && (
          <div style={{ fontSize: 9, color: `${accent.green}55`, fontFamily: '"Courier New", monospace',
            letterSpacing: 1, marginBottom: 3, display: 'flex', gap: 6, alignItems: 'center' }}>
            <span>LANG:</span>
            <input value={block.lang ?? ''} onChange={e => onChange({ lang: e.target.value })}
              placeholder="text" style={{ background: 'transparent', border: 'none', outline: 'none',
                color: accent.green, fontFamily: '"Courier New", monospace', fontSize: 9, width: 60 }} />
          </div>
        )}
        <textarea ref={setRef} value={block.content}
          onChange={e => onChange({ content: e.target.value })}
          onKeyDown={(e: KeyboardEvent<HTMLTextAreaElement>) => {
            if (e.key === 'Enter' && !e.shiftKey && block.type !== 'code') { e.preventDefault(); onNewBelow(); }
            if (e.key === 'Backspace' && block.content === '') { e.preventDefault(); onDelete(); onFocusPrev(); }
            if (e.key === 'Escape') onCloseTypeMenu();
          }}
          onFocus={onFocus} style={textStyle} rows={1}
          placeholder={`${BLOCK_TYPE_NAMES[block.type]}…`}
        />
        {block.type === 'annotation' && (
          <input value={block.citation ?? ''} onChange={e => onChange({ citation: e.target.value })}
            placeholder="Source / citation (optional)"
            style={{ display: 'block', background: 'transparent', border: 'none', outline: 'none',
              color: `${accent.cyan}45`, fontFamily: '"Courier New", monospace', fontSize: 9, marginTop: 2, width: '100%' }} />
        )}
      </div>

      {focused && (
        <button onClick={onDelete} title="Delete block"
          style={{ background: 'transparent', border: `1px solid ${accent.red}30`, color: `${accent.red}60`,
            fontFamily: '"Courier New", monospace', fontSize: 10, padding: '2px 7px', cursor: 'pointer',
            flexShrink: 0, marginTop: 5, borderRadius: 2 }}>
          ✕
        </button>
      )}
    </div>
  );
}

// ─── Find & Replace Panel ─────────────────────────────────────────────────────

function FindReplacePanel({ color, doc, onUpdateBlocks, onClose }: {
  color: string;
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

  const inp: React.CSSProperties = {
    background: 'transparent', border: `1px solid ${color}30`, outline: 'none',
    color, fontFamily: '"Courier New", monospace', fontSize: 10, padding: '4px 8px',
    width: 160,
  };
  const btn: React.CSSProperties = {
    background: 'transparent', border: `1px solid ${color}30`, color: `${color}80`,
    fontFamily: '"Courier New", monospace', fontSize: 9, padding: '4px 10px', cursor: 'pointer',
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px',
      borderBottom: `1px solid ${color}20`, background: `${color}05`, flexShrink: 0, flexWrap: 'wrap' }}>
      <span style={{ fontSize: 9, color: `${color}60`, letterSpacing: 1, fontFamily: '"Courier New", monospace' }}>FIND</span>
      <input value={find} onChange={e => setFind(e.target.value)} placeholder="Search text…" style={inp} autoFocus />
      <span style={{ fontSize: 9, color: `${color}60`, letterSpacing: 1, fontFamily: '"Courier New", monospace' }}>REPLACE</span>
      <input value={replace} onChange={e => setReplace(e.target.value)} placeholder="Replace with…" style={inp}
        onKeyDown={e => { if (e.key === 'Enter') doReplace(); }} />
      <button onClick={doReplace} style={{ ...btn, color, borderColor: `${color}50` }}>Replace All</button>
      <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, color: `${color}60`, cursor: 'pointer', fontFamily: '"Courier New", monospace' }}>
        <input type="checkbox" checked={caseSensitive} onChange={e => setCaseSensitive(e.target.checked)} style={{ cursor: 'pointer' }} />
        Case sensitive
      </label>
      {find.trim() && (
        <span style={{ fontSize: 9, color: matchCount > 0 ? `${color}70` : `${color}40`, fontFamily: '"Courier New", monospace' }}>
          {matchCount} match{matchCount !== 1 ? 'es' : ''}
        </span>
      )}
      <div style={{ flex: 1 }} />
      <button onClick={onClose} style={{ ...btn, fontSize: 10 }}>✕</button>
    </div>
  );
}

// ─── Formatting Toolbar ────────────────────────────────────────────────────────

function FormattingToolbar({ c, accent, showTemplates, onTemplate, onToggleTemplates }: {
  c: string;
  accent: { green: string; amber: string; cyan: string; purple: string; red: string; pink: string };
  showTemplates: boolean;
  onTemplate: (t: DocTemplate) => void;
  onToggleTemplates: () => void;
}) {
  const exec = (cmd: string, val?: string) => document.execCommand(cmd, false, val);

  const sep = <div style={{ width: 1, height: 14, background: `${c}18`, margin: '0 3px', flexShrink: 0 }} />;

  const fmtBtn = (label: string, cmd: string, val?: string, title?: string, style?: React.CSSProperties): React.ReactNode => (
    <button key={label}
      onMouseDown={e => { e.preventDefault(); exec(cmd, val); }}
      title={title ?? label}
      style={{
        background: 'transparent', border: `1px solid ${c}20`, color: `${c}75`,
        fontFamily: '"Courier New", monospace', fontSize: 11, padding: '2px 7px',
        cursor: 'pointer', lineHeight: 1, borderRadius: 2, ...style,
      }}>
      {label}
    </button>
  );

  const iconBtn = (content: string, onClick: () => void, title: string): React.ReactNode => (
    <button key={title}
      onMouseDown={e => { e.preventDefault(); onClick(); }}
      title={title}
      style={{
        background: 'transparent', border: `1px solid ${c}20`, color: `${c}75`,
        fontFamily: '"Courier New", monospace', fontSize: 12, padding: '2px 7px',
        cursor: 'pointer', lineHeight: 1, borderRadius: 2,
      }}>
      {content}
    </button>
  );

  const colorDots = [
    { label: 'White',  val: '#e8e8e8' },
    { label: 'Green',  val: accent.green },
    { label: 'Amber',  val: accent.amber },
    { label: 'Cyan',   val: accent.cyan },
    { label: 'Purple', val: accent.purple },
    { label: 'Red',    val: accent.red },
    { label: 'Pink',   val: accent.pink },
  ];

  const fontSizes = [['XS', '1'], ['S', '2'], ['M', '3'], ['L', '4'], ['XL', '5'], ['2X', '6']];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '4px 12px',
      borderBottom: `1px solid ${c}12`, background: `${c}02`, flexShrink: 0, flexWrap: 'wrap', position: 'relative' }}>

      {/* Text style */}
      {fmtBtn('B', 'bold', undefined, 'Bold (Ctrl+B)', { fontWeight: 'bold' })}
      {fmtBtn('I', 'italic', undefined, 'Italic (Ctrl+I)', { fontStyle: 'italic' })}
      {fmtBtn('U', 'underline', undefined, 'Underline (Ctrl+U)', { textDecoration: 'underline' })}
      {fmtBtn('S̶', 'strikeThrough', undefined, 'Strikethrough')}

      {sep}

      {/* Alignment */}
      {iconBtn('≡', () => exec('justifyLeft'), 'Align Left')}
      {iconBtn('≡', () => exec('justifyCenter'), 'Center')}
      {iconBtn('≡', () => exec('justifyRight'), 'Align Right')}
      {iconBtn('≡', () => exec('justifyFull'), 'Justify')}

      {sep}

      {/* Lists & Indent */}
      {iconBtn('• —', () => exec('insertUnorderedList'), 'Bullet List')}
      {iconBtn('1. —', () => exec('insertOrderedList'), 'Numbered List')}
      {iconBtn('→', () => exec('indent'), 'Indent')}
      {iconBtn('←', () => exec('outdent'), 'Outdent')}

      {sep}

      {/* Font size */}
      {fontSizes.map(([label, sz]) => (
        <button key={label}
          onMouseDown={e => { e.preventDefault(); exec('fontSize', sz); }}
          title={`Font size: ${label}`}
          style={{
            background: 'transparent', border: `1px solid ${c}15`, color: `${c}60`,
            fontFamily: '"Courier New", monospace', fontSize: 8, padding: '2px 5px',
            cursor: 'pointer', lineHeight: 1, borderRadius: 2,
          }}>
          {label}
        </button>
      ))}

      {sep}

      {/* Color palette */}
      {colorDots.map(col => (
        <button key={col.label}
          onMouseDown={e => { e.preventDefault(); exec('foreColor', col.val); }}
          title={`Text: ${col.label}`}
          style={{ width: 13, height: 13, background: col.val, border: `1px solid ${c}25`,
            cursor: 'pointer', borderRadius: 2, padding: 0, flexShrink: 0 }}
        />
      ))}

      {sep}

      {/* Highlight */}
      {[accent.amber, accent.cyan, accent.green].map(hc => (
        <button key={hc}
          onMouseDown={e => { e.preventDefault(); exec('hiliteColor', hc + '44'); }}
          title="Highlight"
          style={{ width: 13, height: 13, background: `${hc}55`, border: `1px solid ${hc}60`,
            cursor: 'pointer', borderRadius: 2, padding: 0, flexShrink: 0 }}
        />
      ))}

      {sep}

      {/* Clear formatting */}
      {fmtBtn('CLR', 'removeFormat', undefined, 'Remove formatting', { fontSize: 8, color: `${c}50` })}

      <div style={{ flex: 1 }} />

      {/* Templates */}
      <button onMouseDown={e => { e.preventDefault(); onToggleTemplates(); }}
        style={{
          background: showTemplates ? `${accent.amber}18` : 'transparent',
          border: `1px solid ${showTemplates ? accent.amber + '60' : c + '20'}`,
          color: showTemplates ? accent.amber : `${c}60`,
          fontFamily: '"Courier New", monospace', fontSize: 8, padding: '3px 9px',
          cursor: 'pointer', letterSpacing: 0.5, borderRadius: 2,
        }}>
        TEMPLATES
      </button>

      {showTemplates && (
        <div style={{ position: 'absolute', top: '100%', right: 10, zIndex: 300,
          background: '#0a0a0a', border: `1px solid ${c}40`, minWidth: 220,
          boxShadow: `0 6px 20px rgba(0,0,0,0.9)` }}>
          <div style={{ padding: '6px 12px 3px', fontSize: 8, color: `${c}40`, letterSpacing: 1, fontFamily: '"Courier New", monospace' }}>
            SELECT TEMPLATE
          </div>
          {TEMPLATES.map(t => (
            <button key={t.name} onMouseDown={e => { e.preventDefault(); onTemplate(t); }}
              style={{ display: 'block', width: '100%', textAlign: 'left', background: 'transparent',
                border: 'none', borderBottom: `1px solid ${c}08`, color: `${c}90`,
                fontFamily: '"Courier New", monospace', fontSize: 10, padding: '8px 14px', cursor: 'pointer' }}>
              <div style={{ color: c, marginBottom: 2 }}>{t.name}</div>
              <div style={{ fontSize: 9, color: `${c}40` }}>{t.subject} · {t.tags.join(', ')}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── File sidebar ─────────────────────────────────────────────────────────────

function FileSidebar({ color, accent, currentPath, onOpen, onNew }: {
  color: string;
  accent: { red: string };
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
    <div style={{ width: 176, flexShrink: 0, borderRight: `1px solid ${color}15`,
      display: 'flex', flexDirection: 'column', overflow: 'hidden', background: `${color}02` }}>
      <div style={{ padding: '10px 10px 6px', borderBottom: `1px solid ${color}12` }}>
        <div style={{ fontSize: 8, color: `${color}40`, fontFamily: '"Courier New", monospace', letterSpacing: 1.5, marginBottom: 6 }}>
          DOCUMENTS
        </div>
        <button onClick={onNew} style={{
          width: '100%', background: `${color}10`, border: `1px solid ${color}35`,
          color, fontFamily: '"Courier New", monospace', fontSize: 10, padding: '5px 0',
          cursor: 'pointer', letterSpacing: 0.5, borderRadius: 2,
        }}>
          + New Document
        </button>
      </div>

      <div style={{ padding: '6px 8px', borderBottom: `1px solid ${color}08` }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search documents…"
          style={{ width: '100%', background: 'transparent', border: `1px solid ${color}20`, outline: 'none',
            color, fontFamily: '"Courier New", monospace', fontSize: 9, padding: '4px 8px',
            boxSizing: 'border-box', borderRadius: 2 }} />
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filtered.length === 0 && (
          <div style={{ padding: 16, fontSize: 10, color: `${color}30`, fontFamily: '"Courier New", monospace', textAlign: 'center' }}>
            {search ? 'No matches.' : 'No documents yet.'}
          </div>
        )}
        {filtered.map(doc => (
          <div key={doc.path} style={{ position: 'relative' }}>
            <button onClick={() => onOpen(doc.path)}
              style={{
                width: '100%', textAlign: 'left',
                background: currentPath === doc.path ? `${color}12` : 'transparent',
                border: 'none', borderBottom: `1px solid ${color}07`,
                borderLeft: `2px solid ${currentPath === doc.path ? color : 'transparent'}`,
                color: currentPath === doc.path ? color : `${color}65`,
                fontFamily: '"Courier New", monospace', fontSize: 10,
                padding: '8px 10px 8px 10px', cursor: 'pointer',
              }}>
              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 18 }}>
                {doc.name}
              </div>
              {doc.preview && (
                <div style={{ fontSize: 8, color: `${color}30`, marginTop: 2,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {doc.preview}
                </div>
              )}
            </button>
            {/* Delete button */}
            <button
              onClick={e => { e.stopPropagation(); handleDelete(doc.path); }}
              title={confirmDelete === doc.path ? 'Click again to confirm delete' : 'Delete document'}
              style={{
                position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)',
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: confirmDelete === doc.path ? accent.red : `${color}20`,
                fontSize: 10, padding: '2px 4px', fontFamily: '"Courier New", monospace',
              }}>
              {confirmDelete === doc.path ? '?' : '✕'}
            </button>
          </div>
        ))}
      </div>

      <div style={{ padding: '6px 10px', borderTop: `1px solid ${color}12`, fontSize: 8,
        color: `${color}28`, fontFamily: '"Courier New", monospace' }}>
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
  const accent = accentColors;

  const [doc, setDoc] = useState<AcademyDoc>(() => { academyDocs.seedDefaults(); return newDoc(); });
  const [currentPath, setCurrentPath] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [typeMenuId, setTypeMenuId] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showFind, setShowFind] = useState(false);
  const [insertMenuOpen, setInsertMenuOpen] = useState(false);

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
    const text = docToPlainText(doc);
    navigator.clipboard.writeText(text).catch(() => {});
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
    win.document.write(`<pre style="font-family:monospace;font-size:12pt;line-height:1.7;padding:40px;max-width:680px;margin:0 auto;">${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`);
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
  const statusColor = saveStatus === 'saved' ? accentColors.green : saveStatus === 'saving' ? accentColors.amber : `${c}55`;
  const statusText  = saveStatus === 'saved' ? 'Saved' : saveStatus === 'saving' ? 'Saving…' : 'Unsaved';

  const toolBtn = (label: string, onClick: () => void, title?: string, active?: boolean): React.ReactNode => (
    <button key={label} onClick={onClick} title={title ?? label}
      style={{
        background: active ? `${c}15` : 'transparent',
        border: `1px solid ${active ? c + '50' : c + '22'}`,
        color: active ? c : `${c}75`,
        fontFamily: '"Courier New", monospace', fontSize: 9, padding: '3px 10px',
        cursor: 'pointer', letterSpacing: 0.5, borderRadius: 2,
      }}>
      {label}
    </button>
  );

  const toolSep = <div style={{ width: 1, height: 16, background: `${c}15`, margin: '0 3px', flexShrink: 0 }} />;

  return (
    <div
      style={{ display: 'flex', height: '100%', background: '#050505', color: c, fontFamily: '"Courier New", monospace', overflow: 'hidden' }}
      onClick={() => { setTypeMenuId(null); setShowTemplates(false); setInsertMenuOpen(false); }}>

      <FileSidebar color={c} accent={{ red: accentColors.red }} currentPath={currentPath} onOpen={openDoc} onNew={createNew} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* ── File + Edit toolbar ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px',
          borderBottom: `1px solid ${c}15`, background: `${c}03`, flexShrink: 0, flexWrap: 'wrap' }}>

          {toolBtn('Save', saveNow, 'Save document (Ctrl+S)')}
          {toolBtn('New', createNew, 'New document')}
          {toolSep}
          {toolBtn('Undo', undo, 'Undo (Ctrl+Z)')}
          {toolBtn('Redo', redo, 'Redo (Ctrl+Y)')}
          {toolSep}
          {toolBtn('Find', () => setShowFind(s => !s), 'Find & Replace (Ctrl+F)', showFind)}
          {toolSep}

          {/* Insert block type buttons */}
          {([
            ['H1', 'heading1'], ['H2', 'heading2'], ['H3', 'heading3'],
            ['<>', 'code'], ['"', 'quote'], ['Σ', 'math'], ['†', 'annotation'], ['—', 'divider'],
          ] as [string, BlockType][]).map(([label, type]) => (
            <button key={type}
              onClick={() => { if (focusedId) addBlock(focusedId, type); else addBlockAtEnd(type); }}
              title={`Insert ${BLOCK_TYPE_NAMES[type]}`}
              style={{
                background: 'transparent', border: `1px solid ${c}18`, color: `${c}55`,
                fontFamily: '"Courier New", monospace', fontSize: 9, padding: '2px 7px',
                cursor: 'pointer', letterSpacing: 0.3, borderRadius: 2,
              }}>
              {label}
            </button>
          ))}

          <div style={{ flex: 1 }} />

          {toolBtn('Copy Text', exportText, 'Copy document as plain text')}
          {toolBtn('Download', downloadTxt, 'Download as .txt file')}
          {toolBtn('Print', printDoc, 'Print document (Ctrl+P)')}

          {currentPath && (
            <span style={{ fontSize: 8, color: `${c}28`, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginLeft: 4 }}>
              {currentPath.replace('/home/student', '~')}
            </span>
          )}
        </div>

        {/* ── Rich text formatting toolbar ── */}
        <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
          <FormattingToolbar c={c} accent={accent}
            showTemplates={showTemplates}
            onTemplate={applyTemplate}
            onToggleTemplates={() => setShowTemplates(s => !s)}
          />
        </div>

        {/* ── Find & Replace ── */}
        {showFind && (
          <FindReplacePanel color={c} doc={doc}
            onUpdateBlocks={blocks => {
              const updated = { ...doc, blocks };
              pushHistory(blocks);
              setDoc(updated);
              queueSave(updated, currentPath);
            }}
            onClose={() => setShowFind(false)}
          />
        )}

        {/* ── Document canvas ── */}
        <div style={{ flex: 1, overflowY: 'auto', background: `${c}04`, padding: '28px 24px' }}>
          {/* Paper */}
          <div style={{
            maxWidth: 720, margin: '0 auto',
            background: '#0b0b0b',
            border: `1px solid ${c}12`,
            boxShadow: `0 2px 20px rgba(0,0,0,0.6)`,
            padding: '40px 52px 52px',
            minHeight: 700,
          }}>

            {/* Title */}
            <input
              value={doc.title}
              onChange={e => { const d = { ...doc, title: e.target.value }; setDoc(d); queueSave(d, currentPath); }}
              placeholder="Document Title"
              style={{
                display: 'block', width: '100%', background: 'transparent', border: 'none',
                borderBottom: `1px solid ${c}18`, outline: 'none', color: c,
                fontFamily: '"Courier New", monospace', fontSize: 22, fontWeight: 'bold',
                letterSpacing: 1.5, padding: '2px 0 10px', marginBottom: 20,
                boxSizing: 'border-box',
              }}
            />

            {/* Metadata row */}
            <div style={{ display: 'flex', gap: 20, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 9, color: `${c}40`, letterSpacing: 1 }}>SUBJECT</span>
                <input value={doc.subject}
                  onChange={e => { const d = { ...doc, subject: e.target.value }; setDoc(d); queueSave(d, currentPath); }}
                  placeholder="—"
                  style={{ background: 'transparent', border: 'none', borderBottom: `1px solid ${c}15`,
                    outline: 'none', color: `${c}90`, fontFamily: '"Courier New", monospace', fontSize: 10, width: 110 }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 9, color: `${c}40`, letterSpacing: 1 }}>TAGS</span>
                <input value={Array.isArray(doc.tags) ? doc.tags.join(', ') : (doc.tags as string)}
                  onChange={e => { const d = { ...doc, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) }; setDoc(d); queueSave(d, currentPath); }}
                  placeholder="comma, separated"
                  style={{ background: 'transparent', border: 'none', borderBottom: `1px solid ${c}15`,
                    outline: 'none', color: `${c}90`, fontFamily: '"Courier New", monospace', fontSize: 10, width: 160 }} />
              </div>
            </div>

            <div style={{ borderTop: `1px solid ${c}10`, paddingTop: 16 }}>
              {doc.blocks.map(block => (
                <BlockRow
                  key={block.id} block={block} color={c} accent={accentColors}
                  focused={focusedId === block.id}
                  onFocus={() => setFocusedId(block.id)}
                  onChange={updates => updateBlock(block.id, updates)}
                  onDelete={() => deleteBlock(block.id)}
                  onNewBelow={() => addBlock(block.id)}
                  onFocusPrev={() => focusPrev(block.id)}
                  blockRef={el => { if (el) blockRefs.current.set(block.id, el); else blockRefs.current.delete(block.id); }}
                  typeMenuOpen={typeMenuId === block.id}
                  onToggleTypeMenu={() => setTypeMenuId(typeMenuId === block.id ? null : block.id)}
                  onCloseTypeMenu={() => setTypeMenuId(null)}
                />
              ))}
            </div>

            {/* Add block button */}
            <button
              onClick={() => addBlockAtEnd()}
              style={{ marginTop: 20, background: 'transparent', border: `1px dashed ${c}15`,
                color: `${c}25`, fontFamily: '"Courier New", monospace', fontSize: 10,
                padding: '10px 0', cursor: 'pointer', width: '100%', letterSpacing: 1, borderRadius: 2 }}>
              + Add Block
            </button>
          </div>
        </div>

        {/* ── Status bar ── */}
        <div style={{
          padding: '5px 16px', borderTop: `1px solid ${c}15`, background: `${c}03`,
          fontSize: 9, color: `${c}38`, display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', flexShrink: 0, flexWrap: 'wrap', gap: 10,
          fontFamily: '"Courier New", monospace',
        }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <span>{doc.blocks.length} block{doc.blocks.length !== 1 ? 's' : ''}</span>
            <span style={{ color: `${c}50` }}>{wordCount.toLocaleString()} words</span>
            <span>{charCount.toLocaleString()} chars</span>
            <span style={{ color: `${c}28` }}>{estimateReadingTime(wordCount)}</span>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {currentPath && (
              <span style={{ color: `${c}25`, fontSize: 8, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentPath.replace('/home/student', '~')}
              </span>
            )}
            <span style={{ color: statusColor, letterSpacing: 0.5 }}>{statusText}</span>
          </div>
        </div>
      </div>

      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: ${c}25;
          pointer-events: none;
        }
        [contenteditable] b, [contenteditable] strong { font-weight: bold; }
        [contenteditable] i, [contenteditable] em { font-style: italic; }
        [contenteditable] u { text-decoration: underline; }
        [contenteditable] s, [contenteditable] strike { text-decoration: line-through; }
        [contenteditable] ul { padding-left: 20px; margin: 4px 0; }
        [contenteditable] ol { padding-left: 20px; margin: 4px 0; }
        [contenteditable] li { margin: 2px 0; line-height: 1.8; }
      `}</style>
    </div>
  );
}
