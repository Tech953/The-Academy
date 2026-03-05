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

const RICH_TYPES: BlockType[] = ['paragraph', 'heading1', 'heading2', 'heading3', 'quote'];

function isRich(type: BlockType) { return RICH_TYPES.includes(type); }

// ─── Templates ────────────────────────────────────────────────────────────────

interface DocTemplate { name: string; subject: string; tags: string[]; blocks: Omit<DocBlock, 'id'>[] }

function applyTemplate(t: DocTemplate, createBlock: (type: BlockType, content?: string) => DocBlock): DocBlock[] {
  return t.blocks.map(b => ({ ...createBlock(b.type, b.content), lang: b.lang, citation: b.citation }));
}

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
];

// ─── ContentEditable block ─────────────────────────────────────────────────────

interface RichBlockProps {
  block: DocBlock;
  color: string;
  accentColors: { green: string; amber: string; cyan: string; purple: string; red: string; pink: string };
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

function RichBlock({
  block, color, accentColors, focused,
  onFocus, onChange, onDelete, onNewBelow, onFocusPrev,
  typeMenuOpen, onToggleTypeMenu, onCloseTypeMenu,
}: RichBlockProps) {
  const divRef = useRef<HTMLDivElement | null>(null);
  const lastContent = useRef(block.content);

  useEffect(() => {
    const el = divRef.current;
    if (!el) return;
    if (el.innerHTML !== block.content && block.content !== lastContent.current) {
      el.innerHTML = block.content;
      lastContent.current = block.content;
    }
  }, [block.content]);

  const textStyle: React.CSSProperties = (() => {
    const base: React.CSSProperties = {
      flex: 1, outline: 'none', minHeight: 24, lineHeight: 1.7, wordBreak: 'break-word',
      color, fontFamily: 'Courier New, monospace', padding: '2px 0',
    };
    switch (block.type) {
      case 'heading1': return { ...base, fontSize: 20, letterSpacing: 2, fontWeight: 'bold', textTransform: 'uppercase', lineHeight: 1.4 };
      case 'heading2': return { ...base, fontSize: 15, letterSpacing: 1, fontWeight: 'bold', lineHeight: 1.5 };
      case 'heading3': return { ...base, fontSize: 12, letterSpacing: 0.5, color: `${color}cc` };
      case 'quote':    return { ...base, fontStyle: 'italic', color: `${color}cc`, paddingLeft: 8, borderLeft: `2px solid ${accentColors.amber}50` };
      default:         return base;
    }
  })();

  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start', padding: '3px 0', position: 'relative' }}>
      <button
        onMouseDown={(e) => { e.preventDefault(); onToggleTypeMenu(); }}
        title={`Block type: ${BLOCK_TYPE_NAMES[block.type]}`}
        style={{
          background: focused ? `${color}15` : 'transparent',
          border: `1px solid ${focused ? color + '50' : color + '20'}`,
          color: focused ? color : `${color}40`,
          fontFamily: 'Courier New, monospace', fontSize: 8, padding: '2px 5px', cursor: 'pointer',
          letterSpacing: 0.5, flexShrink: 0, marginTop: 4, minWidth: 28, textAlign: 'center',
        }}>
        {BLOCK_LABELS[block.type]}
      </button>
      {typeMenuOpen && (
        <TypeMenu currentType={block.type} color={color}
          onChange={(u) => { onCloseTypeMenu(); }}
          onClose={onCloseTypeMenu}
          onChangeType={(t) => {
            if (!isRich(t)) { onChange(divRef.current?.textContent ?? ''); }
            onCloseTypeMenu();
          }}
        />
      )}
      <div
        ref={divRef}
        contentEditable
        suppressContentEditableWarning
        style={textStyle}
        onFocus={onFocus}
        onInput={(e) => {
          const html = (e.currentTarget as HTMLDivElement).innerHTML;
          lastContent.current = html;
          onChange(html);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onNewBelow(); }
          if (e.key === 'Backspace' && (divRef.current?.textContent ?? '') === '') { e.preventDefault(); onDelete(); onFocusPrev(); }
          if (e.key === 'Escape') onCloseTypeMenu();
        }}
        data-placeholder={`${BLOCK_TYPE_NAMES[block.type]}…`}
      />
      {focused && (
        <button onClick={onDelete}
          title="Delete block"
          style={{ background: 'transparent', border: `1px solid ${accentColors.red}30`, color: `${accentColors.red}70`,
            fontFamily: 'Courier New, monospace', fontSize: 9, padding: '2px 6px', cursor: 'pointer',
            flexShrink: 0, marginTop: 4 }}>
          ×
        </button>
      )}
    </div>
  );
}

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
  richDivRef?: (el: HTMLDivElement | null) => void;
}

