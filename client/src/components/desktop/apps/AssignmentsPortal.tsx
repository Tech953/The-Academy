import { useState, useMemo } from 'react';
import { ChevronRight, ChevronLeft, CheckCircle, Zap, Globe } from 'lucide-react';
import { useGameState } from '@/contexts/GameStateContext';
import {
  KAPLAN_GED_CURRICULUM,
  SUBJECT_META,
  computeSubjectProgress,
  computeChapterProgress,
  getLessonProgress,
  masteryColor,
  masteryLabel,
  getNextRecommendedLesson,
  PASSING_QUIZ_SCORE,
} from '@/lib/gedCurriculum';
import { generateAllLanguageTextbooks, LANG_META } from '@/lib/languageCourseGenerator';
import type { GEDTextbook, GEDLesson, GEDPracticeQuestion } from '@shared/schema';

const LANG_COURSES = generateAllLanguageTextbooks();
const LANG_BOOKS = Object.values(LANG_COURSES);

function getSubjectMeta(subject: string): { color: string; abbr: string; icon: string } {
  if (subject in SUBJECT_META) return SUBJECT_META[subject as keyof typeof SUBJECT_META];
  const entry = Object.values(LANG_META).find(m => `Language: ${m.name}` === subject);
  if (entry) return { color: entry.color, abbr: entry.code.toUpperCase(), icon: '🌐' };
  return { color: '#00ff00', abbr: '??', icon: '?' };
}

const G = '#00ff00';
const C = '#00ffff';
const A = '#ffaa00';
const R = '#ff4466';
const DIM = '#00ff0033';

type Screen = 'subjects' | 'chapters' | 'lessons' | 'lesson' | 'quiz' | 'quiz_result';

interface QuizState {
  questions: GEDPracticeQuestion[];
  currentIndex: number;
  answers: Record<number, string>;
  submitted: boolean;
  score: number;
}

function pct(n: number, d: number) {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function ProgressBar({ value, color = G, height = 4 }: { value: number; color?: string; height?: number }) {
  return (
    <div style={{ width: '100%', height, background: '#1a1a1a', borderRadius: 2, overflow: 'hidden' }}>
      <div style={{ width: `${value}%`, height: '100%', background: color, transition: 'width 0.4s ease' }} />
    </div>
  );
}

function SubjectCard({ book, progress, onClick, langMode }: {
  book: GEDTextbook;
  progress?: ReturnType<typeof computeSubjectProgress>;
  onClick: () => void;
  langMode?: boolean;
}) {
  const meta = getSubjectMeta(book.subject);
  const totalLessons = book.chapters.reduce((s, c) => s + (c.lessons?.length ?? 0), 0);
  const langEntry = langMode ? Object.values(LANG_META).find(m => `Language: ${m.name}` === book.subject) : null;
  const readiness = progress?.readinessScore ?? 0;
  const chaptersComplete = progress?.chaptersCompleted ?? 0;
  return (
    <button onClick={onClick} style={{
      background: '#0d0d0d', border: `1px solid ${meta.color}33`,
      padding: '16px', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
      color: G, width: '100%', transition: 'border-color 0.2s',
      display: 'flex', gap: 14, alignItems: 'flex-start',
    }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = meta.color + '88')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = meta.color + '33')}
    >
      <div style={{ fontSize: 26, color: meta.color, minWidth: 36, textAlign: 'center', lineHeight: 1 }}>
        {langMode ? (
          <Globe size={24} color={meta.color} />
        ) : (
          meta.icon
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 'bold', color: meta.color, letterSpacing: 1, marginBottom: 2 }}>
          {langEntry ? (
            <>{langEntry.nativeName} — {langEntry.name}</>
          ) : (
            <>[{meta.abbr}] {book.subject}</>
          )}
        </div>
        <div style={{ fontSize: 10, color: `${G}80`, marginBottom: 8 }}>
          {book.chapters.length} chapters · {totalLessons} lessons
          {langEntry && <span style={{ color: `${meta.color}90`, marginLeft: 8 }}>· {langEntry.speakers} speakers · {langEntry.writingSystem}</span>}
        </div>
        <ProgressBar value={readiness} color={meta.color} height={5} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
          <span style={{ fontSize: 9, color: `${G}60` }}>
            {chaptersComplete}/{book.chapters.length} chapters complete
          </span>
          <span style={{ fontSize: 9, color: readiness > 0 ? meta.color : `${G}40` }}>
            {readiness}% {readiness >= 70 ? '✓ PROFICIENT' : 'progress'}
          </span>
        </div>
      </div>
    </button>
  );
}

