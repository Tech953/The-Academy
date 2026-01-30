import { i18nManager } from './i18n';
import { GED_TEXTBOOKS } from './gedContent';
import { GEDTextbook, GEDChapter } from '@shared/schema';

interface LocalizedStrings {
  studyMaterials: string;
  availableTextbooks: string;
  subject: string;
  chapters: string;
  tableOfContents: string;
  chapter: string;
  topics: string;
  practiceQuestions: string;
  viewContents: string;
  readChapter: string;
  mathReasoning: string;
  languageArts: string;
  science: string;
  socialStudies: string;
}

const CONTENT_STRINGS: Record<string, LocalizedStrings> = {
  en: {
    studyMaterials: 'GED STUDY MATERIALS',
    availableTextbooks: 'Available Textbooks',
    subject: 'Subject',
    chapters: 'Chapters',
    tableOfContents: 'TABLE OF CONTENTS',
    chapter: 'Chapter',
    topics: 'Topics',
    practiceQuestions: 'PRACTICE QUESTIONS',
    viewContents: 'Type TEXTBOOK [subject] to view table of contents.',
    readChapter: 'Type READ [subject] CHAPTER [number] to read a chapter.',
    mathReasoning: 'Mathematical Reasoning',
    languageArts: 'Language Arts',
    science: 'Science',
    socialStudies: 'Social Studies'
  },
  es: {
    studyMaterials: 'MATERIALES DE ESTUDIO GED',
    availableTextbooks: 'Libros de Texto Disponibles',
    subject: 'Materia',
    chapters: 'Capítulos',
    tableOfContents: 'ÍNDICE',
    chapter: 'Capítulo',
    topics: 'Temas',
    practiceQuestions: 'PREGUNTAS DE PRÁCTICA',
    viewContents: 'Escribe TEXTBOOK [materia] para ver el índice.',
    readChapter: 'Escribe READ [materia] CHAPTER [número] para leer un capítulo.',
    mathReasoning: 'Razonamiento Matemático',
    languageArts: 'Artes del Lenguaje',
    science: 'Ciencias',
    socialStudies: 'Estudios Sociales'
  },
  fr: {
    studyMaterials: 'MATÉRIEL D\'ÉTUDE GED',
    availableTextbooks: 'Manuels Disponibles',
    subject: 'Matière',
    chapters: 'Chapitres',
    tableOfContents: 'TABLE DES MATIÈRES',
    chapter: 'Chapitre',
    topics: 'Sujets',
    practiceQuestions: 'QUESTIONS PRATIQUES',
    viewContents: 'Tapez TEXTBOOK [matière] pour voir le sommaire.',
    readChapter: 'Tapez READ [matière] CHAPTER [numéro] pour lire un chapitre.',
    mathReasoning: 'Raisonnement Mathématique',
    languageArts: 'Arts du Langage',
    science: 'Sciences',
    socialStudies: 'Sciences Sociales'
  },
  de: {
    studyMaterials: 'GED LERNMATERIALIEN',
    availableTextbooks: 'Verfügbare Lehrbücher',
    subject: 'Fach',
    chapters: 'Kapitel',
    tableOfContents: 'INHALTSVERZEICHNIS',
    chapter: 'Kapitel',
    topics: 'Themen',
    practiceQuestions: 'ÜBUNGSFRAGEN',
    viewContents: 'Geben Sie TEXTBOOK [Fach] ein, um das Inhaltsverzeichnis anzuzeigen.',
    readChapter: 'Geben Sie READ [Fach] CHAPTER [Nummer] ein, um ein Kapitel zu lesen.',
    mathReasoning: 'Mathematisches Denken',
    languageArts: 'Sprachkünste',
    science: 'Naturwissenschaften',
    socialStudies: 'Sozialkunde'
  },
  zh: {
    studyMaterials: 'GED学习资料',
    availableTextbooks: '可用教科书',
    subject: '科目',
    chapters: '章节',
    tableOfContents: '目录',
    chapter: '第',
    topics: '主题',
    practiceQuestions: '练习题',
    viewContents: '输入 TEXTBOOK [科目] 查看目录。',
    readChapter: '输入 READ [科目] CHAPTER [章节号] 阅读章节。',
    mathReasoning: '数学推理',
    languageArts: '语言艺术',
    science: '科学',
    socialStudies: '社会研究'
  }
};

