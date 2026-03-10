import { useState, useRef, useCallback, useEffect } from 'react';
import { WordProcessorApp } from './WordProcessorApp';
import {
  FileText, Sheet, Presentation, Plus, Trash2, ChevronLeft,
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  BarChart2, Type, Palette,
} from 'lucide-react';

const O = {
  bg: '#111', toolbar: '#1e1e1e', border: '#333', borderLight: '#2a2a2a',
  text: '#e0e0e0', dim: '#888', veryDim: '#444',
  writer: '#4fc3f7', calc: '#66bb6a', impress: '#ef5350',
  selection: '#264f78', formula: '#1a1a2e',
};

type AppMode = 'home' | 'writer' | 'calc' | 'impress';

// ─────────────────────────────────────────────────────────────────
// SPREADSHEET ENGINE
// ─────────────────────────────────────────────────────────────────

const COLS = 'ABCDEFGHIJKLMNOP'.split('');
const ROW_COUNT = 50;

interface CellData {
  v: string;
  b?: boolean;
  i?: boolean;
  align?: 'left' | 'center' | 'right';
  fmt?: 'text' | 'number' | 'currency' | 'percent';
  color?: string;
}

type SheetMap = Record<string, CellData>;

function colRow(addr: string): [string, number] {
  const m = addr.match(/^([A-Z]+)(\d+)$/);
  if (!m) return ['A', 1];
  return [m[1], parseInt(m[2])];
}

function expandRange(range: string): string[] {
  const m = range.match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/);
  if (!m) return [range];
  const [, sc, sr, ec, er] = m;
  const cells: string[] = [];
  const startC = sc.charCodeAt(0), endC = ec.charCodeAt(0);
  const startR = parseInt(sr), endR = parseInt(er);
  for (let c = startC; c <= endC; c++)
    for (let r = startR; r <= endR; r++)
      cells.push(String.fromCharCode(c) + r);
  return cells;
}

function getRaw(addr: string, data: SheetMap): string {
  return data[addr]?.v ?? '';
}

function getCellNum(addr: string, data: SheetMap, depth: number): number {
  const raw = getRaw(addr, data);
  if (!raw) return 0;
  const v = evalCell(raw, data, depth + 1);
  return typeof v === 'number' ? v : parseFloat(String(v)) || 0;
}

function evalCell(raw: string, data: SheetMap, depth = 0): number | string {
  if (!raw) return '';
  if (depth > 8) return '#REF!';
  if (!raw.startsWith('=')) {
    const n = parseFloat(raw);
    return isNaN(n) ? raw : n;
  }
  const formula = raw.slice(1).trim().toUpperCase();
  const fnMatch = formula.match(/^([A-Z]+)\((.+)\)$/s);
  if (fnMatch) {
    const [, fn, argsStr] = fnMatch;
    const args = splitArgs(argsStr);
    const nums: number[] = [];
    const vals: (number | string)[] = [];
    for (const arg of args) {
      if (/^[A-Z]+\d+:[A-Z]+\d+$/.test(arg)) {
        for (const cell of expandRange(arg)) {
          const n = getCellNum(cell, data, depth);
          nums.push(n); vals.push(n);
        }
      } else if (/^[A-Z]+\d+$/.test(arg)) {
        const n = getCellNum(arg, data, depth);
        nums.push(n); vals.push(evalCell(getRaw(arg, data), data, depth + 1));
      } else {
        const n = parseFloat(arg);
        if (!isNaN(n)) { nums.push(n); vals.push(n); }
        else vals.push(arg.replace(/^"(.*)"$/, '$1'));
      }
    }
    switch (fn) {
      case 'SUM':     return nums.reduce((a, b) => a + b, 0);
      case 'AVERAGE': return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
      case 'MAX':     return nums.length ? Math.max(...nums) : 0;
      case 'MIN':     return nums.length ? Math.min(...nums) : 0;
      case 'COUNT':   return nums.length;
      case 'COUNTA':  return vals.filter(v => v !== '' && v !== 0).length;
      case 'ABS':     return nums.length ? Math.abs(nums[0]) : 0;
      case 'SQRT':    return nums.length ? Math.sqrt(nums[0]) : 0;
      case 'ROUND':   return nums.length >= 1 ? Math.round(nums[0] * Math.pow(10, nums[1] ?? 0)) / Math.pow(10, nums[1] ?? 0) : 0;
      case 'LEN':     return vals.length ? String(vals[0]).length : 0;
      case 'IF':      return vals[0] ? (vals[1] ?? '') : (vals[2] ?? '');
      case 'CONCAT':  return vals.map(v => String(v)).join('');
      default: return '#NAME?';
    }
  }
  const resolved = formula.replace(/([A-Z]+)([0-9]+)/g, (_, col, row) => {
    const n = getCellNum(col + row, data, depth);
    return String(n);
  });
  if (!/^[\d+\-*/.() ]+$/.test(resolved)) return '#ERR!';
  try { return Function(`"use strict"; return (${resolved})`)() as number; }
  catch { return '#ERR!'; }
}