function ChapterRow({ chapter, subject, progress, onClick }: {
  chapter: GEDTextbook['chapters'][0];
  subject: string;
  progress: ReturnType<typeof computeChapterProgress>;
  onClick: () => void;
}) {
  const meta = getSubjectMeta(subject);
  const hasLessons = (chapter.lessons?.length ?? 0) > 0;
  return (
    <button onClick={onClick} disabled={!hasLessons} style={{
      background: '#0d0d0d', border: `1px solid ${G}22`,
      padding: '12px 14px', textAlign: 'left', cursor: hasLessons ? 'pointer' : 'default',
      fontFamily: 'inherit', color: hasLessons ? G : `${G}40`, width: '100%',
      display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4,
      opacity: hasLessons ? 1 : 0.5,
    }}>
      <div style={{ fontSize: 11, color: meta.color, minWidth: 28 }}>Ch{chapter.number}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 'bold', marginBottom: 2 }}>{chapter.title}</div>
        {hasLessons ? (
          <>
            <ProgressBar value={pct(progress.lessonsCompleted, progress.totalLessons)} color={meta.color} />
            <div style={{ fontSize: 9, color: `${G}60`, marginTop: 2 }}>
              {progress.lessonsCompleted}/{progress.totalLessons} lessons
              {progress.bestQuizAverage > 0 && ` · avg ${progress.bestQuizAverage}%`}
            </div>
          </>
        ) : (
          <div style={{ fontSize: 9, color: `${G}30` }}>Coming soon</div>
        )}
      </div>
      {progress.mastered && <CheckCircle size={14} color={G} />}
      {hasLessons && <ChevronRight size={14} color={`${G}60`} />}
    </button>
  );
}

function LessonRow({ lesson, lessonProg, onClick }: {
  lesson: GEDLesson;
  lessonProg: ReturnType<typeof getLessonProgress>;
  onClick: () => void;
}) {
  const score = lessonProg.quizScore ?? 0;
  const color = masteryColor(score);
  return (
    <button onClick={onClick} style={{
      background: '#0c0c0c', border: `1px solid ${G}22`, padding: '10px 14px',
      textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', color: G,
      width: '100%', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 3,
    }}>
      <div style={{
        width: 8, height: 8, borderRadius: '50%',
        background: lessonProg.completed ? G : `${G}30`, flexShrink: 0,
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 'bold' }}>L{lesson.number}: {lesson.title}</div>
        <div style={{ fontSize: 9, color: `${G}50`, marginTop: 1 }}>
          {lesson.practiceQuestions.length} questions · {lesson.gedCode}
        </div>
      </div>
      {score > 0 && (
        <span style={{ fontSize: 10, color, fontWeight: 'bold' }}>{score}%</span>
      )}
      <span style={{ fontSize: 9, color }}>
        {masteryLabel(score)}
      </span>
      <ChevronRight size={12} color={`${G}60`} />
    </button>
  );
}

