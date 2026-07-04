import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
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
import type { GEDTextbook, GEDLesson, GEDPracticeQuestion, CognitiveState } from '@shared/schema';

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

function getCognitiveState(score: number | undefined): { state: CognitiveState; color: string; label: string } {
  if (!score || score === 0) return { state: 'untouched', color: `${G}40`, label: 'UNTOUCHED' };
  if (score < 40) return { state: 'fractured', color: '#d9534f', label: 'FRACTURED' };
  if (score < 70) return { state: 'integrating', color: '#f0ad4e', label: 'INTEGRATING' };
  return { state: 'internalized', color: '#5cb85c', label: 'INTERNALIZED' };
}

function getTemporalDrift(lastAccessed: string | undefined): { days: number; label: string; severity: 'fresh' | 'drifting' | 'stale' } {
  if (!lastAccessed) return { days: -1, label: 'never accessed', severity: 'stale' };
  const ms = Date.now() - new Date(lastAccessed).getTime();
  const days = Math.floor(ms / 86400000);
  if (days === 0) return { days: 0, label: 'today', severity: 'fresh' };
  if (days === 1) return { days: 1, label: '1 day ago', severity: 'fresh' };
  if (days <= 4) return { days, label: `${days} days ago`, severity: 'drifting' };
  return { days, label: `${days} days ago`, severity: 'stale' };
}

type Screen = 'subjects' | 'chapters' | 'lessons' | 'lesson' | 'quiz' | 'quiz_result' | 'constellation';

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
  const cogState = getCognitiveState(score > 0 ? score : undefined);
  const drift = getTemporalDrift(lessonProg.lastAccessed);
  const resonance = lessonProg.resonanceScore ?? 0;
  return (
    <button onClick={onClick} style={{
      background: '#0c0c0c', border: `1px solid ${G}18`, padding: '9px 12px',
      textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', color: G,
      width: '100%', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 3,
    }}>
      <div style={{
        width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
        background: lessonProg.completed ? cogState.color : `${G}25`,
        boxShadow: lessonProg.completed ? `0 0 6px ${cogState.color}60` : 'none',
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 'bold' }}>L{lesson.number}: {lesson.title}</div>
        <div style={{ fontSize: 8, color: `${G}45`, marginTop: 2, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span>{lesson.practiceQuestions.length} questions</span>
          <span style={{ color: `${G}30` }}>·</span>
          <span>{lesson.gedCode}</span>
          {drift.days >= 0 && (
            <>
              <span style={{ color: `${G}30` }}>·</span>
              <span style={{ color: drift.severity === 'fresh' ? `${G}40` : drift.severity === 'drifting' ? '#f0ad4e' : '#d9534f' }}>
                {drift.label}
              </span>
            </>
          )}
        </div>
      </div>
      {lessonProg.preReadCommentary && (
        <span style={{ fontSize: 7, color: G, border: `1px solid ${G}35`, padding: '0 3px', letterSpacing: 0.5, flexShrink: 0 }}>M</span>
      )}
      {resonance > 0 && (
        <span style={{ fontSize: 7, color: resonance >= 40 ? '#5cb85c' : '#f0ad4e', letterSpacing: 0.5, flexShrink: 0 }}>
          R{Math.round(resonance)}
        </span>
      )}
      {score > 0 && (
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 10, color: cogState.color, fontWeight: 'bold' }}>{score}%</div>
          <div style={{ fontSize: 7, color: cogState.color, letterSpacing: 0.5 }}>{cogState.label}</div>
        </div>
      )}
      <ChevronRight size={12} color={`${G}50`} />
    </button>
  );
}

