/**
 * GED Curriculum Data — Kaplan 2022–2023 Aligned
 * Full lesson-level structure across all 4 GED subject areas.
 * Each lesson includes content, key terms, and 3–5 MCQ practice questions
 * with answer choices, correct answers, and explanations.
 */
import type { GEDTextbook, GEDLesson, GEDPracticeQuestion } from '@shared/schema';

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
let _qId = 0;
function qid(prefix: string): string { return `${prefix}_${++_qId}`; }

function mcq(
  prefix: string, gedCode: string, difficulty: 'foundational' | 'standard' | 'extended',
  question: string, A: string, B: string, C: string, D: string,
  answer: 'A' | 'B' | 'C' | 'D', explanation: string, skillNodeId?: string
): GEDPracticeQuestion {
  return { id: qid(prefix), question, type: 'mcq', choices: { A, B, C, D }, answer, explanation, difficulty, gedCode, skillNodeId };
}

// ─────────────────────────────────────────────────────────────────────────────
// REASONING THROUGH LANGUAGE ARTS
// ─────────────────────────────────────────────────────────────────────────────

const RLA_CH1_LESSONS: GEDLesson[] = [
  {
    number: 1, title: 'Main Ideas and Details', gedCode: 'RLA.1.1',
    keyTerms: ['main idea', 'topic sentence', 'supporting detail', 'explicit', 'implicit'],
    content: `MAIN IDEAS AND DETAILS

The main idea is the central point an author wants you to understand. It answers: "What is this mostly about?"

EXPLICIT vs IMPLICIT MAIN IDEA
• Explicit: directly stated in a topic sentence, often the first or last sentence
• Implicit: suggested through details; you must infer it

FINDING THE MAIN IDEA
1. Identify the topic (who or what it's about)
2. Ask what the author says about that topic
3. That claim = the main idea

Example: "Voter turnout in the United States has declined over the past three decades. Fewer citizens vote in midterm elections than in presidential years. Analysts cite busy schedules, cynicism, and lack of civic education as causes."
→ Topic: voter turnout | Main idea: US voter turnout has declined and there are several causes

SUPPORTING DETAILS provide evidence, examples, or explanation for the main idea. They answer Who, What, When, Where, Why, How.

TIP: The main idea is broad enough to cover all details but specific enough to be a real claim.`,
    practiceQuestions: [
      mcq('RLA1', 'RLA.1.1', 'foundational',
        '"Exercise strengthens the heart, improves lung capacity, reduces stress, and helps maintain healthy weight." What is the main idea?',
        'Exercise is popular among young adults.',
        'Regular exercise provides multiple health benefits.',
        'People should avoid stress.',
        'The heart is the most important organ.',
        'B', 'The passage lists four distinct health benefits of exercise — all details support the claim that exercise benefits health broadly.', 'LANG.MAIN.002'),
      mcq('RLA1', 'RLA.1.1', 'standard',
        'A passage\'s topic is "online shopping." Which sentence is most likely the main idea?',
        'Amazon was founded in 1994.',
        'Many consumers prefer online shopping for its convenience and variety.',
        'Some websites offer free shipping.',
        'Credit cards are used for most online purchases.',
        'B', 'B makes a broad claim about consumer preferences that could be supported by specific details. The other options are supporting details.', 'LANG.MAIN.002'),
      mcq('RLA1', 'RLA.1.1', 'standard',
        'Which of the following is a supporting detail rather than a main idea?',
        'Climate change poses significant threats to coastal cities worldwide.',
        'Rising sea levels threaten to flood major coastal cities by 2100.',
        'Miami has spent over $400 million on flood infrastructure since 2016.',
        'Nations must reduce greenhouse gas emissions to prevent catastrophic warming.',
        'C', 'The Miami example is a specific fact that supports a broader claim — making it a detail, not a main idea.', 'LANG.MAIN.002'),
    ]
  },
  {
    number: 2, title: 'Restatement and Summary', gedCode: 'RLA.1.2',
    keyTerms: ['restatement', 'paraphrase', 'summary', 'synthesize'],
    content: `RESTATEMENT AND SUMMARY

RESTATEMENT: expressing the same idea using different words without changing meaning.
• Original: "The company's revenue declined sharply."
• Restatement: "The business earned significantly less money."

PARAPHRASE vs SUMMARY
• Paraphrase: rewrites a passage in your own words, roughly the same length
• Summary: condenses the key points; much shorter than original

HOW TO SUMMARIZE
1. Read the full passage
2. Identify the main idea
3. Note only the most essential supporting points
4. Write in your own words — omit examples, statistics, minor details
5. Do NOT add your opinion

AVOID FALSE RESTATEMENTS that change meaning:
• Original: "Most scientists agree human activity causes climate change."
• False: "All scientists agree climate change is entirely human-caused." (too strong)
• False: "Some scientists think humans may affect climate." (too weak)`,
    practiceQuestions: [
      mcq('RLA2', 'RLA.1.2', 'foundational',
        'Which is the best restatement of: "The new law prohibits texting while driving"?',
        'Driving requires concentration.',
        'The legislation bans using phones for messages when operating a vehicle.',
        'Many accidents are caused by distractions.',
        'Phones should not be used in cars.',
        'B', 'B uses different words (legislation, bans, operating a vehicle) to express the exact same legal prohibition without adding or removing meaning.', 'LANG.READ.001'),
      mcq('RLA2', 'RLA.1.2', 'standard',
        'A 5-paragraph article about climate change effects on agriculture. A good summary would:',
        'List every statistic mentioned in the article.',
        'Explain only the article\'s title and conclusion.',
        'Capture the main idea and major supporting points in 2–3 sentences.',
        'Quote the author\'s introduction directly.',
        'C', 'A summary condenses — it captures the key message and major evidence without every detail. Quotes and complete lists belong in paraphrase.', 'LANG.MAIN.002'),
    ]
  },
  {
    number: 3, title: 'Cause and Effect', gedCode: 'RLA.1.4',
    keyTerms: ['cause', 'effect', 'signal words', 'chain of causation'],
    content: `CAUSE AND EFFECT

A CAUSE is why something happens. An EFFECT is what happens as a result.

SIGNAL WORDS:
• Cause signals: because, since, due to, as a result of, caused by
• Effect signals: therefore, thus, consequently, so, as a result, led to

MULTIPLE CAUSES / MULTIPLE EFFECTS
One cause can have several effects; one effect can have several causes.
Example: A drought (cause) → crop failure, higher food prices, farmer debt (multiple effects)

CHAIN OF CAUSATION: A → B → C → D
• Industrial growth → air pollution → respiratory illness → increased healthcare costs

DISTINGUISHING CORRELATION from CAUSATION
Two events happening together (correlation) does not mean one caused the other.
Example: Ice cream sales and drowning both increase in summer — but ice cream doesn't cause drowning; summer heat causes both.`,
    practiceQuestions: [
      mcq('RLA3', 'RLA.1.4', 'foundational',
        '"The river flooded because of three days of heavy rainfall." What is the cause?',
        'The flooding of the river.',
        'Three days of heavy rainfall.',
        'Water damage to nearby homes.',
        'Inadequate drainage systems.',
        'B', '"Because" is a cause signal word, and what follows it — three days of heavy rainfall — is the cause. The flooding is the effect.', 'REAS.CRIT.001'),
      mcq('RLA3', 'RLA.1.4', 'standard',
        'Ice cream sales and sunburn cases both rise in July. What can you MOST logically conclude?',
        'Eating ice cream causes sunburn.',
        'Sunburn causes people to buy more ice cream.',
        'Both are likely caused by a third factor — hot, sunny summer weather.',
        'July weather causes both ice cream production and sunburn.',
        'C', 'This is a classic correlation vs causation example. Both phenomena share a common cause (summer heat and sunshine) rather than causing each other.', 'REAS.CRIT.001'),
      mcq('RLA3', 'RLA.1.4', 'extended',
        'A passage states: "Factory closures led to unemployment, which increased poverty, which raised crime rates." This is an example of:',
        'Multiple causes leading to one effect.',
        'A chain of causation where each effect becomes the next cause.',
        'Correlation between factory output and crime.',
        'An unsupported claim about poverty.',
        'B', 'Each event causes the next in sequence: closure → unemployment → poverty → crime. This is a classic causal chain.', 'REAS.CRIT.001'),
    ]
  },
  {
    number: 4, title: 'Compare and Contrast', gedCode: 'RLA.1.5',
    keyTerms: ['compare', 'contrast', 'similarities', 'differences', 'Venn diagram'],
    content: `COMPARE AND CONTRAST

COMPARE: examine how two or more things are similar
CONTRAST: examine how they are different

SIGNAL WORDS:
• Compare: similarly, likewise, both, also, in the same way, as well as
• Contrast: however, on the other hand, but, yet, whereas, although, in contrast, unlike

ORGANIZATIONAL PATTERNS:
1. Block method: discuss all of A, then all of B
2. Point-by-point: alternate between A and B on each attribute

GED EXAM TIP: When two passages are paired, identify what they share (same topic, some arguments) and how they differ (conclusions, tone, evidence type).`,
    practiceQuestions: [
      mcq('RLA4', 'RLA.1.5', 'foundational',
        'Which sentence COMPARES rather than contrasts?',
        'Unlike cats, dogs require daily walks.',
        'Both cats and dogs make loyal companions.',
        'Dogs are more social than cats.',
        'Cats are typically quieter than dogs.',
        'B', '"Both" signals similarity — this is comparison. The other options use contrast signals (unlike, more/less than) to show differences.', 'LANG.INFER.003'),
      mcq('RLA4', 'RLA.1.5', 'standard',
        'Two passages about immigration policy: one argues for stricter limits, one argues for open pathways. Which comparison is valid?',
        'Both passages agree immigration is beneficial.',
        'Both passages address the topic of immigration policy but reach opposite conclusions.',
        'Both passages cite the same statistics.',
        'The passages have identical organizational structures.',
        'B', 'When two opposing-viewpoint passages share a topic but disagree on conclusions, identifying this shared topic with differing position is the standard compare/contrast finding.', 'LANG.INFER.003'),
    ]
  },
];

