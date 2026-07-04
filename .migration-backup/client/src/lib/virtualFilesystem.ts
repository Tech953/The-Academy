export type FileType = 'file' | 'directory' | 'executable' | 'locked';

export interface VirtualFile {
  name: string;
  type: FileType;
  path: string;
  content?: string;
  permissions: 'read' | 'write' | 'execute' | 'locked';
  metadata?: {
    createdAt: string;
    modifiedAt: string;
    size: number;
    owner: string;
    icon?: string;
  };
  children?: VirtualFile[];
}

export interface FileSystemState {
  currentPath: string;
  files: Map<string, VirtualFile>;
}

const DEFAULT_FILESYSTEM: VirtualFile = {
  name: '/',
  type: 'directory',
  path: '/',
  permissions: 'read',
  children: [
    {
      name: 'home',
      type: 'directory',
      path: '/home',
      permissions: 'read',
      children: [
        {
          name: 'student',
          type: 'directory',
          path: '/home/student',
          permissions: 'write',
          children: [
            {
              name: 'desktop',
              type: 'directory',
              path: '/home/student/desktop',
              permissions: 'write',
              children: []
            },
            {
              name: 'documents',
              type: 'directory',
              path: '/home/student/documents',
              permissions: 'write',
              children: [
                {
                  name: 'textbooks',
                  type: 'directory',
                  path: '/home/student/documents/textbooks',
                  permissions: 'read',
                  children: []
                },
                {
                  name: 'assignments',
                  type: 'directory',
                  path: '/home/student/documents/assignments',
                  permissions: 'write',
                  children: []
                },
                {
                  name: 'notes',
                  type: 'directory',
                  path: '/home/student/documents/notes',
                  permissions: 'write',
                  children: []
                }
              ]
            },
            {
              name: 'messages',
              type: 'directory',
              path: '/home/student/messages',
              permissions: 'read',
              children: []
            },
            {
              name: 'downloads',
              type: 'directory',
              path: '/home/student/downloads',
              permissions: 'write',
              children: []
            },
            {
              name: 'readme.txt',
              type: 'file',
              path: '/home/student/readme.txt',
              permissions: 'read',
              content: 'Welcome to The Academy.\n\nThis is your personal student terminal.\nType "help" to see available commands.\n\nRemember: Everything is logged. Everything resonates.',
              metadata: {
                createdAt: '1987-09-01',
                modifiedAt: '1987-09-01',
                size: 156,
                owner: 'system'
              }
            },
            {
              name: '.config',
              type: 'directory',
              path: '/home/student/.config',
              permissions: 'write',
              children: [
                {
                  name: 'preferences.json',
                  type: 'file',
                  path: '/home/student/.config/preferences.json',
                  permissions: 'write',
                  content: '{\n  "theme": "crt-green",\n  "fontSize": 14,\n  "scanlines": true,\n  "sound": true\n}',
                  metadata: {
                    createdAt: '1987-09-01',
                    modifiedAt: '1987-09-01',
                    size: 82,
                    owner: 'student'
                  }
                }
              ]
            }
          ]
        }
      ]
    },
    {
      name: 'system',
      type: 'directory',
      path: '/system',
      permissions: 'read',
      children: [
        {
          name: 'academy',
          type: 'directory',
          path: '/system/academy',
          permissions: 'read',
          children: [
            {
              name: 'version.txt',
              type: 'file',
              path: '/system/academy/version.txt',
              permissions: 'read',
              content: 'THE ACADEMY OS v1987.144\nBuild: ARCHIVE-7\nKernel: MOTHER-ARCHIVE',
              metadata: {
                createdAt: '1987-01-01',
                modifiedAt: '1987-09-01',
                size: 64,
                owner: 'system'
              }
            }
          ]
        },
        {
          name: 'policies',
          type: 'directory',
          path: '/system/policies',
          permissions: 'locked',
          children: []
        },
        {
          name: 'npc_profiles',
          type: 'directory',
          path: '/system/npc_profiles',
          permissions: 'locked',
          children: []
        }
      ]
    },
    {
      name: 'apps',
      type: 'directory',
      path: '/apps',
      permissions: 'read',
      children: [
        {
          name: 'calculator',
          type: 'executable',
          path: '/apps/calculator',
          permissions: 'execute',
          metadata: {
            createdAt: '1987-01-01',
            modifiedAt: '1987-01-01',
            size: 1024,
            owner: 'system',
            icon: 'calculator'
          }
        },
        {
          name: 'notes',
          type: 'executable',
          path: '/apps/notes',
          permissions: 'execute',
          metadata: {
            createdAt: '1987-01-01',
            modifiedAt: '1987-01-01',
            size: 2048,
            owner: 'system',
            icon: 'file-text'
          }
        },
        {
          name: 'browser',
          type: 'executable',
          path: '/apps/browser',
          permissions: 'execute',
          metadata: {
            createdAt: '1987-01-01',
            modifiedAt: '1987-01-01',
            size: 4096,
            owner: 'system',
            icon: 'globe'
          }
        }
      ]
    },
    {
      name: 'tmp',
      type: 'directory',
      path: '/tmp',
      permissions: 'write',
      children: []
    },
    {
      name: 'logs',
      type: 'directory',
      path: '/logs',
      permissions: 'read',
      children: [
        {
          name: 'system.log',
          type: 'file',
          path: '/logs/system.log',
          permissions: 'read',
          content: '[1987-09-01 00:00:00] SYSTEM: Boot sequence initiated\n[1987-09-01 00:00:01] SYSTEM: Memory banks verified\n[1987-09-01 00:00:02] SYSTEM: Archive drive mounted\n[1987-09-01 00:00:03] SYSTEM: Terminal interface active',
          metadata: {
            createdAt: '1987-09-01',
            modifiedAt: '1987-09-01',
            size: 256,
            owner: 'system'
          }
        }
      ]
    }
  ]
};