function BlockRow({
  block, color, accentColors, focused,
  onFocus, onChange, onDelete, onNewBelow, onFocusPrev,
  blockRef, typeMenuOpen, onToggleTypeMenu, onCloseTypeMenu, richDivRef,
}: BlockRowProps) {
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  const setRef = (el: HTMLTextAreaElement | null) => {
    taRef.current = el;
    blockRef(el);
    if (el) autoResize(el);
  };

  useEffect(() => { autoResize(taRef.current); }, [block.content]);

  if (isRich(block.type)) {
    return (
      <RichBlock
        block={block} color={color} accentColors={accentColors} focused={focused}
        onFocus={onFocus}
        onChange={(html) => onChange({ content: html })}
        onDelete={onDelete}
        onNewBelow={onNewBelow}
        onFocusPrev={onFocusPrev}
        typeMenuOpen={typeMenuOpen}
        onToggleTypeMenu={onToggleTypeMenu}
        onCloseTypeMenu={onCloseTypeMenu}
      />
    );
  }

  const blockAccent = (() => {
    switch (block.type) {
      case 'code':        return accentColors.green;
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
      case 'code':       return { ...base, fontSize: 11, color: accentColors.green, background: `${accentColors.green}08`, padding: '8px 10px', lineHeight: 1.6 };
      case 'math':       return { ...base, textAlign: 'center', color: accentColors.purple, letterSpacing: 1 };
      case 'annotation': return { ...base, fontSize: 11, color: `${accentColors.cyan}dd`, background: `${accentColors.cyan}0a`, padding: '6px 10px' };
      default:           return base;
    }
  })();

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && block.type !== 'code') { e.preventDefault(); onNewBelow(); }
    if (e.key === 'Backspace' && block.content === '') { e.preventDefault(); onDelete(); onFocusPrev(); }
    if (e.key === 'Escape') onCloseTypeMenu();
  };

  if (block.type === 'divider') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', position: 'relative' }}
        onClick={onFocus}>
        <button onMouseDown={(e) => { e.preventDefault(); onToggleTypeMenu(); }}
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
        {typeMenuOpen && <TypeMenu currentType={block.type} color={color} onChange={() => {}} onClose={onCloseTypeMenu} />}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start', padding: '3px 0', position: 'relative' }}>
      <button
        onMouseDown={(e) => { e.preventDefault(); onToggleTypeMenu(); }}
        title={`Block type: ${BLOCK_TYPE_NAMES[block.type]}`}
        style={{
          background: focused ? `${blockAccent}15` : 'transparent',
          border: `1px solid ${focused ? blockAccent + '50' : color + '20'}`,
          color: focused ? blockAccent : `${color}40`,
          fontFamily: 'Courier New, monospace', fontSize: 8, padding: '2px 5px', cursor: 'pointer',
          letterSpacing: 0.5, flexShrink: 0, marginTop: 4, minWidth: 28, textAlign: 'center',
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
            flexShrink: 0, marginTop: 4 }}>
          ×
        </button>
      )}
    </div>
  );
}

