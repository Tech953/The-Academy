import { GEDTextbook, GEDChapter } from '@shared/schema';

export const GED_SUBJECTS = [
  'Mathematical Reasoning',
  'Language Arts', 
  'Science',
  'Social Studies'
] as const;

export type GEDSubject = typeof GED_SUBJECTS[number];

const MATH_CHAPTERS: GEDChapter[] = [
  {
    number: 1,
    title: 'Numbers & Operations',
    topics: ['Integers', 'Fractions', 'Decimals', 'Order of Operations', 'Prime Numbers'],
    content: `Chapter 1: Numbers & Operations

INTEGERS
Integers are whole numbers that can be positive, negative, or zero. Understanding integers is fundamental to all mathematical reasoning.

Key concepts:
- Positive integers: 1, 2, 3, 4, 5...
- Negative integers: -1, -2, -3, -4, -5...
- Zero is neither positive nor negative
- Absolute value: the distance from zero |−5| = 5

FRACTIONS
A fraction represents a part of a whole. The top number (numerator) tells how many parts we have. The bottom number (denominator) tells how many equal parts the whole is divided into.

Adding fractions: Find common denominator, add numerators
Multiplying fractions: Multiply numerators, multiply denominators
Dividing fractions: Multiply by the reciprocal

DECIMALS  
Decimals are another way to represent fractions using place value. Each position to the right of the decimal point represents a power of 10.

Converting between fractions and decimals:
- 1/2 = 0.5
- 1/4 = 0.25  
- 1/5 = 0.2

ORDER OF OPERATIONS (PEMDAS)
1. Parentheses first
2. Exponents second
3. Multiplication and Division (left to right)
4. Addition and Subtraction (left to right)

PRIME NUMBERS
A prime number is only divisible by 1 and itself.
Prime numbers: 2, 3, 5, 7, 11, 13, 17, 19, 23...
Note: 2 is the only even prime number.`,
    practiceQuestions: [
      { question: 'What is 3/4 + 1/2?', answer: '5/4 or 1 1/4' },
      { question: 'Calculate: 2 + 3 × 4', answer: '14 (multiplication before addition)' },
      { question: 'Is 21 a prime number?', answer: 'No, 21 = 3 × 7' }
    ]
  },
  {
    number: 2,
    title: 'Algebra Fundamentals',
    topics: ['Variables', 'Solving Equations', 'Linear Inequalities', 'Quadratic Equations'],
    content: `Chapter 2: Algebra Fundamentals

VARIABLES AND EXPRESSIONS
A variable is a letter that represents an unknown number. Algebraic expressions combine variables, numbers, and operations.

Examples:
- 3x + 5 (x is the variable)
- 2y - 7
- a² + b²

SOLVING ONE-STEP EQUATIONS
To solve an equation, isolate the variable by performing the same operation on both sides.

Example: x + 5 = 12
Subtract 5 from both sides: x = 7

Example: 3x = 21
Divide both sides by 3: x = 7

SOLVING MULTI-STEP EQUATIONS
Combine like terms, then isolate the variable.

Example: 2x + 3 = 11
Step 1: Subtract 3 from both sides → 2x = 8
Step 2: Divide both sides by 2 → x = 4

LINEAR INEQUALITIES
Inequalities use <, >, ≤, or ≥ instead of =.
When multiplying or dividing by a negative number, flip the inequality sign!

Example: -2x > 6
Divide by -2 and flip: x < -3

QUADRATIC EQUATIONS
Quadratic equations have the form ax² + bx + c = 0.
Methods to solve: factoring, completing the square, or quadratic formula.

Quadratic formula: x = (-b ± √(b² - 4ac)) / 2a`,
    practiceQuestions: [
      { question: 'Solve: x + 5 = 12', answer: 'x = 7' },
      { question: 'Solve: 2x - 4 = 10', answer: 'x = 7' },
      { question: 'Solve: x² - 9 = 0', answer: 'x = 3 or x = -3' }
    ]
  },
  {
    number: 3,
    title: 'Geometry & Measurement',
    topics: ['Lines and Angles', 'Triangles', 'Circles', 'Area and Perimeter', 'Volume'],
    content: `Chapter 3: Geometry & Measurement

LINES AND ANGLES
- A line extends infinitely in both directions
- A ray has one endpoint and extends infinitely in one direction
- A line segment has two endpoints
- Parallel lines never intersect
- Perpendicular lines intersect at 90°

Types of angles:
- Acute: less than 90°
- Right: exactly 90°
- Obtuse: between 90° and 180°
- Straight: exactly 180°

TRIANGLES
The sum of angles in a triangle = 180°

Types:
- Equilateral: all sides equal, all angles 60°
- Isosceles: two sides equal
- Scalene: no sides equal
- Right triangle: one 90° angle

Pythagorean Theorem (right triangles): a² + b² = c²

CIRCLES
- Radius (r): distance from center to edge
- Diameter (d): distance across through center, d = 2r
- Circumference: C = 2πr or C = πd
- Area: A = πr²

AREA AND PERIMETER
Rectangle: A = length × width, P = 2(l + w)
Triangle: A = (1/2) × base × height
Parallelogram: A = base × height

VOLUME
Rectangular prism: V = length × width × height
Cylinder: V = πr²h
Sphere: V = (4/3)πr³`,
    practiceQuestions: [
      { question: 'Find the area of a rectangle with length 8 and width 5', answer: 'A = 40 square units' },
      { question: 'What is the circumference of a circle with radius 7? (Use π ≈ 3.14)', answer: 'C ≈ 43.96 units' },
      { question: 'In a right triangle, if a = 3 and b = 4, what is c?', answer: 'c = 5' }
    ]
  }
];

