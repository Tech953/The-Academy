import { useState, useMemo, useEffect, useRef, useCallback, type ReactNode } from 'react';
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
  getQuizQuestions,
  PASSING_QUIZ_SCORE,
} from '@/lib/gedCurriculum';
import { generateAllLanguageTextbooks, LANG_META } from '@/lib/languageCourseGenerator';
import type { GEDTextbook, GEDLesson, GEDPracticeQuestion, CognitiveState } from '@shared/schema';
import { gradeResponse, displayAnswer, gradeExtendedResponse } from '@/lib/itemGrading';
import Ti30xsCalculator from './Ti30xsCalculator';
import {
  analyzeProgress, weaveAssignments, gradeWovenAssignment, classifyAssignments,
  type WovenAssignment,
} from '@/lib/courseWeaver';
import { HomeworkEngine } from '@/lib/academy-engine/phase1/homeworkEngine';

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

const FORMAT_LABELS: Record<string, string> = {
  mcq: 'MULTIPLE CHOICE',
  fill_in: 'FILL-IN',
  drop_down: 'DROP-DOWN',
  drag_drop: 'DRAG & DROP',
  hot_spot: 'HOT SPOT',
  short_answer: 'SHORT ANSWER',
  extended_response: 'EXTENDED RESPONSE',
};

