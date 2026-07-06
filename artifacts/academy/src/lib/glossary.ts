export interface GlossaryEntry {
  term: string;
  definition: string;
  subject: string;
  relatedTerms?: string[];
  example?: string;
}

export interface SubjectGlossary {
  subject: string;
  subjectName: string;
  entries: Record<string, GlossaryEntry>;
}

type LanguageGlossaries = Record<string, Record<string, SubjectGlossary>>;

const GLOSSARIES: LanguageGlossaries = {
  en: {
    math: {
      subject: 'math',
      subjectName: 'Mathematical Reasoning',
      entries: {
        'variable': {
          term: 'Variable',
          definition: 'A symbol (usually a letter) that represents an unknown or changeable value in an expression or equation.',
          subject: 'math',
          relatedTerms: ['constant', 'coefficient', 'expression'],
          example: 'In the equation x + 5 = 10, x is a variable.'
        },
        'coefficient': {
          term: 'Coefficient',
          definition: 'A number that multiplies a variable in an algebraic expression.',
          subject: 'math',
          relatedTerms: ['variable', 'constant'],
          example: 'In 3x, the coefficient is 3.'
        },
        'equation': {
          term: 'Equation',
          definition: 'A mathematical statement showing that two expressions are equal, using the = symbol.',
          subject: 'math',
          relatedTerms: ['expression', 'variable', 'solution'],
          example: '2x + 3 = 7 is an equation.'
        },
        'integer': {
          term: 'Integer',
          definition: 'A whole number that can be positive, negative, or zero.',
          subject: 'math',
          relatedTerms: ['rational', 'fraction', 'decimal'],
          example: '-5, 0, and 42 are all integers.'
        },
        'fraction': {
          term: 'Fraction',
          definition: 'A number representing part of a whole, written as one number over another.',
          subject: 'math',
          relatedTerms: ['numerator', 'denominator', 'decimal'],
          example: '3/4 means 3 parts out of 4.'
        },
        'perimeter': {
          term: 'Perimeter',
          definition: 'The total distance around the outside of a two-dimensional shape.',
          subject: 'math',
          relatedTerms: ['area', 'circumference'],
          example: 'A square with 5cm sides has a perimeter of 20cm.'
        },
        'area': {
          term: 'Area',
          definition: 'The amount of space inside a two-dimensional shape, measured in square units.',
          subject: 'math',
          relatedTerms: ['perimeter', 'volume'],
          example: 'A rectangle 4cm x 3cm has an area of 12 square cm.'
        }
      }
    },
    science: {
      subject: 'science',
      subjectName: 'Science',
      entries: {
        'hypothesis': {
          term: 'Hypothesis',
          definition: 'A testable prediction or educated guess about the outcome of an experiment.',
          subject: 'science',
          relatedTerms: ['theory', 'experiment', 'variable'],
          example: 'If I water plants daily, they will grow taller than plants watered weekly.'
        },
        'cell': {
          term: 'Cell',
          definition: 'The basic structural and functional unit of all living organisms.',
          subject: 'science',
          relatedTerms: ['organism', 'nucleus', 'membrane'],
          example: 'Your body is made up of trillions of cells.'
        },
        'atom': {
          term: 'Atom',
          definition: 'The smallest unit of matter that retains the properties of an element.',
          subject: 'science',
          relatedTerms: ['molecule', 'electron', 'proton', 'neutron'],
          example: 'A water molecule contains two hydrogen atoms and one oxygen atom.'
        },
        'ecosystem': {
          term: 'Ecosystem',
          definition: 'A community of living organisms interacting with each other and their physical environment.',
          subject: 'science',
          relatedTerms: ['habitat', 'food chain', 'biodiversity'],
          example: 'A pond ecosystem includes fish, frogs, plants, and microorganisms.'
        },
        'photosynthesis': {
          term: 'Photosynthesis',
          definition: 'The process by which plants convert sunlight, water, and carbon dioxide into glucose and oxygen.',
          subject: 'science',
          relatedTerms: ['chlorophyll', 'glucose', 'respiration'],
          example: 'Plants use photosynthesis to make their own food.'
        }
      }
    },
    language: {
      subject: 'language',
      subjectName: 'Language Arts',
      entries: {
        'thesis': {
          term: 'Thesis',
          definition: 'The main argument or central claim of an essay or research paper.',
          subject: 'language',
          relatedTerms: ['argument', 'conclusion', 'evidence'],
          example: 'A thesis statement appears at the end of the introduction paragraph.'
        },
        'metaphor': {
          term: 'Metaphor',
          definition: 'A figure of speech that directly compares two unlike things without using "like" or "as".',
          subject: 'language',
          relatedTerms: ['simile', 'analogy', 'figurative language'],
          example: '"Life is a journey" is a metaphor.'
        },
        'inference': {
          term: 'Inference',
          definition: 'A conclusion reached based on evidence and reasoning rather than explicit statements.',
          subject: 'language',
          relatedTerms: ['conclusion', 'evidence', 'analysis'],
          example: 'If a character is shivering, you can infer they are cold.'
        },
        'context': {
          term: 'Context',
          definition: 'The circumstances or setting surrounding a word, phrase, or text that help determine its meaning.',
          subject: 'language',
          relatedTerms: ['context clues', 'inference'],
          example: 'The word "bank" means different things in different contexts.'
        }
      }
    },
    social: {
      subject: 'social',
      subjectName: 'Social Studies',
      entries: {
        'democracy': {
          term: 'Democracy',
          definition: 'A system of government where citizens participate in decision-making, typically through elected representatives.',
          subject: 'social',
          relatedTerms: ['republic', 'voting', 'citizenship'],
          example: 'The United States is a democratic republic.'
        },
        'amendment': {
          term: 'Amendment',
          definition: 'A formal change or addition to a legal document, especially the Constitution.',
          subject: 'social',
          relatedTerms: ['constitution', 'bill of rights', 'law'],
          example: 'The First Amendment protects freedom of speech.'
        },
        'economy': {
          term: 'Economy',
          definition: 'The system of producing, distributing, and consuming goods and services in a society.',
          subject: 'social',
          relatedTerms: ['market', 'supply', 'demand'],
          example: 'A healthy economy usually has low unemployment.'
        },
        'civilization': {
          term: 'Civilization',
          definition: 'A complex society characterized by urban development, social hierarchy, and cultural achievements.',
          subject: 'social',
          relatedTerms: ['culture', 'society', 'empire'],
          example: 'Ancient Egypt was one of the earliest civilizations.'
        }
      }
    }
  },
  es: {
    math: {
      subject: 'math',
      subjectName: 'Razonamiento Matemático',
      entries: {
        'variable': {
          term: 'Variable',
          definition: 'Un símbolo (generalmente una letra) que representa un valor desconocido o cambiable en una expresión o ecuación.',
          subject: 'math',
          relatedTerms: ['constante', 'coeficiente', 'expresión'],
          example: 'En la ecuación x + 5 = 10, x es una variable.'
        },
        'ecuacion': {
          term: 'Ecuación',
          definition: 'Una declaración matemática que muestra que dos expresiones son iguales, usando el símbolo =.',
          subject: 'math',
          relatedTerms: ['expresión', 'variable', 'solución'],
          example: '2x + 3 = 7 es una ecuación.'
        },
        'fraccion': {
          term: 'Fracción',
          definition: 'Un número que representa parte de un todo, escrito como un número sobre otro.',
          subject: 'math',
          relatedTerms: ['numerador', 'denominador', 'decimal'],
          example: '3/4 significa 3 partes de 4.'
        }
      }
    },
    science: {
      subject: 'science',
      subjectName: 'Ciencia',
      entries: {
        'hipotesis': {
          term: 'Hipótesis',
          definition: 'Una predicción comprobable o suposición educada sobre el resultado de un experimento.',
          subject: 'science',
          relatedTerms: ['teoría', 'experimento', 'variable'],
          example: 'Si riego las plantas diariamente, crecerán más que las plantas regadas semanalmente.'
        },
        'celula': {
          term: 'Célula',
          definition: 'La unidad estructural y funcional básica de todos los organismos vivos.',
          subject: 'science',
          relatedTerms: ['organismo', 'núcleo', 'membrana'],
          example: 'Tu cuerpo está compuesto por billones de células.'
        }
      }
    }
  }
};