const LANGUAGE_ARTS_CHAPTERS: GEDChapter[] = [
  {
    number: 1,
    title: 'Reading Comprehension',
    topics: ['Main Ideas', 'Supporting Details', 'Inference', 'Context Clues'],
    content: `Chapter 1: Reading Comprehension

MAIN IDEAS
The main idea is the central point or message of a passage. To find it:
1. Read the entire passage
2. Ask: "What is this mainly about?"
3. Look for a topic sentence (often first or last)
4. Summarize in your own words

SUPPORTING DETAILS
Supporting details are facts, examples, or explanations that back up the main idea. They answer questions like:
- Who? What? When? Where? Why? How?

Look for:
- Statistics and data
- Quotes from experts
- Real-world examples
- Descriptions and explanations

MAKING INFERENCES
An inference is a logical conclusion based on evidence and reasoning. The text doesn't state it directly, but clues lead you there.

Steps to infer:
1. Gather clues from the text
2. Add your background knowledge
3. Draw a logical conclusion
4. Check if the text supports your inference

CONTEXT CLUES
When you encounter an unfamiliar word, use surrounding words to guess its meaning.

Types of context clues:
- Definition clue: the meaning is stated directly
- Synonym clue: a similar word is nearby
- Antonym clue: an opposite word provides contrast
- Example clue: examples help clarify meaning`,
    practiceQuestions: [
      { question: 'What is the difference between main idea and supporting details?', answer: 'The main idea is the central message; supporting details provide evidence for that message.' },
      { question: 'How do you make an inference?', answer: 'Combine clues from the text with your background knowledge to draw a logical conclusion.' }
    ]
  },
  {
    number: 2,
    title: 'Writing Skills',
    topics: ['Grammar Rules', 'Sentence Structure', 'Essay Writing', 'Revision'],
    content: `Chapter 2: Writing Skills

GRAMMAR RULES
Subject-Verb Agreement: Singular subjects take singular verbs; plural subjects take plural verbs.
- The dog runs. (singular)
- The dogs run. (plural)

Pronoun Agreement: Pronouns must agree with their antecedents in number and gender.
- Each student should bring their book. (acceptable modern usage)

Verb Tense Consistency: Keep the same tense throughout a passage unless there's a logical reason to shift.

SENTENCE STRUCTURE
Simple sentence: One independent clause
- The cat sat on the mat.

Compound sentence: Two independent clauses joined by a conjunction
- The cat sat on the mat, and the dog slept nearby.

Complex sentence: One independent clause + one or more dependent clauses
- When the sun rose, the rooster crowed.

ESSAY WRITING
Standard essay structure:
1. Introduction: Hook, background, thesis statement
2. Body paragraphs: Topic sentence, evidence, analysis
3. Conclusion: Restate thesis, summarize, final thought

Thesis statement: A clear, arguable claim that your essay will prove.

REVISION STRATEGIES
1. Read aloud to catch awkward phrasing
2. Check for clarity and organization
3. Eliminate redundancy
4. Vary sentence structure
5. Proofread for grammar and spelling`,
    practiceQuestions: [
      { question: 'Fix this sentence: "Each of the students need their supplies."', answer: '"Each of the students needs their supplies." (Each is singular)' },
      { question: 'What are the three parts of a standard essay?', answer: 'Introduction, body paragraphs, and conclusion' }
    ]
  }
];

