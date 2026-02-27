import { GEDTextbook, GEDChapter } from '@shared/schema';

export const GED_SUBJECTS = [
  'Mathematical Reasoning',
  'Language Arts',
  'Science',
  'Social Studies'
] as const;

export type GEDSubject = typeof GED_SUBJECTS[number];

// ─────────────────────────────────────────────────────────────
// MATHEMATICAL REASONING
// Test split: ~45% Quantitative Problem Solving, ~55% Algebraic
// ─────────────────────────────────────────────────────────────
const MATH_CHAPTERS: GEDChapter[] = [
  {
    number: 1,
    title: 'Number Sense & Rational Numbers',
    topics: ['Ordering Rational Numbers', 'Absolute Value', 'Multiples & Factors', 'Exponents', 'Scientific Notation'],
    content: `Chapter 1: Number Sense & Rational Numbers
[Assessment Targets: Q.1, Q.2 — Quantitative Problem Solving]

ORDERING RATIONAL NUMBERS (Q.1.a)
Rational numbers include integers, fractions, and decimals.
To order them, convert all to decimals first.

Example: Order -3/4, 0.5, -0.8, 1/3
Convert: -0.75, 0.5, -0.8, 0.333...
Order (least to greatest): -0.8, -0.75, 0.333, 0.5

Number line: negative numbers are to the LEFT of zero; larger positives are further RIGHT.

ABSOLUTE VALUE (Q.1.d)
Absolute value = distance from zero on the number line. Always non-negative.
|−7| = 7     |4| = 4     |0| = 0

Distance between two numbers: |a − b|
Distance between −3 and 5: |−3 − 5| = |−8| = 8

MULTIPLES, FACTORS & THE DISTRIBUTIVE PROPERTY (Q.1.b)
- Factors: numbers that divide evenly into a number (factors of 12: 1, 2, 3, 4, 6, 12)
- Multiples: skip-counting results (multiples of 4: 4, 8, 12, 16…)
- LCM (Least Common Multiple): smallest shared multiple (LCM of 4 and 6 = 12)
- GCF (Greatest Common Factor): largest shared factor (GCF of 12 and 18 = 6)
- Distributive Property: a(b + c) = ab + ac   →   3(x + 5) = 3x + 15

EXPONENTS (Q.1.c)
- 3⁴ means 3 × 3 × 3 × 3 = 81
- Negative exponent: a⁻ⁿ = 1/aⁿ   →   2⁻³ = 1/8
- Zero exponent: any nonzero base to the 0 = 1
- Product rule: aᵐ × aⁿ = aᵐ⁺ⁿ
- Quotient rule: aᵐ ÷ aⁿ = aᵐ⁻ⁿ

SCIENTIFIC NOTATION (Q.2.e)
A number in scientific notation: M × 10ⁿ where 1 ≤ M < 10
- 45,000 = 4.5 × 10⁴
- 0.0032 = 3.2 × 10⁻³

Operations: 3 × 10⁵ + 2 × 10⁵ = 5 × 10⁵   (same powers: add the coefficients)

OPERATIONS WITH RATIONAL NUMBERS (Q.2)
Adding/subtracting fractions: find a common denominator
  2/3 + 1/4 = 8/12 + 3/12 = 11/12

Multiplying fractions: multiply across
  3/5 × 2/7 = 6/35

Dividing fractions: multiply by the reciprocal
  4/5 ÷ 2/3 = 4/5 × 3/2 = 12/10 = 6/5

Squares and square roots (Q.2.b): √49 = 7, √2 ≈ 1.414
Cubes and cube roots (Q.2.c): ∛27 = 3, ∛8 = 2`,
    practiceQuestions: [
      { question: 'Order from least to greatest: -1/2, 0.3, -0.4, 2/5', answer: '-0.5, -0.4, 0.3, 0.4 → least to greatest: -1/2, -0.4, 0.3, 2/5' },
      { question: 'What is the distance between -6 and 4 on the number line?', answer: '|-6 - 4| = |-10| = 10' },
      { question: 'Simplify: 2³ × 2⁴', answer: '2⁷ = 128 (add exponents when multiplying same base)' },
      { question: 'Write 0.00057 in scientific notation', answer: '5.7 × 10⁻⁴' },
      { question: 'Calculate: 3/8 ÷ 3/4', answer: '3/8 × 4/3 = 12/24 = 1/2' }
    ]
  },
  {
    number: 2,
    title: 'Ratios, Proportions & Percents',
    topics: ['Unit Rates', 'Scale Factors', 'Proportions', 'Percents', 'Simple Interest'],
    content: `Chapter 2: Ratios, Proportions & Percents
[Assessment Targets: Q.3 — Quantitative Problem Solving]

UNIT RATES (Q.3.a)
A unit rate compares a quantity to one unit of another.
- 240 miles in 4 hours → 240/4 = 60 miles per hour
- $2.40 for 3 items → $0.80 per item
- 500 BTUs per 10 cubic feet → 50 BTUs per cubic foot

SCALE FACTORS & SCALE DRAWINGS (Q.3.b)
A scale factor shows how a drawing relates to real measurements.
- Scale 1:50 means 1 inch on map = 50 inches in real life
- If a room is 3 inches on a scale drawing at 1 inch = 8 feet: 3 × 8 = 24 feet actual

To find scale factor: map measurement ÷ actual measurement

PROPORTIONS (Q.3.c)
A proportion sets two ratios equal: a/b = c/d
Cross-multiply to solve: ad = bc

Example: If 5 apples cost $3, how much do 8 apples cost?
5/3 = 8/x → 5x = 24 → x = $4.80

Also applies to unit conversions:
12 inches = 1 foot. How many inches in 7.5 feet?
12/1 = x/7.5 → x = 90 inches

PERCENTS (Q.3.d)
Percent means "per hundred." 45% = 45/100 = 0.45

Key formulas:
- Part = Percent × Whole
- Percent = Part ÷ Whole × 100
- Whole = Part ÷ Percent

Percent increase: (New − Old) / Old × 100
Percent decrease: (Old − New) / Old × 100

SIMPLE INTEREST & REAL-WORLD PERCENT PROBLEMS (Q.3.d)
Simple Interest: I = P × r × t
- P = principal (starting amount)
- r = annual interest rate (as a decimal)
- t = time in years

Example: $1,000 at 5% for 3 years: I = 1000 × 0.05 × 3 = $150

Tax: Add tax% × price to the original price
Discount: Subtract discount% × original price
Commission: Commission rate × sales amount
Tip/gratuity: Tip% × bill amount`,
    practiceQuestions: [
      { question: 'A car travels 350 miles on 14 gallons. What is the unit rate (miles per gallon)?', answer: '350 ÷ 14 = 25 miles per gallon' },
      { question: 'A map uses scale 1 inch = 25 miles. Two cities are 3.5 inches apart. What is the actual distance?', answer: '3.5 × 25 = 87.5 miles' },
      { question: 'A shirt costs $40. It is on sale for 25% off. What is the sale price?', answer: 'Discount = 0.25 × $40 = $10. Sale price = $40 - $10 = $30' },
      { question: 'What is the simple interest on $2,000 at 4% annually for 2 years?', answer: 'I = 2000 × 0.04 × 2 = $160' },
      { question: 'If 8 workers can build a wall in 6 days, how many days will 12 workers take? (inverse proportion)', answer: '8 × 6 = 12 × x → x = 4 days' }
    ]
  },
  {
    number: 3,
    title: 'Geometry & Measurement',
    topics: ['Perimeter & Area', 'Volume & Surface Area', 'Pythagorean Theorem', 'Coordinate Geometry', 'Angles'],
    content: `Chapter 3: Geometry & Measurement
[Assessment Targets: Q.4, Q.5, Q.6 — Quantitative Problem Solving]

PERIMETER, CIRCUMFERENCE & AREA (Q.4)
Rectangle: P = 2l + 2w    A = lw
Triangle: A = ½bh
Parallelogram: A = bh
Trapezoid: A = ½(b₁ + b₂)h
Circle: C = 2πr (circumference)    A = πr² (use π ≈ 3.14 or 22/7)

Finding missing sides:
- Rectangle with A = 48 and w = 6: l = 48 ÷ 6 = 8
- Triangle with A = 30 and b = 10: 30 = ½ × 10 × h → h = 6

COMPOSITE FIGURES
Break complex shapes into simple shapes, find each area, then add or subtract.

VOLUME & SURFACE AREA (Q.5)
Rectangular prism: V = lwh    SA = 2(lw + lh + wh)
Cylinder: V = πr²h    SA = 2πr² + 2πrh
Cone: V = ⅓πr²h
Pyramid: V = ⅓Bh (B = base area)
Sphere: V = (4/3)πr³    SA = 4πr²

PYTHAGOREAN THEOREM (Q.5.e)
For right triangles: a² + b² = c² (c is the hypotenuse)

Common Pythagorean triples: 3-4-5, 5-12-13, 8-15-17

Example: Find the hypotenuse if legs are 5 and 12:
5² + 12² = c² → 25 + 144 = 169 → c = 13

COORDINATE GEOMETRY (Q.6)
- Coordinate plane: x-axis (horizontal), y-axis (vertical)
- Distance formula: d = √[(x₂−x₁)² + (y₂−y₁)²]
- Midpoint formula: M = ((x₁+x₂)/2, (y₁+y₂)/2)
- Slope: m = (y₂−y₁)/(x₂−x₁)

ANGLES
- Complementary angles: sum = 90°
- Supplementary angles: sum = 180°
- Vertical angles: equal (formed by intersecting lines)
- Triangle angle sum: 180°
- Quadrilateral angle sum: 360°
- Parallel lines cut by transversal: alternate interior angles are equal; co-interior angles are supplementary`,
    practiceQuestions: [
      { question: 'Find the area of a trapezoid with bases 6 and 10, height 4', answer: 'A = ½(6 + 10) × 4 = ½ × 16 × 4 = 32 square units' },
      { question: 'A cylinder has radius 3 and height 7. Find its volume (use π ≈ 3.14)', answer: 'V = 3.14 × 9 × 7 = 197.82 cubic units' },
      { question: 'Find the distance between points (1, 2) and (4, 6)', answer: 'd = √[(4-1)² + (6-2)²] = √[9 + 16] = √25 = 5' },
      { question: 'A right triangle has legs 7 and 24. Find the hypotenuse.', answer: '7² + 24² = 49 + 576 = 625 → c = √625 = 25' },
      { question: 'Two angles are supplementary. One is 47°. What is the other?', answer: '180° - 47° = 133°' }
    ]
  },
  {
    number: 4,
    title: 'Data Analysis, Statistics & Probability',
    topics: ['Mean, Median, Mode, Range', 'Interpreting Graphs', 'Scatterplots', 'Probability', 'Counting'],
    content: `Chapter 4: Data Analysis, Statistics & Probability
[Assessment Targets: Q.7, Q.8 — Quantitative Problem Solving]

MEASURES OF CENTER & SPREAD (Q.7, Q.8)
Given dataset: 4, 7, 7, 9, 13

Mean (average): Sum ÷ Count = (4+7+7+9+13)/5 = 40/5 = 8
Median (middle): Order then find center → 7 (3rd value of 5)
Mode (most frequent): 7 (appears twice)
Range (spread): Max − Min = 13 − 4 = 9

When mean ≠ median: data may be skewed. Outliers pull the mean toward them.

INTERPRETING GRAPHS (Q.7)
Bar graphs: Compare categories. Read heights carefully; check axis scale.
Line graphs: Show change over time. Look for trends, peaks, dips.
Circle/pie charts: Show parts of a whole. Percentages should total 100%.
Histograms: Like bar graphs but show frequency distributions; bars touch.
Box plots: Show median, quartiles (Q1, Q3), and range in one diagram.

SCATTERPLOTS & CORRELATION (Q.7)
- Positive correlation: both variables increase together (upward trend)
- Negative correlation: one increases as other decreases (downward trend)
- No correlation: no clear pattern
- Line of best fit (trend line): summarizes the general direction of data
- Correlation ≠ causation

TWO-VARIABLE DATA
Identify independent variable (x-axis: the cause/input) and dependent variable (y-axis: the effect/output).
Predict values: extend the trend line, but do NOT extend beyond reasonable limits.

PROBABILITY (Q.8)
Probability = Favorable outcomes / Total possible outcomes
- P ranges from 0 (impossible) to 1 (certain)

Independent events: P(A and B) = P(A) × P(B)
Example: P(heads) × P(rolling 3) = ½ × 1/6 = 1/12

Complementary events: P(not A) = 1 − P(A)

COUNTING & PERMUTATIONS
- Counting principle: If one event has m outcomes and another has n, together they have m × n outcomes
- Example: 4 shirts and 3 pants = 4 × 3 = 12 outfits`,
    practiceQuestions: [
      { question: 'Find the mean, median, and mode of: 5, 8, 6, 8, 3', answer: 'Mean: 30/5 = 6. Median (ordered: 3,5,6,8,8): 6. Mode: 8' },
      { question: 'A bag has 5 red, 3 blue, 2 green marbles. What is P(red)?', answer: 'P(red) = 5/10 = 1/2 = 0.5' },
      { question: 'You flip a coin and roll a die. What is P(tails AND 4)?', answer: 'P = 1/2 × 1/6 = 1/12' },
      { question: 'A scatterplot shows as study hours increase, test scores increase. Describe the correlation.', answer: 'Positive correlation — both variables increase together' },
      { question: 'A menu has 3 soups, 5 entrees, 4 desserts. How many different 3-course meals?', answer: '3 × 5 × 4 = 60 different meals' }
    ]
  },
  {
    number: 5,
    title: 'Algebraic Expressions & Equations',
    topics: ['Expressions', 'Linear Equations', 'Inequalities', 'Systems of Equations', 'Quadratic Equations'],
    content: `Chapter 5: Algebraic Expressions & Equations
[Assessment Targets: A.1, A.2 — Algebraic Problem Solving]

ALGEBRAIC EXPRESSIONS (A.1)
An expression combines variables, numbers, and operations.
Like terms share the same variable and exponent: 3x and 7x are like terms.
Simplify by combining like terms: 4x + 2y − x + 5y = 3x + 7y

Factoring expressions (A.1.f):
- GCF factoring: 6x² + 9x = 3x(2x + 3)
- Difference of squares: a² − b² = (a+b)(a−b)
- Trinomial factoring: x² + 5x + 6 = (x+2)(x+3)

Adding/subtracting polynomials: combine like terms
Multiplying polynomials (A.1.e): use FOIL or distribution
(x + 3)(x − 2) = x² − 2x + 3x − 6 = x² + x − 6

LINEAR EQUATIONS (A.2)
Solve by isolating the variable:
  3x − 7 = 11 → 3x = 18 → x = 6

Multi-step: 2(x + 4) = 3x − 1 → 2x + 8 = 3x − 1 → x = 9

Equations with fractions: multiply both sides by the LCD to clear fractions.

INEQUALITIES (A.2.b)
Solve like equations, BUT flip the inequality sign when multiplying/dividing by a negative.
  −3x > 12 → x < −4  (sign flips!)

Represent on number line: open circle for < or >; closed circle for ≤ or ≥

SYSTEMS OF LINEAR EQUATIONS (A.2.c)
Two or more equations solved simultaneously.

Substitution method:
  y = 2x − 1 and 3x + y = 14
  Substitute: 3x + (2x−1) = 14 → 5x = 15 → x = 3, y = 5

Elimination method: add/subtract equations to cancel one variable.

QUADRATIC EQUATIONS (A.2.e)
Standard form: ax² + bx + c = 0
- Factor method: x² − 5x + 6 = 0 → (x−2)(x−3) = 0 → x = 2 or x = 3
- Quadratic formula: x = (−b ± √(b²−4ac)) / 2a
- Discriminant (b²−4ac): positive = 2 real solutions; zero = 1; negative = no real solution`,
    practiceQuestions: [
      { question: 'Simplify: 5x² + 3x − 2x² + 7 − x', answer: '3x² + 2x + 7' },
      { question: 'Solve: 4(x − 3) = 2x + 6', answer: '4x − 12 = 2x + 6 → 2x = 18 → x = 9' },
      { question: 'Solve and graph: −2x + 1 ≤ 7', answer: '−2x ≤ 6 → x ≥ −3 (flip sign; closed circle at −3, arrow right)' },
      { question: 'Solve the system: x + y = 10 and x − y = 4', answer: 'Add: 2x = 14 → x = 7, y = 3' },
      { question: 'Solve: x² − 7x + 10 = 0', answer: 'Factor: (x−5)(x−2) = 0 → x = 5 or x = 2' }
    ]
  },
  {
    number: 6,
    title: 'Functions, Graphs & Patterns',
    topics: ['Linear Functions', 'Slope-Intercept Form', 'Graphing', 'Nonlinear Functions', 'Function Notation'],
    content: `Chapter 6: Functions, Graphs & Patterns
[Assessment Targets: A.3, A.4, A.5 — Algebraic Problem Solving]

WHAT IS A FUNCTION? (A.4.a)
A function assigns exactly one output (y) to each input (x).
Vertical Line Test: if any vertical line crosses the graph more than once, it is NOT a function.

Function notation: f(x) = 3x − 2
- f(4) = 3(4) − 2 = 10

SLOPE & SLOPE-INTERCEPT FORM (A.3)
Slope (m) = rise / run = (y₂ − y₁) / (x₂ − x₁)
- Positive slope: line goes up left to right
- Negative slope: line goes down left to right
- Zero slope: horizontal line
- Undefined slope: vertical line

Slope-intercept form: y = mx + b
- m = slope   b = y-intercept (where line crosses y-axis)

Standard form: Ax + By = C (can convert to slope-intercept)

GRAPHING LINEAR EQUATIONS (A.3.b)
Method 1 — Plot y-intercept, then use slope to find more points.
Method 2 — Make a table of x-values and calculate y-values.

Parallel lines: same slope, different y-intercept
Perpendicular lines: slopes are negative reciprocals (if m = 2, perpendicular slope = −½)

QUADRATIC FUNCTIONS (A.4.b)
Standard form: f(x) = ax² + bx + c
Graph is a parabola:
- Opens UP if a > 0; opens DOWN if a < 0
- Vertex: highest or lowest point; x = −b/2a
- Axis of symmetry: vertical line through vertex
- x-intercepts: roots/zeros of the equation

INTERPRETING GRAPHS
- x-intercept: where graph crosses x-axis (output = 0)
- y-intercept: where graph crosses y-axis (input = 0)
- Increasing/decreasing intervals: where graph goes up vs. down
- Maximum/minimum values: peaks and valleys

PATTERNS & SEQUENCES
Arithmetic sequence: each term adds the same amount (common difference)
  5, 8, 11, 14... (d = 3)   nth term: aₙ = a₁ + (n−1)d

Geometric sequence: each term multiplies by the same ratio
  3, 6, 12, 24... (r = 2)`,
    practiceQuestions: [
      { question: 'Find the slope of the line through (2, 5) and (6, 13)', answer: 'm = (13−5)/(6−2) = 8/4 = 2' },
      { question: 'Write y = 3x − 4 in function notation and find f(−1)', answer: 'f(x) = 3x − 4; f(−1) = 3(−1) − 4 = −7' },
      { question: 'For f(x) = x² − 6x + 5, find the vertex x-coordinate', answer: 'x = −(−6)/2(1) = 6/2 = 3' },
      { question: 'Is the graph of a circle a function? Why or why not?', answer: 'No — a vertical line intersects the circle at two points, failing the vertical line test.' },
      { question: 'Find the 8th term of the arithmetic sequence: 2, 5, 8, 11…', answer: 'd = 3; a₈ = 2 + (8−1)×3 = 2 + 21 = 23' }
    ]
  }
];

