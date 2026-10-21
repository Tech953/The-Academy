/**
 * TI-30XS-mode calculator core — Phase 2 (calculator policy).
 *
 * A small, safe expression evaluator covering the TI-30XS keys the quiz
 * calculator panel offers: + − × ÷, parentheses, x² (postfix ²), √,
 * powers (^), %, π, and unary minus. No `eval` — a recursive-descent
 * parser over a token stream, so expressions typed in the quiz can
 * never execute code. Throws Error with a display message on bad input.
 */

type Token =
  | { kind: 'num'; value: number }
  | { kind: 'op'; value: '+' | '-' | '*' | '/' | '^' }
  | { kind: 'lparen' } | { kind: 'rparen' }
  | { kind: 'sqrt' } | { kind: 'square' } | { kind: 'percent' };

function tokenize(expr: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const s = expr.replace(/,/g, '');
  while (i < s.length) {
    const ch = s[i];
    if (ch === ' ' || ch === '\t') { i += 1; continue; }
    if (/[0-9.]/.test(ch)) {
      let j = i;
      while (j < s.length && /[0-9.]/.test(s[j])) j += 1;
      const value = parseFloat(s.slice(i, j));
      if (Number.isNaN(value)) throw new Error('Invalid number');
      tokens.push({ kind: 'num', value });
      i = j; continue;
    }
    switch (ch) {
      case 'π': tokens.push({ kind: 'num', value: Math.PI }); i += 1; break;
      case '+': tokens.push({ kind: 'op', value: '+' }); i += 1; break;
      case '-': case '−': tokens.push({ kind: 'op', value: '-' }); i += 1; break;
      case '×': case '*': tokens.push({ kind: 'op', value: '*' }); i += 1; break;
      case '÷': case '/': tokens.push({ kind: 'op', value: '/' }); i += 1; break;
      case '^': tokens.push({ kind: 'op', value: '^' }); i += 1; break;
      case '(': tokens.push({ kind: 'lparen' }); i += 1; break;
      case ')': tokens.push({ kind: 'rparen' }); i += 1; break;
      case '√': tokens.push({ kind: 'sqrt' }); i += 1; break;
      case '²': tokens.push({ kind: 'square' }); i += 1; break;
      case '%': tokens.push({ kind: 'percent' }); i += 1; break;
      default: throw new Error(`Unexpected character: ${ch}`);
    }
  }
  return tokens;
}

class Parser {
  private pos = 0;
  constructor(private tokens: Token[]) {}

  private peek(): Token | undefined { return this.tokens[this.pos]; }
  private next(): Token | undefined { return this.tokens[this.pos++]; }

  parse(): number {
    if (this.tokens.length === 0) throw new Error('Empty expression');
    const value = this.parseExpr();
    if (this.pos !== this.tokens.length) throw new Error('Unexpected trailing input');
    return value;
  }

  // expr := term { ('+' | '-') term }
  private parseExpr(): number {
    let value = this.parseTerm();
    for (;;) {
      const t = this.peek();
      if (t?.kind === 'op' && (t.value === '+' || t.value === '-')) {
        this.next();
        const rhs = this.parseTerm();
        value = t.value === '+' ? value + rhs : value - rhs;
      } else return value;
    }
  }

  // term := factor { ('*' | '/') factor } — implicit multiplication
  // before '(' or '√' or a number following a ')' is also honored,
  // matching TI behavior (e.g. 2(3+4), 2π).
  private parseTerm(): number {
    let value = this.parseFactor();
    for (;;) {
      const t = this.peek();
      if (t?.kind === 'op' && (t.value === '*' || t.value === '/')) {
        this.next();
        const rhs = this.parseFactor();
        if (t.value === '/' && rhs === 0) throw new Error('Division by zero');
        value = t.value === '*' ? value * rhs : value / rhs;
      } else if (t?.kind === 'lparen' || t?.kind === 'sqrt' || t?.kind === 'num') {
        value = value * this.parseFactor();
      } else return value;
    }
  }

  // factor := postfix [ '^' factor ] (right-associative power)
  private parseFactor(): number {
    const base = this.parsePostfix();
    const t = this.peek();
    if (t?.kind === 'op' && t.value === '^') {
      this.next();
      return Math.pow(base, this.parseFactor());
    }
    return base;
  }

  // postfix := primary { '²' | '%' }
  private parsePostfix(): number {
    let value = this.parsePrimary();
    for (;;) {
      const t = this.peek();
      if (t?.kind === 'square') { this.next(); value = value * value; }
      else if (t?.kind === 'percent') { this.next(); value = value / 100; }
      else return value;
    }
  }

  private parsePrimary(): number {
    const t = this.next();
    if (!t) throw new Error('Unexpected end of expression');
    if (t.kind === 'num') return t.value;
    if (t.kind === 'op' && t.value === '-') return -this.parsePrimary();
    if (t.kind === 'op' && t.value === '+') return this.parsePrimary();
    if (t.kind === 'sqrt') {
      const operand = this.parsePrimary();
      if (operand < 0) throw new Error('√ of a negative number');
      return Math.sqrt(operand);
    }
    if (t.kind === 'lparen') {
      const value = this.parseExpr();
      const close = this.next();
      if (close?.kind !== 'rparen') throw new Error('Missing closing parenthesis');
      return value;
    }
    throw new Error('Unexpected token');
  }
}

/** Evaluate a calculator expression; throws Error with a user-facing message. */
export function evaluateExpression(expr: string): number {
  const result = new Parser(tokenize(expr)).parse();
  if (!Number.isFinite(result)) throw new Error('Result is not a finite number');
  return result;
}

/** TI-style display: up to 10 significant digits, trailing zeros trimmed. */
export function formatResult(n: number): string {
  if (Number.isInteger(n) && Math.abs(n) < 1e15) return String(n);
  const s = parseFloat(n.toPrecision(10)).toString();
  return s;
}
