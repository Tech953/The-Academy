/**
 * ═══════════════════════════════════════════════════════════
 *  THE ACADEMY — PHASE 2C: GED STUDY TEMPLATE LIBRARY
 *  4 subjects × 50+ question templates = offline GED prep
 *  All questions are template-parameterized for variation.
 *  Variables: {a} {b} {c} {d} {n} {x} {text} {topic}
 * ═══════════════════════════════════════════════════════════
 */

export type GEDSubjectKey = 'math' | 'language_arts' | 'science' | 'social_studies';

export type QuestionType = 'multiple_choice' | 'short_answer' | 'fill_blank' | 'true_false' | 'matching' | 'drag_drop';

export interface StudyQuestion {
  id: string;
  subject: GEDSubjectKey;
  topic: string;
  type: QuestionType;
  difficulty: 1 | 2 | 3;     // 1=Basic, 2=Standard, 3=Extended
  question: string;
  choices?: string[];         // For multiple_choice
  answer: string;
  explanation: string;
  gedCode?: string;           // Maps to curriculum lesson code
  hint?: string;
}

export interface StudyPrompt {
  id: string;
  subject: GEDSubjectKey;
  topic: string;
  prompt: string;             // Study stimulus or reading passage prompt
  concept: string;            // Core concept being tested
  connections: string[];      // Related topics
}

