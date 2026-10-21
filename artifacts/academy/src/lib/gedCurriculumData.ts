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
      { id: 'RLA.1.1-HS', question: 'Click the sentence that best states the main idea of the passage.', type: 'hot_spot', hotSpot: { backdrop: 'passage', zones: [{ id: 's1', label: 'Honeybees communicate the location of flowers through a waggle dance.', x: 3, y: 4, w: 94, h: 20 }, { id: 's2', label: 'The angle of the dance tells other bees the direction of the food source.', x: 3, y: 28, w: 94, h: 20 }, { id: 's3', label: 'The length of the dance signals how far away the flowers are.', x: 3, y: 52, w: 94, h: 20 }, { id: 's4', label: 'Some bees also follow scent trails left by returning foragers.', x: 3, y: 76, w: 94, h: 20 }] }, answer: 's1', explanation: 'The first sentence states the whole topic — bees communicating flower locations by dancing. The others are supporting details about how the dance works.', difficulty: 'standard', gedCode: 'RLA.1.1', skillNodeId: 'LANG.MAIN.002' },
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
      { id: 'RLA.1.2-DD', question: 'Arrange the sentences to form a coherent paragraph.', type: 'drag_drop', dragItems: ['She also packed a paperback novel for the train ride.', 'Maria checked the weather before packing her bag.', 'By the time she left, she felt ready for whatever the day brought.', 'Because rain was expected, she added an umbrella and a waterproof jacket.'], answer: 'Maria checked the weather before packing her bag. | Because rain was expected, she added an umbrella and a waterproof jacket. | She also packed a paperback novel for the train ride. | By the time she left, she felt ready for whatever the day brought.', explanation: 'The paragraph opens with the topic (checking the weather), follows with the reason-driven detail ("Because rain was expected…"), adds a further detail ("also"), and closes with a concluding sentence.', difficulty: 'standard', gedCode: 'RLA.1.2', skillNodeId: 'LANG.MAIN.002' },
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
      { id: 'RLA.1.4-SA', question: 'Passage: "When the city built a dam upstream, the river\'s flow slowed. Within a few years, the mill downstream could no longer turn its waterwheel and closed." According to the passage, what caused the mill to close? Answer in one phrase.', type: 'short_answer', answer: 'the dam built upstream', answerAliases: ['the dam', 'a dam upstream', 'the city built a dam'], answerKeywords: ['dam'], explanation: 'The passage gives a cause-and-effect chain: the dam slowed the river, the waterwheel could no longer turn, and the mill closed.', difficulty: 'standard', gedCode: 'RLA.1.4', skillNodeId: 'LANG.MAIN.002' },
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
      { id: 'RLA.2.2-ER', question: 'Write an essay arguing which text presents the stronger argument. Cite specific evidence from both texts, and address the opposing view.', type: 'extended_response', stimulus: [{ label: 'Text A', text: 'School uniforms should be required in public schools. Uniforms reduce peer pressure about clothing, because students are no longer judged by brands. They also save families money: one survey of parents found clothing spending dropped by a third after uniforms were adopted. When everyone dresses alike, students focus on learning instead of fashion.' }, { label: 'Text B', text: 'School uniforms should not be required in public schools. Clothing is a form of self-expression, and forcing students into identical outfits teaches obedience instead of independence. Uniforms do not really save money either, because families must buy uniforms in addition to regular clothes. Schools should solve real problems, not police what students wear.' }], answer: 'A well-developed response takes a clear position, cites evidence from both texts, and rebuts the opposing view.', explanation: 'Strong responses state a thesis (which text argues better and why), support it with quoted or paraphrased evidence from BOTH texts, and answer the other side\'s best point. Scored here with a simulated rubric — only GED Testing Service scorers are authoritative.', difficulty: 'extended', gedCode: 'RLA.2.2', skillNodeId: 'LANG.ARG.009' },
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
      { id: 'RLA.4.2-FI', question: 'Complete the sentence with a subordinating conjunction: "___ the rain stopped, the game resumed." Type the word or phrase.', type: 'fill_in', answer: 'After', answerAliases: ['After', 'Once', 'When', 'As soon as'], explanation: 'A subordinating conjunction (After / Once / When / As soon as) turns the first clause into a dependent clause that sets the time for the main clause.', difficulty: 'standard', gedCode: 'RLA.4.2', skillNodeId: 'LANG.SENT.006' },
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
      { id: 'RLA.8.3-DR', question: 'The committee ___ its final decision tomorrow morning.', type: 'drop_down', options: ['announce', 'announces', 'announcing', 'have announced'], answer: 'announces', explanation: '"Committee" is a singular collective noun here (note "its"), so it takes the singular verb "announces."', difficulty: 'standard', gedCode: 'RLA.8.3', skillNodeId: 'LANG.GRAM.005' },
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
      { id: 'MATH.3.1-FI', question: 'A recipe uses 3 cups of flour to make 12 muffins. How many cups of flour are needed to make 20 muffins? Answer with a number.', type: 'fill_in', answer: '5', answerAliases: ['5 cups', '5.0'], explanation: 'Set up a proportion: 3/12 = x/20 → 12x = 60 → x = 5 cups.', difficulty: 'standard', gedCode: 'MATH.3.1', skillNodeId: 'MATH.RATIO.003', calculatorAllowed: false },
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
      { id: "FG.linear-eq.1vx7yyz", question: "Solve for x: 5x + 12 = 72.", type: "fill_in", answer: "12", answerAliases: ["12", "x = 12"], explanation: "5x + 12 = 72 → 5x = 60 → x = 12.", difficulty: "foundational", gedCode: "MATH.5.1", skillNodeId: "MATH.ALGE.005", provenance: { source: "itemforge", seed: 4107033035, template: "linear-eq" } },
      { id: "FG.linear-eq.1vx7yz0", question: "Solve for x: 3x − 9 = 6.", type: "mcq", choices: { A: "-5", B: "6", C: "4", D: "5" }, answer: "D", explanation: "3x − 9 = 6 → 3x = 15 → x = 5.", difficulty: "standard", gedCode: "MATH.5.1", skillNodeId: "MATH.ALGE.005", provenance: { source: "itemforge", seed: 4107033036, template: "linear-eq" } },
      { id: "FG.linear-eq.1vx7yz1", question: "Solve for x: 7x + 14 = 21.", type: "fill_in", answer: "1", answerAliases: ["1", "x = 1"], explanation: "7x + 14 = 21 → 7x = 7 → x = 1.", difficulty: "standard", gedCode: "MATH.5.1", skillNodeId: "MATH.ALGE.005", provenance: { source: "itemforge", seed: 4107033037, template: "linear-eq" } },
      { id: "FG.eval-expr.9mbfir", question: "Evaluate the expression 2x² + 5 when x = 6.", type: "fill_in", answer: "77", answerAliases: ["77"], explanation: "2(6)² + 5 = 2 × 36 + 5 = 72 + 5 = 77.", difficulty: "foundational", gedCode: "MATH.5.1", skillNodeId: "MATH.ALGE.005", calculatorAllowed: false, provenance: { source: "itemforge", seed: 581680467, template: "eval-expr" } },
      { id: "FG.eval-expr.9mbfis", question: "Evaluate the expression 5x² + 6 when x = 3.", type: "fill_in", answer: "51", answerAliases: ["51"], explanation: "5(3)² + 6 = 5 × 9 + 6 = 45 + 6 = 51.", difficulty: "standard", gedCode: "MATH.5.1", skillNodeId: "MATH.ALGE.005", calculatorAllowed: false, provenance: { source: "itemforge", seed: 581680468, template: "eval-expr" } },
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
      { id: 'MATH.5.4-DD', question: 'Put the steps for evaluating 4 + 3 × (8 − 2) in the correct order.', type: 'drag_drop', dragItems: ['Multiply: 3 × 6 = 18', 'Add: 4 + 18 = 22', 'Subtract inside the parentheses: 8 − 2 = 6'], answer: 'Subtract inside the parentheses: 8 − 2 = 6 | Multiply: 3 × 6 = 18 | Add: 4 + 18 = 22', explanation: 'Order of operations: parentheses first (8 − 2 = 6), then multiplication (3 × 6 = 18), then addition (4 + 18 = 22).', difficulty: 'standard', gedCode: 'MATH.5.4', skillNodeId: 'MATH.ALGE.005', calculatorAllowed: false },
      { id: "FG.eval-expr.br49lg", question: "Evaluate the expression 4x² + 2 when x = 5.", type: "fill_in", answer: "102", answerAliases: ["102"], explanation: "4(5)² + 2 = 4 × 25 + 2 = 100 + 2 = 102.", difficulty: "foundational", gedCode: "MATH.5.4", skillNodeId: "MATH.ALGE.005", calculatorAllowed: false, provenance: { source: "itemforge", seed: 710676628, template: "eval-expr" } },
      { id: "FG.eval-expr.br49lh", question: "Evaluate the expression 2x² + 5 when x = 4.", type: "fill_in", answer: "37", answerAliases: ["37"], explanation: "2(4)² + 5 = 2 × 16 + 5 = 32 + 5 = 37.", difficulty: "standard", gedCode: "MATH.5.4", skillNodeId: "MATH.ALGE.005", calculatorAllowed: false, provenance: { source: "itemforge", seed: 710676629, template: "eval-expr" } },
      { id: "FG.eval-expr.br49li", question: "Evaluate the expression 3x² + 2 when x = 4.", type: "fill_in", answer: "50", answerAliases: ["50"], explanation: "3(4)² + 2 = 3 × 16 + 2 = 48 + 2 = 50.", difficulty: "standard", gedCode: "MATH.5.4", skillNodeId: "MATH.ALGE.005", calculatorAllowed: false, provenance: { source: "itemforge", seed: 710676630, template: "eval-expr" } },
      { id: "FG.linear-eq.qvwz9g", question: "Solve for x: 9x + 10 = 73.", type: "mcq", choices: { A: "6", B: "-7", C: "7", D: "8" }, answer: "C", explanation: "9x + 10 = 73 → 9x = 63 → x = 7.", difficulty: "foundational", gedCode: "MATH.5.4", skillNodeId: "MATH.ALGE.005", provenance: { source: "itemforge", seed: 1625727364, template: "linear-eq" } },
      { id: "FG.linear-eq.qvwz9h", question: "Solve for x: 3x − 3 = 27.", type: "fill_in", answer: "10", answerAliases: ["10", "x = 10"], explanation: "3x − 3 = 27 → 3x = 30 → x = 10.", difficulty: "standard", gedCode: "MATH.5.4", skillNodeId: "MATH.ALGE.005", provenance: { source: "itemforge", seed: 1625727365, template: "linear-eq" } },
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
      { id: 'MATH.6.1-DR', question: 'To solve 3x + 7 = 22, first ___ both sides to isolate the term containing x.', type: 'drop_down', options: ['subtract 7 from', 'add 7 to', 'multiply by 3 on', 'divide by 7 on'], answer: 'subtract 7 from', explanation: 'Undo the addition first: subtract 7 from both sides to get 3x = 15, then divide by 3 to find x = 5.', difficulty: 'standard', gedCode: 'MATH.6.1', skillNodeId: 'MATH.LINEQ.006' },
      { id: "FG.linear-eq.1pbdrtu", question: "Solve for x: 5x − 2 = 33.", type: "mcq", choices: { A: "6", B: "-7", C: "8", D: "7" }, answer: "D", explanation: "5x − 2 = 33 → 5x = 35 → x = 7.", difficulty: "foundational", gedCode: "MATH.6.1", skillNodeId: "MATH.LINEQ.006", provenance: { source: "itemforge", seed: 3707555106, template: "linear-eq" } },
      { id: "FG.linear-eq.1pbdrtv", question: "Solve for x: 5x + 3 = 33.", type: "mcq", choices: { A: "6", B: "-6", C: "5", D: "7" }, answer: "A", explanation: "5x + 3 = 33 → 5x = 30 → x = 6.", difficulty: "standard", gedCode: "MATH.6.1", skillNodeId: "MATH.LINEQ.006", provenance: { source: "itemforge", seed: 3707555107, template: "linear-eq" } },
      { id: "FG.linear-eq.1pbdrtw", question: "Solve for x: 5x + 10 = -10.", type: "fill_in", answer: "-4", answerAliases: ["-4", "x = -4"], explanation: "5x + 10 = -10 → 5x = -20 → x = -4.", difficulty: "standard", gedCode: "MATH.6.1", skillNodeId: "MATH.LINEQ.006", provenance: { source: "itemforge", seed: 3707555108, template: "linear-eq" } },
      { id: "FG.linear-eq.1pbdrtx", question: "Solve for x: 3x − 6 = -12.", type: "fill_in", answer: "-2", answerAliases: ["-2", "x = -2"], explanation: "3x − 6 = -12 → 3x = -6 → x = -2.", difficulty: "extended", gedCode: "MATH.6.1", skillNodeId: "MATH.LINEQ.006", provenance: { source: "itemforge", seed: 3707555109, template: "linear-eq" } },
      { id: "FG.linear-eq.1pbdrty", question: "Solve for x: 9x − 6 = 48.", type: "fill_in", answer: "6", answerAliases: ["6", "x = 6"], explanation: "9x − 6 = 48 → 9x = 54 → x = 6.", difficulty: "foundational", gedCode: "MATH.6.1", skillNodeId: "MATH.LINEQ.006", provenance: { source: "itemforge", seed: 3707555110, template: "linear-eq" } },
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
      { id: 'MATH.6.7-HS', question: 'On the coordinate grid, click the point (3, −2).', type: 'hot_spot', hotSpot: { backdrop: 'grid', zones: [{ id: 'pt-a', label: '(−3, 2)', x: 15, y: 24, w: 10, h: 12 }, { id: 'pt-b', label: '(0, 4)', x: 45, y: 4, w: 10, h: 12 }, { id: 'pt-c', label: '(3, −2)', x: 75, y: 64, w: 10, h: 12 }, { id: 'pt-d', label: '(−1, −4)', x: 35, y: 84, w: 10, h: 12 }] }, answer: 'pt-c', explanation: 'The point (3, −2) is 3 units right of the origin and 2 units down, in Quadrant IV.', difficulty: 'standard', gedCode: 'MATH.6.7', skillNodeId: 'MATH.LINEQ.006' },
      { id: "FG.slope.11aj745", question: "What is the slope of the line through (3, 5) and (7, 17)?", type: "mcq", choices: { A: "4", B: "3", C: "5", D: "-3" }, answer: "B", explanation: "slope = (17 − 5) / (7 − 3) = 12 / 4 = 3.", difficulty: "foundational", gedCode: "MATH.6.7", skillNodeId: "MATH.LINEQ.006", provenance: { source: "itemforge", seed: 2254940357, template: "slope" } },
      { id: "FG.slope.11aj746", question: "A line passes through (3, -2) and (6, 1). What is its slope?", type: "fill_in", answer: "1", answerAliases: ["1"], explanation: "slope = rise / run = (1 − -2) / (6 − 3) = 1.", difficulty: "standard", gedCode: "MATH.6.7", skillNodeId: "MATH.LINEQ.006", provenance: { source: "itemforge", seed: 2254940358, template: "slope" } },
      { id: "FG.slope.11aj747", question: "A line passes through (-1, 3) and (0, 1). What is its slope?", type: "fill_in", answer: "-2", answerAliases: ["-2"], explanation: "slope = rise / run = (1 − 3) / (0 − -1) = -2.", difficulty: "standard", gedCode: "MATH.6.7", skillNodeId: "MATH.LINEQ.006", provenance: { source: "itemforge", seed: 2254940359, template: "slope" } },
      { id: "FG.slope.11aj748", question: "What is the slope of the line through (0, -3) and (3, 6)?", type: "mcq", choices: { A: "3", B: "4", C: "5", D: "-3" }, answer: "A", explanation: "slope = (6 − -3) / (3 − 0) = 9 / 3 = 3.", difficulty: "extended", gedCode: "MATH.6.7", skillNodeId: "MATH.LINEQ.006", provenance: { source: "itemforge", seed: 2254940360, template: "slope" } },
      { id: "FG.slope.11aj749", question: "What is the slope of the line through (3, -2) and (4, -1)?", type: "mcq", choices: { A: "2", B: "3", C: "1", D: "-1" }, answer: "C", explanation: "slope = (-1 − -2) / (4 − 3) = 1 / 1 = 1.", difficulty: "foundational", gedCode: "MATH.6.7", skillNodeId: "MATH.LINEQ.006", provenance: { source: "itemforge", seed: 2254940361, template: "slope" } },
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
      { id: 'MATH.7.3-SA', question: 'A right triangle has legs of 6 cm and 8 cm. Find the length of the hypotenuse, and name the theorem you used.', type: 'short_answer', answer: '10 cm', answerAliases: ['10', '10 cm', 'the hypotenuse is 10 cm'], answerKeywords: ['10', 'pythagorean'], explanation: 'By the Pythagorean theorem: 6² + 8² = 36 + 64 = 100, so the hypotenuse is √100 = 10 cm.', difficulty: 'standard', gedCode: 'MATH.7.3', skillNodeId: 'MATH.GEOM.008' },
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
      { id: 'SS.2.3-DD', question: 'Place the events in chronological order.', type: 'drag_drop', dragItems: ['19th Amendment ratified (1920)', 'Civil War ends (1865)', 'Sherman Antitrust Act passed (1890)', 'Transcontinental railroad completed (1869)'], answer: 'Civil War ends (1865) | Transcontinental railroad completed (1869) | Sherman Antitrust Act passed (1890) | 19th Amendment ratified (1920)', explanation: '1865 → 1869 → 1890 → 1920: the Civil War ends, the railroads unite the continent, antitrust law follows industrial consolidation, and women win the vote.', difficulty: 'standard', gedCode: 'SS.2.3', skillNodeId: 'SOC.USHIST.001' },
      { id: 'SS.2.3-HS', question: 'During the Great Migration, many Black families moved from the rural South to industrial cities such as Chicago and Detroit. Click the region where Chicago and Detroit are located.', type: 'hot_spot', hotSpot: { backdrop: 'panel', zones: [{ id: 'region-west', label: 'West', x: 4, y: 30, w: 22, h: 30 }, { id: 'region-midwest', label: 'Midwest', x: 36, y: 12, w: 24, h: 30 }, { id: 'region-northeast', label: 'Northeast', x: 72, y: 10, w: 24, h: 26 }, { id: 'region-south', label: 'South', x: 38, y: 58, w: 26, h: 30 }] }, answer: 'region-midwest', explanation: 'Chicago and Detroit are Midwestern industrial cities — two of the main destinations of the Great Migration.', difficulty: 'standard', gedCode: 'SS.2.3', skillNodeId: 'SOC.USHIST.001' },
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
      { id: 'SS.3.2-DR', question: 'A bill passes both houses of Congress, but the President rejects it and sends it back unsigned. This action is called ___.', type: 'drop_down', options: ['a judicial review', 'a veto', 'an amendment', 'a filibuster'], answer: 'a veto', explanation: 'A veto is the President\'s rejection of a bill passed by Congress; Congress can override it with a two-thirds vote in both houses.', difficulty: 'standard', gedCode: 'SS.3.2', skillNodeId: 'SOC.CIV.002' },
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
      { id: 'SS.4.1-FI', question: 'A bakery sells a loaf of bread for $5. The ingredients and labor cost $3 per loaf. The profit on each loaf is $___ . Answer with a number.', type: 'fill_in', answer: '2', answerAliases: ['2', '$2', '2 dollars'], explanation: 'Profit = price − cost = $5 − $3 = $2 per loaf.', difficulty: 'standard', gedCode: 'SS.4.1', skillNodeId: 'SOC.ECON.003' },
      { id: 'SS.4.1-SA', question: 'In one sentence, explain the difference between fiscal policy and monetary policy.', type: 'short_answer', answer: 'Fiscal policy is government taxing and spending; monetary policy is the central bank managing the money supply and interest rates.', answerKeywords: ['government', 'federal reserve|central bank'], explanation: 'Fiscal policy = the government\'s taxes and spending. Monetary policy = the Federal Reserve (the central bank) managing money supply and interest rates.', difficulty: 'standard', gedCode: 'SS.4.1', skillNodeId: 'SOC.ECON.003' },
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
      { id: 'SCI.1.2-DD', question: 'Put the steps of a scientific investigation in the correct order.', type: 'drag_drop', dragItems: ['Collect and record data', 'State a testable hypothesis', 'Analyze the results', 'Draw a conclusion', 'Design a controlled experiment'], answer: 'State a testable hypothesis | Design a controlled experiment | Collect and record data | Analyze the results | Draw a conclusion', explanation: 'Investigation order: hypothesis → experiment design → data collection → analysis → conclusion.', difficulty: 'standard', gedCode: 'SCI.1.2', skillNodeId: 'SCI.SCI.001' },
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
      { id: 'SCI.2.1-HS', question: "Click the organelle that produces most of the cell's energy (ATP).", type: 'hot_spot', hotSpot: { backdrop: 'panel', zones: [{ id: 'cell-nucleus', label: 'Nucleus', x: 6, y: 10, w: 26, h: 22 }, { id: 'cell-mito', label: 'Mitochondrion', x: 58, y: 12, w: 34, h: 22 }, { id: 'cell-ribo', label: 'Ribosome', x: 8, y: 58, w: 26, h: 22 }, { id: 'cell-golgi', label: 'Golgi apparatus', x: 58, y: 58, w: 34, h: 22 }] }, answer: 'cell-mito', explanation: 'The mitochondrion is where cellular respiration produces most of the cell\'s ATP.', difficulty: 'standard', gedCode: 'SCI.2.1', skillNodeId: 'SCI.LIFE.003' },
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
      { id: 'SCI.2.5-DR', question: 'In a Punnett square cross of Tt × tt, the probability that an offspring is homozygous recessive (tt) is ___.', type: 'drop_down', options: ['0%', '25%', '50%', '100%'], answer: '50%', explanation: 'Tt × tt produces 50% Tt and 50% tt offspring, so the probability of tt is 50%.', difficulty: 'standard', gedCode: 'SCI.2.5', skillNodeId: 'SCI.LIFE.003' },
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
      { id: 'SCI.3.3-SA', question: 'In one sentence, explain why coastal cities usually have milder winters than inland cities at the same latitude.', type: 'short_answer', answer: 'The ocean stores heat and releases it slowly, moderating coastal temperatures.', answerKeywords: ['ocean|sea|water', 'heat|temperature'], explanation: 'Water heats and cools more slowly than land, so the ocean releases stored heat through winter and moderates coastal temperatures.', difficulty: 'standard', gedCode: 'SCI.3.3', skillNodeId: 'SCI.EARTH.005' },
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
      { id: 'SCI.4.5-FI', question: 'A 2 kg object accelerates at 3 m/s². Using F = ma, the net force on the object is ___ newtons. Answer with a number.', type: 'fill_in', answer: '6', answerAliases: ['6', '6 N', '6 newtons'], explanation: 'F = ma = 2 kg × 3 m/s² = 6 newtons.', difficulty: 'standard', gedCode: 'SCI.4.5', skillNodeId: 'SCI.PHYS.004', calculatorAllowed: true },
    ]
  },
];