// ─────────────────────────────────────────────────────────────
// REASONING THROUGH LANGUAGE ARTS (RLA)
// Test: 75% informational texts, 25% literary texts
// Skills: Close reading, Clear writing, Language conventions
// ─────────────────────────────────────────────────────────────
const LANGUAGE_ARTS_CHAPTERS: GEDChapter[] = [
  {
    number: 1,
    title: 'Reading Comprehension: Central Ideas & Details',
    topics: ['Main Idea', 'Summarizing', 'Supporting Details', 'Inference', 'Generalizations'],
    content: `Chapter 1: Reading Comprehension — Central Ideas & Details
[Assessment Targets: R.2.1–R.2.8 — Reading]

DETERMINING CENTRAL IDEAS (R.2.1–R.2.2)
The central idea (main idea) is the most important point the author makes.
It is NOT just the topic — it is what the author says ABOUT the topic.

Steps to find it:
1. Read the full passage
2. Ask: "What is the author's main point about this subject?"
3. Check if a thesis statement appears in the introduction or conclusion
4. Summarize the text in one sentence — that is usually the main idea

Summarizing (R.2.2): A good summary is brief, in your own words, and covers key points without minor details.

SUPPORTING DETAILS (R.2.5)
Supporting details back up the main idea with:
- Facts and statistics
- Examples and anecdotes
- Expert quotes or testimony
- Cause-and-effect explanations

Ask: "Does this detail directly support the main idea, or is it off-topic?"

MAKING INFERENCES (R.2.3–R.2.4)
An inference is a logical conclusion drawn from evidence in the text.
The text does NOT state it directly — you must "read between the lines."

Steps:
1. Find clues in the text (word choice, details, examples)
2. Think about what those clues suggest
3. Ask: "What must be true based on this evidence?"
4. Check that your inference is supported — not just possible, but likely

Implied main ideas (R.2.4): Sometimes the main idea is never stated outright. Piece together all the details and ask what they collectively suggest.

EVIDENCE-BASED GENERALIZATIONS (R.2.7–R.2.8)
A generalization applies a pattern found in the text to broader situations.
Strong generalizations are:
- Based on multiple pieces of evidence
- Stated without overgeneralizing ("all," "never," "always" are warning signs)
- Tested against the text to confirm they hold up

GED TIP: On the test, wrong answer choices often contradict the text, go too far beyond it, or are only partially supported. Always return to the text.`,
    practiceQuestions: [
      { question: 'What is the difference between a main idea and a topic?', answer: 'The topic is the subject (e.g., "climate change"). The main idea is what the author says about it (e.g., "Human activity is the primary driver of climate change").' },
      { question: 'A paragraph describes rising ocean temperatures, dying coral reefs, and melting ice caps. What is the implied main idea?', answer: 'The implied main idea is that climate change is causing widespread environmental damage.' },
      { question: 'Which type of detail is LEAST likely to support a scientific main idea?', answer: 'A personal opinion or anecdote without data is least likely to provide strong support.' }
    ]
  },
  {
    number: 2,
    title: 'Reading Comprehension: Vocabulary, Structure & Author\'s Purpose',
    topics: ['Context Clues', 'Connotation', 'Text Structure', 'Author\'s Purpose & Point of View', 'Rhetorical Techniques'],
    content: `Chapter 2: Vocabulary, Text Structure & Author's Purpose
[Assessment Targets: R.4, R.5, R.6 — Reading]

VOCABULARY IN CONTEXT (R.4.1–R.4.3)
Words often have multiple meanings depending on context.
Types of context clues:
- Definition: "Photosynthesis, the process by which plants make food…"
- Synonym: "The arid, or dry, desert…"
- Antonym: "Unlike her gregarious brother, she was shy"
- Example: "Citrus fruits, such as oranges and lemons, contain vitamin C"

Connotation vs. denotation:
- Denotation = literal dictionary meaning
- Connotation = emotional or implied meaning
  "Cheap" vs. "affordable" vs. "economical" — all mean low-cost, but feel different

Tone: The author's attitude toward the subject (formal, sarcastic, urgent, hopeful)
Mood: The feeling the text creates in the reader

TEXT STRUCTURE (R.5.1–R.5.4)
Common patterns:
- Chronological/sequence: events in time order ("first," "then," "finally")
- Compare/contrast: similarities and differences ("however," "in contrast," "similarly")
- Cause/effect: what happened and why ("because," "as a result," "therefore")
- Problem/solution: identifies an issue and a fix
- Description/definition: explains a term or concept

Signal words reveal structure. "Nevertheless" signals contrast. "Consequently" signals effect.

AUTHOR'S PURPOSE & POINT OF VIEW (R.6.1–R.6.4)
Purpose: Why did the author write this?
- Inform: presents facts objectively
- Persuade: argues a position
- Entertain: tells a story or creates an experience
- Explain: teaches how or why

Point of view (R.6.1): First person (I/we) vs. third person (he/she/they)
Author's position vs. others (R.6.2): How does the author address opposing viewpoints? Do they acknowledge counterarguments?

Rhetorical techniques (R.6.4):
- Analogies: compare unfamiliar ideas to familiar ones
- Repetition/parallelism: emphasize key points through repeated structure
- Juxtaposition: place contrasting ideas side by side for effect
- Qualifying statements: phrases like "in most cases" that limit a claim

GED NOTE: Founding documents (Declaration of Independence, Constitution, Bill of Rights) and "Great American Conversation" texts are required reading for the RLA test.`,
    practiceQuestions: [
      { question: 'The word "ephemeral" appears in: "The beauty of cherry blossoms is ephemeral; they last only a week." What does ephemeral mean?', answer: 'Short-lived or temporary, based on the context clue "they last only a week"' },
      { question: 'An essay uses the structure: "While some argue X, the evidence shows Y because Z." What rhetorical technique is this?', answer: 'Acknowledging a counterargument (R.6.2) then refuting it with evidence' },
      { question: 'What is the difference between an author\'s purpose and an author\'s point of view?', answer: 'Purpose is WHY they wrote it (inform, persuade, entertain). Point of view is WHOSE perspective they write from and what position they hold.' }
    ]
  },
  {
    number: 3,
    title: 'Reading: Analyzing Arguments & Evidence',
    topics: ['Claims & Evidence', 'Evaluating Arguments', 'Logical Fallacies', 'Synthesizing Multiple Sources'],
    content: `Chapter 3: Analyzing Arguments & Evidence
[Assessment Targets: R.8, R.9 — Reading]

STRUCTURE OF AN ARGUMENT (R.8.1)
A well-structured argument contains:
1. Claim: the main position the author is arguing
2. Evidence: facts, data, examples, expert quotes that support the claim
3. Reasoning: explanation of how the evidence supports the claim
4. Counterargument: acknowledgment of the opposing view
5. Rebuttal: why the counterargument is weak or wrong

EVALUATING EVIDENCE (R.8.2–R.8.4)
Ask yourself:
- Is the evidence relevant? Does it directly support the claim?
- Is the evidence sufficient? Is there enough of it?
- Is the source credible? Is the author an expert? Is the data recent?
- Is the reasoning valid? Does the evidence logically lead to the conclusion?

Claims supported by evidence vs. unsupported claims:
- Supported: "Studies show that students who sleep 8+ hours score 20% higher on tests."
- Unsupported: "Everyone knows that sleep is good for you."

LOGICAL FALLACIES (R.8.5)
A fallacy is flawed reasoning. Common types:
- Ad hominem: attacking the person instead of the argument
- Straw man: misrepresenting the opponent's position
- False dichotomy: presenting only two options when more exist
- Slippery slope: claiming one event will inevitably cause extreme outcomes
- Hasty generalization: drawing broad conclusions from limited examples
- Appeal to authority: citing an unqualified "expert"

UNDERLYING PREMISES & ASSUMPTIONS (R.8.6)
An argument rests on unstated assumptions.
Example: "Buy this phone — it's what smart people use." 
Assumption: That smart people choose this phone, and that you want to be like smart people.
Identifying assumptions helps you evaluate the argument's foundation.

SYNTHESIZING MULTIPLE TEXTS (R.9)
When comparing two sources on the same topic:
- Identify agreements and disagreements
- Evaluate which source provides stronger evidence
- Note differences in purpose, audience, or point of view
- Look for contradictions in the data or claims

GED Extended Response: You will read two texts and write an argument explaining which one presents the stronger case. Use evidence from BOTH texts.`,
    practiceQuestions: [
      { question: 'An author writes: "We must ban all video games or our children will become violent criminals." What fallacy is this?', answer: 'Slippery slope — the argument leaps from one cause to an extreme, unlikely outcome without sufficient evidence' },
      { question: 'What makes a claim "supported" vs. "unsupported"?', answer: 'A supported claim has specific, relevant evidence (data, examples, expert testimony). An unsupported claim relies on vague assertions, personal opinions, or common assumptions.' },
      { question: 'Two articles discuss climate policy. Article 1 cites IPCC data; Article 2 cites a single industry spokesperson. Which is more credible?', answer: 'Article 1 — the IPCC is a widely recognized scientific authority with peer-reviewed data; a single spokesperson may have conflicts of interest.' }
    ]
  },
  {
    number: 4,
    title: 'Extended Response: Argument Writing',
    topics: ['Thesis Statement', 'Evidence-Based Argument', 'Organization', 'Paragraph Development', 'Rubric Scoring'],
    content: `Chapter 4: Extended Response — Argument Writing
[GED RLA Extended Response — 45 minutes, scored 0–12 across 3 traits]

THE EXTENDED RESPONSE (ER) TASK
You will read two passages on a controversial topic and write an extended response (multi-paragraph essay) arguing which position is better supported by evidence.

You are NOT asked for your personal opinion — you are asked to analyze the quality of the arguments.

SCORING RUBRIC — 3 TRAITS:
Trait 1 — Creation of Arguments and Use of Evidence (0–3 pts)
  - Does your argument analyze BOTH sources?
  - Do you cite specific evidence from the texts?
  - Do you address the opposing view?
  - Is your argument logically sound?

Trait 2 — Development of Ideas and Organizational Structure (0–2 pts)
  - Is your essay clearly organized with introduction, body, conclusion?
  - Do your ideas flow logically from one to the next?
  - Do you use transitions?

Trait 3 — Clarity and Command of Standard English Conventions (0–2 pts)
  - Is your grammar, punctuation, and spelling accurate?
  - Do you write clearly and vary your sentence structure?

ESSAY STRUCTURE
Paragraph 1 — Introduction:
  - Brief summary of the debate
  - Clear thesis: "Text A presents the stronger argument because [2–3 reasons]"

Paragraphs 2–3 — Body (Evidence from Texts):
  - One body paragraph per main piece of evidence
  - Quote or paraphrase from the texts
  - Explain HOW the evidence supports your thesis

Paragraph 4 — Counterargument + Rebuttal:
  - Acknowledge the strongest point in the opposing text
  - Explain why it is still weaker or less convincing

Paragraph 5 — Conclusion:
  - Restate your thesis in new words
  - Summarize your key points

THESIS STATEMENT
A thesis makes a claim, not just a topic statement.
Weak: "Both texts discuss climate change."
Strong: "While both authors address climate change, Text A presents a more compelling argument because it uses peer-reviewed data and acknowledges scientific consensus, whereas Text B relies on anecdote and emotional appeals."

TIPS FOR THE GED ER:
- Use formal language; avoid contractions and slang
- Cite the texts by name (Text A, Text B, or by title)
- Do NOT simply summarize — ANALYZE the arguments
- Leave time to proofread for run-ons, fragments, and agreement errors`,
    practiceQuestions: [
      { question: 'What is the main goal of the GED Extended Response?', answer: 'To analyze which of two provided texts presents a stronger, better-supported argument — using evidence from both texts.' },
      { question: 'Write a thesis statement for an ER where Text A argues for higher minimum wage and Text B argues against it', answer: 'Example: "Text A presents the more compelling argument for raising the minimum wage because it cites peer-reviewed economic research and addresses counterarguments effectively, while Text B relies on anecdotal claims without sufficient data."' },
      { question: 'What are the three scoring traits and their point values?', answer: 'Trait 1: Arguments & Evidence (0–3); Trait 2: Organization & Development (0–2); Trait 3: Language Conventions (0–2). Maximum = 12 points' }
    ]
  },
  {
    number: 5,
    title: 'Language Conventions & Grammar',
    topics: ['Subject-Verb Agreement', 'Pronoun Usage', 'Verb Tense', 'Sentence Structure', 'Punctuation'],
    content: `Chapter 5: Language Conventions & Grammar
[Assessment Targets: Language domain — L.1, L.2, L.3; Drop-down editing items]

SUBJECT-VERB AGREEMENT (L.1)
Singular subjects → singular verbs. Plural subjects → plural verbs.
  The dog runs.  /  The dogs run.

Tricky cases:
- "Each," "every," "either," "neither," "anyone," "everyone" = SINGULAR
  "Each of the students HAS a book" (not "have")
- Collective nouns (team, group, family) = usually singular
  "The team IS playing well"
- Subjects joined by "or"/"nor" = verb agrees with the CLOSER subject
  "Neither the teachers nor the principal WAS there"
- Phrases between subject and verb do NOT affect agreement
  "The box of chocolates IS on the table"

PRONOUN AGREEMENT & REFERENCE (L.1)
Pronouns must agree with their antecedents (the nouns they replace).
  "Each student should bring THEIR textbook." (singular they — acceptable modern usage)
  "Maria said SHE would come." (she refers to Maria)

Pronoun case:
- Subject pronouns: I, he, she, we, they, who
- Object pronouns: me, him, her, us, them, whom
  "She and I went to the store." (not "Me and her")

VERB TENSES (L.1)
Consistent tense throughout a passage unless there is a logical time shift.
- Simple: I walk / I walked / I will walk
- Progressive: I am walking / I was walking / I will be walking
- Perfect: I have walked / I had walked / I will have walked

SENTENCE STRUCTURE (L.3)
Run-on sentences: Two independent clauses joined without proper punctuation.
  WRONG: "It was raining we stayed inside."
  FIX: "It was raining, so we stayed inside." OR "It was raining; we stayed inside."

Sentence fragments: Missing a subject or verb, or a dependent clause standing alone.
  WRONG: "Because she was tired."
  FIX: "She went home early because she was tired."

Parallel structure: Items in a list must use the same grammatical form.
  WRONG: "She likes running, to swim, and she dances."
  CORRECT: "She likes running, swimming, and dancing."

COMMA USAGE (L.2)
- Before a coordinating conjunction joining two independent clauses: FANBOYS (for, and, nor, but, or, yet, so)
- After introductory phrases: "After the rain, the streets were wet."
- Around non-essential clauses: "My brother, who lives in Texas, called me."
- In a series: "apples, oranges, and bananas"

SEMICOLONS & COLONS
- Semicolons join two closely related independent clauses: "I love coffee; she prefers tea."
- Colons introduce a list or elaboration: "She brought three things: a map, a compass, and food."

APOSTROPHES
- Possession: the dog's bone (singular); the dogs' bones (plural)
- Contractions: it's = it is; they're = they are; you're = you are
  NOTE: its = possessive pronoun (no apostrophe)`,
    practiceQuestions: [
      { question: 'Correct this sentence: "Each of the managers have submitted their report."', answer: '"Each of the managers has submitted their report." — Each is singular, so the verb should be "has"' },
      { question: 'Identify the error: "Running to the store, the rain soaked my jacket."', answer: 'Dangling modifier — the phrase "Running to the store" should modify a person, but "the rain" cannot run. Fix: "Running to the store, I got soaked by the rain."' },
      { question: 'Fix the parallel structure: "The coach told us to stretch, hydrate, and we should rest."', answer: '"The coach told us to stretch, hydrate, and rest." — All items should use the infinitive form.' },
      { question: 'Choose: "Between you and (I/me), the answer is obvious."', answer: '"Between you and me" — "me" is the object of the preposition "between"' }
    ]
  }
];