function TypeMenu({ currentType, color, onChange, onClose, onChangeType }: {
  currentType: BlockType; color: string;
  onChange: (u: Partial<DocBlock>) => void;
  onClose: () => void;
  onChangeType?: (t: BlockType) => void;
}) {
  return (
    <div style={{
      position: 'absolute', left: 36, top: 0, zIndex: 100,
      background: '#000', border: `1px solid ${color}50`,
      display: 'flex', flexDirection: 'column', minWidth: 140,
    }}>
      {BLOCK_TYPES.map(t => (
        <button key={t}
          onMouseDown={(e) => {
            e.preventDefault();
            onChange({ type: t });
            if (onChangeType) onChangeType(t);
          }}
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
      <button onMouseDown={(e) => { e.preventDefault(); onClose(); }}
        style={{ background: 'transparent', border: 'none', color: `${color}40`,
          fontFamily: 'Courier New, monospace', fontSize: 9, padding: '4px 10px', cursor: 'pointer', textAlign: 'left' }}>
        CANCEL
      </button>
    </div>
  );
}

// ─── Formatting Toolbar ────────────────────────────────────────────────────────

function FormattingToolbar({ c, accentColors, showTemplates, onTemplate, onToggleTemplates }: {
  c: string;
  accentColors: { green: string; amber: string; cyan: string; purple: string; red: string; pink: string };
  showTemplates: boolean;
  onTemplate: (t: DocTemplate) => void;
  onToggleTemplates: () => void;
}) {
  const execFmt = (cmd: string, val?: string) => {
    document.execCommand(cmd, false, val);
  };

  const btnStyle: React.CSSProperties = {
    background: 'transparent',
    border: `1px solid ${c}25`,
    color: `${c}80`,
    fontFamily: '"Courier New", monospace',
    fontSize: 10,
    padding: '2px 7px',
    cursor: 'pointer',
    letterSpacing: 0.5,
    lineHeight: 1,
  };

  const colors = [
    { label: 'White', val: '#e8e8e8' },
    { label: 'Green', val: accentColors.green },
    { label: 'Amber', val: accentColors.amber },
    { label: 'Cyan',  val: accentColors.cyan },
    { label: 'Purple',val: accentColors.purple },
    { label: 'Red',   val: accentColors.red },
  ];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px',
      borderBottom: `1px solid ${c}15`, background: `${c}02`, flexShrink: 0, flexWrap: 'wrap' }}>
      {/* Bold / Italic / Underline / Strikethrough */}
      <button onMouseDown={(e) => { e.preventDefault(); execFmt('bold'); }} style={{ ...btnStyle, fontWeight: 'bold', fontSize: 11 }} title="Bold (Ctrl+B)"><b>B</b></button>
      <button onMouseDown={(e) => { e.preventDefault(); execFmt('italic'); }} style={{ ...btnStyle, fontStyle: 'italic', fontSize: 11 }} title="Italic (Ctrl+I)"><i>I</i></button>
      <button onMouseDown={(e) => { e.preventDefault(); execFmt('underline'); }} style={{ ...btnStyle, textDecoration: 'underline', fontSize: 11 }} title="Underline (Ctrl+U)"><u>U</u></button>
      <button onMouseDown={(e) => { e.preventDefault(); execFmt('strikeThrough'); }} style={{ ...btnStyle, textDecoration: 'line-through', fontSize: 11 }} title="Strikethrough">S̶</button>

      <div style={{ width: 1, height: 12, background: `${c}20`, margin: '0 2px' }} />

      {/* Alignment */}
      <button onMouseDown={(e) => { e.preventDefault(); execFmt('justifyLeft'); }} style={btnStyle} title="Align Left">⬅</button>
      <button onMouseDown={(e) => { e.preventDefault(); execFmt('justifyCenter'); }} style={btnStyle} title="Center">⬌</button>
      <button onMouseDown={(e) => { e.preventDefault(); execFmt('justifyRight'); }} style={btnStyle} title="Align Right">➡</button>

      <div style={{ width: 1, height: 12, background: `${c}20`, margin: '0 2px' }} />

      {/* Font size */}
      {([['Sm','1'],['Md','3'],['Lg','5'],['XL','6']] as [string,string][]).map(([label, sz]) => (
        <button key={label}
          onMouseDown={(e) => { e.preventDefault(); execFmt('fontSize', sz); }}
          style={{ ...btnStyle, fontSize: 9 }}
          title={`Font size ${label}`}>
          {label}
        </button>
      ))}

      <div style={{ width: 1, height: 12, background: `${c}20`, margin: '0 2px' }} />

      {/* Text color dots */}
      {colors.map(col => (
        <button
          key={col.label}
          onMouseDown={(e) => { e.preventDefault(); execFmt('foreColor', col.val); }}
          title={col.label}
          style={{ width: 14, height: 14, background: col.val, border: `1px solid ${c}30`,
            cursor: 'pointer', borderRadius: 2, padding: 0, flexShrink: 0 }}
        />
      ))}

      <div style={{ width: 1, height: 12, background: `${c}20`, margin: '0 2px' }} />

      {/* Remove formatting */}
      <button onMouseDown={(e) => { e.preventDefault(); execFmt('removeFormat'); }} style={{ ...btnStyle, fontSize: 8 }} title="Remove formatting">CLR</button>

      <div style={{ flex: 1 }} />

      {/* Templates */}
      <button
        onMouseDown={(e) => { e.preventDefault(); onToggleTemplates(); }}
        style={{ ...btnStyle, color: showTemplates ? accentColors.amber : `${c}60`,
          border: `1px solid ${showTemplates ? accentColors.amber + '60' : c + '25'}`, fontSize: 8 }}>
        TEMPLATE
      </button>

      {showTemplates && (
        <div style={{ position: 'absolute', top: '100%', right: 10, zIndex: 200, background: '#000',
          border: `1px solid ${c}40`, minWidth: 180 }}>
          {TEMPLATES.map(t => (
            <button key={t.name}
              onMouseDown={(e) => { e.preventDefault(); onTemplate(t); }}
              style={{ display: 'block', width: '100%', textAlign: 'left', background: 'transparent',
                border: 'none', borderBottom: `1px solid ${c}10`, color: `${c}90`,
                fontFamily: '"Courier New", monospace', fontSize: 10, padding: '7px 12px', cursor: 'pointer' }}>
              <div style={{ color: c }}>{t.name}</div>
              <div style={{ fontSize: 8, color: `${c}45`, marginTop: 1 }}>{t.subject} · {t.tags}</div>
            </button>
          ))}
        </div>
      )}
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

  const [doc, setDoc] = useState<AcademyDoc>(() => { academyDocs.seedDefaults(); return newDoc(); });
  const [currentPath, setCurrentPath] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [typeMenuId, setTypeMenuId] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);

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

  const saveTimer = useRef<ReturnType<typeof setTimeout>>();
  const doSave = useCallback((docToSave: AcademyDoc, path: string | null) => {
    setSaveStatus('saving');
    setTimeout(() => {
      const result = academyDocs.save(docToSave, path ?? undefined);
      if (result.success) {
        setCurrentPath(result.path);
        setSaveStatus('saved');
      } else {
        setSaveStatus('unsaved');
      }
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

  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 's') { e.preventDefault(); saveNow(); }
        if (e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
        if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) { e.preventDefault(); redo(); }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [saveNow, undo, redo]);

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
      onClick={() => { setTypeMenuId(null); setShowTemplates(false); }}>

      <FileSidebar color={c} currentPath={currentPath} onOpen={openDoc} onNew={createNew} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* File toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
          borderBottom: `1px solid ${c}20`, background: `${c}04`, flexShrink: 0, flexWrap: 'wrap' }}>
          <button onClick={saveNow} style={{ ...toolBtnStyle, color: accentColors.green, borderColor: `${accentColors.green}50` }}>SAVE</button>
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
          <button onClick={exportText} title="Copy as plain text" style={{ ...toolBtnStyle, fontSize: 8 }}>COPY TEXT</button>
          {currentPath && (
            <span style={{ fontSize: 8, color: `${c}35`, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentPath.replace('/home/student', '~')}
            </span>
          )}
        </div>

        {/* Rich text formatting toolbar */}
        <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
          <FormattingToolbar
            c={c} accentColors={accentColors}
            showTemplates={showTemplates}
            onTemplate={applyTemplate}
            onToggleTemplates={() => setShowTemplates(s => !s)}
          />
        </div>

        {/* Document area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px' }}>
          <div style={{ maxWidth: 680 }}>

            <input
              value={doc.title}
              onChange={e => { const d = { ...doc, title: e.target.value }; setDoc(d); queueSave(d, currentPath); }}
              placeholder="Document Title"
              style={{
                display: 'block', width: '100%', background: 'transparent', border: 'none',
                borderBottom: `1px solid ${c}20`, outline: 'none', color: c,
                fontFamily: 'Courier New, monospace', fontSize: 18, fontWeight: 'bold',
                letterSpacing: 2, padding: '4px 0 8px', marginBottom: 16, textTransform: 'uppercase',
              }}
            />

            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: `${c}50` }}>
                <span>SUBJECT:</span>
                <input value={doc.subject} onChange={e => { const d = { ...doc, subject: e.target.value }; setDoc(d); queueSave(d, currentPath); }}
                  placeholder="—"
                  style={{ background: 'transparent', border: 'none', borderBottom: `1px solid ${c}15`, outline: 'none',
                    color: c, fontFamily: 'Courier New, monospace', fontSize: 10, width: 100 }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: `${c}50` }}>
                <span>TAGS:</span>
                <input value={Array.isArray(doc.tags) ? doc.tags.join(', ') : (doc.tags as string)}
                  onChange={e => { const d = { ...doc, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) }; setDoc(d); queueSave(d, currentPath); }}
                  placeholder="comma, separated"
                  style={{ background: 'transparent', border: 'none', borderBottom: `1px solid ${c}15`, outline: 'none',
                    color: c, fontFamily: 'Courier New, monospace', fontSize: 10, width: 140 }} />
              </div>
            </div>

            <div style={{ borderTop: `1px solid ${c}10`, paddingTop: 12 }}>
              {doc.blocks.map((block) => (
                <BlockRow
                  key={block.id}
                  block={block}
                  color={c}
                  accentColors={accentColors}
                  focused={focusedId === block.id}
                  onFocus={() => setFocusedId(block.id)}
                  onChange={(updates) => updateBlock(block.id, updates)}
                  onDelete={() => deleteBlock(block.id)}
                  onNewBelow={() => addBlock(block.id)}
                  onFocusPrev={() => focusPrev(block.id)}
                  blockRef={(el) => {
                    if (el) blockRefs.current.set(block.id, el);
                    else blockRefs.current.delete(block.id);
                  }}
                  typeMenuOpen={typeMenuId === block.id}
                  onToggleTypeMenu={() => setTypeMenuId(typeMenuId === block.id ? null : block.id)}
                  onCloseTypeMenu={() => setTypeMenuId(null)}
                />
              ))}
            </div>

            <button
              onClick={() => addBlockAtEnd()}
              style={{ marginTop: 16, background: 'transparent', border: `1px dashed ${c}20`, color: `${c}30`,
                fontFamily: 'Courier New, monospace', fontSize: 10, padding: '8px 20px', cursor: 'pointer',
                width: '100%', letterSpacing: 1 }}>
              + ADD BLOCK
            </button>
          </div>
        </div>

        <div style={{ padding: '5px 14px', borderTop: `1px solid ${c}20`, background: `${c}04`,
          fontSize: 9, color: `${c}40`, display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', flexShrink: 0, flexWrap: 'wrap', gap: 8 }}>
          <span>{doc.blocks.length} block{doc.blocks.length !== 1 ? 's' : ''} · {wordCount} words</span>
          <span style={{ color: statusColor, letterSpacing: 1 }}>{statusText}</span>
        </div>
      </div>

      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: ${c}30;
          pointer-events: none;
        }
        [contenteditable] b, [contenteditable] strong { font-weight: bold; }
        [contenteditable] i, [contenteditable] em { font-style: italic; }
        [contenteditable] u { text-decoration: underline; }
        [contenteditable] s, [contenteditable] strike { text-decoration: line-through; }
      `}</style>
    </div>
  );
}