// ─────────────────────────────────────────────────────────────────────────────
// PHASE 3 FILLS — ItemForge-generated + authored lessons for the nine
// chapters that shipped as empty shells. Forged items carry their
// seed + template in `provenance` and regenerate exactly.
// ─────────────────────────────────────────────────────────────────────────────

const MATH_CH1_LESSONS: GEDLesson[] = [
  {
    number: 1,
    title: "Whole-Number Operations",
    gedCode: "MATH.1.1",
    keyTerms: ["place value", "product", "quotient", "factor", "estimate"],
    content: "WHOLE-NUMBER OPERATIONS\n\nPLACE VALUE: the value of a digit depends on its position\n• In 47,382: the 7 is worth 7,000 (thousands place)\n• Round by looking at the digit to the right: 5 or more rounds up\n\nMULTIPLICATION: repeated addition — break big problems apart\n• 24 × 6 = (20 × 6) + (4 × 6) = 120 + 24 = 144\n\nDIVISION: the inverse of multiplication\n• Check any division with multiplication: quotient × divisor = dividend\n\nESTIMATE FIRST: a rough answer catches most slips\n• 48 × 51 ≈ 50 × 50 = 2,500 — an exact answer near 2,448 makes sense",
    practiceQuestions: [
      { id: "FG.arith-ops.12bx04y", question: "A warehouse packs 6 boxes per pallet. How many boxes are on 5 full pallets?", type: "mcq", choices: { A: "11", B: "30", C: "35", D: "24" }, answer: "B", explanation: "6 × 5 = 30 boxes.", difficulty: "foundational", gedCode: "MATH.1.1", skillNodeId: "MATH.ARITH.001", provenance: { source: "itemforge", seed: 2317730290, template: "arith-ops" } },
      { id: "FG.arith-ops.12bx04z", question: "A warehouse packs 7 boxes per pallet. How many boxes are on 14 full pallets?", type: "mcq", choices: { A: "21", B: "91", C: "112", D: "98" }, answer: "D", explanation: "7 × 14 = 98 boxes.", difficulty: "standard", gedCode: "MATH.1.1", skillNodeId: "MATH.ARITH.001", provenance: { source: "itemforge", seed: 2317730291, template: "arith-ops" } },
      { id: "FG.arith-ops.12bx050", question: "A warehouse packs 17 boxes per pallet. How many boxes are on 5 full pallets?", type: "mcq", choices: { A: "68", B: "90", C: "22", D: "85" }, answer: "D", explanation: "17 × 5 = 85 boxes.", difficulty: "standard", gedCode: "MATH.1.1", skillNodeId: "MATH.ARITH.001", provenance: { source: "itemforge", seed: 2317730292, template: "arith-ops" } },
      { provenance: { source: "authored" }, id: "MATH.1.1-A1", question: "In the number 583,204, what is the value of the digit 8?", type: "mcq", choices: { A: "800", B: "8,000", C: "80,000", D: "800,000" }, answer: "C", explanation: "The 8 sits in the ten-thousands place: 8 × 10,000 = 80,000.", difficulty: "foundational", gedCode: "MATH.1.1", skillNodeId: "MATH.ARITH.001" },
    ]
  },
  {
    number: 2,
    title: "Integers and the Number Line",
    gedCode: "MATH.1.2",
    keyTerms: ["integer", "absolute value", "number line", "negative number", "opposite"],
    content: "INTEGERS AND THE NUMBER LINE\n\nINTEGERS: …−3, −2, −1, 0, 1, 2, 3… — negatives sit left of zero\n\nORDERING: on a number line, values increase left → right\n• −5 < −2 (owing $5 is less than owing $2)\n• Any positive number beats any negative number\n\nABSOLUTE VALUE: distance from zero — always non-negative\n• |−7| = 7 and |7| = 7\n• Distance between two points = |a − b|\n\nADDING INTEGERS: same signs add and keep the sign; different\nsigns subtract, and the answer takes the sign of the larger one",
    practiceQuestions: [
      { id: "FG.order-values.8ygm0x", question: "Arrange the values from least to greatest.", type: "drag_drop", dragItems: ["0.65", "0.1", "1/5", "0.7"], answer: "0.1 | 1/5 | 0.65 | 0.7", explanation: "As decimals: 0.1 = 0.1, 1/5 = 0.2, 0.65 = 0.65, 0.7 = 0.7. Ordered least to greatest: 0.1, 1/5, 0.65, 0.7.", difficulty: "foundational", gedCode: "MATH.1.2", skillNodeId: "MATH.ARITH.001", calculatorAllowed: false, provenance: { source: "itemforge", seed: 541611393, template: "order-values" } },
      { id: "FG.order-values.8ygm0y", question: "Arrange the values from least to greatest.", type: "drag_drop", dragItems: ["0.7", "1/5", "0.35", "0.65"], answer: "1/5 | 0.35 | 0.65 | 0.7", explanation: "As decimals: 1/5 = 0.2, 0.35 = 0.35, 0.65 = 0.65, 0.7 = 0.7. Ordered least to greatest: 1/5, 0.35, 0.65, 0.7.", difficulty: "standard", gedCode: "MATH.1.2", skillNodeId: "MATH.ARITH.001", calculatorAllowed: false, provenance: { source: "itemforge", seed: 541611394, template: "order-values" } },
      { id: "FG.arith-ops.13qmkxj", question: "A warehouse packs 11 boxes per pallet. How many boxes are on 8 full pallets?", type: "mcq", choices: { A: "77", B: "88", C: "19", D: "96" }, answer: "B", explanation: "11 × 8 = 88 boxes.", difficulty: "foundational", gedCode: "MATH.1.2", skillNodeId: "MATH.ARITH.001", provenance: { source: "itemforge", seed: 2402904439, template: "arith-ops" } },
      { provenance: { source: "authored" }, id: "MATH.1.2-A1", question: "What is the absolute value of −13?", type: "fill_in", answer: "13", answerAliases: ["13"], explanation: "Absolute value is distance from zero on the number line: |−13| = 13.", difficulty: "foundational", gedCode: "MATH.1.2", skillNodeId: "MATH.ARITH.001", calculatorAllowed: false },
    ]
  },
];