const SCIENCE_CHAPTERS: GEDChapter[] = [
  {
    number: 1,
    title: 'Life Science',
    topics: ['Cells', 'Genetics', 'Human Body Systems', 'Evolution'],
    content: `Chapter 1: Life Science

CELLS - THE BUILDING BLOCKS OF LIFE
All living things are made of cells. Cells are the smallest unit of life.

Types of cells:
- Prokaryotic: No nucleus (bacteria)
- Eukaryotic: Has a nucleus (plants, animals, fungi)

Cell organelles:
- Nucleus: Contains DNA, controls cell activities
- Mitochondria: Produces energy (ATP)
- Cell membrane: Controls what enters/exits
- Ribosomes: Make proteins

GENETICS
DNA (deoxyribonucleic acid) carries genetic information.
- Structure: Double helix with base pairs (A-T, G-C)
- Genes: Segments of DNA that code for traits
- Chromosomes: DNA packages; humans have 46

Heredity concepts:
- Dominant traits: Expressed when one copy is present
- Recessive traits: Only expressed when two copies present
- Punnett squares predict offspring traits

HUMAN BODY SYSTEMS
- Circulatory: Heart, blood vessels; transports nutrients/oxygen
- Respiratory: Lungs; gas exchange
- Digestive: Stomach, intestines; breaks down food
- Nervous: Brain, spinal cord; controls responses
- Skeletal: Bones; support and protection
- Muscular: Muscles; movement

EVOLUTION
Evolution is change in species over time through natural selection.
- Adaptation: Traits that help survival
- Natural selection: Organisms with beneficial traits survive longer
- Evidence: Fossils, DNA similarities, anatomical structures`,
    practiceQuestions: [
      { question: 'What is the function of mitochondria?', answer: 'To produce energy (ATP) for the cell' },
      { question: 'What bases pair together in DNA?', answer: 'A pairs with T, G pairs with C' }
    ]
  },
  {
    number: 2,
    title: 'Physical Science',
    topics: ['Matter', 'Energy', 'Motion and Forces', 'Waves'],
    content: `Chapter 2: Physical Science

MATTER
Matter is anything that has mass and takes up space.

States of matter:
- Solid: Fixed shape, fixed volume
- Liquid: Takes shape of container, fixed volume
- Gas: Takes shape and volume of container

Atoms are the building blocks of matter.
- Protons (+), Neutrons (neutral), Electrons (−)
- Elements: Substances made of one type of atom
- Compounds: Two or more elements chemically bonded

ENERGY
Energy is the ability to do work. It cannot be created or destroyed, only transformed.

Types of energy:
- Kinetic: Energy of motion
- Potential: Stored energy (gravitational, elastic, chemical)
- Thermal: Heat energy
- Chemical: Stored in bonds
- Electrical: Moving electrons

MOTION AND FORCES
Newton's Laws of Motion:
1. An object at rest stays at rest; an object in motion stays in motion (inertia)
2. F = ma (Force equals mass times acceleration)
3. Every action has an equal and opposite reaction

Key concepts:
- Speed = distance / time
- Velocity = speed with direction
- Acceleration = change in velocity / time

WAVES
Waves transfer energy without transferring matter.
- Transverse waves: Vibration perpendicular to direction (light)
- Longitudinal waves: Vibration parallel to direction (sound)
- Wavelength, frequency, amplitude are key properties`,
    practiceQuestions: [
      { question: 'What is Newton\'s Second Law?', answer: 'F = ma (Force equals mass times acceleration)' },
      { question: 'What is kinetic energy?', answer: 'The energy of motion' }
    ]
  }
];