// ─────────────────────────────────────────────────────────────
// SCIENCE
// Test: 40% Life Science, 40% Physical Science, 20% Earth & Space
// Each item aligns with one Science Practice (SP) + one Content Topic
// ─────────────────────────────────────────────────────────────
const SCIENCE_CHAPTERS: GEDChapter[] = [
  {
    number: 1,
    title: 'Life Science: Human Body & Health',
    topics: ['Body Systems', 'Homeostasis', 'Nutrition & Disease', 'Cells & Organization'],
    content: `Chapter 1: Life Science — Human Body & Health
[Assessment Targets: L.a — Human Health and Living Systems]

LEVELS OF ORGANIZATION
Cell → Tissue → Organ → Organ System → Organism

Prokaryotic cells (bacteria): no membrane-bound nucleus
Eukaryotic cells (plants, animals, fungi): have a nucleus and organelles

Key organelles:
- Nucleus: DNA storage; controls cell activities
- Mitochondria: produces ATP (energy) through cellular respiration
- Ribosome: synthesizes proteins
- Cell membrane: controls what enters and exits
- Endoplasmic reticulum: transports materials within cell
- Chloroplasts (plants only): site of photosynthesis

HUMAN BODY SYSTEMS
Circulatory: Heart pumps blood; arteries carry blood away; veins return it.
  - Oxygen-rich blood: left side of heart → body
  - Oxygen-poor blood: right side of heart → lungs
Respiratory: Gas exchange occurs in alveoli of lungs (O₂ in, CO₂ out)
Digestive: Breaks food into nutrients; stomach (acid digestion), small intestine (nutrient absorption), large intestine (water absorption)
Nervous: Brain (central processing), spinal cord (relay), neurons (signal transmission)
Endocrine: Glands release hormones (chemical signals) — e.g., insulin regulates blood sugar
Immune: Defends against pathogens; white blood cells, antibodies
Skeletal/Muscular: Support, protection, movement

HOMEOSTASIS
Homeostasis = the body's ability to maintain stable internal conditions (temperature, blood sugar, pH).
Feedback loops:
- Negative feedback: corrects a deviation (e.g., sweating when too hot — brings temp back to normal)
- Positive feedback: amplifies a signal (e.g., contractions during childbirth intensify until baby is born)

DISEASE & HEALTH
Infectious diseases: caused by pathogens (bacteria, viruses, fungi, parasites)
  - Bacteria: treated with antibiotics (antibiotics do NOT work on viruses)
  - Viruses: treated with antivirals; vaccines provide immunity
Chronic diseases: heart disease, diabetes, cancer — often linked to lifestyle factors

SCIENCE PRACTICE CONNECTION (SP.1)
On the GED Science test, you will interpret diagrams, graphs, and texts about body systems. You will identify central ideas, determine meanings of scientific terms in context, and read data representations like labeled diagrams and process charts.`,
    practiceQuestions: [
      { question: 'What is the function of mitochondria?', answer: 'Mitochondria produce ATP (energy) through cellular respiration — they are often called "the powerhouse of the cell"' },
      { question: 'Why do antibiotics not work against viral infections?', answer: 'Antibiotics target bacterial cell structures (like cell walls). Viruses have completely different structures and reproduce inside host cells, which antibiotics cannot affect.' },
      { question: 'What is an example of negative feedback in the human body?', answer: 'When blood sugar rises after eating, the pancreas releases insulin, which lowers blood sugar back to normal — this is negative feedback because the response counteracts the change.' },
      { question: 'Arrange from smallest to largest: organ system, cell, tissue, organism, organ', answer: 'Cell → Tissue → Organ → Organ System → Organism' }
    ]
  },
  {
    number: 2,
    title: 'Life Science: Heredity, Evolution & Ecosystems',
    topics: ['DNA & Genetics', 'Punnett Squares', 'Natural Selection', 'Ecosystems & Energy Flow'],
    content: `Chapter 2: Life Science — Heredity, Evolution & Ecosystems
[Assessment Targets: L.b–L.f — Molecular Basis for Heredity, Evolution, Ecosystems]

DNA & THE MOLECULAR BASIS OF HEREDITY (L.e)
DNA = deoxyribonucleic acid — the molecule that carries genetic information
- Double helix structure; base pairs: Adenine-Thymine (A-T), Guanine-Cytosine (G-C)
- Gene: a segment of DNA that codes for a protein/trait
- Chromosome: tightly coiled DNA; humans have 46 (23 pairs)

Protein synthesis:
1. Transcription: DNA → mRNA (in nucleus)
2. Translation: mRNA → protein (at ribosomes)

DOMINANT & RECESSIVE TRAITS
- Allele: a version of a gene (one from each parent)
- Dominant (B): expressed when at least one copy is present
- Recessive (b): only expressed when two copies are present (bb)
- Genotype: genetic makeup (BB, Bb, bb)
- Phenotype: physical expression (Brown eyes, blue eyes)

PUNNETT SQUARES (SP.8.c)
Cross Bb × Bb:
       B     b
  B   BB    Bb
  b   Bb    bb
Ratio: 3 brown : 1 blue (75% dominant phenotype)

EVOLUTION & NATURAL SELECTION (L.f)
Darwin's Natural Selection:
1. Variation: individuals differ in traits
2. Heredity: traits are passed to offspring
3. Differential survival: individuals with beneficial traits survive and reproduce more
4. Adaptation: over time, beneficial traits become more common

Evidence for evolution: fossil record, comparative anatomy (homologous structures), DNA similarities, direct observation

Speciation: when populations become reproductively isolated and diverge into new species
Common ancestry: cladograms show evolutionary relationships

ECOSYSTEMS & ENERGY FLOW (L.b, L.c)
Producers (plants) → Primary consumers (herbivores) → Secondary consumers → Tertiary consumers → Decomposers

Energy pyramid: Only ~10% of energy transfers between trophic levels (90% lost as heat)
Photosynthesis: CO₂ + H₂O + light → glucose + O₂
Cellular respiration: glucose + O₂ → CO₂ + H₂O + ATP (energy)

Cycles of matter: Carbon cycle, nitrogen cycle, water cycle — matter is recycled; energy is not.

POPULATION DYNAMICS
Carrying capacity: maximum population an environment can sustain
Limiting factors: food, water, space, predators
Competition: intraspecific (same species) and interspecific (different species)`,
    practiceQuestions: [
      { question: 'A pea plant with genotype Tt (T = tall, t = short, T dominant) is crossed with tt. What are the offspring genotypes and phenotypes?', answer: 'Cross Tt × tt: offspring = Tt, Tt, tt, tt. Phenotypes: 50% tall (Tt), 50% short (tt)' },
      { question: 'Why does only 10% of energy transfer from one trophic level to the next?', answer: '90% of energy is lost as heat through metabolic processes (respiration, movement, body heat). Only the stored chemical energy in biomass transfers upward.' },
      { question: 'What is the relationship between photosynthesis and cellular respiration?', answer: 'They are essentially reverse reactions. Photosynthesis uses CO₂ + H₂O + sunlight to produce glucose + O₂. Cellular respiration breaks down glucose + O₂ to release CO₂ + H₂O + ATP energy.' },
      { question: 'What is speciation, and what causes it?', answer: 'Speciation is the formation of a new species from an existing one, usually caused by geographic or reproductive isolation — preventing gene flow between populations, which then evolve separately.' }
    ]
  },
  {
    number: 3,
    title: 'Physical Science: Energy, Work & Forces',
    topics: ['Conservation of Energy', 'Heat Transfer', 'Newton\'s Laws', 'Work & Simple Machines', 'Waves'],
    content: `Chapter 3: Physical Science — Energy, Work & Forces
[Assessment Targets: P.a, P.b — Conservation, Transformation & Flow of Energy; Work, Motion, Forces]

CONSERVATION OF ENERGY (P.a)
Energy cannot be created or destroyed — only converted from one form to another.
Forms of energy:
- Kinetic: energy of motion (KE = ½mv²)
- Potential: stored energy (gravitational PE = mgh)
- Chemical: stored in molecular bonds
- Thermal: heat energy (related to particle motion)
- Electrical, radiant (light), nuclear

Energy transformations:
- Light bulb: electrical → light + thermal
- Burning wood: chemical → thermal + light
- Photosynthesis: light → chemical (glucose)

HEAT TRANSFER (P.a.1)
- Conduction: heat transfer through direct contact (metal rod in fire)
- Convection: heat transfer through fluid movement (boiling water, warm air rising)
- Radiation: heat transfer through electromagnetic waves (sun warming Earth)

Endothermic reactions: absorb energy (e.g., melting ice, photosynthesis)
Exothermic reactions: release energy (e.g., burning, combustion, respiration)

WAVES (P.a.5)
Wavelength: distance between two peaks
Frequency: number of waves per second (Hz)
Amplitude: height of a wave (relates to energy/intensity)
Wave speed = frequency × wavelength

Types of waves:
- Transverse: vibration perpendicular to direction (light, all EM waves)
- Longitudinal: vibration parallel to direction (sound)

Electromagnetic spectrum (lowest to highest frequency):
Radio → Microwave → Infrared → Visible → UV → X-ray → Gamma

MOTION & FORCES (P.b)
Speed = distance / time
Velocity = speed + direction (vector quantity)
Acceleration = change in velocity / time (a = Δv/t)

Newton's Three Laws:
1. Law of Inertia: Objects at rest stay at rest; objects in motion stay in motion — unless acted on by a net force
2. F = ma: Force (N) = mass (kg) × acceleration (m/s²)
3. Action-Reaction: For every force, there is an equal and opposite force

Momentum = mass × velocity (p = mv)
Conservation of momentum: total momentum before = total momentum after collision

WORK & SIMPLE MACHINES (P.b.3)
Work (J) = Force (N) × distance (m) — work is only done if the object moves!
Power (W) = Work / time

Simple machines reduce the force needed:
- Lever: fulcrum, effort arm, resistance arm
- Inclined plane (ramp): spreads force over longer distance
- Pulley: changes direction of force
- Wheel and axle: mechanical advantage through radius ratio
Mechanical advantage = load force / effort force`,
    practiceQuestions: [
      { question: 'A 500 kg car accelerates at 3 m/s². What force is applied?', answer: 'F = ma = 500 × 3 = 1,500 N' },
      { question: 'You push a box 5 meters with a force of 80 N. How much work did you do?', answer: 'W = F × d = 80 × 5 = 400 joules' },
      { question: 'A wave has frequency 200 Hz and wavelength 1.5 m. What is its speed?', answer: 'Speed = frequency × wavelength = 200 × 1.5 = 300 m/s' },
      { question: 'Classify: ice melting, campfire, photosynthesis. Endothermic or exothermic?', answer: 'Ice melting: endothermic (absorbs heat). Campfire: exothermic (releases heat). Photosynthesis: endothermic (absorbs light energy).' }
    ]
  },
  {
    number: 4,
    title: 'Physical Science: Matter & Chemical Reactions',
    topics: ['Structure of Matter', 'States of Matter', 'Chemical vs. Physical Changes', 'Balancing Equations', 'Solutions'],
    content: `Chapter 4: Physical Science — Matter & Chemical Reactions
[Assessment Targets: P.c — Chemical Properties and Reactions Related to Living Systems]

STRUCTURE OF MATTER (P.c.1)
Atom: smallest unit of an element
- Protons (+): determine element identity (atomic number)
- Neutrons (0): in nucleus; affect atomic mass
- Electrons (−): orbit nucleus; involved in bonding

Periodic Table: elements organized by atomic number and properties
- Metals (left/center): good conductors, malleable
- Nonmetals (right): poor conductors, varied states
- Metalloids (staircase): intermediate properties

PHYSICAL VS. CHEMICAL PROPERTIES & CHANGES (P.c.2)
Physical properties: observed without changing composition (color, density, melting point, boiling point)
Physical change: changes form but not chemical identity (cutting, melting, dissolving)

Chemical properties: how a substance reacts with other substances (flammability, reactivity)
Chemical change (reaction): produces new substance(s) with different properties
  Signs: color change, gas production, temperature change, precipitate formation

STATES OF MATTER & CHANGES OF STATE
Solid → Liquid: melting (endothermic)
Liquid → Gas: vaporization/evaporation (endothermic)
Gas → Liquid: condensation (exothermic)
Liquid → Solid: freezing (exothermic)
Solid → Gas: sublimation (dry ice)

BALANCING CHEMICAL EQUATIONS (P.c.3)
Law of Conservation of Mass: atoms are not created or destroyed — both sides of equation must be equal.
Unbalanced: H₂ + O₂ → H₂O
Balanced: 2H₂ + O₂ → 2H₂O
(Count: left = 4H + 2O; right = 4H + 2O ✓)

Types of reactions:
- Synthesis: A + B → AB
- Decomposition: AB → A + B
- Combustion: fuel + O₂ → CO₂ + H₂O

SOLUTIONS (P.c.4)
Solution: homogeneous mixture of solute (dissolved) + solvent (dissolving medium)
- Solubility: maximum amount of solute that dissolves in a given amount of solvent
- Increasing temperature: increases solubility of most solids; decreases gas solubility
- Saturated solution: holds maximum solute; supersaturated: holds more than normally possible
- Concentration: amount of solute per unit volume (strong vs. weak solutions)

Acids and bases:
- Acids: pH < 7; donate H⁺ ions; taste sour
- Bases: pH > 7; accept H⁺ ions; feel slippery
- Neutral: pH = 7 (water)`,
    practiceQuestions: [
      { question: 'Balance this equation: _Fe + _O₂ → _Fe₂O₃', answer: '4Fe + 3O₂ → 2Fe₂O₃ (check: 4 Fe each side, 6 O each side)' },
      { question: 'Is dissolving salt in water a physical or chemical change? Why?', answer: 'Physical change — the salt can be recovered by evaporating the water. No new chemical substance is formed; the ions just separate in solution.' },
      { question: 'Why does soda go flat faster when warm?', answer: 'Gas (CO₂) solubility decreases as temperature increases. Warm soda cannot hold as much dissolved CO₂, so the gas escapes more quickly.' },
      { question: 'An unknown liquid has pH 2. Is it an acid or base? What does that mean?', answer: 'pH 2 is strongly acidic. It donates H⁺ ions in solution, has a sour taste, and will react with bases and many metals.' }
    ]
  },
  {
    number: 5,
    title: 'Earth & Space Science',
    topics: ['Earth\'s Systems', 'Climate & Atmosphere', 'Natural Hazards', 'Space & the Cosmos'],
    content: `Chapter 5: Earth & Space Science
[Assessment Targets: ES.a, ES.b, ES.c — Earth's Systems, Space]

EARTH'S SYSTEMS (ES.a, ES.b)
Earth's four major spheres:
- Geosphere: solid Earth (rocks, soil, crust, mantle, core)
- Hydrosphere: all water (oceans, rivers, ice, groundwater)
- Atmosphere: layers of gas surrounding Earth (nitrogen 78%, oxygen 21%)
- Biosphere: all living things

Rock cycle: Igneous (cooled magma) → erosion/deposition → Sedimentary → heat/pressure → Metamorphic → melting → Igneous again

Plate tectonics:
- Earth's crust is divided into tectonic plates that move slowly
- Convergent: plates collide → mountains, subduction, volcanoes, earthquakes
- Divergent: plates separate → mid-ocean ridges, rift valleys
- Transform: plates slide past each other → earthquakes (San Andreas Fault)

ATMOSPHERE & CLIMATE (ES.b.1)
Layers: Troposphere (weather), Stratosphere (ozone), Mesosphere, Thermosphere, Exosphere
- Greenhouse effect: CO₂, methane, and water vapor trap heat
- Climate change: rising CO₂ from fossil fuels intensifies greenhouse effect → warming, rising seas, extreme weather

Weather vs. Climate:
- Weather: day-to-day atmospheric conditions (temperature, precipitation, wind)
- Climate: long-term average weather patterns for a region

NATURAL HAZARDS (ES.a.2)
Earthquakes: caused by tectonic plate movement; measured on Richter scale
Tsunamis: ocean waves triggered by underwater earthquakes
Hurricanes/Typhoons: tropical storms with rotating winds; powered by warm ocean water
Tornadoes: violent rotating air columns from severe thunderstorms
Volcanoes: magma erupts at weak points in crust; create new land and hazardous ash/lava

Mitigation: building codes, early warning systems, evacuation plans, levees

NATURAL RESOURCES (ES.a.3)
Renewable resources: replenished naturally (solar, wind, water, biomass)
Non-renewable resources: formed over millions of years; finite supply (coal, oil, natural gas, uranium)
Sustainability: using resources in ways that don't deplete them for future generations

EARTH'S OCEANS (ES.b.2)
Cover 71% of Earth's surface; regulate climate through heat absorption
Ocean currents: driven by wind, temperature, and salinity differences
Coral reefs: biodiversity hotspots; highly sensitive to temperature and pH changes

STRUCTURE OF THE COSMOS (ES.c)
Solar system: Sun → Mercury, Venus, Earth, Mars (terrestrial) → Jupiter, Saturn, Uranus, Neptune (gas giants)
Stars: powered by nuclear fusion (hydrogen → helium); life cycle depends on mass
Galaxies: the Milky Way is a spiral galaxy containing ~200–400 billion stars
Big Bang: current scientific model for the origin of the universe (~13.8 billion years ago)`,
    practiceQuestions: [
      { question: 'What causes earthquakes at transform plate boundaries?', answer: 'At transform boundaries, plates slide horizontally past each other. Friction builds up and is suddenly released as seismic energy — causing earthquakes. Example: San Andreas Fault in California.' },
      { question: 'Explain the greenhouse effect in simple terms.', answer: 'Sunlight passes through the atmosphere and heats Earth\'s surface. The surface releases heat (infrared radiation), but greenhouse gases (CO₂, methane) absorb and trap this heat, keeping Earth warmer than it would be otherwise.' },
      { question: 'What is the difference between renewable and non-renewable energy?', answer: 'Renewable energy sources (solar, wind, hydro) naturally replenish on human timescales. Non-renewable sources (coal, oil, natural gas) took millions of years to form and will be depleted when used.' },
      { question: 'Why do temperatures generally decrease as altitude increases in the troposphere?', answer: 'The troposphere is heated mainly from below (Earth\'s surface absorbs sunlight and radiates heat). As distance from the heat source increases, temperatures drop — about 6.5°C per 1,000 meters.' }
    ]
  },
  {
    number: 6,
    title: 'Science Practices: Reasoning & Investigation',
    topics: ['Scientific Method', 'Hypothesis & Variables', 'Interpreting Data', 'Evaluating Evidence', 'Probability & Statistics'],
    content: `Chapter 6: Science Practices — Reasoning & Investigation
[Assessment Targets: SP.1–SP.8 — Science Practices applied across all content areas]

THE SCIENTIFIC METHOD (SP.2.d)
1. Observation: notice a phenomenon
2. Question: formulate a testable question
3. Hypothesis: propose an explanation (If… then… because…)
4. Experiment: test the hypothesis with controlled variables
5. Data collection & analysis: record and examine results
6. Conclusion: support or reject hypothesis; report findings

VARIABLES (SP.2.e)
- Independent variable: what the scientist deliberately changes (x-axis)
- Dependent variable: what is measured; responds to the independent variable (y-axis)
- Controlled variables: everything kept the same to ensure a fair test

Example: Testing how light intensity affects plant growth.
- Independent: light intensity (low, medium, high)
- Dependent: plant height after 2 weeks
- Controlled: water amount, soil type, pot size, temperature

DESIGNING & EVALUATING EXPERIMENTS (SP.2.a–SP.2.c)
Good experimental design:
- Clear hypothesis
- One independent variable
- Large enough sample size
- Control group (no treatment, for comparison)
- Replication (repeated trials)

Sources of error:
- Measurement error: imprecise instruments
- Sampling bias: non-representative sample
- Confounding variables: uncontrolled factors that affect results

INTERPRETING DATA & GRAPHS (SP.1.c, SP.3)
- Identify trends in graphs (increasing, decreasing, no trend)
- Distinguish between correlation and causation
- Make predictions by extending patterns (but not beyond reasonable limits)
- Identify outliers (data points that don't fit the trend)

EVALUATING CONCLUSIONS WITH EVIDENCE (SP.4)
Does the evidence support the conclusion?
- Ask: Is the evidence directly relevant?
- Ask: Is there enough evidence?
- Ask: Could there be another explanation?

REASONING FROM DATA (SP.3.b–SP.3.c)
A valid conclusion:
- Is directly supported by the data presented
- Does not overstate what the data shows
- Acknowledges limitations

Invalid conclusions:
- Claim more than the data shows
- Ignore contradicting data
- Confuse correlation with causation ("ice cream sales and drowning rates both rise in summer" — both are caused by hot weather, not each other)

PROBABILITY & STATISTICS IN SCIENCE (SP.8)
Mean, median, mode, range: see Math Chapter 4
Probability in genetics: Punnett squares show offspring ratios (SP.8.c)
Sampling: conclusions drawn from a sample apply to the population only if the sample is representative and large enough`,
    practiceQuestions: [
      { question: 'A researcher tests a new drug by giving it to patients and measuring recovery time, but does not have a control group. What is wrong with this design?', answer: 'Without a control group (patients taking a placebo or no treatment), there is no baseline for comparison. The researcher cannot determine if recovery is due to the drug or would have happened naturally.' },
      { question: 'An experiment finds that students who eat breakfast score higher on tests. Does this prove that breakfast CAUSES better scores?', answer: 'No — this shows correlation, not causation. A third factor (e.g., students from stable home environments both eat breakfast AND study more) could explain the relationship.' },
      { question: 'In an experiment on plant growth with different fertilizers, what should be controlled?', answer: 'Sunlight, water amount, soil type, pot size, temperature, plant species, and initial plant size should all be controlled. Only the type of fertilizer should change.' }
    ]
  }
];