const MATH_CH2_LESSONS: GEDLesson[] = [
  {
    number: 1,
    title: "Working with Decimals",
    gedCode: "MATH.2.1",
    keyTerms: ["decimal", "tenths", "hundredths", "align decimal points", "money"],
    content: "WORKING WITH DECIMALS\n\nADD / SUBTRACT: line up the decimal points, then work as usual\n• 4.7 + 2.35: write 4.70 + 2.35 = 7.05\n\nMULTIPLY: multiply as whole numbers, then count decimal places\n• 1.2 × 0.3: 12 × 3 = 36, two decimal places total → 0.36\n\nCOMPARE: pad with zeros so lengths match\n• 0.45 vs 0.405 → 0.450 vs 0.405, so 0.45 is larger\n\nMONEY IS DECIMALS: $3.5 is $3.50 — always carry two places for cents",
    practiceQuestions: [
      { id: "FG.decimal-ops.ndnz4m", question: "A purchase totals $240.80. The customer pays with $250. How much change should they receive? Answer in dollars (for example, 2.75).", type: "fill_in", answer: "9.20", answerAliases: ["9.20", "$9.20"], explanation: "$250 − $240.80 = $9.20 in change.", difficulty: "foundational", gedCode: "MATH.2.1", skillNodeId: "MATH.FRAC.002", provenance: { source: "itemforge", seed: 1413675670, template: "decimal-ops" } },
      { id: "FG.decimal-ops.ndnz4n", question: "A purchase totals $5.52. The customer pays with $10. How much change should they receive? Answer in dollars (for example, 2.75).", type: "fill_in", answer: "4.48", answerAliases: ["4.48", "$4.48"], explanation: "$10 − $5.52 = $4.48 in change.", difficulty: "standard", gedCode: "MATH.2.1", skillNodeId: "MATH.FRAC.002", provenance: { source: "itemforge", seed: 1413675671, template: "decimal-ops" } },
      { id: "FG.decimal-ops.ndnz4o", question: "Notebooks cost $36.19 each. What is the cost of 4 notebooks?", type: "mcq", choices: { A: "$144.76", B: "$143.76", C: "$40.19", D: "$180.95" }, answer: "A", explanation: "$36.19 × 4 = $144.76.", difficulty: "standard", gedCode: "MATH.2.1", skillNodeId: "MATH.FRAC.002", provenance: { source: "itemforge", seed: 1413675672, template: "decimal-ops" } },
      { provenance: { source: "authored" }, id: "MATH.2.1-A1", question: "Which decimal is the greatest?", type: "mcq", choices: { A: "0.405", B: "0.45", C: "0.415", D: "0.045" }, answer: "B", explanation: "Pad to three places: 0.405, 0.450, 0.415, 0.045. The greatest is 0.450 = 0.45.", difficulty: "foundational", gedCode: "MATH.2.1", skillNodeId: "MATH.FRAC.002" },
    ]
  },
  {
    number: 2,
    title: "Fraction Operations",
    gedCode: "MATH.2.2",
    keyTerms: ["numerator", "denominator", "common denominator", "simplify", "reciprocal"],
    content: "FRACTION OPERATIONS\n\nADD / SUBTRACT: rewrite with a common denominator first\n• 1/3 + 1/4 = 4/12 + 3/12 = 7/12\n• Never add denominators: 1/3 + 1/4 is NOT 2/7\n\nMULTIPLY: straight across — numerators × numerators,\ndenominators × denominators, then simplify\n• 2/3 × 3/5 = 6/15 = 2/5\n\nDIVIDE: multiply by the reciprocal (keep–change–flip)\n• 3/4 ÷ 2/5 = 3/4 × 5/2 = 15/8 = 1 7/8\n\nSIMPLIFY: divide top and bottom by their greatest common factor",
    practiceQuestions: [
      { id: "FG.fraction-ops.agthy0", question: "What is 1/5 × 1/3? Give your answer as a simplified fraction (for example, 3/4).", type: "fill_in", answer: "1/15", answerAliases: ["1/15"], explanation: "Multiply across: (1 × 1) / (5 × 3) = 1/15 = 1/15.", difficulty: "foundational", gedCode: "MATH.2.2", skillNodeId: "MATH.FRAC.002", calculatorAllowed: false, provenance: { source: "itemforge", seed: 632911896, template: "fraction-ops" } },
      { id: "FG.fraction-ops.agthy1", question: "What is 1/2 + 5/6?", type: "mcq", choices: { A: "3/4", B: "2/3", C: "1/3", D: "4/3" }, answer: "D", explanation: "Common denominator 12: 1/2 + 5/6 = 16/12 = 4/3.", difficulty: "standard", gedCode: "MATH.2.2", skillNodeId: "MATH.FRAC.002", provenance: { source: "itemforge", seed: 632911897, template: "fraction-ops" } },
      { id: "FG.fraction-ops.agthy2", question: "What is 1/4 × 1/6? Give your answer as a simplified fraction (for example, 3/4).", type: "fill_in", answer: "1/24", answerAliases: ["1/24"], explanation: "Multiply across: (1 × 1) / (4 × 6) = 1/24 = 1/24.", difficulty: "standard", gedCode: "MATH.2.2", skillNodeId: "MATH.FRAC.002", calculatorAllowed: false, provenance: { source: "itemforge", seed: 632911898, template: "fraction-ops" } },
      { provenance: { source: "authored" }, id: "MATH.2.2-A1", question: "Which fraction is equivalent to 6/8?", type: "mcq", choices: { A: "3/4", B: "5/7", C: "6/4", D: "12/24" }, answer: "A", explanation: "6/8 simplifies by dividing top and bottom by 2: 3/4. (12/24 = 1/2, not 6/8.)", difficulty: "foundational", gedCode: "MATH.2.2", skillNodeId: "MATH.FRAC.002" },
    ]
  },
];

