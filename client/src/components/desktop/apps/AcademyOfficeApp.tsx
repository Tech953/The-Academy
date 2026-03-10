import { useState, useRef, useCallback, useEffect } from 'react';
import { WordProcessorApp } from './WordProcessorApp';
import {
  FileText, Sheet, Presentation, Plus, Trash2, ChevronLeft,
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  BarChart2, Type, Palette, Strikethrough, List, ListOrdered,
  Copy, Scissors, Clipboard, LayoutTemplate, Image, Link2,
  Calendar, Hash, MessageSquare, ChevronRight, ChevronDown,
  Volume2, Play, RotateCcw, Sparkles, Timer, Clock, MoveUp, MoveDown,
  SkipBack, Rewind, Wind, Layers, SplitSquareHorizontal, Maximize,
  SpellCheck, BookOpen, Languages, Trash, Eye, EyeOff, MessageCircle,
  AlignJustify, Baseline, Indent, Outdent, Shapes, Wand2,
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
  { id: 'ember',    name: 'Ember',    bg: '#1a0800', title: '#ff9944', body: '#ffd0a0', accent: '#ff4400' },
  { id: 'arctic',   name: 'Arctic',   bg: '#001020', title: '#80ddff', body: '#c0eeff', accent: '#00bbff' },
  { id: 'forest',   name: 'Forest',   bg: '#001a08', title: '#66ff99', body: '#bbffcc', accent: '#00cc44' },
];

const THEME_VARIANTS = [
  { id: 'default', name: 'Default', mod: (t: typeof THEMES[0]) => t },
  { id: 'muted',   name: 'Muted',   mod: (t: typeof THEMES[0]) => ({ ...t, title: `${t.title}cc`, body: `${t.body}99` }) },
  { id: 'vibrant', name: 'Vibrant', mod: (t: typeof THEMES[0]) => ({ ...t, accent: t.title }) },
  { id: 'mono',    name: 'Mono',    mod: (t: typeof THEMES[0]) => ({ ...t, title: '#ffffff', body: '#aaaaaa', accent: '#555555' }) },
];

const SLIDE_LAYOUTS = [
  { id: 'title-content', name: 'Title & Content' },
  { id: 'title-only',    name: 'Title Only' },
  { id: 'blank',         name: 'Blank' },
  { id: 'two-column',    name: 'Two Column' },
  { id: 'section',       name: 'Section Header' },
];

const TRANSITIONS = [
  { id: 'none',        name: 'None',        icon: '○' },
  { id: 'fade',        name: 'Fade',        icon: '◐' },
  { id: 'push',        name: 'Push',        icon: '→' },
  { id: 'wipe',        name: 'Wipe',        icon: '▶' },
  { id: 'split',       name: 'Split',       icon: '⊕' },
  { id: 'reveal',      name: 'Reveal',      icon: '◑' },
  { id: 'cut',         name: 'Cut',         icon: '✂' },
  { id: 'random-bars', name: 'Random Bars', icon: '▦' },
  { id: 'shape',       name: 'Shape',       icon: '◎' },
  { id: 'uncover',     name: 'Uncover',     icon: '◁' },
  { id: 'cover',       name: 'Cover',       icon: '◀' },
  { id: 'morph',       name: 'Morph',       icon: '⬡' },
];

const ANIMATIONS = [
  { id: 'none',     name: 'None',     css: '' },
  { id: 'appear',   name: 'Appear',   css: 'impress-appear' },
  { id: 'fade',     name: 'Fade',     css: 'impress-fade' },
  { id: 'fly-in',   name: 'Fly In',   css: 'impress-fly-in' },
  { id: 'float-in', name: 'Float In', css: 'impress-float-in' },
  { id: 'split',    name: 'Split',    css: 'impress-split' },
  { id: 'wipe',     name: 'Wipe',     css: 'impress-wipe' },
];

const TRANSITION_SOUNDS = ['No Sound', 'Applause', 'Arrow', 'Bomb', 'Breeze', 'Camera', 'Chime', 'Click', 'Coin', 'Drum', 'Explosion', 'Laser', 'Push', 'Static', 'Voltage', 'Wind'];

interface SlideComment { id: string; text: string; author: string; timestamp: string; }
interface SlideElement {
  id: string;
  type: 'title' | 'body' | 'note' | 'textbox';
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  align?: 'left' | 'center' | 'right';
  fontSize?: number;
  animation?: string;
  animStart?: 'on-click' | 'with-prev' | 'after-prev';
  animDuration?: number;
  animDelay?: number;
}
interface Slide {
  id: string;
  elements: SlideElement[];
  themeId: string;
  variant?: string;
  layout?: string;
  transition?: string;
  transitionDuration?: number;
  transitionSound?: string;
  notes?: string;
  comments?: SlideComment[];
  showSlideNumber?: boolean;
}

function newSlide(themeId = 'dark', n = 1, layout = 'title-content'): Slide {
  const elements: SlideElement[] = layout === 'blank' ? [] :
    layout === 'title-only' ? [{ id: 'title', type: 'title', text: `Slide ${n} Title` }] :
    layout === 'section' ? [
      { id: 'title', type: 'title', text: `Section ${n}`, fontSize: 32, align: 'center' },
    ] : [
      { id: 'title', type: 'title', text: `Slide ${n} Title` },
      { id: 'body',  type: 'body',  text: '• Click to add content\n• Add bullet points here' },
    ];
  return { id: crypto.randomUUID(), themeId, variant: 'default', layout, elements, transition: 'none', transitionDuration: 2, transitionSound: 'No Sound', notes: '', comments: [], showSlideNumber: true };
}

function loadImpress(): Slide[] {
  try {
    const s = localStorage.getItem('academy-impress-v1');
    if (s) {
      const parsed = JSON.parse(s);
      return parsed.map((sl: Slide) => ({ transition: 'none', transitionDuration: 2, transitionSound: 'No Sound', notes: '', comments: [], variant: 'default', layout: 'title-content', showSlideNumber: true, ...sl }));
    }
  } catch {}
  return [newSlide('dark', 1), newSlide('dark', 2)];
}

function saveImpress(slides: Slide[]) {
  try { localStorage.setItem('academy-impress-v1', JSON.stringify(slides)); } catch {}
}