function getLocalizedStrings(): LocalizedStrings {
  const lang = i18nManager.getLanguageCode();
  return CONTENT_STRINGS[lang] || CONTENT_STRINGS.en;
}

export function getLocalizedSubjectName(subject: string): string {
  const strings = getLocalizedStrings();
  const subjectMap: Record<string, string> = {
    'Mathematical Reasoning': strings.mathReasoning,
    'Language Arts': strings.languageArts,
    'Science': strings.science,
    'Social Studies': strings.socialStudies
  };
  return subjectMap[subject] || subject;
}

export function getLocalizedTextbooksList(): string {
  const strings = getLocalizedStrings();
  const lines: string[] = [
    `=== ${strings.studyMaterials} ===`,
    '',
    `${strings.availableTextbooks}:`,
    ''
  ];

  GED_TEXTBOOKS.forEach(textbook => {
    const localizedSubject = getLocalizedSubjectName(textbook.subject);
    lines.push(`[${textbook.id}] ${textbook.title}`);
    lines.push(`  ${strings.subject}: ${localizedSubject}`);
    lines.push(`  ${strings.chapters}: ${textbook.chapters.length}`);
    lines.push('');
  });

  lines.push(strings.viewContents);
  lines.push(strings.readChapter);

  return lines.join('\n');
}

export function getLocalizedTextbookIndex(textbook: GEDTextbook): string {
  const strings = getLocalizedStrings();
  const localizedSubject = getLocalizedSubjectName(textbook.subject);
  
  const lines: string[] = [
    `=== ${textbook.title} ===`,
    '',
    `${strings.subject}: ${localizedSubject}`,
    '',
    `${strings.tableOfContents}:`,
    ''
  ];

  textbook.chapters.forEach(chapter => {
    lines.push(`${strings.chapter} ${chapter.number}: ${chapter.title}`);
    lines.push(`  ${strings.topics}: ${chapter.topics.join(', ')}`);
    lines.push('');
  });

  lines.push(strings.readChapter);
  
  return lines.join('\n');
}

export function getLocalizedChapterContent(chapter: GEDChapter, subject: string): string {
  const strings = getLocalizedStrings();
  const localizedSubject = getLocalizedSubjectName(subject);
  
  const lines: string[] = [
    `=== ${strings.chapter} ${chapter.number}: ${chapter.title} ===`,
    `${strings.subject}: ${localizedSubject}`,
    '',
    chapter.content
  ];

  if (chapter.practiceQuestions && chapter.practiceQuestions.length > 0) {
    lines.push('---');
    lines.push('');
    lines.push(`${strings.practiceQuestions}:`);
    lines.push('');
    chapter.practiceQuestions.forEach((q, idx) => {
      lines.push(`${idx + 1}. ${q.question}`);
    });
  }

  return lines.join('\n');
}

export interface TextbookLabels {
  authors: string;
  edition: string;
  department: string;
  toc: string;
  chapter: string;
  commands: string;
  keyTerms: string;
  moreTerms: string;
  readChapter: string;
  viewLecture: string;
}

export interface ChapterLabels {
  chapter: string;
  summary: string;
  section: string;
  keyPoints: string;
  examples: string;
}

export interface LectureLabels {
  duration: string;
  topic: string;
  objectives: string;
  content: string;
  keyTerms: string;
  examples: string;
}

const TEXTBOOK_LABELS: Record<string, TextbookLabels> = {
  en: { authors: 'Authors', edition: 'Edition', department: 'Department', toc: 'TABLE OF CONTENTS', chapter: 'Chapter', commands: 'COMMANDS', keyTerms: 'KEY TERMS', moreTerms: 'more terms', readChapter: 'Read a specific chapter', viewLecture: 'View lecture notes' },
  es: { authors: 'Autores', edition: 'Edición', department: 'Departamento', toc: 'ÍNDICE', chapter: 'Capítulo', commands: 'COMANDOS', keyTerms: 'TÉRMINOS CLAVE', moreTerms: 'términos más', readChapter: 'Leer un capítulo específico', viewLecture: 'Ver notas de clase' },
  fr: { authors: 'Auteurs', edition: 'Édition', department: 'Département', toc: 'TABLE DES MATIÈRES', chapter: 'Chapitre', commands: 'COMMANDES', keyTerms: 'TERMES CLÉS', moreTerms: 'termes supplémentaires', readChapter: 'Lire un chapitre spécifique', viewLecture: 'Voir les notes de cours' },
  de: { authors: 'Autoren', edition: 'Ausgabe', department: 'Abteilung', toc: 'INHALTSVERZEICHNIS', chapter: 'Kapitel', commands: 'BEFEHLE', keyTerms: 'SCHLÜSSELBEGRIFFE', moreTerms: 'weitere Begriffe', readChapter: 'Ein bestimmtes Kapitel lesen', viewLecture: 'Vorlesungsnotizen ansehen' },
  zh: { authors: '作者', edition: '版本', department: '部门', toc: '目录', chapter: '第', commands: '命令', keyTerms: '关键术语', moreTerms: '更多术语', readChapter: '阅读特定章节', viewLecture: '查看讲座笔记' }
};