const MATH_CH4_LESSONS: GEDLesson[] = [
  {
    number: 1,
    title: "Data Displays and Statistics",
    gedCode: "MATH.4.1",
    keyTerms: ["mean", "median", "mode", "range", "data display"],
    content: "DATA DISPLAYS AND STATISTICS\n\nMEAN: the average — add all values, divide by how many\nMEDIAN: the middle value of an ordered set (or the mean of the\ntwo middle values)\nMODE: the value that appears most often\nRANGE: greatest − least\n\nREADING DISPLAYS: bar graphs compare categories; line graphs\nshow change over time; circle graphs show parts of a whole\n• Always read the axis labels and scale before the bars —\n  a stretched scale can make small differences look huge",
    practiceQuestions: [
      { id: "FG.mean-median.xvpn0s", question: "Find the mean of the data set: 16, 21, 16, 16, 21.", type: "fill_in", answer: "18", answerAliases: ["18"], explanation: "Sum = 90; mean = 90 ÷ 5 = 18.", difficulty: "foundational", gedCode: "MATH.4.1", skillNodeId: "MATH.STAT.011", provenance: { source: "itemforge", seed: 2048648140, template: "mean-median" } },
      { id: "FG.mean-median.xvpn0t", question: "Find the median of the data set: 14, 17, 21, 23, 29.", type: "fill_in", answer: "21", answerAliases: ["21"], explanation: "Ordered, the values are 14, 17, 21, 23, 29; the middle (3rd) value is 21.", difficulty: "standard", gedCode: "MATH.4.1", skillNodeId: "MATH.STAT.011", provenance: { source: "itemforge", seed: 2048648141, template: "mean-median" } },
      { id: "FG.mean-median.xvpn0u", question: "Find the mean of the data set: 14, 15, 16, 16, 9.", type: "fill_in", answer: "14", answerAliases: ["14"], explanation: "Sum = 70; mean = 70 ÷ 5 = 14.", difficulty: "standard", gedCode: "MATH.4.1", skillNodeId: "MATH.STAT.011", provenance: { source: "itemforge", seed: 2048648142, template: "mean-median" } },
      { provenance: { source: "authored" }, id: "MATH.4.1-A1", question: "A bar graph shows bus riders per day: Mon 40, Tue 55, Wed 50, Thu 65, Fri 90. Which statement is supported by the graph?", type: "mcq", choices: { A: "Friday had more than twice the riders of Monday", B: "Riders decreased steadily all week", C: "Wednesday had the most riders", D: "Thursday had fewer riders than Tuesday" }, answer: "A", explanation: "Friday (90) is more than twice Monday (40). Riders rose overall, Wednesday (50) is not the peak, and Thursday (65) beat Tuesday (55).", difficulty: "standard", gedCode: "MATH.4.1", skillNodeId: "MATH.STAT.011" },
    ]
  },
  {
    number: 2,
    title: "Probability Basics",
    gedCode: "MATH.4.2",
    keyTerms: ["probability", "outcome", "event", "sample space", "independent events"],
    content: "PROBABILITY BASICS\n\nPROBABILITY = (favorable outcomes) ÷ (total possible outcomes)\n• Always between 0 (impossible) and 1 (certain)\n• Can be written as a fraction, decimal, or percent\n\nSAMPLE SPACE: the list of everything that can happen\n• Rolling one die: {1, 2, 3, 4, 5, 6} — six equally likely outcomes\n\nINDEPENDENT EVENTS: one result does not change the next\n• Coin flips and dice rolls start fresh every time\n• P(two heads in a row) = 1/2 × 1/2 = 1/4",
    practiceQuestions: [
      { id: "FG.probability.1y4qk28", question: "A bag contains 4 red, 5 blue, and 1 green marbles. One marble is drawn at random. What is the probability it is red?", type: "mcq", choices: { A: "2/5", B: "1/10", C: "1/2", D: "2/3" }, answer: "A", explanation: "P(red) = red ÷ total = 4/10 = 2/5.", difficulty: "foundational", gedCode: "MATH.4.2", skillNodeId: "MATH.PROB.012", provenance: { source: "itemforge", seed: 4240589840, template: "probability" } },
      { id: "FG.probability.1y4qk29", question: "A bag contains 5 red, 2 blue, and 5 green marbles. One marble is drawn at random. What is the probability it is red?", type: "mcq", choices: { A: "5/7", B: "7/12", C: "1/6", D: "5/12" }, answer: "D", explanation: "P(red) = red ÷ total = 5/12 = 5/12.", difficulty: "standard", gedCode: "MATH.4.2", skillNodeId: "MATH.PROB.012", provenance: { source: "itemforge", seed: 4240589841, template: "probability" } },
      { id: "FG.probability.1y4qk2a", question: "A bag contains 2 red, 4 blue, and 4 green marbles. One marble is drawn at random. What is the probability it is red?", type: "mcq", choices: { A: "4/5", B: "2/5", C: "1/4", D: "1/5" }, answer: "D", explanation: "P(red) = red ÷ total = 2/10 = 1/5.", difficulty: "standard", gedCode: "MATH.4.2", skillNodeId: "MATH.PROB.012", provenance: { source: "itemforge", seed: 4240589842, template: "probability" } },
      { id: "FG.mean-median.diebqp", question: "Find the median of the data set: 13, 13, 18, 25, 27.", type: "fill_in", answer: "18", answerAliases: ["18"], explanation: "Ordered, the values are 13, 13, 18, 25, 27; the middle (3rd) value is 18.", difficulty: "foundational", gedCode: "MATH.4.2", skillNodeId: "MATH.STAT.011", provenance: { source: "itemforge", seed: 816961777, template: "mean-median" } },
    ]
  },
];