const SOCIAL_STUDIES_CHAPTERS: GEDChapter[] = [
  {
    number: 1,
    title: 'U.S. History',
    topics: ['Colonial Period', 'Revolutionary War', 'Civil War', 'Modern Era'],
    content: `Chapter 1: U.S. History Overview

COLONIAL PERIOD (1607-1776)
- 1607: Jamestown, first permanent English settlement
- 13 colonies established along the Atlantic coast
- Economy: Farming, trade, and later manufacturing
- Growing tensions with Britain over taxes and representation
- "No taxation without representation"

REVOLUTIONARY WAR (1775-1783)
- Causes: British taxes, lack of representation, restrictions
- Key events: Boston Tea Party, Battles of Lexington and Concord
- Declaration of Independence (1776): Thomas Jefferson
- Key figures: George Washington, Benjamin Franklin, John Adams
- Treaty of Paris (1783): Britain recognizes American independence

CONSTITUTION AND NEW NATION
- Articles of Confederation: First government, too weak
- Constitution (1787): Framework for federal government
- Bill of Rights: First 10 amendments protecting individual rights
- Three branches: Executive, Legislative, Judicial

CIVIL WAR (1861-1865)
- Causes: Slavery, states' rights, economic differences
- North (Union) vs. South (Confederacy)
- Emancipation Proclamation (1863): Freed slaves in Confederate states
- Reconstruction: Rebuilding the South after the war

MODERN ERA
- World Wars I and II: U.S. emerges as global power
- Civil Rights Movement (1950s-60s): Fight for racial equality
- Cold War: Tension with Soviet Union
- Recent challenges: Terrorism, economic crises, technological change`,
    practiceQuestions: [
      { question: 'What document declared American independence?', answer: 'The Declaration of Independence (1776)' },
      { question: 'What were the main causes of the Civil War?', answer: 'Slavery, states\' rights, and economic differences between North and South' }
    ]
  },
  {
    number: 2,
    title: 'Civics & Government',
    topics: ['Constitution', 'Branches of Government', 'Rights and Responsibilities', 'Elections'],
    content: `Chapter 2: Civics & Government

THE U.S. CONSTITUTION
The Constitution is the supreme law of the land. It establishes:
- The structure of the federal government
- Powers of each branch
- Rights of citizens
- Amendment process

Key principles:
- Popular sovereignty: Power comes from the people
- Limited government: Government power is restricted
- Separation of powers: Three distinct branches
- Checks and balances: Each branch limits the others
- Federalism: Power shared between federal and state governments

THREE BRANCHES OF GOVERNMENT

Executive Branch:
- President: Enforces laws, Commander-in-Chief
- Vice President: Succeeds President if needed
- Cabinet: Advises President on policy

Legislative Branch (Congress):
- Senate: 100 members (2 per state), 6-year terms
- House of Representatives: 435 members (based on population), 2-year terms
- Makes laws, controls budget, declares war

Judicial Branch:
- Supreme Court: 9 justices, lifetime appointments
- Interprets laws, determines constitutionality
- Federal court system below Supreme Court

CITIZEN RIGHTS AND RESPONSIBILITIES
Rights (Bill of Rights):
- Freedom of speech, religion, press, assembly
- Right to bear arms
- Protection from unreasonable searches
- Right to fair trial
- Protection from cruel and unusual punishment

Responsibilities:
- Voting, jury duty, paying taxes
- Obeying laws, staying informed
- Participating in democracy`,
    practiceQuestions: [
      { question: 'What are the three branches of government?', answer: 'Executive, Legislative, and Judicial' },
      { question: 'How many justices serve on the Supreme Court?', answer: 'Nine justices' }
    ]
  }
];

