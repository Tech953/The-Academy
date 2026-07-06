import { useState, useMemo } from 'react';
import {
  FolderArchive, FolderOpen, BookOpen, FileText, ScrollText,
  ClipboardList, ChevronRight, ChevronLeft, Search, X,
  BookMarked, GraduationCap, Microscope, Globe, Calculator,
  CheckCircle2, Circle, HelpCircle, Tag,
} from 'lucide-react';
import { GED_TEXTBOOKS } from '@/lib/gedContent';
import { useGameState } from '@/contexts/GameStateContext';
import type { GEDChapter } from '@shared/schema';

// ─── Types ─────────────────────────────────────────────────────────────────────

type FolderKey = 'textbooks' | 'lecture_notes' | 'research_papers' | 'assignments';

interface FolderDef {
  key: FolderKey;
  label: string;
  icon: React.ElementType;
  color: string;
  description: string;
}

// ─── Static data ───────────────────────────────────────────────────────────────

const FOLDERS: FolderDef[] = [
  { key: 'textbooks',       label: 'Textbooks',        icon: BookOpen,      color: '#00ff88', description: 'GED study guides & chapter content' },
  { key: 'lecture_notes',   label: 'Lecture Notes',    icon: ScrollText,    color: '#00ccff', description: 'Subject overviews & key concepts' },
  { key: 'research_papers', label: 'Research Papers',  icon: FileText,      color: '#cc66ff', description: 'Your personal research notebook' },
  { key: 'assignments',     label: 'Past Assignments',  icon: ClipboardList, color: '#ffaa00', description: 'Completed & in-progress coursework' },
];

// Subject → icon map
const SUBJECT_META: Record<string, { icon: React.ElementType; color: string; abbr: string }> = {
  'Mathematical Reasoning': { icon: Calculator, color: '#00ff88', abbr: 'MATH' },
  'Language Arts':          { icon: BookMarked, color: '#00ccff', abbr: 'ELA'  },
  'Science':                { icon: Microscope, color: '#cc66ff', abbr: 'SCI'  },
  'Social Studies':         { icon: Globe,      color: '#ffaa00', abbr: 'SOC'  },
};