export class GlossaryManager {
  private currentLanguage: string = 'en';

  setLanguage(code: string): void {
    this.currentLanguage = GLOSSARIES[code] ? code : 'en';
  }

  getEntry(term: string, subject?: string): GlossaryEntry | null {
    const langGlossaries = GLOSSARIES[this.currentLanguage] || GLOSSARIES.en;
    const normalizedTerm = term.toLowerCase();

    if (subject) {
      const subjectGlossary = langGlossaries[subject];
      if (subjectGlossary?.entries[normalizedTerm]) {
        return subjectGlossary.entries[normalizedTerm];
      }
    }

    for (const subjectGlossary of Object.values(langGlossaries)) {
      if (subjectGlossary.entries[normalizedTerm]) {
        return subjectGlossary.entries[normalizedTerm];
      }
    }

    return null;
  }

  searchTerms(query: string): GlossaryEntry[] {
    const langGlossaries = GLOSSARIES[this.currentLanguage] || GLOSSARIES.en;
    const normalizedQuery = query.toLowerCase();
    const results: GlossaryEntry[] = [];

    for (const subjectGlossary of Object.values(langGlossaries)) {
      for (const entry of Object.values(subjectGlossary.entries)) {
        if (
          entry.term.toLowerCase().includes(normalizedQuery) ||
          entry.definition.toLowerCase().includes(normalizedQuery)
        ) {
          results.push(entry);
        }
      }
    }

    return results;
  }