export const GED_TEXTBOOKS: GEDTextbook[] = [
  {
    id: 'ged-math',
    subject: 'Mathematical Reasoning',
    title: 'GED Mathematical Reasoning Study Guide',
    chapters: MATH_CHAPTERS
  },
  {
    id: 'ged-language-arts',
    subject: 'Language Arts',
    title: 'GED Reasoning Through Language Arts Study Guide',
    chapters: LANGUAGE_ARTS_CHAPTERS
  },
  {
    id: 'ged-science',
    subject: 'Science',
    title: 'GED Science Study Guide',
    chapters: SCIENCE_CHAPTERS
  },
  {
    id: 'ged-social-studies',
    subject: 'Social Studies',
    title: 'GED Social Studies Study Guide',
    chapters: SOCIAL_STUDIES_CHAPTERS
  }
];

export function getTextbookBySubject(subject: GEDSubject): GEDTextbook | undefined {
  return GED_TEXTBOOKS.find(t => t.subject === subject);
}

export function getChapterContent(subject: GEDSubject, chapterNumber: number): GEDChapter | undefined {
  const textbook = getTextbookBySubject(subject);
  return textbook?.chapters.find(c => c.number === chapterNumber);
}

export function formatChapterForDisplay(chapter: GEDChapter): string {
  const lines: string[] = [
    `=== Chapter ${chapter.number}: ${chapter.title} ===`,
    '',
    `Topics covered: ${chapter.topics.join(', ')}`,
    '',
    '---',
    '',
    chapter.content,
    ''
  ];

  if (chapter.practiceQuestions && chapter.practiceQuestions.length > 0) {
    lines.push('---');
    lines.push('');
    lines.push('PRACTICE QUESTIONS:');
    lines.push('');
    chapter.practiceQuestions.forEach((q, idx) => {
      lines.push(`${idx + 1}. ${q.question}`);
    });
  }

  return lines.join('\n');
}

export function formatTextbookIndex(textbook: GEDTextbook): string {
  const lines: string[] = [
    `=== ${textbook.title} ===`,
    '',
    `Subject: ${textbook.subject}`,
    '',
    'TABLE OF CONTENTS:',
    ''
  ];

  textbook.chapters.forEach(chapter => {
    lines.push(`Chapter ${chapter.number}: ${chapter.title}`);
    lines.push(`  Topics: ${chapter.topics.join(', ')}`);
    lines.push('');
  });

  lines.push('Type READ [subject] CHAPTER [number] to read a chapter.');
  
  return lines.join('\n');
}

export function getAllTextbooksList(): string {
  const lines: string[] = [
    '=== GED STUDY MATERIALS ===',
    '',
    'Available Textbooks:',
    ''
  ];

  GED_TEXTBOOKS.forEach(textbook => {
    lines.push(`[${textbook.id}] ${textbook.title}`);
    lines.push(`  Subject: ${textbook.subject}`);
    lines.push(`  Chapters: ${textbook.chapters.length}`);
    lines.push('');
  });

  lines.push('Type TEXTBOOK [subject] to view table of contents.');
  lines.push('Type READ [subject] CHAPTER [number] to read a chapter.');

  return lines.join('\n');
}
