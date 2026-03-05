import { useState, useEffect, useCallback, useRef } from 'react';
import { useCrtTheme } from '@/contexts/CrtThemeContext';

// ─── Safe expression evaluator ────────────────────────────────────────────────

function safeEval(expr: string, mode: 'DEG' | 'RAD', mem: number, ans: number): number {
  const toR = (x: number) => mode === 'DEG' ? x * Math.PI / 180 : x;
  const fromR = (x: number) => mode === 'DEG' ? x * 180 / Math.PI : x;
  const clean = expr
    .replace(/π/g, `(${Math.PI})`)
    .replace(/\be\b/g, `(${Math.E})`)
    .replace(/ANS/g, `(${ans})`)
    .replace(/MEM/g, `(${mem})`)
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/\^/g, '**')
    .replace(/√\(/g, '_sqrt(')
    .replace(/√(\d+\.?\d*)/g, '_sqrt($1)')
    .replace(/sin\(/g, '_sin(')
    .replace(/cos\(/g, '_cos(')
    .replace(/tan\(/g, '_tan(')
    .replace(/asin\(/g, '_asin(')
    .replace(/acos\(/g, '_acos(')
    .replace(/atan\(/g, '_atan(')
    .replace(/sinh\(/g, '_sinh(')
    .replace(/cosh\(/g, '_cosh(')
    .replace(/tanh\(/g, '_tanh(')
    .replace(/log\(/g, '_log(')
    .replace(/ln\(/g, '_ln(')
    .replace(/abs\(/g, '_abs(')
    .replace(/cbrt\(/g, '_cbrt(')
    .replace(/(\d)\(/g, '$1*(');

  if (!/^[\d\s\+\-\*\/\.\(\)\%_a-z]+$/.test(clean)) throw new Error('Invalid expression');

  // eslint-disable-next-line no-new-func
  const fn = new Function(
    '_sin','_cos','_tan','_asin','_acos','_atan',
    '_sinh','_cosh','_tanh','_log','_ln','_abs','_sqrt','_cbrt',
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
  );
}

function evalGraph(expr: string, x: number, mode: 'DEG' | 'RAD'): number {
  const safe = expr.replace(/x/g, `(${x})`);
  return safeEval(safe, mode, 0, 0);
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

  const points: string[] = [];
  const segments: string[][] = [];
  let cur: string[] = [];
  const steps = 400;
  for (let i = 0; i <= steps; i++) {
    const x = xMin + (i / steps) * (xMax - xMin);
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

  const gridColor = `${c}25`;
  const axisColor = `${c}60`;
  const gridLines: number[] = [];
  const step = (xMax - xMin) / 8;
  for (let v = Math.ceil(xMin / step) * step; v <= xMax; v += step) gridLines.push(v);
  const gridLinesY: number[] = [];
  const stepY = (yMax - yMin) / 6;
  for (let v = Math.ceil(yMin / stepY) * stepY; v <= yMax; v += stepY) gridLinesY.push(v);

  return (
    <svg width={W} height={H} style={{ display: 'block', background: '#00000088', border: `1px solid ${c}30` }}>
      {gridLines.map(v => (
        <line key={`vg${v}`} x1={toSX(v)} y1={0} x2={toSX(v)} y2={H} stroke={gridColor} strokeWidth={0.5} />
      ))}
      {gridLinesY.map(v => (
        <line key={`hg${v}`} x1={0} y1={toSY(v)} x2={W} y2={toSY(v)} stroke={gridColor} strokeWidth={0.5} />
      ))}
      {xMin <= 0 && xMax >= 0 && (
        <line x1={toSX(0)} y1={0} x2={toSX(0)} y2={H} stroke={axisColor} strokeWidth={1} />
      )}
      {yMin <= 0 && yMax >= 0 && (
        <line x1={0} y1={toSY(0)} x2={W} y2={toSY(0)} stroke={axisColor} strokeWidth={1} />
      )}
      {segments.map((seg, i) => (
        <polyline key={i} points={seg.join(' ')} fill="none" stroke={accentColors.cyan} strokeWidth={1.5} strokeLinejoin="round" />
      ))}
      {points.length > 0 && <polyline points={points.join(' ')} fill="none" stroke={accentColors.cyan} strokeWidth={1.5} />}
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

  const compute = useCallback((e = expr) => {
    if (!e.trim()) return;
    try {
      const val = safeEval(e, mode, mem, ans);
      const res = Number.isInteger(val) ? String(val) : parseFloat(val.toFixed(10)).toString();
      setResult(res);
      setError('');
      setAns(val);
      setHistory(prev => [{ expr: e, result: res }, ...prev.slice(0, 29)]);
    } catch {
      setError('ERROR');
      setResult('ERROR');
    }
  }, [expr, mode, mem, ans]);

  const append = useCallback((s: string) => {
    setExpr(prev => prev + s);
    setError('');
  }, []);

  const del = useCallback(() => setExpr(prev => prev.slice(0, -1)), []);
  const clear = useCallback(() => { setExpr(''); setResult('0'); setError(''); }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (tab !== 'calc') return;
      if (e.key === 'Enter') { compute(); return; }
      if (e.key === 'Escape') { clear(); return; }
      if (e.key === 'Backspace') { del(); return; }
      const allowed = '0123456789.+-*/()^%';
      if (e.key.length === 1 && allowed.includes(e.key)) append(e.key);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [tab, compute, clear, del, append]);

  const plotGraph = () => {
    setGraphError('');
    try {
      evalGraph(graphFunc, 1, mode);
      setGraphExpr(graphFunc);
    } catch {
      setGraphError('Invalid function');
    }
  };

  const bg = '#000';
  const panelBg = `${c}08`;
  const borderC = `${c}25`;

  const btnBase: React.CSSProperties = {
    fontFamily: '"Courier New", monospace',
    fontSize: 10,
    cursor: 'pointer',
    border: `1px solid ${c}35`,
    background: `${c}0a`,
    color: `${c}cc`,
    padding: '5px 2px',
    letterSpacing: 0.5,
    transition: 'background 0.1s',
    userSelect: 'none',
  };
  const btnOp: React.CSSProperties = { ...btnBase, background: `${c}18`, color: c, fontWeight: 'bold' };
  const btnEq: React.CSSProperties = { ...btnBase, background: `${accentColors.green}25`, color: accentColors.green, border: `1px solid ${accentColors.green}60`, fontWeight: 'bold', fontSize: 13 };
  const btnSci: React.CSSProperties = { ...btnBase, color: accentColors.cyan, border: `1px solid ${accentColors.cyan}30`, background: `${accentColors.cyan}08`, fontSize: 9 };
  const btnMem: React.CSSProperties = { ...btnBase, color: accentColors.amber, border: `1px solid ${accentColors.amber}30`, background: `${accentColors.amber}08`, fontSize: 9 };
  const btnAC: React.CSSProperties = { ...btnBase, color: accentColors.red, border: `1px solid ${accentColors.red}50`, background: `${accentColors.red}12`, fontWeight: 'bold' };
  const btnShift: React.CSSProperties = { ...btnBase, color: accentColors.purple, border: `1px solid ${accentColors.purple}50`, background: shift ? `${accentColors.purple}20` : `${accentColors.purple}08` };

  const sciBtn = (label: string, primary: string, secondary: string, ins: string) => (
    <button
      key={label}
      style={btnSci}
      onClick={() => { append(ins); setShift(false); }}
      title={shift ? secondary : primary}
    >
      {shift && secondary ? secondary : primary}
    </button>
  );

  const numGrid: [string, string, React.CSSProperties][] = [
    ['7','7',btnBase],['8','8',btnBase],['9','9',btnBase],['÷','÷',btnOp],['^','^',btnOp],
    ['4','4',btnBase],['5','5',btnBase],['6','6',btnBase],['×','×',btnOp],['√(','√',{ ...btnSci, fontSize: 12 }],
    ['1','1',btnBase],['2','2',btnBase],['3','3',btnBase],['-','-',btnOp],['x²','x²',btnSci],
    ['(','(',btnBase],[')',')',btnBase],['0','0',btnBase],['.','.',btnBase],['+','+',btnOp],
  ];

  return (
    <div style={{ height: '100%', background: bg, color: c, fontFamily: '"Courier New", monospace',
      display: 'flex', flexDirection: 'column', overflow: 'hidden', userSelect: 'none' }}>

      {/* Tab bar + mode + memory */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px',
        borderBottom: `1px solid ${borderC}`, background: panelBg, flexShrink: 0 }}>
        {(['calc','graph'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            ...btnBase, fontSize: 9, padding: '3px 10px', letterSpacing: 1,
            background: tab === t ? `${c}20` : 'transparent',
            color: tab === t ? c : `${c}50`,
            border: `1px solid ${tab === t ? c + '60' : 'transparent'}`,
          }}>
            {t.toUpperCase()}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 9, color: `${accentColors.amber}80` }}>M:{mem}</span>
        <button onClick={() => setMode(m => m === 'DEG' ? 'RAD' : 'DEG')} style={{
          ...btnBase, fontSize: 9, padding: '2px 7px',
          color: accentColors.amber, border: `1px solid ${accentColors.amber}40`,
        }}>
          {mode}
        </button>
        <button onClick={() => setShowHistory(h => !h)} style={{
          ...btnBase, fontSize: 9, padding: '2px 7px',
          color: showHistory ? accentColors.purple : `${c}50`,
          border: `1px solid ${showHistory ? accentColors.purple + '50' : borderC}`,
        }}>
          HIST
        </button>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {tab === 'calc' ? (
            <>
              {/* Display */}
              <div style={{ padding: '8px 10px', borderBottom: `1px solid ${borderC}`,
                background: '#000', flexShrink: 0 }}>
                <div style={{ fontSize: 10, color: `${c}40`, minHeight: 16, textAlign: 'right',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {expr || '…'}
                </div>
                <div style={{ fontSize: 22, color: error ? accentColors.red : c, textAlign: 'right',
                  fontWeight: 'bold', letterSpacing: 1, minHeight: 30, lineHeight: 1.2,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {error || result}
                </div>
              </div>

              {/* Keypad */}
              <div style={{ flex: 1, overflow: 'auto', padding: 6 }}>
                {/* Shift + special */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 3, marginBottom: 3 }}>
                  <button style={btnShift} onClick={() => setShift(s => !s)}>2nd</button>
                  <button style={btnAC} onClick={clear}>AC</button>
                  <button style={btnBase} onClick={del}>DEL</button>
                  <button style={btnBase} onClick={() => append('%')}>%</button>
                  <button style={{ ...btnBase, color: accentColors.amber }} onClick={() => append('ANS')}>ANS</button>
                </div>

                {/* Sci row 1 */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 3, marginBottom: 3 }}>
                  {sciBtn('sin', 'sin(', 'asin(', shift ? 'asin(' : 'sin(')}
                  {sciBtn('cos', 'cos(', 'acos(', shift ? 'acos(' : 'cos(')}
                  {sciBtn('tan', 'tan(', 'atan(', shift ? 'atan(' : 'tan(')}
                  {sciBtn('log', 'log(', 'ln(', shift ? 'ln(' : 'log(')}
                  <button style={btnSci} onClick={() => { append(shift ? `(${Math.E})` : `π`); setShift(false); }}>
                    {shift ? 'e' : 'π'}
                  </button>
                </div>

                {/* Sci row 2 */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 3, marginBottom: 3 }}>
                  <button style={btnSci} onClick={() => append('sinh(')}>sinh</button>
                  <button style={btnSci} onClick={() => append('cosh(')}>cosh</button>
                  <button style={btnSci} onClick={() => append('tanh(')}>tanh</button>
                  <button style={btnSci} onClick={() => append('abs(')}>|x|</button>
                  <button style={btnSci} onClick={() => append('cbrt(')}>∛</button>
                </div>

                {/* Number grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 3, marginBottom: 3 }}>
                  {numGrid.map(([ins, lbl, style], i) => (
                    <button key={i} style={style} onClick={() => {
                      if (ins === 'x²') append('**2');
                      else append(ins);
                    }}>
                      {lbl}
                    </button>
                  ))}
                </div>

                {/* Memory + equals */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 3 }}>
                  <button style={btnMem} onClick={() => { const v = safeEval(expr || result, mode, mem, ans); setMem(m => m + v); }}>M+</button>
                  <button style={btnMem} onClick={() => { const v = safeEval(expr || result, mode, mem, ans); setMem(m => m - v); }}>M-</button>
                  <button style={btnMem} onClick={() => append('MEM')}>MR</button>
                  <button style={btnMem} onClick={() => setMem(0)}>MC</button>
                  <button style={btnEq} onClick={() => compute()}>＝</button>
                </div>
              </div>
            </>
          ) : (
            /* Graph tab */
            <div style={{ flex: 1, overflow: 'auto', padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 9, color: `${c}50`, letterSpacing: 1 }}>f(x) =</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  value={graphFunc}
                  onChange={e => setGraphFunc(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') plotGraph(); }}
                  style={{ flex: 1, background: 'transparent', border: `1px solid ${c}40`, color: c,
                    fontFamily: '"Courier New", monospace', fontSize: 12, padding: '5px 8px', outline: 'none' }}
                  placeholder="sin(x), x^2+1, ..."
                />
                <button onClick={plotGraph} style={{ ...btnBase, color: accentColors.green,
                  border: `1px solid ${accentColors.green}50`, padding: '5px 12px', fontSize: 10, letterSpacing: 1 }}>
                  PLOT
                </button>
              </div>
              {graphError && <div style={{ fontSize: 10, color: accentColors.red }}>{graphError}</div>}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 10 }}>
                {([['xMin', xMin, setXMin], ['xMax', xMax, setXMax], ['yMin', yMin, setYMin], ['yMax', yMax, setYMax]] as const).map(([label, val, setter]) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ color: `${c}60`, width: 34 }}>{label}:</span>
                    <input type="number" value={val}
                      onChange={e => setter(parseFloat(e.target.value) || 0)}
                      style={{ flex: 1, background: 'transparent', border: `1px solid ${c}30`, color: c,
                        fontFamily: '"Courier New", monospace', fontSize: 10, padding: '3px 5px', outline: 'none', width: '100%' }}
                    />
                  </div>
                ))}
              </div>

              <GraphPlot
                func={graphExpr} xMin={xMin} xMax={xMax} yMin={yMin} yMax={yMax}
                mode={mode} c={c} accentColors={accentColors}
              />

              <div style={{ fontSize: 9, color: `${c}30`, textAlign: 'center' }}>
                {graphExpr}  |  x:[{xMin},{xMax}]  y:[{yMin},{yMax}]  {mode}
              </div>
            </div>
          )}
        </div>

        {/* History panel */}
        {showHistory && (
          <div style={{ width: 130, borderLeft: `1px solid ${borderC}`, background: panelBg,
            display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
            <div style={{ padding: '5px 8px', borderBottom: `1px solid ${borderC}`, fontSize: 9,
              color: `${c}60`, letterSpacing: 1 }}>HISTORY</div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 4 }}>
              {history.length === 0 && (
                <div style={{ fontSize: 9, color: `${c}30`, padding: 8, textAlign: 'center' }}>No history</div>
              )}
              {history.map((h, i) => (
                <button key={i} onClick={() => { setExpr(h.expr); setResult(h.result); setError(''); }}
                  style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none',
                    borderBottom: `1px solid ${c}10`, color: c, padding: '5px 6px', cursor: 'pointer',
                    fontFamily: '"Courier New", monospace' }}>
                  <div style={{ fontSize: 9, color: `${c}50`, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {h.expr}
                  </div>
                  <div style={{ fontSize: 11, color: accentColors.green, fontWeight: 'bold' }}>
                    {h.result}
                  </div>
                </button>
              ))}
            </div>
            <button onClick={() => setHistory([])}
              style={{ ...btnBase, fontSize: 9, borderRadius: 0, border: 'none', borderTop: `1px solid ${borderC}`,
                color: accentColors.red, padding: '5px' }}>
              CLEAR
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