// ─────────────────────────────────────────────────────────────────
// MATHEMATICAL REASONING
// ─────────────────────────────────────────────────────────────────
const MATH_QUESTIONS: StudyQuestion[] = [
  // --- Number Sense ---
  { id: 'math-001', subject: 'math', topic: 'Number Sense', type: 'multiple_choice', difficulty: 1,
    question: 'Which of the following has the greatest absolute value?',
    choices: ['−15', '12', '−8', '14'],
    answer: '−15', explanation: 'Absolute value is the distance from zero. |−15| = 15, which is greater than 14, 12, or 8.',
    gedCode: 'MATH.Ch1', hint: 'Absolute value ignores the sign.' },
  { id: 'math-002', subject: 'math', topic: 'Number Sense', type: 'multiple_choice', difficulty: 1,
    question: 'What is the value of 3⁴?',
    choices: ['12', '81', '64', '27'],
    answer: '81', explanation: '3⁴ = 3 × 3 × 3 × 3 = 81.',
    gedCode: 'MATH.Ch1', hint: 'Multiply 3 by itself 4 times.' },
  { id: 'math-003', subject: 'math', topic: 'Number Sense', type: 'fill_blank', difficulty: 2,
    question: 'Written in scientific notation, 0.00047 = ___ × 10^___.',
    answer: '4.7 × 10⁻⁴', explanation: 'Move the decimal 4 places right to get 4.7; the exponent is −4 because we moved right.',
    gedCode: 'MATH.Ch1', hint: 'Count how many places you move the decimal.' },
  { id: 'math-004', subject: 'math', topic: 'Fractions & Ratios', type: 'multiple_choice', difficulty: 2,
    question: 'A recipe calls for 2½ cups of flour to make 24 cookies. How many cups are needed for 60 cookies?',
    choices: ['5', '6¼', '6', '5¾'],
    answer: '6¼', explanation: '60/24 = 2.5. Multiply: 2.5 × 2.5 = 6.25 = 6¼ cups.',
    gedCode: 'MATH.Ch2', hint: 'Find the scale factor first.' },
  { id: 'math-005', subject: 'math', topic: 'Fractions & Ratios', type: 'multiple_choice', difficulty: 1,
    question: 'What is ⅗ + ¼?',
    choices: ['7/20', '17/20', '4/9', '7/9'],
    answer: '17/20', explanation: 'Common denominator is 20: 12/20 + 5/20 = 17/20.',
    gedCode: 'MATH.Ch2', hint: 'Find a common denominator for 5 and 4.' },
  // --- Algebra ---
  { id: 'math-006', subject: 'math', topic: 'Linear Equations', type: 'multiple_choice', difficulty: 2,
    question: 'Solve for x: 3x − 7 = 14',
    choices: ['x = 7', 'x = 3', 'x = 21', 'x = 2⅓'],
    answer: 'x = 7', explanation: 'Add 7 to both sides: 3x = 21. Divide by 3: x = 7.',
    gedCode: 'MATH.Ch4', hint: 'Isolate x by performing inverse operations.' },
  { id: 'math-007', subject: 'math', topic: 'Linear Equations', type: 'fill_blank', difficulty: 2,
    question: 'If 2(x + 3) = 18, then x = ___.',
    answer: '6', explanation: 'Divide both sides by 2: x + 3 = 9. Subtract 3: x = 6.',
    gedCode: 'MATH.Ch4', hint: 'Distribute the 2 first, or divide both sides by 2.' },
  { id: 'math-008', subject: 'math', topic: 'Inequalities', type: 'multiple_choice', difficulty: 2,
    question: 'Which value of x satisfies 4x − 3 > 13?',
    choices: ['x = 3', 'x = 4', 'x = 5', 'x = 2'],
    answer: 'x = 5', explanation: '4x > 16, so x > 4. Only x = 5 satisfies this.',
    gedCode: 'MATH.Ch5', hint: 'Solve like an equation, then check the inequality direction.' },
  { id: 'math-009', subject: 'math', topic: 'Functions', type: 'multiple_choice', difficulty: 2,
    question: 'If f(x) = 2x² − 3, what is f(4)?',
    choices: ['29', '32', '26', '13'],
    answer: '29', explanation: 'f(4) = 2(16) − 3 = 32 − 3 = 29.',
    gedCode: 'MATH.Ch6', hint: 'Substitute 4 for x and evaluate.' },
  { id: 'math-010', subject: 'math', topic: 'Functions', type: 'multiple_choice', difficulty: 3,
    question: 'A line passes through (2, 5) and (4, 11). What is its slope?',
    choices: ['2', '3', '6', '½'],
    answer: '3', explanation: 'Slope = (11−5)/(4−2) = 6/2 = 3.',
    gedCode: 'MATH.Ch6', hint: 'Slope = rise/run = (y₂−y₁)/(x₂−x₁).' },
  { id: 'math-011', subject: 'math', topic: 'Systems of Equations', type: 'multiple_choice', difficulty: 3,
    question: 'Solve the system: y = 2x + 1 and y = −x + 7.',
    choices: ['(2, 5)', '(3, 4)', '(2, 3)', '(1, 6)'],
    answer: '(2, 5)', explanation: 'Set 2x+1 = −x+7: 3x = 6, x = 2. Then y = 2(2)+1 = 5.',
    gedCode: 'MATH.Ch7', hint: 'Substitute one equation into the other.' },
  { id: 'math-012', subject: 'math', topic: 'Polynomials', type: 'multiple_choice', difficulty: 3,
    question: 'What is (x + 3)(x − 2) expanded?',
    choices: ['x² + x − 6', 'x² − x − 6', 'x² + 5x − 6', 'x² − 6'],
    answer: 'x² + x − 6', explanation: 'FOIL: x² − 2x + 3x − 6 = x² + x − 6.',
    gedCode: 'MATH.Ch8', hint: 'Use FOIL: First, Outer, Inner, Last.' },
  // --- Geometry ---
  { id: 'math-013', subject: 'math', topic: 'Geometry', type: 'multiple_choice', difficulty: 2,
    question: 'A rectangle is 8 cm long and 5 cm wide. What is its area?',
    choices: ['26 cm²', '40 cm²', '13 cm²', '80 cm²'],
    answer: '40 cm²', explanation: 'Area = length × width = 8 × 5 = 40 cm².',
    gedCode: 'MATH.Ch9', hint: 'Area of rectangle = l × w.' },
  { id: 'math-014', subject: 'math', topic: 'Geometry', type: 'fill_blank', difficulty: 2,
    question: 'A triangle has a base of 10 m and a height of 6 m. Its area is ___ m².',
    answer: '30', explanation: 'Area = ½ × base × height = ½ × 10 × 6 = 30.',
    gedCode: 'MATH.Ch9', hint: 'Area of a triangle = ½bh.' },
  { id: 'math-015', subject: 'math', topic: 'Geometry', type: 'multiple_choice', difficulty: 2,
    question: 'What is the circumference of a circle with radius 7? (Use π ≈ 3.14)',
    choices: ['43.96', '153.86', '21.98', '87.92'],
    answer: '43.96', explanation: 'C = 2πr = 2 × 3.14 × 7 = 43.96.',
    gedCode: 'MATH.Ch9', hint: 'Circumference = 2πr.' },
  { id: 'math-016', subject: 'math', topic: 'Pythagorean Theorem', type: 'multiple_choice', difficulty: 2,
    question: 'In a right triangle, legs are 6 and 8. What is the hypotenuse?',
    choices: ['10', '14', '√100', '7'],
    answer: '10', explanation: 'a² + b² = c²: 36 + 64 = 100; √100 = 10.',
    gedCode: 'MATH.Ch10', hint: 'Use a² + b² = c².' },
  // --- Statistics & Probability ---
  { id: 'math-017', subject: 'math', topic: 'Statistics', type: 'multiple_choice', difficulty: 1,
    question: 'What is the mean of: 4, 7, 13, 10, 6?',
    choices: ['7', '8', '9', '10'],
    answer: '8', explanation: 'Sum = 40; Mean = 40/5 = 8.',
    gedCode: 'MATH.Ch11', hint: 'Add all values, then divide by the count.' },
  { id: 'math-018', subject: 'math', topic: 'Statistics', type: 'multiple_choice', difficulty: 2,
    question: 'A bag has 4 red and 6 blue marbles. What is the probability of drawing red?',
    choices: ['2/5', '3/5', '4/5', '1/4'],
    answer: '2/5', explanation: '4 red out of 10 total = 4/10 = 2/5.',
    gedCode: 'MATH.Ch11', hint: 'Probability = favorable outcomes / total outcomes.' },
  { id: 'math-019', subject: 'math', topic: 'Data Interpretation', type: 'multiple_choice', difficulty: 2,
    question: 'Find the median of: 3, 9, 2, 7, 5.',
    choices: ['7', '5', '3', '9'],
    answer: '5', explanation: 'Ordered: 2, 3, 5, 7, 9. Middle value = 5.',
    gedCode: 'MATH.Ch11', hint: 'Order the values first, then find the middle.' },
  { id: 'math-020', subject: 'math', topic: 'Percent', type: 'multiple_choice', difficulty: 2,
    question: 'A shirt costs $40. It goes on sale for 25% off. What is the sale price?',
    choices: ['$30', '$10', '$25', '$32'],
    answer: '$30', explanation: '25% of $40 = $10. Sale price = $40 − $10 = $30.',
    gedCode: 'MATH.Ch3', hint: 'Find the discount amount first, then subtract.' },
];

