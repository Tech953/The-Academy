/**
 * ItemForge — Phase 3. Seeded, deterministic item generation.
 *
 * Every forged item is CORRECT BY CONSTRUCTION: numeric templates
 * compute the answer (and error-based distractors) from the generated
 * parameters; bank templates draw from keyed stimulus/fact banks.
 * Nothing generated is hand-keyed after the fact.
 *
 * Generation is a pure function of (templateId, seed): the same seed
 * always produces the same item. Materialized banks record their
 * provenance ({ source: 'itemforge', seed, template }) on each item so
 * any bank item can be regenerated and re-audited exactly — per the
 * roadmap's generation decision: seeded, pre-generated, Auditor-passed
 * banks for anything assessed.
 */
import type { GEDPracticeQuestion, QuestionDifficulty } from '@shared/schema';

// ─────────────────────────────────────────────────────────────────────────────
// SEEDED PRNG (mulberry32) — small, fast, reproducible across platforms.
// ─────────────────────────────────────────────────────────────────────────────

export type Rng = () => number;

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Stable string hash (FNV-1a) so lesson codes can seed generation. */
export function seedFromString(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function int(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}
function pick<T>(rng: Rng, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}
function shuffle<T>(rng: Rng, arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function gcd(a: number, b: number): number { return b === 0 ? a : gcd(b, a % b); }
function fracStr(n: number, d: number): string {
  const g = gcd(Math.abs(n), Math.abs(d)) || 1;
  const nn = n / g, dd = d / g;
  return dd === 1 ? `${nn}` : `${nn}/${dd}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE CONTRACT
// ─────────────────────────────────────────────────────────────────────────────

export interface ForgeContext {
  gedCode: string;
  skillNodeId: string;
  difficulty: QuestionDifficulty;
}

export interface ItemTemplate {
  id: string;
  subject: string;
  generate: (rng: Rng, ctx: ForgeContext) => GEDPracticeQuestion;
}

function mcqFrom(
  rng: Rng, ctx: ForgeContext, idTag: string,
  question: string, correct: string, distractors: string[], explanation: string,
): GEDPracticeQuestion {
  const uniqueDistractors = [...new Set(distractors.filter(d => d !== correct))];
  if (uniqueDistractors.length < 3) {
    throw new Error(`ItemForge: template produced fewer than 3 distinct distractors for: ${question.slice(0, 60)}`);
  }
  const options = shuffle(rng, [correct, ...uniqueDistractors.slice(0, 3)]);
  const letters = ['A', 'B', 'C', 'D'] as const;
  const choices = { A: options[0], B: options[1], C: options[2], D: options[3] };
  return {
    id: idTag, question, type: 'mcq', choices,
    answer: letters[options.indexOf(correct)],
    explanation, difficulty: ctx.difficulty,
    gedCode: ctx.gedCode, skillNodeId: ctx.skillNodeId,
  };
}

function forgeId(templateId: string, seed: number): string {
  return `FG.${templateId}.${seed.toString(36)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// NUMERIC TEMPLATES — answers computed from generated parameters.
// ─────────────────────────────────────────────────────────────────────────────

const arithOps: ItemTemplate = {
  id: 'arith-ops', subject: 'Mathematical Reasoning',
  generate(rng, ctx) {
    const seed = currentSeed(rng);
    const scale = ctx.difficulty === 'foundational' ? 1 : ctx.difficulty === 'extended' ? 3 : 2;
    const a = int(rng, 3, 12 * scale), b = int(rng, 2, 9 * scale);
    if (rng() < 0.5) {
      const total = a * b;
      const pool = [total - a, total + b, a + b, total + a, total - b];
      const distractors = [...new Set(pool.filter(w => w !== total))].slice(0, 3).map(String);
      return mcqFrom(rng, ctx, forgeId(this.id, seed),
        `A warehouse packs ${a} boxes per pallet. How many boxes are on ${b} full pallets?`,
        `${total}`, distractors,
        `${a} × ${b} = ${total} boxes.`);
    }
    const total = a * b;
    return {
      id: forgeId(this.id, seed),
      question: `${total} raffle tickets are shared equally among ${b} winners. How many tickets does each winner get?`,
      type: 'fill_in', answer: `${a}`, answerAliases: [`${a}`, `${a} tickets`],
      explanation: `${total} ÷ ${b} = ${a} tickets each.`,
      difficulty: ctx.difficulty, gedCode: ctx.gedCode, skillNodeId: ctx.skillNodeId,
      calculatorAllowed: false,
    };
  },
};

const decimalOps: ItemTemplate = {
  id: 'decimal-ops', subject: 'Mathematical Reasoning',
  generate(rng, ctx) {
    const seed = currentSeed(rng);
    const price = (int(rng, 125, 4999) / 100);
    const qty = int(rng, 2, 6);
    const total = Math.round(price * qty * 100) / 100;
    const fmt = (n: number) => n.toFixed(2);
    if (rng() < 0.5) {
      const poolVals = [total + price, Math.round((price + qty) * 100) / 100, total - 1, total + 1, total - price];
      const distractors = [...new Set(poolVals.map(fmt).filter(w => w !== fmt(total)))].slice(0, 3).map(w => `$${w}`);
      return mcqFrom(rng, ctx, forgeId(this.id, seed),
        `Notebooks cost $${fmt(price)} each. What is the cost of ${qty} notebooks?`,
        `$${fmt(total)}`, distractors,
        `$${fmt(price)} × ${qty} = $${fmt(total)}.`);
    }
    const tendered = Math.ceil(total / 10) * 10;
    const change = Math.round((tendered - total) * 100) / 100;
    return {
      id: forgeId(this.id, seed),
      question: `A purchase totals $${fmt(total)}. The customer pays with $${tendered}. How much change should they receive? Answer in dollars (for example, 2.75).`,
      type: 'fill_in', answer: `${fmt(change)}`, answerAliases: [`${fmt(change)}`, `$${fmt(change)}`],
      explanation: `$${tendered} − $${fmt(total)} = $${fmt(change)} in change.`,
      difficulty: ctx.difficulty, gedCode: ctx.gedCode, skillNodeId: ctx.skillNodeId,
    };
  },
};

const fractionOps: ItemTemplate = {
  id: 'fraction-ops', subject: 'Mathematical Reasoning',
  generate(rng, ctx) {
    const seed = currentSeed(rng);
    const d1 = pick(rng, [2, 3, 4, 5, 6, 8]);
    const d2 = pick(rng, [2, 3, 4, 5, 6, 8].filter(d => d !== d1));
    const coprimeN = (d: number) => pick(rng, Array.from({ length: d - 1 }, (_, i) => i + 1).filter(n => gcd(n, d) === 1));
    const n1 = coprimeN(d1), n2 = coprimeN(d2);
    if (rng() < 0.5) {
      const num = n1 * d2 + n2 * d1, den = d1 * d2;
      const answer = fracStr(num, den);
      // Candidate error values; dedupe against the answer and each other,
      // with deterministic fallbacks so the pool always yields 3.
      const pool = [
        fracStr(n1 + n2, d1 + d2),                        // add tops and bottoms
        fracStr(Math.abs(n1 * d2 - n2 * d1), den),        // subtracted instead
        fracStr(num, den * 2),                            // doubled the denominator
        fracStr(num + den, den),                          // answer + 1
        fracStr(num + 1, den),                            // off-by-one numerator
      ];
      const distractors = [...new Set(pool.filter(w => w !== answer))].slice(0, 3);
      return mcqFrom(rng, ctx, forgeId(this.id, seed),
        `What is ${n1}/${d1} + ${n2}/${d2}?`,
        answer, distractors,
        `Common denominator ${den}: ${n1}/${d1} + ${n2}/${d2} = ${num}/${den} = ${answer}.`);
    }
    const num = n1 * n2, den = d1 * d2;
    const answer = fracStr(num, den);
    return {
      id: forgeId(this.id, seed),
      question: `What is ${n1}/${d1} × ${n2}/${d2}? Give your answer as a simplified fraction (for example, 3/4).`,
      type: 'fill_in', answer, answerAliases: [answer],
      explanation: `Multiply across: (${n1} × ${n2}) / (${d1} × ${d2}) = ${num}/${den} = ${answer}.`,
      difficulty: ctx.difficulty, gedCode: ctx.gedCode, skillNodeId: ctx.skillNodeId,
      calculatorAllowed: false,
    };
  },
};

const percentOf: ItemTemplate = {
  id: 'percent-of', subject: 'Mathematical Reasoning',
  generate(rng, ctx) {
    const seed = currentSeed(rng);
    const base = pick(rng, [40, 60, 80, 120, 150, 200, 240, 300, 400, 500]);
    const pct = pick(rng, [10, 15, 20, 25, 30, 40, 60, 75, 90]);
    const value = base * pct / 100;
    const fmt = (n: number) => Number.isInteger(n) ? `${n}` : n.toFixed(2);
    if (rng() < 0.5) {
      const pool = [value + base / 10, base * (pct + 10) / 100, base * Math.max(pct - 10, 5) / 100, value / 2, value + 25];
      const distractors = [...new Set(pool.map(fmt).filter(w => w !== fmt(value)))].slice(0, 3);
      return mcqFrom(rng, ctx, forgeId(this.id, seed),
        `What is ${pct}% of ${base}?`,
        fmt(value), distractors,
        `${pct}% of ${base} = ${pct / 100} × ${base} = ${fmt(value)}.`);
    }
    const sale = base - value;
    const pool = [value, sale + 10, base - pct, sale - 10, value + 10];
    const saleDistractors = [...new Set(pool.map(fmt).filter(w => w !== fmt(sale)))].slice(0, 3)
      .map(w => `$${w}`);
    return mcqFrom(rng, ctx, forgeId(this.id, seed),
      `A jacket originally costs $${base}. It is discounted by ${pct}%. What is the sale price?`,
      `$${fmt(sale)}`, saleDistractors,
      `Discount = ${pct}% of $${base} = $${fmt(value)}. Sale price = $${base} − $${fmt(value)} = $${fmt(sale)}.`);
  },
};

const meanMedian: ItemTemplate = {
  id: 'mean-median', subject: 'Mathematical Reasoning',
  generate(rng, ctx) {
    const seed = currentSeed(rng);
    const vals = Array.from({ length: 5 }, () => int(rng, 2, 30)).sort((x, y) => x - y);
    const median = vals[2];
    if (rng() < 0.5) {
      return {
        id: forgeId(this.id, seed),
        question: `Find the median of the data set: ${vals.join(', ')}.`,
        type: 'fill_in', answer: `${median}`, answerAliases: [`${median}`],
        explanation: `Ordered, the values are ${vals.join(', ')}; the middle (3rd) value is ${median}.`,
        difficulty: ctx.difficulty, gedCode: ctx.gedCode, skillNodeId: ctx.skillNodeId,
      };
    }
    // Construct a set with an exact whole-number mean.
    const mean = int(rng, 5, 20);
    const devs = [int(rng, -4, 0), int(rng, 0, 4), int(rng, -3, 3), int(rng, -2, 2)];
    const last = -devs.reduce((s, d) => s + d, 0);
    const set = [...devs, last].map(d => mean + d);
    if (set.some(v => v <= 0)) return meanMedian.generate(rng, ctx);
    return {
      id: forgeId(this.id, seed),
      question: `Find the mean of the data set: ${set.join(', ')}.`,
      type: 'fill_in', answer: `${mean}`, answerAliases: [`${mean}`],
      explanation: `Sum = ${set.reduce((s, v) => s + v, 0)}; mean = ${set.reduce((s, v) => s + v, 0)} ÷ 5 = ${mean}.`,
      difficulty: ctx.difficulty, gedCode: ctx.gedCode, skillNodeId: ctx.skillNodeId,
    };
  },
};

const probability: ItemTemplate = {
  id: 'probability', subject: 'Mathematical Reasoning',
  generate(rng, ctx) {
    const seed = currentSeed(rng);
    const red = int(rng, 2, 6), blue = int(rng, 2, 6), green = int(rng, 1, 5);
    const total = red + blue + green;
    const answer = fracStr(red, total);
    const pool = [
      fracStr(blue, total), fracStr(green, total),
      fracStr(red, blue + green),                 // forgot the red in the total
      fracStr(total - red, total),                // complement (collides when P = 1/2)
      fracStr(red + blue, total), fracStr(red + 1, total),
    ];
    const distractors = [...new Set(pool.filter(w => w !== answer))].slice(0, 3);
    return mcqFrom(rng, ctx, forgeId(this.id, seed),
      `A bag contains ${red} red, ${blue} blue, and ${green} green marbles. One marble is drawn at random. What is the probability it is red?`,
      answer, distractors,
      `P(red) = red ÷ total = ${red}/${total} = ${answer}.`);
  },
};

const orderValues: ItemTemplate = {
  id: 'order-values', subject: 'Mathematical Reasoning',
  generate(rng, ctx) {
    const seed = currentSeed(rng);
    // Four values with distinct decimal equivalents, in mixed forms.
    const base = pick(rng, [[0.25, '1/4'], [0.4, '2/5'], [0.5, '1/2'], [0.75, '3/4'], [0.2, '1/5'], [0.6, '3/5']] as Array<[number, string]>);
    const others = shuffle(rng, [0.1, 0.3, 0.35, 0.45, 0.55, 0.65, 0.7, 0.8, 0.9].filter(v => Math.abs(v - base[0]) > 0.03)).slice(0, 3);
    const entries: Array<{ label: string; value: number }> = [
      { label: base[1], value: base[0] },
      ...others.map(v => ({ label: `${v}`, value: v })),
    ];
    const sorted = [...entries].sort((a, b) => a.value - b.value);
    const presented = shuffle(rng, entries);
    if (presented.every((e, i) => e.label === sorted[i].label)) presented.reverse();
    return {
      id: forgeId(this.id, seed),
      question: 'Arrange the values from least to greatest.',
      type: 'drag_drop',
      dragItems: presented.map(e => e.label),
      answer: sorted.map(e => e.label).join(' | '),
      explanation: `As decimals: ${sorted.map(e => `${e.label} = ${e.value}`).join(', ')}. Ordered least to greatest: ${sorted.map(e => e.label).join(', ')}.`,
      difficulty: ctx.difficulty, gedCode: ctx.gedCode, skillNodeId: ctx.skillNodeId,
      calculatorAllowed: false,
    };
  },
};

const forceMA: ItemTemplate = {
  id: 'force-ma', subject: 'Science',
  generate(rng, ctx) {
    const seed = currentSeed(rng);
    const m = pick(rng, [2, 3, 4, 5, 6, 8, 10, 12]);
    const a = pick(rng, [2, 3, 4, 5, 6, 9]);
    const F = m * a;
    return {
      id: forgeId(this.id, seed),
      question: `An object with a mass of ${m} kg accelerates at ${a} m/s². Using F = ma, what is the net force on the object, in newtons?`,
      type: 'fill_in', answer: `${F}`, answerAliases: [`${F}`, `${F} N`, `${F} newtons`],
      explanation: `F = ma = ${m} × ${a} = ${F} newtons.`,
      difficulty: ctx.difficulty, gedCode: ctx.gedCode, skillNodeId: ctx.skillNodeId,
      calculatorAllowed: false,
    };
  },
};

const waveSpeed: ItemTemplate = {
  id: 'wave-speed', subject: 'Science',
  generate(rng, ctx) {
    const seed = currentSeed(rng);
    const f = pick(rng, [10, 20, 25, 40, 50, 100, 200, 250]);
    const lambda = pick(rng, [0.5, 1, 1.5, 2, 3, 4, 6]);
    const v = f * lambda;
    return {
      id: forgeId(this.id, seed),
      question: `A wave has a frequency of ${f} Hz and a wavelength of ${lambda} m. Using v = fλ, what is the wave's speed in m/s?`,
      type: 'fill_in', answer: `${v}`, answerAliases: [`${v}`, `${v} m/s`],
      explanation: `v = fλ = ${f} × ${lambda} = ${v} m/s.`,
      difficulty: ctx.difficulty, gedCode: ctx.gedCode, skillNodeId: ctx.skillNodeId,
    };
  },
};

const punnett: ItemTemplate = {
  id: 'punnett', subject: 'Science',
  generate(rng, ctx) {
    const seed = currentSeed(rng);
    const crosses: Array<{ a: string; b: string }> = [
      { a: 'Tt', b: 'tt' }, { a: 'Tt', b: 'Tt' }, { a: 'TT', b: 'tt' }, { a: 'Tt', b: 'TT' },
    ];
    const { a, b } = pick(rng, crosses);
    const alleles = (g: string) => [g[0], g[1]];
    const offspring = alleles(a).flatMap(x => alleles(b).map(y => [x, y].sort().join('')));
    const ttCount = offspring.filter(g => g === 'tt').length;
    const pctVal = ttCount * 25;
    const options = ['0%', '25%', '50%', '75%', '100%'].filter(o => o !== `${pctVal}%`);
    return {
      id: forgeId(this.id, seed),
      question: `In a cross of ${a} × ${b} (T = tall, t = short), the probability that an offspring is homozygous recessive (tt) is ___.`,
      type: 'drop_down',
      options: shuffle(rng, [`${pctVal}%`, ...shuffle(rng, options).slice(0, 3)]),
      answer: `${pctVal}%`,
      explanation: `The Punnett square for ${a} × ${b} gives offspring ${offspring.join(', ')} — ${ttCount} of 4 are tt, a probability of ${pctVal}%.`,
      difficulty: ctx.difficulty, gedCode: ctx.gedCode, skillNodeId: ctx.skillNodeId,
    };
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Seed plumbing: templates read the seed back out of the rng stream so
// ids stay reproducible. generate() is wrapped by forgeItem, which
// draws the seed from a dedicated stream first.
// ─────────────────────────────────────────────────────────────────────────────

let _lastSeed = 0;
function currentSeed(_rng: Rng): number { return _lastSeed; }

const linearEq: ItemTemplate = {
  id: 'linear-eq', subject: 'Mathematical Reasoning',
  generate(rng, ctx) {
    const seed = currentSeed(rng);
    const a = int(rng, 2, 9), x = int(rng, -6, 12) || 3, b = int(rng, -9, 15);
    const c = a * x + b;
    const bStr = b >= 0 ? `+ ${b}` : `− ${-b}`;
    if (rng() < 0.5) {
      return {
        id: forgeId(this.id, seed),
        question: `Solve for x: ${a}x ${bStr} = ${c}.`,
        type: 'fill_in', answer: `${x}`, answerAliases: [`${x}`, `x = ${x}`],
        explanation: `${a}x ${bStr} = ${c} → ${a}x = ${c - b} → x = ${x}.`,
        difficulty: ctx.difficulty, gedCode: ctx.gedCode, skillNodeId: ctx.skillNodeId,
      };
    }
    return mcqFrom(rng, ctx, forgeId(this.id, seed),
      `Solve for x: ${a}x ${bStr} = ${c}.`,
      `${x}`, [`${x + 1}`, `${x - 1}`, `${-x}`].map(String),
      `${a}x ${bStr} = ${c} → ${a}x = ${c - b} → x = ${x}.`);
  },
};

const evalExpr: ItemTemplate = {
  id: 'eval-expr', subject: 'Mathematical Reasoning',
  generate(rng, ctx) {
    const seed = currentSeed(rng);
    const x = int(rng, 2, 6), a = int(rng, 2, 5), b = int(rng, 1, 9);
    const value = a * x * x + b; // ax² + b
    return {
      id: forgeId(this.id, seed),
      question: `Evaluate the expression ${a}x² + ${b} when x = ${x}.`,
      type: 'fill_in', answer: `${value}`, answerAliases: [`${value}`],
      explanation: `${a}(${x})² + ${b} = ${a} × ${x * x} + ${b} = ${a * x * x} + ${b} = ${value}.`,
      difficulty: ctx.difficulty, gedCode: ctx.gedCode, skillNodeId: ctx.skillNodeId,
      calculatorAllowed: false,
    };
  },
};

const slope: ItemTemplate = {
  id: 'slope', subject: 'Mathematical Reasoning',
  generate(rng, ctx) {
    const seed = currentSeed(rng);
    const x1 = int(rng, -3, 3), y1 = int(rng, -3, 5);
    const dx = int(rng, 1, 4), m = pick(rng, [-2, -1, 1, 2, 3]);
    const x2 = x1 + dx, y2 = y1 + m * dx;
    if (rng() < 0.5) {
      const pool = [`${-m}`, `${m + 1}`, `${m + 2}`, `${m - 1}`, Math.abs(m) === 1 ? `${m - 2}` : fracStr(dx, m * dx)];
      const distractors = [...new Set(pool.filter(w => w !== `${m}`))].slice(0, 3);
      return mcqFrom(rng, ctx, forgeId(this.id, seed),
        `What is the slope of the line through (${x1}, ${y1}) and (${x2}, ${y2})?`,
        `${m}`, distractors,
        `slope = (${y2} − ${y1}) / (${x2} − ${x1}) = ${m * dx} / ${dx} = ${m}.`);
    }
    return {
      id: forgeId(this.id, seed),
      question: `A line passes through (${x1}, ${y1}) and (${x2}, ${y2}). What is its slope?`,
      type: 'fill_in', answer: `${m}`, answerAliases: [`${m}`],
      explanation: `slope = rise / run = (${y2} − ${y1}) / (${x2} − ${x1}) = ${m}.`,
      difficulty: ctx.difficulty, gedCode: ctx.gedCode, skillNodeId: ctx.skillNodeId,
    };
  },
};

export const NUMERIC_TEMPLATES: ItemTemplate[] = [
  arithOps, decimalOps, fractionOps, percentOf, meanMedian, probability,
  orderValues, forceMA, waveSpeed, punnett, linearEq, evalExpr, slope,
];

export function templateById(id: string): ItemTemplate {
  const t = TEMPLATES.find(t => t.id === id);
  if (!t) throw new Error(`Unknown ItemForge template: ${id}`);
  return t;
}

/**
 * Forge one item deterministically from (templateId, seed, context).
 * The same triple always yields the identical item.
 */
export function forgeItem(templateId: string, seed: number, ctx: ForgeContext): GEDPracticeQuestion {
  _lastSeed = seed >>> 0;
  const rng = mulberry32(_lastSeed);
  const item = templateById(templateId).generate(rng, ctx);
  return {
    ...item,
    provenance: { source: 'itemforge', seed: _lastSeed, template: templateId },
  };
}

/** Forge a run of items from one template with consecutive seeds. */
export function forgeRun(templateId: string, seedBase: number, count: number, ctx: ForgeContext): GEDPracticeQuestion[] {
  return Array.from({ length: count }, (_, i) => forgeItem(templateId, seedBase + i, ctx));
}

// ─────────────────────────────────────────────────────────────────────────────
// BANK-DRIVEN TEMPLATES — answers keyed in authored banks; generation
// selects, shuffles, and assembles. Banks are small and fully reviewed;
// the forge never invents keys.
// ─────────────────────────────────────────────────────────────────────────────

interface BankQuestion {
  question: string;
  correct: string;
  distractors: string[];
  explanation: string;
}
interface StimulusEntry {
  stimulus: Array<{ label: string; text: string }>;
  questions: BankQuestion[];
}

function makeStimulusTemplate(id: string, subject: string, bank: StimulusEntry[]): ItemTemplate {
  return {
    id, subject,
    generate(rng, ctx) {
      const seed = currentSeed(rng);
      const entry = pick(rng, bank);
      const bq = pick(rng, entry.questions);
      const item = mcqFrom(rng, ctx, forgeId(id, seed), bq.question, bq.correct, bq.distractors, bq.explanation);
      return { ...item, stimulus: entry.stimulus };
    },
  };
}

const FICTION_BANK: StimulusEntry[] = [
  {
    stimulus: [{ label: 'Passage', text: 'The lighthouse keeper climbed the tower steps for the last time, her hand trailing along the iron rail she had polished for thirty years. Below, the new automated beacon blinked on by itself, indifferent and exact. She set her brass key on the windowsill where the morning crew would find it, though there was no crew anymore — only a technician who visited twice a year. "You kept us safe," she told the lamp, and was surprised to find she was crying, not for the job, but for the silence that would now live in the tower with no one to hear the fog roll in.' }],
    questions: [
      {
        question: 'The keeper leaves the brass key on the windowsill mainly because she —',
        correct: 'wants to mark the end of her role with a deliberate, final gesture',
        distractors: ['has forgotten where the key belongs', 'hopes the technician will pay her for it', 'is afraid the new beacon will stop working'],
        explanation: 'There is no crew to receive the key; leaving it is a ritual of farewell — a deliberate closing gesture, not forgetfulness or a transaction.',
      },
      {
        question: 'Which inference about the keeper is best supported by the passage?',
        correct: 'Her identity was bound up with the human presence the automation replaced',
        distractors: ['She opposed all new technology on principle', 'She expects to return to the job someday', 'She never learned how the lamp worked'],
        explanation: 'She mourns "the silence that would now live in the tower with no one to hear" — the loss is about human presence, her own included, not about the machine failing.',
      },
    ],
  },
  {
    stimulus: [{ label: 'Passage', text: 'Deshawn counted the register twice, then a third time, though the drawer had balanced perfectly on the first count. Across the street, the hiring manager at the new grocery store was locking up. Tomorrow Deshawn would wear the thrift-store blazer his grandmother had pressed for him and ask for a job with regular hours — hours that would let him coach his little brother\'s baseball team. He slid the last receipt into the envelope, wrote the date in his careful hand, and allowed himself, finally, to imagine Saturday mornings that did not begin with an alarm.' }],
    questions: [
      {
        question: 'Why does Deshawn count the register a third time even though it balanced?',
        correct: 'He is stalling while he gathers the nerve to change his life',
        distractors: ['He believes the manager is watching him', 'He does not trust the register\'s arithmetic', 'He is required to count three times by store policy'],
        explanation: 'The balanced drawer "on the first count" rules out arithmetic doubt; the repetition is nervous energy while he contemplates tomorrow\'s job application.',
      },
      {
        question: 'The passage is mainly about a character who —',
        correct: 'stands at the edge of a hopeful change he has not yet made',
        distractors: ['has already achieved everything he wanted', 'regrets a decision he made years ago', 'is hiding a mistake from his employer'],
        explanation: 'Everything points forward — tomorrow\'s interview, the imagined Saturday mornings. Nothing has changed yet; the passage lives in the moment before.',
      },
    ],
  },
  {
    stimulus: [{ label: 'Passage', text: 'The violin arrived in a cardboard box with no return address, its neck wrapped in a blue scarf Aunt Rosa had knitted the winter before she moved away. Marta lifted it out the way you lift a sleeping cat. She had not played since she was fourteen, since the afternoon her father said music was a fine hobby for people who could afford hobbies. Now the rent was paid, her daughter was grown, and the scarf smelled faintly of cedar. She tucked the violin under her chin. The first note came out thin and uncertain, then steadier — a door opening in a house she had once lived in.' }],
    questions: [
      {
        question: 'The violin most likely symbolizes —',
        correct: 'a part of herself Marta set aside under pressure, now returning',
        distractors: ['a debt her aunt wants repaid', 'her daughter\'s forgotten childhood toy', 'a career she is about to begin professionally'],
        explanation: 'She stopped playing after her father dismissed music; the instrument\'s return, once "the rent was paid," reopens a room of her own past — return, not a new profession.',
      },
      {
        question: 'The phrase "a door opening in a house she had once lived in" suggests that playing again feels —',
        correct: 'familiar and welcoming, like coming back to a former home',
        distractors: ['frightening, like entering a stranger\'s house', 'pointless, since the house is empty', 'embarrassing, like being caught somewhere forbidden'],
        explanation: 'The simile makes the return intimate and known — she once lived there. The note grows "steadier," not more frightening.',
      },
    ],
  },
];

const SOURCE_BANK: StimulusEntry[] = [
  {
    stimulus: [{ label: 'Source — factory inspector\'s report, 1911 (adapted)', text: '"In the cutting room I counted forty girls, the oldest perhaps seventeen, at work since six in the morning. The doors to the stairwell were kept locked during working hours, the foreman explained, to prevent the loss of cloth. When I asked what would happen in case of fire, he laughed and said the girls could use the windows."' }],
    questions: [
      {
        question: 'A historian would most value this source as evidence about —',
        correct: 'the dangerous working conditions reformers sought to expose',
        distractors: ['the exact wages paid to factory girls in 1911', 'how cloth was manufactured in the period', 'the foreman\'s personal biography'],
        explanation: 'The report documents locked doors and child labor — conditions, not wages, manufacturing technique, or biography.',
      },
      {
        question: 'Which feature most affects how a historian should weigh this source?',
        correct: 'It was written by an inspector whose job was to document violations',
        distractors: ['It uses the first person', 'It describes events from 1911', 'It quotes the foreman directly'],
        explanation: 'Sourcing: an inspector documents problems for a reason. That purpose shapes what he records — it does not erase the evidence, but it frames it.',
      },
    ],
  },
  {
    stimulus: [{ label: 'Source — chart: Population of Milltown', text: 'Year 1880: 2,100 · Year 1900: 4,600 · Year 1920: 9,300 · Year 1940: 9,800 · Year 1960: 14,200' }],
    questions: [
      {
        question: 'Between which two recorded years did Milltown\'s population grow the fastest in percentage terms?',
        correct: '1880 to 1900',
        distractors: ['1900 to 1920', '1920 to 1940', '1940 to 1960'],
        explanation: '1880→1900: 2,100 → 4,600 is more than doubling (+119%). 1900→1920 roughly doubles (+102%); the later intervals grow far less in percentage terms.',
      },
      {
        question: 'The chart best supports which conclusion about Milltown?',
        correct: 'Its population more than quadrupled between 1880 and 1940',
        distractors: ['Its population declined between 1920 and 1940', 'It was largest in 1900', 'It grew by the same amount every twenty years'],
        explanation: '2,100 (1880) → 9,800 (1940) is more than four times larger. No interval shows a decline, and the increases are uneven.',
      },
    ],
  },
];

const fictionReading = makeStimulusTemplate('fiction-reading', 'Language Arts', FICTION_BANK);
const sourceAnalysis = makeStimulusTemplate('source-analysis', 'Social Studies', SOURCE_BANK);

// ── Subject–verb agreement (drop-down): the key follows the grammar rule ──
interface SvFrame { frame: string; correct: string; wrong: string[]; note: string }
const SV_FRAMES: SvFrame[] = [
  { frame: 'The list of approved vendors ___ attached to the memo.', correct: 'was', wrong: ['were', 'are', 'have been'], note: 'The subject is "list" (singular); the phrase "of approved vendors" does not change it.' },
  { frame: 'Neither the manager nor the employees ___ aware of the schedule change.', correct: 'were', wrong: ['was', 'is', 'has been'], note: 'With "neither…nor," the verb agrees with the nearer subject — "employees" (plural).' },
  { frame: 'Each of the reports ___ a summary of the findings.', correct: 'contains', wrong: ['contain', 'containing', 'have contained'], note: '"Each" is singular, so the verb is "contains."' },
  { frame: 'The committee, after months of debate, ___ its recommendation tomorrow.', correct: 'announces', wrong: ['announce', 'announcing', 'have announced'], note: '"Committee" acts as one body (note "its"), taking the singular "announces."' },
  { frame: 'There ___ three reasons for the delay listed in the report.', correct: 'are', wrong: ['is', 'was', 'has been'], note: 'In "there" constructions the verb agrees with the real subject — "three reasons" (plural).' },
  { frame: 'The data from the sensors ___ a steady increase in temperature.', correct: 'show', wrong: ['shows', 'showing', 'has shown'], note: '"Data" is treated as plural in formal usage ("the data show").' },
];
const svAgreement: ItemTemplate = {
  id: 'sv-agreement', subject: 'Language Arts',
  generate(rng, ctx) {
    const seed = currentSeed(rng);
    const f = pick(rng, SV_FRAMES);
    return {
      id: forgeId(this.id, seed),
      question: f.frame, type: 'drop_down',
      options: shuffle(rng, [f.correct, ...f.wrong]),
      answer: f.correct, explanation: f.note,
      difficulty: ctx.difficulty, gedCode: ctx.gedCode, skillNodeId: ctx.skillNodeId,
    };
  },
};

// ── Chronology (drag & drop): the key is the calendar itself ──
interface DatedEvent { label: string; year: number }
const EVENT_BANK: DatedEvent[] = [
  { label: 'Declaration of Independence (1776)', year: 1776 },
  { label: 'U.S. Constitution ratified (1788)', year: 1788 },
  { label: 'Louisiana Purchase (1803)', year: 1803 },
  { label: 'Civil War ends (1865)', year: 1865 },
  { label: 'Transcontinental railroad completed (1869)', year: 1869 },
  { label: 'Sherman Antitrust Act (1890)', year: 1890 },
  { label: '19th Amendment: women\'s suffrage (1920)', year: 1920 },
  { label: 'Great Depression begins (1929)', year: 1929 },
  { label: 'World War II ends (1945)', year: 1945 },
  { label: 'Brown v. Board of Education (1954)', year: 1954 },
  { label: 'Civil Rights Act (1964)', year: 1964 },
  { label: 'Apollo 11 Moon landing (1969)', year: 1969 },
  { label: 'Berlin Wall falls (1989)', year: 1989 },
  { label: 'World Wide Web opens to the public (1991)', year: 1991 },
];
const chronoOrder: ItemTemplate = {
  id: 'chrono-order', subject: 'Social Studies',
  generate(rng, ctx) {
    const seed = currentSeed(rng);
    const chosen = shuffle(rng, EVENT_BANK).slice(0, 4);
    const sorted = [...chosen].sort((a, b) => a.year - b.year);
    if (chosen.every((e, i) => e.label === sorted[i].label)) chosen.reverse();
    return {
      id: forgeId(this.id, seed),
      question: 'Place the events in chronological order, from earliest to latest.',
      type: 'drag_drop',
      dragItems: chosen.map(e => e.label),
      answer: sorted.map(e => e.label).join(' | '),
      explanation: `Chronological order: ${sorted.map(e => e.label).join(' → ')}.`,
      difficulty: ctx.difficulty, gedCode: ctx.gedCode, skillNodeId: ctx.skillNodeId,
    };
  },
};

// ── Transitions (drop-down): the correct connector matches the relation ──
interface TransitionFrame { frame: string; relation: string; correct: string; others: string[]; note: string }
const TRANSITION_FRAMES: TransitionFrame[] = [
  { frame: 'The first treatment reduced symptoms for most patients. ___, it caused severe drowsiness in a small group.', relation: 'contrast', correct: 'However', others: ['Furthermore', 'As a result', 'For example'], note: 'The second sentence qualifies the first — a contrast, so "However" fits.' },
  { frame: 'Regular exercise improves heart health. ___, it is linked to better sleep and mood.', relation: 'addition', correct: 'Furthermore', others: ['However', 'As a result', 'In conclusion'], note: 'The second sentence adds another benefit — addition, so "Furthermore" fits.' },
  { frame: 'The bridge had not been inspected in a decade. ___, engineers recommended closing it immediately.', relation: 'result', correct: 'As a result', others: ['For example', 'Meanwhile', 'In contrast'], note: 'The recommendation follows from the finding — a result, so "As a result" fits.' },
  { frame: 'Many species are shifting their ranges as the climate warms. ___, some birds now nest weeks earlier than they did in 1970.', relation: 'example', correct: 'For example', others: ['Nevertheless', 'Consequently', 'Similarly'], note: 'The nesting birds illustrate the general claim — an example, so "For example" fits.' },
  { frame: 'The proposal lowers costs, speeds up service, and reduces errors. ___, the board should adopt it this quarter.', relation: 'conclusion', correct: 'In conclusion', others: ['On the other hand', 'For instance', 'In addition'], note: 'The final sentence sums up and recommends — a conclusion, so "In conclusion" fits.' },
];
const transitionChoice: ItemTemplate = {
  id: 'transition-choice', subject: 'Language Arts',
  generate(rng, ctx) {
    const seed = currentSeed(rng);
    const f = pick(rng, TRANSITION_FRAMES);
    return {
      id: forgeId(this.id, seed),
      question: f.frame, type: 'drop_down',
      options: shuffle(rng, [f.correct, ...f.others]),
      answer: f.correct, explanation: f.note,
      difficulty: ctx.difficulty, gedCode: ctx.gedCode, skillNodeId: ctx.skillNodeId,
    };
  },
};

// ── Vocabulary cloze (fill-in): keyed word bank, typed response ──
interface ClozeFrame { frame: string; word: string; hint: string; note: string }
const CLOZE_FRAMES: ClozeFrame[] = [
  { frame: 'The new evidence ___ the scientist\'s original claim, confirming she had been right all along.', word: 'supported', hint: 'a verb meaning "backed up"', note: '"Supported" fits: the evidence backed up the claim.' },
  { frame: 'Because the instructions were ___, half the class assembled the model incorrectly.', word: 'unclear', hint: 'an adjective meaning "not easy to understand"', note: '"Unclear" explains the mistakes: the instructions could not be understood.' },
  { frame: 'The hikers ___ the steep trail slowly, stopping often to rest.', word: 'climbed', hint: 'a past-tense verb for going up', note: '"Climbed" fits the action and the past tense of the sentence.' },
  { frame: 'Her argument was ___, built on three studies and a decade of data.', word: 'convincing', hint: 'an adjective meaning "able to persuade"', note: '"Convincing" matches the strong evidence described.' },
];
const vocabCloze: ItemTemplate = {
  id: 'vocab-cloze', subject: 'Language Arts',
  generate(rng, ctx) {
    const seed = currentSeed(rng);
    const f = pick(rng, CLOZE_FRAMES);
    return {
      id: forgeId(this.id, seed),
      question: `${f.frame} (Fill in the blank with ${f.hint}.)`,
      type: 'fill_in', answer: f.word, answerAliases: [f.word],
      explanation: f.note,
      difficulty: ctx.difficulty, gedCode: ctx.gedCode, skillNodeId: ctx.skillNodeId,
    };
  },
};

// ── Essay structure order (drag & drop, ER support): canonical structure ──
const essayOrder: ItemTemplate = {
  id: 'essay-order', subject: 'Language Arts',
  generate(rng, ctx) {
    const seed = currentSeed(rng);
    const steps = [
      'Read both texts and identify each author\'s position',
      'Decide which argument is better supported and draft a thesis',
      'Gather evidence from both texts for each body paragraph',
      'Draft the essay: introduction, body paragraphs, counterargument, conclusion',
      'Revise for organization and edit for grammar and conventions',
    ];
    const presented = shuffle(rng, steps);
    if (presented.every((s, i) => s === steps[i])) presented.reverse();
    return {
      id: forgeId(this.id, seed),
      question: 'Put the steps for writing the Extended Response in the most effective order.',
      type: 'drag_drop',
      dragItems: presented,
      answer: steps.join(' | '),
      explanation: 'Analyze first (positions), then plan (thesis), then gather evidence, then draft, then revise and edit — revision is a separate, final pass.',
      difficulty: ctx.difficulty, gedCode: ctx.gedCode, skillNodeId: ctx.skillNodeId,
    };
  },
};

export const BANK_TEMPLATES: ItemTemplate[] = [
  fictionReading, sourceAnalysis, svAgreement, chronoOrder,
  transitionChoice, vocabCloze, essayOrder,
];

export const TEMPLATES: ItemTemplate[] = [...NUMERIC_TEMPLATES, ...BANK_TEMPLATES];