const MENTOR_COMMENTARIES: Record<string, { mentor: string; role: string; quote: string; prompt: string }> = {
  'Math': {
    mentor: 'Prof. Chen',
    role: 'Mathematics',
    quote: 'Every formula is compressed history. Before you memorize it, ask yourself what problem drove someone to discover it.',
    prompt: 'As you read this lesson, note where the math connects to real decisions — money, distance, probability.',
  },
  'Language Arts': {
    mentor: 'Ms. Rivera',
    role: 'Language Arts',
    quote: 'Reading slowly is not a weakness. Precision readers extract meaning that fast readers miss entirely.',
    prompt: 'Identify the author\'s main argument, then ask yourself: what evidence supports it? What evidence is missing?',
  },
  'Social Studies': {
    mentor: 'Dr. Okafor',
    role: 'Social Studies',
    quote: 'History does not repeat itself — but patterns do. Your job is to recognize a pattern before it becomes a consequence.',
    prompt: 'As you read, trace the cause-and-effect chain. Events rarely happen in isolation.',
  },
  'Science': {
    mentor: 'Instructor Vasquez',
    role: 'Physical Science',
    quote: 'A hypothesis is not a guess — it is a disciplined question. Learn to ask better questions and the answers become obvious.',
    prompt: 'Look for testable claims in this lesson. Which ideas could you verify with an experiment?',
  },
};

function getMentorFor(subject: string): { mentor: string; role: string; quote: string; prompt: string } {
  for (const key of Object.keys(MENTOR_COMMENTARIES)) {
    if (subject.toLowerCase().includes(key.toLowerCase())) return MENTOR_COMMENTARIES[key];
  }
  return {
    mentor: 'Archivist Ilyra',
    role: 'The Archive',
    quote: 'Every lesson in this building was written by someone who once struggled with it. You are in good company.',
    prompt: 'Read carefully. What is the single most important idea in this section?',
  };
}