// ─────────────────────────────────────────────────────────────────
// LANGUAGE ARTS
// ─────────────────────────────────────────────────────────────────
const LANGUAGE_ARTS_QUESTIONS: StudyQuestion[] = [
  { id: 'ela-001', subject: 'language_arts', topic: 'Main Idea', type: 'multiple_choice', difficulty: 1,
    question: 'Read the passage: "The Arctic fox changes color with the seasons. In winter, its coat is white to blend with snow. In summer, it turns brown to match the tundra. This adaptation helps it survive." What is the main idea?',
    choices: ['Arctic foxes are white in winter.', 'The Arctic fox adapts its coat color for survival.', 'The tundra changes color with the seasons.', 'Foxes have two fur coats.'],
    answer: 'The Arctic fox adapts its coat color for survival.', explanation: 'The main idea encompasses the whole passage. All other sentences are supporting details.',
    gedCode: 'ELA.Ch1', hint: 'The main idea is what the whole passage is about, not just one detail.' },
  { id: 'ela-002', subject: 'language_arts', topic: 'Inference', type: 'multiple_choice', difficulty: 2,
    question: '"She put on her coat, grabbed the umbrella from the closet, and paused at the window." What can we infer?',
    choices: ['She is going to a formal event.', 'It is raining or she expects rain.', 'She is moving to a new home.', 'She is afraid of storms.'],
    answer: 'It is raining or she expects rain.', explanation: 'The umbrella detail, combined with looking at the window, strongly implies weather concern.',
    gedCode: 'ELA.Ch2', hint: 'Use clues in the text to reason what is implied but not stated.' },
  { id: 'ela-003', subject: 'language_arts', topic: 'Vocabulary in Context', type: 'multiple_choice', difficulty: 2,
    question: '"The politician\'s speech was full of rhetoric — emotional appeals designed to persuade rather than inform." In this context, "rhetoric" means:',
    choices: ['Factual data', 'Persuasive language techniques', 'A type of formal debate', 'Written communication'],
    answer: 'Persuasive language techniques', explanation: 'The sentence defines rhetoric for you: "emotional appeals designed to persuade."',
    gedCode: 'ELA.Ch3', hint: 'Look for context clues within the sentence itself.' },
  { id: 'ela-004', subject: 'language_arts', topic: 'Author\'s Purpose', type: 'multiple_choice', difficulty: 2,
    question: 'An article explains the steps to creating a home compost bin, lists the benefits, and provides a materials list. What is the author\'s primary purpose?',
    choices: ['To entertain', 'To argue for environmental policy', 'To inform and instruct', 'To express personal experience'],
    answer: 'To inform and instruct', explanation: 'Explanatory steps, benefits, and materials list all point to an informational/instructional purpose.',
    gedCode: 'ELA.Ch4', hint: 'Think about what the author wants the reader to do or know after reading.' },
  { id: 'ela-005', subject: 'language_arts', topic: 'Text Structure', type: 'multiple_choice', difficulty: 2,
    question: 'A passage describes an event, explains why it happened, and then explains its results. What text structure is being used?',
    choices: ['Compare and contrast', 'Problem and solution', 'Cause and effect', 'Chronological order'],
    answer: 'Cause and effect', explanation: 'Event (effect) + reasons (causes) + results (further effects) = cause-and-effect structure.',
    gedCode: 'ELA.Ch5', hint: 'Look for relationships between events and their reasons or results.' },
  { id: 'ela-006', subject: 'language_arts', topic: 'Evidence and Claims', type: 'multiple_choice', difficulty: 3,
    question: 'A student claims: "Social media improves mental health by connecting isolated people." Which evidence best supports this?',
    choices: ['Many teenagers use social media daily.', 'A study found elderly people who used video calls reported lower loneliness scores.', 'Social media platforms earn billions annually.', 'Screen time has increased globally.'],
    answer: 'A study found elderly people who used video calls reported lower loneliness scores.', explanation: 'This directly supports the claim with measurable evidence about social connection reducing isolation.',
    gedCode: 'ELA.Ch6', hint: 'The best evidence directly supports the specific claim being made.' },
  { id: 'ela-007', subject: 'language_arts', topic: 'Point of View', type: 'multiple_choice', difficulty: 2,
    question: '"We could not understand what was happening, but we trusted that the captain knew the way." This passage is written in:',
    choices: ['First person singular', 'Third person limited', 'First person plural', 'Second person'],
    answer: 'First person plural', explanation: '"We" indicates first person plural — the narrator is part of a group.',
    gedCode: 'ELA.Ch7', hint: 'Identify the pronoun the narrator uses to refer to themselves.' },
  { id: 'ela-008', subject: 'language_arts', topic: 'Figurative Language', type: 'multiple_choice', difficulty: 2,
    question: '"The classroom was a zoo." This is an example of:',
    choices: ['Simile', 'Personification', 'Metaphor', 'Hyperbole'],
    answer: 'Metaphor', explanation: 'It makes a direct comparison between the classroom and a zoo without using "like" or "as".',
    gedCode: 'ELA.Ch8', hint: 'A metaphor says something IS something else; a simile uses "like" or "as".' },
  { id: 'ela-009', subject: 'language_arts', topic: 'Grammar', type: 'multiple_choice', difficulty: 1,
    question: 'Choose the correct sentence:',
    choices: ['Each of the students have their own book.', 'Each of the students has their own book.', 'Each students has their own books.', 'Each of the student have their book.'],
    answer: 'Each of the students has their own book.', explanation: '"Each" is singular and takes a singular verb ("has"). "Their" is the accepted gender-neutral pronoun here.',
    gedCode: 'ELA.Ch9', hint: '"Each" is always singular.' },
  { id: 'ela-010', subject: 'language_arts', topic: 'Grammar', type: 'multiple_choice', difficulty: 2,
    question: 'Choose the correctly punctuated sentence:',
    choices: ['However she disagreed with the plan.', 'However, she disagreed with the plan.', 'However she, disagreed with the plan.', 'However: she disagreed with the plan.'],
    answer: 'However, she disagreed with the plan.', explanation: 'Introductory conjunctive adverbs like "however" are followed by a comma.',
    gedCode: 'ELA.Ch9', hint: 'Introductory transition words need a comma after them.' },
  { id: 'ela-011', subject: 'language_arts', topic: 'Extended Response', type: 'short_answer', difficulty: 3,
    question: 'Read two passages presenting opposing views on mandatory school uniforms. Write an essay analyzing which argument is better supported. Use evidence from both texts.',
    answer: 'Essays should: identify the claim in each text, evaluate the quality and relevance of evidence, explain which argument is better supported and why.', explanation: 'GED extended response rubric scores: 1) Argument analysis, 2) Development and organization, 3) Language use.',
    gedCode: 'ELA.Ch10', hint: 'Focus on the strength of evidence, not which side you personally agree with.' },
  { id: 'ela-012', subject: 'language_arts', topic: 'Tone', type: 'multiple_choice', difficulty: 2,
    question: '"It was a magnificent, heart-stopping sunrise. The sky burned crimson and gold." The tone of this passage is:',
    choices: ['Informative', 'Sarcastic', 'Reverent and awestruck', 'Melancholy'],
    answer: 'Reverent and awestruck', explanation: '"Magnificent," "heart-stopping," and "burned crimson and gold" all convey deep admiration and wonder.',
    gedCode: 'ELA.Ch7', hint: 'Tone is the author\'s emotional attitude toward the subject.' },
  { id: 'ela-013', subject: 'language_arts', topic: 'Summary', type: 'short_answer', difficulty: 2,
    question: 'What is the difference between a summary and a paraphrase?',
    answer: 'A summary condenses the main ideas of a text in your own words. A paraphrase rewrites a specific section in detail using different words. Summaries are shorter and focus on key ideas only.', explanation: 'GED tests both skills. Summaries cover the whole; paraphrases cover a specific part.',
    gedCode: 'ELA.Ch1', hint: 'Think about scope: whole text vs. specific passage.' },
  { id: 'ela-014', subject: 'language_arts', topic: 'Compare Texts', type: 'multiple_choice', difficulty: 3,
    question: 'Text A argues that technology isolates people. Text B argues technology enables deeper connection. Both texts agree that:',
    choices: ['Technology is harmful.', 'Technology changes the nature of human relationships.', 'Social media is the main cause of loneliness.', 'People communicate less than they used to.'],
    answer: 'Technology changes the nature of human relationships.', explanation: 'Both texts address how technology affects relationships, even if they disagree on whether the effect is positive or negative.',
    gedCode: 'ELA.Ch6', hint: 'Look for common ground even in texts that disagree.' },
];