// ─────────────────────────────────────────────────────────────
// SOCIAL STUDIES
// Test: 50% Civics/Government, 20% US History, 15% Economics, 15% Geography
// Themes: Development of Modern Liberties & Democracy; Dynamic Responses in Societal Systems
// ─────────────────────────────────────────────────────────────
const SOCIAL_STUDIES_CHAPTERS: GEDChapter[] = [
  {
    number: 1,
    title: 'Civics & Government: Constitutional Principles',
    topics: ['Types of Government', 'Constitutional Democracy', 'Principles of American Government', 'Structure of Government'],
    content: `Chapter 1: Civics & Government — Constitutional Principles
[Assessment Targets: CG.a, CG.b, CG.c — 50% of Social Studies test]

TYPES OF GOVERNMENT (CG.a)
Democracy: citizens hold power; may be direct (citizens vote on laws) or representative/republic (citizens elect representatives)
Monarchy: rule by a king or queen; absolute (total power) or constitutional (power limited by law)
Oligarchy: rule by a small, elite group
Theocracy: government ruled by religious authority or law
Authoritarian/Totalitarian: centralized control; limits individual freedoms; e.g., dictatorship

PRINCIPLES OF AMERICAN CONSTITUTIONAL DEMOCRACY (CG.b)
Popular sovereignty: political power comes from the people
Limited government: the government may only do what the Constitution permits
Separation of powers: power is divided among three branches to prevent any one branch from dominating
Checks and balances: each branch can limit the powers of the others
Federalism: power is shared between the national and state governments
Rule of law: everyone — including government officials — must obey the law

THE THREE BRANCHES (CG.c)
Executive Branch:
- President: Chief Executive, Commander-in-Chief, signs or vetoes legislation, appoints federal judges
- Vice President, Cabinet departments (State, Defense, Treasury, etc.)
- Term: 4 years; maximum 2 terms (22nd Amendment)

Legislative Branch — Congress:
- Senate: 100 senators (2 per state), 6-year terms; confirms appointments, ratifies treaties
- House of Representatives: 435 members (based on population), 2-year terms; originates revenue bills
- Powers: make laws, declare war, control federal budget, override presidential veto (2/3 majority)

Judicial Branch:
- Supreme Court: 9 justices, lifetime appointments
- Role: interpret the Constitution; power of judicial review (Marbury v. Madison, 1803)
- Can strike down laws as unconstitutional

CHECKS & BALANCES IN ACTION
- President vetoes a bill → Congress can override with 2/3 vote (check on executive)
- Congress passes a law → Supreme Court may rule it unconstitutional (check on legislative)
- President nominates judges → Senate must confirm (check on executive/judicial)

AMENDING THE CONSTITUTION
Proposal: 2/3 vote of both houses of Congress OR constitutional convention called by 2/3 of states
Ratification: 3/4 of states must approve
27 amendments total; first 10 = Bill of Rights (1791)`,
    practiceQuestions: [
      { question: 'What is the difference between federalism and separation of powers?', answer: 'Federalism divides power between national and state governments. Separation of powers divides national government power among the three branches (executive, legislative, judicial).' },
      { question: 'The Supreme Court rules a law unconstitutional. Which principle does this demonstrate?', answer: 'Checks and balances and judicial review — the judicial branch is checking the legislative branch by overturning a law that violates the Constitution.' },
      { question: 'How does the Senate differ from the House of Representatives in terms of representation?', answer: 'The Senate gives equal representation (2 senators per state, regardless of size). The House gives proportional representation (more members for larger population states).' },
      { question: 'What does "limited government" mean in practice?', answer: 'The government can only exercise powers specifically granted by the Constitution. Citizens retain rights that the government cannot infringe upon, and the Bill of Rights lists specific protections.' }
    ]
  },
  {
    number: 2,
    title: 'Civics & Government: Rights, Responsibilities & Civil Liberties',
    topics: ['Bill of Rights', 'Civil Rights Amendments', 'Civic Participation', 'Elections & Voting'],
    content: `Chapter 2: Civics & Government — Rights, Responsibilities & Civil Liberties
[Assessment Targets: CG.c, CG.d — Civic Participation, Rights]

THE BILL OF RIGHTS (First 10 Amendments)
1st: Freedom of speech, press, religion, assembly, and petition
2nd: Right to bear arms
3rd: No quartering of soldiers in homes
4th: Protection from unreasonable searches and seizures; warrants required
5th: Right against self-incrimination; due process; no double jeopardy
6th: Right to speedy trial, impartial jury, legal counsel
7th: Right to jury trial in civil cases
8th: No excessive bail; no cruel and unusual punishment
9th: Rights not listed are still retained by the people
10th: Powers not delegated to federal government are reserved to states

KEY CIVIL RIGHTS AMENDMENTS
13th (1865): Abolished slavery
14th (1868): Equal protection under the law; citizenship to all born in US; due process
15th (1870): Cannot deny vote based on race
19th (1920): Women's right to vote (women's suffrage)
24th (1964): Abolished poll taxes (removing a barrier to Black voting)
26th (1971): Voting age lowered to 18

KEY SUPREME COURT CASES
- Marbury v. Madison (1803): Established judicial review
- Brown v. Board of Education (1954): Declared school segregation unconstitutional (overturned Plessy v. Ferguson)
- Roe v. Wade (1973): Recognized privacy right in abortion decisions [overturned 2022 by Dobbs v. Jackson]
- Miranda v. Arizona (1966): Established Miranda rights (right to remain silent, right to attorney)

CIVIL RIGHTS MOVEMENT
Key figures: Rosa Parks, Martin Luther King Jr., Thurgood Marshall, John Lewis
Key legislation:
- Civil Rights Act of 1964: prohibited discrimination based on race, color, religion, sex, national origin
- Voting Rights Act of 1965: prohibited discriminatory voting practices

CIVIC RESPONSIBILITIES
- Voting: fundamental right and responsibility in a democracy
- Jury duty: legal obligation to serve when summoned
- Paying taxes: fund government services
- Obeying laws: maintain social order
- Staying informed: critical for effective participation
- Community service: strengthens civil society

ELECTIONS
Electoral College: President is elected by 538 electors; winner needs 270+
Primary elections: parties choose their candidates
General elections: candidates from parties compete for office
Congressional elections: Representatives every 2 years; Senators every 6 years (staggered)`,
    practiceQuestions: [
      { question: 'Which amendment abolished slavery in the United States?', answer: 'The 13th Amendment (1865) abolished slavery throughout the United States.' },
      { question: 'What rights does the 1st Amendment protect?', answer: 'Freedom of speech, freedom of the press, freedom of religion, freedom of peaceful assembly, and the right to petition the government.' },
      { question: 'What was the significance of Brown v. Board of Education (1954)?', answer: 'The Supreme Court unanimously ruled that racial segregation in public schools was unconstitutional, overturning the "separate but equal" doctrine of Plessy v. Ferguson (1896). It was a landmark victory for the Civil Rights Movement.' },
      { question: 'How many electoral votes does a presidential candidate need to win?', answer: '270 electoral votes out of 538 total — a majority.' }
    ]
  },
  {
    number: 3,
    title: 'U.S. History: From Founding Documents to Modern Era',
    topics: ['Colonial Period', 'Revolution & Constitution', 'Civil War & Reconstruction', 'Progressive Era to WWII', 'Cold War & Civil Rights'],
    content: `Chapter 3: U.S. History — Founding Documents to Modern Era
[Assessment Targets: USH.a–USH.c — 20% of Social Studies test]

KEY HISTORICAL DOCUMENTS (USH.a) — GED Required Content
Declaration of Independence (1776):
- Written by Thomas Jefferson; lists natural rights (life, liberty, pursuit of happiness)
- Declares that governments derive power from the "consent of the governed"
- Lists grievances against King George III
- Key line: "We hold these truths to be self-evident, that all men are created equal"

The Federalist Papers (1787-1788):
- Written by Hamilton, Madison, and Jay to support ratification of the Constitution
- Federalist No. 51 (Madison): explains checks and balances and separation of powers
- Federalist No. 10 (Madison): argues for republic over direct democracy to control factions

The Constitution (1787): framework for the federal government; replaced Articles of Confederation
Bill of Rights (1791): first 10 amendments; protected individual liberties

MAJOR HISTORICAL PERIODS

Colonial Era (1607–1776):
- Jamestown (1607): first permanent English settlement
- 13 colonies; growing tensions over taxation without representation (Stamp Act, Tea Act)
- Boston Tea Party (1773); First Continental Congress (1774)

Revolutionary War (1775–1783):
- Battles of Lexington and Concord (1775): "the shot heard round the world"
- Declaration of Independence (July 4, 1776)
- Treaty of Paris (1783): Britain recognized American independence

Civil War & Reconstruction (1861–1877):
- Causes: slavery, states' rights, economic differences between North and South
- Emancipation Proclamation (1863): freed enslaved people in Confederate states; changed war's moral purpose
- 13th, 14th, 15th Amendments (Reconstruction Amendments)
- Reconstruction ended 1877; rise of Jim Crow laws in the South

Progressive Era & WWI (1900–1920):
- Reforms: women's suffrage, child labor laws, food safety regulations (Pure Food and Drug Act)
- WWI (1914–1918); U.S. entered 1917; Treaty of Versailles; League of Nations (US never joined)

Great Depression & WWII (1929–1945):
- Stock market crash (1929); 25% unemployment
- FDR's New Deal: government programs to provide relief, recovery, reform
- WWII: US joined after Pearl Harbor (Dec. 7, 1941); D-Day (1944); atomic bombs (1945)

Cold War & Civil Rights (1945–1990):
- Cold War: ideological conflict between US (democracy/capitalism) and USSR (communism)
- Korean War (1950–53), Vietnam War (1955–75)
- Civil Rights Movement: Montgomery Bus Boycott (1955), March on Washington (1963), Civil Rights Act (1964)
- Moon landing (1969); Cold War ends with USSR collapse (1991)`,
    practiceQuestions: [
      { question: 'According to the Declaration of Independence, where does government authority come from?', answer: 'From the "consent of the governed" — the people grant government its power, and government exists to protect the natural rights of the people.' },
      { question: 'What was the purpose of the Emancipation Proclamation?', answer: 'Issued by President Lincoln in 1863, it declared enslaved people in Confederate states to be free. It transformed the Civil War from a fight to preserve the Union into a fight to end slavery, and helped prevent European powers from supporting the Confederacy.' },
      { question: 'What role did Federalist No. 51 play in American government?', answer: 'Madison argued that the structure of government itself — with separate branches having the power to check one another — would prevent tyranny. "Ambition must be made to counteract ambition."' }
    ]
  },
  {
    number: 4,
    title: 'Economics: Key Concepts & American Economic Policy',
    topics: ['Supply & Demand', 'Market Systems', 'Government & the Economy', 'Economic Indicators', 'Personal Finance'],
    content: `Chapter 4: Economics
[Assessment Targets: E.a–E.c — 15% of Social Studies test]

SUPPLY & DEMAND
Law of Demand: As price increases, quantity demanded decreases (inverse relationship)
Law of Supply: As price increases, quantity supplied increases (direct relationship)
Equilibrium: the price where supply equals demand (market-clearing price)

Shifts in demand (causes):
- Change in income, consumer preferences, prices of related goods, future expectations, population

Shifts in supply (causes):
- Change in input costs, technology, number of producers, government policies

MARKET SYSTEMS
Free market (capitalism): private ownership; prices set by supply and demand; limited government intervention
Command economy: government controls production and prices (e.g., Soviet-era USSR)
Mixed economy: combines free market with government regulation (most modern economies, including the US)

Market structures:
- Perfect competition: many sellers, identical products (agriculture)
- Monopoly: one seller controls the market
- Oligopoly: few dominant firms (airlines, wireless carriers)

GOVERNMENT & THE ECONOMY
Fiscal policy: government uses taxes and spending to influence the economy
- Expansionary: cut taxes / increase spending → stimulate growth (used in recessions)
- Contractionary: raise taxes / cut spending → slow inflation

Monetary policy: Federal Reserve controls money supply and interest rates
- Lower interest rates → encourage borrowing and spending (expansionary)
- Raise interest rates → cool inflation (contractionary)

KEY ECONOMIC EVENTS IN U.S. HISTORY
- Great Depression (1929–1939): FDR's New Deal created Social Security, bank regulation (FDIC)
- Post-WWII boom: GI Bill enabled college education and home ownership for veterans
- 2008 Financial Crisis: housing bubble collapse → government bank bailouts (TARP)

ECONOMIC INDICATORS
GDP (Gross Domestic Product): total value of goods and services produced in a country; measures economic health
Inflation: general rise in prices; measured by Consumer Price Index (CPI)
Unemployment rate: percentage of the labor force actively seeking but unable to find work
Trade deficit: imports exceed exports; trade surplus: exports exceed imports

PERSONAL FINANCE
Budget: income − expenses = savings/deficit
Compound interest: interest earned on both principal and accumulated interest (I = P(1+r)ⁿ)
Credit score: measure of creditworthiness; affects loan rates
Insurance: protects against financial loss`,
    practiceQuestions: [
      { question: 'If demand for electric cars increases but supply stays the same, what happens to price?', answer: 'Price increases — higher demand with constant supply pushes the equilibrium price upward.' },
      { question: 'What is the difference between fiscal and monetary policy?', answer: 'Fiscal policy uses government taxing and spending (controlled by Congress and the President). Monetary policy uses interest rates and money supply (controlled by the Federal Reserve).' },
      { question: 'What does GDP measure and why does it matter?', answer: 'GDP measures the total value of all goods and services produced in a country in a year. It is a key indicator of economic health — growing GDP suggests a healthy economy; shrinking GDP may indicate recession.' },
      { question: 'How does the government use expansionary fiscal policy to fight a recession?', answer: 'By cutting taxes (leaving more money for people to spend) and increasing government spending (on infrastructure, programs, etc.), the government injects money into the economy to stimulate demand and employment.' }
    ]
  },
  {
    number: 5,
    title: 'Geography & the World',
    topics: ['Maps & Geographic Tools', 'Human-Environment Interaction', 'Regions of the World', 'Migration & Population', 'Globalization'],
    content: `Chapter 5: Geography & the World
[Assessment Targets: GW.a–GW.c — 15% of Social Studies test]

GEOGRAPHIC TOOLS (GW.a)
Maps: visual representations of Earth or specific areas
- Political maps: show borders, capitals, cities
- Physical maps: show landforms, elevation, bodies of water
- Thematic maps: show specific data (population density, climate zones, election results)

Key map elements: title, legend/key, scale, compass rose (N/S/E/W), grid (latitude/longitude)
Latitude: horizontal lines; measures distance north/south of equator (0°–90°)
Longitude: vertical lines; measures distance east/west of Prime Meridian (0°–180°)

Interpreting data from maps:
- Identify patterns (e.g., population concentrated near coasts or rivers)
- Compare regions (e.g., which region has highest GDP per capita)
- Read choropleth maps (shaded maps showing intensity of a variable)

HUMAN-ENVIRONMENT INTERACTION (GW.b)
How humans adapt to and modify their environment:
- Building dams, canals, roads, cities
- Agriculture: cleared forests for farmland; irrigation of arid regions
- Resource extraction: mining, drilling, logging

Environmental consequences: deforestation, soil erosion, water pollution, climate change, species extinction

Disasters and human response:
- Coastal communities build seawalls and evacuation routes for hurricanes
- Earthquake-prone areas use seismic building codes
- Flood plains: levees, storm drains, zoning laws

REGIONS & MIGRATION
Push factors (reasons to leave): poverty, conflict, persecution, natural disaster, lack of opportunity
Pull factors (reasons to go to a new place): safety, jobs, family, better education, political freedom

Historical migrations:
- Great Migration (1910–1970): millions of Black Americans moved from the rural South to Northern cities to escape Jim Crow and find industrial jobs
- Immigration waves to the US: Irish (1840s famine), Eastern European Jews (1880s–1910s), Latin American (20th–21st centuries)

GLOBALIZATION (GW.c)
Globalization: increasing interconnection of world economies, cultures, and governments through trade, communication, and technology

Effects:
- Positive: lower consumer prices, wider variety of goods, cultural exchange, technological diffusion
- Negative: job displacement from outsourcing, cultural homogenization, environmental costs of shipping

Trade: countries export goods they can produce efficiently; import goods that others produce more cheaply (comparative advantage)

International organizations: United Nations (international peace/cooperation), World Trade Organization (trade rules), World Bank (development lending), IMF (financial stability)`,
    practiceQuestions: [
      { question: 'What is the difference between latitude and longitude?', answer: 'Latitude lines are horizontal and measure distance north or south of the equator (0°). Longitude lines are vertical and measure distance east or west of the Prime Meridian (0°).' },
      { question: 'What were the push and pull factors behind the Great Migration?', answer: 'Push: Jim Crow laws, racial violence, lynching, limited economic opportunity in the South. Pull: industrial jobs, higher wages, less overt racial segregation, better schools in Northern cities.' },
      { question: 'How does comparative advantage explain international trade?', answer: 'Even if one country can produce everything more efficiently, trade benefits both countries when each specializes in what it produces most efficiently relative to the other. This maximizes total output and allows both to consume more.' }
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
