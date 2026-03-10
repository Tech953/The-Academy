import { useState, useCallback } from 'react';
import { Copy, CheckCircle, BookOpen, FlaskConical, FileText, RefreshCw, ChevronDown, ChevronUp, Link, Loader } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────
// Color palette (Neo-CRT theme)
// ─────────────────────────────────────────────────────────────────
const C = { amber: '#ffaa00', cyan: '#00ffff', green: '#00ff00', purple: '#cc66ff', pink: '#ff66cc', dim: '#ffffff12', border: '#ffffff18', text: '#cccccc', dark: '#0a0a0a', mid: '#111111' };

// ─────────────────────────────────────────────────────────────────
// Citation data model
// ─────────────────────────────────────────────────────────────────
interface Citation {
  authors: string[];
  year: string;
  title: string;
  sourceType: 'journal' | 'book' | 'website' | 'chapter';
  journal: string;
  volume: string;
  issue: string;
  pages: string;
  publisher: string;
  city: string;
  doi: string;
  url: string;
  edition: string;
  websiteTitle: string;
  accessDate: string;
  bookTitle: string;
  editors: string;
}

const EMPTY_CITATION: Citation = {
  authors: [''], year: '', title: '', sourceType: 'journal',
  journal: '', volume: '', issue: '', pages: '', publisher: '',
  city: '', doi: '', url: '', edition: '', websiteTitle: '',
  accessDate: '', bookTitle: '', editors: '',
};

type Style = 'APA' | 'MLA' | 'CMS' | 'ACS';

// ─────────────────────────────────────────────────────────────────
// Renderers — each returns a formatted reference string
// ─────────────────────────────────────────────────────────────────
function formatAuthorsAPA(authors: string[]): string {
  if (!authors.length || !authors[0]) return '';
  if (authors.length === 1) return authors[0];
  if (authors.length <= 20) {
    const last = authors[authors.length - 1];
    return authors.slice(0, -1).join(', ') + ', & ' + last;
  }
  return authors.slice(0, 19).join(', ') + ', . . . ' + authors[authors.length - 1];
}

function formatAuthorsMLA(authors: string[]): string {
  if (!authors.length || !authors[0]) return '';
  if (authors.length === 1) return authors[0];
  if (authors.length === 2) return `${authors[0]}, and ${authors[1]}`;
  return `${authors[0]}, et al`;
}

function formatAuthorsCMS(authors: string[]): string {
  if (!authors.length || !authors[0]) return '';
  if (authors.length === 1) return authors[0];
  if (authors.length <= 3) {
    const last = authors[authors.length - 1];
    return authors.slice(0, -1).join(', ') + ', and ' + last;
  }
  return authors.slice(0, 3).join(', ') + ' et al.';
}

function formatAuthorsACS(authors: string[]): string {
  if (!authors.length || !authors[0]) return '';
  return authors.join('; ');
}

function renderAPA(c: Citation): string {
  const authors = formatAuthorsAPA(c.authors);
  const year = c.year ? `(${c.year}).` : '';
  const doi = c.doi ? ` https://doi.org/${c.doi.replace(/^https?:\/\/doi\.org\//i, '')}` : c.url ? ` ${c.url}` : '';

  if (c.sourceType === 'journal') {
    const journal = c.journal ? `*${c.journal}*` : '';
    const volIssue = c.volume ? `*${c.volume}*${c.issue ? `(${c.issue})` : ''}` : '';
    const pages = c.pages ? `, ${c.pages}` : '';
    return `${authors} ${year} ${c.title}. ${journal}${volIssue ? ', ' + volIssue : ''}${pages}.${doi}`.replace(/\s+/g, ' ').trim();
  }
  if (c.sourceType === 'book') {
    const ed = c.edition ? ` (${c.edition} ed.).` : '.';
    const pub = c.publisher ? ` ${c.publisher}.` : '';
    return `${authors} ${year} *${c.title}*${ed}${pub}${doi}`.replace(/\s+/g, ' ').trim();
  }
  if (c.sourceType === 'chapter') {
    const eds = c.editors ? `In ${c.editors} (Eds.), ` : 'In ';
    const book = c.bookTitle ? `*${c.bookTitle}*` : '';
    const pages = c.pages ? ` (pp. ${c.pages}).` : '.';
    const pub = c.publisher ? ` ${c.publisher}.` : '';
    return `${authors} ${year} ${c.title}. ${eds}${book}${pages}${pub}${doi}`.replace(/\s+/g, ' ').trim();
  }
  // website
  const site = c.websiteTitle ? ` *${c.websiteTitle}*.` : '';
  const access = c.accessDate ? ` Retrieved ${c.accessDate}, from` : '';
  return `${authors} ${year} ${c.title}.${site}${access}${doi}`.replace(/\s+/g, ' ').trim();
}

function renderMLA(c: Citation): string {
  const authors = formatAuthorsMLA(c.authors);

  if (c.sourceType === 'journal') {
    const journal = c.journal ? `*${c.journal}*` : '';
    const vol = c.volume ? `, vol. ${c.volume}` : '';
    const iss = c.issue ? `, no. ${c.issue}` : '';
    const year = c.year ? `, ${c.year}` : '';
    const pages = c.pages ? `, pp. ${c.pages}` : '';
    const doi = c.doi ? `, https://doi.org/${c.doi.replace(/^https?:\/\/doi\.org\//i, '')}` : '';
    return `${authors}. "${c.title}." ${journal}${vol}${iss}${year}${pages}${doi}.`.replace(/\s+/g, ' ').trim();
  }
  if (c.sourceType === 'book') {
    const ed = c.edition ? ` ${c.edition} ed.` : '';
    const pub = c.publisher ? `, ${c.publisher}` : '';
    const year = c.year ? `, ${c.year}` : '';
    return `${authors}. *${c.title}*.${ed}${pub}${year}.`.replace(/\s+/g, ' ').trim();
  }
  if (c.sourceType === 'chapter') {
    const book = c.bookTitle ? `*${c.bookTitle}*` : '';
    const eds = c.editors ? `, edited by ${c.editors}` : '';
    const pub = c.publisher ? `, ${c.publisher}` : '';
    const year = c.year ? `, ${c.year}` : '';
    const pages = c.pages ? `, pp. ${c.pages}` : '';
    return `${authors}. "${c.title}." ${book}${eds}${pub}${year}${pages}.`.replace(/\s+/g, ' ').trim();
  }
  // website
  const site = c.websiteTitle ? `*${c.websiteTitle}*` : '';
  const year = c.year ? ` ${c.year}` : '';
  const url = c.url || (c.doi ? `https://doi.org/${c.doi}` : '');
  return `${authors}. "${c.title}." ${site},${year}, ${url}.`.replace(/\s+/g, ' ').trim();
}

function renderCMS(c: Citation, mode: 'bibliography' | 'note' = 'bibliography'): string {
  const authors = mode === 'note' ? c.authors.map(a => {
    const parts = a.split(',').map(p => p.trim());
    return parts.length > 1 ? `${parts[1]} ${parts[0]}` : a;
  }).join(', ') : formatAuthorsCMS(c.authors);

  if (c.sourceType === 'journal') {
    const journal = c.journal ? `"${c.journal}"` : '';
    const vol = c.volume ? ` ${c.volume}` : '';
    const iss = c.issue ? `, no. ${c.issue}` : '';
    const year = c.year ? ` (${c.year})` : '';
    const pages = c.pages ? `: ${c.pages}` : '';
    const doi = c.doi ? `. https://doi.org/${c.doi.replace(/^https?:\/\/doi\.org\//i, '')}` : '';
    return `${authors}. "${c.title}."${journal ? ' ' + journal : ''}${vol}${iss}${year}${pages}${doi}.`.replace(/\s+/g, ' ').trim();
  }
  if (c.sourceType === 'book') {
    const city = c.city ? `${c.city}: ` : '';
    const pub = c.publisher ? `${c.publisher}` : '';
    const year = c.year ? `, ${c.year}` : '';
    return `${authors}. *${c.title}*. ${city}${pub}${year}.`.replace(/\s+/g, ' ').trim();
  }
  if (c.sourceType === 'chapter') {
    const book = c.bookTitle ? `*${c.bookTitle}*` : '';
    const eds = c.editors ? `edited by ${c.editors}` : '';
    const city = c.city ? `${c.city}: ` : '';
    const pub = c.publisher ? `${c.publisher}` : '';
    const year = c.year ? `, ${c.year}` : '';
    return `${authors}. "${c.title}." In ${book}${eds ? ', ' + eds : ''}, ${c.pages ? c.pages + '. ' : ''}${city}${pub}${year}.`.replace(/\s+/g, ' ').trim();
  }
  // website
  const url = c.url || (c.doi ? `https://doi.org/${c.doi}` : '');
  const access = c.accessDate ? ` Accessed ${c.accessDate}.` : '';
  return `${authors}. "${c.title}." ${c.websiteTitle || 'Website'}. ${c.year ? c.year + '. ' : ''}${url}.${access}`.replace(/\s+/g, ' ').trim();
}

function renderACS(c: Citation, index = 1): string {
  const authors = formatAuthorsACS(c.authors);

  if (c.sourceType === 'journal') {
    const journal = c.journal ? `*${c.journal}*` : '';
    const year = c.year ? ` **${c.year}**` : '';
    const vol = c.volume ? `, *${c.volume}*` : '';
    const pages = c.pages ? `, ${c.pages}` : '';
    const doi = c.doi ? ` DOI: 10.${c.doi.replace(/^.*10\./i, '')}` : '';
    return `(${index}) ${authors}. ${c.title}. ${journal}${year}${vol}${pages}.${doi}`.replace(/\s+/g, ' ').trim();
  }
  if (c.sourceType === 'book') {
    const pub = c.publisher ? `${c.publisher}` : '';
    const city = c.city ? ` ${c.city}:` : '';
    const year = c.year ? ` ${c.year}` : '';
    return `(${index}) ${authors}. *${c.title}*;${city} ${pub}${year}.`.replace(/\s+/g, ' ').trim();
  }
  // website / chapter fallback
  const url = c.url || (c.doi ? `https://doi.org/${c.doi}` : '');
  return `(${index}) ${authors}. ${c.title}. ${url}`.replace(/\s+/g, ' ').trim();
}

// ─────────────────────────────────────────────────────────────────
// Style detection from raw text
// ─────────────────────────────────────────────────────────────────
function detectStyle(text: string): Style | 'UNKNOWN' {
  if (/\([A-Za-z][a-zA-Z-]+,\s\d{4}\)/.test(text)) return 'APA';
  if (/\[\d+\]|;\s*\*\*\d{4}\*\*/.test(text)) return 'ACS';
  if (/\([A-Za-z][a-zA-Z-]+\s\d+\)/.test(text)) return 'MLA';
  if (/\d{4}\)\:/.test(text) || /edited by/i.test(text)) return 'CMS';
  if (/\(\d{4}\)/.test(text)) return 'APA';
  if (/\[\d+\]/.test(text)) return 'ACS';
  if (/\bpp\.\s*\d/.test(text)) return 'MLA';
  return 'UNKNOWN';
}