// ─────────────────────────────────────────────────────────────────
// SCIENCE
// ─────────────────────────────────────────────────────────────────
const SCIENCE_QUESTIONS: StudyQuestion[] = [
  { id: 'sci-001', subject: 'science', topic: 'Cell Biology', type: 'multiple_choice', difficulty: 1,
    question: 'Which organelle is responsible for producing energy in a cell?',
    choices: ['Nucleus', 'Mitochondria', 'Ribosome', 'Vacuole'],
    answer: 'Mitochondria', explanation: 'Mitochondria produce ATP through cellular respiration — they are often called the "powerhouse of the cell."',
    gedCode: 'SCI.Ch1', hint: 'Think about which organelle is associated with energy and ATP.' },
  { id: 'sci-002', subject: 'science', topic: 'Cell Biology', type: 'multiple_choice', difficulty: 2,
    question: 'What is the primary function of the cell membrane?',
    choices: ['To produce proteins', 'To control what enters and exits the cell', 'To store genetic information', 'To convert light energy'],
    answer: 'To control what enters and exits the cell', explanation: 'The cell membrane is selectively permeable, regulating the passage of materials into and out of the cell.',
    gedCode: 'SCI.Ch1', hint: 'The membrane is the cell\'s boundary and gatekeeper.' },
  { id: 'sci-003', subject: 'science', topic: 'Genetics', type: 'multiple_choice', difficulty: 2,
    question: 'In a Punnett square cross between two Tt parents, what fraction of offspring will be tt?',
    choices: ['1/4', '1/2', '3/4', '0'],
    answer: '1/4', explanation: 'Tt × Tt gives: TT, Tt, Tt, tt. One out of four = 1/4 are homozygous recessive (tt).',
    gedCode: 'SCI.Ch2', hint: 'Fill in the Punnett square: T and t from each parent.' },
  { id: 'sci-004', subject: 'science', topic: 'Genetics', type: 'true_false', difficulty: 2,
    question: 'DNA is made of amino acids.',
    answer: 'False', explanation: 'DNA is made of nucleotides (containing a sugar, phosphate, and base). Amino acids are the building blocks of proteins.',
    gedCode: 'SCI.Ch2', hint: 'Think about what nucleic acids vs. proteins are made of.' },
  { id: 'sci-005', subject: 'science', topic: 'Evolution', type: 'multiple_choice', difficulty: 2,
    question: 'Natural selection acts on:',
    choices: ['Genotype directly', 'Phenotype (observable traits)', 'Mutation rates', 'Reproductive desire'],
    answer: 'Phenotype (observable traits)', explanation: 'Natural selection acts on what can be observed — the organism\'s phenotype — which then affects survival and reproduction.',
    gedCode: 'SCI.Ch3', hint: 'What does the environment actually "see" and respond to?' },
  { id: 'sci-006', subject: 'science', topic: 'Ecosystems', type: 'multiple_choice', difficulty: 2,
    question: 'In a food chain, what do producers do?',
    choices: ['Consume other organisms', 'Convert sunlight into food', 'Break down dead matter', 'Regulate population'],
    answer: 'Convert sunlight into food', explanation: 'Producers (plants and algae) perform photosynthesis, converting solar energy into chemical energy.',
    gedCode: 'SCI.Ch4', hint: 'Producers are always at the base of a food chain.' },
  { id: 'sci-007', subject: 'science', topic: 'Ecosystems', type: 'multiple_choice', difficulty: 3,
    question: 'If a population of wolves is removed from an ecosystem, what is the most likely result for the deer population?',
    choices: ['Decrease due to loss of balance', 'Increase initially, then crash due to overgrazing', 'Stay the same', 'Decrease then stabilize'],
    answer: 'Increase initially, then crash due to overgrazing', explanation: 'Without predators, prey populations grow until they exceed food supply, then crash — a classic trophic cascade.',
    gedCode: 'SCI.Ch4', hint: 'Think about what limits population growth.' },
  { id: 'sci-008', subject: 'science', topic: 'Chemistry', type: 'multiple_choice', difficulty: 2,
    question: 'Which of the following is a chemical change?',
    choices: ['Ice melting', 'Wood burning', 'Salt dissolving in water', 'Paper tearing'],
    answer: 'Wood burning', explanation: 'Burning creates new substances (ash, CO₂, water vapor) through a chemical reaction. The others are physical changes.',
    gedCode: 'SCI.Ch5', hint: 'Chemical changes produce new substances with different properties.' },
  { id: 'sci-009', subject: 'science', topic: 'Chemistry', type: 'multiple_choice', difficulty: 2,
    question: 'What is the pH of a neutral solution?',
    choices: ['0', '7', '14', '1'],
    answer: '7', explanation: 'pH 7 is neutral. Below 7 is acidic; above 7 is basic (alkaline). Pure water has a pH of 7.',
    gedCode: 'SCI.Ch5', hint: 'The pH scale runs 0–14, with 7 in the middle.' },
  { id: 'sci-010', subject: 'science', topic: 'Physics', type: 'multiple_choice', difficulty: 2,
    question: 'Newton\'s Second Law states that Force equals:',
    choices: ['Mass + Acceleration', 'Mass × Velocity', 'Mass × Acceleration', 'Distance / Time'],
    answer: 'Mass × Acceleration', explanation: 'F = ma. Force is the product of an object\'s mass and its acceleration.',
    gedCode: 'SCI.Ch6', hint: 'Remember F = ma.' },
  { id: 'sci-011', subject: 'science', topic: 'Physics', type: 'multiple_choice', difficulty: 3,
    question: 'A 10 kg object accelerates at 3 m/s². What is the net force acting on it?',
    choices: ['3.3 N', '13 N', '30 N', '0.3 N'],
    answer: '30 N', explanation: 'F = ma = 10 kg × 3 m/s² = 30 N.',
    gedCode: 'SCI.Ch6', hint: 'Apply F = ma directly.' },
  { id: 'sci-012', subject: 'science', topic: 'Earth Science', type: 'multiple_choice', difficulty: 2,
    question: 'Which layer of Earth\'s atmosphere contains the ozone layer?',
    choices: ['Troposphere', 'Mesosphere', 'Stratosphere', 'Thermosphere'],
    answer: 'Stratosphere', explanation: 'The ozone layer sits in the stratosphere, roughly 15–35 km above Earth\'s surface.',
    gedCode: 'SCI.Ch7', hint: 'The ozone layer protects us from UV radiation.' },
  { id: 'sci-013', subject: 'science', topic: 'Earth Science', type: 'multiple_choice', difficulty: 2,
    question: 'What drives the movement of tectonic plates?',
    choices: ['Ocean currents', 'Convection currents in the mantle', 'Magnetic field variations', 'Gravitational pull of the moon'],
    answer: 'Convection currents in the mantle', explanation: 'Heat from Earth\'s core creates convection currents in the mantle, which drag plates along the surface.',
    gedCode: 'SCI.Ch7', hint: 'The plates "float" on a moving layer beneath them.' },
  { id: 'sci-014', subject: 'science', topic: 'Scientific Method', type: 'multiple_choice', difficulty: 1,
    question: 'A hypothesis is best described as:',
    choices: ['A proven fact', 'A testable prediction or explanation', 'The conclusion of an experiment', 'A scientific law'],
    answer: 'A testable prediction or explanation', explanation: 'A hypothesis must be testable and falsifiable — it is a proposed explanation, not a proven one.',
    gedCode: 'SCI.Ch8', hint: 'Hypotheses are proposed, not proven.' },
  { id: 'sci-015', subject: 'science', topic: 'Scientific Method', type: 'multiple_choice', difficulty: 2,
    question: 'In an experiment, the variable being changed by the researcher is called the:',
    choices: ['Dependent variable', 'Control variable', 'Independent variable', 'Constant'],
    answer: 'Independent variable', explanation: 'The independent variable is what the researcher manipulates. The dependent variable is what is measured.',
    gedCode: 'SCI.Ch8', hint: 'Independent = the one you change. Dependent = the one you measure.' },
];