function LessonView({ lesson, subject, onStartQuiz, onBack }: {
  lesson: GEDLesson;
  subject: string;
  onStartQuiz: () => void;
  onBack: () => void;
}) {
  const meta = getSubjectMeta(subject);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '10px 14px', borderBottom: `1px solid ${G}22`, display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: G, cursor: 'pointer', fontFamily: 'inherit', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
          <ChevronLeft size={12} /> Back
        </button>
        <div style={{ flex: 1, fontSize: 11, color: meta.color, fontWeight: 'bold' }}>{lesson.title}</div>
        <div style={{ fontSize: 9, color: `${G}50` }}>{lesson.gedCode}</div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '14px' }}>
        {lesson.keyTerms && lesson.keyTerms.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 9, color: `${G}60`, marginBottom: 4 }}>KEY TERMS:</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {lesson.keyTerms.map(t => (
                <span key={t} style={{ fontSize: 9, border: `1px solid ${meta.color}44`, color: meta.color, padding: '1px 6px' }}>{t}</span>
              ))}
            </div>
          </div>
        )}
        <pre style={{
          fontFamily: '"Courier New", monospace', fontSize: 10, color: `${G}cc`,
          lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: 0, marginBottom: 16,
        }}>
          {lesson.content}
        </pre>
      </div>
      <div style={{ padding: '10px 14px', borderTop: `1px solid ${G}22`, display: 'flex', gap: 8 }}>
        <button onClick={onStartQuiz} style={{
          flex: 1, background: `${G}18`, border: `1px solid ${G}`, color: G,
          padding: '8px 0', cursor: 'pointer', fontFamily: 'inherit', fontSize: 11,
          fontWeight: 'bold', letterSpacing: 1,
        }}>
          START QUIZ ({lesson.practiceQuestions.length} questions)
        </button>
      </div>
    </div>
  );
}

function QuizView({ lesson, subject, onFinish }: {
  lesson: GEDLesson;
  subject: string;
  onFinish: (score: number) => void;
}) {
  const meta = getSubjectMeta(subject);
  const questions = lesson.practiceQuestions;
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});
  const [submitted, setSubmitted] = useState(false);

  const q = questions[idx];
  const selected = answers[idx];
  const isRevealed = revealed[idx];
  const isCorrect = selected === q.answer;

  const CHOICE_KEYS = ['A', 'B', 'C', 'D'] as const;

  function handleSelect(key: string) {
    if (isRevealed) return;
    setAnswers(prev => ({ ...prev, [idx]: key }));
  }

  function handleCheck() {
    if (!selected) return;
    setRevealed(prev => ({ ...prev, [idx]: true }));
  }

  function handleNext() {
    if (idx < questions.length - 1) {
      setIdx(i => i + 1);
    } else {
      const correct = questions.filter((qu, i) => answers[i] === qu.answer).length;
      const pct = Math.round((correct / questions.length) * 100);
      onFinish(pct);
    }
  }

  function choiceStyle(key: string): React.CSSProperties {
    if (!isRevealed) {
      return {
        background: selected === key ? `${meta.color}20` : '#111',
        border: `1px solid ${selected === key ? meta.color : G + '33'}`,
        color: selected === key ? meta.color : `${G}cc`,
      };
    }
    if (key === q.answer) return { background: '#003300', border: `1px solid ${G}`, color: G };
    if (key === selected && key !== q.answer) return { background: '#330000', border: `1px solid ${R}`, color: R };
    return { background: '#111', border: `1px solid ${G}22`, color: `${G}40` };
  }

  const answered = Object.keys(answers).length;
  const difficulty: Record<string, string> = { foundational: A, standard: C, extended: '#cc88ff' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '10px 14px', borderBottom: `1px solid ${G}22` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 10, color: meta.color, fontWeight: 'bold' }}>QUIZ: {lesson.title}</span>
          <span style={{ fontSize: 10, color: `${G}60` }}>{idx + 1} / {questions.length}</span>
        </div>
        <ProgressBar value={pct(idx + (isRevealed ? 1 : 0), questions.length)} color={meta.color} />
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '14px' }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 10, alignItems: 'center' }}>
          <span style={{ fontSize: 9, color: difficulty[q.difficulty] ?? A, border: `1px solid ${difficulty[q.difficulty] ?? A}55`, padding: '1px 6px' }}>
            {q.difficulty.toUpperCase()}
          </span>
          {q.gedCode && <span style={{ fontSize: 9, color: `${G}50` }}>{q.gedCode}</span>}
        </div>

        <div style={{ fontSize: 12, color: `${G}ee`, lineHeight: 1.65, marginBottom: 16, fontFamily: '"Courier New", monospace' }}>
          Q{idx + 1}: {q.question}
        </div>

        {(() => {
          const choices = q.choices;
          if (!choices) return null;
          return CHOICE_KEYS.map(key => (
            <button key={key} onClick={() => handleSelect(key)} style={{
              ...choiceStyle(key),
              display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px',
              marginBottom: 6, cursor: isRevealed ? 'default' : 'pointer',
              fontFamily: '"Courier New", monospace', fontSize: 11, lineHeight: 1.5,
              transition: 'all 0.15s',
            }}>
              <span style={{ fontWeight: 'bold', marginRight: 8 }}>{key}.</span>
              {choices[key]}
            </button>
          ));
        })()}

        {isRevealed && (
          <div style={{
            marginTop: 12, padding: '10px 12px',
            background: isCorrect ? '#002200' : '#1a0008',
            border: `1px solid ${isCorrect ? G : R}44`,
            fontSize: 10, color: isCorrect ? `${G}cc` : `${R}cc`, lineHeight: 1.6,
            fontFamily: '"Courier New", monospace',
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: 4, color: isCorrect ? G : R }}>
              {isCorrect ? '✓ CORRECT' : `✗ INCORRECT — Correct answer: ${q.answer}`}
            </div>
            {q.explanation}
          </div>
        )}
      </div>

      <div style={{ padding: '10px 14px', borderTop: `1px solid ${G}22`, display: 'flex', gap: 8 }}>
        {!isRevealed ? (
          <button onClick={handleCheck} disabled={!selected} style={{
            flex: 1, background: selected ? `${G}18` : 'transparent',
            border: `1px solid ${selected ? G : G + '33'}`, color: selected ? G : `${G}40`,
            padding: '8px 0', cursor: selected ? 'pointer' : 'default',
            fontFamily: 'inherit', fontSize: 11, fontWeight: 'bold', letterSpacing: 1,
          }}>
            CHECK ANSWER
          </button>
        ) : (
          <button onClick={handleNext} style={{
            flex: 1, background: `${G}18`, border: `1px solid ${G}`, color: G,
            padding: '8px 0', cursor: 'pointer', fontFamily: 'inherit',
            fontSize: 11, fontWeight: 'bold', letterSpacing: 1,
          }}>
            {idx < questions.length - 1 ? 'NEXT QUESTION →' : 'FINISH QUIZ →'}
          </button>
        )}
      </div>
    </div>
  );
}

