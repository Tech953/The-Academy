import { virtualFS } from './virtualFilesystem';

export const ACADEMY_DOC_SCHEMA = 'academy-doc-1.0' as const;
export const DOC_EXT = '.acd';
export const DOCS_ROOT = '/home/student/documents';

// ─── Document Model ───────────────────────────────────────────────────────────

export type BlockType =
  | 'paragraph' | 'heading1' | 'heading2' | 'heading3'
  | 'code' | 'quote' | 'math' | 'annotation' | 'divider';

export interface DocBlock {
  id: string;
  type: BlockType;
  content: string;
  lang?: string;      // code blocks
  citation?: string;  // annotation blocks
}

export interface AcademyDoc {
  schemaVersion: typeof ACADEMY_DOC_SCHEMA;
  title: string;
  subject: string;
  tags: string[];
  author: string;
  version: number;
  createdAt: number;
  updatedAt: number;
  blocks: DocBlock[];
}

export interface DocDelta {
  version: number;
  timestamp: number;
  changeCount: number;
}

// ─── Utilities ────────────────────────────────────────────────────────────────

export function genBlockId(): string {
  return `b${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
}

export function newBlock(type: BlockType = 'paragraph'): DocBlock {
  return { id: genBlockId(), type, content: '' };
}

export function newDoc(title = 'Untitled Document', subject = ''): AcademyDoc {
  const now = Date.now();
  return {
    schemaVersion: ACADEMY_DOC_SCHEMA,
    title, subject, tags: [], author: 'Student',
    version: 1, createdAt: now, updatedAt: now,
    blocks: [newBlock('paragraph')],
  };
}

export function docWordCount(doc: AcademyDoc): number {
  return doc.blocks
    .filter(b => b.type !== 'divider')
    .reduce((n, b) => n + b.content.split(/\s+/).filter(w => w.length > 0).length, 0);
}

export function docToPlainText(doc: AcademyDoc): string {
  return doc.blocks.map(b => {
    switch (b.type) {
      case 'heading1':    return `\n${b.content.toUpperCase()}\n${'='.repeat(Math.min(b.content.length, 60))}`;
      case 'heading2':    return `\n${b.content}\n${'-'.repeat(Math.min(b.content.length, 60))}`;
      case 'heading3':    return `\n### ${b.content}`;
      case 'code':        return `\`\`\`${b.lang ?? ''}\n${b.content}\n\`\`\``;
      case 'quote':       return b.content.split('\n').map(l => `  > ${l}`).join('\n');
      case 'math':        return `  §  ${b.content}`;
      case 'annotation':  return `  [NOTE] ${b.content}`;
      case 'divider':     return '────────────────────';
      default:            return b.content;
    }
  }).join('\n\n').trim();
}

export function docPreview(doc: AcademyDoc, maxChars = 140): string {
  const text = doc.blocks
    .filter(b => b.type !== 'divider' && b.content.trim())
    .map(b => b.content.trim())
    .join(' ');
  return text.length > maxChars ? text.slice(0, maxChars) + '…' : text;
}

export function titleToFilename(title: string): string {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'untitled';
  return slug + DOC_EXT;
}

export function isAcademyDoc(path: string): boolean {
  return path.endsWith(DOC_EXT);
}

// ─── VFS Persistence API ──────────────────────────────────────────────────────