function SlideThumbnail({ slide, index, active, onClick }: { slide: Slide; index: number; active: boolean; onClick: () => void }) {
  const theme = THEMES.find(t => t.id === slide.themeId) ?? THEMES[0];
  const title = slide.elements.find(e => e.type === 'title')?.text ?? '';
  const hasTrans = slide.transition && slide.transition !== 'none';
  return (
    <div onClick={onClick} style={{ width: '100%', aspectRatio: '16/9', background: theme.bg, border: `2px solid ${active ? O.impress : O.border}`, borderRadius: 3, cursor: 'pointer', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: 4, boxSizing: 'border-box' }}>
      <div style={{ height: 2, background: theme.accent, width: '100%', position: 'absolute', top: 0, left: 0 }} />
      <div style={{ fontSize: 7, color: theme.title, fontWeight: 'bold', textAlign: 'center', wordBreak: 'break-word', lineHeight: 1.2 }}>{title}</div>
      {slide.showSlideNumber && (
        <div style={{ position: 'absolute', bottom: 2, right: 3, fontSize: 5, color: `${theme.body}60` }}>{index + 1}</div>
      )}
      {hasTrans && (
        <div style={{ position: 'absolute', bottom: 2, left: 3, fontSize: 5, color: `${theme.accent}cc` }}>
          {TRANSITIONS.find(t => t.id === slide.transition)?.icon}
        </div>
      )}
    </div>
  );
}

// ── Ribbon button helpers ──────────────────────────────────────────
const IR = {
  tab: '#1e1e1e', tabActive: '#252525',
  group: '#1e1e1e', groupBorder: '#2e2e2e',
  btn: 'transparent', btnHover: '#2e2e2e', btnActive: '#383838',
  text: '#ccc', dim: '#888', accent: O.impress,
};

function RBtn({ children, onClick, active = false, disabled = false, title, style: extraStyle }: { children: React.ReactNode; onClick?: () => void; active?: boolean; disabled?: boolean; title?: string; style?: React.CSSProperties }) {
  return (
    <button onClick={onClick} disabled={disabled} title={title}
      style={{ background: active ? IR.btnActive : IR.btn, border: `1px solid ${active ? IR.accent + '60' : 'transparent'}`, color: disabled ? '#555' : active ? IR.accent : IR.text, cursor: disabled ? 'not-allowed' : 'pointer', padding: '3px 7px', borderRadius: 2, fontSize: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, minWidth: 32, lineHeight: 1.2, ...extraStyle }}
      onMouseEnter={e => { if (!disabled && !active) (e.currentTarget as HTMLElement).style.background = IR.btnHover; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = active ? IR.btnActive : IR.btn; }}>
      {children}
    </button>
  );
}

function RGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', borderRight: `1px solid ${IR.groupBorder}`, paddingRight: 6, marginRight: 2 }}>
      <div style={{ display: 'flex', gap: 2, alignItems: 'flex-start', flex: 1 }}>{children}</div>
      <div style={{ fontSize: 8, color: '#555', textAlign: 'center', paddingTop: 2, letterSpacing: 0.5, whiteSpace: 'nowrap' }}>{label}</div>
    </div>
  );
}

function RSep() { return <div style={{ width: 1, alignSelf: 'stretch', background: IR.groupBorder, margin: '2px 0' }} />; }

interface PresentationRibbonProps {
  slides: Slide[];
  activeIdx: number;
  slide: Slide;
  selectedElId: string | null;
  ribbonTab: string;
  onRibbonTab: (t: string) => void;
  showNotes: boolean;
  onToggleNotes: () => void;
  showComments: boolean;
  onToggleComments: () => void;
  spellCheck: boolean;
  onToggleSpellCheck: () => void;
  onAddSlide: (layout?: string) => void;
  onDuplicateSlide: () => void;
  onDeleteSlide: () => void;
  onApplyTheme: (id: string) => void;
  onApplyVariant: (id: string) => void;
  onApplyLayout: (id: string) => void;
  onApplyTransition: (id: string) => void;
  onSetTransitionDuration: (d: number) => void;
  onSetTransitionSound: (s: string) => void;
  onApplyToAll: () => void;
  onUpdateElement: (elId: string, patch: Partial<SlideElement>) => void;
  onAddTextBox: () => void;
  onInsertDate: () => void;
  onInsertSlideNumber: () => void;
  onAddComment: () => void;
  onDeleteComment: (id: string) => void;
  onPrevComment: () => void;
  onNextComment: () => void;
  onPreviewTransition: () => void;
  wordCount: number;
  commentCount: number;
}