function QuizView({ lesson, subject, onFinish }: {
  lesson: GEDLesson;
  subject: string;
  onFinish: (score: number) => void;
}) {
  const meta = getSubjectMeta(subject);
  // Unified content store (Phase 1): quiz questions are drawn through
  // the getQuizQuestions selector, not read off the lesson object.
  const questions = getQuizQuestions({ kind: 'lesson', lessonCode: lesson.gedCode });
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [calcOpen, setCalcOpen] = useState(false);

  const q = questions[idx];
  const selected = answers[idx];
  const isRevealed = revealed[idx];
  // All formats grade through lib/itemGrading (Phase 2); for MCQ this is
  // the same letter equality the portal always used.
  const isCorrect = gradeResponse(q, selected);
  const isMath = subject === 'Mathematical Reasoning';
  const calcAllowed = isMath && q.calculatorAllowed !== false;

  const CHOICE_KEYS = ['A', 'B', 'C', 'D'] as const;

  useEffect(() => { setCalcOpen(false); }, [idx]);

  function setResponse(value: string) {
    if (isRevealed) return;
    setAnswers(prev => ({ ...prev, [idx]: value }));
  }

  function handleCheck() {
    if (!hasResponse) return;
    setRevealed(prev => ({ ...prev, [idx]: true }));
  }

  function handleNext() {
    if (idx < questions.length - 1) {
      setIdx(i => i + 1);
    } else {
      const correct = questions.filter((qu, i) => gradeResponse(qu, answers[i])).length;
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

  // ── drag & drop sequencing (response = tokens joined by ' | ') ──
  const sequence = q.type === 'drag_drop' ? (selected ?? '').split(' | ').filter(Boolean) : [];
  function addToken(token: string) {
    if (sequence.includes(token)) return;
    setResponse([...sequence, token].join(' | '));
  }
  function removeToken(token: string) {
    setResponse(sequence.filter(t => t !== token).join(' | '));
  }

  const wordTotal = q.type === 'extended_response'
    ? (selected ?? '').trim().split(/\s+/).filter(Boolean).length : 0;
  const hasResponse = q.type === 'drag_drop'
    ? sequence.length === (q.dragItems?.length ?? 0)
    : selected !== undefined && selected.trim() !== '';

  const answered = Object.keys(answers).length;
  const difficulty: Record<string, string> = { foundational: A, standard: C, extended: '#cc88ff' };
  const mono = '"Courier New", monospace';

  function renderStimulus() {
    if (!q.stimulus) return null;
    return (
      <div style={{ marginBottom: 14 }}>
        {q.stimulus.map((s, i) => (
          <div key={i} style={{
            border: `1px solid ${G}33`, background: '#0a0f0a', padding: '10px 12px',
            marginBottom: 8, fontFamily: mono, fontSize: 11, lineHeight: 1.65, color: `${G}dd`,
          }}>
            <div style={{ fontSize: 9, color: meta.color, fontWeight: 'bold', letterSpacing: 1, marginBottom: 4 }}>
              {s.label.toUpperCase()}
            </div>
            {s.text}
          </div>
        ))}
      </div>
    );
  }

  function renderAnswerControl() {
    switch (q.type) {
      case 'mcq': {
        const choices = q.choices;
        if (!choices) return null;
        return CHOICE_KEYS.map(key => (
          <button key={key} onClick={() => setResponse(key)} style={{
            ...choiceStyle(key),
            display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px',
            marginBottom: 6, cursor: isRevealed ? 'default' : 'pointer',
            fontFamily: mono, fontSize: 11, lineHeight: 1.5,
            transition: 'all 0.15s',
          }}>
            <span style={{ fontWeight: 'bold', marginRight: 8 }}>{key}.</span>
            {choices[key]}
          </button>
        ));
      }
      case 'fill_in':
        return (
          <input
            value={selected ?? ''}
            disabled={isRevealed}
            onChange={e => setResponse(e.target.value)}
            placeholder="Type your answer…"
            style={{
              width: '100%', boxSizing: 'border-box', background: '#0a0f0a',
              border: `1px solid ${meta.color}66`, color: G, padding: '9px 12px',
              fontFamily: mono, fontSize: 12, outline: 'none',
            }}
          />
        );
      case 'drop_down': {
        const parts = q.question.split('___');
        return (
          <div style={{ fontFamily: mono, fontSize: 12, lineHeight: 2, color: `${G}ee` }}>
            {parts[0]}
            <select
              value={selected ?? ''}
              disabled={isRevealed}
              onChange={e => setResponse(e.target.value)}
              style={{
                background: '#0a0f0a', border: `1px solid ${meta.color}66`, color: G,
                fontFamily: mono, fontSize: 12, padding: '4px 6px', margin: '0 4px', outline: 'none',
              }}
            >
              <option value="">— choose —</option>
              {(q.options ?? []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
            {parts.slice(1).join('___')}
          </div>
        );
      }
      case 'drag_drop':
        return (
          <div>
            <div
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); addToken(e.dataTransfer.getData('text/plain')); }}
              style={{
                minHeight: 44, border: `1px dashed ${meta.color}66`, background: '#0a0f0a',
                padding: 8, marginBottom: 10, display: 'flex', flexWrap: 'wrap', gap: 6,
              }}
            >
              {sequence.length === 0 && (
                <span style={{ fontSize: 10, color: `${G}50`, fontFamily: mono }}>
                  Drag or tap the pieces below to build your answer, in order.
                </span>
              )}
              {sequence.map(token => (
                <button key={token} onClick={() => removeToken(token)} disabled={isRevealed} style={{
                  background: `${meta.color}20`, border: `1px solid ${meta.color}`,
                  color: meta.color, padding: '5px 9px', cursor: isRevealed ? 'default' : 'pointer',
                  fontFamily: mono, fontSize: 11,
                }}>
                  {token} ✕
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {(q.dragItems ?? []).map(token => {
                const used = sequence.includes(token);
                return (
                  <button
                    key={token}
                    draggable={!used && !isRevealed}
                    onDragStart={e => e.dataTransfer.setData('text/plain', token)}
                    onClick={() => addToken(token)}
                    disabled={used || isRevealed}
                    style={{
                      background: '#111', border: `1px solid ${G}33`,
                      color: used ? `${G}30` : `${G}cc`, padding: '5px 9px',
                      cursor: used || isRevealed ? 'default' : 'grab',
                      fontFamily: mono, fontSize: 11, textDecoration: used ? 'line-through' : 'none',
                    }}
                  >
                    {token}
                  </button>
                );
              })}
            </div>
          </div>
        );
      case 'hot_spot': {
        if (!q.hotSpot) return null;
        const { backdrop, zones } = q.hotSpot;
        return (
          <div style={{
            position: 'relative', height: backdrop === 'grid' ? 260 : 230,
            border: `1px solid ${G}33`, background: '#0a0f0a', overflow: 'hidden',
          }}>
            {backdrop === 'grid' && (
              <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
                {Array.from({ length: 9 }, (_, i) => (i + 1) * 10).map(p => (
                  <g key={p} stroke={`${G}18`} strokeWidth="1">
                    <line x1={`${p}%`} y1="0" x2={`${p}%`} y2="100%" />
                    <line x1="0" y1={`${p}%`} x2="100%" y2={`${p}%`} />
                  </g>
                ))}
                <line x1="50%" y1="0" x2="50%" y2="100%" stroke={`${G}55`} strokeWidth="1" />
                <line x1="0" y1="50%" x2="100%" y2="50%" stroke={`${G}55`} strokeWidth="1" />
              </svg>
            )}
            {zones.map(zone => {
              const isSel = selected === zone.id;
              const revealedZone = isRevealed && zone.id === q.answer;
              const wrongSel = isRevealed && isSel && zone.id !== q.answer;
              return (
                <button
                  key={zone.id}
                  onClick={() => setResponse(zone.id)}
                  style={{
                    position: 'absolute',
                    left: `${zone.x}%`, top: `${zone.y}%`, width: `${zone.w}%`, height: `${zone.h}%`,
                    background: revealedZone ? '#003300' : wrongSel ? '#330000' : isSel ? `${meta.color}30` : '#11111188',
                    border: `1px solid ${revealedZone ? G : wrongSel ? R : isSel ? meta.color : G + '44'}`,
                    color: revealedZone ? G : wrongSel ? R : `${G}dd`,
                    cursor: isRevealed ? 'default' : 'pointer',
                    fontFamily: mono, fontSize: backdrop === 'passage' ? 11 : 10, lineHeight: 1.4,
                    padding: '4px 8px', textAlign: backdrop === 'panel' ? 'center' : 'left',
                    borderRadius: backdrop === 'grid' ? '50%' : 0,
                    display: 'flex', alignItems: 'center', justifyContent: backdrop === 'passage' ? 'flex-start' : 'center',
                  }}
                >
                  {zone.label}
                </button>
              );
            })}
          </div>
        );
      }
      case 'short_answer':
        return (
          <div>
            <textarea
              value={selected ?? ''}
              disabled={isRevealed}
              onChange={e => setResponse(e.target.value)}
              rows={4}
              placeholder="Write your answer in your own words…"
              style={{
                width: '100%', boxSizing: 'border-box', background: '#0a0f0a',
                border: `1px solid ${meta.color}66`, color: G, padding: '9px 12px',
                fontFamily: mono, fontSize: 12, lineHeight: 1.6, outline: 'none', resize: 'vertical',
              }}
            />
            <div style={{ fontSize: 9, color: `${G}50`, marginTop: 4, fontFamily: mono }}>
              Graded on the key ideas in your answer.
            </div>
          </div>
        );
      case 'extended_response':
        return (
          <div>
            <textarea
              value={selected ?? ''}
              disabled={isRevealed}
              onChange={e => setResponse(e.target.value)}
              rows={12}
              placeholder="Write your essay here — argue which text is better supported, cite evidence from both, and address the opposing view…"
              style={{
                width: '100%', boxSizing: 'border-box', background: '#0a0f0a',
                border: `1px solid ${meta.color}66`, color: G, padding: '10px 12px',
                fontFamily: mono, fontSize: 12, lineHeight: 1.65, outline: 'none', resize: 'vertical',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <span style={{ fontSize: 9, color: `${G}50`, fontFamily: mono }}>
                Scored with a simulated rubric (Traits 1–3) — not an official GED score.
              </span>
              <span style={{ fontSize: 9, color: `${G}70`, fontFamily: mono }}>{wordTotal} words</span>
            </div>
          </div>
        );
      default:
        return null;
    }
  }

  function renderReveal() {
    if (!isRevealed) return null;
    if (q.type === 'extended_response') {
      const score = gradeExtendedResponse(q, selected ?? '');
      const passed = score.total >= 4;
      return (
        <div style={{
          marginTop: 12, padding: '10px 12px',
          background: passed ? '#002200' : '#1a0008',
          border: `1px solid ${passed ? G : R}44`,
          fontSize: 10, color: `${G}cc`, lineHeight: 1.7, fontFamily: mono,
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: 4, color: passed ? G : R }}>
            SIMULATED RUBRIC SCORE: {score.total} / {score.maxTotal}
          </div>
          <div>Trait 1 — Arguments & Evidence: {score.trait1} / 3</div>
          <div>Trait 2 — Development & Organization: {score.trait2} / 2</div>
          <div style={{ marginBottom: 6 }}>Trait 3 — Clarity & Conventions: {score.trait3} / 2</div>
          {score.notes.map((n, i) => <div key={i} style={{ color: `${G}80` }}>· {n}</div>)}
          <div style={{ marginTop: 6 }}>{q.explanation}</div>
        </div>
      );
    }
    return (
      <div style={{
        marginTop: 12, padding: '10px 12px',
        background: isCorrect ? '#002200' : '#1a0008',
        border: `1px solid ${isCorrect ? G : R}44`,
        fontSize: 10, color: isCorrect ? `${G}cc` : `${R}cc`, lineHeight: 1.6,
        fontFamily: mono,
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: 4, color: isCorrect ? G : R }}>
          {isCorrect ? '✓ CORRECT' : `✗ INCORRECT — Correct answer: ${displayAnswer(q)}`}
        </div>
        {q.explanation}
      </div>
    );
  }

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
        <div style={{ display: 'flex', gap: 6, marginBottom: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 9, color: difficulty[q.difficulty] ?? A, border: `1px solid ${difficulty[q.difficulty] ?? A}55`, padding: '1px 6px' }}>
            {q.difficulty.toUpperCase()}
          </span>
          <span style={{ fontSize: 9, color: `${G}70`, border: `1px solid ${G}30`, padding: '1px 6px' }}>
            {FORMAT_LABELS[q.type] ?? q.type.toUpperCase()}
          </span>
          {q.gedCode && <span style={{ fontSize: 9, color: `${G}50` }}>{q.gedCode}</span>}
          {isMath && !calcAllowed && (
            <span style={{ fontSize: 9, color: A, border: `1px solid ${A}55`, padding: '1px 6px' }}>
              NO-CALCULATOR ITEM
            </span>
          )}
          {calcAllowed && (
            <button onClick={() => setCalcOpen(o => !o)} style={{
              fontSize: 9, color: calcOpen ? '#0a0f0a' : C, background: calcOpen ? C : 'transparent',
              border: `1px solid ${C}66`, padding: '1px 6px', cursor: 'pointer', fontFamily: 'inherit',
            }}>
              TI-30XS CALCULATOR
            </button>
          )}
        </div>

        {calcOpen && calcAllowed && (
          <div style={{ marginBottom: 14 }}>
            <Ti30xsCalculator accent={meta.color} />
          </div>
        )}

        {renderStimulus()}

        {q.type !== 'drop_down' && (
          <div style={{ fontSize: 12, color: `${G}ee`, lineHeight: 1.65, marginBottom: 16, fontFamily: mono }}>
            Q{idx + 1}: {q.question}
          </div>
        )}
        {q.type === 'drop_down' && (
          <div style={{ fontSize: 10, color: `${G}60`, marginBottom: 8, fontFamily: mono }}>
            Q{idx + 1}: Complete the sentence.
          </div>
        )}

        {renderAnswerControl()}
        {renderReveal()}
      </div>

      <div style={{ padding: '10px 14px', borderTop: `1px solid ${G}22`, display: 'flex', gap: 8 }}>
        {!isRevealed ? (
          <button onClick={handleCheck} disabled={!hasResponse} style={{
            flex: 1, background: hasResponse ? `${G}18` : 'transparent',
            border: `1px solid ${hasResponse ? G : G + '33'}`, color: hasResponse ? G : `${G}40`,
            padding: '8px 0', cursor: hasResponse ? 'pointer' : 'default',
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


// ─── COURSEWORK (Phase 4: CourseWeaver) ─────────────────────────────────────
// Differential coursework woven per student from their progress record.
// Lists are derived from woven data (pending / missed / completed);
// submission grades through the item engine and records into curriculum
// progress, which changes what the weaver targets next.

function WovenItemInput({ q, value, onChange }: {
  q: GEDPracticeQuestion;
  value: string;
  onChange: (v: string) => void;
}) {
  const picks = q.type === 'drag_drop' && value ? value.split(' | ') : [];
  return (
    <div>
      {q.stimulus?.map((s, i) => (
        <div key={i} style={{ background: '#0a0f0a', border: `1px solid ${DIM}`, padding: '8px 10px', marginBottom: 8 }}>
          <div style={{ fontSize: 9, color: C, letterSpacing: 1, marginBottom: 4 }}>{s.label.toUpperCase()}</div>
          <div style={{ fontSize: 11, color: `${G}cc`, lineHeight: 1.6 }}>{s.text}</div>
        </div>
      ))}
      <div style={{ fontSize: 12, color: G, lineHeight: 1.6, marginBottom: 8 }}>{q.question}</div>
      {q.type === 'mcq' && q.choices && (['A', 'B', 'C', 'D'] as const).map(letter => (
        <button key={letter} onClick={() => onChange(letter)} style={{
          display: 'block', width: '100%', textAlign: 'left', marginBottom: 4, padding: '7px 10px', cursor: 'pointer',
          fontFamily: 'inherit', fontSize: 11, background: value === letter ? `${G}22` : 'transparent',
          border: `1px solid ${value === letter ? G : DIM}`, color: value === letter ? G : `${G}aa`,
        }}>
          <b>{letter}.</b> {q.choices![letter]}
        </button>
      ))}
      {(q.type === 'fill_in' || q.type === 'short_answer') && (
        <input value={value} onChange={e => onChange(e.target.value)} placeholder="Type your answer…"
          style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', background: '#0a0f0a', border: `1px solid ${DIM}`, color: G, fontFamily: 'inherit', fontSize: 12 }} />
      )}
      {q.type === 'drop_down' && (
        <select value={value} onChange={e => onChange(e.target.value)}
          style={{ width: '100%', padding: '8px 10px', background: '#0a0f0a', border: `1px solid ${DIM}`, color: G, fontFamily: 'inherit', fontSize: 12 }}>
          <option value="">— choose —</option>
          {(q.options ?? []).map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      )}
      {q.type === 'drag_drop' && (
        <div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
            {(q.dragItems ?? []).filter(t => !picks.includes(t)).map(t => (
              <button key={t} onClick={() => onChange([...picks, t].join(' | '))} style={{
                padding: '5px 8px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 10,
                background: 'transparent', border: `1px solid ${DIM}`, color: `${G}aa`,
              }}>{t}</button>
            ))}
          </div>
          <div style={{ fontSize: 10, color: `${G}70`, marginBottom: 4 }}>Your order (tap a placed item to remove it):</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {picks.map((t, i) => (
              <button key={t} onClick={() => onChange(picks.filter(p => p !== t).join(' | '))} style={{
                textAlign: 'left', padding: '5px 8px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 10,
                background: `${G}14`, border: `1px solid ${G}55`, color: G,
              }}>{i + 1}. {t}</button>
            ))}
            {picks.length === 0 && <div style={{ fontSize: 10, color: `${G}40` }}>Tap items above to place them in order.</div>}
          </div>
        </div>
      )}
      {q.type === 'hot_spot' && q.hotSpot && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {q.hotSpot.zones.map(z => (
            <button key={z.id} onClick={() => onChange(z.id)} style={{
              textAlign: 'left', padding: '7px 10px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 11,
              background: value === z.id ? `${G}22` : 'transparent',
              border: `1px solid ${value === z.id ? G : DIM}`, color: value === z.id ? G : `${G}aa`,
            }}>{z.label}</button>
          ))}
        </div>
      )}
      {q.type === 'extended_response' && (
        <div>
          <textarea value={value} onChange={e => onChange(e.target.value)} rows={9} placeholder="Write your essay here…"
            style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', background: '#0a0f0a', border: `1px solid ${DIM}`, color: G, fontFamily: 'inherit', fontSize: 12, lineHeight: 1.6 }} />
          <div style={{ fontSize: 9, color: `${G}50`, marginTop: 4 }}>{value.trim() ? value.trim().split(/\s+/).length : 0} words</div>
        </div>
      )}
    </div>
  );
}

function CourseworkPanel({ progress, onRecordGrade }: {
  progress: ReturnType<typeof useGameState>['curriculumProgress'];
  onRecordGrade: (lessonCode: string, scorePercent: number, subject: string) => void;
}) {
  const gs = useGameState() as unknown as { character?: { name?: string } };
  const studentId = gs.character?.name ?? 'student';
  const engine = useMemo(() => new HomeworkEngine(studentId), [studentId]);
  const storageKey = `courseweaver.v1.${studentId}`;
  const [assignments, setAssignments] = useState<WovenAssignment[]>(() => {
    try { return JSON.parse(localStorage.getItem(storageKey) ?? '[]') as WovenAssignment[]; }
    catch { return []; }
  });
  const [activeId, setActiveId] = useState<string | null>(null);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ score: number; perItem: Array<{ itemId: string; earned: number }> } | null>(null);
  const weaveSig = useRef('');

  // Persist woven state.
  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(assignments)); } catch { /* storage unavailable */ }
  }, [assignments, storageKey]);

  // Top up active coursework whenever progress changes (a grade landed).
  useEffect(() => {
    const sig = JSON.stringify(Object.entries(progress.lessonProgress).map(([k, v]) => [k, v.quizScore ?? 0, v.attempts]));
    if (weaveSig.current === sig) return;
    weaveSig.current = sig;
    const { pending, overdue } = classifyAssignments(assignments, new Date());
    const activeCount = pending.length + overdue.length;
    if (activeCount >= 3) return;
    const standings = analyzeProgress(progress);
    const struggle = new Map(standings.map(s => [s.skillNodeId, engine.getStruggleCount(s.skillNodeId)]));
    const fresh = weaveAssignments({
      studentId, progress, existing: assignments, now: new Date(),
      count: 3 - activeCount, struggle,
    });
    if (fresh.length) setAssignments(prev => [...prev, ...fresh]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress]);

  const classified = useMemo(() => classifyAssignments(assignments, new Date()), [assignments]);
  const active = assignments.find(a => a.id === activeId) ?? null;

  const weaveMore = () => {
    const standings = analyzeProgress(progress);
    const struggle = new Map(standings.map(s => [s.skillNodeId, engine.getStruggleCount(s.skillNodeId)]));
    const fresh = weaveAssignments({ studentId, progress, existing: assignments, now: new Date(), count: 2, struggle });
    if (fresh.length) setAssignments(prev => [...prev, ...fresh]);
  };

  const submit = () => {
    if (!active) return;
    const graded = gradeWovenAssignment(active, responses, new Date());
    setAssignments(prev => prev.map(a => (a.id === active.id ? graded.assignment : a)));
    onRecordGrade(graded.assignment.lessonCode, graded.scorePercent, graded.assignment.subject);
    if (graded.scorePercent >= PASSING_QUIZ_SCORE) engine.recordSuccess(active.skillNodeId);
    else engine.recordStruggle(active.skillNodeId);
    setResult({ score: graded.scorePercent, perItem: graded.perItem });
  };

  const dueLabel = (a: WovenAssignment) => {
    const d = new Date(a.dueAt);
    return `due ${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
  };

  const row = (a: WovenAssignment, color: string, action?: ReactNode) => (
    <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: '#0c0c0c', border: `1px solid ${DIM}`, marginBottom: 6 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, color: G }}>{a.title}</div>
        <div style={{ fontSize: 9, color: `${G}60`, marginTop: 2 }}>
          {a.subject} · {a.items.length} questions · {a.maxPoints} pts · {a.status === 'completed' ? `grade ${a.grade}%` : dueLabel(a)}
        </div>
      </div>
      {action}
    </div>
  );

  if (active && !result) {
    return (
      <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
        <button onClick={() => setActiveId(null)} style={{ background: 'none', border: 'none', color: `${G}70`, cursor: 'pointer', fontFamily: 'inherit', fontSize: 10, marginBottom: 8 }}>← BACK TO COURSEWORK</button>
        <div style={{ fontSize: 12, fontWeight: 'bold', color: G, marginBottom: 2 }}>{active.title}</div>
        <div style={{ fontSize: 9, color: `${G}60`, marginBottom: 12 }}>{active.subject} · woven for {studentId} · {dueLabel(active)}</div>
        {active.items.map((q, i) => (
          <div key={q.id} style={{ marginBottom: 16, padding: '10px 12px', background: '#0c0c0c', border: `1px solid ${DIM}` }}>
            <div style={{ fontSize: 9, color: C, letterSpacing: 1, marginBottom: 6 }}>QUESTION {i + 1} OF {active.items.length} · {q.type.replace('_', ' ').toUpperCase()}</div>
            <WovenItemInput q={q} value={responses[q.id] ?? ''} onChange={v => setResponses(prev => ({ ...prev, [q.id]: v }))} />
          </div>
        ))}
        <button onClick={submit} style={{ width: '100%', padding: '10px 0', cursor: 'pointer', fontFamily: 'inherit', fontSize: 11, fontWeight: 'bold', letterSpacing: 1, background: `${G}18`, border: `1px solid ${G}`, color: G }}>
          SUBMIT FOR GRADING
        </button>
      </div>
    );
  }

  if (active && result) {
    const byId = new Map(active.items.map(q => [q.id, q]));
    return (
      <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
        <div style={{ textAlign: 'center', padding: '14px 0' }}>
          <div style={{ fontSize: 22, fontWeight: 'bold', color: result.score >= PASSING_QUIZ_SCORE ? G : R }}>{result.score}%</div>
          <div style={{ fontSize: 10, color: `${G}70`, marginTop: 4 }}>
            {result.score >= PASSING_QUIZ_SCORE ? 'PASSED — recorded to your progress. The weaver will target what is next.' : 'Recorded. This target stays in your coursework until it improves.'}
          </div>
        </div>
        {result.perItem.map((p, i) => {
          const q = byId.get(p.itemId)!;
          const ok = p.earned >= 1;
          return (
            <div key={p.itemId} style={{ padding: '8px 12px', background: '#0c0c0c', border: `1px solid ${DIM}`, marginBottom: 6 }}>
              <div style={{ fontSize: 11, color: ok ? G : R }}>{ok ? '✓' : '✗'} Question {i + 1}{p.earned > 0 && p.earned < 1 ? ` — partial credit (${Math.round(p.earned * 100)}%)` : ''}</div>
              <div style={{ fontSize: 10, color: `${G}80`, marginTop: 3 }}>Answer: {displayAnswer(q)}</div>
              <div style={{ fontSize: 10, color: `${G}60`, marginTop: 2, lineHeight: 1.5 }}>{q.explanation}</div>
              {q.type === 'extended_response' && (
                <div style={{ fontSize: 10, color: C, marginTop: 3 }}>
                  {(() => { const er = gradeExtendedResponse(q, responses[q.id] ?? ''); return `Simulated rubric: ${er.total}/7 — Arguments ${er.traits.argument.score}/3 · Development ${er.traits.development.score}/2 · Clarity ${er.traits.clarity.score}/2`; })()}
                </div>
              )}
            </div>
          );
        })}
        <button onClick={() => { setActiveId(null); setResult(null); setResponses({}); }} style={{ width: '100%', padding: '10px 0', cursor: 'pointer', fontFamily: 'inherit', fontSize: 11, fontWeight: 'bold', letterSpacing: 1, background: `${G}18`, border: `1px solid ${G}`, color: G, marginTop: 8 }}>
          BACK TO COURSEWORK
        </button>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
      <div style={{ fontSize: 10, color: `${G}70`, lineHeight: 1.7, marginBottom: 12 }}>
        Coursework woven for <span style={{ color: G }}>{studentId}</span> from your quiz history — weak targets first,
        questions generated per student, grades recorded to your real progress.
      </div>
      {classified.overdue.length > 0 && (
        <>
          <div style={{ fontSize: 9, color: R, letterSpacing: 1, marginBottom: 6 }}>MISSED</div>
          {classified.overdue.map(a => row(a, R, (
            <button onClick={() => { setActiveId(a.id); setResponses({}); setResult(null); }} style={{ padding: '5px 12px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 9, fontWeight: 'bold', background: 'transparent', border: `1px solid ${R}`, color: R }}>START</button>
          )))}
        </>
      )}
      <div style={{ fontSize: 9, color: `${G}50`, letterSpacing: 1, margin: '10px 0 6px' }}>PENDING</div>
      {classified.pending.length === 0 && classified.overdue.length === 0 && (
        <div style={{ fontSize: 10, color: `${G}50`, marginBottom: 8 }}>No pending coursework — the weaver is caught up with your targets.</div>
      )}
      {classified.pending.map(a => row(a, G, (
        <button onClick={() => { setActiveId(a.id); setResponses({}); setResult(null); }} style={{ padding: '5px 12px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 9, fontWeight: 'bold', background: `${G}18`, border: `1px solid ${G}`, color: G }}>START</button>
      )))}
      {classified.completed.length > 0 && (
        <>
          <div style={{ fontSize: 9, color: `${G}50`, letterSpacing: 1, margin: '12px 0 6px' }}>COMPLETED</div>
          {classified.completed.map(a => row(a, G))}
        </>
      )}
      <button onClick={weaveMore} style={{ marginTop: 10, padding: '7px 14px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 9, letterSpacing: 1, background: 'transparent', border: `1px solid ${DIM}`, color: `${G}80` }}>
        ▣ WEAVE MORE COURSEWORK
      </button>
    </div>
  );
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────

type PortalTab = 'ged' | 'lang' | 'constellation' | 'coursework';

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
    const isCoursework = tab === 'coursework';

    const tabDefs: Array<{ id: PortalTab; label: string }> = [
      { id: 'ged', label: '◈ GED PREP' },
      { id: 'lang', label: '◉ LANGUAGES' },
      { id: 'constellation', label: '✦ CONSTELLATION' },
      { id: 'coursework', label: '▣ COURSEWORK' },
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
        ) : isCoursework ? (
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <CourseworkPanel progress={curriculumProgress} onRecordGrade={recordLessonQuiz} />
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
                        <span style={{ minWidth: 76, textAlign: 'right', fontSize: 9, color: sp.passReady ? G : `${G}60` }}>
                          {sp.readinessScore}% · {sp.scaledScore ?? 100}
                        </span>
                        <span style={{ minWidth: 64, fontSize: 9, color: (sp.scaledScore ?? 0) >= 145 ? G : `${G}60` }}>
                          {sp.readinessBand ?? 'Below Passing'}
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