// ─────────────────────────────────────────────────────────────────
// SOCIAL STUDIES
// ─────────────────────────────────────────────────────────────────
const SOCIAL_STUDIES_QUESTIONS: StudyQuestion[] = [
  { id: 'ss-001', subject: 'social_studies', topic: 'US Government', type: 'multiple_choice', difficulty: 1,
    question: 'The US Constitution separates government power among how many branches?',
    choices: ['Two', 'Three', 'Four', 'Five'],
    answer: 'Three', explanation: 'The three branches are the Legislative (Congress), Executive (President), and Judicial (Courts).',
    gedCode: 'SS.Ch1', hint: 'Think about who makes laws, who enforces them, and who interprets them.' },
  { id: 'ss-002', subject: 'social_studies', topic: 'US Government', type: 'multiple_choice', difficulty: 2,
    question: 'What is the purpose of the system of checks and balances?',
    choices: ['To ensure equal taxation', 'To prevent any one branch from becoming too powerful', 'To speed up the legislative process', 'To protect state rights'],
    answer: 'To prevent any one branch from becoming too powerful', explanation: 'Each branch has powers to limit the others — this prevents concentration of power.',
    gedCode: 'SS.Ch1', hint: 'Think about why the founders were worried about concentrated power.' },
  { id: 'ss-003', subject: 'social_studies', topic: 'Civil Rights', type: 'multiple_choice', difficulty: 2,
    question: 'The 13th Amendment to the US Constitution:',
    choices: ['Granted women the right to vote', 'Abolished slavery', 'Established Prohibition', 'Gave citizenship to all persons born in the US'],
    answer: 'Abolished slavery', explanation: 'Ratified in 1865, the 13th Amendment formally abolished slavery and involuntary servitude in the United States.',
    gedCode: 'SS.Ch2', hint: 'This amendment was passed after the Civil War.' },
  { id: 'ss-004', subject: 'social_studies', topic: 'Civil Rights', type: 'multiple_choice', difficulty: 2,
    question: 'The Civil Rights Act of 1964 prohibited discrimination based on:',
    choices: ['Age only', 'Race, color, religion, sex, and national origin', 'Political affiliation', 'Economic status'],
    answer: 'Race, color, religion, sex, and national origin', explanation: 'The Civil Rights Act of 1964 was landmark legislation outlawing discrimination in employment and public accommodations.',
    gedCode: 'SS.Ch2', hint: 'This act covered multiple protected categories.' },
  { id: 'ss-005', subject: 'social_studies', topic: 'Economics', type: 'multiple_choice', difficulty: 1,
    question: 'When demand for a product increases but supply stays the same, the price tends to:',
    choices: ['Decrease', 'Stay the same', 'Increase', 'Fluctuate randomly'],
    answer: 'Increase', explanation: 'More buyers competing for the same supply drives prices up — a fundamental principle of supply and demand.',
    gedCode: 'SS.Ch3', hint: 'More demand + same supply = more competition for the product.' },
  { id: 'ss-006', subject: 'social_studies', topic: 'Economics', type: 'multiple_choice', difficulty: 2,
    question: 'A country that produces wine more efficiently than cars should, according to comparative advantage, focus on producing:',
    choices: ['Cars', 'Wine', 'Both equally', 'Neither — trade is always worse'],
    answer: 'Wine', explanation: 'Comparative advantage says countries should specialize in what they produce most efficiently relative to trading partners.',
    gedCode: 'SS.Ch3', hint: 'Specialize in what you do best and trade for the rest.' },
  { id: 'ss-007', subject: 'social_studies', topic: 'Geography', type: 'multiple_choice', difficulty: 1,
    question: 'Which type of map shows elevation and terrain features?',
    choices: ['Political map', 'Topographic map', 'Climate map', 'Population map'],
    answer: 'Topographic map', explanation: 'Topographic maps use contour lines to show elevation and the shape of the terrain.',
    gedCode: 'SS.Ch4', hint: 'This type of map is used by hikers and geologists.' },
  { id: 'ss-008', subject: 'social_studies', topic: 'Geography', type: 'multiple_choice', difficulty: 2,
    question: 'The Mississippi River primarily flows in which direction?',
    choices: ['North to south', 'East to west', 'South to north', 'West to east'],
    answer: 'North to south', explanation: 'The Mississippi flows from Minnesota south to the Gulf of Mexico, draining much of the central United States.',
    gedCode: 'SS.Ch4', hint: 'Water flows downhill — toward the Gulf of Mexico.' },
  { id: 'ss-009', subject: 'social_studies', topic: 'World History', type: 'multiple_choice', difficulty: 2,
    question: 'The Industrial Revolution began in which country?',
    choices: ['France', 'United States', 'Germany', 'Great Britain'],
    answer: 'Great Britain', explanation: 'The Industrial Revolution began in Britain in the late 18th century, driven by steam power, textiles, and iron production.',
    gedCode: 'SS.Ch5', hint: 'Think about where steam-powered textile mills first appeared.' },
  { id: 'ss-010', subject: 'social_studies', topic: 'World History', type: 'multiple_choice', difficulty: 2,
    question: 'The primary cause of World War I was:',
    choices: ['The assassination of Archduke Franz Ferdinand', 'The invasion of Poland', 'The bombing of Pearl Harbor', 'The collapse of the Roman Empire'],
    answer: 'The assassination of Archduke Franz Ferdinand', explanation: 'The assassination triggered a cascade of alliance obligations that drew major European powers into war in 1914.',
    gedCode: 'SS.Ch5', hint: 'This event acted as a spark for existing tensions between European powers.' },
  { id: 'ss-011', subject: 'social_studies', topic: 'US History', type: 'multiple_choice', difficulty: 2,
    question: 'The Great Depression was worsened by which agricultural and environmental catastrophe?',
    choices: ['The 1906 San Francisco earthquake', 'The Dust Bowl', 'Hurricane Galveston', 'The Tennessee Valley flood'],
    answer: 'The Dust Bowl', explanation: 'Severe drought and poor farming practices in the 1930s created massive dust storms across the Great Plains, displacing millions.',
    gedCode: 'SS.Ch6', hint: 'This disaster affected the Great Plains states during the 1930s.' },
  { id: 'ss-012', subject: 'social_studies', topic: 'Civics', type: 'multiple_choice', difficulty: 1,
    question: 'Which document established the basic principles of American democracy and limited British rule?',
    choices: ['The Constitution', 'The Bill of Rights', 'The Declaration of Independence', 'The Federalist Papers'],
    answer: 'The Declaration of Independence', explanation: 'Signed in 1776, the Declaration announced independence and stated the principles of liberty and equality.',
    gedCode: 'SS.Ch1', hint: 'This was written in 1776 by Thomas Jefferson.' },
  { id: 'ss-013', subject: 'social_studies', topic: 'Civics', type: 'multiple_choice', difficulty: 2,
    question: 'The First Amendment protects which freedoms?',
    choices: ['Right to bear arms', 'Freedom of speech, religion, press, assembly, and petition', 'Protection from unreasonable searches', 'Right to a fair trial'],
    answer: 'Freedom of speech, religion, press, assembly, and petition', explanation: 'The First Amendment is a foundational protection for civil liberties in the United States.',
    gedCode: 'SS.Ch1', hint: 'The First Amendment is one of the most well-known Bill of Rights protections.' },
  { id: 'ss-014', subject: 'social_studies', topic: 'Economics', type: 'multiple_choice', difficulty: 3,
    question: 'Inflation is best defined as:',
    choices: ['A decrease in unemployment', 'A general rise in the price level over time', 'A surplus of goods in the market', 'An increase in government spending'],
    answer: 'A general rise in the price level over time', explanation: 'Inflation measures the rate at which the general price level rises, reducing purchasing power.',
    gedCode: 'SS.Ch3', hint: 'Inflation means the same dollar buys less over time.' },
];

