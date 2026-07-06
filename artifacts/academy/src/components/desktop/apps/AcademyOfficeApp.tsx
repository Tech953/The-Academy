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
  AlignJustify, Baseline, Indent, Outdent, Shapes, Wand2, Download,
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
  u?: boolean;
  strike?: boolean;
  align?: 'left' | 'center' | 'right';
  valign?: 'top' | 'middle' | 'bottom';
  wrap?: boolean;
  fmt?: 'text' | 'number' | 'currency' | 'percent' | 'date' | 'time' | 'scientific';
  color?: string;
  bg?: string;
  fontSize?: number;
  border?: 'all' | 'outer' | 'bottom' | 'none';
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
  if (fmt === 'currency')   return `$${Number(val).toFixed(2)}`;
  if (fmt === 'percent')    return `${(Number(val) * 100).toFixed(1)}%`;
  if (fmt === 'number')     return String(Number(val).toLocaleString());
  if (fmt === 'scientific') { const n = Number(val); return isNaN(n) ? String(val) : n.toExponential(3); }
  if (fmt === 'date')       { const n = Number(val); if (!isNaN(n)) { const d = new Date(n * 86400000); return d.toLocaleDateString(); } return String(val); }
  if (fmt === 'time')       { const n = Number(val); if (!isNaN(n)) { const h = Math.floor(n*24); const m = Math.floor((n*24-h)*60); return `${h}:${String(m).padStart(2,'0')}`; } return String(val); }
  return String(val);
}

// ─────────────────────────────────────────────────────────────────
// CALC APP
// ─────────────────────────────────────────────────────────────────

interface CalcState {
  sheets: { name: string; data: SheetMap }[];
  activeSheet: number;
  sel: string;
  selRange: { start: string; end: string } | null;
  editMode: boolean;
  editVal: string;
  colWidths: Record<string, number>;
  showFormulas: boolean;
  showGridlines: boolean;
  filterActive: boolean;
  frozenRow: number;
  ribbonTab: string;
  namedRanges: { name: string; range: string }[];
  conditionalRules: { range: string; condition: 'gt' | 'lt' | 'eq' | 'contains'; value: string; color: string }[];
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
    selRange: null,
    editMode: false,
    editVal: '',
    colWidths: {},
    showFormulas: false,
    showGridlines: true,
    filterActive: false,
    frozenRow: 1,
    ribbonTab: 'Home',
    namedRanges: [],
    conditionalRules: [],
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
  try { localStorage.setItem('academy-calc-v1', JSON.stringify({ sheets: s.sheets, colWidths: s.colWidths, namedRanges: s.namedRanges, conditionalRules: s.conditionalRules })); } catch {}
}

// ── Spreadsheet Ribbon helpers ──────────────────────────────────────
const CR = {
  tab: '#1e1e1e', tabActive: '#252525',
  group: '#1e1e1e', groupBorder: '#2e2e2e',
  btn: 'transparent', btnHover: '#2e2e2e',
  text: '#ccc', dim: '#888', accent: O.calc,
};

function CBtn({ children, onClick, active = false, disabled = false, title, style: extraStyle }: { children: React.ReactNode; onClick?: () => void; active?: boolean; disabled?: boolean; title?: string; style?: React.CSSProperties }) {
  return (
    <button onClick={onClick} disabled={disabled} title={title}
      style={{ background: active ? `${CR.accent}20` : CR.btn, border: `1px solid ${active ? CR.accent + '60' : 'transparent'}`, color: disabled ? '#555' : active ? CR.accent : CR.text, cursor: disabled ? 'not-allowed' : 'pointer', padding: '3px 7px', borderRadius: 2, fontSize: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, minWidth: 28, lineHeight: 1.2, ...extraStyle }}
      onMouseEnter={e => { if (!disabled && !active) (e.currentTarget as HTMLElement).style.background = CR.btnHover; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = active ? `${CR.accent}20` : CR.btn; }}>
      {children}
    </button>
  );
}

function CGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', borderRight: `1px solid ${CR.groupBorder}`, paddingRight: 6, marginRight: 2, minWidth: 0 }}>
      <div style={{ display: 'flex', gap: 2, alignItems: 'flex-start', flex: 1, flexWrap: 'wrap' }}>{children}</div>
      <div style={{ fontSize: 8, color: '#555', textAlign: 'center', paddingTop: 2, letterSpacing: 0.5, whiteSpace: 'nowrap' }}>{label}</div>
    </div>
  );
}

const FILL_COLORS = ['#1a1a1a', '#2a2a2a', '#ff5f57', '#ffbd2e', '#28c840', '#1e90ff', '#ff69b4', '#9b59b6', '#00ced1', '#ff8c00', '#2e8b57', '#ffffff'];
const FONT_COLORS = ['#e0e0e0', '#ffffff', '#ff5f57', '#ffbd2e', '#28c840', '#4fc3f7', '#ff69b4', '#c792ea', '#80deea', '#ff8a65', '#aed581', '#888888'];
const BORDER_STYLES = [
  { id: 'all',    name: 'All Borders',   icon: '⊞' },
  { id: 'outer',  name: 'Outside Borders', icon: '□' },
  { id: 'bottom', name: 'Bottom Border', icon: '⊟' },
  { id: 'none',   name: 'No Border',     icon: '✕' },
];

interface SpreadsheetRibbonProps {
  state: CalcState;
  selCell: CellData;
  onTab: (t: string) => void;
  onFmt: (updates: Partial<CellData>) => void;
  onBold: () => void;
  onItalic: () => void;
  onUnderline: () => void;
  onStrike: () => void;
  onAlign: (a: 'left' | 'center' | 'right') => void;
  onValign: (v: 'top' | 'middle' | 'bottom') => void;
  onWrap: () => void;
  onNumberFmt: (f: CellData['fmt']) => void;
  onInsertRow: () => void;
  onInsertCol: () => void;
  onDeleteRow: () => void;
  onDeleteCol: () => void;
  onAutoSum: () => void;
  onSort: (asc: boolean) => void;
  onToggleFilter: () => void;
  onToggleFormulas: () => void;
  onToggleGridlines: () => void;
  onClearCell: () => void;
  onPrint: () => void;
  onAddSheet: () => void;
  onCountEmpty: () => void;
  onFreezeRow: () => void;
  onNameRange: () => void;
  onDefineName: () => void;
  onFillColor: (c: string) => void;
  onFontColor: (c: string) => void;
  onBorder: (b: CellData['border']) => void;
  onMerge: () => void;
  onConditionalHighlight: (condition: 'gt' | 'lt' | 'eq' | 'contains', value: string, color: string) => void;
  totalCells: number;
  activeCellCount: number;
}