const RLA_CH3_LESSONS: GEDLesson[] = [
  {
    number: 1,
    title: "Plot, Character, and Setting",
    gedCode: "RLA.3.1",
    keyTerms: ["plot", "exposition", "conflict", "climax", "characterization", "setting"],
    content: "PLOT, CHARACTER, AND SETTING\n\nPLOT: the chain of events — exposition (setup), rising action,\nclimax (turning point), falling action, resolution\n\nCHARACTER: writers reveal people two ways\n• Direct: the narrator tells you what a character is like\n• Indirect: you infer it from actions, choices, dialogue, and\n  what the character notices — trust actions over labels\n\nSETTING: place + time + atmosphere. Setting is never just\ndecoration: it pressures characters and shapes their choices\n\nREADING FICTION ON THE TEST: ask of every scene — what does\nthe character WANT, what stands in the way, and what changed?",
    practiceQuestions: [
      { id: "FG.fiction-reading.1sajh5r", question: "The violin most likely symbolizes —", type: "mcq", choices: { A: "a debt her aunt wants repaid", B: "a career she is about to begin professionally", C: "her daughter's forgotten childhood toy", D: "a part of herself Marta set aside under pressure, now returning" }, answer: "D", explanation: "She stopped playing after her father dismissed music; the instrument's return, once \"the rent was paid,\" reopens a room of her own past — return, not a new profession.", difficulty: "foundational", gedCode: "RLA.3.1", skillNodeId: "LANG.READ.001", stimulus: [
        { label: "Passage", text: "The violin arrived in a cardboard box with no return address, its neck wrapped in a blue scarf Aunt Rosa had knitted the winter before she moved away. Marta lifted it out the way you lift a sleeping cat. She had not played since she was fourteen, since the afternoon her father said music was a fine hobby for people who could afford hobbies. Now the rent was paid, her daughter was grown, and the scarf smelled faintly of cedar. She tucked the violin under her chin. The first note came out thin and uncertain, then steadier — a door opening in a house she had once lived in." },
      ], provenance: { source: "itemforge", seed: 3887540127, template: "fiction-reading" } },
      { id: "FG.fiction-reading.1sajh5s", question: "Why does Deshawn count the register a third time even though it balanced?", type: "mcq", choices: { A: "He is stalling while he gathers the nerve to change his life", B: "He does not trust the register's arithmetic", C: "He is required to count three times by store policy", D: "He believes the manager is watching him" }, answer: "A", explanation: "The balanced drawer \"on the first count\" rules out arithmetic doubt; the repetition is nervous energy while he contemplates tomorrow's job application.", difficulty: "standard", gedCode: "RLA.3.1", skillNodeId: "LANG.READ.001", stimulus: [
        { label: "Passage", text: "Deshawn counted the register twice, then a third time, though the drawer had balanced perfectly on the first count. Across the street, the hiring manager at the new grocery store was locking up. Tomorrow Deshawn would wear the thrift-store blazer his grandmother had pressed for him and ask for a job with regular hours — hours that would let him coach his little brother's baseball team. He slid the last receipt into the envelope, wrote the date in his careful hand, and allowed himself, finally, to imagine Saturday mornings that did not begin with an alarm." },
      ], provenance: { source: "itemforge", seed: 3887540128, template: "fiction-reading" } },
      { id: "FG.fiction-reading.1sajh5t", question: "Why does Deshawn count the register a third time even though it balanced?", type: "mcq", choices: { A: "He is required to count three times by store policy", B: "He believes the manager is watching him", C: "He does not trust the register's arithmetic", D: "He is stalling while he gathers the nerve to change his life" }, answer: "D", explanation: "The balanced drawer \"on the first count\" rules out arithmetic doubt; the repetition is nervous energy while he contemplates tomorrow's job application.", difficulty: "standard", gedCode: "RLA.3.1", skillNodeId: "LANG.READ.001", stimulus: [
        { label: "Passage", text: "Deshawn counted the register twice, then a third time, though the drawer had balanced perfectly on the first count. Across the street, the hiring manager at the new grocery store was locking up. Tomorrow Deshawn would wear the thrift-store blazer his grandmother had pressed for him and ask for a job with regular hours — hours that would let him coach his little brother's baseball team. He slid the last receipt into the envelope, wrote the date in his careful hand, and allowed himself, finally, to imagine Saturday mornings that did not begin with an alarm." },
      ], provenance: { source: "itemforge", seed: 3887540129, template: "fiction-reading" } },
      { provenance: { source: "authored" }, id: "RLA.3.1-A1", question: "In a story, the turning point at which the conflict reaches its greatest intensity is called the —", type: "mcq", choices: { A: "exposition", B: "climax", C: "resolution", D: "setting" }, answer: "B", explanation: "The climax is the peak of tension where the conflict turns; exposition introduces, resolution ties off, setting is place and time.", difficulty: "foundational", gedCode: "RLA.3.1", skillNodeId: "LANG.READ.001" },
    ]
  },
  {
    number: 2,
    title: "Theme and Figurative Language",
    gedCode: "RLA.3.2",
    keyTerms: ["theme", "metaphor", "simile", "symbol", "personification", "inference"],
    content: "THEME AND FIGURATIVE LANGUAGE\n\nTHEME: the idea about life the story builds toward — never a\nsingle word (\"love\") but a claim (\"love survives loss only\nwhen it changes form\"). Build it from what changes by the end\n\nFIGURATIVE LANGUAGE: comparisons that carry meaning\n• Simile: \"like / as\" — Metaphor: says one thing IS another\n• Symbol: an object that also stands for an idea\n• Personification: human traits given to the non-human\n\nON THE TEST: when a question asks what a phrase \"suggests,\"\nanswer with the feeling or idea the image creates — not a\ndictionary definition",
    practiceQuestions: [
      { id: "FG.fiction-reading.1j1z7e2", question: "Why does Deshawn count the register a third time even though it balanced?", type: "mcq", choices: { A: "He is required to count three times by store policy", B: "He does not trust the register's arithmetic", C: "He believes the manager is watching him", D: "He is stalling while he gathers the nerve to change his life" }, answer: "D", explanation: "The balanced drawer \"on the first count\" rules out arithmetic doubt; the repetition is nervous energy while he contemplates tomorrow's job application.", difficulty: "foundational", gedCode: "RLA.3.2", skillNodeId: "LANG.MAIN.002", stimulus: [
        { label: "Passage", text: "Deshawn counted the register twice, then a third time, though the drawer had balanced perfectly on the first count. Across the street, the hiring manager at the new grocery store was locking up. Tomorrow Deshawn would wear the thrift-store blazer his grandmother had pressed for him and ask for a job with regular hours — hours that would let him coach his little brother's baseball team. He slid the last receipt into the envelope, wrote the date in his careful hand, and allowed himself, finally, to imagine Saturday mornings that did not begin with an alarm." },
      ], provenance: { source: "itemforge", seed: 3328961834, template: "fiction-reading" } },
      { id: "FG.fiction-reading.1j1z7e3", question: "The violin most likely symbolizes —", type: "mcq", choices: { A: "a career she is about to begin professionally", B: "a part of herself Marta set aside under pressure, now returning", C: "her daughter's forgotten childhood toy", D: "a debt her aunt wants repaid" }, answer: "B", explanation: "She stopped playing after her father dismissed music; the instrument's return, once \"the rent was paid,\" reopens a room of her own past — return, not a new profession.", difficulty: "standard", gedCode: "RLA.3.2", skillNodeId: "LANG.MAIN.002", stimulus: [
        { label: "Passage", text: "The violin arrived in a cardboard box with no return address, its neck wrapped in a blue scarf Aunt Rosa had knitted the winter before she moved away. Marta lifted it out the way you lift a sleeping cat. She had not played since she was fourteen, since the afternoon her father said music was a fine hobby for people who could afford hobbies. Now the rent was paid, her daughter was grown, and the scarf smelled faintly of cedar. She tucked the violin under her chin. The first note came out thin and uncertain, then steadier — a door opening in a house she had once lived in." },
      ], provenance: { source: "itemforge", seed: 3328961835, template: "fiction-reading" } },
      { provenance: { source: "authored" }, id: "RLA.3.2-A1", question: "Click the sentence that best expresses the theme of the passage.", type: "hot_spot", hotSpot: { backdrop: "passage", zones: [
        { id: "t1", label: "The flood took the orchard, the barn, and nearly the house itself.", x: 3, y: 4, w: 94, h: 20 },
        { id: "t2", label: "What survives a disaster is not what we owned, but who stood beside us in the mud.", x: 3, y: 28, w: 94, h: 20 },
        { id: "t3", label: "By spring, the neighbors had rebuilt the fence line together, one post at a time.", x: 3, y: 52, w: 94, h: 20 },
        { id: "t4", label: "Insurance paperwork, the adjuster said, would take another six to eight weeks.", x: 3, y: 76, w: 94, h: 20 },
      ] }, answer: "t2", explanation: "A theme is the passage's claim about life — here, that people, not property, are what endure. The other sentences are events or details.", difficulty: "standard", gedCode: "RLA.3.2", skillNodeId: "LANG.MAIN.002" },
      { provenance: { source: "authored" }, id: "RLA.3.2-A2", question: "A story ends with a character carefully replanting a garden that a storm destroyed, though the season is almost over. In one sentence, state a theme this ending supports.", type: "short_answer", answer: "Hope and perseverance matter even when success is unlikely.", answerKeywords: ["hope|persever|persist|resilien|keep trying|not giving up"], explanation: "The replanting \"though the season is almost over\" points to perseverance and hope against the odds — the theme is the claim, not the event.", difficulty: "standard", gedCode: "RLA.3.2", skillNodeId: "LANG.MAIN.002" },
    ]
  },
];

const RLA_CH5_LESSONS: GEDLesson[] = [
  {
    number: 1,
    title: "Organizing Paragraphs",
    gedCode: "RLA.5.1",
    keyTerms: ["topic sentence", "unity", "coherence", "supporting detail", "concluding sentence"],
    content: "ORGANIZING PARAGRAPHS\n\nA PARAGRAPH = one controlling idea, developed\n• Topic sentence: states the idea (usually first)\n• Supporting sentences: evidence, examples, explanation —\n  every sentence must earn its place under the topic sentence\n• Concluding sentence: closes or hands off to the next idea\n\nUNITY: if a sentence could belong to a different paragraph,\nit breaks unity — move it or cut it\n\nORDER CHOICES: chronological (time), spatial (place),\norder of importance, problem → solution. Pick the order the\nmaterial itself suggests, then keep it",
    practiceQuestions: [
      { provenance: { source: "authored" }, id: "RLA.5.1-A1", question: "Arrange the sentences to form a well-organized paragraph.", type: "drag_drop", dragItems: ["Water the soil thoroughly and set the pot where it will get at least six hours of sun.", "Growing tomatoes in a container begins with choosing a pot at least five gallons in size.", "Within a few weeks, yellow flowers will give way to small green fruit.", "Fill the pot with potting mix and plant the seedling so most of its stem is buried."], answer: "Growing tomatoes in a container begins with choosing a pot at least five gallons in size. | Fill the pot with potting mix and plant the seedling so most of its stem is buried. | Water the soil thoroughly and set the pot where it will get at least six hours of sun. | Within a few weeks, yellow flowers will give way to small green fruit.", explanation: "Chronological order: choose the pot → plant the seedling → water and place it → the result (flowers, then fruit).", difficulty: "standard", gedCode: "RLA.5.1", skillNodeId: "LANG.PARA.007" },
      { id: "FG.transition-choice.1e6vhyt", question: "The bridge had not been inspected in a decade. ___, engineers recommended closing it immediately.", type: "drop_down", options: ["As a result", "In contrast", "Meanwhile", "For example"], answer: "As a result", explanation: "The recommendation follows from the finding — a result, so \"As a result\" fits.", difficulty: "foundational", gedCode: "RLA.5.1", skillNodeId: "LANG.PARA.007", provenance: { source: "itemforge", seed: 3034856117, template: "transition-choice" } },
      { id: "FG.transition-choice.1e6vhyu", question: "The proposal lowers costs, speeds up service, and reduces errors. ___, the board should adopt it this quarter.", type: "drop_down", options: ["On the other hand", "In conclusion", "For instance", "In addition"], answer: "In conclusion", explanation: "The final sentence sums up and recommends — a conclusion, so \"In conclusion\" fits.", difficulty: "standard", gedCode: "RLA.5.1", skillNodeId: "LANG.PARA.007", provenance: { source: "itemforge", seed: 3034856118, template: "transition-choice" } },
      { provenance: { source: "authored" }, id: "RLA.5.1-A2", question: "Which sentence does NOT belong in a paragraph about the benefits of public libraries?", type: "mcq", choices: { A: "Libraries lend books, tools, and even instruments at no cost to members.", B: "Many libraries host free classes in computing, languages, and job skills.", C: "The first public library in the colonies was founded in 1731 by Benjamin Franklin.", D: "For residents without internet at home, libraries provide essential access." }, answer: "C", explanation: "The paragraph's controlling idea is present-day benefits. Franklin's library is history, not a benefit — it breaks unity.", difficulty: "standard", gedCode: "RLA.5.1", skillNodeId: "LANG.PARA.007" },
    ]
  },
  {
    number: 2,
    title: "Transitions and Coherence",
    gedCode: "RLA.5.2",
    keyTerms: ["transition", "coherence", "contrast", "cause and effect", "pronoun reference"],
    content: "TRANSITIONS AND COHERENCE\n\nTRANSITIONS NAME THE RELATIONSHIP between ideas\n• Addition: furthermore, in addition, also\n• Contrast: however, on the other hand, nevertheless\n• Cause → effect: as a result, consequently, therefore\n• Example: for example, for instance\n• Conclusion: in conclusion, overall\n\nCOHERENCE IS MORE THAN TRANSITIONS\n• Repeat key words instead of swapping synonyms for variety\n• Keep pronouns pointed at one clear antecedent\n• Keep verb tenses and point of view consistent\n\nA transition that names the WRONG relationship is worse than\nnone at all — it promises logic the sentences don't deliver",
    practiceQuestions: [
      { id: "FG.transition-choice.rzac7c", question: "The first treatment reduced symptoms for most patients. ___, it caused severe drowsiness in a small group.", type: "drop_down", options: ["For example", "However", "Furthermore", "As a result"], answer: "However", explanation: "The second sentence qualifies the first — a contrast, so \"However\" fits.", difficulty: "foundational", gedCode: "RLA.5.2", skillNodeId: "LANG.SENT.006", provenance: { source: "itemforge", seed: 1691855688, template: "transition-choice" } },
      { id: "FG.transition-choice.rzac7d", question: "Many species are shifting their ranges as the climate warms. ___, some birds now nest weeks earlier than they did in 1970.", type: "drop_down", options: ["Consequently", "Similarly", "For example", "Nevertheless"], answer: "For example", explanation: "The nesting birds illustrate the general claim — an example, so \"For example\" fits.", difficulty: "standard", gedCode: "RLA.5.2", skillNodeId: "LANG.SENT.006", provenance: { source: "itemforge", seed: 1691855689, template: "transition-choice" } },
      { id: "FG.vocab-cloze.fbpzta", question: "The new evidence ___ the scientist's original claim, confirming she had been right all along. (Fill in the blank with a verb meaning \"backed up\".)", type: "fill_in", answer: "supported", answerAliases: ["supported"], explanation: "\"Supported\" fits: the evidence backed up the claim.", difficulty: "foundational", gedCode: "RLA.5.2", skillNodeId: "LANG.SENT.006", provenance: { source: "itemforge", seed: 926681230, template: "vocab-cloze" } },
      { provenance: { source: "authored" }, id: "RLA.5.2-A1", question: "Which revision makes the pronoun reference clear? Original: \"When the nurse spoke to the patient, she nodded slowly.\"", type: "mcq", choices: { A: "When the nurse spoke, the patient nodded slowly.", B: "When she spoke to the patient, she nodded slowly.", C: "When the nurse spoke to the patient, slow nodding happened.", D: "Speaking to the patient, nodding slowly, the nurse did." }, answer: "A", explanation: "The original leaves \"she\" ambiguous — nurse or patient? Option A assigns the nod to the patient explicitly.", difficulty: "standard", gedCode: "RLA.5.2", skillNodeId: "LANG.SENT.006" },
    ]
  },
];