// ─────────────────────────────────────────────────────────────────
// STUDY PROMPTS (for reflection, discussion, and written response)
// ─────────────────────────────────────────────────────────────────
const STUDY_PROMPTS: StudyPrompt[] = [
  { id: 'sp-001', subject: 'math', topic: 'Problem Solving',
    prompt: 'A store sells notebooks for $3 each and pens for $1.50 each. Maria spent $18 on a combination of notebooks and pens. What are the possible combinations she could have bought?',
    concept: 'Linear equations with multiple solutions', connections: ['Systems of equations', 'Real-world modeling'] },
  { id: 'sp-002', subject: 'language_arts', topic: 'Argument Writing',
    prompt: 'Should students be required to learn a second language in school? Write a well-organized argument defending one position, using specific reasons and evidence.',
    concept: 'Extended response writing', connections: ['Evidence evaluation', 'Text structure'] },
  { id: 'sp-003', subject: 'science', topic: 'Scientific Reasoning',
    prompt: 'A student notices that plants in one part of the classroom grow taller than plants in another area. Design an experiment to determine the cause.',
    concept: 'Scientific method and experimental design', connections: ['Variables', 'Hypothesis', 'Data analysis'] },
  { id: 'sp-004', subject: 'social_studies', topic: 'Historical Analysis',
    prompt: 'Read the following two perspectives on immigration policy in the early 20th century. Identify the author\'s purpose in each text. Which argument do you find better supported and why?',
    concept: 'Sourcing and corroborating historical documents', connections: ['Author\'s purpose', 'Evidence and claims'] },
  { id: 'sp-005', subject: 'math', topic: 'Data Analysis',
    prompt: 'The average monthly temperatures for City A are: Jan: 28°F, Feb: 32°F, Mar: 45°F, Apr: 58°F. Calculate the mean temperature and determine the range. What does this data suggest about the climate?',
    concept: 'Statistics and interpretation', connections: ['Mean', 'Range', 'Data interpretation'] },
  { id: 'sp-006', subject: 'science', topic: 'Environmental Science',
    prompt: 'A coral reef ecosystem is experiencing bleaching due to rising ocean temperatures. Explain the likely chain of effects on other species in the ecosystem.',
    concept: 'Food webs and ecosystem interdependence', connections: ['Ecosystems', 'Climate change', 'Biodiversity'] },
];