export const academyDocs = {
  /** Save or update a document at given path. Returns the actual saved path. */
  save(doc: AcademyDoc, explicitPath?: string): { path: string; success: boolean; error?: string } {
    const path = explicitPath ?? `${DOCS_ROOT}/notes/${titleToFilename(doc.title)}`;
    const updated: AcademyDoc = { ...doc, updatedAt: Date.now(), version: doc.version + 1 };
    const result = virtualFS.writeFile(path, JSON.stringify(updated, null, 2));
    return { path, success: result.success, error: result.error };
  },

  /** Load a document from VFS. Returns null if not found or wrong format. */
  load(path: string): AcademyDoc | null {
    const result = virtualFS.readFile(path);
    if (!result.success || !result.content) return null;
    try {
      const parsed = JSON.parse(result.content) as AcademyDoc;
      if (!parsed.schemaVersion || !Array.isArray(parsed.blocks)) return null;
      return parsed;
    } catch { return null; }
  },

  /** List all .acd files under a directory recursively. */
  listAll(rootPath = DOCS_ROOT): Array<{ name: string; path: string; preview: string; updatedAt: number; tags: string[] }> {
    const results: Array<{ name: string; path: string; preview: string; updatedAt: number; tags: string[] }> = [];
    const scan = (dirPath: string) => {
      const files = virtualFS.listDirectory(dirPath);
      for (const f of files) {
        if (f.type === 'directory') {
          scan(f.path);
        } else if (f.name.endsWith(DOC_EXT)) {
          const doc = academyDocs.load(f.path);
          results.push({
            name: doc?.title ?? f.name.replace(DOC_EXT, ''),
            path: f.path,
            preview: doc ? docPreview(doc) : '',
            updatedAt: doc?.updatedAt ?? 0,
            tags: doc?.tags ?? [],
          });
        }
      }
    };
    scan(rootPath);
    return results.sort((a, b) => b.updatedAt - a.updatedAt);
  },

  /** Full-text search across all documents. */
  search(query: string): Array<{ name: string; path: string; preview: string }> {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return academyDocs.listAll().filter(
      item => item.name.toLowerCase().includes(q) || item.preview.toLowerCase().includes(q)
    );
  },

  /** Ensure the system has at least a welcome document seeded. */
  seedDefaults(): void {
    const check = virtualFS.readFile(`${DOCS_ROOT}/notes/getting-started.acd`);
    if (check.success) return;

    const welcome: AcademyDoc = {
      schemaVersion: ACADEMY_DOC_SCHEMA,
      title: 'Getting Started with Academy Documents',
      subject: 'Orientation', tags: ['guide', 'orientation'], author: 'Academy System',
      version: 1, createdAt: Date.now(), updatedAt: Date.now(),
      blocks: [
        { id: 'b01', type: 'heading1',   content: 'Getting Started' },
        { id: 'b02', type: 'paragraph',  content: 'Welcome to the Academy Document System — a structured writing environment for academic rigor and personal knowledge management.' },
        { id: 'b03', type: 'heading2',   content: 'Block-Based Editing' },
        { id: 'b04', type: 'paragraph',  content: 'Every document is composed of blocks. Each block has a semantic type that affects how its content is stored, rendered, and exported.' },
        { id: 'b05', type: 'code',       content: 'paragraph  → standard prose\nheading1   → major section title\nheading2   → subsection heading\nheading3   → minor heading\ncode       → verbatim, syntax-tagged\nquote      → block quotation\nmath       → symbolic expression\nannotation → editorial note\ndivider    → section separator', lang: 'text' },
        { id: 'b06', type: 'heading2',   content: 'Keyboard Shortcuts' },
        { id: 'b07', type: 'annotation', content: 'Enter creates a new paragraph block below. Backspace on an empty block deletes it and returns focus to the previous block. Ctrl+Z / Ctrl+Y for undo/redo.' },
        { id: 'b08', type: 'heading2',   content: 'File Format' },
        { id: 'b09', type: 'paragraph',  content: 'Documents are saved as structured JSON (.acd files) in the Academy virtual filesystem. The format is schema-versioned, human-readable, and forward-compatible.' },
        { id: 'b10', type: 'quote',      content: 'Knowledge organized is knowledge accessible. Knowledge scattered is knowledge lost.' },
        { id: 'b11', type: 'divider',    content: '' },
        { id: 'b12', type: 'annotation', content: 'This document is located at /home/student/documents/notes/getting-started.acd' },
      ],
    };
    virtualFS.writeFile(`${DOCS_ROOT}/notes/getting-started.acd`, JSON.stringify(welcome, null, 2));
  },
};
