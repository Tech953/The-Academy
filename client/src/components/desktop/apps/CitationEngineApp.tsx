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
const STYLE_GUIDES: Record<Style, { color: string; subtitle: string; edition: string; inTextFormat: string; refHeader: string; keyRules: string[]; examples: Record<string, string> }> = {
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
    },
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
    },
  },
  CMS: {
    color: C.green, subtitle: 'Chicago Manual of Style', edition: '17th Edition (2017)',
    inTextFormat: 'Footnote¹ (Notes-Bibliography) or (Author Year)',
    refHeader: 'Bibliography',
    keyRules: ['Two systems: Notes-Bibliography and Author-Date', 'Full footnote on first cite; shortened on repeat', 'Bibliography lists all sources alphabetically', 'Title case for all major words', 'Hanging indent in bibliography', 'City of publication included for books', 'Access date optional for websites'],
    examples: {
      'Journal Article': 'Nguyen, Anne T., and Raj Patel. "Cognitive Load in Digital Learning." *Educational Technology Research* 44, no. 2 (2021): 88–102. https://doi.org/10.1234/etr.2021.',
      'Book': 'Kaplan, David. *GED Test Prep Plus 2022–2023*. New York: Kaplan Publishing, 2022.',
      'Website': 'Smith, James. "Understanding Academic Citation Systems." ResearchHub. March 5, 2020. https://researchhub.com/article/123.',
      'Book Chapter': 'Brown, Karen. "Memory and Cognition." In *Handbook of Learning Science*, edited by Laura Davis and Ming Chen, 145–167. New York: Academic Press, 2019.',
    },
  },
  ACS: {
    color: C.purple, subtitle: 'American Chemical Society', edition: 'ACS Style Guide (3rd Ed.)',
    inTextFormat: 'Superscript¹ or [1] numeric',
    refHeader: 'References',
    keyRules: ['Numeric citation order (1, 2, 3…)', 'Superscript or bracketed numbers', 'Journal abbreviations required (J. Am. Chem. Soc.)', 'Year in bold after journal name', 'Volume in italic', 'No period after DOI', 'All authors listed (no et al. in reference list)'],
    examples: {
      'Journal Article': '(1) Nguyen, A. T.; Patel, R. J. Educ. Technol. Res. **2021**, *44*, 88–102. DOI: 10.1234/etr.2021.',
      'Book': '(1) Kaplan, D. *GED Test Prep Plus 2022–2023*; Kaplan Publishing: New York, 2022.',
      'Website': '(1) Smith, J. Understanding Academic Citation Systems. https://researchhub.com/article/123 (accessed Mar 5, 2020).',
      'Book Chapter': '(1) Brown, K. Memory and Cognition. In *Handbook of Learning Science*; Davis, L., Chen, M., Eds.; Academic Press: New York, 2019; pp 145–167.',
    },
  },
};

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

function GuideTab() {
  const [activeStyle, setActiveStyle] = useState<Style>('APA');
  const [expandedExample, setExpandedExample] = useState<string | null>('Journal Article');
  const guide = STYLE_GUIDES[activeStyle];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Style selector tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 12, borderBottom: `1px solid ${C.border}`, paddingBottom: 8 }}>
        {(['APA', 'MLA', 'CMS', 'ACS'] as Style[]).map(style => (
          <button key={style} onClick={() => setActiveStyle(style)} style={{ background: activeStyle === style ? `${STYLE_GUIDES[style].color}18` : 'transparent', border: `1px solid ${activeStyle === style ? STYLE_GUIDES[style].color + '60' : C.border}`, color: activeStyle === style ? STYLE_GUIDES[style].color : '#666', cursor: 'pointer', padding: '5px 14px', borderRadius: 3, fontFamily: 'monospace', fontSize: 10, letterSpacing: 1 }}>
            {style}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 13, color: guide.color, fontFamily: 'monospace', letterSpacing: 1, marginBottom: 2 }}>{activeStyle}</div>
          <div style={{ fontSize: 10, color: '#888', marginBottom: 2 }}>{guide.subtitle}</div>
          <div style={{ fontSize: 9, color: '#555', letterSpacing: 1 }}>{guide.edition}</div>
        </div>

        {/* In-text format */}
        <div style={{ background: '#0c0c0c', border: `1px solid ${guide.color}25`, borderRadius: 4, padding: 10, marginBottom: 12 }}>
          <div style={{ fontSize: 9, color: guide.color, letterSpacing: 2, marginBottom: 6 }}>IN-TEXT CITATION FORMAT</div>
          <code style={{ fontSize: 11, color: C.text, fontFamily: '"Courier New", monospace' }}>{guide.inTextFormat}</code>
          <div style={{ fontSize: 9, color: '#555', marginTop: 4 }}>Reference list header: <span style={{ color: '#888' }}>{guide.refHeader}</span></div>
        </div>

        {/* Key rules */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 9, color: guide.color, letterSpacing: 2, marginBottom: 8 }}>KEY RULES</div>
          {guide.keyRules.map((rule, i) => (
            <div key={i} style={{ fontSize: 10, color: '#aaa', fontFamily: 'monospace', marginBottom: 5, paddingLeft: 12, borderLeft: `2px solid ${guide.color}30`, lineHeight: 1.5 }}>
              {rule}
            </div>
          ))}
        </div>

        {/* Examples */}
        <div>
          <div style={{ fontSize: 9, color: guide.color, letterSpacing: 2, marginBottom: 8 }}>FORMAT EXAMPLES</div>
          {Object.entries(guide.examples).map(([type, example]) => (
            <div key={type} style={{ border: `1px solid ${C.border}`, borderRadius: 4, marginBottom: 6, overflow: 'hidden' }}>
              <button onClick={() => setExpandedExample(expandedExample === type ? null : type)} style={{ width: '100%', background: expandedExample === type ? `${guide.color}08` : 'transparent', border: 'none', cursor: 'pointer', padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 9, color: guide.color, fontFamily: 'monospace', letterSpacing: 1 }}>{type.toUpperCase()}</span>
                {expandedExample === type ? <ChevronUp size={10} color="#666" /> : <ChevronDown size={10} color="#666" />}
              </button>
              {expandedExample === type && (
                <div style={{ padding: '10px 12px', background: '#080808', borderTop: `1px solid ${C.border}` }}>
                  <p style={{ color: C.text, fontSize: 10, fontFamily: '"Courier New", monospace', lineHeight: 1.7, margin: 0, paddingLeft: 20, textIndent: -20 }}>
                    {example}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
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