  getSubjectGlossary(subject: string): GlossaryEntry[] {
    const langGlossaries = GLOSSARIES[this.currentLanguage] || GLOSSARIES.en;
    const subjectGlossary = langGlossaries[subject];
    
    if (!subjectGlossary) return [];
    return Object.values(subjectGlossary.entries);
  }

  listSubjects(): { code: string; name: string }[] {
    const langGlossaries = GLOSSARIES[this.currentLanguage] || GLOSSARIES.en;
    return Object.values(langGlossaries).map(g => ({
      code: g.subject,
      name: g.subjectName
    }));
  }

  formatEntryForTerminal(entry: GlossaryEntry): string[] {
    const lines: string[] = [
      `╔${'═'.repeat(50)}╗`,
      `║ ${entry.term.toUpperCase().padEnd(48)}║`,
      `╠${'═'.repeat(50)}╣`,
      `║ Subject: ${entry.subject.padEnd(39)}║`,
      `╠${'─'.repeat(50)}╣`,
    ];

    const defWords = entry.definition.split(' ');
    let currentLine = '';
    for (const word of defWords) {
      if (currentLine.length + word.length + 1 > 48) {
        lines.push(`║ ${currentLine.padEnd(48)}║`);
        currentLine = word;
      } else {
        currentLine = currentLine ? `${currentLine} ${word}` : word;
      }
    }
    if (currentLine) {
      lines.push(`║ ${currentLine.padEnd(48)}║`);
    }

    if (entry.example) {
      lines.push(`╠${'─'.repeat(50)}╣`);
      lines.push(`║ Example: ${entry.example.substring(0, 38).padEnd(39)}║`);
    }

    if (entry.relatedTerms && entry.relatedTerms.length > 0) {
      lines.push(`╠${'─'.repeat(50)}╣`);
      lines.push(`║ Related: ${entry.relatedTerms.join(', ').substring(0, 38).padEnd(39)}║`);
    }

    lines.push(`╚${'═'.repeat(50)}╝`);
    return lines;
  }

  formatForTerminal(): string[] {
    const subjects = this.listSubjects();
    return [
      '╔════════════════════════════════════════╗',
      '║           ACADEMY GLOSSARY             ║',
      '╠════════════════════════════════════════╣',
      '║ Subjects:                              ║',
      ...subjects.map(s => `║   ${s.code.toUpperCase()}: ${s.name.padEnd(30)}║`),
      '╚════════════════════════════════════════╝',
      '',
      'Commands:',
      '  GLOSSARY <term>          - Look up a term',
      '  GLOSSARY <subject>       - List terms by subject',
      '  GLOSSARY SEARCH <query>  - Search definitions'
    ];
  }
}

export const glossaryManager = new GlossaryManager();