function PresentationRibbon({
  slides, activeIdx, slide, selectedElId, ribbonTab, onRibbonTab,
  showNotes, onToggleNotes, showComments, onToggleComments,
  spellCheck, onToggleSpellCheck,
  onAddSlide, onDuplicateSlide, onDeleteSlide,
  onApplyTheme, onApplyVariant, onApplyLayout,
  onApplyTransition, onSetTransitionDuration, onSetTransitionSound, onApplyToAll,
  onUpdateElement, onAddTextBox, onInsertDate, onInsertSlideNumber,
  onAddComment, onDeleteComment, onPrevComment, onNextComment,
  onPreviewTransition, wordCount, commentCount,
}: PresentationRibbonProps) {
  const [layoutOpen, setLayoutOpen] = useState(false);
  const [soundOpen, setSoundOpen] = useState(false);
  const selEl = slide?.elements.find(e => e.id === selectedElId) ?? null;

  const TABS = ['Home', 'Insert', 'Design', 'Transitions', 'Animations', 'Review'];

  return (
    <div style={{ background: IR.tab, borderBottom: `1px solid ${IR.groupBorder}`, flexShrink: 0 }}>
      {/* Tab bar */}
      <div style={{ display: 'flex', paddingLeft: 8, borderBottom: `1px solid ${IR.groupBorder}` }}>
        {TABS.map(t => (
          <button key={t} onClick={() => onRibbonTab(t)}
            style={{ background: ribbonTab === t ? IR.tabActive : 'transparent', border: 'none', borderBottom: ribbonTab === t ? `2px solid ${IR.accent}` : '2px solid transparent', color: ribbonTab === t ? IR.accent : IR.dim, cursor: 'pointer', padding: '5px 12px', fontSize: 10, fontFamily: 'system-ui', letterSpacing: 0.3 }}>
            {t}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 9, color: '#555', alignSelf: 'center', paddingRight: 10, fontFamily: 'monospace' }}>
          {activeIdx + 1}/{slides.length} slides · {wordCount} words
        </span>
      </div>

      {/* Content area */}
      <div style={{ display: 'flex', alignItems: 'stretch', padding: '4px 6px', gap: 2, minHeight: 64 }}>

        {/* ── HOME ─────────────────────────────────────── */}
        {ribbonTab === 'Home' && (<>
          <RGroup label="Clipboard">
            <RBtn title="Paste"><Clipboard size={14} /><span style={{fontSize:8}}>Paste</span></RBtn>
            <div style={{display:'flex',flexDirection:'column',gap:2}}>
              <RBtn title="Cut"><Scissors size={10} /><span style={{fontSize:7}}>Cut</span></RBtn>
              <RBtn title="Copy"><Copy size={10} /><span style={{fontSize:7}}>Copy</span></RBtn>
            </div>
          </RGroup>

          <RGroup label="Slides">
            <RBtn onClick={() => onAddSlide()} title="New Slide"><Plus size={14} /><span style={{fontSize:8}}>New Slide</span></RBtn>
            <div style={{display:'flex',flexDirection:'column',gap:2}}>
              <RBtn onClick={onDuplicateSlide} title="Duplicate Slide"><Copy size={10} /><span style={{fontSize:7}}>Duplicate</span></RBtn>
              <div style={{position:'relative'}}>
                <RBtn onClick={() => setLayoutOpen(v => !v)} title="Layout" active={layoutOpen}><LayoutTemplate size={10} /><span style={{fontSize:7}}>Layout</span></RBtn>
                {layoutOpen && (
                  <div style={{position:'absolute',top:'100%',left:0,zIndex:999,background:'#222',border:`1px solid ${IR.groupBorder}`,borderRadius:2,width:140,padding:4}}>
                    {SLIDE_LAYOUTS.map(l => (
                      <div key={l.id} onClick={() => { onApplyLayout(l.id); setLayoutOpen(false); }}
                        style={{padding:'4px 8px',cursor:'pointer',color:slide?.layout===l.id?IR.accent:IR.text,fontSize:10,borderRadius:2,background:slide?.layout===l.id?`${IR.accent}15`:'transparent'}}
                        onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='#333'}
                        onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background=slide?.layout===l.id?`${IR.accent}15`:'transparent'}>
                        {l.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <RBtn onClick={onDeleteSlide} disabled={slides.length<=1} title="Delete Slide"><Trash2 size={10} /><span style={{fontSize:7}}>Delete</span></RBtn>
            </div>
          </RGroup>

          <RGroup label="Font">
            <div style={{display:'flex',flexDirection:'column',gap:3}}>
              <div style={{display:'flex',gap:3,alignItems:'center'}}>
                <select value={selEl?.fontSize ?? 14} onChange={e => selEl && onUpdateElement(selEl.id, {fontSize:+e.target.value})}
                  style={{background:'#2a2a2a',border:`1px solid #444`,color:IR.text,fontSize:10,padding:'1px 4px',borderRadius:2,width:52}}>
                  {[10,12,14,18,24,28,32,36,40,48,54,60,72].map(s=><option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div style={{display:'flex',gap:2}}>
                <RBtn onClick={()=>selEl&&onUpdateElement(selEl.id,{bold:!selEl.bold})} active={!!selEl?.bold} title="Bold" style={{fontWeight:'bold',minWidth:24}}><Bold size={10} /></RBtn>
                <RBtn onClick={()=>selEl&&onUpdateElement(selEl.id,{italic:!selEl.italic})} active={!!selEl?.italic} title="Italic" style={{fontStyle:'italic',minWidth:24}}><Italic size={10} /></RBtn>
                <RBtn onClick={()=>selEl&&onUpdateElement(selEl.id,{underline:!selEl.underline})} active={!!selEl?.underline} title="Underline" style={{minWidth:24}}><Underline size={10} /></RBtn>
                <RBtn onClick={()=>selEl&&onUpdateElement(selEl.id,{strikethrough:!selEl.strikethrough})} active={!!selEl?.strikethrough} title="Strikethrough" style={{minWidth:24}}><Strikethrough size={10} /></RBtn>
              </div>
            </div>
          </RGroup>

          <RGroup label="Paragraph">
            <div style={{display:'flex',flexDirection:'column',gap:2}}>
              <div style={{display:'flex',gap:2}}>
                <RBtn onClick={()=>selEl&&onUpdateElement(selEl.id,{align:'left'})} active={selEl?.align==='left'||!selEl?.align} title="Align Left"><AlignLeft size={10} /></RBtn>
                <RBtn onClick={()=>selEl&&onUpdateElement(selEl.id,{align:'center'})} active={selEl?.align==='center'} title="Center"><AlignCenter size={10} /></RBtn>
                <RBtn onClick={()=>selEl&&onUpdateElement(selEl.id,{align:'right'})} active={selEl?.align==='right'} title="Align Right"><AlignRight size={10} /></RBtn>
              </div>
              <div style={{display:'flex',gap:2}}>
                <RBtn title="Bullet List"><List size={10} /></RBtn>
                <RBtn title="Numbered List"><ListOrdered size={10} /></RBtn>
                <RBtn title="Indent"><Indent size={10} /></RBtn>
                <RBtn title="Outdent"><Outdent size={10} /></RBtn>
              </div>
            </div>
          </RGroup>

          <RGroup label="Drawing">
            <RBtn title="Shapes"><Shapes size={14} /><span style={{fontSize:8}}>Shapes</span></RBtn>
            <RBtn title="Arrange"><Layers size={14} /><span style={{fontSize:8}}>Arrange</span></RBtn>
            <RBtn title="Quick Styles"><Wand2 size={14} /><span style={{fontSize:8}}>Quick Styles</span></RBtn>
          </RGroup>
        </>)}

        {/* ── INSERT ───────────────────────────────────── */}
        {ribbonTab === 'Insert' && (<>
          <RGroup label="Slides">
            <RBtn onClick={()=>onAddSlide()} title="New Slide"><Plus size={14} /><span style={{fontSize:8}}>New Slide</span></RBtn>
          </RGroup>
          <RGroup label="Tables">
            <RBtn title="Table"><BarChart2 size={14} /><span style={{fontSize:8}}>Table</span></RBtn>
          </RGroup>
          <RGroup label="Images">
            <RBtn title="Pictures"><Image size={14} /><span style={{fontSize:8}}>Pictures</span></RBtn>
          </RGroup>
          <RGroup label="Illustrations">
            <RBtn title="Shapes"><Shapes size={14} /><span style={{fontSize:8}}>Shapes</span></RBtn>
            <RBtn title="Chart"><BarChart2 size={14} /><span style={{fontSize:8}}>Chart</span></RBtn>
          </RGroup>
          <RGroup label="Text">
            <RBtn onClick={onAddTextBox} title="Text Box"><Type size={14} /><span style={{fontSize:8}}>Text Box</span></RBtn>
            <RBtn title="Header &amp; Footer"><Baseline size={14} /><span style={{fontSize:8}}>Header</span></RBtn>
            <RBtn title="Word Art"><Wand2 size={14} /><span style={{fontSize:8}}>WordArt</span></RBtn>
          </RGroup>
          <RGroup label="Symbols">
            <RBtn onClick={onInsertDate} title="Date &amp; Time"><Calendar size={14} /><span style={{fontSize:8}}>Date &amp; Time</span></RBtn>
            <RBtn onClick={onInsertSlideNumber} title="Slide Number"><Hash size={14} /><span style={{fontSize:8}}>Slide #</span></RBtn>
          </RGroup>
          <RGroup label="Links">
            <RBtn title="Hyperlink"><Link2 size={14} /><span style={{fontSize:8}}>Link</span></RBtn>
          </RGroup>
          <RGroup label="Comments">
            <RBtn onClick={onAddComment} title="Comment"><MessageSquare size={14} /><span style={{fontSize:8}}>Comment</span></RBtn>
          </RGroup>
        </>)}

        {/* ── DESIGN ───────────────────────────────────── */}
        {ribbonTab === 'Design' && (<>
          <RGroup label="Themes">
            <div style={{display:'flex',gap:4,alignItems:'center',padding:'4px 0'}}>
              {THEMES.map(t => (
                <button key={t.id} onClick={()=>onApplyTheme(t.id)} title={t.name}
                  style={{width:38,height:28,background:t.bg,border:`2px solid ${slide?.themeId===t.id?IR.accent:IR.groupBorder}`,borderRadius:2,cursor:'pointer',position:'relative',overflow:'hidden',display:'flex',flexDirection:'column',justifyContent:'flex-end',padding:2}}>
                  <div style={{height:3,background:t.accent,width:'100%'}} />
                  <div style={{position:'absolute',top:4,left:3,fontSize:6,color:t.title,fontWeight:'bold'}}>Aa</div>
                </button>
              ))}
            </div>
          </RGroup>
          <RGroup label="Variants">
            <div style={{display:'flex',gap:4,alignItems:'center',padding:'4px 0'}}>
              {THEME_VARIANTS.map(v => {
                const baseTheme = THEMES.find(t=>t.id===slide?.themeId)??THEMES[0];
                const mod = v.mod(baseTheme);
                return (
                  <button key={v.id} onClick={()=>onApplyVariant(v.id)} title={v.name}
                    style={{width:28,height:28,background:mod.bg,border:`2px solid ${slide?.variant===v.id?IR.accent:IR.groupBorder}`,borderRadius:2,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <div style={{fontSize:8,color:mod.title,fontWeight:'bold'}}>Aa</div>
                  </button>
                );
              })}
            </div>
          </RGroup>
          <RGroup label="Customize">
            <div style={{display:'flex',flexDirection:'column',gap:3,padding:'2px 0'}}>
              <RBtn title="Slide Size"><Maximize size={10} /><span style={{fontSize:8}}>Slide Size</span></RBtn>
              <RBtn title="Format Background"><Palette size={10} /><span style={{fontSize:8}}>Background</span></RBtn>
            </div>
          </RGroup>
          <RGroup label="Edit">
            <RBtn title="Design Suggestions"><Sparkles size={14} /><span style={{fontSize:8}}>Suggestions</span></RBtn>
          </RGroup>
        </>)}

        {/* ── TRANSITIONS ──────────────────────────────── */}
        {ribbonTab === 'Transitions' && (<>
          <RGroup label="Preview">
            <RBtn onClick={onPreviewTransition} title="Preview"><Play size={14} /><span style={{fontSize:8}}>Preview</span></RBtn>
          </RGroup>
          <RGroup label="Transition to This Slide">
            <div style={{display:'flex',gap:3,flexWrap:'wrap',alignItems:'center',maxWidth:380,padding:'2px 0'}}>
              {TRANSITIONS.map(tr => (
                <button key={tr.id} onClick={()=>onApplyTransition(tr.id)} title={tr.name}
                  style={{background:slide?.transition===tr.id?`${IR.accent}20`:IR.btn,border:`1px solid ${slide?.transition===tr.id?IR.accent:IR.groupBorder}`,color:slide?.transition===tr.id?IR.accent:IR.text,cursor:'pointer',padding:'3px 6px',borderRadius:2,fontSize:9,display:'flex',flexDirection:'column',alignItems:'center',gap:1,minWidth:36}}
                  onMouseEnter={e=>{if(slide?.transition!==tr.id)(e.currentTarget as HTMLElement).style.background=IR.btnHover;}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background=slide?.transition===tr.id?`${IR.accent}20`:IR.btn;}}>
                  <span style={{fontSize:13}}>{tr.icon}</span>
                  <span style={{fontSize:7}}>{tr.name}</span>
                </button>
              ))}
            </div>
          </RGroup>
          <RGroup label="Timing">
            <div style={{display:'flex',flexDirection:'column',gap:4,padding:'2px 0'}}>
              <div style={{display:'flex',alignItems:'center',gap:6}}>
                <div style={{position:'relative'}}>
                  <button onClick={()=>setSoundOpen(v=>!v)}
                    style={{background:'#2a2a2a',border:`1px solid #444`,color:IR.text,fontSize:9,padding:'2px 6px',borderRadius:2,cursor:'pointer',display:'flex',alignItems:'center',gap:4}}>
                    <Volume2 size={9}/> {slide?.transitionSound ?? 'No Sound'} <ChevronDown size={8}/>
                  </button>
                  {soundOpen && (
                    <div style={{position:'absolute',top:'100%',left:0,zIndex:999,background:'#222',border:`1px solid #444`,borderRadius:2,width:120,maxHeight:160,overflow:'auto',padding:2}}>
                      {TRANSITION_SOUNDS.map(s=>(
                        <div key={s} onClick={()=>{onSetTransitionSound(s);setSoundOpen(false);}}
                          style={{padding:'3px 8px',cursor:'pointer',color:slide?.transitionSound===s?IR.accent:IR.text,fontSize:9,borderRadius:2}}
                          onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='#333'}
                          onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='transparent'}>
                          {s}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:6}}>
                <span style={{fontSize:9,color:IR.dim,width:50}}>Duration:</span>
                <input type="number" min={0.25} max={10} step={0.25}
                  value={slide?.transitionDuration ?? 2}
                  onChange={e=>onSetTransitionDuration(+e.target.value)}
                  style={{background:'#2a2a2a',border:`1px solid #444`,color:IR.text,fontSize:9,padding:'2px 4px',borderRadius:2,width:50,textAlign:'right'}} />
                <span style={{fontSize:9,color:'#555'}}>s</span>
              </div>
              <div style={{display:'flex',gap:6}}>
                <RBtn onClick={onApplyToAll} title="Apply to All Slides" style={{fontSize:8}}>Apply To All</RBtn>
              </div>
            </div>
          </RGroup>
        </>)}

        {/* ── ANIMATIONS ───────────────────────────────── */}
        {ribbonTab === 'Animations' && (<>
          <RGroup label="Preview">
            <RBtn title="Preview"><Play size={14} /><span style={{fontSize:8}}>Preview</span></RBtn>
          </RGroup>
          <RGroup label="Animation">
            <div style={{display:'flex',gap:3,alignItems:'center',padding:'2px 0'}}>
              {ANIMATIONS.map(an => (
                <button key={an.id} onClick={()=>selEl&&onUpdateElement(selEl.id,{animation:an.id})} title={an.name}
                  style={{background:selEl?.animation===an.id?`${IR.accent}20`:IR.btn,border:`1px solid ${selEl?.animation===an.id?IR.accent:IR.groupBorder}`,color:selEl?.animation===an.id?IR.accent:IR.text,cursor:'pointer',padding:'4px 5px',borderRadius:2,fontSize:9,display:'flex',flexDirection:'column',alignItems:'center',gap:2,minWidth:44}}
                  onMouseEnter={e=>{if(selEl?.animation!==an.id)(e.currentTarget as HTMLElement).style.background=IR.btnHover;}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background=selEl?.animation===an.id?`${IR.accent}20`:IR.btn;}}>
                  <span style={{fontSize:12,opacity:an.id==='none'?0.4:1}}>
                    {an.id==='none'?'○':an.id==='appear'?'◉':an.id==='fade'?'◐':an.id==='fly-in'?'↑':an.id==='float-in'?'↟':an.id==='split'?'⊕':'▶'}
                  </span>
                  <span style={{fontSize:7}}>{an.name}</span>
                </button>
              ))}
            </div>
          </RGroup>
          <RGroup label="Advanced Animation">
            <div style={{display:'flex',flexDirection:'column',gap:3}}>
              <RBtn title="Add Animation"><Sparkles size={10} /><span style={{fontSize:8}}>Add Animation</span></RBtn>
              <RBtn title="Animation Pane"><SplitSquareHorizontal size={10} /><span style={{fontSize:8}}>Animation Pane</span></RBtn>
            </div>
          </RGroup>
          <RGroup label="Timing">
            <div style={{display:'flex',flexDirection:'column',gap:4,padding:'2px 0'}}>
              <div style={{display:'flex',alignItems:'center',gap:6}}>
                <span style={{fontSize:9,color:IR.dim,width:36}}>Start:</span>
                <select value={selEl?.animStart??'on-click'} onChange={e=>selEl&&onUpdateElement(selEl.id,{animStart:e.target.value as 'on-click'|'with-prev'|'after-prev'})}
                  style={{background:'#2a2a2a',border:`1px solid #444`,color:IR.text,fontSize:9,padding:'2px 4px',borderRadius:2}}>
                  <option value="on-click">On Click</option>
                  <option value="with-prev">With Previous</option>
                  <option value="after-prev">After Previous</option>
                </select>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:6}}>
                <span style={{fontSize:9,color:IR.dim,width:36}}>Duration:</span>
                <input type="number" min={0.1} max={10} step={0.1} value={selEl?.animDuration??1}
                  onChange={e=>selEl&&onUpdateElement(selEl.id,{animDuration:+e.target.value})}
                  style={{background:'#2a2a2a',border:`1px solid #444`,color:IR.text,fontSize:9,padding:'2px 4px',borderRadius:2,width:48,textAlign:'right'}} />
                <span style={{fontSize:9,color:'#555'}}>s</span>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:6}}>
                <span style={{fontSize:9,color:IR.dim,width:36}}>Delay:</span>
                <input type="number" min={0} max={30} step={0.5} value={selEl?.animDelay??0}
                  onChange={e=>selEl&&onUpdateElement(selEl.id,{animDelay:+e.target.value})}
                  style={{background:'#2a2a2a',border:`1px solid #444`,color:IR.text,fontSize:9,padding:'2px 4px',borderRadius:2,width:48,textAlign:'right'}} />
                <span style={{fontSize:9,color:'#555'}}>s</span>
              </div>
            </div>
          </RGroup>
          <RGroup label="Reorder">
            <div style={{display:'flex',flexDirection:'column',gap:3}}>
              <RBtn title="Move Earlier"><MoveUp size={10} /><span style={{fontSize:7}}>Earlier</span></RBtn>
              <RBtn title="Move Later"><MoveDown size={10} /><span style={{fontSize:7}}>Later</span></RBtn>
            </div>
          </RGroup>
        </>)}

        {/* ── REVIEW ───────────────────────────────────── */}
        {ribbonTab === 'Review' && (<>
          <RGroup label="Proofing">
            <RBtn onClick={onToggleSpellCheck} active={spellCheck} title="Spell Check"><SpellCheck size={14} /><span style={{fontSize:8}}>Spelling</span></RBtn>
            <RBtn onClick={()=>window.open('https://www.merriam-webster.com/thesaurus','_blank')} title="Thesaurus"><BookOpen size={14} /><span style={{fontSize:8}}>Thesaurus</span></RBtn>
          </RGroup>
          <RGroup label="Language">
            <RBtn onClick={()=>window.open('https://translate.google.com','_blank')} title="Translate"><Languages size={14} /><span style={{fontSize:8}}>Translate</span></RBtn>
          </RGroup>
          <RGroup label="Comments">
            <RBtn onClick={onAddComment} title="New Comment"><MessageCircle size={14} /><span style={{fontSize:8}}>New Comment</span></RBtn>
            <RBtn onClick={()=>{ if(slide?.comments?.[0]) onDeleteComment(slide.comments[0].id); }} disabled={!commentCount} title="Delete Comment"><Trash size={14} /><span style={{fontSize:8}}>Delete</span></RBtn>
            <RBtn onClick={onPrevComment} disabled={!commentCount} title="Previous Comment"><ChevronLeft size={14} /><span style={{fontSize:8}}>Previous</span></RBtn>
            <RBtn onClick={onNextComment} disabled={!commentCount} title="Next Comment"><ChevronRight size={14} /><span style={{fontSize:8}}>Next</span></RBtn>
            <RBtn onClick={onToggleComments} active={showComments} title="Show/Hide Comments"><Eye size={14} /><span style={{fontSize:8}}>{showComments?'Hide':'Show'} Comments</span></RBtn>
          </RGroup>
          <RGroup label="Notes">
            <RBtn onClick={onToggleNotes} active={showNotes} title="Speaker Notes"><MessageSquare size={14} /><span style={{fontSize:8}}>Notes</span></RBtn>
          </RGroup>
          <RGroup label="Statistics">
            <div style={{display:'flex',flexDirection:'column',padding:'4px 6px',gap:2}}>
              <span style={{fontSize:9,color:IR.dim}}>Slides: <span style={{color:IR.text}}>{slides.length}</span></span>
              <span style={{fontSize:9,color:IR.dim}}>Words: <span style={{color:IR.text}}>{wordCount}</span></span>
              <span style={{fontSize:9,color:IR.dim}}>Comments: <span style={{color:IR.text}}>{slides.reduce((a,s)=>a+(s.comments?.length??0),0)}</span></span>
            </div>
          </RGroup>
        </>)}
      </div>
    </div>
  );
}

// ── CSS animations injected once ──────────────────────────────────
const IMPRESS_STYLE = `
@keyframes impress-appear{from{opacity:0}to{opacity:1}}
@keyframes impress-fade{from{opacity:0}to{opacity:1}}
@keyframes impress-fly-in{from{transform:translateY(40px);opacity:0}to{transform:translateY(0);opacity:1}}
@keyframes impress-float-in{from{transform:translateY(18px);opacity:0}to{transform:translateY(0);opacity:1}}
@keyframes impress-split{from{clip-path:inset(50% 0);opacity:0}to{clip-path:inset(0 0);opacity:1}}
@keyframes impress-wipe{from{clip-path:inset(0 100% 0 0);opacity:0}to{clip-path:inset(0 0 0 0);opacity:1}}
.impress-appear{animation:impress-appear 0.2s ease both}
.impress-fade{animation:impress-fade 0.6s ease both}
.impress-fly-in{animation:impress-fly-in 0.5s cubic-bezier(.2,.8,.4,1) both}
.impress-float-in{animation:impress-float-in 0.7s ease both}
.impress-split{animation:impress-split 0.5s ease both}
.impress-wipe{animation:impress-wipe 0.5s ease both}
`;

function ImpressApp() {
  const [slides, setSlides]             = useState<Slide[]>(loadImpress);
  const [activeIdx, setActiveIdx]       = useState(0);
  const [editingEl, setEditingEl]       = useState<string | null>(null);
  const [selectedElId, setSelectedElId] = useState<string | null>(null);
  const [editText, setEditText]         = useState('');
  const [ribbonTab, setRibbonTab]       = useState('Home');
  const [showNotes, setShowNotes]       = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [spellCheck, setSpellCheck]     = useState(true);
  const [previewing, setPreviewing]     = useState(false);
  const [commentInput, setCommentInput] = useState<string | null>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  const slide = slides[Math.min(activeIdx, slides.length - 1)];
  const theme = THEMES.find(t => t.id === slide?.themeId) ?? THEMES[0];
  const wordCount = slides.reduce((a, s) => a + s.elements.reduce((b, e) => b + (e.text?.trim().split(/\s+/).filter(Boolean).length ?? 0), 0), 0);
  const commentCount = slide?.comments?.length ?? 0;

  useEffect(() => { if (!document.getElementById('impress-anim-style')) { const s = document.createElement('style'); s.id = 'impress-anim-style'; s.textContent = IMPRESS_STYLE; document.head.appendChild(s); } }, []);
  useEffect(() => { saveImpress(slides); }, [slides]);
  useEffect(() => { if (editingEl && textRef.current) textRef.current.focus(); }, [editingEl]);

  const updateElement = useCallback((elId: string, patch: Partial<SlideElement>) => {
    setSlides(prev => prev.map((s, i) => i === activeIdx ? {
      ...s, elements: s.elements.map(e => e.id === elId ? { ...e, ...patch } : e),
    } : s));
  }, [activeIdx]);

  const updateSlide = useCallback((patch: Partial<Slide>) => {
    setSlides(prev => prev.map((s, i) => i === activeIdx ? { ...s, ...patch } : s));
  }, [activeIdx]);

  const commitEdit = () => {
    if (editingEl) updateElement(editingEl, { text: editText });
    setEditingEl(null);
    setEditText('');
  };

  const addSlide = (layout = 'title-content') => {
    const ns = newSlide(slide?.themeId ?? 'dark', slides.length + 1, layout);
    setSlides(prev => [...prev, ns]);
    setActiveIdx(slides.length);
  };

  const duplicateSlide = () => {
    const dup = { ...slide, id: crypto.randomUUID(), elements: slide.elements.map(e => ({ ...e, id: e.id + '-dup' })) };
    setSlides(prev => [...prev.slice(0, activeIdx + 1), dup, ...prev.slice(activeIdx + 1)]);
    setActiveIdx(activeIdx + 1);
  };

  const deleteSlide = () => {
    if (slides.length <= 1) return;
    setSlides(prev => prev.filter((_, i) => i !== activeIdx));
    setActiveIdx(Math.max(0, activeIdx - 1));
  };

  const applyToAll = () => {
    setSlides(prev => prev.map(s => ({ ...s, transition: slide.transition, transitionDuration: slide.transitionDuration, transitionSound: slide.transitionSound })));
  };

  const addTextBox = () => {
    const id = crypto.randomUUID();
    updateSlide({ elements: [...(slide?.elements ?? []), { id, type: 'textbox', text: 'Text box', align: 'left', fontSize: 14 }] });
    setSelectedElId(id);
    setEditingEl(id);
    setEditText('Text box');
  };

  const insertDate = () => {
    if (!selectedElId) return;
    const dateStr = new Date().toLocaleDateString();
    const el = slide.elements.find(e => e.id === selectedElId);
    if (el) updateElement(selectedElId, { text: el.text + ' ' + dateStr });
  };

  const insertSlideNumber = () => {
    updateSlide({ showSlideNumber: !slide?.showSlideNumber });
  };

  const addComment = () => {
    setCommentInput('');
  };

  const submitComment = () => {
    if (commentInput === null) return;
    const comment: SlideComment = { id: crypto.randomUUID(), text: commentInput, author: 'Student', timestamp: new Date().toLocaleString() };
    updateSlide({ comments: [...(slide?.comments ?? []), comment] });
    setCommentInput(null);
    setShowComments(true);
  };

  const deleteComment = (id: string) => {
    updateSlide({ comments: slide.comments?.filter(c => c.id !== id) ?? [] });
  };

  const previewTransition = () => {
    setPreviewing(true);
    setTimeout(() => setPreviewing(false), (slide?.transitionDuration ?? 2) * 1000 + 200);
  };

  const getTransitionStyle = (): React.CSSProperties => {
    if (!previewing) return {};
    const t = slide?.transition ?? 'none';
    const dur = slide?.transitionDuration ?? 2;
    if (t === 'fade') return { animation: `impress-fade ${dur}s ease both` };
    if (t === 'fly-in' || t === 'push') return { animation: `impress-fly-in ${dur * 0.5}s cubic-bezier(.2,.8,.4,1) both` };
    if (t === 'wipe' || t === 'reveal' || t === 'uncover' || t === 'cover') return { animation: `impress-wipe ${dur * 0.5}s ease both` };
    if (t === 'split') return { animation: `impress-split ${dur * 0.5}s ease both` };
    return {};
  };

  const getElementStyle = (el: SlideElement, isTitle: boolean): React.CSSProperties => {
    const anim = ANIMATIONS.find(a => a.id === (el.animation ?? 'none'));
    return {
      color: isTitle ? theme.title : theme.body,
      fontFamily: isTitle ? '"Segoe UI", system-ui, sans-serif' : '"Courier New", monospace',
      fontSize: el.fontSize ?? (isTitle ? 22 : 13),
      fontWeight: el.bold || isTitle ? 'bold' : 'normal',
      fontStyle: el.italic ? 'italic' : 'normal',
      textDecoration: [el.underline ? 'underline' : '', el.strikethrough ? 'line-through' : ''].filter(Boolean).join(' ') || 'none',
      textAlign: el.align ?? (isTitle ? 'left' : 'left'),
      lineHeight: 1.6,
      whiteSpace: 'pre-wrap',
      opacity: el.text ? 1 : 0.3,
      animationDuration: `${el.animDuration ?? 1}s`,
      animationDelay: `${el.animDelay ?? 0}s`,
    };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#111' }}>
      <PresentationRibbon
        slides={slides} activeIdx={activeIdx} slide={slide} selectedElId={selectedElId}
        ribbonTab={ribbonTab} onRibbonTab={setRibbonTab}
        showNotes={showNotes} onToggleNotes={() => setShowNotes(v => !v)}
        showComments={showComments} onToggleComments={() => setShowComments(v => !v)}
        spellCheck={spellCheck} onToggleSpellCheck={() => setSpellCheck(v => !v)}
        onAddSlide={addSlide} onDuplicateSlide={duplicateSlide} onDeleteSlide={deleteSlide}
        onApplyTheme={(id) => updateSlide({ themeId: id })}
        onApplyVariant={(id) => updateSlide({ variant: id })}
        onApplyLayout={(id) => updateSlide({ layout: id })}
        onApplyTransition={(id) => updateSlide({ transition: id })}
        onSetTransitionDuration={(d) => updateSlide({ transitionDuration: d })}
        onSetTransitionSound={(s) => updateSlide({ transitionSound: s })}
        onApplyToAll={applyToAll}
        onUpdateElement={updateElement}
        onAddTextBox={addTextBox}
        onInsertDate={insertDate}
        onInsertSlideNumber={insertSlideNumber}
        onAddComment={addComment} onDeleteComment={deleteComment}
        onPrevComment={() => {}} onNextComment={() => {}}
        onPreviewTransition={previewTransition}
        wordCount={wordCount} commentCount={commentCount}
      />

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Slides panel */}
        <div style={{ width: 148, background: '#0d0d0d', borderRight: `1px solid ${O.border}`, overflow: 'auto', padding: '6px 5px', display: 'flex', flexDirection: 'column', gap: 5, flexShrink: 0 }}>
          {slides.map((s, i) => (
            <div key={s.id} style={{ position: 'relative' }}>
              <div style={{ fontSize: 8, color: O.veryDim, fontFamily: 'monospace', marginBottom: 2, textAlign: 'center' }}>{i + 1}</div>
              <SlideThumbnail slide={s} index={i} active={i === activeIdx} onClick={() => { commitEdit(); setActiveIdx(i); setSelectedElId(null); }} />
            </div>
          ))}
          <button onClick={() => addSlide()}
            style={{ background: 'transparent', border: `1px dashed ${O.impress}50`, color: `${O.impress}80`, cursor: 'pointer', borderRadius: 2, padding: '4px 0', fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
            <Plus size={9} /> Add
          </button>
        </div>

        {/* Main area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Canvas area */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1a1a', overflow: 'hidden', padding: 20 }}>
            {slide && (
              <div style={{ width: '100%', maxWidth: 720, aspectRatio: '16/9', background: theme.bg, borderRadius: 4, position: 'relative', boxShadow: '0 8px 40px rgba(0,0,0,0.8)', overflow: 'hidden', display: 'flex', flexDirection: 'column', ...getTransitionStyle() }}>
                {/* Accent bar */}
                <div style={{ height: 4, background: theme.accent, flexShrink: 0 }} />

                {slide.elements.map(el => {
                  const isTitle = el.type === 'title';
                  const isEditing = editingEl === el.id;
                  const isSelected = selectedElId === el.id;
                  const animCss = ANIMATIONS.find(a => a.id === (el.animation ?? 'none'))?.css ?? '';
                  return (
                    <div key={el.id}
                      onClick={() => setSelectedElId(el.id)}
                      onDoubleClick={() => { setEditingEl(el.id); setEditText(el.text); setSelectedElId(el.id); }}
                      style={{ padding: isTitle ? '20px 30px 10px' : '10px 30px 20px', flex: isTitle ? '0 0 auto' : 1, position: 'relative', cursor: 'default', outline: isSelected && !isEditing ? `1px dashed ${theme.accent}60` : 'none', outlineOffset: -2 }}>
                      {isEditing ? (
                        <textarea
                          ref={el.id === editingEl ? textRef : undefined}
                          value={editText}
                          onChange={e => setEditText(e.target.value)}
                          onBlur={commitEdit}
                          spellCheck={spellCheck}
                          onKeyDown={e => { if (e.key === 'Escape') commitEdit(); }}
                          style={{ width: '100%', height: isTitle ? 60 : 160, background: 'transparent', border: `1px dashed ${theme.accent}60`, color: isTitle ? theme.title : theme.body, fontFamily: isTitle ? '"Segoe UI", system-ui' : '"Courier New", monospace', fontSize: el.fontSize ?? (isTitle ? 22 : 14), fontWeight: el.bold || isTitle ? 'bold' : 'normal', fontStyle: el.italic ? 'italic' : 'normal', textDecoration: el.underline ? 'underline' : 'none', resize: 'none', outline: 'none', lineHeight: 1.5, padding: 4, textAlign: el.align ?? 'left' }}
                        />
                      ) : (
                        <div className={animCss} style={getElementStyle(el, isTitle)}>
                          {el.text || (isTitle ? 'Double-click to add title' : 'Double-click to add content')}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Slide number */}
                {slide.showSlideNumber && (
                  <div style={{ position: 'absolute', bottom: 8, right: 12, fontSize: 9, color: `${theme.body}50`, fontFamily: 'monospace' }}>
                    {activeIdx + 1}
                  </div>
                )}

                {/* Comments badge */}
                {showComments && (slide.comments?.length ?? 0) > 0 && (
                  <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {slide.comments!.map(c => (
                      <div key={c.id} style={{ background: '#2a2a00', border: '1px solid #666600', borderRadius: 3, padding: '4px 8px', fontSize: 9, color: '#ffff88', maxWidth: 180, lineHeight: 1.4 }}>
                        <div style={{ fontWeight: 'bold', marginBottom: 2, display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                          <span>{c.author}</span>
                          <button onClick={() => deleteComment(c.id)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: 0, fontSize: 9 }}>✕</button>
                        </div>
                        <div>{c.text}</div>
                        <div style={{ color: '#888', fontSize: 7, marginTop: 2 }}>{c.timestamp}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Comment input */}
          {commentInput !== null && (
            <div style={{ background: '#1a1a00', borderTop: `1px solid #444400`, padding: '6px 12px', flexShrink: 0, display: 'flex', gap: 6, alignItems: 'center' }}>
              <MessageCircle size={12} style={{ color: '#aaaa00' }} />
              <span style={{ fontSize: 10, color: '#888', minWidth: 50 }}>Comment:</span>
              <input autoFocus value={commentInput} onChange={e => setCommentInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') submitComment(); if (e.key === 'Escape') setCommentInput(null); }}
                placeholder="Type comment and press Enter…"
                style={{ flex: 1, background: '#222', border: '1px solid #444', color: '#ddd', padding: '3px 8px', fontSize: 10, borderRadius: 2, outline: 'none' }} />
              <button onClick={submitComment} style={{ background: '#333300', border: '1px solid #666600', color: '#ffff88', cursor: 'pointer', padding: '2px 10px', borderRadius: 2, fontSize: 10 }}>Add</button>
              <button onClick={() => setCommentInput(null)} style={{ background: 'transparent', border: '1px solid #444', color: '#888', cursor: 'pointer', padding: '2px 8px', borderRadius: 2, fontSize: 10 }}>Cancel</button>
            </div>
          )}

          {/* Notes panel */}
          {showNotes && (
            <div style={{ height: 100, borderTop: `1px solid ${O.border}`, background: '#141414', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 9, color: '#555', padding: '3px 10px', borderBottom: `1px solid ${O.border}`, fontFamily: 'monospace' }}>SPEAKER NOTES — Slide {activeIdx + 1}</div>
              <textarea value={slide?.notes ?? ''} onChange={e => updateSlide({ notes: e.target.value })}
                spellCheck={spellCheck}
                placeholder="Click to add notes…"
                style={{ flex: 1, background: 'transparent', border: 'none', color: '#bbb', fontFamily: 'monospace', fontSize: 11, padding: '6px 12px', resize: 'none', outline: 'none', lineHeight: 1.6 }} />
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