function SpreadsheetRibbon({
  state, selCell, onTab,
  onFmt, onBold, onItalic, onUnderline, onStrike,
  onAlign, onValign, onWrap, onNumberFmt,
  onInsertRow, onInsertCol, onDeleteRow, onDeleteCol,
  onAutoSum, onSort, onToggleFilter,
  onToggleFormulas, onToggleGridlines,
  onClearCell, onPrint, onAddSheet,
  onCountEmpty, onFreezeRow, onNameRange, onDefineName,
  onFillColor, onFontColor, onBorder, onMerge,
  onConditionalHighlight,
  totalCells, activeCellCount,
}: SpreadsheetRibbonProps) {
  const [fillOpen, setFillOpen] = useState(false);
  const [fontColorOpen, setFontColorOpen] = useState(false);
  const [borderOpen, setBorderOpen] = useState(false);
  const [condOpen, setCondOpen] = useState(false);
  const [condForm, setCondForm] = useState<{ condition: 'gt' | 'lt' | 'eq' | 'contains'; value: string; color: string }>({ condition: 'gt', value: '', color: '#ff5f57' });
  const [nameOpen, setNameOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState('');

  const TABS = ['Home', 'Insert', 'Page Layout', 'Formulas', 'Data', 'Automate'];

  return (
    <div style={{ background: CR.tab, borderBottom: `1px solid ${CR.groupBorder}`, flexShrink: 0 }}>
      {/* Tab bar */}
      <div style={{ display: 'flex', paddingLeft: 8, borderBottom: `1px solid ${CR.groupBorder}` }}>
        {TABS.map(t => (
          <button key={t} onClick={() => onTab(t)}
            style={{ background: state.ribbonTab === t ? CR.tabActive : 'transparent', border: 'none', borderBottom: state.ribbonTab === t ? `2px solid ${CR.accent}` : '2px solid transparent', color: state.ribbonTab === t ? CR.accent : CR.dim, cursor: 'pointer', padding: '5px 12px', fontSize: 10, fontFamily: 'system-ui', letterSpacing: 0.3 }}>
            {t}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 9, color: '#555', alignSelf: 'center', paddingRight: 10, fontFamily: 'monospace' }}>
          {state.sel} · {activeCellCount}/{totalCells} cells
        </span>
      </div>

      {/* Content area */}
      <div style={{ display: 'flex', alignItems: 'stretch', padding: '4px 6px', gap: 2, minHeight: 64, overflowX: 'auto' }} onClick={() => { setFillOpen(false); setFontColorOpen(false); setBorderOpen(false); setCondOpen(false); setNameOpen(false); }}>

        {/* ── HOME ─────────────────────────────────────── */}
        {state.ribbonTab === 'Home' && (<>
          <CGroup label="Clipboard">
            <CBtn title="Paste"><Clipboard size={14} /><span style={{fontSize:8}}>Paste</span></CBtn>
            <div style={{display:'flex',flexDirection:'column',gap:2}}>
              <CBtn title="Cut"><Scissors size={10}/><span style={{fontSize:7}}>Cut</span></CBtn>
              <CBtn title="Copy"><Copy size={10}/><span style={{fontSize:7}}>Copy</span></CBtn>
            </div>
          </CGroup>

          <CGroup label="Font">
            <div style={{display:'flex',flexDirection:'column',gap:2}}>
              <div style={{display:'flex',gap:2,alignItems:'center'}}>
                <select value={selCell.fontSize ?? 11} onChange={e => onFmt({ fontSize: +e.target.value })}
                  style={{background:'#2a2a2a',border:`1px solid #444`,color:CR.text,fontSize:10,padding:'1px 4px',borderRadius:2,width:48}}>
                  {[8,9,10,11,12,14,16,18,20,24,28,36,48,72].map(s=><option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div style={{display:'flex',gap:2,flexWrap:'wrap'}}>
                <CBtn onClick={onBold} active={!!selCell.b} title="Bold" style={{fontWeight:'bold',minWidth:22,padding:'2px 4px'}}><Bold size={10}/></CBtn>
                <CBtn onClick={onItalic} active={!!selCell.i} title="Italic" style={{fontStyle:'italic',minWidth:22,padding:'2px 4px'}}><Italic size={10}/></CBtn>
                <CBtn onClick={onUnderline} active={!!selCell.u} title="Underline" style={{minWidth:22,padding:'2px 4px'}}><Underline size={10}/></CBtn>
                <CBtn onClick={onStrike} active={!!selCell.strike} title="Strikethrough" style={{minWidth:22,padding:'2px 4px'}}><Strikethrough size={10}/></CBtn>
                {/* Border picker */}
                <div style={{position:'relative'}}>
                  <CBtn onClick={e => { e.stopPropagation(); setBorderOpen(v=>!v); }} title="Borders" active={borderOpen} style={{padding:'2px 4px'}}>
                    <span style={{fontSize:11}}>⊞</span>
                  </CBtn>
                  {borderOpen && (
                    <div onClick={e=>e.stopPropagation()} style={{position:'absolute',top:'100%',left:0,zIndex:999,background:'#222',border:`1px solid #444`,borderRadius:2,padding:4,width:130}}>
                      {BORDER_STYLES.map(b => (
                        <div key={b.id} onClick={()=>{ onBorder(b.id as CellData['border']); setBorderOpen(false); }}
                          style={{padding:'3px 8px',cursor:'pointer',color:selCell.border===b.id?CR.accent:CR.text,fontSize:10,display:'flex',alignItems:'center',gap:6,borderRadius:2}}
                          onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='#333'}
                          onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='transparent'}>
                          <span style={{fontSize:13}}>{b.icon}</span>{b.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {/* Fill color */}
                <div style={{position:'relative'}}>
                  <CBtn onClick={e=>{ e.stopPropagation(); setFillOpen(v=>!v); }} title="Fill Color" active={fillOpen} style={{padding:'2px 4px'}}>
                    <div style={{width:10,height:10,background:selCell.bg??'#2a2a2a',border:'1px solid #555',borderRadius:1}}/>
                  </CBtn>
                  {fillOpen && (
                    <div onClick={e=>e.stopPropagation()} style={{position:'absolute',top:'100%',left:0,zIndex:999,background:'#222',border:`1px solid #444`,borderRadius:2,padding:6,display:'flex',flexWrap:'wrap',gap:3,width:92}}>
                      {FILL_COLORS.map(c=>(
                        <div key={c} onClick={()=>{ onFillColor(c); setFillOpen(false); }}
                          style={{width:16,height:16,background:c,border:`2px solid ${selCell.bg===c?'#fff':'#555'}`,borderRadius:2,cursor:'pointer'}}
                          title={c}/>
                      ))}
                      <div onClick={()=>{ onFillColor(''); setFillOpen(false); }} title="No fill"
                        style={{width:16,height:16,background:'transparent',border:'2px solid #555',borderRadius:2,cursor:'pointer',fontSize:8,color:'#888',display:'flex',alignItems:'center',justifyContent:'center'}}>✕</div>
                    </div>
                  )}
                </div>
                {/* Font color */}
                <div style={{position:'relative'}}>
                  <CBtn onClick={e=>{ e.stopPropagation(); setFontColorOpen(v=>!v); }} title="Font Color" active={fontColorOpen} style={{padding:'2px 4px'}}>
                    <Baseline size={10} style={{color:selCell.color??CR.text}}/>
                  </CBtn>
                  {fontColorOpen && (
                    <div onClick={e=>e.stopPropagation()} style={{position:'absolute',top:'100%',left:0,zIndex:999,background:'#222',border:`1px solid #444`,borderRadius:2,padding:6,display:'flex',flexWrap:'wrap',gap:3,width:92}}>
                      {FONT_COLORS.map(c=>(
                        <div key={c} onClick={()=>{ onFontColor(c); setFontColorOpen(false); }}
                          style={{width:16,height:16,background:c,border:`2px solid ${selCell.color===c?'#fff':'#555'}`,borderRadius:2,cursor:'pointer'}}
                          title={c}/>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CGroup>

          <CGroup label="Alignment">
            <div style={{display:'flex',flexDirection:'column',gap:2}}>
              <div style={{display:'flex',gap:2}}>
                <CBtn onClick={()=>onValign('top')} active={selCell.valign==='top'} title="Top Align" style={{padding:'2px 4px',fontSize:9}}>⬆</CBtn>
                <CBtn onClick={()=>onValign('middle')} active={selCell.valign==='middle'||!selCell.valign} title="Middle Align" style={{padding:'2px 4px',fontSize:9}}>↕</CBtn>
                <CBtn onClick={()=>onValign('bottom')} active={selCell.valign==='bottom'} title="Bottom Align" style={{padding:'2px 4px',fontSize:9}}>⬇</CBtn>
                <CBtn onClick={onWrap} active={!!selCell.wrap} title="Wrap Text" style={{padding:'2px 4px'}}><AlignJustify size={10}/></CBtn>
                <CBtn onClick={onMerge} title="Merge Cells" style={{padding:'2px 4px'}}><Maximize size={10}/></CBtn>
              </div>
              <div style={{display:'flex',gap:2}}>
                <CBtn onClick={()=>onAlign('left')} active={selCell.align==='left'||!selCell.align} title="Align Left" style={{padding:'2px 4px'}}><AlignLeft size={10}/></CBtn>
                <CBtn onClick={()=>onAlign('center')} active={selCell.align==='center'} title="Center" style={{padding:'2px 4px'}}><AlignCenter size={10}/></CBtn>
                <CBtn onClick={()=>onAlign('right')} active={selCell.align==='right'} title="Align Right" style={{padding:'2px 4px'}}><AlignRight size={10}/></CBtn>
                <CBtn title="Increase Indent" style={{padding:'2px 4px'}}><Indent size={10}/></CBtn>
                <CBtn title="Decrease Indent" style={{padding:'2px 4px'}}><Outdent size={10}/></CBtn>
              </div>
            </div>
          </CGroup>

          <CGroup label="Number">
            <div style={{display:'flex',flexDirection:'column',gap:3}}>
              <select value={selCell.fmt??''} onChange={e=>onNumberFmt(e.target.value as CellData['fmt'])}
                style={{background:'#2a2a2a',border:`1px solid #444`,color:CR.text,fontSize:10,padding:'2px 4px',borderRadius:2,width:90}}>
                <option value="">General</option>
                <option value="number">Number</option>
                <option value="currency">Currency ($)</option>
                <option value="percent">Percent (%)</option>
                <option value="date">Date</option>
                <option value="time">Time</option>
                <option value="scientific">Scientific</option>
                <option value="text">Text</option>
              </select>
              <div style={{display:'flex',gap:2}}>
                <CBtn onClick={()=>onNumberFmt('currency')} active={selCell.fmt==='currency'} title="Currency" style={{fontSize:11,padding:'2px 5px'}}>$</CBtn>
                <CBtn onClick={()=>onNumberFmt('percent')} active={selCell.fmt==='percent'} title="Percent" style={{fontSize:11,padding:'2px 5px'}}>%</CBtn>
                <CBtn onClick={()=>onNumberFmt('number')} active={selCell.fmt==='number'} title="Comma" style={{fontSize:11,padding:'2px 5px'}}>,</CBtn>
                <CBtn onClick={()=>onFmt({v: String((parseFloat(selCell.v||'0')+1).toFixed(2))})} title="Increase Decimals" style={{fontSize:9,padding:'2px 4px'}}>.0</CBtn>
                <CBtn onClick={()=>onFmt({v: String((parseFloat(selCell.v||'0')).toFixed(0))})} title="Decrease Decimals" style={{fontSize:9,padding:'2px 4px'}}>0.</CBtn>
              </div>
            </div>
          </CGroup>

          <CGroup label="Styles">
            <div style={{display:'flex',flexDirection:'column',gap:3}}>
              <div style={{position:'relative'}}>
                <CBtn onClick={e=>{e.stopPropagation();setCondOpen(v=>!v);}} active={condOpen} title="Conditional Formatting" style={{fontSize:9,padding:'3px 8px',width:130}}>
                  <span style={{display:'flex',alignItems:'center',gap:4}}><Sparkles size={10}/> Conditional Formatting</span>
                </CBtn>
                {condOpen && (
                  <div onClick={e=>e.stopPropagation()} style={{position:'absolute',top:'100%',left:0,zIndex:999,background:'#222',border:`1px solid #444`,borderRadius:2,padding:10,width:220}}>
                    <div style={{fontSize:10,color:CR.text,marginBottom:6}}>Highlight cells where value:</div>
                    <div style={{display:'flex',flexDirection:'column',gap:6}}>
                      <select value={condForm.condition} onChange={e=>setCondForm(p=>({...p,condition:e.target.value as typeof condForm.condition}))}
                        style={{background:'#2a2a2a',border:`1px solid #444`,color:CR.text,fontSize:10,padding:'2px 4px',borderRadius:2}}>
                        <option value="gt">is greater than</option>
                        <option value="lt">is less than</option>
                        <option value="eq">equals</option>
                        <option value="contains">contains</option>
                      </select>
                      <input value={condForm.value} onChange={e=>setCondForm(p=>({...p,value:e.target.value}))} placeholder="Value..." style={{background:'#2a2a2a',border:`1px solid #444`,color:CR.text,fontSize:10,padding:'2px 6px',borderRadius:2,outline:'none'}}/>
                      <div style={{display:'flex',gap:4,alignItems:'center'}}>
                        <span style={{fontSize:10,color:CR.dim}}>Color:</span>
                        {['#ff5f57','#ffbd2e','#28c840','#1e90ff','#ff69b4'].map(c=>(
                          <div key={c} onClick={()=>setCondForm(p=>({...p,color:c}))} style={{width:16,height:16,background:c,border:`2px solid ${condForm.color===c?'#fff':'#555'}`,borderRadius:2,cursor:'pointer'}}/>
                        ))}
                      </div>
                      <button onClick={()=>{ onConditionalHighlight(condForm.condition,condForm.value,condForm.color); setCondOpen(false); }}
                        style={{background:CR.accent+'20',border:`1px solid ${CR.accent}60`,color:CR.accent,cursor:'pointer',padding:'3px 8px',borderRadius:2,fontSize:10}}>Apply Rule</button>
                    </div>
                  </div>
                )}
              </div>
              <CBtn onClick={onClearCell} title="Clear Cell" style={{fontSize:9,padding:'3px 8px',width:130}}>
                <span style={{display:'flex',alignItems:'center',gap:4}}><Trash size={10}/> Clear Cell</span>
              </CBtn>
            </div>
          </CGroup>

          <CGroup label="Cells">
            <div style={{display:'flex',flexDirection:'column',gap:2}}>
              <div style={{display:'flex',gap:2}}>
                <CBtn onClick={onInsertRow} title="Insert Row Below"><Plus size={10}/><span style={{fontSize:7}}>Row</span></CBtn>
                <CBtn onClick={onInsertCol} title="Insert Column Right"><Plus size={10}/><span style={{fontSize:7}}>Col</span></CBtn>
              </div>
              <div style={{display:'flex',gap:2}}>
                <CBtn onClick={onDeleteRow} title="Delete Row" style={{color:'#e06c75'}}><Trash2 size={10}/><span style={{fontSize:7}}>Row</span></CBtn>
                <CBtn onClick={onDeleteCol} title="Delete Column" style={{color:'#e06c75'}}><Trash2 size={10}/><span style={{fontSize:7}}>Col</span></CBtn>
              </div>
            </div>
          </CGroup>

          <CGroup label="Editing">
            <CBtn onClick={onAutoSum} title="AutoSum (Σ)" style={{fontSize:13,fontWeight:'bold'}}>Σ<span style={{fontSize:8}}>AutoSum</span></CBtn>
            <div style={{display:'flex',flexDirection:'column',gap:2}}>
              <CBtn onClick={()=>onSort(true)} title="Sort A→Z" style={{fontSize:9,padding:'2px 5px'}}>A↑Z</CBtn>
              <CBtn onClick={()=>onSort(false)} title="Sort Z→A" style={{fontSize:9,padding:'2px 5px'}}>Z↑A</CBtn>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:2}}>
              <CBtn onClick={onToggleFilter} active={state.filterActive} title="Toggle Filter" style={{fontSize:9,padding:'2px 5px'}}>
                <BarChart2 size={10}/><span style={{fontSize:7}}>Filter</span>
              </CBtn>
              <CBtn onClick={onClearCell} title="Clear" style={{fontSize:9,padding:'2px 5px'}}>
                <Trash size={10}/><span style={{fontSize:7}}>Clear</span>
              </CBtn>
            </div>
          </CGroup>
        </>)}

        {/* ── INSERT ───────────────────────────────────── */}
        {state.ribbonTab === 'Insert' && (<>
          <CGroup label="Tables">
            <CBtn title="PivotTable" style={{fontSize:9}}><BarChart2 size={14}/><span>PivotTable</span></CBtn>
            <CBtn title="Table" style={{fontSize:9}}><LayoutTemplate size={14}/><span>Table</span></CBtn>
          </CGroup>
          <CGroup label="Illustrations">
            <CBtn title="Pictures"><Image size={14}/><span style={{fontSize:8}}>Pictures</span></CBtn>
            <CBtn title="Shapes"><Shapes size={14}/><span style={{fontSize:8}}>Shapes</span></CBtn>
            <CBtn title="Icons"><Sparkles size={14}/><span style={{fontSize:8}}>Icons</span></CBtn>
          </CGroup>
          <CGroup label="Charts">
            <CBtn title="Recommended Charts" style={{fontSize:9}}><BarChart2 size={14}/><span>Bar</span></CBtn>
            <CBtn title="Line Chart" style={{fontSize:9}}><Wind size={14}/><span>Line</span></CBtn>
            <CBtn title="Column Chart" style={{fontSize:9}}><Layers size={14}/><span>Column</span></CBtn>
          </CGroup>
          <CGroup label="Links">
            <CBtn title="Insert Hyperlink"><Link2 size={14}/><span style={{fontSize:8}}>Link</span></CBtn>
          </CGroup>
          <CGroup label="Comments">
            <CBtn title="New Comment"><MessageSquare size={14}/><span style={{fontSize:8}}>Comment</span></CBtn>
          </CGroup>
          <CGroup label="Symbols">
            <CBtn title="Insert Symbol"><Hash size={14}/><span style={{fontSize:8}}>Symbol</span></CBtn>
          </CGroup>
          <CGroup label="Sheets">
            <CBtn onClick={onAddSheet} title="Add Sheet"><Plus size={14}/><span style={{fontSize:8}}>New Sheet</span></CBtn>
          </CGroup>
        </>)}

        {/* ── PAGE LAYOUT ──────────────────────────────── */}
        {state.ribbonTab === 'Page Layout' && (<>
          <CGroup label="Themes">
            <CBtn title="Colors"><Palette size={14}/><span style={{fontSize:8}}>Colors</span></CBtn>
            <CBtn title="Fonts"><Type size={14}/><span style={{fontSize:8}}>Fonts</span></CBtn>
          </CGroup>
          <CGroup label="Page Setup">
            <CBtn title="Margins" style={{fontSize:9}}>Margins</CBtn>
            <CBtn title="Orientation" style={{fontSize:9}}>Orientation</CBtn>
            <CBtn title="Size" style={{fontSize:9}}>Size</CBtn>
            <CBtn title="Print Area" style={{fontSize:9}}>Print Area</CBtn>
            <CBtn title="Breaks" style={{fontSize:9}}>Breaks</CBtn>
            <CBtn title="Background"><Image size={14}/><span style={{fontSize:8}}>Background</span></CBtn>
          </CGroup>
          <CGroup label="Sheet Options">
            <div style={{display:'flex',flexDirection:'column',gap:4}}>
              <div style={{display:'flex',alignItems:'center',gap:6}}>
                <span style={{fontSize:9,color:CR.dim,width:60}}>Gridlines</span>
                <CBtn onClick={onToggleGridlines} active={state.showGridlines} title="Show/Hide Gridlines" style={{fontSize:9,padding:'2px 6px'}}>{state.showGridlines?'Hide':'Show'}</CBtn>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:6}}>
                <span style={{fontSize:9,color:CR.dim,width:60}}>Headings</span>
                <CBtn title="Show Headings" active style={{fontSize:9,padding:'2px 6px'}}>Show</CBtn>
              </div>
              <CBtn onClick={onPrint} title="Print" style={{fontSize:9,padding:'2px 8px'}}><span style={{display:'flex',alignItems:'center',gap:4}}><Copy size={10}/> Print</span></CBtn>
            </div>
          </CGroup>
          <CGroup label="Scale to Fit">
            <div style={{display:'flex',flexDirection:'column',gap:4,padding:'2px 0'}}>
              <div style={{display:'flex',alignItems:'center',gap:6}}>
                <span style={{fontSize:9,color:CR.dim,width:40}}>Width:</span>
                <select style={{background:'#2a2a2a',border:`1px solid #444`,color:CR.text,fontSize:9,padding:'1px 4px',borderRadius:2,width:80}}>
                  <option>Automatic</option><option>1 page</option><option>2 pages</option>
                </select>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:6}}>
                <span style={{fontSize:9,color:CR.dim,width:40}}>Height:</span>
                <select style={{background:'#2a2a2a',border:`1px solid #444`,color:CR.text,fontSize:9,padding:'1px 4px',borderRadius:2,width:80}}>
                  <option>Automatic</option><option>1 page</option><option>2 pages</option>
                </select>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:6}}>
                <span style={{fontSize:9,color:CR.dim,width:40}}>Scale:</span>
                <input type="number" defaultValue={100} style={{background:'#2a2a2a',border:`1px solid #444`,color:CR.text,fontSize:9,padding:'1px 4px',borderRadius:2,width:50,textAlign:'right'}}/>
                <span style={{fontSize:9,color:'#555'}}>%</span>
              </div>
            </div>
          </CGroup>
        </>)}

        {/* ── FORMULAS ─────────────────────────────────── */}
        {state.ribbonTab === 'Formulas' && (<>
          <CGroup label="Function Library">
            <CBtn onClick={onAutoSum} title="AutoSum" style={{fontSize:13,fontWeight:'bold',padding:'4px 6px'}}>Σ<span style={{fontSize:8}}>AutoSum</span></CBtn>
            <div style={{display:'flex',flexDirection:'column',gap:2}}>
              {[
                {label:'Financial', sym:'$'},
                {label:'Logical', sym:'?'},
                {label:'Text', sym:'T'},
                {label:'Date & Time', sym:'⏱'},
              ].map(f=>(
                <CBtn key={f.label} title={`${f.label} functions`} style={{fontSize:9,padding:'2px 5px',flexDirection:'row',gap:4}}>
                  <span style={{width:12,textAlign:'center'}}>{f.sym}</span>{f.label}
                </CBtn>
              ))}
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:2}}>
              {[
                {label:'Lookup', sym:'↗'},
                {label:'Math & Trig', sym:'π'},
                {label:'More…', sym:'⋯'},
              ].map(f=>(
                <CBtn key={f.label} title={`${f.label} functions`} style={{fontSize:9,padding:'2px 5px',flexDirection:'row',gap:4}}>
                  <span style={{width:12,textAlign:'center'}}>{f.sym}</span>{f.label}
                </CBtn>
              ))}
            </div>
          </CGroup>
          <CGroup label="Defined Names">
            <div style={{position:'relative'}}>
              <CBtn onClick={e=>{e.stopPropagation();setNameOpen(v=>!v);}} active={nameOpen} title="Name Manager" style={{fontSize:9,padding:'3px 8px'}}>
                <Hash size={12}/><span>Name Manager</span>
              </CBtn>
              {nameOpen && (
                <div onClick={e=>e.stopPropagation()} style={{position:'absolute',top:'100%',left:0,zIndex:999,background:'#222',border:`1px solid #444`,borderRadius:2,padding:10,width:200}}>
                  <div style={{fontSize:10,color:CR.text,marginBottom:6}}>Named Ranges:</div>
                  {state.namedRanges.length === 0 && <div style={{fontSize:9,color:CR.dim}}>No named ranges defined.</div>}
                  {state.namedRanges.map((nr,i)=>(
                    <div key={i} style={{fontSize:9,color:CR.text,padding:'2px 4px',display:'flex',gap:6}}>
                      <span style={{color:CR.accent}}>{nr.name}</span>
                      <span style={{color:CR.dim}}>{nr.range}</span>
                    </div>
                  ))}
                  <div style={{marginTop:8,display:'flex',flexDirection:'column',gap:4}}>
                    <input value={nameDraft} onChange={e=>setNameDraft(e.target.value)} placeholder="Name for current selection"
                      style={{background:'#2a2a2a',border:`1px solid #444`,color:CR.text,fontSize:9,padding:'2px 6px',borderRadius:2,outline:'none'}}/>
                    <button onClick={()=>{onDefineName(); setNameOpen(false); setNameDraft('');}}
                      style={{background:CR.accent+'20',border:`1px solid ${CR.accent}60`,color:CR.accent,cursor:'pointer',padding:'3px 8px',borderRadius:2,fontSize:9}}>
                      Define Name for Selection
                    </button>
                  </div>
                </div>
              )}
            </div>
            <CBtn onClick={onNameRange} title="Create from Selection" style={{fontSize:9,padding:'3px 8px'}}>
              <span style={{display:'flex',alignItems:'center',gap:4}}><Plus size={10}/> From Selection</span>
            </CBtn>
          </CGroup>
          <CGroup label="Formula Auditing">
            <div style={{display:'flex',flexDirection:'column',gap:2}}>
              <CBtn title="Trace Precedents" style={{fontSize:9,padding:'2px 6px',flexDirection:'row',gap:4}}><ChevronRight size={10}/>Trace Precedents</CBtn>
              <CBtn title="Trace Dependents" style={{fontSize:9,padding:'2px 6px',flexDirection:'row',gap:4}}><ChevronLeft size={10}/>Trace Dependents</CBtn>
              <CBtn title="Remove Arrows" style={{fontSize:9,padding:'2px 6px',flexDirection:'row',gap:4}}><Trash size={10}/>Remove Arrows</CBtn>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:2}}>
              <CBtn onClick={onToggleFormulas} active={state.showFormulas} title="Show/Hide Formulas" style={{fontSize:9,padding:'2px 6px',flexDirection:'row',gap:4}}><Eye size={10}/>Show Formulas</CBtn>
              <CBtn title="Error Checking" style={{fontSize:9,padding:'2px 6px',flexDirection:'row',gap:4}}><SpellCheck size={10}/>Error Checking</CBtn>
              <CBtn title="Evaluate Formula" style={{fontSize:9,padding:'2px 6px',flexDirection:'row',gap:4}}><Play size={10}/>Evaluate</CBtn>
            </div>
          </CGroup>
          <CGroup label="Calculation">
            <div style={{display:'flex',flexDirection:'column',gap:2}}>
              <CBtn title="Calculate Now (F9)" style={{fontSize:9,padding:'2px 8px',flexDirection:'row',gap:4}}><Play size={10}/>Calculate Now</CBtn>
              <CBtn title="Calculate Sheet" style={{fontSize:9,padding:'2px 8px',flexDirection:'row',gap:4}}><RotateCcw size={10}/>Calculate Sheet</CBtn>
            </div>
          </CGroup>
        </>)}

        {/* ── DATA ─────────────────────────────────────── */}
        {state.ribbonTab === 'Data' && (<>
          <CGroup label="Get &amp; Transform">
            <div style={{display:'flex',flexDirection:'column',gap:2}}>
              <CBtn title="Get Data" style={{fontSize:9,padding:'2px 6px',flexDirection:'row',gap:4}}><Download size={10}/>Get Data</CBtn>
              <CBtn title="From Text/CSV" style={{fontSize:9,padding:'2px 6px',flexDirection:'row',gap:4}}><FileText size={10}/>Text/CSV</CBtn>
              <CBtn title="From Web" style={{fontSize:9,padding:'2px 6px',flexDirection:'row',gap:4}}><Link2 size={10}/>From Web</CBtn>
            </div>
          </CGroup>
          <CGroup label="Sort &amp; Filter">
            <CBtn onClick={()=>onSort(true)} title="Sort Ascending (A→Z)" style={{padding:'4px 6px'}}>
              <span style={{fontSize:13}}>↑</span><span style={{fontSize:8}}>A→Z Sort</span>
            </CBtn>
            <CBtn onClick={()=>onSort(false)} title="Sort Descending (Z→A)" style={{padding:'4px 6px'}}>
              <span style={{fontSize:13}}>↓</span><span style={{fontSize:8}}>Z→A Sort</span>
            </CBtn>
            <CBtn onClick={onToggleFilter} active={state.filterActive} title="Toggle Filter" style={{padding:'4px 6px'}}>
              <BarChart2 size={14}/><span style={{fontSize:8}}>Filter</span>
            </CBtn>
          </CGroup>
          <CGroup label="Data Tools">
            <CBtn title="Text to Columns" style={{fontSize:9,padding:'3px 8px'}}>Text to Columns</CBtn>
            <CBtn title="What-If Analysis" style={{fontSize:9,padding:'3px 8px'}}>What-If Analysis</CBtn>
            <CBtn title="Remove Duplicates" style={{fontSize:9,padding:'3px 8px'}}><Trash size={10}/><span>Remove Dupes</span></CBtn>
          </CGroup>
          <CGroup label="Outline">
            <CBtn title="Group Rows" style={{fontSize:9,padding:'3px 8px'}}>Group</CBtn>
            <CBtn title="Ungroup Rows" style={{fontSize:9,padding:'3px 8px'}}>Ungroup</CBtn>
            <CBtn title="Subtotal" style={{fontSize:9,padding:'3px 8px'}}>Subtotal</CBtn>
          </CGroup>
        </>)}

        {/* ── AUTOMATE ─────────────────────────────────── */}
        {state.ribbonTab === 'Automate' && (<>
          <CGroup label="Scripts">
            <CBtn title="New Script" style={{padding:'4px 8px'}}><Plus size={14}/><span style={{fontSize:8}}>New Script</span></CBtn>
            <CBtn title="View Scripts" style={{padding:'4px 8px'}}><Eye size={14}/><span style={{fontSize:8}}>View Scripts</span></CBtn>
          </CGroup>
          <CGroup label="Quick Actions">
            <div style={{display:'flex',flexDirection:'column',gap:2}}>
              <CBtn onClick={onCountEmpty} title="Count Empty Rows in selection" style={{fontSize:9,padding:'3px 10px',flexDirection:'row',gap:6}}>
                <Hash size={10}/> Count Empty Rows
              </CBtn>
              <CBtn onClick={onFreezeRow} active={state.frozenRow>0} title="Freeze/Unfreeze Header Row" style={{fontSize:9,padding:'3px 10px',flexDirection:'row',gap:6}}>
                <Layers size={10}/> {state.frozenRow>0?'Unfreeze':'Freeze'} Header Row
              </CBtn>
              <CBtn onClick={onInsertRow} title="Insert Row Below Selected" style={{fontSize:9,padding:'3px 10px',flexDirection:'row',gap:6}}>
                <Plus size={10}/> Insert Row Below
              </CBtn>
              <CBtn onClick={onDeleteRow} title="Delete Selected Row" style={{fontSize:9,padding:'3px 10px',flexDirection:'row',gap:6}}>
                <Trash2 size={10}/> Delete Row
              </CBtn>
              <CBtn title="Remove Hyperlinks" style={{fontSize:9,padding:'3px 10px',flexDirection:'row',gap:6}}>
                <Link2 size={10}/> Remove Hyperlinks
              </CBtn>
              <CBtn title="Make Subtable from Selection" style={{fontSize:9,padding:'3px 10px',flexDirection:'row',gap:6}}>
                <LayoutTemplate size={10}/> Make Subtable
              </CBtn>
            </div>
          </CGroup>
        </>)}
      </div>
    </div>
  );
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

  useEffect(() => {
    if (state.editMode && editRef.current) editRef.current.focus();
  }, [state.editMode, state.sel]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === 's') { e.preventDefault(); saveCalc(state); return; }
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
  }, [state, commitEdit, moveSelection, setCell]);

  const selCell = data[state.sel] ?? {} as CellData;
  const formulaDisplay = selCell.v || '';

  const COL_W = 80, ROW_H = 22, HDR_W = 40, HDR_H = 22;

  // ── Ribbon callbacks ───────────────────────────────────────────
  const onFmt = (updates: Partial<CellData>) => setCell(state.sel, updates);
  const onBold = () => setCell(state.sel, { b: !selCell.b });
  const onItalic = () => setCell(state.sel, { i: !selCell.i });
  const onUnderline = () => setCell(state.sel, { u: !selCell.u });
  const onStrike = () => setCell(state.sel, { strike: !selCell.strike });
  const onAlign = (a: 'left' | 'center' | 'right') => setCell(state.sel, { align: a });
  const onValign = (v: 'top' | 'middle' | 'bottom') => setCell(state.sel, { valign: v });
  const onWrap = () => setCell(state.sel, { wrap: !selCell.wrap });
  const onNumberFmt = (f: CellData['fmt']) => setCell(state.sel, { fmt: f });
  const onFillColor = (c: string) => setCell(state.sel, { bg: c || undefined });
  const onFontColor = (c: string) => setCell(state.sel, { color: c });
  const onBorder = (b: CellData['border']) => setCell(state.sel, { border: b });
  const onClearCell = () => setCell(state.sel, { v: '', b: false, i: false, u: false, strike: false, bg: undefined, color: undefined, fmt: undefined, align: undefined });
  const onMerge = () => {}; // decorative

  const onInsertRow = () => {
    const [, row] = colRow(state.sel);
    setState(prev => {
      const newData: SheetMap = {};
      const oldData = prev.sheets[prev.activeSheet].data;
      Object.entries(oldData).forEach(([addr, cell]) => {
        const [c, r] = colRow(addr);
        if (r >= row) newData[c + (r + 1)] = cell;
        else newData[addr] = cell;
      });
      const next = { ...prev, sheets: prev.sheets.map((sh, i) => i === prev.activeSheet ? { ...sh, data: newData } : sh) };
      saveCalc(next); return next;
    });
  };

  const onDeleteRow = () => {
    const [, row] = colRow(state.sel);
    setState(prev => {
      const newData: SheetMap = {};
      const oldData = prev.sheets[prev.activeSheet].data;
      Object.entries(oldData).forEach(([addr, cell]) => {
        const [c, r] = colRow(addr);
        if (r < row) newData[addr] = cell;
        else if (r > row) newData[c + (r - 1)] = cell;
      });
      const next = { ...prev, sheets: prev.sheets.map((sh, i) => i === prev.activeSheet ? { ...sh, data: newData } : sh) };
      saveCalc(next); return next;
    });
  };

  const onInsertCol = () => {
    const [col] = colRow(state.sel);
    const cIdx = COLS.indexOf(col);
    setState(prev => {
      const newData: SheetMap = {};
      const oldData = prev.sheets[prev.activeSheet].data;
      Object.entries(oldData).forEach(([addr, cell]) => {
        const [c, r] = colRow(addr);
        const ci = COLS.indexOf(c);
        if (ci >= cIdx) newData[COLS[ci + 1] + r] = cell;
        else newData[addr] = cell;
      });
      const next = { ...prev, sheets: prev.sheets.map((sh, i) => i === prev.activeSheet ? { ...sh, data: newData } : sh) };
      saveCalc(next); return next;
    });
  };

  const onDeleteCol = () => {
    const [col] = colRow(state.sel);
    const cIdx = COLS.indexOf(col);
    setState(prev => {
      const newData: SheetMap = {};
      const oldData = prev.sheets[prev.activeSheet].data;
      Object.entries(oldData).forEach(([addr, cell]) => {
        const [c, r] = colRow(addr);
        const ci = COLS.indexOf(c);
        if (ci < cIdx) newData[addr] = cell;
        else if (ci > cIdx) newData[COLS[ci - 1] + r] = cell;
      });
      const next = { ...prev, sheets: prev.sheets.map((sh, i) => i === prev.activeSheet ? { ...sh, data: newData } : sh) };
      saveCalc(next); return next;
    });
  };

  const onAutoSum = () => {
    const [col, row] = colRow(state.sel);
    // Find contiguous numbers above
    let top = row - 1;
    while (top >= 1 && data[col + top]?.v && !isNaN(Number(evalCell(data[col + top].v, data)))) top--;
    top++;
    const formula = top < row ? `=SUM(${col}${top}:${col}${row - 1})` : `=SUM(${col}1:${col}${row - 1})`;
    setCell(state.sel, { v: formula });
    setState(prev => ({ ...prev, editMode: false }));
  };

  const onSort = (asc: boolean) => {
    const [col] = colRow(state.sel);
    setState(prev => {
      const oldData = prev.sheets[prev.activeSheet].data;
      const rows: { row: number; cells: Record<string, CellData> }[] = [];
      for (let r = 2; r <= ROW_COUNT; r++) {
        const rowCells: Record<string, CellData> = {};
        COLS.forEach(c => { if (oldData[c + r]) rowCells[c] = oldData[c + r]; });
        rows.push({ row: r, cells: rowCells });
      }
      rows.sort((a, b) => {
        const va = a.cells[col]?.v ?? '';
        const vb = b.cells[col]?.v ?? '';
        const na = parseFloat(va), nb = parseFloat(vb);
        const numComp = !isNaN(na) && !isNaN(nb) ? (na - nb) : 0;
        const strComp = !isNaN(na) && !isNaN(nb) ? numComp : va.localeCompare(vb);
        return asc ? strComp : -strComp;
      });
      const newData: SheetMap = {};
      COLS.forEach(c => { if (oldData[c + '1']) newData[c + '1'] = oldData[c + '1']; });
      rows.forEach(({ cells }, idx) => { COLS.forEach(c => { if (cells[c]) newData[c + (idx + 2)] = cells[c]; }); });
      const next = { ...prev, sheets: prev.sheets.map((sh, i) => i === prev.activeSheet ? { ...sh, data: newData } : sh) };
      saveCalc(next); return next;
    });
  };

  const onToggleFilter = () => setState(prev => ({ ...prev, filterActive: !prev.filterActive }));
  const onToggleFormulas = () => setState(prev => ({ ...prev, showFormulas: !prev.showFormulas }));
  const onToggleGridlines = () => setState(prev => ({ ...prev, showGridlines: !prev.showGridlines }));
  const onPrint = () => window.print();
  const onAddSheet = () => setState(prev => { const next = { ...prev, sheets: [...prev.sheets, { name: `Sheet${prev.sheets.length + 1}`, data: {} }] }; saveCalc(next); return next; });

  const onCountEmpty = () => {
    let empty = 0;
    const [col] = colRow(state.sel);
    for (let r = 1; r <= ROW_COUNT; r++) { if (!data[col + r]?.v) empty++; }
    setCell(state.sel, { v: String(empty) });
  };

  const onFreezeRow = () => setState(prev => ({ ...prev, frozenRow: prev.frozenRow > 0 ? 0 : 1 }));
  const onNameRange = () => {};
  const onDefineName = () => {
    const name = prompt('Name for range ' + state.sel + ':');
    if (name) setState(prev => ({ ...prev, namedRanges: [...prev.namedRanges, { name, range: prev.sel }] }));
  };

  const onConditionalHighlight = (condition: 'gt' | 'lt' | 'eq' | 'contains', value: string, color: string) => {
    setState(prev => ({ ...prev, conditionalRules: [...prev.conditionalRules, { range: prev.sel, condition, value, color }] }));
  };

  const getCellBg = (addr: string, cell: CellData): string => {
    if (addr === state.sel) return '#0a1a2a';
    if (cell.bg) return cell.bg;
    // Apply conditional rules
    for (const rule of state.conditionalRules) {
      const cv = evalCell(cell.v ?? '', data);
      const rv = rule.condition === 'contains' ? rule.value : parseFloat(rule.value);
      if (rule.condition === 'gt' && typeof cv === 'number' && cv > (rv as number)) return rule.color + '40';
      if (rule.condition === 'lt' && typeof cv === 'number' && cv < (rv as number)) return rule.color + '40';
      if (rule.condition === 'eq' && String(cv) === String(rv)) return rule.color + '40';
      if (rule.condition === 'contains' && String(cv).includes(String(rv))) return rule.color + '40';
    }
    return '#111';
  };

  const getCellBorder = (addr: string, cell: CellData, isSelected: boolean): string => {
    if (isSelected) return `2px solid ${O.writer}`;
    if (!state.showGridlines) return '1px solid transparent';
    if (cell.border === 'none') return '1px solid transparent';
    return `1px solid ${O.border}`;
  };

  const totalCells = COLS.length * ROW_COUNT;
  const activeCellCount = Object.keys(data).filter(k => data[k]?.v).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#1a1a1a', userSelect: 'none' }} onKeyDown={handleKeyDown} tabIndex={0}>
      {/* Ribbon */}
      <SpreadsheetRibbon
        state={state} selCell={selCell}
        onTab={t => setState(prev => ({ ...prev, ribbonTab: t }))}
        onFmt={onFmt} onBold={onBold} onItalic={onItalic} onUnderline={onUnderline} onStrike={onStrike}
        onAlign={onAlign} onValign={onValign} onWrap={onWrap} onNumberFmt={onNumberFmt}
        onInsertRow={onInsertRow} onInsertCol={onInsertCol} onDeleteRow={onDeleteRow} onDeleteCol={onDeleteCol}
        onAutoSum={onAutoSum} onSort={onSort} onToggleFilter={onToggleFilter}
        onToggleFormulas={onToggleFormulas} onToggleGridlines={onToggleGridlines}
        onClearCell={onClearCell} onPrint={onPrint} onAddSheet={onAddSheet}
        onCountEmpty={onCountEmpty} onFreezeRow={onFreezeRow}
        onNameRange={onNameRange} onDefineName={onDefineName}
        onFillColor={onFillColor} onFontColor={onFontColor} onBorder={onBorder} onMerge={onMerge}
        onConditionalHighlight={onConditionalHighlight}
        totalCells={totalCells} activeCellCount={activeCellCount}
      />

      {/* Formula bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 8px', background: '#141414', borderBottom: `1px solid ${O.border}`, flexShrink: 0 }}>
        <div style={{ minWidth: 52, padding: '2px 6px', background: '#0a2a3a', border: `1px solid ${O.writer}40`, color: O.writer, fontFamily: 'monospace', fontSize: 11, textAlign: 'center', borderRadius: 2 }}>{state.sel}</div>
        <span style={{ color: O.dim, fontSize: 13, fontFamily: 'monospace', fontStyle: 'italic' }}>fx</span>
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
        {state.filterActive && (
          <span style={{ fontSize: 9, color: O.calc, fontFamily: 'monospace', paddingRight: 4 }}>FILTER ON</span>
        )}
        {state.showFormulas && (
          <span style={{ fontSize: 9, color: '#c792ea', fontFamily: 'monospace', paddingRight: 4 }}>SHOW FORMULAS</span>
        )}
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
                {state.filterActive && <span style={{ fontSize: 7, color: O.calc, marginLeft: 2 }}>▾</span>}
              </div>
            ))}
          </div>

          {/* Frozen row indicator */}
          {state.frozenRow > 0 && (
            <div style={{ height: 2, background: `${O.calc}60`, position: 'sticky', top: HDR_H, zIndex: 2, width: '100%' }} />
          )}

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
                  const cell = data[addr] ?? {} as CellData;
                  const isSelected = addr === state.sel;
                  const rawVal = state.showFormulas ? (cell.v ?? '') : displayCell(cell.v ?? '', data, cell.fmt);
                  const isError = rawVal.startsWith('#') && rawVal.length > 1 && rawVal.length < 10;
                  const isEditing = isSelected && state.editMode;
                  const bgColor = getCellBg(addr, cell);
                  const borderStyle = getCellBorder(addr, cell, isSelected);
                  const valignMap = { top: 'flex-start', middle: 'center', bottom: 'flex-end' };
                  const vAlign = valignMap[cell.valign ?? 'middle'] ?? 'center';
                  return (
                    <div key={addr}
                      onClick={() => { commitEdit(); setState(prev => ({ ...prev, sel: addr, editMode: false, editVal: '' })); }}
                      onDoubleClick={() => setState(prev => ({ ...prev, sel: addr, editMode: true, editVal: cell.v ?? '' }))}
                      style={{ width: state.colWidths[col] ?? COL_W, minWidth: state.colWidths[col] ?? COL_W, height: cell.wrap ? 'auto' : ROW_H, minHeight: ROW_H, border: borderStyle, background: bgColor, position: 'relative', flexShrink: 0, overflow: 'hidden', cursor: 'default',
                        outline: cell.border === 'outer' ? `1px solid ${O.dim}` : cell.border === 'all' ? `1px solid ${O.dim}` : cell.border === 'bottom' ? undefined : undefined }}>
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
                          style={{ width: '100%', height: '100%', background: '#0a1a2a', border: 'none', color: O.text, fontFamily: 'monospace', fontSize: cell.fontSize ?? 11, padding: '0 4px', outline: 'none' }}
                        />
                      ) : (
                        <div style={{ padding: '0 4px', height: '100%', display: 'flex', alignItems: vAlign, justifyContent: cell.align === 'center' ? 'center' : cell.align === 'right' ? 'flex-end' : 'flex-start', fontWeight: cell.b ? 'bold' : 'normal', fontStyle: cell.i ? 'italic' : 'normal', textDecoration: [cell.u ? 'underline' : '', cell.strike ? 'line-through' : ''].filter(Boolean).join(' ') || 'none', fontSize: cell.fontSize ?? 11, color: isError ? '#e06c75' : (cell.color ?? O.text), fontFamily: 'monospace', whiteSpace: cell.wrap ? 'pre-wrap' : 'nowrap', overflow: 'hidden',
                          borderBottom: cell.border === 'bottom' ? `1px solid ${O.dim}` : undefined }}>
                          {rawVal}
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
          <button key={i} onClick={() => setState(prev => ({ ...prev, activeSheet: i }))}
            style={{ background: i === state.activeSheet ? '#2a4a2a' : '#1a1a1a', border: `1px solid ${i === state.activeSheet ? O.calc + '80' : O.border}`, color: i === state.activeSheet ? O.calc : O.dim, cursor: 'pointer', padding: '2px 10px', fontSize: 10, fontFamily: 'monospace', borderRadius: '3px 3px 0 0' }}>
            {sh.name}
          </button>
        ))}
        <button onClick={onAddSheet} style={{ background: 'transparent', border: `1px solid ${O.border}`, color: O.dim, cursor: 'pointer', padding: '2px 6px', fontSize: 10, borderRadius: 3 }}>+</button>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 8, color: O.veryDim, fontFamily: 'monospace' }}>
          {selCell.v ? `val: ${displayCell(selCell.v, data, selCell.fmt)}` : state.sel}
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
  onStartSlideshow: (fromIdx: number) => void;
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
  onPreviewTransition, wordCount, commentCount, onStartSlideshow,
}: PresentationRibbonProps) {
  const [layoutOpen, setLayoutOpen] = useState(false);
  const [soundOpen, setSoundOpen] = useState(false);
  const [loopSlideshow, setLoopSlideshow] = useState(false);
  const selEl = slide?.elements.find(e => e.id === selectedElId) ?? null;

  const TABS = ['Home', 'Insert', 'Design', 'Transitions', 'Animations', 'Review', 'Slide Show'];

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

        {/* ── SLIDE SHOW ────────────────────────────────── */}
        {ribbonTab === 'Slide Show' && (<>
          <RGroup label="Start Slide Show">
            <RBtn onClick={() => onStartSlideshow(0)} title="Start from first slide">
              <Play size={18} style={{ color: IR.accent }} />
              <span style={{ fontSize: 8, whiteSpace: 'nowrap' }}>From<br/>Beginning</span>
            </RBtn>
            <RBtn onClick={() => onStartSlideshow(activeIdx)} title="Start from current slide">
              <SkipBack size={16} style={{ color: IR.text }} />
              <span style={{ fontSize: 8, whiteSpace: 'nowrap' }}>From<br/>Current Slide</span>
            </RBtn>
          </RGroup>
          <RGroup label="Set Up">
            <RBtn onClick={() => setLoopSlideshow(v => !v)} active={loopSlideshow} title="Loop continuously until Esc">
              <Rewind size={14} /><span style={{fontSize:8}}>Loop</span>
            </RBtn>
            <RBtn onClick={onToggleNotes} active={showNotes} title="Show presenter notes panel">
              <MessageSquare size={14} /><span style={{fontSize:8}}>Notes</span>
            </RBtn>
          </RGroup>
          <RGroup label="Navigate">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '2px 4px' }}>
              <div style={{ fontSize: 9, color: IR.dim, fontFamily: 'monospace' }}>
                <span style={{ color: IR.text }}>→ / Space</span> Next
              </div>
              <div style={{ fontSize: 9, color: IR.dim, fontFamily: 'monospace' }}>
                <span style={{ color: IR.text }}>←</span> Previous
              </div>
              <div style={{ fontSize: 9, color: IR.dim, fontFamily: 'monospace' }}>
                <span style={{ color: IR.text }}>Esc</span> Exit
              </div>
              <div style={{ fontSize: 9, color: IR.dim, fontFamily: 'monospace' }}>
                <span style={{ color: IR.text }}>L</span> Laser pointer
              </div>
              <div style={{ fontSize: 9, color: IR.dim, fontFamily: 'monospace' }}>
                <span style={{ color: IR.text }}>N</span> Speaker notes
              </div>
            </div>
          </RGroup>
          <RGroup label="Slide Info">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '4px 6px' }}>
              <span style={{fontSize:9,color:IR.dim}}>Slides: <span style={{color:IR.text}}>{slides.length}</span></span>
              <span style={{fontSize:9,color:IR.dim}}>Current: <span style={{color:IR.accent}}>{activeIdx + 1}</span></span>
              <span style={{fontSize:9,color:IR.dim}}>Transition: <span style={{color:IR.text}}>{slide?.transition ?? 'none'}</span></span>
            </div>
          </RGroup>
          <RGroup label="Presenter Tools">
            <RBtn onClick={() => onPreviewTransition()} title="Preview transition effect">
              <Wind size={14} /><span style={{fontSize:8}}>Preview</span>
            </RBtn>
            <RBtn onClick={onToggleComments} active={showComments} title="Show comments overlay">
              <MessageCircle size={14} /><span style={{fontSize:8}}>Comments</span>
            </RBtn>
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
@keyframes impress-push-in{from{transform:translateX(100%)}to{transform:translateX(0)}}
@keyframes impress-push-in-rev{from{transform:translateX(-100%)}to{transform:translateX(0)}}
@keyframes impress-cover-in{from{transform:translateX(100%)}to{transform:translateX(0)}}
@keyframes impress-uncover-out{from{transform:translateX(0)}to{transform:translateX(-100%)}}
@keyframes impress-reveal-in{from{clip-path:inset(0 100% 0 0)}to{clip-path:inset(0 0 0 0)}}
@keyframes impress-shape-in{from{clip-path:circle(0% at 50% 50%)}to{clip-path:circle(75% at 50% 50%)}}
@keyframes impress-morph-in{from{transform:scale(0.85) rotate(-2deg);opacity:0}to{transform:scale(1) rotate(0deg);opacity:1}}
@keyframes impress-bars-in{from{clip-path:polygon(0 0,0 0,0 100%,0 100%);opacity:0}to{clip-path:polygon(0 0,100% 0,100% 100%,0 100%);opacity:1}}
.impress-appear{animation:impress-appear 0.2s ease both}
.impress-fade{animation:impress-fade 0.6s ease both}
.impress-fly-in{animation:impress-fly-in 0.5s cubic-bezier(.2,.8,.4,1) both}
.impress-float-in{animation:impress-float-in 0.7s ease both}
.impress-split{animation:impress-split 0.5s ease both}
.impress-wipe{animation:impress-wipe 0.5s ease both}
`;

// ── Slideshow helpers ─────────────────────────────────────────────
function getSlideshowTransitionCSS(transId: string, dur: number, dir: 'next' | 'prev'): React.CSSProperties {
  const d = `${dur}s`;
  const easeIn = `cubic-bezier(.25,.46,.45,.94)`;
  switch (transId) {
    case 'fade':        return { animation: `impress-fade ${d} ease both` };
    case 'push':        return { animation: `${dir==='next'?'impress-push-in':'impress-push-in-rev'} ${d} ${easeIn} both` };
    case 'cover':       return { animation: `impress-cover-in ${d} ${easeIn} both` };
    case 'wipe':
    case 'reveal':      return { animation: `impress-reveal-in ${d} ease both` };
    case 'split':       return { animation: `impress-split ${d} ease both` };
    case 'shape':       return { animation: `impress-shape-in ${d} ease both` };
    case 'morph':       return { animation: `impress-morph-in ${d} ease both` };
    case 'random-bars': return { animation: `impress-bars-in ${d} ease both` };
    case 'fly-in':      return { animation: `impress-fly-in ${d} cubic-bezier(.2,.8,.4,1) both` };
    case 'cut':         return {}; // instant
    default:            return {};
  }
}

interface SlideshowOverlayProps {
  slides: Slide[];
  startIdx: number;
  onExit: () => void;
}

function SlideshowOverlay({ slides, startIdx, onExit }: SlideshowOverlayProps) {
  const [current, setCurrent]       = useState(startIdx);
  const [transitioning, setTransitioning] = useState(false);
  const [dir, setDir]               = useState<'next' | 'prev'>('next');
  const [laserPos, setLaserPos]     = useState<{ x: number; y: number } | null>(null);
  const [laserMode, setLaserMode]   = useState(false);
  const [showUI, setShowUI]         = useState(true);
  const [showNotes, setShowNotes]   = useState(false);
  const [elapsed, setElapsed]       = useState(0);
  const uiTimer  = useRef<ReturnType<typeof setTimeout>>();
  const clockRef = useRef<ReturnType<typeof setInterval>>();
  const slideRef = useRef<HTMLDivElement>(null);

  const slide = slides[current] ?? slides[0];
  const theme = THEMES.find(t => t.id === slide?.themeId) ?? THEMES[0];
  const totalSlides = slides.length;

  // Clock
  useEffect(() => {
    clockRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(clockRef.current);
  }, []);

  const formatTime = (s: number) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  const goTo = useCallback((idx: number, direction: 'next' | 'prev') => {
    if (transitioning || idx < 0 || idx >= totalSlides) return;
    const dur = slides[direction === 'next' ? idx : current]?.transitionDuration ?? 0.4;
    const hasTrans = (slides[direction === 'next' ? idx : current]?.transition ?? 'none') !== 'none';
    setDir(direction);
    if (hasTrans) {
      setTransitioning(true);
      setTimeout(() => { setCurrent(idx); setTransitioning(false); }, Math.min(dur * 1000, 1200));
    } else {
      setCurrent(idx);
    }
  }, [transitioning, totalSlides, slides, current]);

  const next = useCallback(() => goTo(current + 1, 'next'), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1, 'prev'), [current, goTo]);

  // Keyboard handler
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape')        { e.preventDefault(); onExit(); }
      else if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ' || e.key === 'Enter') { e.preventDefault(); next(); }
      else if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')  { e.preventDefault(); prev(); }
      else if (e.key === 'l' || e.key === 'L') setLaserMode(v => !v);
      else if (e.key === 'n' || e.key === 'N') setShowNotes(v => !v);
      else if (e.key === 'Home') goTo(0, 'next');
      else if (e.key === 'End')  goTo(totalSlides - 1, 'next');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [next, prev, goTo, totalSlides, onExit]);

  // Auto-hide UI
  const revealUI = () => {
    setShowUI(true);
    clearTimeout(uiTimer.current);
    uiTimer.current = setTimeout(() => setShowUI(false), 3000);
  };
  useEffect(() => { revealUI(); return () => clearTimeout(uiTimer.current); }, []);

  // Transition style for the current slide
  const transStyle = transitioning ? {} : (() => {
    const tr = slides[current]?.transition ?? 'none';
    const dur = slides[current]?.transitionDuration ?? 0.4;
    return getSlideshowTransitionCSS(tr, Math.min(dur, 1.5), dir);
  })();

  const cursorStyle: React.CSSProperties = laserMode
    ? { cursor: 'none' }
    : { cursor: showUI ? 'default' : 'none' };

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#000', display: 'flex', flexDirection: 'column', userSelect: 'none', ...cursorStyle }}
      onClick={e => { if (!laserMode) next(); }}
      onMouseMove={e => {
        revealUI();
        if (laserMode) {
          const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
          setLaserPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        }
      }}
    >
      {/* Slide canvas */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: showNotes && slide?.notes ? '16px 16px 0' : 16, overflow: 'hidden' }}>
        <div
          ref={slideRef}
          key={current}
          style={{
            width: '100%', maxWidth: '177.78vh', aspectRatio: '16/9',
            background: theme.bg, position: 'relative', overflow: 'hidden',
            borderRadius: 4, boxShadow: '0 16px 64px rgba(0,0,0,0.9)',
            ...transStyle,
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Accent bar */}
          <div style={{ height: 4, background: theme.accent, position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1 }} />

          {/* Elements */}
          {slide?.elements.map(el => {
            const isTitle = el.type === 'title';
            return (
              <div key={el.id}
                style={{ padding: isTitle ? '28px 40px 12px' : '12px 40px 28px', flex: isTitle ? '0 0 auto' : 1 }}>
                <div style={{
                  color: isTitle ? theme.title : theme.body,
                  fontFamily: isTitle ? '"Segoe UI", system-ui, sans-serif' : 'system-ui, sans-serif',
                  fontSize: el.fontSize ?? (isTitle ? 32 : 20),
                  fontWeight: el.bold || isTitle ? 'bold' : 'normal',
                  fontStyle: el.italic ? 'italic' : 'normal',
                  textDecoration: [el.underline ? 'underline' : '', el.strikethrough ? 'line-through' : ''].filter(Boolean).join(' ') || 'none',
                  textAlign: el.align ?? 'left',
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap',
                  letterSpacing: isTitle ? -0.5 : 0,
                }}>
                  {el.text}
                </div>
              </div>
            );
          })}

          {/* Slide number */}
          {slide?.showSlideNumber && (
            <div style={{ position: 'absolute', bottom: 10, right: 16, fontSize: 11, color: `${theme.body}55`, fontFamily: 'monospace', zIndex: 2 }}>
              {current + 1} / {totalSlides}
            </div>
          )}

          {/* Progress bar */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: `${theme.accent}25`, zIndex: 2 }}>
            <div style={{ height: '100%', width: `${((current + 1) / totalSlides) * 100}%`, background: theme.accent, transition: 'width 0.4s ease' }} />
          </div>
        </div>

        {/* Laser pointer dot */}
        {laserMode && laserPos && (
          <div style={{ position: 'fixed', left: laserPos.x - 10, top: laserPos.y - 10, width: 20, height: 20, borderRadius: '50%', background: 'rgba(255,0,0,0.85)', boxShadow: '0 0 12px 4px rgba(255,0,0,0.5)', pointerEvents: 'none', zIndex: 10000 }} />
        )}
      </div>

      {/* Speaker notes */}
      {showNotes && slide?.notes && (
        <div style={{ background: 'rgba(0,0,0,0.85)', borderTop: '1px solid #333', padding: '10px 24px', maxHeight: '22%', overflowY: 'auto', flexShrink: 0 }}>
          <div style={{ fontSize: 9, color: '#666', letterSpacing: 1, marginBottom: 4, fontFamily: 'monospace' }}>SPEAKER NOTES</div>
          <div style={{ fontSize: 13, color: '#ccc', lineHeight: 1.6, fontFamily: 'system-ui', whiteSpace: 'pre-wrap' }}>{slide.notes}</div>
        </div>
      )}

      {/* HUD overlay (auto-hides) */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 10001, transition: 'opacity 0.3s', opacity: showUI ? 1 : 0 }}>
        {/* Top bar */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.75), transparent)', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', pointerEvents: 'auto' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: '#ccc', fontFamily: 'monospace' }}>{formatTime(elapsed)}</span>
            <button onClick={e => { e.stopPropagation(); setLaserMode(v => !v); }}
              title="Toggle laser pointer (L)"
              style={{ background: laserMode ? 'rgba(255,0,0,0.3)' : 'rgba(255,255,255,0.1)', border: `1px solid ${laserMode ? 'rgba(255,80,80,0.7)' : 'rgba(255,255,255,0.25)'}`, color: laserMode ? '#ff6060' : '#ccc', cursor: 'pointer', padding: '3px 10px', borderRadius: 3, fontSize: 10 }}>
              Laser
            </button>
            <button onClick={e => { e.stopPropagation(); setShowNotes(v => !v); }}
              title="Toggle speaker notes (N)"
              style={{ background: showNotes ? 'rgba(100,200,100,0.2)' : 'rgba(255,255,255,0.1)', border: `1px solid ${showNotes ? 'rgba(100,200,100,0.5)' : 'rgba(255,255,255,0.25)'}`, color: showNotes ? '#88ee88' : '#ccc', cursor: 'pointer', padding: '3px 10px', borderRadius: 3, fontSize: 10 }}>
              Notes
            </button>
          </div>
          <div style={{ fontSize: 11, color: '#888', fontFamily: 'monospace' }}>
            Slide {current + 1} of {totalSlides}
          </div>
          <button onClick={e => { e.stopPropagation(); onExit(); }}
            title="Exit presentation (Esc)"
            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.25)', color: '#ccc', cursor: 'pointer', padding: '4px 14px', borderRadius: 3, fontSize: 11 }}>
            ✕ Exit
          </button>
        </div>

        {/* Prev arrow */}
        <button
          onClick={e => { e.stopPropagation(); prev(); }}
          title="Previous slide (←)"
          style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: current === 0 ? '#333' : '#aaa', cursor: current === 0 ? 'default' : 'pointer', width: 40, height: 64, borderRadius: 4, fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'auto' }}
          disabled={current === 0}>
          ‹
        </button>

        {/* Next arrow */}
        <button
          onClick={e => { e.stopPropagation(); next(); }}
          title="Next slide (→)"
          style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: current === totalSlides - 1 ? '#333' : '#aaa', cursor: current === totalSlides - 1 ? 'default' : 'pointer', width: 40, height: 64, borderRadius: 4, fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'auto' }}
          disabled={current === totalSlides - 1}>
          ›
        </button>

        {/* Bottom bar — slide strip */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.75), transparent)', padding: '10px 20px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, pointerEvents: 'auto' }}>
          {slides.map((s, i) => {
            const t = THEMES.find(th => th.id === s.themeId) ?? THEMES[0];
            return (
              <button
                key={s.id}
                onClick={e => { e.stopPropagation(); goTo(i, i > current ? 'next' : 'prev'); }}
                title={`Go to slide ${i + 1}`}
                style={{
                  width: i === current ? 44 : 28,
                  height: i === current ? 28 : 18,
                  background: i === current ? t.bg : '#333',
                  border: `1px solid ${i === current ? t.accent : '#555'}`,
                  borderRadius: 2, cursor: 'pointer', padding: 2,
                  transition: 'all 0.2s ease', flexShrink: 0, overflow: 'hidden',
                }}>
                <div style={{ width: '100%', height: '100%', background: t.accent, opacity: 0.3, borderRadius: 1 }} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

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
  const [slideshowStartIdx, setSlideshowStartIdx] = useState<number | null>(null);
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
      {/* Slideshow fullscreen overlay */}
      {slideshowStartIdx !== null && (
        <SlideshowOverlay
          slides={slides}
          startIdx={slideshowStartIdx}
          onExit={() => setSlideshowStartIdx(null)}
        />
      )}

      <PresentationRibbon
        slides={slides} activeIdx={activeIdx} slide={slide} selectedElId={selectedElId}
        ribbonTab={ribbonTab} onRibbonTab={setRibbonTab}
        onStartSlideshow={(idx) => { commitEdit(); setSlideshowStartIdx(idx); setRibbonTab('Slide Show'); }}
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