const CHAPTER_LABELS: Record<string, ChapterLabels> = {
  en: { chapter: 'Chapter', summary: 'CHAPTER SUMMARY', section: 'SECTION', keyPoints: 'Key Points', examples: 'Examples' },
  es: { chapter: 'Capítulo', summary: 'RESUMEN DEL CAPÍTULO', section: 'SECCIÓN', keyPoints: 'Puntos Clave', examples: 'Ejemplos' },
  fr: { chapter: 'Chapitre', summary: 'RÉSUMÉ DU CHAPITRE', section: 'SECTION', keyPoints: 'Points Clés', examples: 'Exemples' },
  de: { chapter: 'Kapitel', summary: 'KAPITELZUSAMMENFASSUNG', section: 'ABSCHNITT', keyPoints: 'Kernpunkte', examples: 'Beispiele' },
  zh: { chapter: '第', summary: '章节摘要', section: '部分', keyPoints: '要点', examples: '示例' }
};

const LECTURE_LABELS: Record<string, LectureLabels> = {
  en: { duration: 'Duration', topic: 'Topic', objectives: 'LEARNING OBJECTIVES', content: 'LECTURE CONTENT', keyTerms: 'KEY TERMS', examples: 'EXAMPLES' },
  es: { duration: 'Duración', topic: 'Tema', objectives: 'OBJETIVOS DE APRENDIZAJE', content: 'CONTENIDO DE LA CLASE', keyTerms: 'TÉRMINOS CLAVE', examples: 'EJEMPLOS' },
  fr: { duration: 'Durée', topic: 'Sujet', objectives: 'OBJECTIFS D\'APPRENTISSAGE', content: 'CONTENU DU COURS', keyTerms: 'TERMES CLÉS', examples: 'EXEMPLES' },
  de: { duration: 'Dauer', topic: 'Thema', objectives: 'LERNZIELE', content: 'VORLESUNGSINHALT', keyTerms: 'SCHLÜSSELBEGRIFFE', examples: 'BEISPIELE' },
  zh: { duration: '时长', topic: '主题', objectives: '学习目标', content: '讲座内容', keyTerms: '关键术语', examples: '示例' }
};

export class LocalizedContentManager {
  getTextbooksList(): string {
    return getLocalizedTextbooksList();
  }

  getTextbookIndex(textbookId: string): string | null {
    const textbook = GED_TEXTBOOKS.find(t => t.id === textbookId);
    if (!textbook) return null;
    return getLocalizedTextbookIndex(textbook);
  }

  getChapterContent(textbookId: string, chapterNumber: number): string | null {
    const textbook = GED_TEXTBOOKS.find(t => t.id === textbookId);
    if (!textbook) return null;
    
    const chapter = textbook.chapters.find(c => c.number === chapterNumber);
    if (!chapter) return null;
    
    return getLocalizedChapterContent(chapter, textbook.subject);
  }

  getSubjectName(subject: string): string {
    return getLocalizedSubjectName(subject);
  }

  getCurrentLanguage(): string {
    return i18nManager.getLanguageCode();
  }

  getTextbookLabels(): TextbookLabels {
    const lang = i18nManager.getLanguageCode();
    return TEXTBOOK_LABELS[lang] || TEXTBOOK_LABELS.en;
  }

  getChapterLabels(): ChapterLabels {
    const lang = i18nManager.getLanguageCode();
    return CHAPTER_LABELS[lang] || CHAPTER_LABELS.en;
  }

  getLectureLabels(): LectureLabels {
    const lang = i18nManager.getLanguageCode();
    return LECTURE_LABELS[lang] || LECTURE_LABELS.en;
  }
}

export const localizedContentManager = new LocalizedContentManager();