function splitArgs(s: string): string[] {
  const args: string[] = [];
  let depth = 0, cur = '';
  for (const ch of s) {
    if (ch === '(' ) depth++;
    if (ch === ')' ) depth--;
    if (ch === ',' && depth === 0) { args.push(cur.trim()); cur = ''; }
    else cur += ch;
  }
  if (cur.trim()) args.push(cur.trim());
  return args;
}

function displayCell(raw: string, data: SheetMap, fmt?: string): string {
  if (!raw) return '';
  const val = evalCell(raw, data);
  if (typeof val === 'string' && val.startsWith('#')) return val;
  if (fmt === 'currency') return `$${Number(val).toFixed(2)}`;
  if (fmt === 'percent')  return `${(Number(val) * 100).toFixed(1)}%`;
  if (fmt === 'number')   return String(Number(val).toLocaleString());
  return String(val);
}

// ─────────────────────────────────────────────────────────────────
// CALC APP
// ─────────────────────────────────────────────────────────────────

interface CalcState {
  sheets: { name: string; data: SheetMap }[];
  activeSheet: number;
  sel: string;
  editMode: boolean;
  editVal: string;
  colWidths: Record<string, number>;
}

function defaultCalcState(): CalcState {
  return {
    sheets: [
      { name: 'Sheet1', data: {} },
      { name: 'Sheet2', data: {} },
      { name: 'Sheet3', data: {} },
    ],
    activeSheet: 0,
    sel: 'A1',
    editMode: false,
    editVal: '',
    colWidths: {},
  };
}

function loadCalc(): CalcState {
  try {
    const s = localStorage.getItem('academy-calc-v1');
    if (s) return { ...defaultCalcState(), ...JSON.parse(s) };
  } catch {}
  return defaultCalcState();
}

function saveCalc(s: CalcState) {
  try { localStorage.setItem('academy-calc-v1', JSON.stringify({ sheets: s.sheets, colWidths: s.colWidths })); } catch {}
}