class VirtualFileSystem {
  private root: VirtualFile;
  private currentPath: string;
  private fileIndex: Map<string, VirtualFile>;

  constructor() {
    this.root = JSON.parse(JSON.stringify(DEFAULT_FILESYSTEM));
    this.currentPath = '/home/student';
    this.fileIndex = new Map();
    this.indexFiles(this.root);
  }

  private indexFiles(node: VirtualFile): void {
    this.fileIndex.set(node.path, node);
    if (node.children) {
      node.children.forEach(child => this.indexFiles(child));
    }
  }

  getCurrentPath(): string {
    return this.currentPath;
  }

  getPromptPath(): string {
    if (this.currentPath === '/home/student') {
      return '~';
    }
    return this.currentPath.replace('/home/student', '~');
  }

  resolvePath(path: string): string {
    if (path.startsWith('/')) {
      return path;
    }
    if (path === '~' || path.startsWith('~/')) {
      return path.replace('~', '/home/student');
    }
    if (path === '..') {
      const parts = this.currentPath.split('/').filter(Boolean);
      parts.pop();
      return '/' + parts.join('/') || '/';
    }
    if (path === '.') {
      return this.currentPath;
    }
    
    let resolved = this.currentPath;
    const segments = path.split('/');
    
    for (const segment of segments) {
      if (segment === '..') {
        const parts = resolved.split('/').filter(Boolean);
        parts.pop();
        resolved = '/' + parts.join('/') || '/';
      } else if (segment !== '.' && segment !== '') {
        resolved = resolved === '/' ? `/${segment}` : `${resolved}/${segment}`;
      }
    }
    
    return resolved;
  }

  getFile(path: string): VirtualFile | null {
    const resolved = this.resolvePath(path);
    return this.fileIndex.get(resolved) || null;
  }

  listDirectory(path?: string): VirtualFile[] {
    const targetPath = path ? this.resolvePath(path) : this.currentPath;
    const dir = this.fileIndex.get(targetPath);
    
    if (!dir || dir.type !== 'directory') {
      return [];
    }
    
    return dir.children || [];
  }

  changeDirectory(path: string): { success: boolean; error?: string } {
    const resolved = this.resolvePath(path);
    const target = this.fileIndex.get(resolved);
    
    if (!target) {
      return { success: false, error: `cd: ${path}: No such file or directory` };
    }
    
    if (target.type !== 'directory') {
      return { success: false, error: `cd: ${path}: Not a directory` };
    }
    
    if (target.permissions === 'locked') {
      return { success: false, error: `cd: ${path}: Permission denied` };
    }
    
    this.currentPath = resolved;
    return { success: true };
  }