// Curated lecture notes per subject
const LECTURE_NOTES: Record<string, { id: string; title: string; body: string; topics: string[] }[]> = {
  'Mathematical Reasoning': [
    { id: 'ln-math-1', title: 'Number Sense & Operations', topics: ['Integers', 'Fractions', 'Percent', 'PEMDAS'], body: `KEY CONCEPTS — NUMBER SENSE

Integers include all positive and negative whole numbers plus zero. Absolute value gives distance from zero regardless of sign.

FRACTION RULES
- Add/Subtract: common denominator required
- Multiply: straight across (numerator × numerator)
- Divide: flip the second fraction and multiply

PERCENT ↔ DECIMAL ↔ FRACTION
- 25% = 0.25 = 1/4
- 50% = 0.5  = 1/2
- 75% = 0.75 = 3/4

ORDER OF OPERATIONS (PEMDAS)
Parentheses → Exponents → Multiply/Divide → Add/Subtract

TIP: Work inside-out on nested parentheses.` },
    { id: 'ln-math-2', title: 'Algebra & Equations', topics: ['Variables', 'Linear equations', 'Inequalities', 'Functions'], body: `KEY CONCEPTS — ALGEBRA

SOLVING EQUATIONS
1. Isolate the variable on one side
2. Apply inverse operations (undo what was done)
3. What you do to one side, do to the other

LINEAR EQUATIONS: y = mx + b
- m = slope (rise/run)
- b = y-intercept (where line crosses y-axis)
- Slope between two points: (y2-y1)/(x2-x1)

INEQUALITIES
- Same rules as equations EXCEPT: flip the inequality when multiplying/dividing by a negative number

FUNCTIONS
A function assigns exactly one output to each input. Vertical line test confirms a graph is a function.` },
    { id: 'ln-math-3', title: 'Geometry & Measurement', topics: ['Area', 'Volume', 'Angles', 'Pythagorean theorem'], body: `KEY CONCEPTS — GEOMETRY

AREA FORMULAS
- Rectangle:  A = l × w
- Triangle:   A = ½ × b × h
- Circle:     A = πr²
- Trapezoid:  A = ½(b₁+b₂) × h

VOLUME FORMULAS
- Rectangular prism: V = l × w × h
- Cylinder:          V = πr²h
- Cone:              V = ⅓πr²h

PYTHAGOREAN THEOREM
a² + b² = c²  (c = hypotenuse, the longest side)

ANGLES
- Right angle = 90°
- Supplementary angles sum to 180°
- Complementary angles sum to 90°
- Vertical angles (opposite intersection) are equal` },
  ],
  'Language Arts': [
    { id: 'ln-ela-1', title: 'Reading Comprehension', topics: ['Main idea', 'Inference', 'Text evidence', 'Author purpose'], body: `KEY CONCEPTS — READING COMPREHENSION

MAIN IDEA vs. DETAIL
The main idea is the central point of the passage. Supporting details back it up. Ask: What is the author mostly talking about?

INFERENCE
An inference is a conclusion drawn from evidence + reasoning. The answer isn't stated directly — you connect clues.

TEXT EVIDENCE
- Always anchor answers in the text
- Quote or paraphrase specific lines
- Signal words: "according to the passage…" or "the author states…"

AUTHOR'S PURPOSE
- Inform (explain or teach)
- Persuade (convince or argue)
- Entertain (engage emotionally or narratively)

TONE vs. MOOD
Tone = author's attitude toward the subject
Mood = how the reader feels while reading` },
    { id: 'ln-ela-2', title: 'Extended Response Writing', topics: ['Thesis', 'Evidence', 'Structure', 'Revision'], body: `KEY CONCEPTS — EXTENDED RESPONSE

ESSAY STRUCTURE (5-paragraph model)
1. Introduction + thesis statement
2. Body paragraph 1 (claim + evidence + explanation)
3. Body paragraph 2 (claim + evidence + explanation)
4. Body paragraph 3 (counter-argument addressed)
5. Conclusion (restate thesis, summary)

STRONG THESIS
- Takes a clear position
- Tells the reader what the essay will argue
- Avoids vague language ("I think…", "maybe…")

EVIDENCE USAGE
- Quote → explain → connect to thesis
- Do not end paragraphs with quotations

REVISION CHECKLIST
□ Clear thesis in intro  □ Evidence in each body paragraph  □ Transitions between paragraphs  □ Grammar and punctuation` },
  ],
  'Science': [
    { id: 'ln-sci-1', title: 'Life Science Fundamentals', topics: ['Cells', 'DNA', 'Evolution', 'Ecosystems'], body: `KEY CONCEPTS — LIFE SCIENCE

CELL THEORY
1. All living things are made of cells
2. The cell is the basic unit of life
3. All cells come from pre-existing cells

CELL TYPES
- Prokaryotic: no nucleus (bacteria)
- Eukaryotic: has nucleus (plants, animals, fungi)

PHOTOSYNTHESIS
6CO₂ + 6H₂O + light energy → C₆H₁₂O₆ + 6O₂
(Carbon dioxide + water + light → glucose + oxygen)

CELLULAR RESPIRATION
C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + ATP (energy)

DNA & HEREDITY
DNA is the blueprint of life. Genes = segments of DNA. Dominant alleles mask recessive ones (Mendel's laws).` },
    { id: 'ln-sci-2', title: 'Physical Science & Earth Science', topics: ['Forces', 'Energy', 'Matter', 'Plate tectonics'], body: `KEY CONCEPTS — PHYSICAL SCIENCE

NEWTON'S LAWS
1. Objects at rest stay at rest unless acted upon (inertia)
2. F = ma (force = mass × acceleration)
3. Every action has an equal and opposite reaction

ENERGY TYPES
- Kinetic (motion), Potential (stored position), Thermal, Chemical, Electrical
- Energy is conserved — it changes form, not quantity

STATES OF MATTER
Solid → Liquid → Gas (heat added)
Gas → Liquid → Solid (heat removed)

EARTH SCIENCE
Plate tectonics drives earthquakes, volcanoes, mountain formation. Continental drift theory. Rock cycle: igneous → sedimentary → metamorphic.` },
  ],
  'Social Studies': [
    { id: 'ln-soc-1', title: 'Civics & Government', topics: ['US Constitution', 'Branches of government', 'Civil rights', 'Democracy'], body: `KEY CONCEPTS — CIVICS & GOVERNMENT

US CONSTITUTION STRUCTURE
- 7 Articles (framework of government)
- Bill of Rights (first 10 amendments)
- 27 amendments total

THREE BRANCHES
- Legislative (Congress): makes laws
- Executive (President): enforces laws
- Judicial (Supreme Court): interprets laws

CHECKS AND BALANCES
Each branch limits the power of the others. The President can veto laws. Congress can override vetoes. Courts can declare laws unconstitutional.

CIVIL RIGHTS MOVEMENT
Key figures: MLK Jr., Rosa Parks, Thurgood Marshall. Key legislation: Civil Rights Act 1964, Voting Rights Act 1965.` },
    { id: 'ln-soc-2', title: 'US & World History', topics: ['American Revolution', 'Civil War', 'WWI & WWII', 'Cold War'], body: `KEY CONCEPTS — US & WORLD HISTORY

AMERICAN REVOLUTION (1775–1783)
Cause: taxation without representation. Declaration of Independence, 1776. Outcome: US independence from Britain.

CIVIL WAR (1861–1865)
Cause: slavery and states' rights. Union vs. Confederacy. Emancipation Proclamation (1863). 13th Amendment abolished slavery.

WORLD WAR I (1914–1918)
Causes: MAIN (Militarism, Alliances, Imperialism, Nationalism). US entered 1917. Treaty of Versailles.

WORLD WAR II (1939–1945)
Holocaust. Allies vs. Axis. US entered after Pearl Harbor (1941). Ended with atomic bombs on Japan and European surrender.

COLD WAR (1947–1991)
US vs. USSR. Arms race, space race, proxy wars (Korea, Vietnam). Fell with collapse of Soviet Union.` },
  ],
};