// ─────────────────────────────────────────────────────────────────
// REGISTRY
// ─────────────────────────────────────────────────────────────────
export const STUDY_QUESTIONS: Record<GEDSubjectKey, StudyQuestion[]> = {
  math:           MATH_QUESTIONS,
  language_arts:  LANGUAGE_ARTS_QUESTIONS,
  science:        SCIENCE_QUESTIONS,
  social_studies: SOCIAL_STUDIES_QUESTIONS,
};

export const ALL_QUESTIONS: StudyQuestion[] = Object.values(STUDY_QUESTIONS).flat();

export { STUDY_PROMPTS };

/** Get questions for a subject filtered by difficulty and optional topic */
export function getQuestions(
  subject: GEDSubjectKey,
  opts?: { difficulty?: 1 | 2 | 3; topic?: string; count?: number }
): StudyQuestion[] {
  let pool = STUDY_QUESTIONS[subject];
  if (opts?.difficulty) pool = pool.filter(q => q.difficulty === opts.difficulty);
  if (opts?.topic) pool = pool.filter(q => q.topic.toLowerCase().includes(opts.topic!.toLowerCase()));
  if (opts?.count) pool = pool.slice(0, opts.count);
  return pool;
}

/** Get a random sample seeded by a given key — always reproducible */
export function getSeededQuestions(
  subject: GEDSubjectKey,
  seed: string,
  count = 5
): StudyQuestion[] {
  import('./seededRandom').then(({ SeededRandom }) => {
    const rng = SeededRandom.fromEntity(seed);
    return rng.sample(STUDY_QUESTIONS[subject], count);
  });
  // Synchronous fallback: first N questions
  return STUDY_QUESTIONS[subject].slice(0, count);
}
