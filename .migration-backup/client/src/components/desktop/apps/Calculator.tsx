import { useState, useEffect, useCallback, useRef } from 'react';
import { useCrtTheme } from '@/contexts/CrtThemeContext';

// ─── Safe expression evaluator ────────────────────────────────────────────────

function safeEval(expr: string, mode: 'DEG' | 'RAD', mem: number, ans: number): number {
  const toR = (x: number) => mode === 'DEG' ? x * Math.PI / 180 : x;
  const fromR = (x: number) => mode === 'DEG' ? x * 180 / Math.PI : x;

  // Auto-close unclosed parentheses
  let e = expr.trim();
  let opens = 0;
  for (const ch of e) { if (ch === '(') opens++; else if (ch === ')') opens--; }
  if (opens > 0) e = e + ')'.repeat(opens);

  // Two-pass replacement to avoid substring conflicts.
  // Pass 1: replace longer/prefixed names with safe intermediate tokens.
  // Pass 2: replace shorter names, then restore final forms.
  const pass1 = e
    .replace(/π/g, `(${Math.PI})`)
    .replace(/\be\b/g, `(${Math.E})`)
    .replace(/ANS/g, `(${ans})`)
    .replace(/MEM/g, `(${mem})`)
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/\^/g, '**')
    .replace(/√\(/g, '_sqrt(')
    .replace(/√(\d+\.?\d*)/g, '_sqrt($1)')
    // Stake out hyperbolic FIRST (contains 'sin','cos','tan' substrings)
    .replace(/sinh\(/g,  'QQH1QQ(')
    .replace(/cosh\(/g,  'QQH2QQ(')
    .replace(/tanh\(/g,  'QQH3QQ(')
    // Stake out inverse trig BEFORE forward trig
    .replace(/arcsin\(/g, 'QQA1QQ(')
    .replace(/arccos\(/g, 'QQA2QQ(')
    .replace(/arctan\(/g, 'QQA3QQ(')
    .replace(/asin\(/g,   'QQA1QQ(')
    .replace(/acos\(/g,   'QQA2QQ(')
    .replace(/atan\(/g,   'QQA3QQ(')
    // Forward trig (safe now that asin/sinh are staked out)
    .replace(/sin\(/g, '_sin(')
    .replace(/cos\(/g, '_cos(')
    .replace(/tan\(/g, '_tan(')
    // Other functions
    .replace(/log10\(/g, '_log(')
    .replace(/log\(/g,   '_log(')
    .replace(/ln\(/g,    '_ln(')
    .replace(/abs\(/g,   '_abs(')
    .replace(/cbrt\(/g,  '_cbrt(')
    .replace(/ceil\(/g,  '_ceil(')
    .replace(/floor\(/g, '_floor(')
    .replace(/round\(/g, '_round(');

  // Pass 2: resolve staked tokens → final _fn( form
  const clean = pass1
    .replace(/QQH1QQ\(/g, '_sinh(')
    .replace(/QQH2QQ\(/g, '_cosh(')
    .replace(/QQH3QQ\(/g, '_tanh(')
    .replace(/QQA1QQ\(/g, '_asin(')
    .replace(/QQA2QQ\(/g, '_acos(')
    .replace(/QQA3QQ\(/g, '_atan(')
    // Implicit multiplication
    .replace(/(\d)\(/g, '$1*(')
    .replace(/\)(\d)/g, ')*$1')
    .replace(/\)\(/g, ')*(');

  if (!/^[\d\s+\-*/.()%_a-z]+$/.test(clean)) {
    throw new Error(`Blocked: "${clean}"`);
  }

  // eslint-disable-next-line no-new-func
  const fn = new Function(
    '_sin','_cos','_tan','_asin','_acos','_atan',
    '_sinh','_cosh','_tanh','_log','_ln','_abs','_sqrt','_cbrt',
    '_ceil','_floor','_round',
    `"use strict"; return (${clean});`
  );
  return fn(
    (x: number) => Math.sin(toR(x)),
    (x: number) => Math.cos(toR(x)),
    (x: number) => Math.tan(toR(x)),
    (x: number) => fromR(Math.asin(x)),
    (x: number) => fromR(Math.acos(x)),
    (x: number) => fromR(Math.atan(x)),
    Math.sinh, Math.cosh, Math.tanh,
    Math.log10, Math.log,
    Math.abs, Math.sqrt, Math.cbrt,
    Math.ceil, Math.floor, Math.round,
  );
}

function evalGraph(expr: string, x: number, mode: 'DEG' | 'RAD'): number {
  const safe = expr
    .replace(/\bx\b/g, `(${x})`)
    .replace(/\be\b/g, `(${Math.E})`);
  return safeEval(safe, mode, 0, 0);
}

function formatResult(val: number): string {
  if (!isFinite(val)) return 'Infinity';
  if (isNaN(val)) return 'NaN';
  // Use up to 10 sig digits, trim trailing zeros
  const s = parseFloat(val.toPrecision(10)).toString();
  return s;
}

// ─── Graph SVG ────────────────────────────────────────────────────────────────

function GraphPlot({ func, xMin, xMax, yMin, yMax, mode, c, accentColors }: {
  func: string; xMin: number; xMax: number; yMin: number; yMax: number;
  mode: 'DEG' | 'RAD'; c: string;
  accentColors: { green: string; amber: string; cyan: string; red: string; purple: string; pink: string };
}) {
  const W = 340, H = 240;
  const toSX = (x: number) => ((x - xMin) / (xMax - xMin)) * W;
  const toSY = (y: number) => H - ((y - yMin) / (yMax - yMin)) * H;

  const segments: string[][] = [];
  let cur: string[] = [];
  for (let i = 0; i <= 600; i++) {
    const x = xMin + (i / 600) * (xMax - xMin);
    try {
      const y = evalGraph(func, x, mode);
      if (!isFinite(y) || isNaN(y) || y < yMin - (yMax - yMin) * 2 || y > yMax + (yMax - yMin) * 2) {
        if (cur.length > 1) segments.push(cur);
        cur = [];
      } else {
        cur.push(`${toSX(x).toFixed(1)},${toSY(y).toFixed(1)}`);
      }
    } catch {
      if (cur.length > 1) segments.push(cur);
      cur = [];
    }
  }
  if (cur.length > 1) segments.push(cur);

  const gridColor = `${c}20`;
  const axisColor = `${c}50`;
  const stepX = (xMax - xMin) / 8;
  const stepY = (yMax - yMin) / 6;
  const gridX: number[] = [];
  const gridY: number[] = [];
  for (let v = Math.ceil(xMin / stepX) * stepX; v <= xMax + stepX * 0.01; v += stepX) gridX.push(v);
  for (let v = Math.ceil(yMin / stepY) * stepY; v <= yMax + stepY * 0.01; v += stepY) gridY.push(v);

  return (
    <svg width={W} height={H} style={{ display: 'block', background: '#040404', border: `1px solid ${c}25`, borderRadius: 2 }}>
      {gridX.map((v, i) => <line key={`vg${i}`} x1={toSX(v)} y1={0} x2={toSX(v)} y2={H} stroke={gridColor} strokeWidth={0.5} />)}
      {gridY.map((v, i) => <line key={`hg${i}`} x1={0} y1={toSY(v)} x2={W} y2={toSY(v)} stroke={gridColor} strokeWidth={0.5} />)}
      {xMin <= 0 && xMax >= 0 && <line x1={toSX(0)} y1={0} x2={toSX(0)} y2={H} stroke={axisColor} strokeWidth={1} />}
      {yMin <= 0 && yMax >= 0 && <line x1={0} y1={toSY(0)} x2={W} y2={toSY(0)} stroke={axisColor} strokeWidth={1} />}
      {/* Axis labels */}
      {gridX.filter((_, i) => i % 2 === 0).map((v, i) => (
        <text key={`xl${i}`} x={toSX(v)} y={H - 2} textAnchor="middle" fontSize={7} fill={`${c}40`} fontFamily="Courier New">
          {v.toFixed(1)}
        </text>
      ))}
      {segments.map((seg, i) => (
        <polyline key={i} points={seg.join(' ')} fill="none" stroke={accentColors.cyan} strokeWidth={1.8} strokeLinejoin="round" />
      ))}
    </svg>
  );
}

// ─── History panel ─────────────────────────────────────────────────────────────

interface HistoryEntry { expr: string; result: string }

// ─── Main Calculator ───────────────────────────────────────────────────────────

export default function Calculator() {
  const { colors, accentColors } = useCrtTheme();
  const c = colors.primary;

  const [tab, setTab] = useState<'calc' | 'graph'>('calc');
  const [expr, setExpr] = useState('');
  const [result, setResult] = useState('0');
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'DEG' | 'RAD'>('DEG');
  const [mem, setMem] = useState(0);
  const [ans, setAns] = useState(0);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [graphFunc, setGraphFunc] = useState('sin(x)');
  const [graphExpr, setGraphExpr] = useState('sin(x)');
  const [xMin, setXMin] = useState(-10);
  const [xMax, setXMax] = useState(10);
  const [yMin, setYMin] = useState(-5);
  const [yMax, setYMax] = useState(5);
  const [graphError, setGraphError] = useState('');
  const [shift, setShift] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Focus the expression input when the component mounts
  useEffect(() => { inputRef.current?.focus(); }, []);

  const compute = useCallback((e = expr) => {
    if (!e.trim()) return;
    try {
      const val = safeEval(e, mode, mem, ans);
      const res = formatResult(val);
      setResult(res);
      setError('');
      setAns(val);
      setHistory(prev => [{ expr: e, result: res }, ...prev.slice(0, 49)]);
      setExpr('');
      setTimeout(() => inputRef.current?.focus(), 10);
    } catch (err) {
      setError('ERROR');
      setResult('ERROR');
    }
  }, [expr, mode, mem, ans]);

  const append = useCallback((s: string) => {
    setExpr(prev => {
      const next = prev + s;
      setError('');
      return next;
    });
    setTimeout(() => {
      const el = inputRef.current;
      if (el) { el.focus(); el.setSelectionRange(el.value.length + s.length, el.value.length + s.length); }
    }, 10);
  }, []);

  const del = useCallback(() => {
    setExpr(prev => prev.slice(0, -1));
    setError('');
    inputRef.current?.focus();
  }, []);

  const clear = useCallback(() => {
    setExpr('');
    setResult('0');
    setError('');
    inputRef.current?.focus();
  }, []);

  const plotGraph = () => {
    setGraphError('');
    try {
      evalGraph(graphFunc, 1, mode);
      setGraphExpr(graphFunc);
    } catch {
      setGraphError('Invalid expression');
    }
  };

  const bg = '#000';
  const panelBg = `${c}06`;
  const borderC = `${c}20`;

  const btnBase: React.CSSProperties = {
    fontFamily: '"Courier New", monospace',
    fontSize: 11,
    cursor: 'pointer',
    border: `1px solid ${c}30`,
    background: `${c}08`,
    color: `${c}cc`,
    padding: '7px 4px',
    letterSpacing: 0.3,
    userSelect: 'none',
    borderRadius: 2,
    transition: 'background 0.08s',
  };
  const btnOp: React.CSSProperties = { ...btnBase, background: `${c}15`, color: c, fontWeight: 'bold', fontSize: 13 };
  const btnEq: React.CSSProperties = { ...btnBase, background: `${accentColors.green}20`, color: accentColors.green, border: `1px solid ${accentColors.green}55`, fontWeight: 'bold', fontSize: 15, padding: '7px 4px' };
  const btnSci: React.CSSProperties = { ...btnBase, color: accentColors.cyan, border: `1px solid ${accentColors.cyan}25`, background: `${accentColors.cyan}06`, fontSize: 10 };
  const btnMem: React.CSSProperties = { ...btnBase, color: accentColors.amber, border: `1px solid ${accentColors.amber}25`, background: `${accentColors.amber}06`, fontSize: 10 };
  const btnAC: React.CSSProperties = { ...btnBase, color: accentColors.red, border: `1px solid ${accentColors.red}45`, background: `${accentColors.red}10`, fontWeight: 'bold' };
  const btnShift: React.CSSProperties = { ...btnBase, color: accentColors.purple, border: `1px solid ${accentColors.purple}45`, background: shift ? `${accentColors.purple}20` : `${accentColors.purple}06`, fontWeight: shift ? 'bold' : 'normal' };

  // Scientific button: shows primary/secondary label based on shift, appends appropriate string
  const sciBtn = (primary: string, secondary: string, primaryIns: string, secondaryIns: string) => (
    <button
      style={{ ...btnSci, color: shift ? accentColors.amber : accentColors.cyan }}
      onClick={() => { append(shift ? secondaryIns : primaryIns); setShift(false); inputRef.current?.focus(); }}
      title={shift ? secondary : primary}
    >
      {shift ? secondary : primary}
    </button>
  );

  const numGrid: Array<{ lbl: string; ins: string; style: React.CSSProperties }> = [
    { lbl:'7', ins:'7', style:btnBase }, { lbl:'8', ins:'8', style:btnBase }, { lbl:'9', ins:'9', style:btnBase },
    { lbl:'÷', ins:'÷', style:btnOp }, { lbl:'^', ins:'^', style:btnOp },
    { lbl:'4', ins:'4', style:btnBase }, { lbl:'5', ins:'5', style:btnBase }, { lbl:'6', ins:'6', style:btnBase },
    { lbl:'×', ins:'×', style:btnOp }, { lbl:'√(', ins:'√(', style:{ ...btnSci, fontSize: 13 } },
    { lbl:'1', ins:'1', style:btnBase }, { lbl:'2', ins:'2', style:btnBase }, { lbl:'3', ins:'3', style:btnBase },
    { lbl:'−', ins:'-', style:btnOp }, { lbl:'x²', ins:'**2', style:btnSci },
    { lbl:'(', ins:'(', style:{ ...btnBase, color: `${c}90` } },
    { lbl:')', ins:')', style:{ ...btnBase, color: `${c}90` } },
    { lbl:'0', ins:'0', style:btnBase },
    { lbl:'.', ins:'.', style:btnBase },
    { lbl:'+', ins:'+', style:btnOp },
  ];

  return (
    <div
      style={{ height: '100%', background: bg, color: c, fontFamily: '"Courier New", monospace',
        display: 'flex', flexDirection: 'column', overflow: 'hidden', userSelect: 'none' }}
      onClick={() => inputRef.current?.focus()}
    >
      {/* ── Tab bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 8px',
        borderBottom: `1px solid ${borderC}`, background: panelBg, flexShrink: 0 }}>
        {(['calc','graph'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            ...btnBase, fontSize: 9, padding: '3px 10px', letterSpacing: 1,
            background: tab === t ? `${c}18` : 'transparent',
            color: tab === t ? c : `${c}45`,
            border: `1px solid ${tab === t ? c + '50' : 'transparent'}`,
          }}>
            {t.toUpperCase()}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 9, color: `${accentColors.amber}70`, letterSpacing: 0.5 }}>M: {mem}</span>
        <button onClick={() => setMode(m => m === 'DEG' ? 'RAD' : 'DEG')} style={{
          ...btnBase, fontSize: 9, padding: '2px 8px',
          color: accentColors.amber, border: `1px solid ${accentColors.amber}35`,
        }}>
          {mode}
        </button>
        <button onClick={() => setShowHistory(h => !h)} style={{
          ...btnBase, fontSize: 9, padding: '2px 8px',
          color: showHistory ? accentColors.purple : `${c}45`,
          border: `1px solid ${showHistory ? accentColors.purple + '45' : borderC}`,
        }}>
          HIST
        </button>
      </div>

      {/* ── Main content ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {tab === 'calc' ? (
            <>
              {/* ── Display ── */}
              <div style={{ padding: '8px 10px 6px', borderBottom: `1px solid ${borderC}`,
                background: '#020202', flexShrink: 0 }}>

                {/* Previous result / ANS */}
                <div style={{ fontSize: 9, color: `${c}35`, textAlign: 'right', marginBottom: 2, minHeight: 13 }}>
                  {ans !== 0 && !error ? `ANS = ${formatResult(ans)}` : ''}
                </div>

                {/* Expression input — fully editable */}
                <input
                  ref={inputRef}
                  value={expr}
                  onChange={e => { setExpr(e.target.value); setError(''); }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') { e.preventDefault(); compute(); }
                    if (e.key === 'Escape') { e.preventDefault(); clear(); }
                  }}
                  placeholder="0"
                  spellCheck={false}
                  autoComplete="off"
                  style={{
                    display: 'block', width: '100%', background: 'transparent', border: 'none',
                    outline: 'none', color: error ? accentColors.red : `${c}cc`,
                    fontFamily: '"Courier New", monospace', fontSize: 14,
                    textAlign: 'right', padding: '2px 0', letterSpacing: 0.5, boxSizing: 'border-box',
                    caretColor: c,
                  }}
                />

                {/* Result display */}
                <div style={{
                  fontSize: error ? 18 : 28, fontWeight: 'bold', textAlign: 'right',
                  color: error ? accentColors.red : accentColors.green,
                  letterSpacing: 1, minHeight: 34, lineHeight: 1.2,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {error ? 'ERROR' : result}
                </div>
              </div>

              {/* ── Keypad ── */}
              <div style={{ flex: 1, overflow: 'auto', padding: '6px 6px 4px' }}>

                {/* Row 0: Shift / AC / DEL / % / ANS */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 3, marginBottom: 3 }}>
                  <button style={btnShift} onClick={() => { setShift(s => !s); inputRef.current?.focus(); }}>2nd</button>
                  <button style={btnAC} onClick={clear}>AC</button>
                  <button style={btnBase} onClick={del}>DEL</button>
                  <button style={btnBase} onClick={() => { append('%'); }}>%</button>
                  <button style={{ ...btnBase, color: accentColors.amber }}
                    onClick={() => { append('ANS'); }}>ANS</button>
                </div>

                {/* Row 1: Trig */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 3, marginBottom: 3 }}>
                  {sciBtn('sin(', 'asin(', 'sin(', 'asin(')}
                  {sciBtn('cos(', 'acos(', 'cos(', 'acos(')}
                  {sciBtn('tan(', 'atan(', 'tan(', 'atan(')}
                  {sciBtn('log(', 'ln(', 'log(', 'ln(')}
                  <button style={{ ...btnSci, color: shift ? accentColors.amber : accentColors.cyan }}
                    onClick={() => { append(shift ? `(${Math.E})` : 'π'); setShift(false); inputRef.current?.focus(); }}>
                    {shift ? 'e' : 'π'}
                  </button>
                </div>

                {/* Row 2: Hyperbolic + abs + cbrt */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 3, marginBottom: 3 }}>
                  <button style={btnSci} onClick={() => { append('sinh('); inputRef.current?.focus(); }}>sinh(</button>
                  <button style={btnSci} onClick={() => { append('cosh('); inputRef.current?.focus(); }}>cosh(</button>
                  <button style={btnSci} onClick={() => { append('tanh('); inputRef.current?.focus(); }}>tanh(</button>
                  <button style={btnSci} onClick={() => { append('abs('); inputRef.current?.focus(); }}>|x|</button>
                  <button style={btnSci} onClick={() => { append('cbrt('); inputRef.current?.focus(); }}>∛(</button>
                </div>

                {/* Number + operator grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 3, marginBottom: 3 }}>
                  {numGrid.map((btn, i) => (
                    <button key={i} style={btn.style} onClick={() => { append(btn.ins); }}>
                      {btn.lbl}
                    </button>
                  ))}
                </div>

                {/* Memory + equals */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 3 }}>
                  <button style={btnMem} onClick={() => {
                    try { const v = safeEval(expr || result, mode, mem, ans); setMem(m => m + v); } catch {}
                    inputRef.current?.focus();
                  }}>M+</button>
                  <button style={btnMem} onClick={() => {
                    try { const v = safeEval(expr || result, mode, mem, ans); setMem(m => m - v); } catch {}
                    inputRef.current?.focus();
                  }}>M-</button>
                  <button style={btnMem} onClick={() => { append('MEM'); }}>MR</button>
                  <button style={btnMem} onClick={() => { setMem(0); inputRef.current?.focus(); }}>MC</button>
                  <button style={btnEq} onClick={() => compute()}>=</button>
                </div>
              </div>
            </>
          ) : (
            /* ── Graph tab ── */
            <div style={{ flex: 1, overflow: 'auto', padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 9, color: `${c}45`, letterSpacing: 1 }}>f(x) =</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  value={graphFunc}
                  onChange={e => setGraphFunc(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') plotGraph(); }}
                  style={{ flex: 1, background: 'transparent', border: `1px solid ${c}35`,
                    color: c, fontFamily: '"Courier New", monospace', fontSize: 12,
                    padding: '5px 8px', outline: 'none', borderRadius: 2 }}
                  placeholder="sin(x), x^2+1, ..."
                />
                <button onClick={plotGraph} style={{ ...btnBase, color: accentColors.green,
                  border: `1px solid ${accentColors.green}45`, padding: '5px 14px', fontSize: 10, letterSpacing: 1 }}>
                  PLOT
                </button>
              </div>
              {graphError && <div style={{ fontSize: 10, color: accentColors.red }}>{graphError}</div>}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {([
                  ['xMin', xMin, setXMin], ['xMax', xMax, setXMax],
                  ['yMin', yMin, setYMin], ['yMax', yMax, setYMax],
                ] as const).map(([label, val, setter]) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 10, color: `${c}55`, width: 36, flexShrink: 0 }}>{label}:</span>
                    <input type="number" value={val}
                      onChange={e => setter(parseFloat(e.target.value) || 0)}
                      style={{ flex: 1, background: 'transparent', border: `1px solid ${c}25`,
                        color: c, fontFamily: '"Courier New", monospace', fontSize: 10,
                        padding: '3px 5px', outline: 'none', borderRadius: 2 }}
                    />
                  </div>
                ))}
              </div>

              <GraphPlot
                func={graphExpr} xMin={xMin} xMax={xMax} yMin={yMin} yMax={yMax}
                mode={mode} c={c} accentColors={accentColors}
              />

              <div style={{ fontSize: 9, color: `${c}28`, textAlign: 'center' }}>
                {graphExpr} · x:[{xMin}, {xMax}] · y:[{yMin}, {yMax}] · {mode}
              </div>
            </div>
          )}
        </div>

        {/* ── History panel ── */}
        {showHistory && (
          <div style={{ width: 140, borderLeft: `1px solid ${borderC}`, background: panelBg,
            display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
            <div style={{ padding: '5px 8px', borderBottom: `1px solid ${borderC}`,
              fontSize: 8, color: `${c}50`, letterSpacing: 1 }}>HISTORY</div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 4 }}>
              {history.length === 0 && (
                <div style={{ fontSize: 9, color: `${c}25`, padding: 10, textAlign: 'center' }}>Empty</div>
              )}
              {history.map((h, i) => (
                <button key={i}
                  onClick={() => { setExpr(h.expr); setError(''); setResult(h.result); inputRef.current?.focus(); }}
                  style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none',
                    borderBottom: `1px solid ${c}08`, color: c, padding: '5px 6px', cursor: 'pointer',
                    fontFamily: '"Courier New", monospace' }}>
                  <div style={{ fontSize: 9, color: `${c}45`, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {h.expr}
                  </div>
                  <div style={{ fontSize: 11, color: accentColors.green, fontWeight: 'bold' }}>
                    {h.result}
                  </div>
                </button>
              ))}
            </div>
            <button onClick={() => { setHistory([]); inputRef.current?.focus(); }}
              style={{ ...btnBase, fontSize: 9, borderRadius: 0, border: 'none',
                borderTop: `1px solid ${borderC}`, color: accentColors.red, padding: '5px' }}>
              CLEAR
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