// Sample assignments per subject (shown even without enrollment to seed the experience)
const SAMPLE_ASSIGNMENTS = [
  { id: 'asgn-1', subject: 'Mathematical Reasoning', title: 'Number Operations Quiz', status: 'completed', score: '85/100', due: 'Unit 1' },
  { id: 'asgn-2', subject: 'Language Arts',          title: 'Reading Passage Analysis', status: 'completed', score: '78/100', due: 'Unit 1' },
  { id: 'asgn-3', subject: 'Science',                title: 'Cell Biology Review',       status: 'in-progress', score: null, due: 'Unit 1' },
  { id: 'asgn-4', subject: 'Social Studies',         title: 'Civics Fundamentals',       status: 'not-started', score: null, due: 'Unit 1' },
];

// ─── Sub-components ─────────────────────────────────────────────────────────────

function SubjectChip({ subject }: { subject: string }) {
  const meta = SUBJECT_META[subject];
  if (!meta) return null;
  const Icon = meta.icon;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 9, color: meta.color, border: `1px solid ${meta.color}40`, borderRadius: 3, padding: '2px 6px', fontFamily: '"Courier New", monospace', letterSpacing: '0.4px' }}>
      <Icon size={9} />
      {meta.abbr}
    </span>
  );
}

function FolderRow({ def, active, onClick }: { def: FolderDef; active: boolean; onClick: () => void }) {
  const Icon = def.icon;
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        width: '100%', padding: '10px 12px', textAlign: 'left',
        background: active ? `${def.color}12` : 'transparent',
        border: active ? `1px solid ${def.color}40` : '1px solid transparent',
        borderRadius: 4, cursor: 'pointer',
        transition: 'background 0.15s',
      }}
    >
      <div style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${def.color}15`, border: `1px solid ${def.color}30`, borderRadius: 4, flexShrink: 0 }}>
        <Icon size={16} color={def.color} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 'bold', color: active ? def.color : '#ffffffcc', fontFamily: '"Courier New", monospace', letterSpacing: '0.3px' }}>{def.label}</div>
        <div style={{ fontSize: 9, color: '#ffffff35', marginTop: 1 }}>{def.description}</div>
      </div>
      <ChevronRight size={12} color={active ? def.color : '#ffffff20'} />
    </button>
  );
}

function SectionHeader({ label, color, icon: Icon, onBack }: { label: string; color: string; icon?: React.ElementType; onBack: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: `1px solid ${color}25`, background: `${color}08`, flexShrink: 0 }}>
      <button onClick={onBack} style={{ background: 'transparent', border: `1px solid ${color}30`, borderRadius: 3, padding: '3px 6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: `${color}90`, fontSize: 9, fontFamily: '"Courier New", monospace' }}>
        <ChevronLeft size={10} /> BACK
      </button>
      {Icon && <Icon size={14} color={color} />}
      <span style={{ fontSize: 12, fontWeight: 'bold', color, fontFamily: '"Courier New", monospace', letterSpacing: '0.5px', textTransform: 'uppercase' }}>{label}</span>
    </div>
  );
}

// ─── Textbooks view ─────────────────────────────────────────────────────────────

function TextbooksView({ onBack }: { onBack: () => void }) {
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<GEDChapter | null>(null);
  const [search, setSearch] = useState('');

  const book = GED_TEXTBOOKS.find(b => b.id === selectedBook);

  const filteredBooks = useMemo(() =>
    GED_TEXTBOOKS.filter(b =>
      !search || b.title.toLowerCase().includes(search.toLowerCase()) || b.subject.toLowerCase().includes(search.toLowerCase())
    ), [search]);

  if (selectedChapter && book) {
    const meta = SUBJECT_META[book.subject];
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: `1px solid ${meta.color}25`, background: `${meta.color}08`, flexShrink: 0 }}>
          <button onClick={() => setSelectedChapter(null)} style={{ background: 'transparent', border: `1px solid ${meta.color}30`, borderRadius: 3, padding: '3px 6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: `${meta.color}90`, fontSize: 9, fontFamily: '"Courier New", monospace' }}>
            <ChevronLeft size={10} /> CHAPTERS
          </button>
          <span style={{ fontSize: 11, color: meta.color, fontFamily: '"Courier New", monospace', fontWeight: 'bold' }}>Ch. {selectedChapter.number}: {selectedChapter.title}</span>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '14px 16px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
            {selectedChapter.topics.map(t => (
              <span key={t} style={{ fontSize: 9, color: `${meta.color}80`, border: `1px solid ${meta.color}25`, borderRadius: 3, padding: '2px 6px', fontFamily: '"Courier New", monospace' }}>{t}</span>
            ))}
          </div>
          <pre style={{ fontSize: 10, color: '#ffffffaa', fontFamily: '"Courier New", monospace', lineHeight: 1.8, whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>
            {selectedChapter.content}
          </pre>
          {selectedChapter.practiceQuestions && selectedChapter.practiceQuestions.length > 0 && (
            <div style={{ marginTop: 20, borderTop: `1px solid ${meta.color}20`, paddingTop: 14 }}>
              <div style={{ fontSize: 10, color: meta.color, fontWeight: 'bold', letterSpacing: '0.5px', marginBottom: 10, fontFamily: '"Courier New", monospace' }}>PRACTICE QUESTIONS</div>
              {selectedChapter.practiceQuestions.map((q, i) => (
                <PracticeQuestion key={i} index={i + 1} question={q.question} answer={q.answer} color={meta.color} />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (book) {
    const meta = SUBJECT_META[book.subject];
    const Icon = meta.icon;
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: `1px solid ${meta.color}25`, background: `${meta.color}08`, flexShrink: 0 }}>
          <button onClick={() => setSelectedBook(null)} style={{ background: 'transparent', border: `1px solid ${meta.color}30`, borderRadius: 3, padding: '3px 6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: `${meta.color}90`, fontSize: 9, fontFamily: '"Courier New", monospace' }}>
            <ChevronLeft size={10} /> BOOKS
          </button>
          <Icon size={13} color={meta.color} />
          <span style={{ fontSize: 11, color: meta.color, fontFamily: '"Courier New", monospace', fontWeight: 'bold', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{book.title}</span>
          <span style={{ fontSize: 9, color: `${meta.color}60`, fontFamily: '"Courier New", monospace' }}>{book.chapters.length} ch.</span>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
          {book.chapters.map(ch => (
            <button
              key={ch.number}
              onClick={() => setSelectedChapter(ch)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 12px', background: 'transparent', border: '1px solid transparent', borderRadius: 4, cursor: 'pointer', textAlign: 'left', marginBottom: 2, transition: 'background 0.1s' }}
              onMouseEnter={e => (e.currentTarget.style.background = `${meta.color}0a`)}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${meta.color}15`, border: `1px solid ${meta.color}30`, borderRadius: 3, fontSize: 10, color: meta.color, fontFamily: '"Courier New", monospace', fontWeight: 'bold', flexShrink: 0 }}>{ch.number}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, color: '#ffffffcc', fontFamily: '"Courier New", monospace' }}>{ch.title}</div>
                <div style={{ fontSize: 9, color: '#ffffff30', marginTop: 2 }}>{ch.topics.slice(0, 3).join(' · ')}{ch.topics.length > 3 ? ' …' : ''}</div>
              </div>
              <ChevronRight size={11} color={`${meta.color}50`} />
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <SectionHeader label="Textbooks" color="#00ff88" icon={BookOpen} onBack={onBack} />
      <div style={{ padding: '8px 10px', borderBottom: '1px solid #ffffff08', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#111', border: '1px solid #ffffff15', borderRadius: 4, padding: '5px 8px' }}>
          <Search size={11} color="#ffffff30" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search textbooks…" style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 10, color: '#ffffffcc', fontFamily: '"Courier New", monospace' }} />
          {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}><X size={10} color="#ffffff40" /></button>}
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
        {filteredBooks.map(b => {
          const meta = SUBJECT_META[b.subject];
          const Icon = meta?.icon ?? BookOpen;
          return (
            <button
              key={b.id}
              onClick={() => setSelectedBook(b.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '12px', background: 'transparent', border: `1px solid ${meta.color}20`, borderRadius: 4, cursor: 'pointer', textAlign: 'left', marginBottom: 6, transition: 'background 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.background = `${meta.color}0a`)}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${meta.color}18`, border: `1px solid ${meta.color}40`, borderRadius: 4, flexShrink: 0 }}>
                <Icon size={18} color={meta.color} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, color: '#ffffffcc', fontFamily: '"Courier New", monospace', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.title}</div>
                <div style={{ fontSize: 9, color: meta.color, marginTop: 3, letterSpacing: '0.4px' }}>{b.subject} · {b.chapters.length} chapters</div>
              </div>
              <ChevronRight size={12} color={`${meta.color}50`} />
            </button>
          );
        })}
        {filteredBooks.length === 0 && (
          <div style={{ textAlign: 'center', padding: '30px 0', color: '#ffffff20', fontSize: 11 }}>No textbooks match "{search}"</div>
        )}
      </div>
    </div>
  );
}

