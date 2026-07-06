/**
 * Phase 3: Curriculum Versioning Engine
 * Git-like version control for skills and content.
 * Hashes curriculum states for immutable version IDs.
 */

import type { SkillGraphData } from '../phase1/skillGraph';

export interface CurriculumVersion {
  hash: string;
  content: CurriculumContent;
  createdAt: string;
  parentHash?: string;
  metadata: VersionMetadata;
}

export interface CurriculumContent {
  skillGraph: SkillGraphData;
  templates: Record<string, unknown>;
  policies: CurriculumPolicies;
}

export interface CurriculumPolicies {
  minMasteryForAdvancement: number;
  maxRetakesPerSkill: number;
  representationRotation: boolean;
  adaptiveDifficulty: boolean;
}

export interface VersionMetadata {
  author?: string;
  message?: string;
  tags: string[];
  gedAlignment: string;
}

export interface VersionHistory {
  versions: CurriculumVersion[];
  currentHash: string;
}

const STORAGE_KEY = 'academy_curriculum_versions';

function simpleHash(obj: unknown): string {
  const str = JSON.stringify(obj, Object.keys(obj as object).sort());
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

export class CurriculumVersioning {
  private history: VersionHistory;

  constructor() {
    this.history = this.load();
  }

  private load(): VersionHistory {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load curriculum versions:', e);
    }
    return { versions: [], currentHash: '' };
  }

  private save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.history));
    } catch (e) {
      console.warn('Failed to save curriculum versions:', e);
    }
  }

  createVersion(content: CurriculumContent, metadata: Partial<VersionMetadata> = {}): CurriculumVersion {
    const hash = simpleHash(content);
    
    const existingVersion = this.history.versions.find(v => v.hash === hash);
    if (existingVersion) {
      return existingVersion;
    }
    
    const version: CurriculumVersion = {
      hash,
      content,
      createdAt: new Date().toISOString(),
      parentHash: this.history.currentHash || undefined,
      metadata: {
        author: metadata.author || 'system',
        message: metadata.message || 'Curriculum update',
        tags: metadata.tags || [],
        gedAlignment: metadata.gedAlignment || 'GED 2024'
      }
    };
    
    this.history.versions.push(version);
    this.history.currentHash = hash;
    this.save();
    
    return version;
  }

  getCurrentVersion(): CurriculumVersion | null {
    return this.history.versions.find(v => v.hash === this.history.currentHash) || null;
  }

  getVersion(hash: string): CurriculumVersion | null {
    return this.history.versions.find(v => v.hash === hash) || null;
  }

  getAllVersions(): CurriculumVersion[] {
    return [...this.history.versions];
  }

  getVersionHistory(hash?: string): CurriculumVersion[] {
    const startHash = hash || this.history.currentHash;
    const history: CurriculumVersion[] = [];
    
    let currentHash: string | undefined = startHash;
    while (currentHash) {
      const version = this.getVersion(currentHash);
      if (version) {
        history.push(version);
        currentHash = version.parentHash;
      } else {
        break;
      }
    }
    
    return history;
  }

  fork(hash: string, newContent: CurriculumContent, metadata: Partial<VersionMetadata> = {}): CurriculumVersion {
    const parentVersion = this.getVersion(hash);
    if (!parentVersion) {
      throw new Error(`Cannot fork: version ${hash} not found`);
    }
    
    const newHash = simpleHash(newContent);
    const version: CurriculumVersion = {
      hash: newHash,
      content: newContent,
      createdAt: new Date().toISOString(),
      parentHash: hash,
      metadata: {
        author: metadata.author || 'system',
        message: metadata.message || `Forked from ${hash}`,
        tags: [...(metadata.tags || []), 'fork'],
        gedAlignment: metadata.gedAlignment || parentVersion.metadata.gedAlignment
      }
    };
    
    this.history.versions.push(version);
    this.save();
    
    return version;
  }

  compare(hash1: string, hash2: string): {
    added: string[];
    removed: string[];
    modified: string[];
  } {
    const v1 = this.getVersion(hash1);
    const v2 = this.getVersion(hash2);
    
    if (!v1 || !v2) {
      return { added: [], removed: [], modified: [] };
    }
    
    const skills1 = new Set(v1.content.skillGraph.nodes.map(n => n.id));
    const skills2 = new Set(v2.content.skillGraph.nodes.map(n => n.id));
    
    const added = Array.from(skills2).filter(id => !skills1.has(id));
    const removed = Array.from(skills1).filter(id => !skills2.has(id));
    
    const modified: string[] = [];
    for (const node2 of v2.content.skillGraph.nodes) {
      const node1 = v1.content.skillGraph.nodes.find(n => n.id === node2.id);
      if (node1 && JSON.stringify(node1) !== JSON.stringify(node2)) {
        modified.push(node2.id);
      }
    }
    
    return { added, removed, modified };
  }

  exportVersion(hash: string): string {
    const version = this.getVersion(hash);
    if (!version) {
      throw new Error(`Version ${hash} not found`);
    }
    
    return JSON.stringify({
      hash: version.hash,
      content: version.content,
      metadata: version.metadata,
      exportedAt: new Date().toISOString()
    }, null, 2);
  }
}

export const curriculumVersioning = new CurriculumVersioning();