  readFile(path: string): { success: boolean; content?: string; error?: string } {
    const resolved = this.resolvePath(path);
    const file = this.fileIndex.get(resolved);
    
    if (!file) {
      return { success: false, error: `cat: ${path}: No such file or directory` };
    }
    
    if (file.type === 'directory') {
      return { success: false, error: `cat: ${path}: Is a directory` };
    }
    
    if (file.permissions === 'locked') {
      return { success: false, error: `cat: ${path}: Permission denied` };
    }
    
    return { success: true, content: file.content || '' };
  }

  writeFile(path: string, content: string): { success: boolean; error?: string } {
    const resolved = this.resolvePath(path);
    const existing = this.fileIndex.get(resolved);
    
    if (existing) {
      if (existing.type === 'directory') {
        return { success: false, error: `write: ${path}: Is a directory` };
      }
      if (existing.permissions !== 'write') {
        return { success: false, error: `write: ${path}: Permission denied` };
      }
      existing.content = content;
      if (existing.metadata) {
        existing.metadata.modifiedAt = new Date().toISOString().split('T')[0];
        existing.metadata.size = content.length;
      }
      return { success: true };
    }
    
    const parentPath = resolved.split('/').slice(0, -1).join('/') || '/';
    const parent = this.fileIndex.get(parentPath);
    
    if (!parent || parent.type !== 'directory') {
      return { success: false, error: `write: ${parentPath}: No such directory` };
    }
    
    if (parent.permissions !== 'write') {
      return { success: false, error: `write: ${parentPath}: Permission denied` };
    }
    
    const fileName = resolved.split('/').pop() || '';
    const newFile: VirtualFile = {
      name: fileName,
      type: 'file',
      path: resolved,
      permissions: 'write',
      content,
      metadata: {
        createdAt: new Date().toISOString().split('T')[0],
        modifiedAt: new Date().toISOString().split('T')[0],
        size: content.length,
        owner: 'student'
      }
    };
    
    if (!parent.children) parent.children = [];
    parent.children.push(newFile);
    this.fileIndex.set(resolved, newFile);
    
    return { success: true };
  }

  mkdir(path: string): { success: boolean; error?: string } {
    const resolved = this.resolvePath(path);
    
    if (this.fileIndex.has(resolved)) {
      return { success: false, error: `mkdir: ${path}: File exists` };
    }
    
    const parentPath = resolved.split('/').slice(0, -1).join('/') || '/';
    const parent = this.fileIndex.get(parentPath);
    
    if (!parent || parent.type !== 'directory') {
      return { success: false, error: `mkdir: ${parentPath}: No such directory` };
    }
    
    if (parent.permissions !== 'write') {
      return { success: false, error: `mkdir: ${parentPath}: Permission denied` };
    }
    
    const dirName = resolved.split('/').pop() || '';
    const newDir: VirtualFile = {
      name: dirName,
      type: 'directory',
      path: resolved,
      permissions: 'write',
      children: []
    };
    
    if (!parent.children) parent.children = [];
    parent.children.push(newDir);
    this.fileIndex.set(resolved, newDir);
    
    return { success: true };
  }

  deleteFile(path: string): { success: boolean; error?: string } {
    const resolved = this.resolvePath(path);
    const file = this.fileIndex.get(resolved);
    
    if (!file) {
      return { success: false, error: `rm: ${path}: No such file or directory` };
    }
    
    if (file.permissions === 'locked' || file.permissions === 'read') {
      return { success: false, error: `rm: ${path}: Permission denied` };
    }
    
    const parentPath = resolved.split('/').slice(0, -1).join('/') || '/';
    const parent = this.fileIndex.get(parentPath);
    
    if (parent && parent.children) {
      parent.children = parent.children.filter(c => c.path !== resolved);
    }
    
    this.fileIndex.delete(resolved);
    return { success: true };
  }

  getFileTree(): VirtualFile {
    return this.root;
  }

  formatListing(files: VirtualFile[], showHidden = false): string {
    const filtered = showHidden ? files : files.filter(f => !f.name.startsWith('.'));
    
    if (filtered.length === 0) {
      return '';
    }
    
    return filtered.map(f => {
      const typeIndicator = f.type === 'directory' ? '/' : f.type === 'executable' ? '*' : '';
      const permChar = f.permissions === 'locked' ? 'L' : 
                       f.permissions === 'execute' ? 'x' : 
                       f.permissions === 'write' ? 'w' : 'r';
      return `[${permChar}] ${f.name}${typeIndicator}`;
    }).join('\n');
  }
}

export const virtualFS = new VirtualFileSystem();