const RLA_CH6_LESSONS: GEDLesson[] = [
  {
    number: 1,
    title: "Unpacking the Extended Response",
    gedCode: "RLA.6.1",
    keyTerms: ["extended response", "thesis", "evidence", "counterargument", "rubric"],
    content: "UNPACKING THE EXTENDED RESPONSE\n\nTHE TASK: read TWO short texts on one topic, then write an\nessay arguing which position is better supported — 45 minutes\n\nYOU ARE NOT ASKED YOUR OPINION of the topic. You are asked to\njudge the ARGUMENTS: whose evidence is stronger, more\nrelevant, and better reasoned\n\nFIRST MOVES\n• Name each author's position in one sentence\n• Underline the two or three strongest evidence points per text\n• Decide your verdict BEFORE drafting: \"Text __ presents the\n  stronger argument because…\"\n\nTHE THREE SCORING TRAITS: (1) creation of arguments and use\nof evidence, (2) development and organization,\n(3) clarity and conventions",
    practiceQuestions: [
      { id: "FG.essay-order.nahxjr", question: "Put the steps for writing the Extended Response in the most effective order.", type: "drag_drop", dragItems: ["Revise for organization and edit for grammar and conventions", "Decide which argument is better supported and draft a thesis", "Draft the essay: introduction, body paragraphs, counterargument, conclusion", "Gather evidence from both texts for each body paragraph", "Read both texts and identify each author's position"], answer: "Read both texts and identify each author's position | Decide which argument is better supported and draft a thesis | Gather evidence from both texts for each body paragraph | Draft the essay: introduction, body paragraphs, counterargument, conclusion | Revise for organization and edit for grammar and conventions", explanation: "Analyze first (positions), then plan (thesis), then gather evidence, then draft, then revise and edit — revision is a separate, final pass.", difficulty: "foundational", gedCode: "RLA.6.1", skillNodeId: "LANG.ESSAY.008", provenance: { source: "itemforge", seed: 1408354839, template: "essay-order" } },
      { provenance: { source: "authored" }, id: "RLA.6.1-A1", question: "What is the main task in the GED Extended Response?", type: "mcq", choices: { A: "To summarize both passages as fully as possible", B: "To argue which of two positions is better supported by evidence", C: "To write about your personal experience with the topic", D: "To correct the grammar of both passages" }, answer: "B", explanation: "The ER is an evidence-judging essay: argue which text builds the stronger case. Summaries, personal stories, and copy-editing do not answer the prompt.", difficulty: "foundational", gedCode: "RLA.6.1", skillNodeId: "LANG.ESSAY.008" },
      { provenance: { source: "authored" }, id: "RLA.6.1-A2", question: "In the Extended Response, an essay that never mentions the opposing text would lose the most points in which trait?", type: "mcq", choices: { A: "Trait 1 — Creation of Arguments and Use of Evidence", B: "Trait 2 — Development of Ideas and Organization", C: "Trait 3 — Clarity and Conventions", D: "It would not lose points anywhere" }, answer: "A", explanation: "Trait 1 covers analyzing both sources and addressing the opposing view — ignoring one text strikes at the heart of the task.", difficulty: "standard", gedCode: "RLA.6.1", skillNodeId: "LANG.ESSAY.008" },
      { provenance: { source: "authored" }, id: "RLA.6.1-A3", question: "Two texts debate whether a town should ban single-use plastic bags. Write a one-sentence thesis for an essay arguing that Text B is better supported.", type: "short_answer", answer: "Text B presents the stronger argument because its evidence is more specific and current.", answerKeywords: ["text b", "stronger|better|more convincing|better supported"], explanation: "A thesis names the stronger text and previews why — evidence quality, not the writer's opinion about bags.", difficulty: "standard", gedCode: "RLA.6.1", skillNodeId: "LANG.ESSAY.008" },
    ]
  },
  {
    number: 2,
    title: "Building and Revising the Essay",
    gedCode: "RLA.6.2",
    keyTerms: ["body paragraph", "rebuttal", "revision", "editing", "word choice"],
    content: "BUILDING AND REVISING THE ESSAY\n\nSTRUCTURE THAT SCORES\n• Introduction: the debate in one line + your thesis\n• Body: one paragraph per main evidence point — quote or\n  paraphrase the text, then explain HOW it supports you\n• Counterargument: state the other side's best point fairly,\n  then show why it is still weaker\n• Conclusion: restate the verdict without new evidence\n\nREVISE IN PASSES, not all at once\n• Pass 1 — argument: does every paragraph serve the thesis?\n• Pass 2 — organization: could a reader outline your essay\n  from your first sentences alone?\n• Pass 3 — editing: sentences, agreement, punctuation\n\nBUDGET THE 45 MINUTES: ~7 plan, ~30 draft, ~8 revise",
    practiceQuestions: [
      { provenance: { source: "authored" }, id: "RLA.6.2-A1", question: "Write an essay arguing which text presents the stronger argument. Cite specific evidence from both texts, and address the opposing view.", type: "extended_response", stimulus: [
        { label: "Text A", text: "High schools should start later in the morning. Studies of adolescent sleep show that teenagers' internal clocks shift at puberty, making early wake-ups a biological fight, not laziness. Districts that moved start times to 8:30 or later report better attendance, fewer car accidents among teen drivers, and improved grades in first-period classes." },
        { label: "Text B", text: "High schools should keep their early start times. A later start pushes sports, jobs, and homework deeper into the evening, leaving students no freer than before. Bus schedules serve whole districts, not one school, and changing them costs money better spent on teachers. Teenagers can simply go to bed earlier if they need more sleep." },
      ], answer: "A well-developed response takes a clear position, cites evidence from both texts, and rebuts the opposing view.", explanation: "Text A leans on named evidence (sleep studies, district outcomes: attendance, accidents, grades). Text B leans on logistics and assertion (\"simply go to bed earlier\" answers no evidence). Strong essays weigh that difference explicitly.", difficulty: "extended", gedCode: "RLA.6.2", skillNodeId: "LANG.ARG.009" },
      { id: "FG.essay-order.1nzrdne", question: "Put the steps for writing the Extended Response in the most effective order.", type: "drag_drop", dragItems: ["Draft the essay: introduction, body paragraphs, counterargument, conclusion", "Decide which argument is better supported and draft a thesis", "Revise for organization and edit for grammar and conventions", "Gather evidence from both texts for each body paragraph", "Read both texts and identify each author's position"], answer: "Read both texts and identify each author's position | Decide which argument is better supported and draft a thesis | Gather evidence from both texts for each body paragraph | Draft the essay: introduction, body paragraphs, counterargument, conclusion | Revise for organization and edit for grammar and conventions", explanation: "Analyze first (positions), then plan (thesis), then gather evidence, then draft, then revise and edit — revision is a separate, final pass.", difficulty: "foundational", gedCode: "RLA.6.2", skillNodeId: "LANG.ARG.009", provenance: { source: "itemforge", seed: 3627568346, template: "essay-order" } },
      { provenance: { source: "authored" }, id: "RLA.6.2-A2", question: "During revision, which change most strengthens an Extended Response essay?", type: "mcq", choices: { A: "Adding a paragraph that fairly states, then answers, the opposing text's best point", B: "Replacing common words with longer synonyms throughout", C: "Removing all quotations so the essay is fully in your own words", D: "Making the introduction longer than the body paragraphs" }, answer: "A", explanation: "Trait 1 rewards engaging the opposing view; the counterargument paragraph is the highest-value revision. Synonym-swapping, stripping evidence, and bloating the intro all weaken it.", difficulty: "standard", gedCode: "RLA.6.2", skillNodeId: "LANG.ARG.009" },
      { provenance: { source: "authored" }, id: "RLA.6.2-A3", question: "Which sentence is the most effective thesis for an Extended Response?", type: "mcq", choices: { A: "Text A presents the stronger argument because it supports its claims with specific studies and measurable outcomes, while Text B relies mostly on assertion.", B: "Both texts have good points about this interesting topic.", C: "In this essay I will discuss two texts and give my opinion.", D: "The topic of this debate is very important in today's society." }, answer: "A", explanation: "A thesis takes a position AND previews the evidence-based reasons. The others are vague, neutral, or announcements rather than claims.", difficulty: "standard", gedCode: "RLA.6.2", skillNodeId: "LANG.ARG.009" },
    ]
  },
];