function MentorCommentaryPanel({ lesson, subject }: { lesson: GEDLesson; subject: string }) {
  const STORAGE_KEY = `academy-mentor-dismissed-${lesson.gedCode}`;
  const [expanded, setExpanded] = useState(() => !localStorage.getItem(STORAGE_KEY));
  const commentary = getMentorFor(subject);
  const { curriculumProgress, markCommentaryRead, recordReflection, markLessonAccessed } = useGameState();
  const lp = curriculumProgress.lessonProgress[lesson.gedCode];
  const resonance = lp?.resonanceScore ?? 0;
  const [reflectionDraft, setReflectionDraft] = useState(lp?.reflectionText ?? '');
  const drift = getTemporalDrift(lp?.lastAccessed);
  const cogState = getCognitiveState(lp?.quizScore);

  useEffect(() => { markLessonAccessed(lesson.gedCode); }, [lesson.gedCode]);

  useEffect(() => {
    if (expanded) markCommentaryRead(lesson.gedCode);
    else localStorage.setItem(STORAGE_KEY, '1');
  }, [expanded, STORAGE_KEY, lesson.gedCode]);

  const saveReflection = useCallback(() => {
    if (reflectionDraft !== (lp?.reflectionText ?? '')) {
      recordReflection(lesson.gedCode, reflectionDraft);
    }
  }, [reflectionDraft, lp?.reflectionText, lesson.gedCode]);

  const resonanceColor = resonance >= 60 ? '#5cb85c' : resonance >= 20 ? '#f0ad4e' : `${G}50`;
  const driftColor = drift.severity === 'fresh' ? `${G}50` : drift.severity === 'drifting' ? '#f0ad4e' : '#d9534f';

  return (
    <div style={{ marginBottom: 14, border: `1px solid ${G}28`, background: `${G}06` }}>
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          width: '100%', background: 'none', border: 'none', padding: '8px 12px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          cursor: 'pointer', fontFamily: 'Courier New, monospace',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 3, height: 14, background: lp?.preReadCommentary ? G : `${G}40` }} />
          <span style={{ fontSize: 9, color: lp?.preReadCommentary ? `${G}80` : `${G}50`, letterSpacing: 1 }}>
            MENTOR COMMENTARY
          </span>
          <span style={{ fontSize: 9, color: `${G}40` }}>— {commentary.mentor}</span>
          {lp?.preReadCommentary && (
            <span style={{ fontSize: 8, color: G, border: `1px solid ${G}40`, padding: '0 4px', letterSpacing: 0.5 }}>READ</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {resonance > 0 && (
            <span style={{ fontSize: 8, color: resonanceColor, letterSpacing: 0.5 }}>
              RESONANCE {Math.round(resonance)}
            </span>
          )}
          <span style={{ fontSize: 9, color: `${G}40`, fontFamily: 'monospace' }}>{expanded ? '▲' : '▼'}</span>
        </div>
      </button>

      {expanded && (
        <div style={{ padding: '0 12px 12px', borderTop: `1px solid ${G}18` }}>
          {/* Temporal drift + cognitive state header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 0 8px', borderBottom: `1px solid ${G}12` }}>
            <span style={{ fontSize: 8, color: cogState.color, letterSpacing: 1 }}>
              ◈ {cogState.label}
            </span>
            {lp?.quizScore ? (
              <span style={{ fontSize: 8, color: cogState.color }}>
                {lp.quizScore}% MASTERY
              </span>
            ) : null}
            <span style={{ flex: 1 }} />
            <span style={{ fontSize: 8, color: driftColor, letterSpacing: 0.5 }}>
              {drift.days === -1 ? 'NEVER ACCESSED' : `LAST ACCESSED: ${drift.label.toUpperCase()}`}
            </span>
          </div>

          <div style={{ paddingTop: 10 }}>
            <div style={{ fontSize: 11, color: `${G}80`, fontFamily: 'Courier New, monospace', lineHeight: 1.7, fontStyle: 'italic', marginBottom: 6 }}>
              "{commentary.quote}"
            </div>
            <div style={{ fontSize: 9, color: `${G}40`, fontFamily: 'monospace', marginBottom: 10 }}>
              — {commentary.mentor}, {commentary.role}
            </div>
            <div style={{ fontSize: 9, color: `${G}55`, letterSpacing: 0.5, marginBottom: 4 }}>READING FOCUS:</div>
            <div style={{ fontSize: 10, color: `${G}65`, fontFamily: 'Courier New, monospace', lineHeight: 1.6, background: `${G}08`, padding: '6px 10px', borderLeft: `2px solid ${G}30`, marginBottom: 12 }}>
              {commentary.prompt}
            </div>

            {/* Reflection textarea */}
            <div style={{ marginTop: 4 }}>
              <div style={{ fontSize: 9, color: `${G}55`, letterSpacing: 0.5, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                PRE-LESSON REFLECTION
                {resonance > 0 && (
                  <span style={{ fontSize: 8, color: resonanceColor }}>
                    +{Math.round(resonance)} RESONANCE EARNED
                  </span>
                )}
              </div>
              <textarea
                value={reflectionDraft}
                onChange={e => setReflectionDraft(e.target.value)}
                onBlur={saveReflection}
                placeholder="What do you expect to encounter in this lesson? Write your intentions here before starting..."
                style={{
                  width: '100%', minHeight: 60, background: '#060606',
                  border: `1px solid ${G}28`, color: `${G}90`,
                  fontFamily: 'Courier New, monospace', fontSize: 10, lineHeight: 1.6,
                  padding: '6px 8px', resize: 'vertical', boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
              <div style={{ fontSize: 8, color: `${G}30`, marginTop: 3, textAlign: 'right' }}>
                {reflectionDraft.length} chars
                {reflectionDraft.length > 80 ? <span style={{ color: '#5cb85c', marginLeft: 6 }}>· +15 resonance on save</span>
                  : reflectionDraft.length > 20 ? <span style={{ color: '#f0ad4e', marginLeft: 6 }}>· +5 resonance on save</span>
                  : <span style={{ marginLeft: 6 }}>· write more for resonance</span>}
              </div>
            </div>

            {/* Ecology indicators */}
            {lp?.ecology && (
              <div style={{ marginTop: 10, display: 'flex', gap: 14, borderTop: `1px solid ${G}12`, paddingTop: 8 }}>
                {[
                  { label: 'STABILITY', val: lp.ecology.stability, color: '#5cb85c' },
                  { label: 'COHERENCE', val: lp.ecology.coherence, color: C },
                  { label: 'STRAIN', val: lp.ecology.strain, color: '#d9534f' },
                ].map(({ label, val, color }) => (
                  <div key={label} style={{ flex: 1 }}>
                    <div style={{ fontSize: 7, color: `${G}40`, letterSpacing: 0.5, marginBottom: 3 }}>{label}</div>
                    <div style={{ height: 3, background: '#111', borderRadius: 1, overflow: 'hidden' }}>
                      <div style={{ width: `${val}%`, height: '100%', background: color, transition: 'width 0.4s' }} />
                    </div>
                    <div style={{ fontSize: 7, color, marginTop: 2 }}>{Math.round(val)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
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
        <MentorCommentaryPanel lesson={lesson} subject={subject} />
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

// ─── CONSTELLATION VIEW ──────────────────────────────────────────────────────

interface ConstellationNode {
  lesson: GEDLesson;
  book: GEDTextbook;
  x: number;
  y: number;
  chapterIdx: number;
  lessonIdx: number;
}

const DOMAIN_ANCHORS: Record<string, { x: number; y: number; color: string }> = {
  'Math':          { x: 0.25, y: 0.28, color: '#00ffcc' },
  'Language Arts': { x: 0.75, y: 0.28, color: '#ff88ff' },
  'Social Studies':{ x: 0.25, y: 0.72, color: '#ffaa00' },
  'Science':       { x: 0.75, y: 0.72, color: '#00aaff' },
};

function seededRand(seed: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

function buildConstellationNodes(books: GEDTextbook[]): ConstellationNode[] {
  const nodes: ConstellationNode[] = [];
  books.forEach(book => {
    const domainKey = Object.keys(DOMAIN_ANCHORS).find(k => book.subject.toLowerCase().includes(k.toLowerCase())) ?? 'Math';
    const anchor = DOMAIN_ANCHORS[domainKey];
    const chapterCount = book.chapters.length;
    book.chapters.forEach((chapter, ci) => {
      const chapterAngle = (ci / Math.max(chapterCount, 1)) * Math.PI * 2 - Math.PI / 2;
      const chapterRadius = 0.07 + (ci % 3) * 0.035;
      const chapterX = anchor.x + Math.cos(chapterAngle) * chapterRadius;
      const chapterY = anchor.y + Math.sin(chapterAngle) * chapterRadius;
      const lessons = chapter.lessons ?? [];
      lessons.forEach((lesson, li) => {
        const seed = lesson.gedCode.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
        const lessonAngle = (li / Math.max(lessons.length, 1)) * Math.PI * 2 + seededRand(seed) * 0.5;
        const lessonRadius = 0.02 + (lesson.difficulty ?? 1) * 0.012 + seededRand(seed + li) * 0.012;
        nodes.push({
          lesson,
          book,
          chapterIdx: ci,
          lessonIdx: li,
          x: chapterX + Math.cos(lessonAngle) * lessonRadius,
          y: chapterY + Math.sin(lessonAngle) * lessonRadius,
        });
      });
    });
  });
  return nodes;
}

function ConstellationView({
  onOpenLesson,
}: {
  onOpenLesson: (book: GEDTextbook, lesson: GEDLesson) => void;
}) {
  const { curriculumProgress } = useGameState();
  const svgRef = useRef<SVGSVGElement>(null);
  const [dims, setDims] = useState({ w: 600, h: 440 });
  const [hovered, setHovered] = useState<ConstellationNode | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);

  useEffect(() => {
    const obs = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setDims({ w: Math.max(300, width), h: Math.max(200, height) });
    });
    if (svgRef.current?.parentElement) obs.observe(svgRef.current.parentElement);
    return () => obs.disconnect();
  }, []);

  const allNodes = useMemo(() => buildConstellationNodes(KAPLAN_GED_CURRICULUM), []);

  const filteredNodes = selectedDomain
    ? allNodes.filter(n => n.book.subject.toLowerCase().includes(selectedDomain.toLowerCase()))
    : allNodes;

  const { w, h } = dims;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Domain filter buttons */}
      <div style={{ display: 'flex', gap: 6, padding: '8px 12px', borderBottom: `1px solid ${G}18`, flexShrink: 0 }}>
        <span style={{ fontSize: 9, color: `${G}40`, alignSelf: 'center', letterSpacing: 1 }}>DOMAIN:</span>
        {[null, 'Math', 'Language Arts', 'Social Studies', 'Science'].map(d => {
          const anchor = d ? DOMAIN_ANCHORS[d] : null;
          const active = selectedDomain === d;
          return (
            <button key={d ?? 'all'} onClick={() => setSelectedDomain(d)}
              style={{
                background: active ? `${anchor?.color ?? G}22` : 'transparent',
                border: `1px solid ${active ? (anchor?.color ?? G) : G + '30'}`,
                color: active ? (anchor?.color ?? G) : `${G}50`,
                fontFamily: 'inherit', fontSize: 8, padding: '2px 8px',
                cursor: 'pointer', letterSpacing: 0.5,
              }}>
              {d ?? 'ALL'}
            </button>
          );
        })}
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {[
            { label: 'FRACTURED', color: '#d9534f' },
            { label: 'INTEGRATING', color: '#f0ad4e' },
            { label: 'INTERNALIZED', color: '#5cb85c' },
          ].map(({ label, color }) => (
            <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, display: 'inline-block' }} />
              <span style={{ fontSize: 7, color: `${G}40`, letterSpacing: 0.5 }}>{label}</span>
            </span>
          ))}
        </div>
      </div>

      {/* SVG constellation canvas */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <svg ref={svgRef} width="100%" height="100%" style={{ display: 'block' }}>
          {/* Starfield background dots */}
          {Array.from({ length: 60 }, (_, i) => {
            const sx = seededRand(i * 17) * w;
            const sy = seededRand(i * 31) * h;
            return <circle key={i} cx={sx} cy={sy} r={0.6} fill={`${G}15`} />;
          })}

          {/* Domain halo rings */}
          {Object.entries(DOMAIN_ANCHORS).map(([domain, anch]) => {
            if (selectedDomain && !domain.toLowerCase().includes(selectedDomain.toLowerCase())) return null;
            return (
              <circle
                key={domain}
                cx={anch.x * w} cy={anch.y * h} r={w * 0.115}
                fill="none" stroke={anch.color} strokeWidth={0.5}
                strokeOpacity={0.12}
              />
            );
          })}

          {/* Domain labels */}
          {Object.entries(DOMAIN_ANCHORS).map(([domain, anch]) => {
            if (selectedDomain && !domain.toLowerCase().includes(selectedDomain.toLowerCase())) return null;
            return (
              <text key={`lbl-${domain}`}
                x={anch.x * w} y={anch.y * h - w * 0.12}
                textAnchor="middle" fill={anch.color}
                fontSize={8} fontFamily="Courier New, monospace"
                opacity={0.5} letterSpacing={1}
              >
                {domain.toUpperCase()}
              </text>
            );
          })}

          {/* Prerequisite connection lines (prev lesson in same chapter) */}
          {filteredNodes.map((node, i) => {
            if (node.lessonIdx === 0) return null;
            const prev = filteredNodes.find(n =>
              n.book.subject === node.book.subject &&
              n.chapterIdx === node.chapterIdx &&
              n.lessonIdx === node.lessonIdx - 1
            );
            if (!prev) return null;
            return (
              <line key={`line-${i}`}
                x1={node.x * w} y1={node.y * h}
                x2={prev.x * w} y2={prev.y * h}
                stroke={`${G}18`} strokeWidth={0.8}
              />
            );
          })}

          {/* Lesson nodes */}
          {filteredNodes.map((node, i) => {
            const lp = curriculumProgress.lessonProgress[node.lesson.gedCode];
            const mastery = lp?.quizScore ?? 0;
            const resonance = lp?.resonanceScore ?? 0;
            const cogState = getCognitiveState(mastery > 0 ? mastery : undefined);
            const isHov = hovered?.lesson.gedCode === node.lesson.gedCode;
            const domainAnch = Object.entries(DOMAIN_ANCHORS)
              .find(([d]) => node.book.subject.toLowerCase().includes(d.toLowerCase()));
            const domainColor = domainAnch?.[1].color ?? G;
            const glow = mastery / 100;
            const nodeRadius = 3.5 + resonance * 0.06 + (isHov ? 3 : 0);
            const fill = lp?.completed
              ? cogState.color
              : lp?.lastAccessed
                ? `${domainColor}55`
                : `${G}18`;

            return (
              <g key={node.lesson.gedCode}
                style={{ cursor: 'pointer' }}
                pointerEvents="all"
                onClick={() => onOpenLesson(node.book, node.lesson)}
                onMouseEnter={() => setHovered(node)}
                onMouseLeave={() => setHovered(null)}
                data-lesson={node.lesson.gedCode}
              >
                {/* Transparent hit area — ensures all g elements are clickable */}
                <circle
                  cx={node.x * w} cy={node.y * h} r={Math.max(nodeRadius + 8, 12)}
                  fill="transparent" pointerEvents="all"
                />
                {/* Resonance halo */}
                {resonance > 0 && (
                  <circle
                    cx={node.x * w} cy={node.y * h}
                    r={nodeRadius + resonance * 0.08}
                    fill="none"
                    stroke={cogState.color}
                    strokeWidth={0.8}
                    strokeOpacity={0.3 + glow * 0.4}
                  />
                )}
                {/* Mastery glow */}
                {mastery > 0 && (
                  <circle
                    cx={node.x * w} cy={node.y * h}
                    r={nodeRadius + 4}
                    fill={cogState.color}
                    fillOpacity={glow * 0.12}
                  />
                )}
                {/* Core node */}
                <circle
                  cx={node.x * w} cy={node.y * h} r={nodeRadius}
                  fill={fill}
                  fillOpacity={lp?.completed ? (0.6 + glow * 0.4) : 0.4}
                  stroke={isHov ? cogState.color : domainColor}
                  strokeWidth={isHov ? 1.5 : 0.5}
                  strokeOpacity={isHov ? 0.9 : 0.35}
                />
                {/* Completion dot */}
                {lp?.preReadCommentary && (
                  <circle cx={node.x * w + nodeRadius - 1} cy={node.y * h - nodeRadius + 1} r={1.5} fill={G} fillOpacity={0.8} />
                )}
              </g>
            );
          })}
        </svg>

        {/* Hover tooltip */}
        {hovered && (() => {
          const lp = curriculumProgress.lessonProgress[hovered.lesson.gedCode];
          const mastery = lp?.quizScore ?? 0;
          const resonance = lp?.resonanceScore ?? 0;
          const cogState = getCognitiveState(mastery > 0 ? mastery : undefined);
          const drift = getTemporalDrift(lp?.lastAccessed);
          const pxX = hovered.x * w;
          const pxY = hovered.y * h;
          const tipW = 200;
          const tipLeft = pxX > w * 0.6 ? pxX - tipW - 12 : pxX + 12;
          const tipTop = Math.min(pxY, h - 130);
          return (
            <div style={{
              position: 'absolute',
              left: tipLeft, top: tipTop,
              width: tipW, background: '#0a0a0a',
              border: `1px solid ${G}40`, padding: '8px 10px',
              pointerEvents: 'none', zIndex: 10,
              fontFamily: 'Courier New, monospace',
            }}>
              <div style={{ fontSize: 9, fontWeight: 'bold', color: G, marginBottom: 3 }}>
                {hovered.lesson.title}
              </div>
              <div style={{ fontSize: 8, color: `${G}50`, marginBottom: 5 }}>
                {hovered.book.subject} · {hovered.lesson.gedCode}
              </div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 4 }}>
                <span style={{ fontSize: 8, color: cogState.color }}>◈ {cogState.label}</span>
                {mastery > 0 && <span style={{ fontSize: 8, color: cogState.color }}>{mastery}%</span>}
              </div>
              {resonance > 0 && (
                <div style={{ fontSize: 8, color: '#f0ad4e', marginBottom: 2 }}>
                  RESONANCE {Math.round(resonance)}
                </div>
              )}
              {lp?.preReadCommentary && (
                <div style={{ fontSize: 8, color: G, marginBottom: 2 }}>✓ Commentary read</div>
              )}
              <div style={{ fontSize: 8, color: drift.severity === 'fresh' ? `${G}40` : drift.severity === 'drifting' ? '#f0ad4e' : '#d9534f' }}>
                {drift.days === -1 ? 'Never accessed' : `Last: ${drift.label}`}
              </div>
              {lp?.ecology && (
                <div style={{ marginTop: 6, display: 'flex', gap: 8 }}>
                  {[
                    { l: 'STB', v: lp.ecology.stability, c: '#5cb85c' },
                    { l: 'COH', v: lp.ecology.coherence, c: C },
                    { l: 'STR', v: lp.ecology.strain, c: '#d9534f' },
                  ].map(({ l, v, c }) => (
                    <span key={l} style={{ fontSize: 7, color: c }}>{l}:{Math.round(v)}</span>
                  ))}
                </div>
              )}
              <div style={{ fontSize: 7, color: `${G}35`, marginTop: 6 }}>Click to open lesson</div>
            </div>
          );
        })()}
      </div>

      {/* Bottom summary bar */}
      <div style={{
        padding: '6px 12px', borderTop: `1px solid ${G}18`, flexShrink: 0,
        display: 'flex', gap: 16, fontSize: 8, color: `${G}40`,
      }}>
        <span>{allNodes.length} lessons mapped</span>
        <span style={{ color: '#5cb85c' }}>
          {Object.values(curriculumProgress.lessonProgress).filter(l => (l.quizScore ?? 0) >= 70).length} internalized
        </span>
        <span style={{ color: '#f0ad4e' }}>
          {Object.values(curriculumProgress.lessonProgress).filter(l => { const s = l.quizScore ?? 0; return s >= 40 && s < 70; }).length} integrating
        </span>
        <span style={{ color: '#d9534f' }}>
          {Object.values(curriculumProgress.lessonProgress).filter(l => (l.quizScore ?? 0) > 0 && (l.quizScore ?? 0) < 40).length} fractured
        </span>
        <div style={{ flex: 1 }} />
        <span>· = mentor read indicator  ○ = unexplored  brightness = mastery</span>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────

type PortalTab = 'ged' | 'lang' | 'constellation';

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

  function openLessonFromConstellation(book: GEDTextbook, lesson: GEDLesson) {
    setActiveBook(book);
    const chapterIdx = book.chapters.findIndex(c => (c.lessons ?? []).some(l => l.gedCode === lesson.gedCode));
    if (chapterIdx >= 0) setActiveChapterIdx(chapterIdx);
    setActiveLesson(lesson);
    setTab('ged');
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
    const isConstellation = tab === 'constellation';

    const tabDefs: Array<{ id: PortalTab; label: string }> = [
      { id: 'ged', label: '◈ GED PREP' },
      { id: 'lang', label: '◉ LANGUAGES' },
      { id: 'constellation', label: '✦ CONSTELLATION' },
    ];

    return (
      <div style={cs}>
        <div style={{ padding: '10px 14px', borderBottom: `1px solid ${G}22`, flexShrink: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 'bold', color: G, textShadow: `0 0 8px ${G}`, marginBottom: 6 }}>
            [ EDUCATION OS — ACADEMY ]
          </div>
          <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
            {tabDefs.map(({ id, label }) => (
              <button key={id} onClick={() => setTab(id)} style={{
                flex: 1, padding: '5px 0', cursor: 'pointer', fontFamily: 'inherit',
                fontSize: 9, letterSpacing: 1, fontWeight: 'bold',
                background: tab === id ? `${G}18` : 'transparent',
                border: `1px solid ${tab === id ? G : G + '33'}`,
                color: tab === id ? G : `${G}50`,
              }}>
                {label}
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
        {isConstellation ? (
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <ConstellationView onOpenLesson={openLessonFromConstellation} />
          </div>
        ) : (
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
        )}
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
