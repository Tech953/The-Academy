/**
 * TI-30XS-mode calculator panel — Phase 2 (calculator policy).
 *
 * The on-screen calculator offered inside assessed math quizzes when an
 * item allows it (GEDPracticeQuestion.calculatorAllowed). Key set mirrors
 * the TI-30XS core: digits, + − × ÷, parentheses, x², √, ^, %, π, ±.
 * All evaluation goes through the safe parser in lib/ti30xs (no eval).
 */
import { useState } from 'react';
import { evaluateExpression, formatResult } from '../../../lib/ti30xs';

const KEYS: Array<{ label: string; insert?: string; action?: 'clear' | 'back' | 'equals' | 'negate' }> = [
  { label: 'C', action: 'clear' }, { label: '(', insert: '(' }, { label: ')', insert: ')' }, { label: '÷', insert: '÷' },
  { label: '7', insert: '7' }, { label: '8', insert: '8' }, { label: '9', insert: '9' }, { label: '×', insert: '×' },
  { label: '4', insert: '4' }, { label: '5', insert: '5' }, { label: '6', insert: '6' }, { label: '−', insert: '−' },
  { label: '1', insert: '1' }, { label: '2', insert: '2' }, { label: '3', insert: '3' }, { label: '+', insert: '+' },
  { label: '0', insert: '0' }, { label: '.', insert: '.' }, { label: '⌫', action: 'back' }, { label: '=', action: 'equals' },
  { label: 'x²', insert: '²' }, { label: '√', insert: '√(' }, { label: 'xʸ', insert: '^' }, { label: '%', insert: '%' },
  { label: 'π', insert: 'π' }, { label: '±', action: 'negate' },
];

export default function Ti30xsCalculator({ accent }: { accent: string }) {
  const [expr, setExpr] = useState('');
  const [display, setDisplay] = useState('0');
  const [error, setError] = useState<string | null>(null);

  function press(key: (typeof KEYS)[number]) {
    setError(null);
    if (key.action === 'clear') { setExpr(''); setDisplay('0'); return; }
    if (key.action === 'back') { setExpr(e => e.slice(0, -1)); return; }
    if (key.action === 'negate') {
      setExpr(e => (e.startsWith('-') ? e.slice(1) : `-${e}`));
      return;
    }
    if (key.action === 'equals') {
      try {
        const result = formatResult(evaluateExpression(expr));
        setDisplay(result);
        setExpr(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error');
      }
      return;
    }
    if (key.insert) setExpr(e => e + key.insert);
  }

  return (
    <div style={{
      border: `1px solid ${accent}55`, background: '#0a0f0a', padding: 10,
      fontFamily: '"Courier New", monospace', maxWidth: 260,
    }}>
      <div style={{ fontSize: 9, color: `${accent}90`, letterSpacing: 2, marginBottom: 6 }}>
        TI-30XS · ON-SCREEN CALCULATOR
      </div>
      <div style={{
        background: '#101a10', border: `1px solid ${accent}33`, padding: '6px 8px',
        minHeight: 34, marginBottom: 8, textAlign: 'right',
      }}>
        <div style={{ fontSize: 10, color: `${accent}70`, minHeight: 12, wordBreak: 'break-all' }}>{expr || ' '}</div>
        <div style={{ fontSize: 16, color: error ? '#ff5555' : accent, fontWeight: 'bold' }}>
          {error ?? display}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
        {KEYS.map(key => (
          <button key={key.label} onClick={() => press(key)} style={{
            background: '#111', border: `1px solid ${accent}33`, color: `${accent}dd`,
            padding: '5px 0', cursor: 'pointer', fontFamily: 'inherit', fontSize: 11,
          }}>
            {key.label}
          </button>
        ))}
      </div>
    </div>
  );
}