function CalcApp() {
  const [state, setState] = useState<CalcState>(loadCalc);
  const editRef = useRef<HTMLInputElement>(null);

  const sheet = state.sheets[state.activeSheet];
  const data = sheet.data;
  const [selCol, selRow] = colRow(state.sel);

  const setCell = useCallback((addr: string, updates: Partial<CellData>) => {
    setState(prev => {
      const next = { ...prev };
      next.sheets = prev.sheets.map((sh, i) =>
        i === prev.activeSheet
          ? { ...sh, data: { ...sh.data, [addr]: { ...(sh.data[addr] ?? {}), ...updates } } }
          : sh
      );
      saveCalc(next);
      return next;
    });
  }, []);

  const commitEdit = useCallback(() => {
    if (!state.editMode) return;
    setCell(state.sel, { v: state.editVal });
    setState(prev => ({ ...prev, editMode: false, editVal: '' }));
  }, [state, setCell]);

  const moveSelection = useCallback((dCol: number, dRow: number) => {
    const [col, row] = colRow(state.sel);
    const cIdx = COLS.indexOf(col);
    const newCIdx = Math.max(0, Math.min(COLS.length - 1, cIdx + dCol));
    const newRow = Math.max(1, Math.min(ROW_COUNT, row + dRow));
    setState(prev => ({ ...prev, sel: COLS[newCIdx] + newRow, editMode: false, editVal: '' }));
  }, [state.sel]);

  const toggleFmt = useCallback((fmt: keyof CellData) => {
    const cell = data[state.sel] ?? {};
    setCell(state.sel, { [fmt]: !cell[fmt as keyof CellData] });
  }, [data, state.sel, setCell]);

  useEffect(() => {
    if (state.editMode && editRef.current) editRef.current.focus();
  }, [state.editMode, state.sel]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (state.editMode) {
      if (e.key === 'Enter') { commitEdit(); moveSelection(0, 1); }
      if (e.key === 'Escape') setState(prev => ({ ...prev, editMode: false, editVal: '' }));
      if (e.key === 'Tab') { e.preventDefault(); commitEdit(); moveSelection(1, 0); }
      return;
    }
    const nav: Record<string, [number, number]> = {
      ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0],
      Tab: [1, 0], Enter: [0, 1],
    };
    if (nav[e.key]) { e.preventDefault(); moveSelection(...nav[e.key]); return; }
    if (e.key === 'Delete' || e.key === 'Backspace') { setCell(state.sel, { v: '' }); return; }
    if (!e.ctrlKey && !e.metaKey && e.key.length === 1) {
      setState(prev => ({ ...prev, editMode: true, editVal: e.key }));
    }
  }, [state.editMode, state.sel, commitEdit, moveSelection, setCell]);

  const selCell = data[state.sel] ?? {};
  const formulaDisplay = selCell.v || '';

  const COL_W = 80, ROW_H = 22, HDR_W = 40, HDR_H = 22;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#1a1a1a', userSelect: 'none' }} onKeyDown={handleKeyDown} tabIndex={0}>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 4, padding: '4px 8px', background: O.toolbar, borderBottom: `1px solid ${O.border}`, alignItems: 'center', flexWrap: 'wrap', flexShrink: 0 }}>
        {[
          { icon: <Bold size={12} />, tip: 'Bold', action: () => toggleFmt('b') },
          { icon: <Italic size={12} />, tip: 'Italic', action: () => toggleFmt('i') },
        ].map(({ icon, tip, action }) => (
          <button key={tip} onClick={action} title={tip} style={{ background: '#2a2a2a', border: `1px solid ${O.border}`, color: O.text, cursor: 'pointer', padding: '2px 6px', borderRadius: 2, display: 'flex', alignItems: 'center' }}>{icon}</button>
        ))}
        <div style={{ width: 1, height: 16, background: O.border, margin: '0 2px' }} />
        {(['left', 'center', 'right'] as const).map(a => (
          <button key={a} onClick={() => setCell(state.sel, { align: a })} style={{ background: selCell.align === a ? '#3a3a3a' : '#2a2a2a', border: `1px solid ${O.border}`, color: O.text, cursor: 'pointer', padding: '2px 6px', borderRadius: 2 }}>
            {a === 'left' ? <AlignLeft size={12} /> : a === 'center' ? <AlignCenter size={12} /> : <AlignRight size={12} />}
          </button>
        ))}
        <div style={{ width: 1, height: 16, background: O.border, margin: '0 2px' }} />
        <select value={selCell.fmt ?? ''} onChange={e => setCell(state.sel, { fmt: e.target.value as CellData['fmt'] })} style={{ background: '#2a2a2a', border: `1px solid ${O.border}`, color: O.text, fontSize: 10, padding: '2px 4px', borderRadius: 2 }}>
          <option value="">General</option>
          <option value="number">Number</option>
          <option value="currency">Currency ($)</option>
          <option value="percent">Percent (%)</option>
          <option value="text">Text</option>
        </select>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 9, color: O.dim }}>Ctrl+S to save</span>
      </div>

      {/* Formula bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 8px', background: '#141414', borderBottom: `1px solid ${O.border}`, flexShrink: 0 }}>
        <div style={{ minWidth: 44, padding: '2px 6px', background: '#0a2a3a', border: `1px solid ${O.writer}40`, color: O.writer, fontFamily: 'monospace', fontSize: 11, textAlign: 'center', borderRadius: 2 }}>{state.sel}</div>
        <span style={{ color: O.dim, fontSize: 12 }}>fx</span>
        <input
          ref={editRef}
          value={state.editMode ? state.editVal : formulaDisplay}
          onChange={e => setState(prev => ({ ...prev, editMode: true, editVal: e.target.value }))}
          onKeyDown={e => {
            if (e.key === 'Enter') { commitEdit(); e.currentTarget.blur(); }
            if (e.key === 'Escape') setState(prev => ({ ...prev, editMode: false, editVal: '' }));
          }}
          onFocus={() => setState(prev => ({ ...prev, editMode: true, editVal: formulaDisplay }))}
          style={{ flex: 1, background: '#0a0a0a', border: `1px solid ${O.border}`, color: O.text, fontFamily: 'monospace', fontSize: 11, padding: '2px 6px', outline: 'none', borderRadius: 2 }}
        />
      </div>

      {/* Grid */}
      <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
        <div style={{ display: 'inline-block', minWidth: '100%' }}>
          {/* Column headers */}
          <div style={{ display: 'flex', position: 'sticky', top: 0, zIndex: 3 }}>
            <div style={{ width: HDR_W, height: HDR_H, minWidth: HDR_W, background: '#1a1a1a', border: `1px solid ${O.border}`, flexShrink: 0 }} />
            {COLS.map(col => (
              <div key={col} style={{ width: state.colWidths[col] ?? COL_W, minWidth: state.colWidths[col] ?? COL_W, height: HDR_H, background: col === selCol ? '#264f78' : '#1a1a1a', border: `1px solid ${O.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontFamily: 'monospace', flexShrink: 0, cursor: 'pointer', fontWeight: col === selCol ? 'bold' : 'normal', color: col === selCol ? '#fff' : O.dim }}>
                {col}
              </div>
            ))}
          </div>

          {/* Rows */}
          {Array.from({ length: ROW_COUNT }, (_, ri) => {
            const row = ri + 1;
            return (
              <div key={row} style={{ display: 'flex' }}>
                <div style={{ width: HDR_W, minWidth: HDR_W, height: ROW_H, background: row === selRow ? '#264f78' : '#1a1a1a', border: `1px solid ${O.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: row === selRow ? '#fff' : O.dim, fontFamily: 'monospace', flexShrink: 0, fontWeight: row === selRow ? 'bold' : 'normal' }}>
                  {row}
                </div>
                {COLS.map(col => {
                  const addr = col + row;
                  const cell = data[addr] ?? {};
                  const isSelected = addr === state.sel;
                  const display = displayCell(cell.v ?? '', data, cell.fmt);
                  const isEditing = isSelected && state.editMode;
                  return (
                    <div key={addr} onClick={() => { commitEdit(); setState(prev => ({ ...prev, sel: addr, editMode: false, editVal: '' })); }} onDoubleClick={() => setState(prev => ({ ...prev, sel: addr, editMode: true, editVal: cell.v ?? '' }))}
                      style={{ width: state.colWidths[col] ?? COL_W, minWidth: state.colWidths[col] ?? COL_W, height: ROW_H, border: isSelected ? `2px solid ${O.writer}` : `1px solid ${O.border}`, background: isSelected ? '#0a1a2a' : '#111', position: 'relative', flexShrink: 0, overflow: 'hidden', cursor: 'default' }}>
                      {isEditing ? (
                        <input
                          value={state.editVal}
                          onChange={e => setState(prev => ({ ...prev, editVal: e.target.value }))}
                          onKeyDown={e => {
                            if (e.key === 'Enter') { e.preventDefault(); commitEdit(); moveSelection(0, 1); }
                            if (e.key === 'Escape') setState(prev => ({ ...prev, editMode: false, editVal: '' }));
                            if (e.key === 'Tab') { e.preventDefault(); commitEdit(); moveSelection(1, 0); }
                          }}
                          autoFocus
                          style={{ width: '100%', height: '100%', background: '#0a1a2a', border: 'none', color: O.text, fontFamily: 'monospace', fontSize: 11, padding: '0 4px', outline: 'none' }}
                        />
                      ) : (
                        <div style={{ padding: '0 4px', height: '100%', display: 'flex', alignItems: 'center', justifyContent: cell.align === 'center' ? 'center' : cell.align === 'right' ? 'flex-end' : 'flex-start', fontWeight: cell.b ? 'bold' : 'normal', fontStyle: cell.i ? 'italic' : 'normal', fontSize: 11, color: display.startsWith('#') && display.length > 2 ? '#e06c75' : O.text, fontFamily: 'monospace', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                          {display}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Sheet tabs */}
      <div style={{ display: 'flex', gap: 2, padding: '3px 6px', background: '#161616', borderTop: `1px solid ${O.border}`, alignItems: 'center', flexShrink: 0 }}>
        {state.sheets.map((sh, i) => (
          <button key={i} onClick={() => setState(prev => ({ ...prev, activeSheet: i }))} style={{ background: i === state.activeSheet ? '#2a4a2a' : '#1a1a1a', border: `1px solid ${i === state.activeSheet ? O.calc + '80' : O.border}`, color: i === state.activeSheet ? O.calc : O.dim, cursor: 'pointer', padding: '2px 10px', fontSize: 10, fontFamily: 'monospace', borderRadius: '3px 3px 0 0' }}>
            {sh.name}
          </button>
        ))}
        <button onClick={() => setState(prev => {
          const next = { ...prev, sheets: [...prev.sheets, { name: `Sheet${prev.sheets.length + 1}`, data: {} }] };
          saveCalc(next); return next;
        })} style={{ background: 'transparent', border: `1px solid ${O.border}`, color: O.dim, cursor: 'pointer', padding: '2px 6px', fontSize: 10, borderRadius: 3 }}>+</button>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 8, color: O.veryDim, fontFamily: 'monospace' }}>
          {data[state.sel]?.v ? `val: ${displayCell(data[state.sel].v, data, data[state.sel]?.fmt)}` : state.sel}
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// IMPRESS APP
// ─────────────────────────────────────────────────────────────────

const THEMES = [
  { id: 'dark',     name: 'Void',     bg: '#0d0d14', title: '#4fc3f7', body: '#c8d8e8', accent: '#e94560' },
  { id: 'academy',  name: 'Academy',  bg: '#050a05', title: '#00ff88', body: '#aaffcc', accent: '#ffaa00' },
  { id: 'midnight', name: 'Midnight', bg: '#0a0018', title: '#c792ea', body: '#d4c5f9', accent: '#ff6e40' },
  { id: 'ocean',    name: 'Ocean',    bg: '#001824', title: '#7fdbff', body: '#b0e8ff', accent: '#0074d9' },
  { id: 'carbon',   name: 'Carbon',   bg: '#161616', title: '#f0f0f0', body: '#cccccc', accent: '#ff5f57' },
];

interface SlideElement { id: string; type: 'title' | 'body' | 'note'; text: string; }
interface Slide { id: string; elements: SlideElement[]; themeId: string; }

function newSlide(themeId = 'dark', n = 1): Slide {
  return {
    id: crypto.randomUUID(),
    themeId,
    elements: [
      { id: 'title', type: 'title', text: `Slide ${n} Title` },
      { id: 'body', type: 'body', text: '• Click to add content\n• Add bullet points here' },
    ],
  };
}

function loadImpress(): Slide[] {
  try {
    const s = localStorage.getItem('academy-impress-v1');
    if (s) return JSON.parse(s);
  } catch {}
  return [newSlide('dark', 1), newSlide('dark', 2)];
}

function saveImpress(slides: Slide[]) {
  try { localStorage.setItem('academy-impress-v1', JSON.stringify(slides)); } catch {}
}

function SlideThumbnail({ slide, active, onClick }: { slide: Slide; active: boolean; onClick: () => void }) {
  const theme = THEMES.find(t => t.id === slide.themeId) ?? THEMES[0];
  const title = slide.elements.find(e => e.type === 'title')?.text ?? '';
  return (
    <div onClick={onClick} style={{ width: '100%', aspectRatio: '16/9', background: theme.bg, border: `2px solid ${active ? O.impress : O.border}`, borderRadius: 3, cursor: 'pointer', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: 4, boxSizing: 'border-box' }}>
      <div style={{ fontSize: 7, color: theme.title, fontWeight: 'bold', textAlign: 'center', wordBreak: 'break-word', lineHeight: 1.2 }}>{title}</div>
    </div>
  );
}

function ImpressApp() {
  const [slides, setSlides] = useState<Slide[]>(loadImpress);
  const [activeIdx, setActiveIdx] = useState(0);
  const [editingEl, setEditingEl] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [currentTheme, setCurrentTheme] = useState('dark');
  const textRef = useRef<HTMLTextAreaElement>(null);

  const slide = slides[Math.min(activeIdx, slides.length - 1)];
  const theme = THEMES.find(t => t.id === slide?.themeId) ?? THEMES[0];

  useEffect(() => { saveImpress(slides); }, [slides]);
  useEffect(() => { if (editingEl && textRef.current) textRef.current.focus(); }, [editingEl]);

  const updateElement = (elId: string, text: string) => {
    setSlides(prev => prev.map((s, i) => i === activeIdx ? {
      ...s,
      elements: s.elements.map(e => e.id === elId ? { ...e, text } : e),
    } : s));
  };

  const startEdit = (el: SlideElement) => {
    setEditingEl(el.id);
    setEditText(el.text);
  };

  const commitEdit = () => {
    if (editingEl) updateElement(editingEl, editText);
    setEditingEl(null);
    setEditText('');
  };

  const addSlide = () => {
    const ns = newSlide(currentTheme, slides.length + 1);
    setSlides(prev => [...prev, ns]);
    setActiveIdx(slides.length);
  };

  const deleteSlide = () => {
    if (slides.length <= 1) return;
    setSlides(prev => prev.filter((_, i) => i !== activeIdx));
    setActiveIdx(Math.max(0, activeIdx - 1));
  };

  const applyTheme = (themeId: string) => {
    setCurrentTheme(themeId);
    setSlides(prev => prev.map((s, i) => i === activeIdx ? { ...s, themeId } : s));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#111' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 6, padding: '4px 8px', background: O.toolbar, borderBottom: `1px solid ${O.border}`, alignItems: 'center', flexShrink: 0, flexWrap: 'wrap' }}>
        <button onClick={addSlide} style={{ background: '#2a1a1a', border: `1px solid ${O.impress}60`, color: O.impress, cursor: 'pointer', padding: '3px 10px', borderRadius: 2, fontSize: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
          <Plus size={10} /> Add Slide
        </button>
        <button onClick={deleteSlide} style={{ background: '#2a0a0a', border: `1px solid ${O.border}`, color: '#e06c75', cursor: 'pointer', padding: '3px 8px', borderRadius: 2, fontSize: 10, display: 'flex', alignItems: 'center', gap: 4 }} disabled={slides.length <= 1}>
          <Trash2 size={10} />
        </button>
        <div style={{ width: 1, height: 16, background: O.border }} />
        <span style={{ fontSize: 9, color: O.dim, display: 'flex', alignItems: 'center', gap: 3 }}><Palette size={10} /> Theme:</span>
        {THEMES.map(t => (
          <button key={t.id} onClick={() => applyTheme(t.id)} title={t.name} style={{ width: 18, height: 18, background: t.bg, border: `2px solid ${t.id === slide?.themeId ? O.impress : O.border}`, borderRadius: 3, cursor: 'pointer', flexShrink: 0 }} />
        ))}
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 9, color: O.dim, fontFamily: 'monospace' }}>
          Slide {activeIdx + 1} / {slides.length} — double-click to edit
        </span>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Slides panel */}
        <div style={{ width: 140, background: '#0d0d0d', borderRight: `1px solid ${O.border}`, overflow: 'auto', padding: 6, display: 'flex', flexDirection: 'column', gap: 5, flexShrink: 0 }}>
          {slides.map((s, i) => (
            <div key={s.id} style={{ position: 'relative' }}>
              <div style={{ fontSize: 8, color: O.veryDim, fontFamily: 'monospace', marginBottom: 2, textAlign: 'center' }}>{i + 1}</div>
              <SlideThumbnail slide={s} active={i === activeIdx} onClick={() => { commitEdit(); setActiveIdx(i); }} />
            </div>
          ))}
        </div>

        {/* Canvas area */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1a1a', overflow: 'hidden', padding: 20 }}>
          {slide && (
            <div style={{ width: '100%', maxWidth: 720, aspectRatio: '16/9', background: theme.bg, borderRadius: 4, position: 'relative', boxShadow: '0 8px 40px rgba(0,0,0,0.8)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {/* Accent bar */}
              <div style={{ height: 4, background: theme.accent, flexShrink: 0 }} />

              {slide.elements.map(el => {
                const isTitle = el.type === 'title';
                const isEditing = editingEl === el.id;
                return (
                  <div key={el.id} onDoubleClick={() => startEdit(el)} style={{ padding: isTitle ? '20px 30px 10px' : '10px 30px 20px', flex: isTitle ? '0 0 auto' : 1, position: 'relative', cursor: 'default' }}>
                    {isEditing ? (
                      <textarea
                        ref={el.id === editingEl ? textRef : undefined}
                        value={editText}
                        onChange={e => setEditText(e.target.value)}
                        onBlur={commitEdit}
                        onKeyDown={e => { if (e.key === 'Escape') commitEdit(); }}
                        style={{ width: '100%', height: isTitle ? 60 : 160, background: 'transparent', border: `1px dashed ${theme.accent}60`, color: isTitle ? theme.title : theme.body, fontFamily: isTitle ? '"Segoe UI", system-ui' : '"Courier New", monospace', fontSize: isTitle ? 22 : 14, fontWeight: isTitle ? 'bold' : 'normal', resize: 'none', outline: 'none', lineHeight: 1.5, padding: 4 }}
                      />
                    ) : (
                      <div style={{ color: isTitle ? theme.title : theme.body, fontFamily: isTitle ? '"Segoe UI", system-ui' : '"Courier New", monospace', fontSize: isTitle ? 22 : 13, fontWeight: isTitle ? 'bold' : 'normal', lineHeight: 1.6, whiteSpace: 'pre-wrap', opacity: el.text ? 1 : 0.3 }}>
                        {el.text || (isTitle ? 'Double-click to add title' : 'Double-click to add content')}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Slide number */}
              <div style={{ position: 'absolute', bottom: 8, right: 12, fontSize: 9, color: `${theme.body}50`, fontFamily: 'monospace' }}>
                {activeIdx + 1}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// OFFICE HOME LAUNCHER
// ─────────────────────────────────────────────────────────────────

function OfficeHome({ onSelect }: { onSelect: (m: AppMode) => void }) {
  const apps: { mode: AppMode; label: string; sub: string; color: string; icon: React.ReactNode; desc: string }[] = [
    { mode: 'writer', label: 'Writer',   sub: 'Document',     color: O.writer,  icon: <FileText size={28} />, desc: 'Block-based word processor with templates, heading styles, and code blocks' },
    { mode: 'calc',   label: 'Calc',     sub: 'Spreadsheet',  color: O.calc,    icon: <Sheet size={28} />,    desc: 'Functional spreadsheet with formulas: SUM, AVERAGE, IF, and more' },
    { mode: 'impress',label: 'Impress',  sub: 'Presentation', color: O.impress, icon: <Presentation size={28} />, desc: 'Slide-based presentation editor with themes and multi-slide support' },
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#0d0d0d', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 20 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 22, color: '#e0e0e0', fontFamily: '"Segoe UI", system-ui', fontWeight: 300, marginBottom: 4 }}>Academy Office Suite</div>
        <div style={{ fontSize: 11, color: '#555', fontFamily: 'monospace', letterSpacing: 2 }}>SELECT A DOCUMENT TYPE</div>
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
        {apps.map(({ mode, label, sub, color, icon, desc }) => (
          <button key={mode} onClick={() => onSelect(mode)} style={{ width: 180, padding: '22px 16px', background: '#161616', border: `1px solid ${color}30`, borderRadius: 6, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, transition: 'border-color 0.15s, background 0.15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${color}12`; (e.currentTarget as HTMLElement).style.borderColor = `${color}70`; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#161616'; (e.currentTarget as HTMLElement).style.borderColor = `${color}30`; }}>
            <div style={{ color, opacity: 0.9 }}>{icon}</div>
            <div>
              <div style={{ fontSize: 15, color: '#e0e0e0', fontFamily: '"Segoe UI", system-ui', fontWeight: 500, marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: 10, color, fontFamily: 'monospace', letterSpacing: 1 }}>{sub}</div>
            </div>
            <div style={{ fontSize: 9, color: '#666', fontFamily: 'monospace', textAlign: 'center', lineHeight: 1.5, maxWidth: 150 }}>{desc}</div>
          </button>
        ))}
      </div>

      <div style={{ fontSize: 9, color: '#333', fontFamily: 'monospace', marginTop: 8, textAlign: 'center' }}>
        ACADEMY OFFICE v1.0 · WRITER · CALC · IMPRESS
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────

export function AcademyOfficeApp() {
  const [mode, setMode] = useState<AppMode>('home');

  const modeColor = mode === 'writer' ? O.writer : mode === 'calc' ? O.calc : mode === 'impress' ? O.impress : '#888';
  const modeLabel = mode === 'writer' ? 'Writer' : mode === 'calc' ? 'Calc' : mode === 'impress' ? 'Impress' : '';

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#0d0d0d' }}>
      {mode !== 'home' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 8px', background: '#161616', borderBottom: `1px solid ${O.border}`, flexShrink: 0 }}>
          <button onClick={() => setMode('home')} style={{ background: 'transparent', border: 'none', color: O.dim, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, padding: '2px 6px', borderRadius: 2 }}>
            <ChevronLeft size={12} /> Office
          </button>
          <span style={{ color: O.border }}>›</span>
          <span style={{ fontSize: 10, color: modeColor, fontFamily: 'monospace' }}>{modeLabel}</span>
          <div style={{ flex: 1 }} />
          {(['writer', 'calc', 'impress'] as AppMode[]).map(m => (
            <button key={m} onClick={() => setMode(m)} style={{ background: m === mode ? `${modeColor}18` : 'transparent', border: `1px solid ${m === mode ? modeColor + '50' : O.border}`, color: m === mode ? modeColor : O.dim, cursor: 'pointer', padding: '2px 10px', borderRadius: 2, fontSize: 9, fontFamily: 'monospace', letterSpacing: 0.5 }}>
              {m[0].toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>
      )}

      <div style={{ flex: 1, overflow: 'hidden' }}>
        {mode === 'home'    && <OfficeHome onSelect={setMode} />}
        {mode === 'writer'  && <WordProcessorApp />}
        {mode === 'calc'    && <CalcApp />}
        {mode === 'impress' && <ImpressApp />}
      </div>
    </div>
  );
}