function PracticeQuestion({ index, question, answer, color }: { index: number; question: string; answer: string; color: string }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <div style={{ marginBottom: 12, background: `${color}06`, border: `1px solid ${color}20`, borderRadius: 4, padding: '10px 12px' }}>
      <div style={{ fontSize: 10, color: '#ffffffaa', lineHeight: 1.6, marginBottom: 6, fontFamily: '"Courier New", monospace' }}>
        <span style={{ color, fontWeight: 'bold', marginRight: 6 }}>{index}.</span>{question}
      </div>
      {revealed ? (
        <div style={{ fontSize: 10, color: color, fontFamily: '"Courier New", monospace', background: `${color}10`, borderRadius: 3, padding: '6px 8px', lineHeight: 1.5 }}>
          <span style={{ opacity: 0.6 }}>Answer: </span>{answer}
        </div>
      ) : (
        <button onClick={() => setRevealed(true)} style={{ fontSize: 9, color: `${color}70`, border: `1px solid ${color}25`, background: 'transparent', borderRadius: 3, padding: '3px 8px', cursor: 'pointer', fontFamily: '"Courier New", monospace', letterSpacing: '0.3px' }}>
          REVEAL ANSWER
        </button>
      )}
    </div>
  );
}

// ─── Lecture Notes view ─────────────────────────────────────────────────────────

