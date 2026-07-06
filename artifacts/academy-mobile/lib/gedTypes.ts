/**
 * Local GED curriculum types.
 * Ported from the web app's `@shared/schema` so the offline curriculum data
 * (gedCurriculumData.ts, gedContent.ts) can compile inside the mobile app
 * without pulling in the server's Drizzle-backed schema module.
 */

export type GEDSubjectKey =
  | "Mathematical Reasoning"
  | "Language Arts"
  | "Science"
  | "Social Studies";

export type LangSubjectKey =
  | "Language: Spanish"
  | "Language: French"
  | "Language: German"
  | "Language: Chinese";

export type AnySubjectKey = GEDSubjectKey | LangSubjectKey;

export type QuestionDifficulty = "foundational" | "standard" | "extended";

export type QuestionType = "mcq" | "short_answer" | "extended_response";

export interface GEDPracticeQuestion {
  id: string;
  question: string;
  type: QuestionType;
  choices?: { A: string; B: string; C: string; D: string };
  answer: string;
  explanation: string;
  difficulty: QuestionDifficulty;
  gedCode?: string;
  skillNodeId?: string;
}

export interface GEDLesson {
  number: number;
  title: string;
  gedCode: string;
  content: string;
  keyTerms?: string[];
  practiceQuestions: GEDPracticeQuestion[];
}

export interface GEDChapter {
  number: number;
  title: string;
  topics: string[];
  content: string;
  lessons?: GEDLesson[];
  practiceQuestions?: Array<{ question: string; answer: string }>;
}

export interface GEDTextbook {
  id: string;
  subject: AnySubjectKey;
  title: string;
  description?: string;
  chapters: GEDChapter[];
}