function QuizResult({ score, lesson, subject, xpEarned, statBonuses, onReview, onContinue }: {
  score: number; lesson: GEDLesson; subject: string;
  xpEarned: number; statBonuses: Array<{ stat: string; gain: number }>;
  onReview: () => void; onContinue: () => void;
}) {
  const meta = getSubjectMeta(subject);
  const passed = score >= PASSING_QUIZ_SCORE;
  const borderColor = score >= 80 ? G : score >= 60 ? A : R;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 320 }}>
        <div style={{ fontSize: 48, marginBottom: 8, color: borderColor }}>{score >= 80 ? '★' : score >= 60 ? '●' : '○'}</div>
        <div style={{ fontSize: 28, fontWeight: 'bold', color: borderColor, textShadow: `0 0 20px ${borderColor}`, marginBottom: 4 }}>
          {score}%
        </div>
        <div style={{ fontSize: 12, color: borderColor, letterSpacing: 2, marginBottom: 16 }}>
          {masteryLabel(score)}
        </div>
        <div style={{ fontSize: 10, color: `${G}80`, marginBottom: 20, lineHeight: 1.6 }}>
          {lesson.title}
        </div>

        {xpEarned > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', marginBottom: 10, color: C }}>
            <Zap size={14} color={C} />
            <span style={{ fontSize: 11 }}>+{xpEarned} XP earned</span>
          </div>
        )}

        {statBonuses.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 9, color: `${G}60`, marginBottom: 6 }}>STAT BONUSES:</div>
            {statBonuses.map((b, i) => (
              <div key={i} style={{ fontSize: 10, color: meta.color, marginBottom: 2 }}>
                +{b.gain} {b.stat}
              </div>
            ))}
          </div>
        )}

        {!passed && (
          <div style={{ fontSize: 10, color: `${A}`, marginBottom: 16, lineHeight: 1.5 }}>
            Score {PASSING_QUIZ_SCORE}% or higher to earn XP and stat bonuses.
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button onClick={onReview} style={{
            flex: 1, background: 'transparent', border: `1px solid ${G}50`,
            color: `${G}80`, padding: '8px 0', cursor: 'pointer',
            fontFamily: 'inherit', fontSize: 10, letterSpacing: 1,
          }}>REVIEW LESSON</button>
          <button onClick={onContinue} style={{
            flex: 1, background: `${G}18`, border: `1px solid ${G}`,
            color: G, padding: '8px 0', cursor: 'pointer',
            fontFamily: 'inherit', fontSize: 11, fontWeight: 'bold', letterSpacing: 1,
          }}>CONTINUE →</button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────

type PortalTab = 'ged' | 'lang';

export default function AssignmentsPortal() {
  const { curriculumProgress, recordLessonQuiz } = useGameState();

  const [tab, setTab] = useState<PortalTab>('ged');
  const [screen, setScreen] = useState<Screen>('subjects');
  const [activeBook, setActiveBook] = useState<GEDTextbook | null>(null);
  const [activeChapterIdx, setActiveChapterIdx] = useState<number>(0);
  const [activeLesson, setActiveLesson] = useState<GEDLesson | null>(null);
  const [quizResult, setQuizResult] = useState<{ score: number; xpEarned: number; statBonuses: Array<{ stat: string; gain: number }> } | null>(null);

  const allSubjectProgress = useMemo(() =>
    KAPLAN_GED_CURRICULUM.map(b => computeSubjectProgress(curriculumProgress, b)),
    [curriculumProgress]
  );

  const allLangProgress = useMemo(() =>
    LANG_BOOKS.map(b => {
      const totalLessons = b.chapters.reduce((s, c) => s + (c.lessons?.length ?? 0), 0);
      const completedLessons = b.chapters.reduce((s, c) => {
        return s + (c.lessons ?? []).filter(l => curriculumProgress.lessonProgress[l.gedCode]?.completed).length;
      }, 0);
      const chaptersCompleted = b.chapters.filter(c =>
        (c.lessons ?? []).every(l => curriculumProgress.lessonProgress[l.gedCode]?.completed)
      ).length;
      const readinessScore = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
      return { subject: b.subject, readinessScore, chaptersCompleted, passReady: readinessScore >= 70 };
    }),
    [curriculumProgress]
  );

  const activeChapter = activeBook?.chapters[activeChapterIdx];
  const activeChapterKey = activeBook && activeChapter
    ? `${activeBook.subject.slice(0, 4).toUpperCase()}.Ch${activeChapter.number}`
    : '';
  const activeChapterProgress = activeBook && activeChapter
    ? computeChapterProgress(curriculumProgress, activeChapterKey, activeChapter.lessons ?? [])
    : null;

  function openBook(book: GEDTextbook) {
    setActiveBook(book);
    setScreen('chapters');
  }

  function openChapter(idx: number) {
    setActiveChapterIdx(idx);
    setScreen('lessons');
  }

  function openLesson(lesson: GEDLesson) {
    setActiveLesson(lesson);
    setScreen('lesson');
  }

  function startQuiz() {
    setScreen('quiz');
  }

  function handleQuizFinish(score: number) {
    if (!activeLesson || !activeBook) return;
    const result = recordLessonQuiz(activeLesson.gedCode, score, activeBook.subject);
    setQuizResult({ score, xpEarned: result.xpEarned, statBonuses: result.statBonuses });
    setScreen('quiz_result');
  }

  const meta = activeBook ? getSubjectMeta(activeBook.subject) : null;

  const cs: React.CSSProperties = {
    width: '100%', height: '100%', background: '#090909',
    fontFamily: '"Courier New", monospace', color: G,
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
  };

  function Header({ title, subtitle, back }: { title: string; subtitle?: string; back?: () => void }) {
    return (
      <div style={{ padding: '10px 14px', borderBottom: `1px solid ${G}22`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {back && (
            <button onClick={back} style={{ background: 'none', border: 'none', color: `${G}80`, cursor: 'pointer', fontFamily: 'inherit', fontSize: 11, padding: 0, display: 'flex', alignItems: 'center', gap: 3 }}>
              <ChevronLeft size={12} /> back
            </button>
          )}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 'bold', color: meta?.color ?? G, letterSpacing: 1 }}>{title}</div>
            {subtitle && <div style={{ fontSize: 9, color: `${G}50`, marginTop: 1 }}>{subtitle}</div>}
          </div>
        </div>
      </div>
    );
  }

  // ── SCREEN: SUBJECTS ─────────────────────────────────────────────────────
  if (screen === 'subjects') {
    const totalXp = curriculumProgress.totalXpEarned;
    const totalComplete = Object.values(curriculumProgress.lessonProgress).filter(l => l.completed).length;
    const isLang = tab === 'lang';
    return (
      <div style={cs}>
        <div style={{ padding: '10px 14px', borderBottom: `1px solid ${G}22`, flexShrink: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 'bold', color: G, textShadow: `0 0 8px ${G}`, marginBottom: 6 }}>
            [ EDUCATION OS — ACADEMY ]
          </div>
          <div style={{ display: 'flex', gap: 0, marginBottom: 6 }}>
            {(['ged', 'lang'] as PortalTab[]).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                flex: 1, padding: '5px 0', cursor: 'pointer', fontFamily: 'inherit',
                fontSize: 10, letterSpacing: 1, fontWeight: 'bold',
                background: tab === t ? `${G}18` : 'transparent',
                border: `1px solid ${tab === t ? G : G + '33'}`,
                color: tab === t ? G : `${G}50`,
                marginRight: t === 'ged' ? 4 : 0,
              }}>
                {t === 'ged' ? '◈ GED PREP' : '◉ LANGUAGES'}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 16, fontSize: 9, color: `${G}70` }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Zap size={10} color={C} /> {totalXp} XP earned
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <CheckCircle size={10} color={G} /> {totalComplete} lessons complete
            </span>
          </div>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
          {isLang ? (
            <>
              <div style={{ fontSize: 9, color: `${G}50`, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
                Select a Language Course
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {LANG_BOOKS.map((book, i) => (
                  <SubjectCard key={book.id} book={book} progress={allLangProgress[i] as any} onClick={() => openBook(book)} langMode />
                ))}
              </div>
              <div style={{ marginTop: 14, padding: '10px 12px', background: '#0c0c0c', border: `1px solid ${G}18`, fontSize: 10, color: `${G}60`, lineHeight: 1.7 }}>
                <div style={{ color: `${G}80`, marginBottom: 4 }}>ABOUT LANGUAGE COURSES</div>
                <div>Procedurally generated from structured vocabulary and grammar data. Each course covers greetings, numbers, colors, food, travel, verbs, and grammar foundations with real MCQ practice quizzes.</div>
                <div style={{ marginTop: 6 }}>Completing language quizzes awards <span style={{ color: C }}>+linguistic</span> and secondary stat bonuses to your character.</div>
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 9, color: `${G}50`, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
                Select a GED Subject
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {KAPLAN_GED_CURRICULUM.map((book, i) => (
                  <SubjectCard key={book.id} book={book} progress={allSubjectProgress[i]} onClick={() => openBook(book)} />
                ))}
              </div>
              <div style={{ marginTop: 14, padding: '10px 12px', background: '#0c0c0c', border: `1px solid ${G}18`, fontSize: 10, color: `${G}60`, lineHeight: 1.7 }}>
                <div style={{ color: `${G}80`, marginBottom: 4 }}>GED READINESS OVERVIEW</div>
                {allSubjectProgress.map(sp => {
                  const m = SUBJECT_META[sp.subject as keyof typeof SUBJECT_META];
                  return (
                    <div key={sp.subject} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span style={{ color: m.color, minWidth: 36, fontSize: 9 }}>{m.abbr}</span>
                      <div style={{ flex: 1 }}><ProgressBar value={sp.readinessScore} color={m.color} height={3} /></div>
                      <span style={{ minWidth: 32, textAlign: 'right', fontSize: 9, color: sp.passReady ? G : `${G}60` }}>
                        {sp.readinessScore}%
                      </span>
                      {sp.passReady && <span style={{ fontSize: 9, color: G }}>✓</span>}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── SCREEN: CHAPTERS ─────────────────────────────────────────────────────
  if (screen === 'chapters' && activeBook) {
    const subjectProg = allSubjectProgress.find(s => s.subject === activeBook.subject);
    return (
      <div style={cs}>
        <Header
          title={meta!.abbr + ' — ' + activeBook.subject}
          subtitle={`${activeBook.chapters.length} chapters · ${subjectProg?.readinessScore ?? 0}% readiness`}
          back={() => setScreen('subjects')}
        />
        <div style={{ flex: 1, overflow: 'auto', padding: '10px' }}>
          {activeBook.chapters.map((ch, i) => {
            const key = `${activeBook.subject.slice(0, 4).toUpperCase()}.Ch${ch.number}`;
            const cp = computeChapterProgress(curriculumProgress, key, ch.lessons ?? []);
            return (
              <ChapterRow key={ch.number} chapter={ch} subject={activeBook.subject}
                progress={cp} onClick={() => openChapter(i)} />
            );
          })}
        </div>
      </div>
    );
  }

  // ── SCREEN: LESSONS ──────────────────────────────────────────────────────
  if (screen === 'lessons' && activeBook && activeChapter) {
    const lessons = activeChapter.lessons ?? [];
    const next = getNextRecommendedLesson(curriculumProgress, activeBook);
    return (
      <div style={cs}>
        <Header
          title={`Ch${activeChapter.number}: ${activeChapter.title}`}
          subtitle={activeChapterProgress ? `${activeChapterProgress.lessonsCompleted}/${activeChapterProgress.totalLessons} lessons complete` : undefined}
          back={() => setScreen('chapters')}
        />
        <div style={{ flex: 1, overflow: 'auto', padding: '10px' }}>
          <div style={{ fontSize: 10, color: `${G}70`, marginBottom: 10, lineHeight: 1.6, fontFamily: '"Courier New", monospace', padding: '0 4px' }}>
            {activeChapter.content}
          </div>
          {lessons.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0', fontSize: 11, color: `${G}30` }}>
              Lessons coming soon for this chapter.
            </div>
          ) : lessons.map(lesson => {
            const lp = getLessonProgress(curriculumProgress, lesson.gedCode);
            const isNext = next?.lesson.gedCode === lesson.gedCode;
            return (
              <div key={lesson.gedCode} style={{ position: 'relative' }}>
                {isNext && (
                  <div style={{ position: 'absolute', left: -2, top: 1, bottom: 4, width: 2, background: meta!.color }} />
                )}
                <LessonRow lesson={lesson} lessonProg={lp} onClick={() => openLesson(lesson)} />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── SCREEN: LESSON VIEW ──────────────────────────────────────────────────
  if (screen === 'lesson' && activeLesson && activeBook) {
    return (
      <div style={cs}>
        <LessonView
          lesson={activeLesson}
          subject={activeBook.subject}
          onStartQuiz={startQuiz}
          onBack={() => setScreen('lessons')}
        />
      </div>
    );
  }

  // ── SCREEN: QUIZ ─────────────────────────────────────────────────────────
  if (screen === 'quiz' && activeLesson && activeBook) {
    return (
      <div style={cs}>
        <QuizView
          lesson={activeLesson}
          subject={activeBook.subject}
          onFinish={handleQuizFinish}
        />
      </div>
    );
  }

  // ── SCREEN: QUIZ RESULT ──────────────────────────────────────────────────
  if (screen === 'quiz_result' && activeLesson && activeBook && quizResult) {
    return (
      <div style={cs}>
        <QuizResult
          score={quizResult.score}
          lesson={activeLesson}
          subject={activeBook.subject}
          xpEarned={quizResult.xpEarned}
          statBonuses={quizResult.statBonuses}
          onReview={() => setScreen('lesson')}
          onContinue={() => setScreen('lessons')}
        />
      </div>
    );
  }

  return <div style={cs} />;
}