const RLA_CH2_LESSONS: GEDLesson[] = [
  {
    number: 1, title: 'Purpose of Text', gedCode: 'RLA.2.1',
    keyTerms: ['author\'s purpose', 'persuade', 'inform', 'entertain', 'PIE'],
    content: `AUTHOR'S PURPOSE — PIE

P — PERSUADE: convince the reader to agree with a position or take action
• Clues: opinion words, loaded language, call to action, one-sided evidence

I — INFORM: provide factual information to educate the reader
• Clues: objective language, statistics, definitions, neutral tone

E — ENTERTAIN: engage or amuse through storytelling, humor, narrative
• Clues: narrative structure, characters, vivid description, dialogue

SECONDARY PURPOSES: A text may primarily inform but also persuade; an editorial primarily persuades while also informing.

GED APPLICATION: You will be asked to identify purpose and explain how word choices, structure, and tone support that purpose.`,
    practiceQuestions: [
      mcq('RLA5', 'RLA.2.1', 'foundational',
        'An article uses emotional language, one-sided evidence, and ends with "Contact your senator today." The author\'s primary purpose is to:',
        'Inform readers about legislative processes.',
        'Entertain readers with political stories.',
        'Persuade readers to take political action.',
        'Analyze the history of the Senate.',
        'C', 'Emotional language, one-sided evidence, and a direct call to action are all hallmarks of persuasive writing.', 'LANG.INFER.003'),
      mcq('RLA5', 'RLA.2.1', 'standard',
        'A textbook passage defines "photosynthesis," explains the chemical process, and includes a diagram. The purpose is to:',
        'Persuade students to study biology.',
        'Entertain with an interesting science story.',
        'Inform readers about how plants produce energy.',
        'Argue that plants are more important than animals.',
        'C', 'Definitions, process explanations, and diagrams are classic features of informational writing aimed at teaching content.', 'LANG.INFER.003'),
    ]
  },
  {
    number: 2, title: 'Evaluating Arguments', gedCode: 'RLA.2.2',
    keyTerms: ['claim', 'evidence', 'reasoning', 'logical fallacy', 'relevant', 'sufficient'],
    content: `EVALUATING ARGUMENTS

A strong argument has three parts:
1. CLAIM: the position or opinion the author is arguing
2. EVIDENCE: facts, data, expert opinion, examples that support the claim
3. REASONING: explanation of HOW the evidence supports the claim

EVALUATING EVIDENCE QUALITY:
• Relevant: directly relates to the claim
• Sufficient: enough evidence to support the claim
• Credible: from a reliable source

COMMON LOGICAL FALLACIES (weak arguments):
• Ad hominem: attacking the person, not the argument
• Straw man: misrepresenting an opponent's view then attacking that distortion
• False dichotomy: presenting only two options when more exist
• Appeal to emotion: using feelings instead of logic
• Hasty generalization: broad conclusion from too few examples`,
    practiceQuestions: [
      mcq('RLA6', 'RLA.2.2', 'standard',
        '"You can\'t trust Marcus\'s opinion on healthcare policy — he dropped out of college." This is an example of:',
        'A valid counterargument based on credentials.',
        'An ad hominem fallacy attacking the person rather than the argument.',
        'An appeal to authority.',
        'A hasty generalization.',
        'B', 'Attacking Marcus\'s education to dismiss his argument is an ad hominem fallacy — it attacks the speaker, not the substance of the argument.', 'LANG.ARG.009'),
      mcq('RLA6', 'RLA.2.2', 'extended',
        'A claim states: "All students should learn coding because three tech CEOs learned to code in school." What is the weakness?',
        'The claim is too broad and lacks a direct benefit statement.',
        'Three CEOs is too small a sample to generalize for all students — this is a hasty generalization.',
        'The argument should cite more famous CEOs.',
        'The word "all" makes this an absolute statement.',
        'B', 'Drawing a universal recommendation from three examples is a hasty generalization — far too small a sample to support a policy affecting all students.', 'LANG.ARG.009'),
    ]
  },
];

const RLA_CH4_LESSONS: GEDLesson[] = [
  {
    number: 1, title: 'Simple Sentences', gedCode: 'RLA.4.1',
    keyTerms: ['subject', 'predicate', 'complete sentence', 'fragment', 'run-on'],
    content: `SIMPLE SENTENCES

A complete sentence requires:
1. A SUBJECT (who or what the sentence is about)
2. A PREDICATE (what the subject does or is)
3. A complete thought

SENTENCE FRAGMENTS lack a subject, predicate, or complete thought:
• "Running down the street." (no subject)
• "The old brown dog." (no predicate)
• "Although she studied." (incomplete thought)

FIX FRAGMENTS by adding the missing element:
• "The boy was running down the street."
• "The old brown dog barked."
• "Although she studied, she failed the test."

RUN-ON SENTENCES join two independent clauses incorrectly:
• "I was tired I went to bed." (run-on)
Fix with: period, semicolon, or coordinating conjunction (FANBOYS: For, And, Nor, But, Or, Yet, So)
• "I was tired. I went to bed." or "I was tired, so I went to bed."`,
    practiceQuestions: [
      mcq('RLA7', 'RLA.4.1', 'foundational',
        'Which of the following is a complete sentence?',
        'Running along the river path at sunset.',
        'Because the store was closed.',
        'The manager approved the new schedule.',
        'Three large boxes of supplies and equipment.',
        'C', 'Only C has both a clear subject (the manager) and a predicate (approved the new schedule) that forms a complete thought.', 'LANG.SENT.006'),
      mcq('RLA7', 'RLA.4.1', 'foundational',
        '"She studied for hours she still felt unprepared." This is:',
        'A correct complex sentence.',
        'A sentence fragment.',
        'A run-on sentence.',
        'A correctly punctuated compound sentence.',
        'C', 'Two independent clauses ("She studied for hours" and "she still felt unprepared") are joined without correct punctuation or a conjunction — making this a run-on.', 'LANG.SENT.006'),
      mcq('RLA7', 'RLA.4.1', 'standard',
        'Which corrects the run-on: "The report was late the manager was frustrated."',
        'The report was late, the manager was frustrated.',
        'The report was late; the manager was frustrated.',
        'The report was late because the manager was frustrated.',
        'The report was late and frustrated.',
        'B', 'A semicolon correctly separates two related independent clauses. Option A uses only a comma (comma splice), C changes the meaning, D is grammatically incorrect.', 'LANG.SENT.006'),
    ]
  },
  {
    number: 2, title: 'Compound and Complex Sentences', gedCode: 'RLA.4.2',
    keyTerms: ['independent clause', 'dependent clause', 'coordinating conjunction', 'subordinating conjunction', 'compound', 'complex'],
    content: `COMPOUND AND COMPLEX SENTENCES

COMPOUND SENTENCES join two independent clauses:
• Use FANBOYS (For, And, Nor, But, Or, Yet, So) with a comma
• "Maria studied hard, and she passed the exam."
• Use a semicolon alone: "Maria studied hard; she passed."

COMPLEX SENTENCES pair an independent clause with a dependent clause:
• Dependent clauses start with subordinating conjunctions: because, although, since, when, if, unless, until, while, after, before
• "Although she was nervous, she answered clearly."
• "She answered clearly because she had prepared."
• When dependent clause comes FIRST → comma after it
• When dependent clause comes SECOND → usually no comma

COMPOUND-COMPLEX: contains two independent clauses AND at least one dependent clause:
• "Because he was late, he missed the speech, but he read the transcript."`,
    practiceQuestions: [
      mcq('RLA8', 'RLA.4.2', 'standard',
        'Which sentence is compound?',
        'She ran to the store because she needed milk.',
        'Running to the store, she grabbed the milk.',
        'She needed milk, so she ran to the store.',
        'Although tired, she completed the task.',
        'C', 'C uses the coordinating conjunction "so" with a comma to join two independent clauses — the definition of a compound sentence. A is complex (because), B is simple, D is complex (although).', 'LANG.SENT.006'),
      mcq('RLA8', 'RLA.4.2', 'standard',
        'Choose the correct punctuation: "_____ it rained all day the game was not cancelled."',
        'It rained all day, the game was not cancelled.',
        'Although it rained all day, the game was not cancelled.',
        'It rained all day although the game was not cancelled.',
        'It rained all day; the game was not cancelled.',
        'B', 'B correctly places a comma after a dependent clause that opens the sentence ("Although it rained all day,"). D is also punctuated correctly but B creates a more logical complex sentence.', 'LANG.SENT.006'),
    ]
  },
  {
    number: 3, title: 'Parallel Structure', gedCode: 'RLA.4.6',
    keyTerms: ['parallel structure', 'parallel form', 'series', 'correlative conjunctions'],
    content: `PARALLEL STRUCTURE

Parallel structure means using the same grammatical form for items in a list or paired ideas.

INCORRECT: "She likes hiking, to swim, and running."
CORRECT: "She likes hiking, swimming, and running." (all -ing gerunds)

INCORRECT: "The job requires accuracy, being fast, and that you are organized."
CORRECT: "The job requires accuracy, speed, and organization." (all nouns)

WITH PAIRED CONJUNCTIONS (both/and, either/or, neither/nor, not only/but also):
• "She is not only intelligent but also hardworking." ✓
• "She is not only intelligent but also works hard." ✗

TIP: When you see a list or paired items on the GED, check that each element uses the same grammatical form.`,
    practiceQuestions: [
      mcq('RLA9', 'RLA.4.6', 'foundational',
        'Which sentence uses parallel structure correctly?',
        'He enjoys reading, to cook, and gardening.',
        'The new employee was trained, organized, and completes tasks efficiently.',
        'She bought bread, milk, and some eggs from the store.',
        'They plan to hike, to swim, and to climb the mountain.',
        'D', 'D uses "to + verb" (infinitive) consistently throughout. A mixes gerund and infinitive, B shifts from adjectives to a verb phrase, C mixes nouns and a phrase.', 'LANG.SENT.006'),
    ]
  },
];