const RLA_CH7_LESSONS: GEDLesson[] = [
  {
    number: 1,
    title: "Strengthening Sentences",
    gedCode: "RLA.7.1",
    keyTerms: ["run-on", "fragment", "parallel structure", "modifier", "active voice"],
    content: "STRENGTHENING SENTENCES\n\nKILL THE RUN-ON: two complete thoughts need a real joint —\na period, a semicolon, or a comma + conjunction\n• Weak: \"The rain stopped we went outside.\"\n• Fixed: \"The rain stopped, and we went outside.\"\n\nCOMPLETE THE FRAGMENT: a subordinate clause is not a\nsentence — \"Because the store was closed.\" needs its main clause\n\nKEEP PARALLEL STRUCTURE: items in a list share a form\n• \"She likes hiking, swimming, and to run\" → \"…and running\"\n\nPLACE MODIFIERS next to what they modify — a dangling\nmodifier leaves the reader asking who did the action",
    practiceQuestions: [
      { id: "FG.sv-agreement.19tp1ny", question: "The committee, after months of debate, ___ its recommendation tomorrow.", type: "drop_down", options: ["announces", "have announced", "announcing", "announce"], answer: "announces", explanation: "\"Committee\" acts as one body (note \"its\"), taking the singular \"announces.\"", difficulty: "foundational", gedCode: "RLA.7.1", skillNodeId: "LANG.SENT.006", provenance: { source: "itemforge", seed: 2770855342, template: "sv-agreement" } },
      { id: "FG.sv-agreement.19tp1nz", question: "The data from the sensors ___ a steady increase in temperature.", type: "drop_down", options: ["showing", "show", "has shown", "shows"], answer: "show", explanation: "\"Data\" is treated as plural in formal usage (\"the data show\").", difficulty: "standard", gedCode: "RLA.7.1", skillNodeId: "LANG.SENT.006", provenance: { source: "itemforge", seed: 2770855343, template: "sv-agreement" } },
      { id: "FG.vocab-cloze.1uctnhp", question: "Because the instructions were ___, half the class assembled the model incorrectly. (Fill in the blank with an adjective meaning \"not easy to understand\".)", type: "fill_in", answer: "unclear", answerAliases: ["unclear"], explanation: "\"Unclear\" explains the mistakes: the instructions could not be understood.", difficulty: "foundational", gedCode: "RLA.7.1", skillNodeId: "LANG.SENT.006", provenance: { source: "itemforge", seed: 4012306477, template: "vocab-cloze" } },
      { provenance: { source: "authored" }, id: "RLA.7.1-A1", question: "Which revision fixes the run-on sentence? Original: \"The museum opened its new wing visitors came from three states to see it.\"", type: "mcq", choices: { A: "The museum opened its new wing, visitors came from three states to see it.", B: "The museum opened its new wing. Visitors came from three states to see it.", C: "The museum opened its new wing visitors, came from three states to see it.", D: "The museum opened its new wing and visitors from three states, they came to see it." }, answer: "B", explanation: "Only B gives each complete thought its own sentence. A is a comma splice; C and D leave the run-on (and add new errors).", difficulty: "standard", gedCode: "RLA.7.1", skillNodeId: "LANG.SENT.006" },
    ]
  },
  {
    number: 2,
    title: "Word Choice and Clarity",
    gedCode: "RLA.7.2",
    keyTerms: ["precise language", "wordiness", "tone", "audience", "redundancy"],
    content: "WORD CHOICE AND CLARITY\n\nPRECISION BEATS FANCINESS: the exact everyday word\noutperforms the vague impressive one\n• \"utilize\" → \"use\" · \"a large number of\" → \"many\"\n\nCUT DEAD WEIGHT: phrases that add length, not meaning\n• \"due to the fact that\" → \"because\"\n• \"in my opinion, I think\" → pick one\n\nMATCH TONE TO AUDIENCE: a job application, a text to a\nfriend, and a test essay are three different registers —\nthe GED essay wants the formal one\n\nONE TEST FOR EVERY SENTENCE: if you cut it, does the\nmeaning change? If not, cut it",
    practiceQuestions: [
      { id: "FG.vocab-cloze.254394", question: "Because the instructions were ___, half the class assembled the model incorrectly. (Fill in the blank with an adjective meaning \"not easy to understand\".)", type: "fill_in", answer: "unclear", answerAliases: ["unclear"], explanation: "\"Unclear\" explains the mistakes: the instructions could not be understood.", difficulty: "foundational", gedCode: "RLA.7.2", skillNodeId: "LANG.VOCAB.004", provenance: { source: "itemforge", seed: 129521272, template: "vocab-cloze" } },
      { id: "FG.vocab-cloze.254395", question: "The hikers ___ the steep trail slowly, stopping often to rest. (Fill in the blank with a past-tense verb for going up.)", type: "fill_in", answer: "climbed", answerAliases: ["climbed"], explanation: "\"Climbed\" fits the action and the past tense of the sentence.", difficulty: "standard", gedCode: "RLA.7.2", skillNodeId: "LANG.VOCAB.004", provenance: { source: "itemforge", seed: 129521273, template: "vocab-cloze" } },
      { id: "FG.sv-agreement.134mck5", question: "The list of approved vendors ___ attached to the memo.", type: "drop_down", options: ["have been", "were", "are", "was"], answer: "was", explanation: "The subject is \"list\" (singular); the phrase \"of approved vendors\" does not change it.", difficulty: "foundational", gedCode: "RLA.7.2", skillNodeId: "LANG.GRAM.005", provenance: { source: "itemforge", seed: 2365942037, template: "sv-agreement" } },
      { provenance: { source: "authored" }, id: "RLA.7.2-A1", question: "Which revision is the clearest and most concise?", type: "mcq", choices: { A: "Due to the fact that the bridge was closed, we were late.", B: "Because the bridge was closed, we were late.", C: "In light of the fact that the bridge happened to be closed, we ended up being late.", D: "We were late due to the reason that the bridge was closed on account of repairs." }, answer: "B", explanation: "\"Because\" replaces the wordy openers; B says the same thing in eight words with nothing lost.", difficulty: "standard", gedCode: "RLA.7.2", skillNodeId: "LANG.VOCAB.004" },
    ]
  },
];

const SS_CH1_LESSONS: GEDLesson[] = [
  {
    number: 1,
    title: "Sourcing and Context",
    gedCode: "SS.1.1",
    keyTerms: ["primary source", "secondary source", "sourcing", "contextualization", "bias"],
    content: "SOURCING AND CONTEXT\n\nPRIMARY SOURCE: created during the period, by a participant\nor witness (diary, photograph, law, speech)\nSECONDARY SOURCE: created later, analyzing the period\n(textbook, documentary, history book)\n\nSOURCE EVERY DOCUMENT with four questions\n• WHO wrote it? • WHEN? • WHY (what did they want)?\n• WHO was it for?\nThe answers don't make a source \"good\" or \"bad\" — they tell\nyou what it can and cannot prove.\n\nCONTEXT: an event means something different inside its\nmoment. Judge historical actors first by what their world\nlooked like, then by what we know now",
    practiceQuestions: [
      { id: "FG.source-analysis.v3yks3", question: "A historian would most value this source as evidence about —", type: "mcq", choices: { A: "the exact wages paid to factory girls in 1911", B: "the foreman's personal biography", C: "the dangerous working conditions reformers sought to expose", D: "how cloth was manufactured in the period" }, answer: "C", explanation: "The report documents locked doors and child labor — conditions, not wages, manufacturing technique, or biography.", difficulty: "foundational", gedCode: "SS.1.1", skillNodeId: "REAS.CRIT.001", stimulus: [
        { label: "Source — factory inspector's report, 1911 (adapted)", text: "\"In the cutting room I counted forty girls, the oldest perhaps seventeen, at work since six in the morning. The doors to the stairwell were kept locked during working hours, the foreman explained, to prevent the loss of cloth. When I asked what would happen in case of fire, he laughed and said the girls could use the windows.\"" },
      ], provenance: { source: "itemforge", seed: 1881103539, template: "source-analysis" } },
      { id: "FG.source-analysis.v3yks4", question: "Between which two recorded years did Milltown's population grow the fastest in percentage terms?", type: "mcq", choices: { A: "1880 to 1900", B: "1900 to 1920", C: "1920 to 1940", D: "1940 to 1960" }, answer: "A", explanation: "1880→1900: 2,100 → 4,600 is more than doubling (+119%). 1900→1920 roughly doubles (+102%); the later intervals grow far less in percentage terms.", difficulty: "standard", gedCode: "SS.1.1", skillNodeId: "REAS.CRIT.001", stimulus: [
        { label: "Source — chart: Population of Milltown", text: "Year 1880: 2,100 · Year 1900: 4,600 · Year 1920: 9,300 · Year 1940: 9,800 · Year 1960: 14,200" },
      ], provenance: { source: "itemforge", seed: 1881103540, template: "source-analysis" } },
      { id: "FG.source-analysis.v3yks5", question: "The chart best supports which conclusion about Milltown?", type: "mcq", choices: { A: "Its population more than quadrupled between 1880 and 1940", B: "Its population declined between 1920 and 1940", C: "It was largest in 1900", D: "It grew by the same amount every twenty years" }, answer: "A", explanation: "2,100 (1880) → 9,800 (1940) is more than four times larger. No interval shows a decline, and the increases are uneven.", difficulty: "standard", gedCode: "SS.1.1", skillNodeId: "REAS.CRIT.001", stimulus: [
        { label: "Source — chart: Population of Milltown", text: "Year 1880: 2,100 · Year 1900: 4,600 · Year 1920: 9,300 · Year 1940: 9,800 · Year 1960: 14,200" },
      ], provenance: { source: "itemforge", seed: 1881103541, template: "source-analysis" } },
      { provenance: { source: "authored" }, id: "SS.1.1-A1", question: "A photograph shows a 1930s breadline, but its caption was written by a relief agency raising funds. In one sentence, explain what a historian should consider before using the photo as evidence.", type: "short_answer", answer: "The agency chose the image to persuade donors, so the photo may not show typical conditions.", answerKeywords: ["fundrais|donor|persuad|purpose|bias|agenda"], explanation: "Sourcing: the caption writer's fundraising purpose shapes which photo was chosen and how it is framed — the image is evidence, but interested evidence.", difficulty: "standard", gedCode: "SS.1.1", skillNodeId: "REAS.CRIT.001" },
    ]
  },
  {
    number: 2,
    title: "Charts, Graphs, and Maps as Sources",
    gedCode: "SS.1.2",
    keyTerms: ["data table", "scale", "trend", "map key", "cartogram"],
    content: "CHARTS, GRAPHS, AND MAPS AS SOURCES\n\nREAD IN ORDER: title → axes/labels → units → then the data\n• Check the scale: a y-axis starting at 50 instead of 0 makes\n  small gaps look enormous — a classic persuasion trick\n\nTRENDS OVER POINTS: tests ask what the data SHOWS —\ndirection (rising, falling, flat) and turning points matter\nmore than any single value\n\nMAPS ARE ARGUMENTS TOO\n• The key/legend defines every symbol before you interpret\n• What a map leaves out (labels, peoples, borders) is a\n  choice by its maker — sourcing applies to maps as well",
    practiceQuestions: [
      { id: "FG.source-analysis.7yygie", question: "Which feature most affects how a historian should weigh this source?", type: "mcq", choices: { A: "It quotes the foreman directly", B: "It uses the first person", C: "It describes events from 1911", D: "It was written by an inspector whose job was to document violations" }, answer: "D", explanation: "Sourcing: an inspector documents problems for a reason. That purpose shapes what he records — it does not erase the evidence, but it frames it.", difficulty: "foundational", gedCode: "SS.1.2", skillNodeId: "REAS.CRIT.001", stimulus: [
        { label: "Source — factory inspector's report, 1911 (adapted)", text: "\"In the cutting room I counted forty girls, the oldest perhaps seventeen, at work since six in the morning. The doors to the stairwell were kept locked during working hours, the foreman explained, to prevent the loss of cloth. When I asked what would happen in case of fire, he laughed and said the girls could use the windows.\"" },
      ], provenance: { source: "itemforge", seed: 481977878, template: "source-analysis" } },
      { provenance: { source: "authored" }, id: "SS.1.2-A1", question: "Using the Milltown population chart — 1880: 2,100 · 1900: 4,600 · 1920: 9,300 · 1940: 9,800 · 1960: 14,200 — click the first year in which the population exceeded 9,000.", type: "hot_spot", hotSpot: { backdrop: "panel", zones: [
        { id: "y1880", label: "1880 — 2,100", x: 3, y: 5, w: 45, h: 26 },
        { id: "y1900", label: "1900 — 4,600", x: 52, y: 5, w: 45, h: 26 },
        { id: "y1920", label: "1920 — 9,300", x: 3, y: 37, w: 45, h: 26 },
        { id: "y1940", label: "1940 — 9,800", x: 52, y: 37, w: 45, h: 26 },
        { id: "y1960", label: "1960 — 14,200", x: 27, y: 69, w: 45, h: 26 },
      ] }, answer: "y1920", explanation: "1920 shows 9,300 — the first recorded value above 9,000. Earlier years are below it; later years are not first.", difficulty: "standard", gedCode: "SS.1.2", skillNodeId: "REAS.CRIT.001" },
      { provenance: { source: "authored" }, id: "SS.1.2-A2", question: "A graph's y-axis begins at 90 instead of 0, making a rise from 95 to 100 look dramatic. What should a careful reader conclude?", type: "mcq", choices: { A: "The values nearly doubled", B: "The change is real but the visual exaggerates it", C: "The graph must be fraudulent", D: "The data cannot be read at all" }, answer: "B", explanation: "A truncated axis distorts proportion, not the numbers themselves: 95 → 100 is a real but modest (about 5%) increase.", difficulty: "standard", gedCode: "SS.1.2", skillNodeId: "REAS.CRIT.001" },
      { provenance: { source: "authored" }, id: "SS.1.2-A3", question: "On a road map, the key shows one inch equals 50 miles. Two towns are 3 inches apart on the map. How far apart are they in reality?", type: "mcq", choices: { A: "15 miles", B: "53 miles", C: "150 miles", D: "300 miles" }, answer: "C", explanation: "Map scale: 3 inches × 50 miles per inch = 150 miles.", difficulty: "foundational", gedCode: "SS.1.2", skillNodeId: "REAS.CRIT.001" },
    ]
  },
];

