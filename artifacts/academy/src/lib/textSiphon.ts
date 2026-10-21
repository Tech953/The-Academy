/**
 * TextSiphon — Phase 5. The textbook access layer over the unified
 * content store (Phase 1's single spine: GED_TEXTBOOKS chapters with
 * their practice questions promoted to full target-tagged records).
 *
 * Canonical chapters are served as-is — same store the flashcards,
 * quizzes, and Auditor read. On top of the canon, TextSiphon offers
 * GENERATED EXPANSIONS: fresh ItemForge practice for the chapter's
 * own target skills, machine-graded through the Phase 2 engine.
 * Canonical questions keep their self-check semantics (reveal +
 * honest self-mark), but attempts of both kinds are recorded, so
 * textbook practice finally leaves a trace.
 *
 * Everything here is target-tagged: a chapter reports the GED target
 * codes and skill nodes its questions assess — the same tags
 * Notesmith prints on per-student reference notes, so a chapter and
 * a note about the same target agree by construction.
 */
import type { GEDPracticeQuestion } from '@shared/schema';
import type { GEDChapter } from '@shared/schema';
import { GED_TEXTBOOKS } from './gedContent';
import { gradeResponse } from './itemGrading';
import { forgeItem, seedFromString } from './itemForge';
import { SKILL_TEMPLATES } from './courseWeaver';

export interface TextbookSummary {
  id: string;
  subject: string;
  title: string;
  chapterCount: number;
  questionCount: number;
}

export function listTextbooks(): TextbookSummary[] {
  return GED_TEXTBOOKS.map(b => ({
    id: b.id, subject: b.subject, title: b.title,
    chapterCount: b.chapters.length,
    questionCount: b.chapters.reduce((n, c) => n + (c.practiceQuestions?.length ?? 0), 0),
  }));
}

export interface ChapterAccess {
  bookId: string;
  subject: string;
  bookTitle: string;
  chapter: GEDChapter;
  questions: GEDPracticeQuestion[];
  /** GED target codes this chapter assesses (from its questions). */
  targetCodes: string[];
  /** Skill-graph nodes this chapter assesses. */
  skillNodeIds: string[];
  /** The skill with the most questions in the chapter. */
  dominantSkill: string | null;
}

export function getChapter(bookId: string, chapterNumber: number): ChapterAccess | null {
  const book = GED_TEXTBOOKS.find(b => b.id === bookId);
  const chapter = book?.chapters.find(c => c.number === chapterNumber);
  if (!book || !chapter) return null;
  const questions = chapter.practiceQuestions ?? [];
  const targetCodes = [...new Set(questions.map(q => q.gedCode).filter((c): c is string => !!c))].sort();
  const skillNodeIds = [...new Set(questions.map(q => q.skillNodeId).filter((s): s is string => !!s))].sort();
  const counts = new Map<string, number>();
  for (const q of questions) {
    if (q.skillNodeId) counts.set(q.skillNodeId, (counts.get(q.skillNodeId) ?? 0) + 1);
  }
  const dominantSkill = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  return { bookId: book.id, subject: book.subject, bookTitle: book.title, chapter, questions, targetCodes, skillNodeIds, dominantSkill };
}

/** All chapters (across every book) that assess a given skill. */
export function chaptersForSkill(skillNodeId: string): Array<{ bookId: string; bookTitle: string; subject: string; chapterNumber: number; chapterTitle: string }> {
  const out: Array<{ bookId: string; bookTitle: string; subject: string; chapterNumber: number; chapterTitle: string }> = [];
  for (const book of GED_TEXTBOOKS) {
    for (const ch of book.chapters) {
      if ((ch.practiceQuestions ?? []).some(q => q.skillNodeId === skillNodeId)) {
        out.push({ bookId: book.id, bookTitle: book.title, subject: book.subject, chapterNumber: ch.number, chapterTitle: ch.title });
      }
    }
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// GENERATED EXPANSIONS — fresh, machine-gradable practice for the
// chapter's own skills. Seeded per student + chapter + attempt so a
// retake is a new set, and the same inputs reproduce the same set.
// ─────────────────────────────────────────────────────────────────────────────

const EXPANSION_TYPES = new Set(['mcq', 'fill_in', 'drop_down', 'short_answer']);

export function expandChapter(bookId: string, chapterNumber: number, seed: number, count = 4): GEDPracticeQuestion[] {
  const access = getChapter(bookId, chapterNumber);
  if (!access || access.skillNodeIds.length === 0) return [];
  const items: GEDPracticeQuestion[] = [];
  const used = new Set<string>();
  let tries = 0;
  let slot = 0;
  while (items.length < count && tries < count * 12) {
    tries++;
    const skill = access.skillNodeIds[slot % access.skillNodeIds.length];
    const templates = SKILL_TEMPLATES[skill] ?? [];
    if (templates.length === 0) { slot++; continue; }
    const template = templates[slot % templates.length];
    const gedCode = access.questions.find(q => q.skillNodeId === skill)?.gedCode ?? access.targetCodes[0] ?? '';
    const item = forgeItem(template, seed + tries * 7919, {
      gedCode, skillNodeId: skill, difficulty: 'standard',
    });
    slot++;
    if (!EXPANSION_TYPES.has(item.type) || used.has(item.id)) continue;
    used.add(item.id);
    items.push(item);
  }
  return items;
}

export function expansionSeed(studentId: string, bookId: string, chapterNumber: number, attemptNumber: number): number {
  return seedFromString(`${studentId}|${bookId}|${chapterNumber}|expansion|${attemptNumber}`);
}

export function gradeExpansion(
  items: GEDPracticeQuestion[], responses: Record<string, string>,
): { scorePercent: number; perItem: Array<{ itemId: string; correct: boolean }> } {
  const perItem = items.map(q => ({ itemId: q.id, correct: gradeResponse(q, responses[q.id] ?? '') }));
  const scorePercent = items.length
    ? Math.round(100 * perItem.filter(p => p.correct).length / items.length)
    : 0;
  return { scorePercent, perItem };
}

// ─────────────────────────────────────────────────────────────────────────────
// ATTEMPT RECORDS — textbook practice leaves a trace. Canonical
// self-checks are self-marked (got it / missed it); expansions are
// machine-graded. Both are recorded the same way.
// ─────────────────────────────────────────────────────────────────────────────

export interface TextbookAttempt {
  bookId: string;
  chapterNumber: number;
  kind: 'self-check' | 'expansion';
  scorePercent: number;
  at: string; // ISO
}

export function summarizeAttempts(
  attempts: TextbookAttempt[], bookId: string, chapterNumber: number,
): { selfCheck: TextbookAttempt | null; expansion: TextbookAttempt | null; totalAttempts: number } {
  const mine = attempts
    .filter(a => a.bookId === bookId && a.chapterNumber === chapterNumber)
    .sort((a, b) => a.at.localeCompare(b.at));
  return {
    selfCheck: [...mine].reverse().find(a => a.kind === 'self-check') ?? null,
    expansion: [...mine].reverse().find(a => a.kind === 'expansion') ?? null,
    totalAttempts: mine.length,
  };
}