function LectureNotesView({ onBack }: { onBack: () => void }) {
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedNote, setSelectedNote] = useState<string | null>(null);

  const subjects = Object.keys(LECTURE_NOTES);
  const notes = selectedSubject ? LECTURE_NOTES[selectedSubject] ?? [] : [];
  const note = notes.find(n => n.id === selectedNote);
  const color = selectedSubject ? (SUBJECT_META[selectedSubject]?.color ?? '#00ccff') : '#00ccff';

  if (note && selectedSubject) {
    const meta = SUBJECT_META[selectedSubject];
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: `1px solid ${color}25`, background: `${color}08`, flexShrink: 0 }}>
          <button onClick={() => setSelectedNote(null)} style={{ background: 'transparent', border: `1px solid ${color}30`, borderRadius: 3, padding: '3px 6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: `${color}90`, fontSize: 9, fontFamily: '"Courier New", monospace' }}>
            <ChevronLeft size={10} /> NOTES
          </button>
          <span style={{ fontSize: 11, color, fontFamily: '"Courier New", monospace', fontWeight: 'bold', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{note.title}</span>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '14px 16px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 14 }}>
            {note.topics.map(t => (
              <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 9, color: `${color}90`, border: `1px solid ${color}25`, borderRadius: 3, padding: '2px 6px', fontFamily: '"Courier New", monospace' }}>
                <Tag size={8} />{t}
              </span>
            ))}
          </div>
          <pre style={{ fontSize: 10, color: '#ffffffaa', fontFamily: '"Courier New", monospace', lineHeight: 1.9, whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>
            {note.body}
          </pre>
          {meta && <div style={{ marginTop: 14, textAlign: 'right' }}><SubjectChip subject={selectedSubject} /></div>}
        </div>
      </div>
    );
  }

  if (selectedSubject) {
    const meta = SUBJECT_META[selectedSubject];
    const Icon = meta?.icon ?? ScrollText;
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: `1px solid ${color}25`, background: `${color}08`, flexShrink: 0 }}>
          <button onClick={() => setSelectedSubject(null)} style={{ background: 'transparent', border: `1px solid ${color}30`, borderRadius: 3, padding: '3px 6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: `${color}90`, fontSize: 9, fontFamily: '"Courier New", monospace' }}>
            <ChevronLeft size={10} /> SUBJECTS
          </button>
          <Icon size={13} color={color} />
          <span style={{ fontSize: 11, color, fontFamily: '"Courier New", monospace', fontWeight: 'bold' }}>{selectedSubject}</span>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
          {notes.map(n => (
            <button key={n.id} onClick={() => setSelectedNote(n.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 12px', background: 'transparent', border: `1px solid ${color}15`, borderRadius: 4, cursor: 'pointer', textAlign: 'left', marginBottom: 4, transition: 'background 0.1s' }}
              onMouseEnter={e => (e.currentTarget.style.background = `${color}0a`)}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <ScrollText size={14} color={`${color}80`} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, color: '#ffffffcc', fontFamily: '"Courier New", monospace' }}>{n.title}</div>
                <div style={{ fontSize: 9, color: '#ffffff30', marginTop: 2 }}>{n.topics.slice(0, 3).join(' · ')}</div>
              </div>
              <ChevronRight size={11} color={`${color}40`} />
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <SectionHeader label="Lecture Notes" color="#00ccff" icon={ScrollText} onBack={onBack} />
      <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
        {subjects.map(subj => {
          const meta = SUBJECT_META[subj];
          const Icon = meta?.icon ?? ScrollText;
          const noteCount = (LECTURE_NOTES[subj] ?? []).length;
          return (
            <button key={subj} onClick={() => setSelectedSubject(subj)} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '12px', background: 'transparent', border: `1px solid ${meta.color}20`, borderRadius: 4, cursor: 'pointer', textAlign: 'left', marginBottom: 6 }}
              onMouseEnter={e => (e.currentTarget.style.background = `${meta.color}0a`)}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${meta.color}15`, border: `1px solid ${meta.color}35`, borderRadius: 4, flexShrink: 0 }}>
                <Icon size={18} color={meta.color} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: '#ffffffcc', fontFamily: '"Courier New", monospace', fontWeight: 'bold' }}>{subj}</div>
                <div style={{ fontSize: 9, color: `${meta.color}80`, marginTop: 3 }}>{noteCount} lecture note{noteCount !== 1 ? 's' : ''}</div>
              </div>
              <ChevronRight size={12} color={`${meta.color}40`} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Research Papers view ───────────────────────────────────────────────────────

function ResearchPapersView({ onBack }: { onBack: () => void }) {
  const notes: Array<{ id: string; title: string; content: string; tags: string[]; createdAt: string }> = useMemo(() => {
    try {
      const raw = localStorage.getItem('academy-research-notebook');
      if (raw) {
        const nb = JSON.parse(raw);
        return Array.isArray(nb.notes) ? nb.notes : [];
      }
    } catch { /* ignore */ }
    return [];
  }, []);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = notes.find(n => n.id === selectedId);

  if (selected) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: '1px solid #cc66ff25', background: '#cc66ff08', flexShrink: 0 }}>
          <button onClick={() => setSelectedId(null)} style={{ background: 'transparent', border: '1px solid #cc66ff30', borderRadius: 3, padding: '3px 6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: '#cc66ff90', fontSize: 9, fontFamily: '"Courier New", monospace' }}>
            <ChevronLeft size={10} /> PAPERS
          </button>
          <span style={{ fontSize: 11, color: '#cc66ff', fontFamily: '"Courier New", monospace', fontWeight: 'bold', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selected.title}</span>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '14px 16px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
            {selected.tags.map((tag: string) => (
              <span key={tag} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 9, color: '#cc66ff90', border: '1px solid #cc66ff25', borderRadius: 3, padding: '2px 6px', fontFamily: '"Courier New", monospace' }}>
                <Tag size={8} />{tag}
              </span>
            ))}
          </div>
          <pre style={{ fontSize: 10, color: '#ffffffaa', fontFamily: '"Courier New", monospace', lineHeight: 1.9, whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>
            {selected.content}
          </pre>
          <div style={{ marginTop: 14, fontSize: 9, color: '#ffffff25', fontFamily: '"Courier New", monospace' }}>
            Created: {new Date(selected.createdAt).toLocaleDateString()}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <SectionHeader label="Research Papers" color="#cc66ff" icon={FileText} onBack={onBack} />
      <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
        {notes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <FileText size={32} color="#cc66ff20" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontSize: 11, color: '#ffffff25', fontFamily: '"Courier New", monospace', lineHeight: 1.7 }}>
              Your research notebook is empty.<br />
              Use the Research Notebook app to create notes — they'll appear here.
            </div>
          </div>
        ) : notes.map(n => (
          <button key={n.id} onClick={() => setSelectedId(n.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 12px', background: 'transparent', border: '1px solid #cc66ff15', borderRadius: 4, cursor: 'pointer', textAlign: 'left', marginBottom: 4 }}
            onMouseEnter={e => (e.currentTarget.style.background = '#cc66ff0a')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <FileText size={14} color="#cc66ff60" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, color: '#ffffffcc', fontFamily: '"Courier New", monospace' }}>{n.title}</div>
              <div style={{ fontSize: 9, color: '#ffffff30', marginTop: 2 }}>{new Date(n.createdAt).toLocaleDateString()} · {n.tags.slice(0, 2).join(', ')}</div>
            </div>
            <ChevronRight size={11} color="#cc66ff30" />
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Assignments view ────────────────────────────────────────────────────────────

function AssignmentsView({ onBack }: { onBack: () => void }) {
  const { enrolledCourses } = useGameState();
  const [filter, setFilter] = useState<'all' | 'completed' | 'in-progress' | 'not-started'>('all');

  const allAssignments = useMemo(() => {
    const base = [...SAMPLE_ASSIGNMENTS];
    enrolledCourses.forEach(courseId => {
      const already = base.some(a => a.id.includes(courseId));
      if (!already) {
        base.push({ id: `asgn-enrolled-${courseId}`, subject: 'Mathematical Reasoning', title: `${courseId} Assignment`, status: 'in-progress', score: null, due: 'Current Unit' });
      }
    });
    return base;
  }, [enrolledCourses]);

  const filtered = filter === 'all' ? allAssignments : allAssignments.filter(a => a.status === filter);

  const STATUS_META: Record<string, { icon: React.ElementType; color: string; label: string }> = {
    'completed':   { icon: CheckCircle2, color: '#00ff88', label: 'COMPLETE' },
    'in-progress': { icon: Circle,       color: '#ffaa00', label: 'IN PROGRESS' },
    'not-started': { icon: HelpCircle,   color: '#ffffff30', label: 'NOT STARTED' },
  };

  const counts = {
    completed:   allAssignments.filter(a => a.status === 'completed').length,
    'in-progress': allAssignments.filter(a => a.status === 'in-progress').length,
    'not-started': allAssignments.filter(a => a.status === 'not-started').length,
  };

  const filterBtn = (f: typeof filter, label: string, color: string) => (
    <button key={f} onClick={() => setFilter(f)} style={{ flex: 1, background: filter === f ? `${color}15` : 'transparent', border: `1px solid ${filter === f ? `${color}50` : '#ffffff12'}`, color: filter === f ? color : '#ffffff35', padding: '5px 4px', cursor: 'pointer', fontSize: 8, fontFamily: '"Courier New", monospace', letterSpacing: '0.4px', borderRadius: 3 }}>{label}</button>
  );

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <SectionHeader label="Past Assignments" color="#ffaa00" icon={ClipboardList} onBack={onBack} />

      <div style={{ display: 'flex', gap: 3, padding: '6px 10px', borderBottom: '1px solid #ffffff08', flexShrink: 0 }}>
        {filterBtn('all', 'ALL', '#ffffff')}
        {filterBtn('completed', `DONE (${counts.completed})`, '#00ff88')}
        {filterBtn('in-progress', `ACTIVE (${counts['in-progress']})`, '#ffaa00')}
        {filterBtn('not-started', `PENDING (${counts['not-started']})`, '#ffffff50')}
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 0', color: '#ffffff20', fontSize: 11, fontFamily: '"Courier New", monospace' }}>No assignments match this filter.</div>
        ) : filtered.map(asgn => {
          const sm = STATUS_META[asgn.status];
          const StatusIcon = sm.icon;
          const subjMeta = SUBJECT_META[asgn.subject];
          return (
            <div key={asgn.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', border: `1px solid ${sm.color}15`, borderRadius: 4, marginBottom: 4, background: `${sm.color}05` }}>
              <StatusIcon size={14} color={sm.color} style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, color: '#ffffffcc', fontFamily: '"Courier New", monospace', fontWeight: 'bold' }}>{asgn.title}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                  {subjMeta && <SubjectChip subject={asgn.subject} />}
                  <span style={{ fontSize: 9, color: '#ffffff30', fontFamily: '"Courier New", monospace' }}>{asgn.due}</span>
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                {asgn.score ? (
                  <div style={{ fontSize: 12, fontWeight: 'bold', color: '#00ff88', fontFamily: '"Courier New", monospace' }}>{asgn.score}</div>
                ) : (
                  <div style={{ fontSize: 9, color: sm.color, fontFamily: '"Courier New", monospace', letterSpacing: '0.4px' }}>{sm.label}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Root component ─────────────────────────────────────────────────────────────

export default function SchoolFilesApp() {
  const [activeFolder, setActiveFolder] = useState<FolderKey | null>(null);

  const handleBack = () => setActiveFolder(null);

  if (activeFolder === 'textbooks')       return <TextbooksView onBack={handleBack} />;
  if (activeFolder === 'lecture_notes')   return <LectureNotesView onBack={handleBack} />;
  if (activeFolder === 'research_papers') return <ResearchPapersView onBack={handleBack} />;
  if (activeFolder === 'assignments')     return <AssignmentsView onBack={handleBack} />;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#06060a', color: '#fff', fontFamily: '"Courier New", monospace', overflow: 'hidden' }}>
      <div style={{ padding: '12px 14px', borderBottom: '1px solid #00ff8820', background: '#0a0a12', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <FolderArchive size={18} color="#00ff88" style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 'bold', color: '#00ff88', letterSpacing: '0.6px', textTransform: 'uppercase' }}>School Files</div>
            <div style={{ fontSize: 9, color: '#ffffff30', marginTop: 2, letterSpacing: '0.3px' }}>Academic materials · GED preparation resources</div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '10px 8px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {FOLDERS.map(f => (
            <FolderRow key={f.key} def={f} active={activeFolder === f.key} onClick={() => setActiveFolder(f.key)} />
          ))}
        </div>

        <div style={{ marginTop: 20, padding: '10px 12px', border: '1px solid #ffffff08', borderRadius: 4, background: '#0a0a0f' }}>
          <div style={{ fontSize: 9, color: '#00ff8860', fontFamily: '"Courier New", monospace', letterSpacing: '0.4px', marginBottom: 6, textTransform: 'uppercase' }}>Quick Reference</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {Object.entries(SUBJECT_META).map(([subj, meta]) => {
              const Icon = meta.icon;
              return (
                <div key={subj} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', background: `${meta.color}08`, border: `1px solid ${meta.color}20`, borderRadius: 3 }}>
                  <Icon size={12} color={meta.color} />
                  <div>
                    <div style={{ fontSize: 9, color: meta.color, fontFamily: '"Courier New", monospace', fontWeight: 'bold' }}>{meta.abbr}</div>
                    <div style={{ fontSize: 8, color: '#ffffff30', fontFamily: '"Courier New", monospace', lineHeight: 1.3 }}>{subj.replace(' Reasoning', '')}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