const RLA_CH8_LESSONS: GEDLesson[] = [
  {
    number: 1, title: 'Noun and Pronoun Agreement', gedCode: 'RLA.8.1',
    keyTerms: ['antecedent', 'pronoun-antecedent agreement', 'singular', 'plural', 'indefinite pronoun'],
    content: `NOUN AND PRONOUN AGREEMENT

Pronouns must agree with their antecedents (the nouns they replace) in:
• NUMBER (singular/plural)
• GENDER (he/she/they)
• PERSON (I/you/he/they)

BASIC RULES:
• Singular antecedent → singular pronoun: "Each student must submit his or her paper."
• Plural antecedent → plural pronoun: "The students must submit their papers."

TRICKY INDEFINITE PRONOUNS:
• Always singular: each, every, anyone, someone, no one, nobody, everybody, anyone, either, neither
  → "Everyone must bring their own lunch." (note: "their" is now accepted as singular by most style guides)
• Always plural: both, few, many, several, others
• Either: all, some, none, any (depends on context)

COLLECTIVE NOUNS: Usually treated as singular in American English
• "The team won its championship." (not "their")`,
    practiceQuestions: [
      mcq('RLA10', 'RLA.8.1', 'foundational',
        '"Each of the students must complete ___ homework by Friday." Which pronoun correctly fills the blank?',
        'their',
        'its',
        'his or her',
        'our',
        'C', '"Each" is an indefinite pronoun that takes a singular pronoun. "His or her" is the traditional singular form; "their" is increasingly accepted but C is most clearly correct in a formal test context.', 'LANG.GRAM.005'),
      mcq('RLA10', 'RLA.8.1', 'standard',
        'Which sentence has correct pronoun-antecedent agreement?',
        'The committee made their decision after hours of debate.',
        'Neither of the candidates submitted their application on time.',
        'The team celebrated their victory with a parade.',
        'The company announced its new policy last Thursday.',
        'D', '"Company" is a singular collective noun taking the singular "its." Options A and C use "their" with collective nouns (debatable but often flagged on GED). B uses "their" with "neither" which requires singular.', 'LANG.GRAM.005'),
    ]
  },
  {
    number: 2, title: 'Subject-Verb Agreement', gedCode: 'RLA.8.3',
    keyTerms: ['subject-verb agreement', 'intervening phrase', 'compound subject', 'collective noun'],
    content: `SUBJECT-VERB AGREEMENT

The verb must agree with the subject in number (singular/plural).

BASIC: Singular subject → singular verb (add -s); Plural subject → plural verb (no -s)
• "The dog runs." / "The dogs run."

INTERVENING PHRASES don't change subject number:
• "The box of chocolates sits on the table." (subject = box, not chocolates)

COMPOUND SUBJECTS:
• Joined by AND → plural: "The dog and cat are..."
• Joined by OR/NOR → verb agrees with closest subject: "Neither the cats nor the dog is..."

INDEFINITE PRONOUN SUBJECTS:
• Singular: everyone, no one, each, either, neither → takes singular verb
• Plural: both, many, several, few → takes plural verb

INVERTED SENTENCES (verb before subject):
• "There are three cats." (subject = cats, verb = are)`,
    practiceQuestions: [
      mcq('RLA11', 'RLA.8.3', 'foundational',
        '"The list of requirements ___ been updated." Which verb form is correct?',
        'have',
        'has',
        'were',
        'are',
        'B', 'The subject is "list" (singular), not "requirements." The intervening phrase "of requirements" doesn\'t change the subject. Singular "has" is correct.', 'LANG.GRAM.005'),
      mcq('RLA11', 'RLA.8.3', 'standard',
        '"Neither the director nor the producers ___ approved the final cut." Which verb is correct?',
        'has',
        'have',
        'was',
        'were',
        'B', 'With "neither...nor," the verb agrees with the closest subject — "producers" (plural). So the plural "have" is correct.', 'LANG.GRAM.005'),
    ]
  },
];