const SS_CH5_LESSONS: GEDLesson[] = [
  {
    number: 1,
    title: "Reading Maps and Regions",
    gedCode: "SS.5.1",
    keyTerms: ["latitude", "longitude", "equator", "region", "hemisphere"],
    content: "READING MAPS AND REGIONS\n\nLATITUDE: lines running east–west, measuring distance north\nor south of the EQUATOR (0°). Longitude measures east or\nwest of the Prime Meridian (0°)\n\nHEMISPHERES: the equator splits North/South; the Prime\nMeridian (with 180°) splits East/West\n\nREGIONS: areas grouped by a shared trait — climate\n(Southwest deserts), economy (the Rust Belt), culture, or\ngovernment. Region borders are human choices, not fences\n\nPHYSICAL FEATURES SHAPE HISTORY: rivers carry trade,\nmountains block it, coasts invite it. When a test shows a\nsettlement or a route, look for the water first",
    practiceQuestions: [
      { provenance: { source: "authored" }, id: "SS.5.1-A1", question: "Click the region described: a hot, dry region of deserts and canyons in the southwestern United States, including Arizona and New Mexico.", type: "hot_spot", hotSpot: { backdrop: "panel", zones: [
        { id: "ne", label: "Northeast — dense cities, cold winters", x: 56, y: 4, w: 41, h: 27 },
        { id: "sw", label: "Southwest — deserts of Arizona & New Mexico", x: 4, y: 36, w: 44, h: 27 },
        { id: "mw", label: "Midwest — plains and Great Lakes farms", x: 52, y: 36, w: 44, h: 27 },
        { id: "pnw", label: "Pacific Northwest — rainy coastal forests", x: 4, y: 4, w: 44, h: 27 },
      ] }, answer: "sw", explanation: "Arizona and New Mexico anchor the desert Southwest. The other panels describe different regional traits.", difficulty: "foundational", gedCode: "SS.5.1", skillNodeId: "SOC.GEO.004" },
      { provenance: { source: "authored" }, id: "SS.5.1-A2", question: "Lines of latitude measure distance —", type: "mcq", choices: { A: "east or west of the Prime Meridian", B: "north or south of the equator", C: "above or below sea level", D: "from the North Pole only" }, answer: "B", explanation: "Latitude is measured from the equator (0°) toward the poles; longitude is the east–west measure from the Prime Meridian.", difficulty: "foundational", gedCode: "SS.5.1", skillNodeId: "SOC.GEO.004" },
      { provenance: { source: "authored" }, id: "SS.5.1-A3", question: "A city located at 40°N, 75°W is in which hemisphere pair?", type: "mcq", choices: { A: "Southern and Eastern", B: "Northern and Western", C: "Northern and Eastern", D: "Southern and Western" }, answer: "B", explanation: "40°N = Northern Hemisphere; 75°W = Western Hemisphere. (That location is near Philadelphia.)", difficulty: "standard", gedCode: "SS.5.1", skillNodeId: "SOC.GEO.004" },
      { provenance: { source: "authored" }, id: "SS.5.1-A4", question: "The imaginary line at 0° latitude that divides Earth into Northern and Southern Hemispheres is the ___.", type: "fill_in", answer: "equator", answerAliases: ["equator", "the equator", "Equator"], explanation: "The equator sits at 0° latitude; latitude counts degrees north or south from it.", difficulty: "foundational", gedCode: "SS.5.1", skillNodeId: "SOC.GEO.004" },
    ]
  },
  {
    number: 2,
    title: "Human Geography and Migration",
    gedCode: "SS.5.2",
    keyTerms: ["migration", "push factor", "pull factor", "urbanization", "population density"],
    content: "HUMAN GEOGRAPHY AND MIGRATION\n\nPUSH FACTORS drive people OUT: drought, war, job loss,\npersecution. PULL FACTORS draw people IN: work, safety,\nfamily, land. Every migration story is some mix of both\n\nURBANIZATION: as economies industrialize, people move from\nfarms to cities — the pattern behind the Great Migration,\nthe growth of factory towns, and today's megacities\n\nPOPULATION DENSITY = people ÷ area. Dense ≠ crowded in the\nsame way everywhere: deserts and tundra stay sparse because\nwater and climate, not preference, set the limit\n\nREAD MIGRATION MAPS by the arrows' direction AND size —\na thick arrow is a claim about scale, not just movement",
    practiceQuestions: [
      { provenance: { source: "authored" }, id: "SS.5.2-A1", question: "A factory closes in a mining town, and many families leave to find work elsewhere. The factory closing is best described as a —", type: "mcq", choices: { A: "pull factor", B: "push factor", C: "physical feature", D: "population density" }, answer: "B", explanation: "Job loss pushes people out — a push factor. The jobs they move toward would be the pull.", difficulty: "foundational", gedCode: "SS.5.2", skillNodeId: "SOC.GEO.004" },
      { provenance: { source: "authored" }, id: "SS.5.2-A2", question: "Arrange the countries from largest to smallest land area.", type: "drag_drop", dragItems: ["United States", "Russia", "China", "Canada"], answer: "Russia | Canada | China | United States", explanation: "Land area: Russia (largest) > Canada > China > United States.", difficulty: "standard", gedCode: "SS.5.2", skillNodeId: "SOC.GEO.004" },
      { provenance: { source: "authored" }, id: "SS.5.2-A3", question: "Give one push factor and one pull factor that could explain a family's decision to migrate.", type: "short_answer", answer: "Push: drought ruined the farm. Pull: factory jobs were available in the city.", answerKeywords: ["push", "pull"], explanation: "A complete answer names both directions of the decision — what drove the family out and what drew them in.", difficulty: "standard", gedCode: "SS.5.2", skillNodeId: "SOC.GEO.004" },
      { provenance: { source: "authored" }, id: "SS.5.2-A4", question: "The movement of people from farms and small towns into cities as factories grow is called —", type: "mcq", choices: { A: "urbanization", B: "emigration", C: "segregation", D: "irrigation" }, answer: "A", explanation: "Urbanization is the shift of population into cities; emigration is leaving a country, segregation is enforced separation, irrigation is watering farmland.", difficulty: "foundational", gedCode: "SS.5.2", skillNodeId: "SOC.GEO.004" },
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
      lessons: RLA_CH3_LESSONS,
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
      lessons: RLA_CH5_LESSONS,
    },
    {
      number: 6,
      title: 'Writing About Text (Extended Response)',
      topics: ['Unpack the Prompt', 'Identify Arguments', 'Thesis Statement', 'Evidence', 'Plan', 'Draft', 'Revise'],
      content: 'The GED Extended Response asks you to analyze two passages and write a structured essay. This chapter walks through every step of the process.',
      lessons: RLA_CH6_LESSONS,
    },
    {
      number: 7,
      title: 'Polishing Your Writing',
      topics: ['Strengthen Sentences', 'Improve Organization', 'Word Choice'],
      content: 'Revision skills that improve the quality and clarity of written responses.',
      lessons: RLA_CH7_LESSONS,
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
      lessons: MATH_CH1_LESSONS,
    },
    {
      number: 2, title: 'Decimals and Fractions',
      topics: ['Decimal Operations', 'Fraction Operations', 'Comparing Fractions', 'Mixed Numbers'],
      content: 'Working fluently with decimals and fractions is required for approximately 45% of GED Math questions.',
      lessons: MATH_CH2_LESSONS,
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
      lessons: MATH_CH4_LESSONS,
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
      lessons: SS_CH1_LESSONS,
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
      lessons: SS_CH5_LESSONS,
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
