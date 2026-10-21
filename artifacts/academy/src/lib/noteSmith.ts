/**
 * Notesmith — Phase 5. Per-student reference notes, generated from
 * the student's own history.
 *
 * For every skill a student is struggling with or still developing
 * (CourseWeaver's standings over the real progress record), Notesmith
 * writes a reference note: the skill's target tags, key terms, the
 * anchor lesson's study points, one worked example picked by a
 * per-student seed, and the textbook chapters that assess the same
 * skill — the chapters TextSiphon serves, tagged identically, so a
 * note and a chapter on the same target agree by construction.
 *
 * Notes are generated, never stored as canon: regenerate them from
 * current progress and they are current — improve a skill past
 * mastery and its note retires itself; slip, and it comes back.
 */
import type { GEDPracticeQuestion, StudentCurriculumProgress } from '@shared/schema';
import { KAPLAN_GED_CURRICULUM, GED_CODE_TO_SKILL } from './gedCurriculum';
import { GED_TEXTBOOKS } from './gedContent';
import { analyzeProgress, type SkillStanding } from './courseWeaver';
import { chaptersForSkill } from './textSiphon';
import { displayAnswer } from './itemGrading';
import { mulberry32, seedFromString } from './itemForge';
import { skillGraph } from './academy-engine/phase1/skillGraph';

export interface ReferenceNote {
  id: string;
  studentId: string;
  skillNodeId: string;
  skillName: string;
  subject: string;
  status: SkillStanding['status'];
  standingLine: string;
  /** Lesson codes + textbook target codes that tag this skill. */
  targetCodes: string[];
  keyTerms: string[];
  studyPoints: string[];
  workedExample: { question: string; answer: string; explanation: string } | null;
  textbookChapters: ReturnType<typeof chaptersForSkill>;
  generatedAt: string;
}

const MAX_NOTES = 8;
const MAX_KEY_TERMS = 8;
const MAX_STUDY_POINTS = 6;

function lessonsForSkill(skillNodeId: string) {
  const out: Array<{ gedCode: string; keyTerms: string[]; content: string; items: GEDPracticeQuestion[] }> = [];
  for (const book of KAPLAN_GED_CURRICULUM) {
    for (const ch of book.chapters) {
      for (const lesson of ch.lessons ?? []) {
        if (GED_CODE_TO_SKILL[lesson.gedCode] === skillNodeId) {
          out.push({
            gedCode: lesson.gedCode, keyTerms: lesson.keyTerms, content: lesson.content,
            items: lesson.practiceQuestions.filter(q => q.skillNodeId === skillNodeId),
          });
        }
      }
    }
  }
  return out;
}

function textbookCodesForSkill(skillNodeId: string): string[] {
  const codes = new Set<string>();
  for (const book of GED_TEXTBOOKS) {
    for (const ch of book.chapters) {
      for (const q of ch.practiceQuestions ?? []) {
        if (q.skillNodeId === skillNodeId && q.gedCode) codes.add(q.gedCode);
      }
    }
  }
  return [...codes].sort();
}

/** Condense lesson content into study points: the headed lines and bullets. */
function studyPointsFrom(content: string): string[] {
  const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
  const points: string[] = [];
  for (const line of lines) {
    if (/^[A-Z][A-Z /&:'-]{3,}$/.test(line)) continue;      // skip ALL-CAPS headers
    if (line.startsWith('•') || /^[A-Z][a-z]+:/.test(line) || line.includes('—') || line.includes('→')) {
      points.push(line.replace(/^•\s*/, ''));
    }
    if (points.length >= MAX_STUDY_POINTS) break;
  }
  if (points.length === 0) return lines.slice(0, 3);
  return points;
}

export function generateReferenceNotes(
  studentId: string, progress: StudentCurriculumProgress, now: Date,
): ReferenceNote[] {
  const standings = analyzeProgress(progress)
    .filter(s => s.status === 'struggling' || s.status === 'developing')
    .sort((a, b) => a.mastery - b.mastery || a.skillNodeId.localeCompare(b.skillNodeId))
    .slice(0, MAX_NOTES);

  return standings.map(standing => {
    const skill = standing.skillNodeId;
    const lessons = lessonsForSkill(skill);
    const anchor = lessons[0];
    const keyTerms = [...new Set(lessons.flatMap(l => l.keyTerms))].slice(0, MAX_KEY_TERMS);
    const studyPoints = anchor ? studyPointsFrom(anchor.content) : [];
    const examplePool = lessons.flatMap(l => l.items);
    let workedExample: ReferenceNote['workedExample'] = null;
    if (examplePool.length > 0) {
      const rng = mulberry32(seedFromString(`${studentId}|note|${skill}`));
      const q = examplePool[Math.floor(rng() * examplePool.length)];
      workedExample = { question: q.question, answer: displayAnswer(q), explanation: q.explanation };
    }
    const targetCodes = [...new Set([...standing.lessonCodes, ...textbookCodesForSkill(skill)])].sort();
    const standingLine = standing.bestScore === null
      ? `Attempts recorded, but no scored quiz yet — still building.`
      : `Best quiz score ${standing.bestScore}% across ${standing.attempts} attempt${standing.attempts === 1 ? '' : 's'} — ${standing.status === 'struggling' ? 'needs work' : 'still building'}.`;
    return {
      id: `NOTE.${skill}`,
      studentId,
      skillNodeId: skill,
      skillName: skillGraph.getNode(skill)?.name ?? skill,
      subject: standing.subject,
      status: standing.status,
      standingLine,
      targetCodes,
      keyTerms,
      studyPoints,
      workedExample,
      textbookChapters: chaptersForSkill(skill),
      generatedAt: now.toISOString(),
    };
  });
}