// ─────────────────────────────────────────────────────────────────
// Parser — extract fields from a raw reference string
// ─────────────────────────────────────────────────────────────────
function parseReference(raw: string): Partial<Citation> {
  const c: Partial<Citation> = {};

  const authorMatch = raw.match(/^([A-Z][A-Za-z\-,\.\s&;]+?)\s*[\.\(]/);
  if (authorMatch) c.authors = authorMatch[1].split(/,\s(?:&\s)?|;\s|,\sand\s/).map(a => a.trim()).filter(Boolean);

  const yearMatch = raw.match(/\((\d{4})\)|(?:\*\*(\d{4})\*\*)|(?:\b(19|20)\d{2}\b)/);
  if (yearMatch) c.year = yearMatch[1] || yearMatch[2] || yearMatch[0];

  const doiMatch = raw.match(/(?:https?:\/\/doi\.org\/|DOI:\s*)([\S]+)/i);
  if (doiMatch) c.doi = doiMatch[1];

  const urlMatch = raw.match(/https?:\/\/[^\s\)]+/);
  if (urlMatch && !doiMatch) c.url = urlMatch[0];

  const volMatch = raw.match(/(?:vol\.\s*|v\s*\.\s*|\*(\d+)\*(?:\s*\())/);
  if (volMatch) c.volume = volMatch[1] || volMatch[0].replace(/[^\d]/g, '');

  const pagesMatch = raw.match(/(?:pp?\.\s*)(\d+[\–\-]\d+|\d+)/);
  if (pagesMatch) c.pages = pagesMatch[1];

  return c;
}

// ─────────────────────────────────────────────────────────────────
// Validator — check a raw reference for compliance issues
// ─────────────────────────────────────────────────────────────────
interface ValidationResult {
  style: Style | 'UNKNOWN';
  icmScore: number;
  completenessScore: number;
  formatScore: number;
  issues: string[];
  suggestions: string[];
}

function validateReference(raw: string): ValidationResult {
  const style = detectStyle(raw);
  const parsed = parseReference(raw);
  const issues: string[] = [];
  const suggestions: string[] = [];

  // Completeness checks
  let completeness = 0;
  if (parsed.authors?.length) { completeness += 25; } else { issues.push('Authors not detected or improperly formatted.'); suggestions.push('Begin with Last, First. format (APA/CMS) or Last, First (MLA).'); }
  if (parsed.year) { completeness += 20; } else { issues.push('Publication year missing.'); suggestions.push('Include year in parentheses (APA) or after journal info (MLA).'); }
  if (raw.length > 40) { completeness += 20; } else { issues.push('Reference appears incomplete.'); }
  if (parsed.doi || parsed.url) { completeness += 15; suggestions.push('DOI/URL detected — good practice for digital sources.'); } else { suggestions.push('Consider adding a DOI or URL for electronic retrieval.'); }
  if (parsed.pages) { completeness += 10; } else { issues.push('Page numbers not found.'); }
  if (parsed.volume) { completeness += 10; }

  // Format checks by style
  let formatScore = 60;
  if (style === 'APA') {
    if (!/\(\d{4}\)/.test(raw)) { issues.push('APA requires year in parentheses immediately after author: (2020).'); formatScore -= 20; }
    if (!parsed.doi && !/https?:\/\//.test(raw)) { issues.push('APA 7th edition recommends including DOI when available.'); formatScore -= 10; }
    if (raw.includes('"') && !/"[^"]+"\.|"[^"]+"\./.test(raw)) { issues.push('APA: Article titles should not be in quotes or italics — plain sentence case only.'); formatScore -= 10; }
  } else if (style === 'MLA') {
    if (!/"[^"]+"/.test(raw)) { issues.push('MLA requires article titles in quotation marks.'); formatScore -= 15; }
    if (!/\bpp?\.\s*\d/.test(raw)) { issues.push('MLA uses pp. for page ranges.'); formatScore -= 10; }
  } else if (style === 'ACS') {
    if (!/\[\d+\]|^\(\d+\)/.test(raw)) { issues.push('ACS requires numeric citation index [1] or (1).'); formatScore -= 20; }
    if (!parsed.doi) { issues.push('ACS strongly recommends DOI for journal articles.'); formatScore -= 10; }
  } else if (style === 'CMS') {
    if (!raw.includes('In ') && !raw.includes(': ')) { issues.push('CMS bibliography format may be incomplete.'); formatScore -= 10; }
  }
  formatScore = Math.max(0, Math.min(100, formatScore));

  // ICM Score: Academic Rigor Sub-Matrix weights
  const icmScore = Math.round(completeness * 0.5 + formatScore * 0.5);

  return { style, icmScore, completenessScore: completeness, formatScore, issues, suggestions };
}

// ─────────────────────────────────────────────────────────────────
// Style guide reference data
// ─────────────────────────────────────────────────────────────────

interface InTextVariation {
  label: string;
  pattern: string;
  example: string;
  note?: string;
}

interface QuotedCitationRule {
  label: string;
  rule: string;
  example: string;
}

interface StyleGuideData {
  color: string;
  subtitle: string;
  edition: string;
  inTextFormat: string;
  refHeader: string;
  keyRules: string[];
  examples: Record<string, string>;
  inTextVariations: InTextVariation[];
  quotedCitations: QuotedCitationRule[];
  blockQuoteRule: string;
  specialCases: { label: string; example: string }[];
}

const STYLE_GUIDES: Record<Style, StyleGuideData> = {
  APA: {
    color: C.amber, subtitle: 'American Psychological Association', edition: '7th Edition (2020)',
    inTextFormat: '(Author, Year) or Author (Year)',
    refHeader: 'References',
    keyRules: ['Author-date in-text citations', 'Hanging indent 0.5"', 'Double-spaced throughout', 'Sentence case for article/book titles', 'Title case for journals', 'DOI as URL: https://doi.org/...', 'Up to 20 authors listed before ellipsis'],
    examples: {
      'Journal Article': 'Nguyen, A. T., & Patel, R. (2021). Cognitive load in digital learning. *Educational Technology Research*, *44*(2), 88–102. https://doi.org/10.1234/etr.2021',
      'Book': 'Kaplan, D. (2022). *GED test prep plus 2022–2023*. Kaplan Publishing.',
      'Website': 'Smith, J. (2020, March 5). *Understanding academic citation systems*. ResearchHub. https://researchhub.com/article/123',
      'Book Chapter': 'Brown, K. (2019). Memory and cognition. In L. Davis & M. Chen (Eds.), *Handbook of learning science* (pp. 145–167). Academic Press.',
      'Dissertation': 'Rivera, M. L. (2018). *Narrative identity in adult learners* [Doctoral dissertation, State University]. ProQuest Dissertations & Theses.',
      'Report': 'National Institute of Education. (2022). *Trends in adult literacy* (NIE-2022-04). U.S. Department of Education.',
      'Podcast Episode': 'Glass, I. (Host). (2021, June 4). Act two: The long way around (No. 741) [Audio podcast episode]. In *This American Life*. WBEZ Chicago.',
    },
    inTextVariations: [
      { label: 'Parenthetical — single author', pattern: '(Author, Year)', example: '(Smith, 2020)', note: 'Use for paraphrased ideas; place before the period.' },
      { label: 'Narrative — single author', pattern: 'Author (Year)', example: 'Smith (2020) found that...', note: 'Author name is part of the sentence; year in parentheses.' },
      { label: 'Two authors', pattern: '(Author & Author, Year)', example: '(Nguyen & Patel, 2021)', note: 'Always use & between authors in parenthetical form.' },
      { label: 'Narrative — two authors', pattern: 'Author and Author (Year)', example: 'Nguyen and Patel (2021) demonstrated...', note: 'Use "and" (not &) in running text.' },
      { label: 'Three or more authors', pattern: '(First Author et al., Year)', example: '(Garcia et al., 2019)', note: 'Use et al. from the first citation for 3+ authors.' },
      { label: 'Group / organization author', pattern: '(Organization [Abbrev.], Year)', example: '(American Psychological Association [APA], 2020) → subsequent: (APA, 2020)', note: 'Spell out fully on first use; abbreviate thereafter.' },
      { label: 'No author', pattern: '("Shortened Title," Year)', example: '("Digital Literacy," 2021)', note: 'Use title-case first few words in quotation marks for articles; italicize for books.' },
      { label: 'No date', pattern: '(Author, n.d.)', example: '(World Health Organization, n.d.)', note: 'Use n.d. (no date) when publication date is unavailable.' },
      { label: 'Specific page / location', pattern: '(Author, Year, p. X)', example: '(Smith, 2020, p. 45) or (Smith, 2020, pp. 45–47)', note: 'Required for direct quotations; optional for paraphrases.' },
      { label: 'Multiple sources — same parenthesis', pattern: '(Author, Year; Author, Year)', example: '(Brown, 2018; Smith, 2020)', note: 'List alphabetically by first author; separate with semicolons.' },
      { label: 'Multiple works — same author', pattern: '(Author, Year, Year)', example: '(Smith, 2018, 2020)', note: 'List years chronologically separated by commas.' },
      { label: 'Secondary source (citing a quote)', pattern: '(Original Author, Year, as cited in Author, Year)', example: '(Freud, 1923, as cited in Mitchell, 2018)', note: 'Cite only the source you read. List only the secondary source in References.' },
      { label: 'Personal communication', pattern: '(A. B. Author, personal communication, Month Day, Year)', example: '(J. Smith, personal communication, April 5, 2023)', note: 'Not included in References; cite in text only.' },
      { label: 'Same author, same year — multiple works', pattern: '(Author, Yeara, Yearb)', example: '(Smith, 2020a, 2020b)', note: 'Add lowercase letters after year to differentiate; repeat in reference list.' },
    ],
    quotedCitations: [
      { label: 'Short quote (under 40 words)', rule: 'Enclose in double quotation marks within the text. Include page number.', example: 'Smith (2020) argued that "the evidence is unambiguous" (p. 45).' },
      { label: 'Short quote — parenthetical', rule: 'Place full citation after closing quotation mark, before period.', example: '"The evidence is unambiguous" (Smith, 2020, p. 45).' },
      { label: 'Block quote (40+ words)', rule: 'New line, indent entire block 0.5" from left margin, no quotation marks, period BEFORE citation.', example: 'Smith (2020) described the finding:\n     The evidence gathered across multiple decades of study suggests a consistent and unambiguous trend in cognitive development, one that cannot be attributed to environmental factors alone. (p. 45)' },
      { label: 'Omitting words from quote', rule: 'Use ellipsis (. . .) with spaces to indicate omission.', example: '"The evidence . . . suggests a consistent trend" (Smith, 2020, p. 45).' },
      { label: 'Adding words to quote', rule: 'Use square brackets [ ] for any word you insert or alter.', example: '"The evidence [gathered] is unambiguous" (Smith, 2020, p. 45).' },
      { label: 'Emphasis added', rule: 'Add italics and note [emphasis added] after the emphasized word.', example: '"The evidence is *unambiguous* [emphasis added]" (Smith, 2020, p. 45).' },
    ],
    blockQuoteRule: '40+ words → indent 0.5" from left, double-spaced, no quotation marks, period BEFORE parenthetical citation.',
    specialCases: [
      { label: 'Reprinted / republished work', example: '(Freud, 1899/1999)' },
      { label: 'Volume & issue with year', example: '(Smith, 2020, Vol. 3, No. 2)' },
      { label: 'Specific chapter of book', example: '(Smith, 2020, chap. 4)' },
      { label: 'Table or figure in source', example: '(Smith, 2020, Table 3)' },
      { label: 'Translated work', example: '(Piaget, 1936/2013)' },
    ],
  },
  MLA: {
    color: C.cyan, subtitle: 'Modern Language Association', edition: '9th Edition (2021)',
    inTextFormat: '(Author Page#)',
    refHeader: 'Works Cited',
    keyRules: ['Author-page in-text citations', 'Hanging indent', 'Double-spaced', 'Title case for most titles', 'Article titles in quotation marks', 'Italicize books, journals, websites', 'No DOI required unless essential'],
    examples: {
      'Journal Article': 'Nguyen, Anne T., and Raj Patel. "Cognitive Load in Digital Learning." *Educational Technology Research*, vol. 44, no. 2, 2021, pp. 88–102.',
      'Book': 'Kaplan, David. *GED Test Prep Plus 2022–2023*. Kaplan Publishing, 2022.',
      'Website': 'Smith, James. "Understanding Academic Citation Systems." *ResearchHub*, 5 Mar. 2020, researchhub.com/article/123.',
      'Book Chapter': 'Brown, Karen. "Memory and Cognition." *Handbook of Learning Science*, edited by Laura Davis and Ming Chen, Academic Press, 2019, pp. 145–167.',
      'Film': 'Nolan, Christopher, director. *Interstellar*. Paramount Pictures, 2014.',
      'Poem': 'Dickinson, Emily. "Because I Could Not Stop for Death." *The Complete Poems of Emily Dickinson*, edited by Thomas H. Johnson, Little, Brown, 1960, pp. 711–712.',
      'Interview': 'Morrison, Toni. "The Art of Fiction." Interview by Elissa Schappell. *The Paris Review*, no. 128, 1993, pp. 83–125.',
    },
    inTextVariations: [
      { label: 'Parenthetical — single author', pattern: '(Author Page)', example: '(Smith 45)', note: 'No comma between author name and page number.' },
      { label: 'Narrative — single author', pattern: 'Author ... (Page)', example: 'Smith argues that learning is contextual (45).', note: 'Author in sentence; only page in parentheses.' },
      { label: 'Two authors', pattern: '(Author and Author Page)', example: '(Nguyen and Patel 88)', note: 'Use "and" (not &) for two authors.' },
      { label: 'Three or more authors', pattern: '(First Author et al. Page)', example: '(Garcia et al. 102)', note: 'et al. for 3+ authors; all authors listed in Works Cited.' },
      { label: 'No author — article', pattern: '("Shortened Title" Page)', example: '("Digital Literacy" 12)', note: 'Use first few words of title in quotation marks.' },
      { label: 'No author — book', pattern: '(*Shortened Title* Page)', example: '(*GED Prep* 35)', note: 'Italicize book title in parenthetical.' },
      { label: 'No page number (web source)', pattern: '(Author)', example: '(Smith)', note: 'Omit page; add paragraph number if visible: (Smith, par. 5).' },
      { label: 'Multiple works — same author', pattern: '(Author, Shortened Title Page)', example: '(Smith, "Digital" 45)', note: 'Add shortened title to distinguish works by same author.' },
      { label: 'Multiple sources in one citation', pattern: '(Author Page; Author Page)', example: '(Brown 78; Smith 45)', note: 'Separate with semicolons; no set order required.' },
      { label: 'Indirect source (qtd. in)', pattern: '(qtd. in Author Page)', example: '(qtd. in Smith 45)', note: 'Cite the source where you found the quote. List only that source in Works Cited.' },
      { label: 'Government / institutional author', pattern: '(Agency Page)', example: '(CDC 12)', note: 'Use commonly known abbreviation if familiar; otherwise full name.' },
      { label: 'Work with volume and page', pattern: '(Author Vol:Page)', example: '(Jones 2:45)', note: 'Colon separates volume from page.' },
    ],
    quotedCitations: [
      { label: 'Short quote (under 4 lines)', rule: 'Embed in text with double quotation marks. Page number in parentheses after closing quote, before period.', example: 'Smith asserts that "learning is fundamentally social" (45).' },
      { label: 'Short quote — parenthetical', rule: 'Author + page in parentheses after closing quotation mark.', example: '"Learning is fundamentally social" (Smith 45).' },
      { label: 'Block quote (4+ lines of prose)', rule: 'New line, indent 1 inch from left margin, no quotation marks, citation AFTER the final period.', example: 'Smith describes the learning environment:\n          The classroom, broadly understood, extends far beyond the four walls of a schoolhouse. Every interaction a learner has with the world constitutes a form of education, whether formal or informal. (45)' },
      { label: 'Poetry quote (under 3 lines)', rule: 'Inline with quotation marks; use / to indicate line breaks.', example: 'Dickinson writes, "Because I could not stop for Death— / He kindly stopped for me" (1–2).' },
      { label: 'Poetry quote (3+ lines)', rule: 'Block format, preserve original line breaks, no quotation marks.', example: 'Whitman opens:\n          I celebrate myself, and sing myself,\n          And what I assume you shall assume,\n          For every atom belonging to me as good belongs to you. (1–3)' },
      { label: 'Omitting words', rule: 'Use ellipsis in brackets [...] to signal omission.', example: '"Learning is [...] fundamentally social" (Smith 45).' },
      { label: 'Adding or changing words', rule: 'Use square brackets [ ] for insertions or alterations.', example: '"[Education] is fundamentally social" (Smith 45).' },
    ],
    blockQuoteRule: '4+ lines of prose or 3+ lines of poetry → indent 1 inch, no quotation marks, period BEFORE parenthetical citation.',
    specialCases: [
      { label: 'Same author, multiple titles on same page', example: '(Smith, "Title A" 45; Smith, *Book B* 78)' },
      { label: 'Editor as author', example: '(Davis, ed. 12)' },
      { label: 'Translated work — cite translator', example: '(Homer 14) — translator listed in Works Cited' },
      { label: 'Multi-volume work', example: '(Jones 2:45) — volume:page' },
      { label: 'Sacred/classical texts', example: '(John 3:16) or (Iliad 1.1)' },
    ],
  },
  CMS: {
    color: C.green, subtitle: 'Chicago Manual of Style', edition: '17th Edition (2017)',
    inTextFormat: 'Footnote¹ (Notes-Bibliography) or (Author Year, Page)',
    refHeader: 'Bibliography',
    keyRules: ['Two systems: Notes-Bibliography and Author-Date', 'Full footnote on first cite; shortened on repeat', 'Bibliography lists all sources alphabetically', 'Title case for all major words', 'Hanging indent in bibliography', 'City of publication included for books', 'Access date optional for websites'],
    examples: {
      'Journal Article': 'Nguyen, Anne T., and Raj Patel. "Cognitive Load in Digital Learning." *Educational Technology Research* 44, no. 2 (2021): 88–102. https://doi.org/10.1234/etr.2021.',
      'Book': 'Kaplan, David. *GED Test Prep Plus 2022–2023*. New York: Kaplan Publishing, 2022.',
      'Website': 'Smith, James. "Understanding Academic Citation Systems." ResearchHub. March 5, 2020. https://researchhub.com/article/123.',
      'Book Chapter': 'Brown, Karen. "Memory and Cognition." In *Handbook of Learning Science*, edited by Laura Davis and Ming Chen, 145–167. New York: Academic Press, 2019.',
      'Magazine Article': 'Jones, Linda. "The Future of Learning." *The Atlantic*, April 2022, 34–41.',
      'Unpublished Thesis': 'Rivera, Maria. "Narrative Identity in Adult Learners." PhD diss., State University, 2018.',
    },
    inTextVariations: [
      { label: 'Notes-Bibliography — first footnote', pattern: 'Full citation as footnote', example: '¹ Anne T. Nguyen and Raj Patel, "Cognitive Load in Digital Learning," *Educational Technology Research* 44, no. 2 (2021): 90.', note: 'First citation is a full footnote. Superscript number in text.' },
      { label: 'Notes-Bibliography — shortened footnote', pattern: 'Author, Shortened Title, Page.', example: '² Nguyen and Patel, "Cognitive Load," 92.', note: 'All subsequent citations to same source use shortened form.' },
      { label: 'Notes-Bibliography — Ibid.', pattern: 'Ibid. or Ibid., Page.', example: '³ Ibid., 95.', note: 'Use Ibid. only when repeating the immediately preceding citation.' },
      { label: 'Author-Date — parenthetical', pattern: '(Author Year, Page)', example: '(Smith 2020, 45)', note: 'Author-Date system: no comma between author and year; comma before page.' },
      { label: 'Author-Date — narrative', pattern: 'Author (Year, Page)', example: 'Smith (2020, 45) argues that...', note: 'Year and page in parentheses together.' },
      { label: 'Author-Date — two authors', pattern: '(Author and Author Year, Page)', example: '(Nguyen and Patel 2021, 88)', note: 'Use "and" not "&".' },
      { label: 'Author-Date — three or more', pattern: '(First Author et al. Year, Page)', example: '(Garcia et al. 2019, 102)', note: 'et al. for 4+ authors (or 3+ in some disciplines).' },
      { label: 'Author-Date — no date', pattern: '(Author n.d., Page)', example: '(Smith n.d., 45)', note: 'n.d. for undated sources.' },
      { label: 'Author-Date — organization', pattern: '(Organization Year, Page)', example: '(UNESCO 2021, 12)', note: 'Spell out full name in bibliography.' },
      { label: 'Author-Date — multiple sources', pattern: '(Author Year, Page; Author Year, Page)', example: '(Brown 2018, 78; Smith 2020, 45)', note: 'Semicolons separate multiple sources; list alphabetically.' },
    ],
    quotedCitations: [
      { label: 'Short quote — Notes-Bibliography', rule: 'Double quotation marks in text; footnote after punctuation with full/short citation and page.', example: '"Learning is fundamentally social."¹' },
      { label: 'Short quote — Author-Date', rule: 'Double quotation marks; parenthetical citation with author, year, and page after closing quote.', example: '"Learning is fundamentally social" (Smith 2020, 45).' },
      { label: 'Block quote (100+ words, or 5+ lines)', rule: 'New paragraph, indented 0.5" from left, no quotation marks. Citation after final period.', example: 'Smith describes the research:\n     The evidence gathered across multiple decades of careful study suggests a consistent and unambiguous trend... (2020, 45)' },
      { label: 'Footnote for block quote', rule: 'In N-B system, superscript goes after block quote period; footnote gives full/short citation.', example: '...unambiguous trend in cognitive development.²' },
      { label: 'Ellipsis for omissions', rule: 'Three periods with spaces ( . . . ) for omissions within a sentence; four for end of sentence.', example: '"The evidence . . . suggests a consistent trend."' },
      { label: 'Brackets for insertions', rule: 'Square brackets around any altered or added words.', example: '"[Education] is fundamentally social."' },
    ],
    blockQuoteRule: '100+ words (or 5+ lines) → indent 0.5" from left, no quotation marks, citation after final period (N-B: footnote superscript; A-D: parenthetical).',
    specialCases: [
      { label: 'Ibid. use (N-B system)', example: 'Only when immediately following same source; Ibid., 99.' },
      { label: 'Op. cit. / loc. cit.', example: 'Discouraged in CMS 17 — use shortened footnote form instead.' },
      { label: 'Two works same author same year (A-D)', example: '(Smith 2020a, 45); (Smith 2020b, 12)' },
      { label: 'Translated work', example: '(Dostoevsky 1869/2002, 34) — A-D; footnote in N-B' },
      { label: 'Multivolume work', example: '(Smith 2020, 2:45) — volume:page in A-D' },
    ],
  },
  ACS: {
    color: C.purple, subtitle: 'American Chemical Society', edition: 'ACS Style Guide (3rd Ed.)',
    inTextFormat: 'Superscript¹ or (1) numeric',
    refHeader: 'References',
    keyRules: ['Numeric citation order (1, 2, 3…)', 'Superscript or bracketed numbers', 'Journal abbreviations required (J. Am. Chem. Soc.)', 'Year in bold after journal name', 'Volume in italic', 'No period after DOI', 'All authors listed (no et al. in reference list)'],
    examples: {
      'Journal Article': '(1) Nguyen, A. T.; Patel, R. J. Educ. Technol. Res. **2021**, *44*, 88–102. DOI: 10.1234/etr.2021.',
      'Book': '(1) Kaplan, D. *GED Test Prep Plus 2022–2023*; Kaplan Publishing: New York, 2022.',
      'Website': '(1) Smith, J. Understanding Academic Citation Systems. https://researchhub.com/article/123 (accessed Mar 5, 2020).',
      'Book Chapter': '(1) Brown, K. Memory and Cognition. In *Handbook of Learning Science*; Davis, L., Chen, M., Eds.; Academic Press: New York, 2019; pp 145–167.',
      'Patent': '(1) Garcia, M. L. Synthesis of Novel Polymers. U.S. Patent 9,123,456, Jan 1, 2020.',
      'Conference Paper': '(1) Lee, S. In *Proceedings of the 45th ACS National Meeting*; American Chemical Society: Washington, DC, 2021; CHEM-012.',
    },
    inTextVariations: [
      { label: 'Superscript number', pattern: 'Text¹', example: 'This reaction was first described by Smith.¹', note: 'Number appears as superscript after punctuation, or after the author name.' },
      { label: 'Parenthetical number', pattern: '(1)', example: 'This reaction was first described (1).', note: 'Bracketed number variant; used as an alternative to superscript.' },
      { label: 'Number after author name', pattern: 'Author¹ or Author (1)', example: 'As reported by Garcia et al.,² the yield...', note: 'Cite after the author name or possessive.' },
      { label: 'Reusing a reference', pattern: 'Same number repeated', example: 'See also the earlier work on this mechanism.¹', note: 'A reference always keeps its first-assigned number throughout the paper.' },
      { label: 'Multiple references — consecutive', pattern: 'Number range or list', example: 'Previous studies confirmed this.¹⁻³ or ¹,²,³', note: 'Use en-dash for consecutive; commas for non-consecutive.' },
      { label: 'Multiple references — non-consecutive', pattern: '¹,³,⁵ or (1, 3, 5)', example: 'Multiple groups reported similar findings.¹,³,⁵', note: 'List each number individually; no range dash.' },
      { label: 'Page / location within source', pattern: 'No standard page cite in text', example: 'See Smith¹ (p 45) for detailed mechanism.', note: 'ACS does not require page numbers in-text; include informally if needed.' },
      { label: 'Personal communication', pattern: 'Author, personal communication, Date.', example: 'A. Garcia, personal communication, March 2023.', note: 'Not listed in reference list; in-text mention only.' },
    ],
    quotedCitations: [
      { label: 'Direct quotation (rare in ACS)', rule: 'ACS scientific writing discourages direct quotation. When used, place in double quotation marks with superscript citation.', example: '"The yield was unexpectedly high"¹' },
      { label: 'Long quotation', rule: 'ACS style strongly discourages extended block quotations. Paraphrase with citation instead.', example: 'Garcia et al.¹ found that the reaction proceeds via a radical mechanism...' },
      { label: 'Quoting methods / procedures', rule: 'Paraphrase experimental procedures; do not copy verbatim. Cite source with superscript.', example: 'The synthesis was performed as previously described.¹' },
    ],
    blockQuoteRule: 'ACS strongly discourages block quotations. Paraphrase all content and cite with superscript or bracketed number.',
    specialCases: [
      { label: 'Journal abbreviation required', example: 'J. Am. Chem. Soc. not Journal of the American Chemical Society' },
      { label: 'Year in bold', example: 'Smith, J. J. Org. Chem. **2021**, *86*, 1234.' },
      { label: 'Volume in italic', example: '**2021**, *86*, 1234–1240.' },
      { label: 'No "et al." in reference list', example: 'All authors must be listed: Garcia, M.; Lee, S.; Brown, K.; ...' },
      { label: 'Patent citation', example: 'Inventor Name. Patent Office Country Patent Number, Date.' },
    ],
  },
};

// ── Additional frameworks (guide-only, not full generate/validate) ──
interface ExtraGuide {
  id: string;
  name: string;
  color: string;
  subtitle: string;
  edition: string;
  primaryUse: string;
  inTextFormat: string;
  refHeader: string;
  keyRules: string[];
  inTextVariations: InTextVariation[];
  quotedCitations: QuotedCitationRule[];
  blockQuoteRule: string;
  examples: { label: string; text: string }[];
  specialCases: { label: string; example: string }[];
}

const EXTRA_GUIDES: ExtraGuide[] = [
  {
    id: 'IEEE', name: 'IEEE', color: '#5b8dd9',
    subtitle: 'Institute of Electrical and Electronics Engineers',
    edition: 'IEEE Editorial Style Manual (2021)',
    primaryUse: 'Engineering, Computer Science, Technology',
    inTextFormat: '[Number] numeric, order of first appearance',
    refHeader: 'References',
    keyRules: [
      'Numeric citations in square brackets: [1]',
      'Numbered in order of first appearance in the paper',
      'Each reference gets one number used throughout',
      'Author initials before surname: J. Smith',
      'Article titles in quotation marks; journal/book titles in italics',
      'Journal names abbreviated per IEEE standard',
      'Volume (vol.), issue (no.), pages (pp.), year in parentheses',
    ],
    inTextVariations: [
      { label: 'Basic in-text citation', pattern: '[N]', example: 'Smith demonstrated this in [1].', note: 'Place in square brackets, no space before.' },
      { label: 'At start of sentence', pattern: '[N] or Author [N]', example: 'In [2], Garcia et al. showed...', note: 'Or: Garcia et al. [2] demonstrated...' },
      { label: 'Multiple references', pattern: '[N1], [N2] or [N1]–[N3]', example: 'Previous work confirmed this [1]–[3].', note: 'Use en-dash for a consecutive range.' },
      { label: 'Same reference reused', pattern: '[Same N]', example: 'As noted earlier [1], the threshold...', note: 'Always reuse the original number assigned.' },
      { label: 'No author (standard / spec)', pattern: '[N]', example: 'The protocol is defined in [4].', note: 'Standards cited by document title; number assigned at first mention.' },
    ],
    quotedCitations: [
      { label: 'Direct quotation (rare)', rule: 'Use double quotation marks; citation number after closing quote.', example: '"The algorithm converges in O(n log n)" [1].' },
      { label: 'Paraphrase (preferred)', rule: 'IEEE strongly prefers paraphrase over quotation. Always include a citation number.', example: 'The sorting algorithm achieves O(n log n) complexity [1].' },
    ],
    blockQuoteRule: 'IEEE technical writing avoids block quotations. Paraphrase and cite with bracketed number.',
    examples: [
      { label: 'Journal Article', text: '[1] J. Smith and A. Garcia, "Deep learning for signal processing," *IEEE Trans. Signal Process.*, vol. 69, pp. 1234–1245, Mar. 2021.' },
      { label: 'Conference Paper', text: '[2] R. Patel, "Edge computing architectures," in *Proc. IEEE Int. Conf. Cloud Comput.*, Chicago, IL, USA, Jun. 2022, pp. 45–52.' },
      { label: 'Book', text: '[3] D. Kaplan, *Digital Signal Processing*, 3rd ed. New York, NY, USA: Wiley, 2020.' },
      { label: 'Website', text: '[4] IEEE, "About IEEE," IEEE.org. Accessed: May 1, 2023. [Online]. Available: https://www.ieee.org/about/' },
      { label: 'Standard', text: '[5] IEEE Std 802.11ax-2021, "IEEE Standard for Information Technology—Wireless LAN," IEEE, 2021.' },
    ],
    specialCases: [
      { label: 'Standard citation format', example: 'IEEE Std [number]-[year], "Title," Organization, Year.' },
      { label: 'Online-only source', example: 'Add [Online] and Available: URL after main citation.' },
      { label: 'Author initials before surname', example: 'J. Smith, A. B. Garcia — not Smith, J.' },
      { label: 'Page range format', example: 'pp. 45–52 (not p. 45-52)' },
    ],
  },
  {
    id: 'Vancouver', name: 'Vancouver', color: '#e07b54',
    subtitle: 'International Committee of Medical Journal Editors (ICMJE)',
    edition: 'Uniform Requirements for Manuscripts (2019)',
    primaryUse: 'Medicine, Biomedical Sciences, Nursing, Public Health',
    inTextFormat: 'Superscript¹ or (1) numeric in order of appearance',
    refHeader: 'References',
    keyRules: [
      'Numeric, sequential, order of first citation',
      'In-text: superscript or (number) after punctuation',
      'Up to 6 authors: list all; 7+: list first 6 then "et al."',
      'Journal abbreviations per NLM catalog',
      'Year, volume(issue):pages — condensed format',
      'DOI or PMID (PubMed ID) included where available',
      'No spaces in author list: Smith J, Garcia A.',
    ],
    inTextVariations: [
      { label: 'Superscript after statement', pattern: 'Text.¹', example: 'This treatment shows efficacy.¹', note: 'Superscript placed after punctuation.' },
      { label: 'Parenthetical number', pattern: '(1)', example: 'As established in prior studies (1, 2).', note: 'Alternative to superscript; choose one style and be consistent.' },
      { label: 'After author name', pattern: 'Author¹', example: 'Smith¹ demonstrated that...', note: 'Less common; primarily used when emphasizing the author.' },
      { label: 'Multiple consecutive', pattern: '¹⁻³ or (1–3)', example: 'Several trials confirm this.¹⁻³', note: 'En-dash for consecutive sequence.' },
      { label: 'Multiple non-consecutive', pattern: '¹,³,⁷ or (1, 3, 7)', example: 'Multiple groups found similar results.¹,³,⁷', note: 'Commas for non-consecutive.' },
      { label: 'Reused reference', pattern: 'Same number', example: 'The earlier protocol¹ was also applied here.', note: 'Always use the originally assigned number.' },
    ],
    quotedCitations: [
      { label: 'Direct quotation', rule: 'Rare in medical writing. Use double quotation marks; superscript after closing quote.', example: '"The drug showed a 40% reduction in symptoms."¹' },
      { label: 'Paraphrase (strongly preferred)', rule: 'Medical writing favors paraphrase; cite with superscript or number.', example: 'Treatment with Agent X reduced symptoms by approximately 40%.¹' },
    ],
    blockQuoteRule: 'Block quotations are strongly discouraged in biomedical writing. Always paraphrase and cite.',
    examples: [
      { label: 'Journal Article (≤6 authors)', text: '1. Smith J, Garcia A, Patel R. Cognitive rehabilitation outcomes. J Neurol Sci. 2021;42(3):88–102. doi:10.1234/jns.2021.' },
      { label: 'Journal Article (7+ authors)', text: '2. Lee SH, Brown KL, Rivera ML, Chen MW, Jones RL, Davis LK, et al. Longitudinal outcomes in stroke patients. Lancet Neurol. 2022;21(1):12–24.' },
      { label: 'Book', text: '3. Kaplan D. Medical Biochemistry. 5th ed. Philadelphia: Lippincott; 2020.' },
      { label: 'Book Chapter', text: '4. Brown K. Protein folding mechanisms. In: Davis L, editor. Molecular Biology Handbook. London: Academic Press; 2019. p. 145–67.' },
      { label: 'Website', text: '5. World Health Organization. Global tuberculosis report 2022 [Internet]. Geneva: WHO; 2022 [cited 2023 Apr 1]. Available from: https://www.who.int/tb/publications/global_report' },
    ],
    specialCases: [
      { label: 'NLM journal abbreviation', example: 'N Engl J Med, not New England Journal of Medicine' },
      { label: '7+ authors format', example: 'First 6 authors, et al.' },
      { label: 'Edition of book', example: '5th ed. — abbreviated, period after "ed."' },
      { label: 'DOI format', example: 'doi:10.1234/jns.2021 (lowercase doi:)' },
      { label: 'PMID citation', example: 'Add PubMed PMID: 12345678 after DOI if available' },
    ],
  },
  {
    id: 'Harvard', name: 'Harvard', color: '#a0c4a0',
    subtitle: 'Harvard Referencing (Author-Date)',
    edition: 'No single official edition — varies by institution',
    primaryUse: 'UK/Australian academia; Social sciences, Humanities',
    inTextFormat: '(Author Year) or (Author Year, p.X)',
    refHeader: 'Reference List',
    keyRules: [
      'Author-date system; no page in text unless quoting',
      'Reference list ordered alphabetically by author surname',
      'Multiple works by same author: chronological order',
      'Three or more authors: first surname + et al. in-text',
      'Book titles in italics; article titles in single quotes',
      'Place of publication and publisher for books',
      'Many institutional variations exist — check your specific guide',
    ],
    inTextVariations: [
      { label: 'Parenthetical — single author', pattern: '(Author Year)', example: '(Smith 2020)', note: 'No comma between author and year in most Harvard variants.' },
      { label: 'Narrative — single author', pattern: 'Author (Year)', example: 'Smith (2020) argues that...', note: 'Year in parentheses; author integrated into sentence.' },
      { label: 'With page number', pattern: '(Author Year, p.X)', example: '(Smith 2020, p.45)', note: 'Required for direct quotations; optional for paraphrase.' },
      { label: 'Two authors', pattern: '(Author and Author Year)', example: '(Smith and Jones 2020)', note: 'Use "and" not "&" in most Harvard variants.' },
      { label: 'Three or more authors', pattern: '(First Author et al. Year)', example: '(Garcia et al. 2019)', note: 'et al. from first citation; all authors in reference list.' },
      { label: 'No date', pattern: '(Author n.d.)', example: '(Smith n.d.)', note: 'n.d. for undated sources.' },
      { label: 'Multiple works same author', pattern: '(Author Year, Year)', example: '(Smith 2018, 2020)', note: 'Chronological order; letters for same year: 2020a, 2020b.' },
      { label: 'Multiple sources', pattern: '(Author Year; Author Year)', example: '(Brown 2018; Smith 2020)', note: 'Semicolons between sources; alphabetical or chronological order.' },
      { label: 'Secondary source', pattern: '(Original cited in Author Year)', example: '(Freud cited in Mitchell 2018)', note: 'Cite only the source you read; note the original author.' },
    ],
    quotedCitations: [
      { label: 'Short quote', rule: 'Single quotation marks (UK standard); page number required.', example: "Smith (2020, p.45) asserts that 'learning is fundamentally social'." },
      { label: 'Parenthetical short quote', rule: 'Citation with year and page after closing quote.', example: "'Learning is fundamentally social' (Smith 2020, p.45)." },
      { label: 'Block quote (40+ words)', rule: 'Indent from both margins, no quotation marks, citation after final period.', example: 'Smith (2020, p.45) describes the setting:\n     The classroom extends beyond its physical walls, encompassing every meaningful interaction between learner and environment.' },
    ],
    blockQuoteRule: '40+ words → indent from both margins, no quotation marks, citation (Author Year, p.X) after final period.',
    examples: [
      { label: 'Journal Article', text: "Smith, J. and Jones, A. (2020) 'Cognitive load in online learning', *Educational Technology Research*, 44(2), pp.88–102." },
      { label: 'Book', text: 'Kaplan, D. (2022) *GED Test Prep Plus*. New York: Kaplan Publishing.' },
      { label: 'Book Chapter', text: "Brown, K. (2019) 'Memory and cognition', in Davis, L. and Chen, M. (eds.) *Handbook of Learning Science*. London: Academic Press, pp.145–167." },
      { label: 'Website', text: "Smith, J. (2020) *Understanding citation systems* [Online]. Available at: https://researchhub.com/article/123 (Accessed: 5 March 2020)." },
    ],
    specialCases: [
      { label: 'Institutional variation', example: 'Always check your institution\'s specific Harvard guide — rules vary significantly.' },
      { label: 'Same year, same author', example: '(Smith 2020a, 2020b) — letters appended alphabetically' },
      { label: 'No author — use title', example: '(*Title* Year) for books; (\'Title\' Year) for articles' },
      { label: 'Access date format (websites)', example: '(Accessed: 5 March 2020) or (Accessed: 05/03/2020)' },
    ],
  },
  {
    id: 'Turabian', name: 'Turabian', color: '#c9956c',
    subtitle: 'A Manual for Writers of Research Papers',
    edition: '9th Edition (2018) — Kate L. Turabian',
    primaryUse: 'Students in History, Humanities, Social Sciences',
    inTextFormat: 'Footnote/endnote (N-B) or (Author Year) (A-D)',
    refHeader: 'Bibliography or Reference List',
    keyRules: [
      'Student version of Chicago Manual of Style',
      'Two systems: Notes-Bibliography (humanities) and Author-Date (sciences)',
      'N-B: footnotes or endnotes + bibliography',
      'A-D: parenthetical citations + reference list',
      'Shortened footnotes after first full citation',
      'Ibid. acceptable but optional',
      'Title case for all main words in titles',
    ],
    inTextVariations: [
      { label: 'N-B — first note (full)', pattern: 'Superscript + full footnote', example: '¹ Anne T. Nguyen and Raj Patel, "Cognitive Load," *Educ. Tech. Research* 44, no. 2 (2021): 90.', note: 'Full citation appears in footnote at page bottom or as endnote.' },
      { label: 'N-B — subsequent note (shortened)', pattern: 'Superscript + Author, Short Title, Page.', example: '² Nguyen and Patel, "Cognitive Load," 92.', note: 'Shortened form for all later citations to same source.' },
      { label: 'N-B — Ibid.', pattern: 'Ibid. or Ibid., Page.', example: '³ Ibid., 94.', note: 'Only for immediately preceding source; use sparingly.' },
      { label: 'A-D — parenthetical', pattern: '(Author Year, Page)', example: '(Smith 2020, 45)', note: 'No comma between author and year; comma before page number.' },
      { label: 'A-D — narrative', pattern: 'Author (Year, Page)', example: 'Smith (2020, 45) argues...', note: 'Author name in sentence; year and page in parentheses.' },
      { label: 'A-D — two authors', pattern: '(Author and Author Year)', example: '(Nguyen and Patel 2021, 88)', note: '"and" not "&".' },
      { label: 'A-D — three or more authors', pattern: '(First Author et al. Year)', example: '(Garcia et al. 2019, 102)', note: 'et al. for 4+ authors; list all in reference list.' },
    ],
    quotedCitations: [
      { label: 'Short quote — N-B', rule: 'Double quotation marks in text; full citation in footnote with page number.', example: '"Learning is fundamentally social."¹' },
      { label: 'Short quote — A-D', rule: 'Double quotation marks; author, year, page in parentheses.', example: '"Learning is fundamentally social" (Smith 2020, 45).' },
      { label: 'Block quote (100+ words or 5+ lines)', rule: 'Indent 0.5" from left, no quotation marks, citation AFTER final period.', example: 'Smith describes the environment:\n     The classroom, broadly understood, extends far beyond four walls... (2020, 45)' },
    ],
    blockQuoteRule: '100+ words (or 5+ lines) → indent 0.5", no quotation marks, citation after period. Same as Chicago.',
    examples: [
      { label: 'Book (N-B footnote)', text: '¹ David Kaplan, *GED Test Prep Plus 2022–2023* (New York: Kaplan Publishing, 2022), 45.' },
      { label: 'Book (N-B bibliography)', text: 'Kaplan, David. *GED Test Prep Plus 2022–2023*. New York: Kaplan Publishing, 2022.' },
      { label: 'Journal Article (N-B)', text: '² Anne T. Nguyen and Raj Patel, "Cognitive Load in Digital Learning," *Educational Technology Research* 44, no. 2 (2021): 90. https://doi.org/10.1234.' },
      { label: 'Journal Article (A-D reference list)', text: 'Nguyen, Anne T., and Raj Patel. 2021. "Cognitive Load in Digital Learning." *Educational Technology Research* 44 (2): 88–102.' },
      { label: 'Website (N-B)', text: '³ James Smith, "Understanding Academic Citation Systems," ResearchHub, March 5, 2020, https://researchhub.com/article/123.' },
    ],
    specialCases: [
      { label: 'Turabian vs. CMS', example: 'Turabian is CMS simplified for students; most rules identical.' },
      { label: 'Footnote vs. endnote', example: 'Either is acceptable; choose one and be consistent.' },
      { label: 'Ibid. alternative', example: 'Can use shortened form instead: Author, *Short Title*, page.' },
      { label: 'A-D year placement', example: 'Year follows author in reference list: Smith, John. 2020. *Title*.' },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────
// UI helpers
// ─────────────────────────────────────────────────────────────────
function useClipboard() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = useCallback((text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    });
  }, []);
  return { copied, copy };
}

function CopyBtn({ text, id, copied, copy }: { text: string; id: string; copied: string | null; copy: (t: string, k: string) => void }) {
  const isCopied = copied === id;
  return (
    <button onClick={() => copy(text, id)} title="Copy to clipboard" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: isCopied ? C.green : '#666', padding: '2px 4px', display: 'flex', alignItems: 'center', gap: 3 }}>
      {isCopied ? <CheckCircle size={12} /> : <Copy size={12} />}
      <span style={{ fontSize: 9, fontFamily: 'monospace', letterSpacing: 1 }}>{isCopied ? 'COPIED' : 'COPY'}</span>
    </button>
  );
}

