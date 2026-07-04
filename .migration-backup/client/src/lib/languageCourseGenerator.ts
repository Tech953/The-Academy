/**
 * Language Course Generator
 * Procedurally builds GED-schema-compatible lesson + quiz structures from vocabulary tables.
 * Deterministic — same inputs always produce the same questions.
 */

import {
  LangCode, LangMeta, LANG_META,
  VocabEntry, PhraseEntry, GrammarSnapshot, LangChapterDef,
  LANGUAGE_CHAPTERS, ALL_VOCAB,
} from './languageCourseData';
import type { GEDTextbook, GEDChapter, GEDLesson, GEDPracticeQuestion } from '../../shared/schema';

export type { LangCode, LangMeta };
export { LANG_META };

// ─── SEEDED RNG ──────────────────────────────────────────────────────────────

function seededRng(seed: number) {
  let s = seed >>> 0;
  return function next(): number {
    s = ((s * 1664525) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const copy = [...arr];
  const rng = seededRng(seed);
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) { h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0; }
  return Math.abs(h);
}

// ─── CHOICE BUILDER ──────────────────────────────────────────────────────────
// Schema requires: choices: { A, B, C, D }, answer: 'A'|'B'|'C'|'D'

function buildChoices(
  correct: string,
  distractors: string[],
  seed: number,
): { choices: { A: string; B: string; C: string; D: string }; answer: 'A' | 'B' | 'C' | 'D' } {
  const four = seededShuffle([correct, ...distractors.slice(0, 3)], seed);
  while (four.length < 4) four.push('—');
  const keys = ['A', 'B', 'C', 'D'] as const;
  const choices = { A: four[0], B: four[1], C: four[2], D: four[3] };
  const answerIdx = four.indexOf(correct);
  const answer = keys[answerIdx >= 0 ? answerIdx : 0];
  return { choices, answer };
}

// ─── DISTRACTOR POOL ─────────────────────────────────────────────────────────

function pickDistractors(
  correct: string,
  pool: string[],
  seed: number,
): string[] {
  const others = pool.filter(v => v !== correct && v.trim() !== '' && v !== '—');
  const shuffled = seededShuffle(others, seed);
  const result = shuffled.slice(0, 3);
  while (result.length < 3) result.push('—');
  return result;
}

// ─── QUESTION GENERATORS ─────────────────────────────────────────────────────

/** "What does '[target word]' mean in English?" */
function genRecognitionQ(
  entry: VocabEntry,
  lang: LangCode,
  pool: VocabEntry[],
  seed: number,
  index: number,
): GEDPracticeQuestion {
  const targetWord = lang === 'zh'
    ? `${entry.zh} (${entry.zhPinyin})`
    : entry[lang];
  const correct = entry.english;
  const distractorPool = pool
    .filter(e => e.english !== correct)
    .map(e => e.english);
  const distractors = pickDistractors(correct, distractorPool, seed);
  const { choices, answer } = buildChoices(correct, distractors, seed + 1);

  return {
    id: `${lang}-recog-${index}`,
    question: `What does "${targetWord}" mean in English?`,
    type: 'mcq',
    choices,
    answer,
    explanation: `"${targetWord}" means "${correct}" in ${LANG_META[lang].name}. It is a ${entry.category} word.`,
    difficulty: 'foundational',
    gedCode: `LANG.${lang.toUpperCase()}.1`,
    skillNodeId: `lang-${lang}-vocab`,
  };
}

/** "How do you say '[english]' in [language]?" */
function genProductionQ(
  entry: VocabEntry,
  lang: LangCode,
  pool: VocabEntry[],
  seed: number,
  index: number,
): GEDPracticeQuestion {
  const correct = lang === 'zh'
    ? `${entry.zh} (${entry.zhPinyin})`
    : entry[lang];
  const distractorPool = pool
    .filter(e => e.english !== entry.english)
    .map(e => lang === 'zh' ? `${e.zh} (${e.zhPinyin})` : e[lang]);
  const distractors = pickDistractors(correct, distractorPool, seed);
  const { choices, answer } = buildChoices(correct, distractors, seed + 1);

  return {
    id: `${lang}-prod-${index}`,
    question: `How do you say "${entry.english}" in ${LANG_META[lang].name}?`,
    type: 'mcq',
    choices,
    answer,
    explanation: `"${entry.english}" translates to "${correct}" in ${LANG_META[lang].name}.`,
    difficulty: 'standard',
    gedCode: `LANG.${lang.toUpperCase()}.2`,
    skillNodeId: `lang-${lang}-vocab`,
  };
}

/** "Which language uses '[word]' for [english]?" */
function genLangIdQ(
  entry: VocabEntry,
  targetLang: LangCode,
  seed: number,
  index: number,
): GEDPracticeQuestion {
  const word = targetLang === 'zh' ? entry.zh : entry[targetLang];
  const correct = LANG_META[targetLang].name;
  const allCodes: LangCode[] = ['es', 'fr', 'de', 'zh'];
  const distractors = allCodes.filter(c => c !== targetLang).map(c => LANG_META[c].name);
  const { choices, answer } = buildChoices(correct, distractors, seed);

  return {
    id: `${targetLang}-langid-${index}`,
    question: `The word "${word}" means "${entry.english}." Which language is this?`,
    type: 'mcq',
    choices,
    answer,
    explanation: `"${word}" is the ${LANG_META[targetLang].name} word for "${entry.english}." ${LANG_META[targetLang].nativeName} is spoken by approximately ${LANG_META[targetLang].speakers} people worldwide.`,
    difficulty: 'foundational',
    gedCode: `LANG.${targetLang.toUpperCase()}.0`,
    skillNodeId: `lang-${targetLang}-recognition`,
  };
}

/** Grammar MCQ — pool of hardcoded questions per language */
const GRAMMAR_Q_POOLS: Record<LangCode, Array<{
  q: string; a: string; wrong: string[]; exp: string;
}>> = {
  es: [
    { q: 'What is the masculine singular definite article in Spanish?', a: 'el', wrong: ['la', 'los', 'un'], exp: '"El" is the masculine singular definite article (the). "La" is feminine. "Los" is masculine plural.' },
    { q: 'How do you say "I speak" in Spanish?', a: 'hablo', wrong: ['hablas', 'habla', 'hablan'], exp: 'The yo (I) form of hablar is "hablo". The -o ending marks first person singular.' },
    { q: 'Which word means "to have" in Spanish?', a: 'tener', wrong: ['ser', 'estar', 'ir'], exp: '"Tener" means to have. "Ser/estar" both mean to be. "Ir" means to go.' },
    { q: 'How is negation formed in Spanish?', a: 'Place "no" before the verb', wrong: ['Place "no" after the verb', 'Use "non" before the verb', 'Add "-no" to the end of the verb'], exp: 'Spanish negation is simple: put "no" directly before the conjugated verb. E.g.: No hablo inglés.' },
    { q: 'What punctuation mark opens a Spanish question?', a: '¿', wrong: ['¡', '/', '«'], exp: 'Spanish uses an inverted question mark ¿ at the beginning and ? at the end of every question.' },
    { q: 'What are the two Spanish verbs that mean "to be"?', a: 'ser and estar', wrong: ['ser and tener', 'estar and haber', 'ir and ser'], exp: '"Ser" is used for permanent traits; "estar" is used for temporary states and locations.' },
  ],
  fr: [
    { q: 'Which article means "the" for a masculine noun in French?', a: 'le', wrong: ['la', 'les', 'une'], exp: '"Le" is the masculine definite article. "La" is feminine. "Les" is plural for all genders.' },
    { q: 'How do you say "I am" in French?', a: 'je suis', wrong: ["j'ai", 'je vais', 'je fais'], exp: '"Je suis" uses être (to be). "J\'ai" = I have (avoir). "Je vais" = I go (aller).' },
    { q: 'How is negation formed in French?', a: 'ne ... pas around the verb', wrong: ['pas before the verb', 'non + verb', 'verb + ne pas'], exp: 'French negation wraps the verb: ne [verb] pas. Example: Je ne parle pas. (I do not speak.)' },
    { q: 'What does "vous" mean in French?', a: 'You (formal or plural)', wrong: ['He', 'She', 'We'], exp: '"Vous" serves as both formal singular "you" and plural "you" for all genders.' },
    { q: 'How many ways can you form a yes/no question in French?', a: 'Three (rising intonation, est-ce que, inversion)', wrong: ['One (inversion only)', 'Two (intonation and est-ce que)', 'Four'], exp: 'French yes/no questions can use: 1) rising intonation, 2) est-ce que, or 3) subject-verb inversion.' },
    { q: 'Which contraction is used when "le" or "la" comes before a vowel?', a: "l'", wrong: ['du', 'de la', 'les'], exp: 'Before a vowel or silent h, le/la contract to l\': l\'homme (the man), l\'école (the school).' },
  ],
  de: [
    { q: 'Which definite article goes with a masculine noun (nominative) in German?', a: 'der', wrong: ['die', 'das', 'den'], exp: '"Der" is the masculine nominative article. "Die" is feminine or plural. "Das" is neuter.' },
    { q: 'How do you say "I have" in German?', a: 'ich habe', wrong: ['ich bin', 'ich gehe', 'ich esse'], exp: '"Ich habe" uses haben (to have). "Ich bin" = I am. "Ich gehe" = I go. "Ich esse" = I eat.' },
    { q: 'In a German statement, where does the verb go?', a: 'Second position (V2 rule)', wrong: ['First position', 'Last position', 'After the object'], exp: 'German verbs always occupy the second position. If a time phrase starts the sentence, the subject comes after the verb.' },
    { q: 'Which negation word is used with nouns in German?', a: 'kein/keine', wrong: ['nicht', 'nein', 'nie'], exp: '"Kein/keine" negates nouns. "Nicht" negates verbs, adjectives, and adverbs.' },
    { q: 'How many grammatical genders does German have?', a: 'Three (masculine, feminine, neuter)', wrong: ['Two (masculine, feminine)', 'One (universal)', 'Four'], exp: 'German has three genders: masculine (der), feminine (die), neuter (das). Each must be memorized with the noun.' },
    { q: 'In German writing, which words are always capitalized?', a: 'All nouns', wrong: ['Only proper nouns', 'Only the first word of a sentence', 'Verbs and nouns'], exp: 'In German, ALL nouns are capitalized regardless of their position in the sentence: das Buch, die Frau, der Mann.' },
  ],
  zh: [
    { q: 'Does Chinese have grammatical articles like "the" or "a"?', a: 'No — Chinese has no articles', wrong: ['Yes, one article: 的', 'Yes, two articles: 一 and 这', 'Only for countable nouns'], exp: 'Chinese has no articles. Context and measure words (量词) serve this function when counting nouns.' },
    { q: 'Which particle turns a statement into a yes/no question in Chinese?', a: '吗 (ma)', wrong: ['了 (le)', '的 (de)', '呢 (ne)'], exp: 'Add 吗 (ma) to the end of a statement: 你好吗？(Nǐ hǎo ma?) — Are you well?' },
    { q: 'How do you negate a verb in Chinese (present/future)?', a: '不 (bù) before the verb', wrong: ['没 (méi) after the verb', '非 (fēi) before the sentence', 'Reverse the verb order'], exp: '不 (bù) goes directly before the verb: 我不去 (I am not going). Use 没 for past tense or to negate 有 (to have).' },
    { q: 'What is the basic word order in Chinese?', a: 'Subject + Verb + Object', wrong: ['Verb + Subject + Object', 'Object + Verb + Subject', 'Subject + Object + Verb'], exp: 'Chinese uses SVO order, same as English: 我爱你 (Wǒ ài nǐ) = I love you.' },
    { q: 'Do Chinese verbs change form for tense or person?', a: 'No — verbs never conjugate', wrong: ['Yes, for tense only', 'Yes, for person only', 'Yes, for both'], exp: 'Chinese verbs are invariant. Time words (today, tomorrow) and particles like 了 (completed action) mark tense instead.' },
    { q: 'What are the 4 tones of Mandarin Chinese?', a: '1st (flat), 2nd (rising), 3rd (dip-rise), 4th (falling)', wrong: ['High, medium, low, neutral', 'Sharp, flat, round, silent', 'There are only 2 tones'], exp: 'Mandarin has 4 tones: 1st tone (ā, high flat), 2nd tone (á, rising), 3rd tone (ǎ, dip then rise), 4th tone (à, falling). Tone changes meaning completely.' },
  ],
};

function genGrammarQ(lang: LangCode, seed: number, index: number): GEDPracticeQuestion {
  const pool = GRAMMAR_Q_POOLS[lang];
  const item = pool[index % pool.length];
  const { choices, answer } = buildChoices(item.a, item.wrong, seed);
  return {
    id: `${lang}-grammar-${index}`,
    question: item.q,
    type: 'mcq',
    choices,
    answer,
    explanation: item.exp,
    difficulty: 'standard',
    gedCode: `LANG.${lang.toUpperCase()}.3`,
    skillNodeId: `lang-${lang}-grammar`,
  };
}

// ─── LESSON CONTENT BUILDER ───────────────────────────────────────────────────

function buildLessonContent(
  lang: LangCode,
  sectionTitle: string,
  vocab: VocabEntry[],
  phrases?: PhraseEntry[],
  grammar?: GrammarSnapshot,
): string {
  const meta = LANG_META[lang];
  const displayWord = (e: VocabEntry) =>
    lang === 'zh'
      ? `${e.zh} (${e.zhPinyin}) — ${e.english}`
      : `${e[lang]} — ${e.english}`;

  let out = `[ ${meta.nativeName.toUpperCase()} · ${sectionTitle.toUpperCase()} ]\n\n`;

  if (grammar) {
    out += `=== GRAMMAR FOCUS ===\n\n${grammar.content[lang]}\n\n`;
  }

  if (vocab.length > 0) {
    out += `=== VOCABULARY (${vocab.length} words) ===\n\n`;
    vocab.forEach(v => { out += `  • ${displayWord(v)}\n`; });
    out += '\n';
  }

  if (phrases && phrases.length > 0) {
    out += `=== KEY PHRASES ===\n\n`;
    phrases.slice(0, 5).forEach(p => {
      const phrase = lang === 'zh' ? `${p.zh} (${p.zhPinyin})` : p[lang];
      out += `  • ${p.english}\n    → ${phrase}\n`;
      if (p.context) out += `    [${p.context}]\n`;
    });
    out += '\n';
  }

  out += `=== STUDY TIPS ===\n\n`;
  if (lang === 'es') out += `• Spanish is phonetic — every letter is pronounced consistently.\n• Nouns have gender (masculine/feminine). Learn the article (el/la) with each noun.\n• Practice rolling your Rs (rr) by saying "butter" very fast.\n`;
  if (lang === 'fr') out += `• Many final consonants are silent in French. Focus on nasal vowels (an, en, in, on, un).\n• Pay attention to accents: é (ay), è (eh), ê (ay-elongated), ç (s-sound).\n• Liaisons connect words when a consonant-ending word precedes a vowel-starting word.\n`;
  if (lang === 'de') out += `• Capitalize ALL nouns in German — it's a grammar rule, not a style choice.\n• Learn der/die/das (the) together with each noun — gender must be memorized.\n• Verb always goes in position 2 (V2 word order) in main clauses.\n`;
  if (lang === 'zh') out += `• Mandarin has 4 tones + neutral tone. The same syllable means different things in different tones.\n• Start with pinyin (romanization) before tackling characters.\n• Learn measure words (量词) together with their nouns: 一本书 (one book), 一个人 (one person).\n`;

  return out;
}

// ─── LESSON FACTORY ───────────────────────────────────────────────────────────

function buildLessons(
  lang: LangCode,
  chDef: LangChapterDef,
  chIdx: number,
): GEDLesson[] {
  const lessons: GEDLesson[] = [];
  const chapterVocab = chDef.vocabSets.flat();
  const baseSeed = hashStr(`${lang}-ch${chIdx}`);

  // ── Lesson 1: Vocabulary ────────────────────────────────────────────────────
  const vocabQuestions: GEDPracticeQuestion[] = [];
  const shuffledVocab = seededShuffle(chapterVocab, baseSeed);
  shuffledVocab.slice(0, 6).forEach((entry, i) => {
    const seed = hashStr(`${lang}-${chIdx}-v-${i}`);
    vocabQuestions.push(i % 2 === 0
      ? genRecognitionQ(entry, lang, ALL_VOCAB, seed, chIdx * 1000 + i)
      : genProductionQ(entry, lang, ALL_VOCAB, seed, chIdx * 1000 + 100 + i),
    );
  });

  lessons.push({
    number: 1,
    title: `Vocabulary — ${chDef.title}`,
    gedCode: `${lang.toUpperCase()}.Ch${chIdx + 1}.L1`,
    content: buildLessonContent(lang, `${chDef.title} — Vocabulary`, chapterVocab, chDef.phrases),
    keyTerms: chapterVocab.map(v =>
      lang === 'zh' ? `${v.zh} (${v.zhPinyin}) = ${v.english}` : `${v[lang]} = ${v.english}`,
    ),
    practiceQuestions: vocabQuestions,
  });

  // ── Lesson 2: Grammar & Phrases ─────────────────────────────────────────────
  if (chDef.grammar || (chDef.phrases && chDef.phrases.length > 0)) {
    const grammarQuestions: GEDPracticeQuestion[] = [];
    for (let i = 0; i < 3; i++) {
      grammarQuestions.push(genGrammarQ(lang, hashStr(`${lang}-${chIdx}-g-${i}`), chIdx * 6 + i));
    }
    const idVocab = seededShuffle(chapterVocab, baseSeed + 7);
    idVocab.slice(0, 2).forEach((entry, i) => {
      grammarQuestions.push(genLangIdQ(entry, lang, hashStr(`${lang}-${chIdx}-id-${i}`), chIdx * 1000 + 200 + i));
    });

    lessons.push({
      number: 2,
      title: `Grammar & Phrases — ${chDef.title}`,
      gedCode: `${lang.toUpperCase()}.Ch${chIdx + 1}.L2`,
      content: buildLessonContent(lang, `${chDef.title} — Grammar`, [], chDef.phrases, chDef.grammar),
      keyTerms: [],
      practiceQuestions: grammarQuestions,
    });
  }

  // ── Lesson 3: Mixed Review ───────────────────────────────────────────────────
  const reviewVocab = seededShuffle(chapterVocab, baseSeed + 13);
  const reviewQuestions: GEDPracticeQuestion[] = [];
  reviewVocab.slice(0, 4).forEach((entry, i) => {
    const seed = hashStr(`${lang}-${chIdx}-r-${i}`);
    reviewQuestions.push(i % 2 === 0
      ? genProductionQ(entry, lang, ALL_VOCAB, seed, chIdx * 1000 + 300 + i)
      : genRecognitionQ(entry, lang, ALL_VOCAB, seed, chIdx * 1000 + 400 + i),
    );
  });
  reviewQuestions.push(genGrammarQ(lang, hashStr(`${lang}-${chIdx}-review-g`), chIdx * 6 + 5));

  lessons.push({
    number: lessons.length + 1,
    title: `Review — ${chDef.title}`,
    gedCode: `${lang.toUpperCase()}.Ch${chIdx + 1}.L${lessons.length + 1}`,
    content: buildLessonContent(lang, `${chDef.title} — Review`, reviewVocab.slice(0, 6)),
    keyTerms: [],
    practiceQuestions: reviewQuestions,
  });

  return lessons;
}

// ─── TEXTBOOK FACTORY ─────────────────────────────────────────────────────────

export function generateLanguageTextbook(lang: LangCode): GEDTextbook {
  const meta = LANG_META[lang];
  const langSubject = `Language: ${meta.name}` as GEDTextbook['subject'];

  const chapters: GEDChapter[] = LANGUAGE_CHAPTERS.map((chDef, idx) => ({
    number: chDef.number,
    title: chDef.title,
    topics: chDef.vocabSets.map(vs => vs[0]?.category ?? '').filter(Boolean),
    content: chDef.description,
    lessons: buildLessons(lang, chDef, idx),
  }));

  return {
    id: `lang-${lang}`,
    subject: langSubject,
    title: `${meta.nativeName} — ${meta.name} for Beginners`,
    description: `A structured introduction to ${meta.name} (${meta.nativeName}). Covers essential vocabulary, grammar, and practical phrases across ${LANGUAGE_CHAPTERS.length} chapters. Approximately ${meta.speakers} native speakers worldwide. Writing system: ${meta.writingSystem}.`,
    chapters,
  };
}

export function generateAllLanguageTextbooks(): Record<LangCode, GEDTextbook> {
  return {
    es: generateLanguageTextbook('es'),
    fr: generateLanguageTextbook('fr'),
    de: generateLanguageTextbook('de'),
    zh: generateLanguageTextbook('zh'),
  };
}

/** Stat bonuses awarded for language course completion */
export const LANGUAGE_STAT_MAP: Record<LangCode, Array<{ stat: string; bonus: number }>> = {
  es: [{ stat: 'linguistic', bonus: 2 }, { stat: 'presence', bonus: 1 }],
  fr: [{ stat: 'linguistic', bonus: 2 }, { stat: 'intuition', bonus: 1 }],
  de: [{ stat: 'linguistic', bonus: 2 }, { stat: 'mathLogic', bonus: 1 }],
  zh: [{ stat: 'linguistic', bonus: 3 }, { stat: 'perception', bonus: 1 }],
};