const RLA_CH9_LESSONS: GEDLesson[] = [
  {
    number: 1, title: 'Comma Use', gedCode: 'RLA.9.1',
    keyTerms: ['comma', 'introductory clause', 'series comma', 'Oxford comma', 'nonessential clause'],
    content: `COMMA USE

1. INTRODUCTORY ELEMENTS: comma after an introductory clause, phrase, or word
   • "After the storm, the streets were flooded."
   • "Unfortunately, the results were negative."

2. ITEMS IN A SERIES: commas between items in a list of three or more
   • "She bought eggs, milk, and bread." (Oxford/serial comma before "and" is preferred on GED)

3. COMPOUND SENTENCES: comma before coordinating conjunction (FANBOYS)
   • "I wanted to go, but I was too tired."

4. NONESSENTIAL CLAUSES/PHRASES: commas around information that can be removed
   • "My brother, who lives in Denver, is visiting this weekend."
   • Remove: "My brother is visiting this weekend." (still makes sense → nonessential)

5. DIRECT ADDRESS: "Come here, Marcus."

DO NOT use commas to:
• Separate subject from verb: "The old house, was sold." ✗
• Join two independent clauses without a conjunction (comma splice)`,
    practiceQuestions: [
      mcq('RLA12', 'RLA.9.1', 'foundational',
        'Which sentence uses commas correctly?',
        'She ran to the store, and, bought milk and eggs.',
        'After finishing her shift, Maria drove home.',
        'The dog, barked loudly at the stranger.',
        'He was tired but, he finished the report.',
        'B', 'B correctly uses a comma after the introductory phrase "After finishing her shift." A adds unnecessary commas around "and," C incorrectly separates subject and verb, D places the comma incorrectly.', 'LANG.GRAM.005'),
      mcq('RLA12', 'RLA.9.1', 'standard',
        '"The president who was elected in 2008 introduced new healthcare legislation." This sentence:',
        'Needs commas around "who was elected in 2008" because it is nonessential.',
        'Is correct as written because the clause is essential to identifying which president.',
        'Needs a comma after "president."',
        'Should have a semicolon instead of no punctuation.',
        'B', 'The clause "who was elected in 2008" identifies WHICH president — making it essential (restrictive). Essential clauses do not get commas.', 'LANG.GRAM.005'),
    ]
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MATHEMATICAL REASONING
// ─────────────────────────────────────────────────────────────────────────────

const MATH_CH3_LESSONS: GEDLesson[] = [
  {
    number: 1, title: 'Ratio and Proportion', gedCode: 'MATH.3.1',
    keyTerms: ['ratio', 'rate', 'proportion', 'cross-multiply', 'unit rate'],
    content: `RATIO AND PROPORTION

RATIO: comparison of two quantities using division
• Can be written as a:b, a/b, or "a to b"
• Example: 3 red balls to 5 blue balls = 3:5 = 3/5

UNIT RATE: a ratio with a denominator of 1
• 240 miles in 4 hours → 240÷4 = 60 miles per hour

PROPORTION: two equal ratios
• Set up: a/b = c/d
• Cross-multiply to solve: a×d = b×c

EXAMPLE: If 3 pounds of apples cost $4.50, how much do 7 pounds cost?
• 3/4.50 = 7/x → cross multiply: 3x = 31.50 → x = $10.50

SCALE: map/drawing distance ÷ actual distance
• Scale 1:50 means 1 unit on drawing = 50 units in reality`,
    practiceQuestions: [
      mcq('MATH3', 'MATH.3.1', 'foundational',
        'A car travels 180 miles in 3 hours. What is its speed in miles per hour?',
        '60 mph', '54 mph', '72 mph', '90 mph',
        'A', '180 ÷ 3 = 60 miles per hour. This is a unit rate calculation.', 'MATH.RATIO.003'),
      mcq('MATH3', 'MATH.3.1', 'standard',
        'If 5 shirts cost $85, how much do 8 shirts cost at the same rate?',
        '$100', '$120', '$136', '$160',
        'C', '5/85 = 8/x → 5x = 680 → x = $136. Cross-multiply and solve.', 'MATH.RATIO.003'),
      mcq('MATH3', 'MATH.3.1', 'standard',
        'On a map, 1 inch represents 50 miles. Two cities are 3.5 inches apart on the map. What is the actual distance?',
        '150 miles', '175 miles', '200 miles', '53.5 miles',
        'B', '3.5 × 50 = 175 miles. Multiply the map distance by the scale factor.', 'MATH.RATIO.003'),
    ]
  },
  {
    number: 2, title: 'Percents', gedCode: 'MATH.3.2',
    keyTerms: ['percent', 'part', 'whole', 'percent formula', 'percent change'],
    content: `PERCENTS

THE PERCENT FORMULA: Part = Percent × Whole (Part = % × Whole)
Rearranged:
• Percent = Part ÷ Whole (× 100)
• Whole = Part ÷ Percent

EXAMPLE: What is 35% of 80?
• Part = 0.35 × 80 = 28

PERCENT CHANGE:
• % change = (New - Old) ÷ Old × 100
• Positive = increase; Negative = decrease

EXAMPLE: Price rose from $50 to $65.
• (65 - 50) ÷ 50 = 15/50 = 0.30 = 30% increase

SIMPLE INTEREST: I = P × r × t
• P = principal, r = rate (decimal), t = time (years)
• $500 at 4% for 3 years: I = 500 × 0.04 × 3 = $60`,
    practiceQuestions: [
      mcq('MATH4', 'MATH.3.2', 'foundational',
        'What is 40% of 250?',
        '90', '100', '110', '40',
        'B', 'Part = 0.40 × 250 = 100. Convert percent to decimal (40% = 0.40) then multiply.', 'MATH.PERC.004'),
      mcq('MATH4', 'MATH.3.2', 'standard',
        'A jacket originally costs $120 and is on sale for $90. What is the percent decrease?',
        '20%', '25%', '30%', '33%',
        'B', '(120 - 90) ÷ 120 = 30/120 = 0.25 = 25% decrease.', 'MATH.PERC.004'),
      mcq('MATH4', 'MATH.3.2', 'standard',
        '18 students in a class of 30 are female. What percent are female?',
        '52%', '60%', '65%', '18%',
        'B', 'Percent = 18 ÷ 30 = 0.60 = 60%.', 'MATH.PERC.004'),
      mcq('MATH4', 'MATH.3.2', 'extended',
        '$800 is invested at 5% annual simple interest for 4 years. What is the total amount?',
        '$880', '$960', '$1,000', '$1,040',
        'B', 'I = 800 × 0.05 × 4 = $160 interest. Total amount = $800 + $160 = $960.', 'MATH.PERC.004'),
    ]
  },
];

const MATH_CH5_LESSONS: GEDLesson[] = [
  {
    number: 1, title: 'Algebraic Expressions', gedCode: 'MATH.5.1',
    keyTerms: ['variable', 'coefficient', 'term', 'like terms', 'expression', 'evaluate'],
    content: `ALGEBRAIC EXPRESSIONS

TERMS OF AN EXPRESSION:
• Variable: a letter representing an unknown (x, y, n)
• Coefficient: the number multiplying a variable (in 3x, coefficient = 3)
• Constant: a number alone (in 3x + 7, the constant = 7)
• Term: a single number, variable, or their product (3x, -2y², 5)

LIKE TERMS: same variable(s) to the same power
• 3x and 7x are like terms → combine: 10x
• 3x and 3x² are NOT like terms

SIMPLIFYING (combining like terms):
• 4x + 3y - 2x + y = (4x - 2x) + (3y + y) = 2x + 4y

EVALUATING: substituting a value for the variable
• Evaluate 3x² - 2x + 1 when x = 3:
• 3(3²) - 2(3) + 1 = 3(9) - 6 + 1 = 27 - 6 + 1 = 22

DISTRIBUTIVE PROPERTY: a(b + c) = ab + ac
• 3(2x - 5) = 6x - 15`,
    practiceQuestions: [
      mcq('MATH5', 'MATH.5.1', 'foundational',
        'Simplify: 5x + 3 - 2x + 7',
        '3x + 10', '7x + 10', '3x + 4', '10x + 10',
        'A', 'Combine like terms: (5x - 2x) + (3 + 7) = 3x + 10.', 'MATH.ALGE.005'),
      mcq('MATH5', 'MATH.5.1', 'standard',
        'Evaluate 2x² - 3x + 4 when x = -2.',
        '14', '18', '-4', '6',
        'B', '2(-2)² - 3(-2) + 4 = 2(4) + 6 + 4 = 8 + 6 + 4 = 18.', 'MATH.ALGE.005'),
      mcq('MATH5', 'MATH.5.1', 'standard',
        'Simplify: -2(3x - 4) + 5x',
        '-x + 8', '-x - 8', 'x + 8', '11x - 8',
        'A', 'Distribute: -6x + 8 + 5x = -x + 8.', 'MATH.ALGE.005'),
    ]
  },
  {
    number: 4, title: 'Order of Operations', gedCode: 'MATH.5.4',
    keyTerms: ['PEMDAS', 'GEMDAS', 'order of operations', 'parentheses', 'exponents'],
    content: `ORDER OF OPERATIONS — PEMDAS

P — Parentheses (and all grouping symbols: brackets, absolute value)
E — Exponents (powers, roots)
M/D — Multiplication and Division (left to right, equal priority)
A/S — Addition and Subtraction (left to right, equal priority)

Example: 3 + 4 × 2² ÷ (8 - 6)
Step 1 (Parentheses): 8 - 6 = 2 → 3 + 4 × 2² ÷ 2
Step 2 (Exponents): 2² = 4 → 3 + 4 × 4 ÷ 2
Step 3 (Mult/Div L→R): 4 × 4 = 16; 16 ÷ 2 = 8 → 3 + 8
Step 4 (Add): 3 + 8 = 11

NESTED PARENTHESES: work from innermost outward
3 × [2 + (8 - 3)] = 3 × [2 + 5] = 3 × 7 = 21`,
    practiceQuestions: [
      mcq('MATH6', 'MATH.5.4', 'foundational',
        'Evaluate: 2 + 3 × 4',
        '20', '14', '24', '10',
        'B', 'Multiplication before addition: 3 × 4 = 12; 2 + 12 = 14. Not (2+3)×4 = 20.', 'MATH.ALGE.005'),
      mcq('MATH6', 'MATH.5.4', 'standard',
        'Evaluate: (6 + 2)² ÷ 4 - 3',
        '13', '9', '5', '1',
        'A', 'Parentheses: 6+2=8; Exponent: 8²=64; Division: 64÷4=16; Subtraction: 16-3=13.', 'MATH.ALGE.005'),
    ]
  },
];

const MATH_CH6_LESSONS: GEDLesson[] = [
  {
    number: 1, title: 'Solving Linear Equations', gedCode: 'MATH.6.1',
    keyTerms: ['equation', 'solve', 'isolate', 'inverse operations', 'balance'],
    content: `SOLVING LINEAR EQUATIONS

Goal: isolate the variable on one side using inverse (opposite) operations.

INVERSE OPERATIONS:
• Addition ↔ Subtraction
• Multiplication ↔ Division

STEPS:
1. Distribute if needed
2. Combine like terms on each side
3. Add/subtract to get variable terms on one side
4. Multiply/divide to isolate the variable
5. Check: substitute back into original

EXAMPLE: Solve 3x - 7 = 2x + 5
• 3x - 2x = 5 + 7
• x = 12

EXAMPLE: Solve 2(x + 3) = 14
• 2x + 6 = 14
• 2x = 8
• x = 4`,
    practiceQuestions: [
      mcq('MATH7', 'MATH.6.1', 'foundational',
        'Solve: 4x - 8 = 12',
        'x = 1', 'x = 5', 'x = 4', 'x = 6',
        'B', '4x = 12 + 8 = 20; x = 20/4 = 5.', 'MATH.LINEQ.006'),
      mcq('MATH7', 'MATH.6.1', 'standard',
        'Solve: 3(x - 2) = 2x + 7',
        'x = 7', 'x = 11', 'x = 13', 'x = 3',
        'C', '3x - 6 = 2x + 7; 3x - 2x = 7 + 6; x = 13.', 'MATH.LINEQ.006'),
      mcq('MATH7', 'MATH.6.1', 'standard',
        'The equation 5 - 2x = 15 has solution:',
        'x = -5', 'x = 5', 'x = 10', 'x = -10',
        'A', '-2x = 15 - 5 = 10; x = 10 ÷ -2 = -5.', 'MATH.LINEQ.006'),
    ]
  },
  {
    number: 7, title: 'Graphing Lines and Slope', gedCode: 'MATH.6.7',
    keyTerms: ['slope', 'y-intercept', 'slope-intercept form', 'rise over run', 'coordinate plane'],
    content: `GRAPHING LINES AND SLOPE

SLOPE: measures steepness of a line
• m = rise/run = (y₂ - y₁) / (x₂ - x₁)
• Positive slope: rises left to right
• Negative slope: falls left to right
• Zero slope: horizontal line
• Undefined slope: vertical line

SLOPE-INTERCEPT FORM: y = mx + b
• m = slope, b = y-intercept (where line crosses y-axis)

EXAMPLE: y = 2x + 3
• Slope = 2, y-intercept = 3
• Start at (0, 3), go up 2, right 1

FINDING SLOPE from two points (2, 5) and (6, 13):
• m = (13 - 5) / (6 - 2) = 8/4 = 2

STANDARD FORM: Ax + By = C → convert to slope-intercept
• 2x + 3y = 12 → 3y = -2x + 12 → y = -2/3 x + 4`,
    practiceQuestions: [
      mcq('MATH8', 'MATH.6.7', 'standard',
        'What is the slope of the line passing through (1, 3) and (4, 9)?',
        '2', '3', '6', '1/2',
        'A', 'm = (9-3)/(4-1) = 6/3 = 2.', 'MATH.LINEQ.006'),
      mcq('MATH8', 'MATH.6.7', 'standard',
        'A line has equation y = -3x + 7. What is its y-intercept?',
        '-3', '3', '7', '-7',
        'C', 'In y = mx + b, b is the y-intercept. Here b = 7.', 'MATH.LINEQ.006'),
      mcq('MATH8', 'MATH.6.7', 'extended',
        'Which equation represents a line parallel to y = 2x - 5?',
        'y = -2x + 3', 'y = 1/2x + 1', 'y = 2x + 8', 'y = -1/2x - 5',
        'C', 'Parallel lines have equal slopes. The original slope is 2; y = 2x + 8 also has slope 2 but a different y-intercept.', 'MATH.LINEQ.006'),
    ]
  },
];

const MATH_CH7_LESSONS: GEDLesson[] = [
  {
    number: 1, title: 'Triangles and Pythagorean Theorem', gedCode: 'MATH.7.3',
    keyTerms: ['right triangle', 'hypotenuse', 'legs', 'Pythagorean theorem', 'a² + b² = c²'],
    content: `TRIANGLES AND THE PYTHAGOREAN THEOREM

TRIANGLE BASICS:
• Sum of interior angles = 180°
• Types: equilateral (all sides equal), isosceles (2 equal), scalene (all different)
• Right triangle: one 90° angle

PYTHAGOREAN THEOREM (right triangles only):
a² + b² = c²  where c = hypotenuse (longest side, opposite 90° angle)

FINDING THE HYPOTENUSE:
• Legs: 3 and 4 → c² = 9 + 16 = 25 → c = 5

FINDING A LEG:
• Hypotenuse 13, one leg 5 → 5² + b² = 13² → 25 + b² = 169 → b² = 144 → b = 12

COMMON PYTHAGOREAN TRIPLES (memorize):
• 3-4-5, 5-12-13, 8-15-17, 6-8-10, 9-40-41`,
    practiceQuestions: [
      mcq('MATH9', 'MATH.7.3', 'foundational',
        'A right triangle has legs of 6 and 8. What is the length of the hypotenuse?',
        '10', '12', '14', '√100 + √2',
        'A', '6² + 8² = 36 + 64 = 100; √100 = 10. This is the 6-8-10 Pythagorean triple.', 'MATH.GEOM.008'),
      mcq('MATH9', 'MATH.7.3', 'standard',
        'A ladder 13 feet long leans against a wall. Its base is 5 feet from the wall. How high up the wall does it reach?',
        '8 feet', '12 feet', '10 feet', '11 feet',
        'B', '5² + b² = 13² → 25 + b² = 169 → b² = 144 → b = 12. (5-12-13 triple)', 'MATH.GEOM.008'),
    ]
  },
  {
    number: 4, title: 'Area and Perimeter', gedCode: 'MATH.7.4',
    keyTerms: ['area', 'perimeter', 'rectangle', 'triangle', 'circle', 'composite figure'],
    content: `AREA AND PERIMETER

PERIMETER = total distance around a figure (add all sides)
AREA = amount of space inside a figure

KEY FORMULAS:
• Rectangle: A = l×w, P = 2l + 2w
• Square: A = s², P = 4s
• Triangle: A = ½bh, P = sum of all sides
• Circle: A = πr², Circumference = 2πr (use π ≈ 3.14 or the calculator's π)
• Parallelogram: A = bh
• Trapezoid: A = ½(b₁ + b₂)h

COMPOSITE FIGURES: Break into simpler shapes, add (or subtract) areas.
Example: L-shaped figure = large rectangle - missing corner rectangle

GED FORMULA SHEET: will be provided during the test — don't memorize, know how to USE them.`,
    practiceQuestions: [
      mcq('MATH10', 'MATH.7.4', 'foundational',
        'A rectangle has length 12 cm and width 5 cm. What is its area?',
        '34 cm²', '60 cm²', '70 cm²', '17 cm²',
        'B', 'A = l × w = 12 × 5 = 60 cm².', 'MATH.AREA.009'),
      mcq('MATH10', 'MATH.7.4', 'standard',
        'A circle has radius 7 cm. What is its area? (Use π ≈ 3.14)',
        '43.96 cm²', '153.86 cm²', '21.98 cm²', '49 cm²',
        'B', 'A = π × r² = 3.14 × 49 = 153.86 cm².', 'MATH.AREA.009'),
      mcq('MATH10', 'MATH.7.4', 'extended',
        'A triangle has base 10 m and height 6 m. A square with side 4 m is cut from its interior. What is the remaining area?',
        '14 m²', '30 m²', '46 m²', 'cannot be determined',
        'A', 'Triangle area: ½ × 10 × 6 = 30 m². Square area: 4² = 16 m². Remaining: 30 - 16 = 14 m².', 'MATH.AREA.009'),
    ]
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SOCIAL STUDIES
// ─────────────────────────────────────────────────────────────────────────────

const SS_CH2_LESSONS: GEDLesson[] = [
  {
    number: 1, title: 'Exploration, Colonialism, and the Revolution', gedCode: 'SS.2.1',
    keyTerms: ['colonialism', 'Enlightenment', 'Declaration of Independence', 'Articles of Confederation'],
    content: `U.S. HISTORY: EXPLORATION TO REVOLUTION

EUROPEAN EXPLORATION (1400s–1600s):
• Columbus 1492: opened Americas to European colonization
• Spain, France, England established colonies for land, resources, trade routes
• Native American populations devastated by disease and conflict

COLONIAL PERIOD (1607–1776):
• 13 British colonies along Atlantic coast; economies varied by region
• New England: fishing, trade, manufacturing
• Middle: diverse farming, commerce
• Southern: plantation agriculture (tobacco, cotton) using enslaved labor

ENLIGHTENMENT IDEAS fueling revolution:
• John Locke: natural rights (life, liberty, property), social contract, consent of governed
• Montesquieu: separation of powers
• Rousseau: popular sovereignty

ROAD TO REVOLUTION:
• Taxation without representation (Stamp Act, Townshend Acts)
• Boston Massacre (1770), Boston Tea Party (1773)
• First/Second Continental Congress

DECLARATION OF INDEPENDENCE (1776):
• Jefferson's draft based on Lockean philosophy
• Key grievances against King George III
• "All men are created equal" — contradicted by existence of slavery`,
    practiceQuestions: [
      mcq('SS1', 'SS.2.1', 'foundational',
        'John Locke\'s political philosophy primarily influenced the Declaration of Independence through the idea that:',
        'Government should have absolute power to maintain order.',
        'People have natural rights that government should protect.',
        'Only landowners should have political representation.',
        'Military power is the foundation of national security.',
        'B', 'Locke argued for natural rights (life, liberty, property) and that governments derive authority from consent of the governed — ideas directly echoed in the Declaration.', 'SOC.USHIST.001'),
      mcq('SS1', 'SS.2.1', 'standard',
        'The phrase "no taxation without representation" referred to colonists\' objection that:',
        'Tax rates in the colonies were higher than in Britain.',
        'They had no elected representatives in the British Parliament.',
        'Congress had not approved the new taxes.',
        'Only wealthy colonists were required to pay taxes.',
        'B', 'Colonists argued that Parliament had no right to tax them because the colonies had no seats in Parliament — the concept of representative government.', 'SOC.USHIST.001'),
    ]
  },
  {
    number: 3, title: 'Industrialization and the Progressive Era', gedCode: 'SS.2.3',
    keyTerms: ['industrialization', 'labor movement', 'Progressive Era', 'trust', 'muckraker', 'suffrage'],
    content: `INDUSTRIALIZATION AND THE PROGRESSIVE ERA

INDUSTRIALIZATION (1865–1900):
• Railroads connected national market; steel, oil industries grew rapidly
• "Robber barons": Carnegie (steel), Rockefeller (oil), Vanderbilt (railroads)
• Rise of corporations and monopolies (trusts)
• Mass immigration fueled factory labor force

WORKING CONDITIONS:
• 12-14 hour days, child labor, dangerous conditions
• No minimum wage, no workers' compensation
• Triangle Shirtwaist Factory fire (1911): 146 deaths → factory reform

PROGRESSIVE ERA (1890–1920) — reformers addressing industrial abuses:
• Muckrakers: investigative journalists (Upton Sinclair "The Jungle," Ida Tarbell)
• Antitrust legislation: Sherman Antitrust Act (1890)
• Labor unions: AFL (American Federation of Labor) founded 1886
• Women's suffrage: 19th Amendment (1920)
• Direct democracy: 17th Amendment (direct Senate election), initiative, referendum`,
    practiceQuestions: [
      mcq('SS2', 'SS.2.3', 'standard',
        'What was the primary goal of "muckrakers" during the Progressive Era?',
        'To promote industrial growth and economic expansion.',
        'To expose corruption and social problems through investigative journalism.',
        'To advocate for American military expansion abroad.',
        'To oppose immigration from Southern and Eastern Europe.',
        'B', 'Muckrakers like Upton Sinclair and Ida Tarbell used journalism to expose unsafe conditions, corporate corruption, and social injustice to pressure lawmakers.', 'SOC.USHIST.001'),
    ]
  },
];

const SS_CH3_LESSONS: GEDLesson[] = [
  {
    number: 2, title: 'Constitutional Government', gedCode: 'SS.3.2',
    keyTerms: ['Constitution', 'Bill of Rights', 'amendment', 'separation of powers', 'checks and balances', 'federalism'],
    content: `CONSTITUTIONAL GOVERNMENT

THE U.S. CONSTITUTION (1787):
• Framework for federal government; replaced the Articles of Confederation
• Preamble: "We the People" — popular sovereignty
• 7 Articles establishing the three branches

SEPARATION OF POWERS:
• Legislative (Congress): makes laws; House + Senate
• Executive (President): enforces laws
• Judicial (Supreme Court): interprets laws

CHECKS AND BALANCES: each branch limits the others
• Congress can override a presidential veto (2/3 majority)
• President nominates federal judges; Senate confirms
• Supreme Court can declare laws unconstitutional (judicial review — Marbury v. Madison, 1803)

FEDERALISM: power divided between federal and state governments
• Supremacy Clause: federal law overrides conflicting state law
• 10th Amendment: powers not given to federal government reserved to states

BILL OF RIGHTS (First 10 Amendments, 1791):
• 1st: freedom of religion, speech, press, assembly, petition
• 2nd: right to bear arms
• 4th: protection from unreasonable searches and seizures
• 5th: due process, protection from self-incrimination
• 6th: right to speedy trial, legal counsel
• 8th: no cruel and unusual punishment`,
    practiceQuestions: [
      mcq('SS3', 'SS.3.2', 'foundational',
        'Which branch of government has the power to declare a law unconstitutional?',
        'Legislative', 'Executive', 'Judicial', 'Federal',
        'C', 'The Supreme Court (judicial branch) exercises judicial review — the power to strike down laws that violate the Constitution, established in Marbury v. Madison (1803).', 'SOC.CIV.002'),
      mcq('SS3', 'SS.3.2', 'standard',
        'The 10th Amendment to the U.S. Constitution primarily:',
        'Grants Congress broad power to regulate commerce.',
        'Reserves powers not delegated to the federal government to the states.',
        'Establishes the Supreme Court\'s authority over state courts.',
        'Requires states to follow all federal laws.',
        'B', 'The 10th Amendment is a core federalism principle: powers not explicitly given to the federal government belong to the states or the people.', 'SOC.CIV.002'),
      mcq('SS3', 'SS.3.2', 'extended',
        'A state passes a law legalizing a substance that federal law prohibits. Under the Supremacy Clause:',
        'The state law overrides federal law since states have sovereignty.',
        'Both laws apply and citizens must follow whichever is stricter.',
        'The federal law takes precedence; the state law is invalid.',
        'Courts must hold a referendum to determine which law applies.',
        'C', 'The Supremacy Clause (Article VI) establishes that federal law is "the supreme law of the land," overriding conflicting state laws.', 'SOC.CIV.002'),
    ]
  },
];

const SS_CH4_LESSONS: GEDLesson[] = [
  {
    number: 1, title: 'Basic Economics Concepts', gedCode: 'SS.4.1',
    keyTerms: ['supply', 'demand', 'price', 'market', 'scarcity', 'opportunity cost', 'incentive'],
    content: `BASIC ECONOMICS CONCEPTS

SCARCITY: resources are limited; wants are unlimited → forces choices
OPPORTUNITY COST: value of the best alternative you give up when making a choice
• If you spend $500 on a vacation instead of investing it, the opportunity cost is the investment return.

SUPPLY AND DEMAND:
• Law of Demand: as price rises, quantity demanded falls (inverse relationship)
• Law of Supply: as price rises, quantity supplied rises (direct relationship)
• Equilibrium: where supply curve meets demand curve (market-clearing price)

MARKET STRUCTURES:
• Perfect competition: many sellers, identical goods, free entry (agriculture)
• Monopoly: one seller controls the market
• Oligopoly: few dominant firms (airlines, telecom)
• Monopolistic competition: many sellers with differentiated products (restaurants)

ECONOMIC INDICATORS:
• GDP (Gross Domestic Product): total value of goods/services produced
• Inflation: general rise in price levels
• Unemployment rate: percent of labor force without jobs`,
    practiceQuestions: [
      mcq('SS4', 'SS.4.1', 'foundational',
        'When the price of a good rises and demand for it falls, this illustrates:',
        'The Law of Supply.',
        'Market equilibrium.',
        'The Law of Demand.',
        'An economic monopoly.',
        'C', 'The Law of Demand states that price and quantity demanded have an inverse relationship — as price rises, consumers buy less.', 'SOC.ECON.003'),
      mcq('SS4', 'SS.4.1', 'standard',
        'A student chooses to go to college instead of working full-time. The opportunity cost is:',
        'The cost of college tuition.',
        'The salary and work experience foregone by not working full-time.',
        'The student\'s expected future income after graduation.',
        'The government\'s spending on student financial aid.',
        'B', 'Opportunity cost is the value of the next-best alternative not chosen. By choosing college, the student foregoes the income and experience they would have gained from working.', 'SOC.ECON.003'),
    ]
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SCIENCE
// ─────────────────────────────────────────────────────────────────────────────

const SCI_CH1_LESSONS: GEDLesson[] = [
  {
    number: 2, title: 'The Scientific Method', gedCode: 'SCI.1.2',
    keyTerms: ['hypothesis', 'variable', 'control group', 'experimental group', 'conclusion', 'replication'],
    content: `THE SCIENTIFIC METHOD

STEPS:
1. Observation: notice a phenomenon or question
2. Hypothesis: testable prediction ("If..., then...")
3. Experiment: test the hypothesis
4. Data collection: measure and record results
5. Analysis: look for patterns
6. Conclusion: does data support or refute hypothesis?

EXPERIMENTAL DESIGN:
• Independent variable (IV): what the researcher changes
• Dependent variable (DV): what is measured (the outcome)
• Control group: no treatment applied; baseline for comparison
• Experimental group: receives the treatment
• Constants: everything else kept the same

EXAMPLE: Testing whether a fertilizer increases plant growth
• IV: fertilizer (added or not)
• DV: plant height after 4 weeks
• Control: plants without fertilizer
• Constants: same pots, soil, light, water

VALIDITY and RELIABILITY:
• Valid: test actually measures what it claims to measure
• Reliable: results are consistent and repeatable`,
    practiceQuestions: [
      mcq('SCI1', 'SCI.1.2', 'foundational',
        'In an experiment testing whether caffeine improves reaction time, what is the dependent variable?',
        'The amount of caffeine given.',
        'The age of the participants.',
        'The participants\' reaction times.',
        'The type of beverage used.',
        'C', 'The dependent variable is what is MEASURED as the outcome. Caffeine (IV) is what the researcher controls; reaction time (DV) is the measured result.', 'SCI.SCI.001'),
      mcq('SCI1', 'SCI.1.2', 'standard',
        'A researcher gives a new drug to 100 patients and a placebo to 100 other patients. The group receiving the placebo is:',
        'The experimental group.',
        'The independent variable.',
        'The control group.',
        'The dependent variable.',
        'C', 'The control group receives no treatment (or a placebo) and provides the baseline against which to compare the experimental group\'s results.', 'SCI.SCI.001'),
      mcq('SCI1', 'SCI.1.2', 'extended',
        'A scientist tests a new drug on 5 patients and concludes it is effective for everyone. What is the main flaw?',
        'The hypothesis was not stated before the experiment.',
        'The sample size of 5 is too small to draw a reliable conclusion.',
        'The scientist should have used animals instead of humans.',
        'No placebo group was mentioned.',
        'B', 'A sample size of 5 is far too small to generalize to all patients. Scientific conclusions require sufficiently large, representative samples to be reliable and valid.', 'SCI.EXP.006'),
    ]
  },
  {
    number: 5, title: 'Using Statistics and Probability in Science', gedCode: 'SCI.1.5',
    keyTerms: ['mean', 'median', 'mode', 'probability', 'data distribution', 'percent error'],
    content: `STATISTICS AND PROBABILITY IN SCIENCE

DESCRIPTIVE STATISTICS:
• Mean (average): sum of values ÷ number of values
• Median: middle value when data is ordered
• Mode: most frequently occurring value
• Range: maximum - minimum

WHEN TO USE WHICH:
• Mean: normally distributed data, no extreme outliers
• Median: skewed data or when outliers are present
• Mode: categorical data or most common value

PROBABILITY:
• P(event) = favorable outcomes ÷ total possible outcomes
• P ranges from 0 (impossible) to 1 (certain)
• P(A and B) = P(A) × P(B) for independent events
• P(A or B) = P(A) + P(B) - P(A and B)

PERCENT ERROR:
• % error = |measured - actual| ÷ actual × 100%
• Smaller = more accurate measurement`,
    practiceQuestions: [
      mcq('SCI2', 'SCI.1.5', 'foundational',
        'A scientist records the following temperatures (°C): 22, 25, 23, 22, 28. What is the mean?',
        '22°C', '23°C', '24°C', '25°C',
        'C', 'Mean = (22 + 25 + 23 + 22 + 28) ÷ 5 = 120 ÷ 5 = 24°C.', 'MATH.STAT.011'),
      mcq('SCI2', 'SCI.1.5', 'standard',
        'A bag contains 4 red, 3 blue, and 3 green marbles. What is the probability of drawing a blue marble?',
        '3/10', '3/7', '1/3', '1/4',
        'A', 'P = 3 blue ÷ 10 total = 3/10 = 0.30 or 30%.', 'MATH.PROB.012'),
    ]
  },
];

const SCI_CH2_LESSONS: GEDLesson[] = [
  {
    number: 1, title: 'Cell Structures and Functions', gedCode: 'SCI.2.1',
    keyTerms: ['cell', 'nucleus', 'mitochondria', 'membrane', 'prokaryote', 'eukaryote', 'organelle'],
    content: `CELL STRUCTURES AND FUNCTIONS

THE CELL: basic unit of life

PROKARYOTES vs EUKARYOTES:
• Prokaryotes: no membrane-bound nucleus; bacteria and archaea
• Eukaryotes: have a membrane-bound nucleus; plants, animals, fungi

KEY ORGANELLES (animal cells):
• Cell membrane: controls what enters/exits the cell
• Nucleus: contains DNA; controls cell activity ("control center")
• Mitochondria: produce energy (ATP) via cellular respiration ("powerhouse")
• Ribosomes: make proteins
• Endoplasmic Reticulum (ER): transport network within cell
• Golgi apparatus: packages and ships proteins

PLANT CELLS — have these additional structures:
• Cell wall: rigid outer layer (cellulose); provides structural support
• Chloroplasts: conduct photosynthesis; contain chlorophyll
• Central vacuole: stores water; provides turgor pressure

CELL MEMBRANE — SELECTIVE PERMEABILITY:
• Phospholipid bilayer with embedded proteins
• Allows small/nonpolar molecules through; blocks large/charged molecules`,
    practiceQuestions: [
      mcq('SCI3', 'SCI.2.1', 'foundational',
        'Which organelle is responsible for producing energy (ATP) in a cell?',
        'Nucleus', 'Ribosomes', 'Mitochondria', 'Golgi apparatus',
        'C', 'Mitochondria perform cellular respiration, converting glucose and oxygen into ATP (adenosine triphosphate), the cell\'s energy currency.', 'SCI.LIFE.003'),
      mcq('SCI3', 'SCI.2.1', 'standard',
        'Which structure is found in plant cells but NOT in animal cells?',
        'Cell membrane', 'Mitochondria', 'Nucleus', 'Chloroplasts',
        'D', 'Chloroplasts conduct photosynthesis and are found only in plant cells (and algae). Animal cells lack both chloroplasts and cell walls.', 'SCI.LIFE.003'),
      mcq('SCI3', 'SCI.2.1', 'standard',
        'The cell membrane is described as "selectively permeable." This means:',
        'It allows all molecules to pass freely.',
        'It blocks all molecules from entering the cell.',
        'It controls which substances enter and exit the cell.',
        'It is a rigid structure that maintains cell shape.',
        'C', 'Selective permeability means the membrane allows some substances through while restricting others, based on size, charge, and lipid solubility.', 'SCI.LIFE.003'),
    ]
  },
  {
    number: 5, title: 'Genetics and Heredity', gedCode: 'SCI.2.5',
    keyTerms: ['DNA', 'gene', 'allele', 'dominant', 'recessive', 'Punnett square', 'phenotype', 'genotype'],
    content: `GENETICS AND HEREDITY

DNA AND GENES:
• DNA (deoxyribonucleic acid): molecule that carries genetic information
• Located in the nucleus; organized into chromosomes
• Gene: segment of DNA that codes for a specific trait
• Humans have ~23,000 genes on 23 pairs of chromosomes

ALLELES: different versions of the same gene
• Dominant allele (uppercase): expressed even if only one copy is present
• Recessive allele (lowercase): expressed only if two copies are present

GENOTYPE vs PHENOTYPE:
• Genotype: actual genetic makeup (e.g., Bb)
• Phenotype: observable trait (e.g., brown eyes)
• Homozygous: both alleles the same (BB or bb)
• Heterozygous: different alleles (Bb) = "carrier" for recessive

PUNNETT SQUARE: predicts offspring ratios
• Two Bb parents (brown eye gene, b = blue):
  BB  Bb
  Bb  bb
• 25% BB, 50% Bb, 25% bb → 75% brown eyes, 25% blue eyes`,
    practiceQuestions: [
      mcq('SCI4', 'SCI.2.5', 'standard',
        'Two parents are both carriers (Bb) for a recessive trait. What percent of offspring are expected to show the recessive phenotype?',
        '0%', '25%', '50%', '75%',
        'B', 'Punnett square of Bb × Bb: BB (25%), Bb (50%), bb (25%). Only bb shows the recessive phenotype = 25%.', 'SCI.LIFE.003'),
      mcq('SCI4', 'SCI.2.5', 'extended',
        'A plant has genotype TT (tall, dominant). Its pollen fertilizes a plant with genotype tt (short, recessive). What will all offspring\'s phenotype be?',
        'All short', 'All tall', '50% tall, 50% short', '75% tall, 25% short',
        'B', 'TT × tt: all offspring receive one T allele and one t allele = Tt (heterozygous). Since T is dominant, all offspring will be phenotypically tall.', 'SCI.LIFE.003'),
    ]
  },
];

const SCI_CH3_LESSONS: GEDLesson[] = [
  {
    number: 3, title: 'Weather and Climate', gedCode: 'SCI.3.3',
    keyTerms: ['weather', 'climate', 'greenhouse effect', 'atmosphere', 'water cycle', 'biome'],
    content: `WEATHER AND CLIMATE

WEATHER: short-term atmospheric conditions (today's temperature, rain)
CLIMATE: long-term average of weather patterns over decades in a region

EARTH'S ATMOSPHERE layers (inner to outer):
• Troposphere: weather occurs here; temperature decreases with altitude
• Stratosphere: ozone layer (absorbs UV radiation)
• Mesosphere: coldest layer
• Thermosphere: satellites orbit here; auroras occur

GREENHOUSE EFFECT:
• Sun's radiation heats Earth's surface
• Earth re-emits infrared radiation
• Greenhouse gases (CO₂, CH₄, H₂O vapor, N₂O) trap heat in atmosphere
• Natural greenhouse effect = life-sustaining warmth
• Enhanced greenhouse effect = global warming from human emissions

WATER CYCLE: evaporation → condensation → precipitation → runoff → infiltration → evaporation

CLIMATE ZONES:
• Tropical (near equator): hot, humid year-round
• Temperate (mid-latitudes): four seasons
• Polar (near poles): cold year-round`,
    practiceQuestions: [
      mcq('SCI5', 'SCI.3.3', 'foundational',
        'What is the primary difference between weather and climate?',
        'Weather happens outdoors; climate happens indoors.',
        'Weather describes long-term patterns; climate describes daily conditions.',
        'Weather describes short-term conditions; climate describes long-term averages.',
        'Weather only includes temperature; climate includes all variables.',
        'C', 'Weather = what\'s happening in the atmosphere now or in the short term. Climate = the statistical average of weather conditions over decades in a region.', 'SCI.EARTH.005'),
      mcq('SCI5', 'SCI.3.3', 'standard',
        'The greenhouse effect causes warming by:',
        'The ozone layer reflecting sunlight back into space.',
        'Greenhouse gases trapping heat radiated from Earth\'s surface.',
        'Volcanic emissions blocking incoming solar radiation.',
        'The ocean absorbing all infrared radiation from the sun.',
        'B', 'Greenhouse gases (CO₂, methane, etc.) absorb and re-emit infrared radiation, preventing heat from escaping to space — the mechanism of the greenhouse effect.', 'SCI.EARTH.005'),
    ]
  },
];

const SCI_CH4_LESSONS: GEDLesson[] = [
  {
    number: 1, title: 'Atoms and Matter', gedCode: 'SCI.4.1',
    keyTerms: ['atom', 'element', 'proton', 'neutron', 'electron', 'periodic table', 'compound', 'mixture'],
    content: `ATOMS AND MATTER

ATOM: smallest unit of an element that retains its properties
• Protons: positive charge; in nucleus; determines the element
• Neutrons: no charge; in nucleus; determines isotope
• Electrons: negative charge; orbit nucleus in shells

ATOMIC NUMBER = number of protons (unique to each element)
MASS NUMBER = protons + neutrons
ISOTOPES: same element, different number of neutrons (same atomic number, different mass number)

PERIODIC TABLE:
• Elements organized by atomic number
• Periods (rows): elements with same number of electron shells
• Groups (columns): elements with same number of valence electrons → similar properties
• Metals (left), Metalloids (middle), Nonmetals (right)

COMPOUNDS vs MIXTURES:
• Compound: chemically bonded elements; fixed ratio (H₂O, NaCl); properties differ from components
• Mixture: physically combined substances; can be separated; retain individual properties
• Solution: homogeneous mixture (evenly distributed, e.g., salt water)`,
    practiceQuestions: [
      mcq('SCI6', 'SCI.4.1', 'foundational',
        'What determines which element an atom belongs to?',
        'The number of neutrons in the nucleus.',
        'The number of electrons in the outer shell.',
        'The number of protons in the nucleus.',
        'The atom\'s total mass number.',
        'C', 'The atomic number (number of protons) uniquely identifies each element. Change the proton count and you change the element itself.', 'SCI.PHYS.004'),
      mcq('SCI6', 'SCI.4.1', 'standard',
        'Salt water is an example of a:',
        'Pure compound', 'Heterogeneous mixture', 'Solution (homogeneous mixture)', 'Chemical element',
        'C', 'Salt water is a solution — a homogeneous (evenly distributed) mixture of NaCl dissolved in H₂O. Its components can be separated by evaporation.', 'SCI.PHYS.004'),
      mcq('SCI6', 'SCI.4.1', 'extended',
        'Carbon-12 and Carbon-14 are both carbon atoms. They differ because:',
        'Carbon-14 has more protons.',
        'Carbon-14 has a different atomic number.',
        'Carbon-14 has more neutrons (2 more), making it a heavier isotope.',
        'Carbon-12 and Carbon-14 are completely different elements.',
        'C', 'Both are carbon (atomic number = 6, same protons). Carbon-12 has 6 neutrons; Carbon-14 has 8 neutrons. Same element, different isotopes.', 'SCI.PHYS.004'),
    ]
  },
  {
    number: 5, title: 'Motion and Forces', gedCode: 'SCI.4.5',
    keyTerms: ['force', 'Newton\'s laws', 'velocity', 'acceleration', 'gravity', 'friction'],
    content: `MOTION AND FORCES

MOTION DEFINITIONS:
• Speed: distance ÷ time (scalar)
• Velocity: speed + direction (vector)
• Acceleration: change in velocity ÷ time

NEWTON'S THREE LAWS OF MOTION:
1. Inertia: an object at rest stays at rest; an object in motion stays in motion unless acted on by a net force
2. F = ma (Force = mass × acceleration): larger force OR smaller mass = greater acceleration
3. For every action there is an equal and opposite reaction

GRAVITY:
• Attractive force between any two masses
• F = G(m₁m₂/d²): force depends on masses and distance squared
• On Earth: g ≈ 9.8 m/s² downward

FRICTION: force opposing motion between surfaces
• Static friction (keeps object at rest) > kinetic friction (while moving)

WEIGHT vs MASS:
• Mass: amount of matter (constant everywhere); measured in kg
• Weight: force of gravity on mass (changes with gravity); measured in Newtons (W = mg)`,
    practiceQuestions: [
      mcq('SCI7', 'SCI.4.5', 'foundational',
        'A 10 kg object is pushed with a net force of 30 N. What is its acceleration?',
        '300 m/s²', '3 m/s²', '0.3 m/s²', '30 m/s²',
        'B', 'Newton\'s 2nd Law: F = ma → a = F/m = 30/10 = 3 m/s².', 'SCI.PHYS.004'),
      mcq('SCI7', 'SCI.4.5', 'standard',
        'A ball is thrown upward. At the highest point of its path, its velocity is:',
        'Equal to its initial velocity.',
        'Zero, but it still has acceleration.',
        'Zero, with no acceleration acting on it.',
        'Positive (still moving upward).',
        'B', 'At the highest point, velocity = 0 momentarily. But gravity (9.8 m/s² downward) still acts on it — so acceleration is not zero. The ball then accelerates back downward.', 'SCI.PHYS.004'),
    ]
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// TEXTBOOK DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────

export const RLA_TEXTBOOK: GEDTextbook = {
  id: 'rla-kaplan-2023',
  subject: 'Language Arts',
  title: 'Reasoning Through Language Arts — Kaplan GED 2022–2023',
  chapters: [
    {
      number: 1,
      title: 'Interpreting Nonfiction and Informational Text',
      topics: ['Main Ideas', 'Restatement', 'Application', 'Cause & Effect', 'Compare & Contrast', 'Conclusions', 'Word Choice', 'Tone', 'Text Structure'],
      content: 'This chapter develops skills for understanding and analyzing nonfiction texts — news articles, essays, government documents, and workplace texts. You\'ll learn to identify main ideas, trace cause-effect relationships, and compare multiple texts.',
      lessons: RLA_CH1_LESSONS,
    },
    {
      number: 2,
      title: 'Analyzing Nonfiction and Informational Text',
      topics: ['Purpose of Text', 'Effectiveness of Argument', 'Validity of Arguments', 'Related Texts', 'Opposing Arguments', 'Graphic Information'],
      content: 'Building on reading comprehension, this chapter focuses on critical analysis — evaluating an author\'s purpose, assessing the strength of arguments, and identifying logical fallacies.',
      lessons: RLA_CH2_LESSONS,
    },
    {
      number: 3,
      title: 'Interpreting Fiction',
      topics: ['Plot Elements', 'Inferences', 'Character', 'Theme', 'Style', 'Figurative Language'],
      content: 'The RLA test includes fiction passages. This chapter covers how to read narratives critically, draw inferences about character and theme, and analyze an author\'s stylistic choices.',
      lessons: [],
    },
    {
      number: 4,
      title: 'Writing Effective Sentences',
      topics: ['Simple Sentences', 'Compound & Complex', 'Run-Ons', 'Subordinate Ideas', 'Modify Ideas', 'Parallel Structure'],
      content: 'Clear writing starts with clear sentences. This chapter covers grammar and sentence construction rules tested heavily on the GED writing portions.',
      lessons: RLA_CH4_LESSONS,
    },
    {
      number: 5,
      title: 'Connecting Ideas',
      topics: ['Organize into Paragraphs', 'Logical Order', 'Relate Sentences & Paragraphs'],
      content: 'Effective writing connects ideas logically. This chapter teaches how to organize paragraphs and create coherent transitions between ideas.',
      lessons: [],
    },
    {
      number: 6,
      title: 'Writing About Text (Extended Response)',
      topics: ['Unpack the Prompt', 'Identify Arguments', 'Thesis Statement', 'Evidence', 'Plan', 'Draft', 'Revise'],
      content: 'The GED Extended Response asks you to analyze two passages and write a structured essay. This chapter walks through every step of the process.',
      lessons: [],
    },
    {
      number: 7,
      title: 'Polishing Your Writing',
      topics: ['Strengthen Sentences', 'Improve Organization', 'Word Choice'],
      content: 'Revision skills that improve the quality and clarity of written responses.',
      lessons: [],
    },
    {
      number: 8,
      title: 'Using Grammar Correctly',
      topics: ['Noun & Pronoun Agreement', 'Verb Forms & Tenses', 'Subject-Verb Agreement'],
      content: 'Grammar rules tested on the GED with a focus on the most common errors.',
      lessons: RLA_CH8_LESSONS,
    },
    {
      number: 9,
      title: 'Using Writing Mechanics',
      topics: ['Comma Use', 'Capitalization', 'Possessives & Contractions', 'Homonyms'],
      content: 'Punctuation and mechanics rules critical for the GED editing tasks.',
      lessons: RLA_CH9_LESSONS,
    },
  ],
};

export const MATH_TEXTBOOK: GEDTextbook = {
  id: 'math-kaplan-2023',
  subject: 'Mathematical Reasoning',
  title: 'Mathematical Reasoning — Kaplan GED 2022–2023',
  chapters: [
    {
      number: 1, title: 'Number Sense and Problem Solving',
      topics: ['Whole Numbers', 'Decimal Operations', 'Number Lines', 'Problem Solving'],
      content: 'Foundational number sense skills. Master whole number operations, number lines, and systematic problem-solving strategies that underpin all GED math.',
      lessons: [],
    },
    {
      number: 2, title: 'Decimals and Fractions',
      topics: ['Decimal Operations', 'Fraction Operations', 'Comparing Fractions', 'Mixed Numbers'],
      content: 'Working fluently with decimals and fractions is required for approximately 45% of GED Math questions.',
      lessons: [],
    },
    {
      number: 3, title: 'Ratio, Proportion, and Percent',
      topics: ['Ratios', 'Unit Rates', 'Proportions', 'Percents', 'Percent Change', 'Simple Interest'],
      content: 'Ratios and percents appear throughout GED Math and Science questions. Master proportional reasoning here.',
      lessons: MATH_CH3_LESSONS,
    },
    {
      number: 4, title: 'Data, Statistics, and Probability',
      topics: ['Mean', 'Median', 'Mode', 'Range', 'Graphs', 'Probability'],
      content: 'Reading and interpreting data is a cross-subject skill tested in Math, Science, and Social Studies.',
      lessons: [],
    },
    {
      number: 5, title: 'Algebra Basics',
      topics: ['Variables', 'Expressions', 'Simplifying', 'Order of Operations', 'Evaluating Expressions'],
      content: 'Algebraic thinking forms ~55% of GED Math. This chapter establishes the foundation.',
      lessons: MATH_CH5_LESSONS,
    },
    {
      number: 6, title: 'Equations, Inequalities, and Functions',
      topics: ['Linear Equations', 'Inequalities', 'Systems of Equations', 'Slope', 'Graphing Lines', 'Functions'],
      content: 'Solving equations and graphing relationships are the core skills of GED algebraic reasoning.',
      lessons: MATH_CH6_LESSONS,
    },
    {
      number: 7, title: 'Geometry',
      topics: ['Angles', 'Triangles', 'Pythagorean Theorem', 'Area', 'Perimeter', 'Volume', 'Surface Area'],
      content: 'Geometry questions require applying formulas from the GED formula sheet to solve practical problems.',
      lessons: MATH_CH7_LESSONS,
    },
  ],
};

export const SS_TEXTBOOK: GEDTextbook = {
  id: 'ss-kaplan-2023',
  subject: 'Social Studies',
  title: 'Social Studies — Kaplan GED 2022–2023',
  chapters: [
    {
      number: 1,
      title: 'Social Studies Practices',
      topics: ['Central Idea', 'Interpret Words', 'Author\'s Purpose', 'Evaluate Reasoning', 'Analyze Relationships', 'Interpret Data'],
      content: 'Social Studies on the GED is as much about reading skills as history knowledge. This chapter covers the analytical practices applied to social studies passages and graphs.',
      lessons: [],
    },
    {
      number: 2,
      title: 'U.S. History',
      topics: ['Exploration & Revolution', 'Westward Expansion & Civil War', 'Industrialization & Progressive Era', 'Emerging World Power', 'Cold War & Civil Rights'],
      content: 'Key periods in American history from colonial times through the late 20th century.',
      lessons: SS_CH2_LESSONS,
    },
    {
      number: 3,
      title: 'Civics and Government',
      topics: ['Historic Basis', 'Constitutional Government', 'Branches of Government', 'Electoral System', 'Role of Citizens'],
      content: 'How the U.S. government is structured, how it functions, and how citizens participate.',
      lessons: SS_CH3_LESSONS,
    },
    {
      number: 4,
      title: 'Economics',
      topics: ['Basic Concepts', 'U.S. Economic System', 'Government & Economy', 'Labor & Consumer Issues'],
      content: 'Economic principles and how markets, government, and individuals interact.',
      lessons: SS_CH4_LESSONS,
    },
    {
      number: 5,
      title: 'Geography and the World',
      topics: ['Early Civilizations', 'Feudalism to Nation States', 'Age of Revolutions', 'Colonialism & Wars', 'Humans & Environment', 'Using Resources Wisely'],
      content: 'World history, geographic concepts, and human-environment interactions.',
      lessons: [],
    },
  ],
};

export const SCIENCE_TEXTBOOK: GEDTextbook = {
  id: 'sci-kaplan-2023',
  subject: 'Science',
  title: 'Science — Kaplan GED 2022–2023',
  chapters: [
    {
      number: 1,
      title: 'Science Practices',
      topics: ['Comprehend Presentations', 'Scientific Method', 'Reason with Information', 'Express Scientific Info', 'Statistics & Probability', 'Apply Formulas'],
      content: 'The skills for reading and analyzing scientific information — the foundation for all GED Science questions.',
      lessons: SCI_CH1_LESSONS,
    },
    {
      number: 2,
      title: 'Life Science',
      topics: ['Cell Structures', 'Cell Processes', 'Human Body Systems', 'Health', 'Reproduction & Heredity', 'Modern Genetics', 'Evolution', 'Ecosystems'],
      content: 'Biology covering cells, genetics, human biology, and ecology.',
      lessons: SCI_CH2_LESSONS,
    },
    {
      number: 3,
      title: 'Earth and Space Science',
      topics: ['Structure of Earth', 'Earth\'s Resources', 'Weather & Climate', 'Earth in Solar System', 'Expanding Universe'],
      content: 'Earth systems, space, and human interactions with the natural world.',
      lessons: SCI_CH3_LESSONS,
    },
    {
      number: 4,
      title: 'Physical Science',
      topics: ['Atoms & Molecules', 'Properties & States of Matter', 'Chemical Reactions', 'Nature of Energy', 'Motion & Forces', 'Electricity & Magnetism'],
      content: 'Chemistry and physics fundamentals tested on the GED Science assessment.',
      lessons: SCI_CH4_LESSONS,
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// KAPLAN GED CURRICULUM — all 4 textbooks
// ─────────────────────────────────────────────────────────────────────────────
export const KAPLAN_GED_CURRICULUM: GEDTextbook[] = [
  RLA_TEXTBOOK,
  MATH_TEXTBOOK,
  SS_TEXTBOOK,
  SCIENCE_TEXTBOOK,
];

/** Returns all lessons across all subjects, flattened */
export function getAllLessons(): Array<{ subject: string; chapterTitle: string; lesson: import('@shared/schema').GEDLesson }> {
  const result: Array<{ subject: string; chapterTitle: string; lesson: import('@shared/schema').GEDLesson }> = [];
  for (const book of KAPLAN_GED_CURRICULUM) {
    for (const chapter of book.chapters) {
      for (const lesson of (chapter.lessons ?? [])) {
        result.push({ subject: book.subject, chapterTitle: chapter.title, lesson });
      }
    }
  }
  return result;
}

/** Count total questions across all curriculum */
export function getTotalQuestionCount(): number {
  return getAllLessons().reduce((sum, { lesson }) => sum + lesson.practiceQuestions.length, 0);
}