function ScoreBar({ value, color, label }: { value: number; color: string; label: string }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: C.text, letterSpacing: 1, marginBottom: 2 }}>
        <span>{label}</span>
        <span style={{ color }}>{value}%</span>
      </div>
      <div style={{ background: C.dim, borderRadius: 2, height: 5, overflow: 'hidden' }}>
        <div style={{ width: `${value}%`, height: '100%', background: color, transition: 'width 0.4s ease', borderRadius: 2 }} />
      </div>
    </div>
  );
}

const FIELD_STYLE: React.CSSProperties = {
  background: '#0c0c0c', border: `1px solid ${C.border}`, color: C.text,
  fontFamily: '"Courier New", monospace', fontSize: 11, padding: '5px 8px',
  width: '100%', outline: 'none', borderRadius: 3,
};

const LABEL_STYLE: React.CSSProperties = {
  color: '#666', fontFamily: '"Courier New", monospace', fontSize: 9,
  letterSpacing: 1, textTransform: 'uppercase', display: 'block', marginBottom: 3,
};

// ─────────────────────────────────────────────────────────────────
// Tab components
// ─────────────────────────────────────────────────────────────────

function GeneratorTab() {
  const [citation, setCitation] = useState<Citation>({ ...EMPTY_CITATION });
  const [selectedStyle, setSelectedStyle] = useState<Style>('APA');
  const [showAll, setShowAll] = useState(false);
  const { copied, copy } = useClipboard();

  const update = (field: keyof Citation, value: string) => setCitation(prev => ({ ...prev, [field]: value }));
  const updateAuthor = (i: number, val: string) => setCitation(prev => {
    const a = [...prev.authors]; a[i] = val; return { ...prev, authors: a };
  });
  const addAuthor = () => setCitation(prev => ({ ...prev, authors: [...prev.authors, ''] }));
  const removeAuthor = (i: number) => setCitation(prev => ({ ...prev, authors: prev.authors.filter((_, idx) => idx !== i) }));

  const outputs: Record<Style, string> = {
    APA: renderAPA(citation),
    MLA: renderMLA(citation),
    CMS: renderCMS(citation),
    ACS: renderACS(citation),
  };
  const primary = outputs[selectedStyle];

  const sourceTypes = [
    { value: 'journal', label: 'Journal Article' },
    { value: 'book', label: 'Book' },
    { value: 'chapter', label: 'Book Chapter' },
    { value: 'website', label: 'Website' },
  ];

  return (
    <div style={{ display: 'flex', gap: 12, height: '100%', overflow: 'hidden' }}>
      {/* LEFT: Form */}
      <div style={{ flex: '0 0 55%', overflowY: 'auto', paddingRight: 8 }}>
        <div style={{ fontSize: 9, color: C.amber, letterSpacing: 2, marginBottom: 10, textTransform: 'uppercase' }}>Source Information</div>

        {/* Source type + target style */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <div style={{ flex: 1 }}>
            <label style={LABEL_STYLE}>Source Type</label>
            <select value={citation.sourceType} onChange={e => update('sourceType', e.target.value as Citation['sourceType'])} style={{ ...FIELD_STYLE }}>
              {sourceTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={LABEL_STYLE}>Target Style</label>
            <select value={selectedStyle} onChange={e => setSelectedStyle(e.target.value as Style)} style={{ ...FIELD_STYLE }}>
              {(['APA', 'MLA', 'CMS', 'ACS'] as Style[]).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Authors */}
        <div style={{ marginBottom: 8 }}>
          <label style={LABEL_STYLE}>Authors (Last, First format)</label>
          {citation.authors.map((a, i) => (
            <div key={i} style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
              <input value={a} onChange={e => updateAuthor(i, e.target.value)} placeholder="Doe, Jane" style={{ ...FIELD_STYLE, flex: 1 }} />
              {citation.authors.length > 1 && (
                <button onClick={() => removeAuthor(i)} style={{ background: '#1a0000', border: `1px solid #ff000030`, color: '#ff6666', cursor: 'pointer', padding: '0 8px', borderRadius: 3, fontSize: 11 }}>×</button>
              )}
            </div>
          ))}
          <button onClick={addAuthor} style={{ background: 'transparent', border: `1px dashed ${C.border}`, color: '#666', cursor: 'pointer', padding: '3px 10px', fontSize: 9, borderRadius: 3, letterSpacing: 1 }}>+ ADD AUTHOR</button>
        </div>

        {/* Year + Title */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <div style={{ flex: '0 0 90px' }}>
            <label style={LABEL_STYLE}>Year</label>
            <input value={citation.year} onChange={e => update('year', e.target.value)} placeholder="2024" style={{ ...FIELD_STYLE }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={LABEL_STYLE}>Title</label>
            <input value={citation.title} onChange={e => update('title', e.target.value)} placeholder="Article or book title" style={{ ...FIELD_STYLE }} />
          </div>
        </div>

        {/* Conditional fields by type */}
        {citation.sourceType === 'journal' && (
          <>
            <div style={{ marginBottom: 8 }}>
              <label style={LABEL_STYLE}>Journal Name</label>
              <input value={citation.journal} onChange={e => update('journal', e.target.value)} placeholder="Nature, Journal of Chemistry..." style={{ ...FIELD_STYLE }} />
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <div style={{ flex: 1 }}>
                <label style={LABEL_STYLE}>Volume</label>
                <input value={citation.volume} onChange={e => update('volume', e.target.value)} placeholder="44" style={{ ...FIELD_STYLE }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={LABEL_STYLE}>Issue</label>
                <input value={citation.issue} onChange={e => update('issue', e.target.value)} placeholder="2" style={{ ...FIELD_STYLE }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={LABEL_STYLE}>Pages</label>
                <input value={citation.pages} onChange={e => update('pages', e.target.value)} placeholder="88–102" style={{ ...FIELD_STYLE }} />
              </div>
            </div>
          </>
        )}

        {(citation.sourceType === 'book' || citation.sourceType === 'chapter') && (
          <>
            {citation.sourceType === 'chapter' && (
              <>
                <div style={{ marginBottom: 8 }}>
                  <label style={LABEL_STYLE}>Book Title</label>
                  <input value={citation.bookTitle} onChange={e => update('bookTitle', e.target.value)} placeholder="Title of the edited book" style={{ ...FIELD_STYLE }} />
                </div>
                <div style={{ marginBottom: 8 }}>
                  <label style={LABEL_STYLE}>Editor(s) (First Last format)</label>
                  <input value={citation.editors} onChange={e => update('editors', e.target.value)} placeholder="Jane Doe and John Smith" style={{ ...FIELD_STYLE }} />
                </div>
                <div style={{ marginBottom: 8 }}>
                  <label style={LABEL_STYLE}>Pages</label>
                  <input value={citation.pages} onChange={e => update('pages', e.target.value)} placeholder="145–167" style={{ ...FIELD_STYLE }} />
                </div>
              </>
            )}
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <div style={{ flex: 1 }}>
                <label style={LABEL_STYLE}>Publisher</label>
                <input value={citation.publisher} onChange={e => update('publisher', e.target.value)} placeholder="Oxford University Press" style={{ ...FIELD_STYLE }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={LABEL_STYLE}>City (CMS)</label>
                <input value={citation.city} onChange={e => update('city', e.target.value)} placeholder="New York" style={{ ...FIELD_STYLE }} />
              </div>
            </div>
            <div style={{ marginBottom: 8 }}>
              <label style={LABEL_STYLE}>Edition (if not 1st)</label>
              <input value={citation.edition} onChange={e => update('edition', e.target.value)} placeholder="3rd" style={{ ...FIELD_STYLE }} />
            </div>
          </>
        )}

        {citation.sourceType === 'website' && (
          <>
            <div style={{ marginBottom: 8 }}>
              <label style={LABEL_STYLE}>Website / Organization Name</label>
              <input value={citation.websiteTitle} onChange={e => update('websiteTitle', e.target.value)} placeholder="Wikipedia, CDC, BBC News..." style={{ ...FIELD_STYLE }} />
            </div>
            <div style={{ marginBottom: 8 }}>
              <label style={LABEL_STYLE}>Access Date (MLA/APA)</label>
              <input value={citation.accessDate} onChange={e => update('accessDate', e.target.value)} placeholder="March 5, 2024" style={{ ...FIELD_STYLE }} />
            </div>
          </>
        )}

        {/* DOI / URL */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <div style={{ flex: 1 }}>
            <label style={LABEL_STYLE}>DOI</label>
            <input value={citation.doi} onChange={e => update('doi', e.target.value)} placeholder="10.1234/example" style={{ ...FIELD_STYLE }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={LABEL_STYLE}>URL</label>
            <input value={citation.url} onChange={e => update('url', e.target.value)} placeholder="https://..." style={{ ...FIELD_STYLE }} />
          </div>
        </div>
      </div>

      {/* RIGHT: Output */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto' }}>
        <div style={{ fontSize: 9, color: C.amber, letterSpacing: 2, marginBottom: 2, textTransform: 'uppercase' }}>Generated Citation</div>

        {/* Primary output */}
        <div style={{ background: '#0c0c0c', border: `1px solid ${STYLE_GUIDES[selectedStyle].color}40`, borderRadius: 4, padding: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 10, color: STYLE_GUIDES[selectedStyle].color, letterSpacing: 2, fontFamily: 'monospace' }}>{selectedStyle}</span>
            <CopyBtn text={primary} id="primary" copied={copied} copy={copy} />
          </div>
          <p style={{ color: C.text, fontSize: 11, fontFamily: '"Courier New", monospace', lineHeight: 1.6, margin: 0, paddingLeft: 24, textIndent: -24 }}>
            {primary || <span style={{ color: '#444' }}>Fill in the fields to generate a citation...</span>}
          </p>
        </div>

        {/* All styles toggle */}
        <button onClick={() => setShowAll(p => !p)} style={{ background: 'transparent', border: `1px solid ${C.border}`, color: '#666', cursor: 'pointer', padding: '5px 10px', fontSize: 9, borderRadius: 3, letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
          {showAll ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
          {showAll ? 'HIDE ALL STYLES' : 'SHOW ALL STYLES'}
        </button>

        {showAll && (['APA', 'MLA', 'CMS', 'ACS'] as Style[]).filter(s => s !== selectedStyle).map(style => (
          <div key={style} style={{ background: '#0c0c0c', border: `1px solid ${C.border}`, borderRadius: 4, padding: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 9, color: STYLE_GUIDES[style].color, letterSpacing: 2, fontFamily: 'monospace' }}>{style}</span>
              <CopyBtn text={outputs[style]} id={`all-${style}`} copied={copied} copy={copy} />
            </div>
            <p style={{ color: '#aaa', fontSize: 10, fontFamily: '"Courier New", monospace', lineHeight: 1.5, margin: 0, paddingLeft: 20, textIndent: -20 }}>
              {outputs[style]}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ValidatorTab() {
  const [raw, setRaw] = useState('');
  const [result, setResult] = useState<ValidationResult | null>(null);
  const { copied, copy } = useClipboard();

  const validate = () => setResult(validateReference(raw));

  const icmColor = (score: number) => score >= 80 ? C.green : score >= 60 ? C.amber : '#ff6666';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
      <div style={{ fontSize: 9, color: C.cyan, letterSpacing: 2, marginBottom: 4, textTransform: 'uppercase' }}>Paste Reference for Validation</div>

      <div style={{ display: 'flex', gap: 8 }}>
        <textarea
          value={raw}
          onChange={e => setRaw(e.target.value)}
          placeholder="Paste a reference line here, e.g.:&#10;Smith, J. (2020). The structure of academic systems. Nature, 44(2), 88-102. https://doi.org/10.1234/abc"
          style={{ ...FIELD_STYLE, flex: 1, height: 80, resize: 'none', lineHeight: 1.6 }}
        />
        <button onClick={validate} style={{ background: `${C.cyan}18`, border: `1px solid ${C.cyan}40`, color: C.cyan, cursor: 'pointer', padding: '0 16px', borderRadius: 4, fontFamily: 'monospace', fontSize: 10, letterSpacing: 1, whiteSpace: 'nowrap' }}>
          ANALYZE
        </button>
      </div>

      {result && (
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', gap: 10 }}>
          {/* Left: scores */}
          <div style={{ flex: '0 0 200px' }}>
            <div style={{ background: '#0c0c0c', border: `1px solid ${C.border}`, borderRadius: 4, padding: 12, marginBottom: 10 }}>
              <div style={{ textAlign: 'center', marginBottom: 10 }}>
                <div style={{ fontSize: 8, color: '#666', letterSpacing: 2, marginBottom: 4 }}>ICM COMPLIANCE SCORE</div>
                <div style={{ fontSize: 36, fontFamily: 'monospace', color: icmColor(result.icmScore), lineHeight: 1 }}>{result.icmScore}</div>
                <div style={{ fontSize: 8, color: '#555', marginTop: 2 }}>/ 100</div>
              </div>
              <div style={{ fontSize: 10, color: result.style !== 'UNKNOWN' ? STYLE_GUIDES[result.style as Style]?.color || C.text : '#666', fontFamily: 'monospace', textAlign: 'center', marginBottom: 10, letterSpacing: 1 }}>
                STYLE: {result.style}
              </div>
              <ScoreBar value={result.completenessScore} color={C.amber} label="COMPLETENESS" />
              <ScoreBar value={result.formatScore} color={C.cyan} label="FORMAT ACCURACY" />
            </div>

            {/* ICM sub-matrix weights */}
            <div style={{ background: '#0c0c0c', border: `1px solid ${C.border}`, borderRadius: 4, padding: 10 }}>
              <div style={{ fontSize: 8, color: '#666', letterSpacing: 2, marginBottom: 8 }}>ICM WEIGHTING</div>
              {[['CITATION ACCURACY', 30, C.amber], ['SOURCE INTEGRITY', 20, C.cyan], ['FORMATTING', 20, C.green], ['ARGUMENT COHERENCE', 30, C.purple]].map(([label, weight, color]) => (
                <div key={label as string} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#666', marginBottom: 4 }}>
                  <span>{label as string}</span>
                  <span style={{ color: color as string }}>{weight}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: issues + suggestions */}
          <div style={{ flex: 1 }}>
            {result.issues.length > 0 && (
              <div style={{ background: '#100000', border: '1px solid #ff000025', borderRadius: 4, padding: 12, marginBottom: 10 }}>
                <div style={{ fontSize: 9, color: '#ff6666', letterSpacing: 2, marginBottom: 8 }}>ISSUES DETECTED</div>
                {result.issues.map((issue, i) => (
                  <div key={i} style={{ fontSize: 10, color: '#cc8888', fontFamily: 'monospace', marginBottom: 5, paddingLeft: 12, borderLeft: '2px solid #ff444440', lineHeight: 1.5 }}>
                    {issue}
                  </div>
                ))}
              </div>
            )}
            {result.suggestions.length > 0 && (
              <div style={{ background: '#001008', border: `1px solid ${C.green}25`, borderRadius: 4, padding: 12, marginBottom: 10 }}>
                <div style={{ fontSize: 9, color: C.green, letterSpacing: 2, marginBottom: 8 }}>SUGGESTIONS</div>
                {result.suggestions.map((s, i) => (
                  <div key={i} style={{ fontSize: 10, color: '#88cc99', fontFamily: 'monospace', marginBottom: 5, paddingLeft: 12, borderLeft: `2px solid ${C.green}40`, lineHeight: 1.5 }}>
                    {s}
                  </div>
                ))}
              </div>
            )}
            {result.issues.length === 0 && (
              <div style={{ background: '#001008', border: `1px solid ${C.green}40`, borderRadius: 4, padding: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle size={16} color={C.green} />
                <span style={{ fontSize: 10, color: C.green, fontFamily: 'monospace' }}>No critical issues detected. Reference appears well-formed.</span>
              </div>
            )}

            {/* Copy reference */}
            <div style={{ background: '#0c0c0c', border: `1px solid ${C.border}`, borderRadius: 4, padding: 10, marginTop: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 9, color: '#666', letterSpacing: 1 }}>PARSED INPUT</span>
                <CopyBtn text={raw} id="validator-ref" copied={copied} copy={copy} />
              </div>
              <p style={{ color: '#888', fontSize: 10, fontFamily: 'monospace', lineHeight: 1.5, margin: 0 }}>{raw}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ConverterTab() {
  const [input, setInput] = useState('');
  const [targetStyle, setTargetStyle] = useState<Style>('APA');
  const [detectedStyle, setDetectedStyle] = useState<Style | 'UNKNOWN'>('UNKNOWN');
  const [output, setOutput] = useState('');
  const { copied, copy } = useClipboard();

  const convert = () => {
    const detected = detectStyle(input);
    setDetectedStyle(detected);
    const parsed = parseReference(input);
    const partialCitation: Citation = {
      ...EMPTY_CITATION,
      authors: parsed.authors || [],
      year: parsed.year || '',
      title: input.match(/"([^"]+)"|\.([^.]+)\./)?.[1] || input.match(/\.([^.]+)\./)?.[1]?.trim() || '',
      doi: parsed.doi || '',
      url: parsed.url || '',
      volume: parsed.volume || '',
      pages: parsed.pages || '',
      sourceType: parsed.doi ? 'journal' : 'website',
    };
    const result = targetStyle === 'APA' ? renderAPA(partialCitation)
      : targetStyle === 'MLA' ? renderMLA(partialCitation)
      : targetStyle === 'CMS' ? renderCMS(partialCitation)
      : renderACS(partialCitation);
    setOutput(result);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
      <div style={{ fontSize: 9, color: C.purple, letterSpacing: 2, marginBottom: 4, textTransform: 'uppercase' }}>Cross-Style Citation Converter</div>

      <div>
        <label style={LABEL_STYLE}>Input Reference (any style)</label>
        <textarea value={input} onChange={e => setInput(e.target.value)} placeholder="Paste a citation in any format (APA, MLA, CMS, ACS)..." style={{ ...FIELD_STYLE, height: 70, resize: 'none', lineHeight: 1.6 }} />
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <label style={LABEL_STYLE}>Convert to</label>
          <select value={targetStyle} onChange={e => setTargetStyle(e.target.value as Style)} style={{ ...FIELD_STYLE }}>
            {(['APA', 'MLA', 'CMS', 'ACS'] as Style[]).map(s => <option key={s} value={s}>{s} — {STYLE_GUIDES[s].subtitle}</option>)}
          </select>
        </div>
        <button onClick={convert} style={{ background: `${C.purple}18`, border: `1px solid ${C.purple}40`, color: C.purple, cursor: 'pointer', padding: '6px 18px', borderRadius: 4, fontFamily: 'monospace', fontSize: 10, letterSpacing: 1 }}>
          CONVERT
        </button>
      </div>

      {detectedStyle !== 'UNKNOWN' && (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <RefreshCw size={10} color={STYLE_GUIDES[detectedStyle as Style]?.color || '#666'} />
          <span style={{ fontSize: 9, color: STYLE_GUIDES[detectedStyle as Style]?.color || '#666', fontFamily: 'monospace', letterSpacing: 1 }}>
            DETECTED: {detectedStyle} → {targetStyle}
          </span>
        </div>
      )}

      {output && (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ background: '#0c0c0c', border: `1px solid ${STYLE_GUIDES[targetStyle].color}40`, borderRadius: 4, padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 10, color: STYLE_GUIDES[targetStyle].color, fontFamily: 'monospace', letterSpacing: 2 }}>CONVERTED — {targetStyle}</span>
              <CopyBtn text={output} id="converter-out" copied={copied} copy={copy} />
            </div>
            <p style={{ color: C.text, fontSize: 11, fontFamily: '"Courier New", monospace', lineHeight: 1.7, margin: 0, paddingLeft: 24, textIndent: -24 }}>
              {output}
            </p>
          </div>

          <div style={{ background: '#0a0008', border: `1px solid ${C.purple}18`, borderRadius: 4, padding: 12, marginTop: 10 }}>
            <div style={{ fontSize: 9, color: C.purple, letterSpacing: 2, marginBottom: 8 }}>NOTE</div>
            <p style={{ fontSize: 10, color: '#999', fontFamily: 'monospace', lineHeight: 1.6, margin: 0 }}>
              Automatic conversion extracts author, year, title, DOI, and pages from the raw text. For full accuracy, use the Generator tab to input all fields manually. Journal names, publishers, and volumes may need manual review.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Shared section components ──────────────────────────────────────
function GuideSection({ label, color, children }: { label: string; color: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ marginBottom: 14 }}>
      <button onClick={() => setOpen(v => !v)} style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', marginBottom: open ? 8 : 0 }}>
        <div style={{ fontSize: 9, color, letterSpacing: 2, fontFamily: 'monospace', flexShrink: 0 }}>{label}</div>
        <div style={{ flex: 1, height: 1, background: `${color}20` }} />
        {open ? <ChevronUp size={10} color="#555" /> : <ChevronDown size={10} color="#555" />}
      </button>
      {open && children}
    </div>
  );
}

function VariationCard({ v, color, copied, copy, idx }: { v: InTextVariation; color: string; copied: string | null; copy: (t: string, k: string) => void; idx: number }) {
  const [open, setOpen] = useState(false);
  const copyKey = `intext-${idx}`;
  return (
    <div style={{ border: `1px solid ${C.border}`, borderRadius: 4, marginBottom: 5, overflow: 'hidden' }}>
      <button onClick={() => setOpen(v => !v)} style={{ width: '100%', background: open ? `${color}08` : 'transparent', border: 'none', cursor: 'pointer', padding: '7px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
          <span style={{ fontSize: 9, color, fontFamily: 'monospace', letterSpacing: 0.5 }}>{v.label}</span>
          <code style={{ fontSize: 10, color: '#777', fontFamily: '"Courier New", monospace' }}>{v.pattern}</code>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <code style={{ fontSize: 10, color: C.text, fontFamily: '"Courier New", monospace', background: '#111', padding: '1px 6px', borderRadius: 2 }}>{v.example}</code>
          {open ? <ChevronUp size={9} color="#555" /> : <ChevronDown size={9} color="#555" />}
        </div>
      </button>
      {open && (
        <div style={{ padding: '8px 12px', background: '#080808', borderTop: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {v.note && <div style={{ fontSize: 10, color: '#888', lineHeight: 1.5, fontFamily: 'monospace' }}>{v.note}</div>}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <code style={{ fontSize: 10, color: C.text, fontFamily: '"Courier New", monospace', lineHeight: 1.6, flex: 1 }}>{v.example}</code>
            <CopyBtn text={v.example} id={copyKey} copied={copied} copy={copy} />
          </div>
        </div>
      )}
    </div>
  );
}

function QuotedCard({ q, color, copied, copy, idx }: { q: QuotedCitationRule; color: string; copied: string | null; copy: (t: string, k: string) => void; idx: number }) {
  const [open, setOpen] = useState(false);
  const copyKey = `quote-${idx}`;
  return (
    <div style={{ border: `1px solid ${C.border}`, borderRadius: 4, marginBottom: 5, overflow: 'hidden' }}>
      <button onClick={() => setOpen(v => !v)} style={{ width: '100%', background: open ? `${color}08` : 'transparent', border: 'none', cursor: 'pointer', padding: '7px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 9, color, fontFamily: 'monospace', letterSpacing: 0.5, textAlign: 'left' }}>{q.label}</span>
        {open ? <ChevronUp size={9} color="#555" /> : <ChevronDown size={9} color="#555" />}
      </button>
      {open && (
        <div style={{ padding: '8px 12px', background: '#080808', borderTop: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 10, color: '#888', lineHeight: 1.5, fontFamily: 'monospace' }}>{q.rule}</div>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
            <code style={{ fontSize: 10, color: C.text, fontFamily: '"Courier New", monospace', lineHeight: 1.7, flex: 1, whiteSpace: 'pre-wrap' }}>{q.example}</code>
            <CopyBtn text={q.example} id={copyKey} copied={copied} copy={copy} />
          </div>
        </div>
      )}
    </div>
  );
}

function GuideTab() {
  const [mode, setMode] = useState<'main' | 'extra'>('main');
  const [activeStyle, setActiveStyle] = useState<Style>('APA');
  const [activeExtra, setActiveExtra] = useState<string>('IEEE');
  const [expandedExample, setExpandedExample] = useState<string | null>('Journal Article');
  const { copied, copy } = useClipboard();

  const guide = STYLE_GUIDES[activeStyle];
  const extraGuide = EXTRA_GUIDES.find(g => g.id === activeExtra) ?? EXTRA_GUIDES[0];
  const activeColor = mode === 'main' ? guide.color : extraGuide.color;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 8 }}>
        <button onClick={() => setMode('main')} style={{ background: mode === 'main' ? '#1e1e1e' : 'transparent', border: `1px solid ${mode === 'main' ? C.border : 'transparent'}`, color: mode === 'main' ? C.text : '#555', cursor: 'pointer', padding: '4px 12px', borderRadius: 3, fontSize: 10, fontFamily: 'monospace', letterSpacing: 0.5 }}>
          APA · MLA · CMS · ACS
        </button>
        <button onClick={() => setMode('extra')} style={{ background: mode === 'extra' ? '#1e1e1e' : 'transparent', border: `1px solid ${mode === 'extra' ? C.border : 'transparent'}`, color: mode === 'extra' ? C.text : '#555', cursor: 'pointer', padding: '4px 12px', borderRadius: 3, fontSize: 10, fontFamily: 'monospace', letterSpacing: 0.5 }}>
          IEEE · Vancouver · Harvard · Turabian
        </button>
      </div>

      {/* Style selector tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 12, borderBottom: `1px solid ${C.border}`, paddingBottom: 8 }}>
        {mode === 'main'
          ? (['APA', 'MLA', 'CMS', 'ACS'] as Style[]).map(style => (
              <button key={style} onClick={() => { setActiveStyle(style); setExpandedExample(null); }}
                style={{ background: activeStyle === style ? `${STYLE_GUIDES[style].color}18` : 'transparent', border: `1px solid ${activeStyle === style ? STYLE_GUIDES[style].color + '60' : C.border}`, color: activeStyle === style ? STYLE_GUIDES[style].color : '#666', cursor: 'pointer', padding: '5px 14px', borderRadius: 3, fontFamily: 'monospace', fontSize: 10, letterSpacing: 1 }}>
                {style}
              </button>
            ))
          : EXTRA_GUIDES.map(g => (
              <button key={g.id} onClick={() => setActiveExtra(g.id)}
                style={{ background: activeExtra === g.id ? `${g.color}18` : 'transparent', border: `1px solid ${activeExtra === g.id ? g.color + '60' : C.border}`, color: activeExtra === g.id ? g.color : '#666', cursor: 'pointer', padding: '5px 14px', borderRadius: 3, fontFamily: 'monospace', fontSize: 10, letterSpacing: 1 }}>
                {g.id}
              </button>
            ))
        }
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>

        {/* ── MAIN STYLES ────────────────────────────── */}
        {mode === 'main' && (<>
          {/* Header */}
          <div style={{ marginBottom: 12, paddingBottom: 10, borderBottom: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 13, color: guide.color, fontFamily: 'monospace', letterSpacing: 1, marginBottom: 2 }}>{activeStyle}</div>
            <div style={{ fontSize: 10, color: '#888', marginBottom: 2 }}>{guide.subtitle}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 9, color: '#555', letterSpacing: 1 }}>{guide.edition}</div>
              <div style={{ fontSize: 9, color: '#555' }}>Reference list: <span style={{ color: '#777' }}>{guide.refHeader}</span></div>
            </div>
          </div>

          {/* In-text summary box */}
          <div style={{ background: '#0c0c0c', border: `1px solid ${guide.color}30`, borderRadius: 4, padding: '8px 12px', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 8, color: guide.color, letterSpacing: 2, marginBottom: 4, fontFamily: 'monospace' }}>BASIC IN-TEXT FORMAT</div>
              <code style={{ fontSize: 11, color: C.text, fontFamily: '"Courier New", monospace' }}>{guide.inTextFormat}</code>
            </div>
            <CopyBtn text={guide.inTextFormat} id="intext-fmt" copied={copied} copy={copy} />
          </div>

          {/* In-text variations */}
          <GuideSection label="IN-TEXT CITATION VARIATIONS" color={guide.color}>
            {guide.inTextVariations.map((v, i) => (
              <VariationCard key={i} v={v} color={guide.color} copied={copied} copy={copy} idx={i} />
            ))}
          </GuideSection>

          {/* Quoted citations */}
          <GuideSection label="QUOTED CITATIONS" color={guide.color}>
            <div style={{ background: '#0c0c0c', border: `1px solid ${guide.color}20`, borderRadius: 3, padding: '7px 10px', marginBottom: 8, fontSize: 10, color: '#888', fontFamily: 'monospace', lineHeight: 1.6 }}>
              <span style={{ color: guide.color }}>Block quote threshold: </span>{guide.blockQuoteRule}
            </div>
            {guide.quotedCitations.map((q, i) => (
              <QuotedCard key={i} q={q} color={guide.color} copied={copied} copy={copy} idx={i} />
            ))}
          </GuideSection>

          {/* Key rules */}
          <GuideSection label="KEY RULES" color={guide.color}>
            {guide.keyRules.map((rule, i) => (
              <div key={i} style={{ fontSize: 10, color: '#aaa', fontFamily: 'monospace', marginBottom: 5, paddingLeft: 12, borderLeft: `2px solid ${guide.color}30`, lineHeight: 1.5 }}>
                {rule}
              </div>
            ))}
          </GuideSection>

          {/* Special cases */}
          <GuideSection label="SPECIAL CASES" color={guide.color}>
            {guide.specialCases.map((sc, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5, padding: '5px 8px', background: '#0a0a0a', borderRadius: 3, gap: 8 }}>
                <span style={{ fontSize: 9, color: '#777', fontFamily: 'monospace', flexShrink: 0, minWidth: 160 }}>{sc.label}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <code style={{ fontSize: 10, color: C.text, fontFamily: '"Courier New", monospace' }}>{sc.example}</code>
                  <CopyBtn text={sc.example} id={`sc-${i}`} copied={copied} copy={copy} />
                </div>
              </div>
            ))}
          </GuideSection>

          {/* Reference list examples */}
          <GuideSection label="REFERENCE LIST EXAMPLES" color={guide.color}>
            {Object.entries(guide.examples).map(([type, example]) => (
              <div key={type} style={{ border: `1px solid ${C.border}`, borderRadius: 4, marginBottom: 6, overflow: 'hidden' }}>
                <button onClick={() => setExpandedExample(expandedExample === type ? null : type)}
                  style={{ width: '100%', background: expandedExample === type ? `${guide.color}08` : 'transparent', border: 'none', cursor: 'pointer', padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 9, color: guide.color, fontFamily: 'monospace', letterSpacing: 1 }}>{type.toUpperCase()}</span>
                  {expandedExample === type ? <ChevronUp size={10} color="#666" /> : <ChevronDown size={10} color="#666" />}
                </button>
                {expandedExample === type && (
                  <div style={{ padding: '10px 12px', background: '#080808', borderTop: `1px solid ${C.border}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <p style={{ color: C.text, fontSize: 10, fontFamily: '"Courier New", monospace', lineHeight: 1.7, margin: 0, paddingLeft: 20, textIndent: -20, flex: 1 }}>
                        {example}
                      </p>
                      <CopyBtn text={example} id={`ex-${type}`} copied={copied} copy={copy} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </GuideSection>
        </>)}

        {/* ── EXTRA STYLES ───────────────────────────── */}
        {mode === 'extra' && (<>
          {/* Header */}
          <div style={{ marginBottom: 12, paddingBottom: 10, borderBottom: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 13, color: extraGuide.color, fontFamily: 'monospace', letterSpacing: 1, marginBottom: 2 }}>{extraGuide.name}</div>
            <div style={{ fontSize: 10, color: '#888', marginBottom: 2 }}>{extraGuide.subtitle}</div>
            <div style={{ fontSize: 9, color: '#555', marginBottom: 2, letterSpacing: 0.5 }}>{extraGuide.edition}</div>
            <div style={{ fontSize: 9, color: extraGuide.color + 'bb', background: `${extraGuide.color}10`, display: 'inline-block', padding: '2px 8px', borderRadius: 2, marginTop: 4 }}>
              Primary use: {extraGuide.primaryUse}
            </div>
          </div>

          {/* In-text summary */}
          <div style={{ background: '#0c0c0c', border: `1px solid ${extraGuide.color}30`, borderRadius: 4, padding: '8px 12px', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 8, color: extraGuide.color, letterSpacing: 2, marginBottom: 4, fontFamily: 'monospace' }}>BASIC IN-TEXT FORMAT</div>
              <code style={{ fontSize: 11, color: C.text, fontFamily: '"Courier New", monospace' }}>{extraGuide.inTextFormat}</code>
              <div style={{ fontSize: 9, color: '#555', marginTop: 4 }}>Reference list: <span style={{ color: '#777' }}>{extraGuide.refHeader}</span></div>
            </div>
          </div>

          {/* In-text variations */}
          <GuideSection label="IN-TEXT CITATION VARIATIONS" color={extraGuide.color}>
            {extraGuide.inTextVariations.map((v, i) => (
              <VariationCard key={i} v={v} color={extraGuide.color} copied={copied} copy={copy} idx={i} />
            ))}
          </GuideSection>

          {/* Quoted citations */}
          <GuideSection label="QUOTED CITATIONS" color={extraGuide.color}>
            <div style={{ background: '#0c0c0c', border: `1px solid ${extraGuide.color}20`, borderRadius: 3, padding: '7px 10px', marginBottom: 8, fontSize: 10, color: '#888', fontFamily: 'monospace', lineHeight: 1.6 }}>
              <span style={{ color: extraGuide.color }}>Block quote policy: </span>{extraGuide.blockQuoteRule}
            </div>
            {extraGuide.quotedCitations.map((q, i) => (
              <QuotedCard key={i} q={q} color={extraGuide.color} copied={copied} copy={copy} idx={i} />
            ))}
          </GuideSection>

          {/* Key rules */}
          <GuideSection label="KEY RULES" color={extraGuide.color}>
            {extraGuide.keyRules.map((rule, i) => (
              <div key={i} style={{ fontSize: 10, color: '#aaa', fontFamily: 'monospace', marginBottom: 5, paddingLeft: 12, borderLeft: `2px solid ${extraGuide.color}30`, lineHeight: 1.5 }}>
                {rule}
              </div>
            ))}
          </GuideSection>

          {/* Special cases */}
          <GuideSection label="SPECIAL CASES" color={extraGuide.color}>
            {extraGuide.specialCases.map((sc, i) => (
              <div key={i} style={{ marginBottom: 5, padding: '5px 8px', background: '#0a0a0a', borderRadius: 3 }}>
                <div style={{ fontSize: 9, color: '#777', fontFamily: 'monospace', marginBottom: 3 }}>{sc.label}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <code style={{ fontSize: 10, color: C.text, fontFamily: '"Courier New", monospace', flex: 1 }}>{sc.example}</code>
                  <CopyBtn text={sc.example} id={`esc-${i}`} copied={copied} copy={copy} />
                </div>
              </div>
            ))}
          </GuideSection>

          {/* Examples */}
          <GuideSection label="REFERENCE LIST EXAMPLES" color={extraGuide.color}>
            {extraGuide.examples.map((ex, i) => (
              <div key={i} style={{ border: `1px solid ${C.border}`, borderRadius: 4, marginBottom: 6, overflow: 'hidden' }}>
                <div style={{ padding: '8px 12px', background: `${extraGuide.color}08`, borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 9, color: extraGuide.color, fontFamily: 'monospace', letterSpacing: 1 }}>{ex.label.toUpperCase()}</span>
                  <CopyBtn text={ex.text} id={`eex-${i}`} copied={copied} copy={copy} />
                </div>
                <div style={{ padding: '10px 12px', background: '#080808' }}>
                  <p style={{ color: C.text, fontSize: 10, fontFamily: '"Courier New", monospace', lineHeight: 1.7, margin: 0, paddingLeft: 20, textIndent: -20 }}>
                    {ex.text}
                  </p>
                </div>
              </div>
            ))}
          </GuideSection>
        </>)}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// URL IMPORT TAB
// ─────────────────────────────────────────────────────────────────

interface UrlMeta {
  title: string;
  author: string;
  date: string;
  publisher: string;
  description: string;
  url: string;
  host: string;
}

function metaToCitation(m: UrlMeta): Citation {
  const year = m.date ? (m.date.match(/\d{4}/)?.[0] ?? new Date().getFullYear().toString()) : new Date().getFullYear().toString();
  const accessDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  return {
    ...EMPTY_CITATION,
    authors: m.author ? [m.author] : [],
    year,
    title: m.title,
    sourceType: 'website',
    websiteTitle: m.publisher || m.host,
    url: m.url,
    accessDate,
  };
}

function UrlImportTab() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<UrlMeta | null>(null);
  const { copied, copy } = useClipboard();

  const fetchMeta = async () => {
    if (!url.trim()) return;
    setLoading(true); setError(null); setMeta(null);
    try {
      const res = await fetch(`/api/fetch-url-meta?url=${encodeURIComponent(url.trim())}`);
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? res.statusText); }
      const data: UrlMeta = await res.json();
      setMeta(data);
    } catch (e: unknown) {
      setError((e as Error).message ?? 'Failed to fetch URL');
    } finally {
      setLoading(false);
    }
  };

  const citations = meta ? (() => {
    const c = metaToCitation(meta);
    return { APA: renderAPA(c), MLA: renderMLA(c), CMS: renderCMS(c), ACS: renderACS(c) } as Record<string, string>;
  })() : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
      <div style={{ fontSize: 9, color: C.cyan, letterSpacing: 2, marginBottom: 4 }}>PASTE A URL — GENERATES CITATIONS IN ALL FORMATS</div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
        <input
          value={url}
          onChange={e => setUrl(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && fetchMeta()}
          placeholder="https://www.example.com/article..."
          style={{ ...FIELD_STYLE, flex: 1 }}
        />
        <button onClick={fetchMeta} disabled={loading || !url.trim()} style={{ background: `${C.cyan}18`, border: `1px solid ${C.cyan}50`, color: loading ? '#555' : C.cyan, cursor: loading ? 'wait' : 'pointer', padding: '0 16px', borderRadius: 4, fontFamily: 'monospace', fontSize: 10, letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
          {loading ? <Loader size={11} className="animate-spin" /> : <Link size={11} />}
          {loading ? 'FETCHING...' : 'FETCH & CITE'}
        </button>
      </div>

      {error && (
        <div style={{ background: '#100000', border: '1px solid #ff000030', borderRadius: 4, padding: 10, fontSize: 10, color: '#ff6666', fontFamily: 'monospace' }}>
          SIGNAL LOST: {error}
        </div>
      )}

      {meta && (
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Extracted metadata */}
          <div style={{ background: '#080818', border: `1px solid ${C.cyan}25`, borderRadius: 4, padding: 12 }}>
            <div style={{ fontSize: 9, color: C.cyan, letterSpacing: 2, marginBottom: 8 }}>EXTRACTED METADATA</div>
            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '5px 10px', fontSize: 10, fontFamily: 'monospace' }}>
              {[['TITLE', meta.title], ['AUTHOR', meta.author || '(not found)'], ['DATE', meta.date || '(not found)'], ['PUBLISHER', meta.publisher || meta.host], ['URL', meta.url]].map(([label, val]) => (
                <>
                  <span key={label + 'l'} style={{ color: '#555', letterSpacing: 1 }}>{label}</span>
                  <span key={label + 'v'} style={{ color: val.startsWith('(') ? '#444' : C.text, wordBreak: 'break-all' }}>{val}</span>
                </>
              ))}
            </div>
          </div>

          {/* Generated citations */}
          {citations && (
            <div>
              <div style={{ fontSize: 9, color: C.amber, letterSpacing: 2, marginBottom: 8 }}>GENERATED CITATIONS</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(Object.entries(citations) as [string, string][]).map(([style, text]) => {
                  const styleColor = STYLE_GUIDES[style as Style]?.color ?? C.text;
                  return (
                    <div key={style} style={{ background: '#0c0c0c', border: `1px solid ${styleColor}25`, borderRadius: 4, padding: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontSize: 9, color: styleColor, letterSpacing: 2, fontFamily: 'monospace' }}>{style}</span>
                        <CopyBtn text={text} id={`url-${style}`} copied={copied} copy={copy} />
                      </div>
                      <p style={{ color: '#aaa', fontSize: 10, fontFamily: '"Courier New", monospace', lineHeight: 1.6, margin: 0, paddingLeft: 20, textIndent: -20 }}>
                        {text || <em style={{ color: '#555' }}>Could not generate — missing required metadata</em>}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{ background: '#060606', border: `1px solid ${C.border}`, borderRadius: 4, padding: 10 }}>
            <div style={{ fontSize: 9, color: '#555', letterSpacing: 1, marginBottom: 4 }}>ACCURACY NOTE</div>
            <p style={{ fontSize: 9, color: '#555', fontFamily: 'monospace', lineHeight: 1.6, margin: 0 }}>
              Auto-extracted metadata may be incomplete. Verify author, date, and publisher fields. Use the GENERATE tab to edit fields manually for full accuracy.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Main app
// ─────────────────────────────────────────────────────────────────
type Tab = 'GENERATE' | 'URL' | 'VALIDATE' | 'CONVERT' | 'GUIDE';

export function CitationEngineApp() {
  const [activeTab, setActiveTab] = useState<Tab>('GENERATE');

  const tabs: { id: Tab; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'GENERATE', label: 'GENERATE', icon: <FileText size={11} />,    color: C.amber },
    { id: 'URL',      label: 'URL IMPORT', icon: <Link size={11} />,      color: C.cyan },
    { id: 'VALIDATE', label: 'VALIDATE', icon: <CheckCircle size={11} />, color: C.pink },
    { id: 'CONVERT',  label: 'CONVERT',  icon: <RefreshCw size={11} />,   color: C.purple },
    { id: 'GUIDE',    label: 'GUIDE',    icon: <BookOpen size={11} />,    color: C.green },
  ];

  const activeColor = tabs.find(t => t.id === activeTab)?.color || C.amber;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: C.dark, fontFamily: '"Courier New", monospace', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '10px 14px 0', borderBottom: `1px solid ${C.border}`, background: '#0a0a0a' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <FlaskConical size={14} color={activeColor} />
          <span style={{ fontSize: 11, color: activeColor, letterSpacing: 2, textTransform: 'uppercase' }}>Academic Citation Engine</span>
          <span style={{ fontSize: 8, color: '#444', marginLeft: 'auto', letterSpacing: 1 }}>APA · MLA · CMS · ACS</span>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0 }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              background: activeTab === tab.id ? `${tab.color}14` : 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.id ? `2px solid ${tab.color}` : '2px solid transparent',
              color: activeTab === tab.id ? tab.color : '#555',
              cursor: 'pointer',
              padding: '6px 14px',
              fontFamily: '"Courier New", monospace',
              fontSize: 9,
              letterSpacing: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              transition: 'color 0.15s ease',
            }}>
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {activeTab === 'GENERATE' && <GeneratorTab />}
        {activeTab === 'URL' && <UrlImportTab />}
        {activeTab === 'VALIDATE' && <ValidatorTab />}
        {activeTab === 'CONVERT' && <ConverterTab />}
        {activeTab === 'GUIDE' && <GuideTab />}
      </div>
    </div>
  );
}
