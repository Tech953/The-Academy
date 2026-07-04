/**
 * Options: Freeze & Package v1.0
 * Locks stable Academy releases for deployment or archival.
 * Guarantees reproducibility and prevents drift.
 */

export interface FrozenRelease {
  version: string;
  curriculumHash: string;
  includedOptions: string[];
  frozenAt: string;
  status: 'immutable' | 'deprecated';
  metadata: ReleaseMetadata;
  checksums: ReleaseChecksums;
}

export interface ReleaseMetadata {
  author?: string;
  releaseNotes?: string;
  gedAlignment: string;
  targetAudience: string;
  supportedLanguages: string[];
}

export interface ReleaseChecksums {
  skillGraph: string;
  templates: string;
  policies: string;
  overall: string;
}

export interface ReleaseManifest {
  releases: FrozenRelease[];
  currentVersion: string;
  lastUpdated: string;
}

const STORAGE_KEY = 'academy_releases';

function simpleChecksum(data: unknown): string {
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

export class ReleaseFreezer {
  private manifest: ReleaseManifest;

  constructor() {
    this.manifest = this.load();
  }

  private load(): ReleaseManifest {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load release manifest:', e);
    }
    return {
      releases: [],
      currentVersion: '',
      lastUpdated: new Date().toISOString()
    };
  }

  private save(): void {
    try {
      this.manifest.lastUpdated = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.manifest));
    } catch (e) {
      console.warn('Failed to save release manifest:', e);
    }
  }

  freeze(params: {
    version: string;
    curriculumHash: string;
    skillGraphData: unknown;
    templates: unknown;
    policies: unknown;
    includedOptions?: string[];
    metadata?: Partial<ReleaseMetadata>;
  }): FrozenRelease {
    const existingVersion = this.manifest.releases.find(
      r => r.version === params.version
    );
    if (existingVersion) {
      throw new Error(`Version ${params.version} already exists`);
    }
    
    const checksums: ReleaseChecksums = {
      skillGraph: simpleChecksum(params.skillGraphData),
      templates: simpleChecksum(params.templates),
      policies: simpleChecksum(params.policies),
      overall: simpleChecksum({
        skillGraph: params.skillGraphData,
        templates: params.templates,
        policies: params.policies
      })
    };
    
    const release: FrozenRelease = {
      version: params.version,
      curriculumHash: params.curriculumHash,
      includedOptions: params.includedOptions || [
        'skill_graph',
        'homework_engine',
        'mastery_signals',
        'exams',
        'journals',
        'ethics_lockfile'
      ],
      frozenAt: new Date().toISOString(),
      status: 'immutable',
      metadata: {
        author: params.metadata?.author || 'The Academy',
        releaseNotes: params.metadata?.releaseNotes || '',
        gedAlignment: params.metadata?.gedAlignment || 'GED 2024',
        targetAudience: params.metadata?.targetAudience || 'Adult learners',
        supportedLanguages: params.metadata?.supportedLanguages || ['en', 'es', 'fr', 'de', 'zh']
      },
      checksums
    };
    
    this.manifest.releases.push(release);
    this.manifest.currentVersion = params.version;
    this.save();
    
    return release;
  }

  getCurrentVersion(): FrozenRelease | null {
    return this.manifest.releases.find(
      r => r.version === this.manifest.currentVersion
    ) || null;
  }

  getVersion(version: string): FrozenRelease | null {
    return this.manifest.releases.find(r => r.version === version) || null;
  }

  getAllVersions(): FrozenRelease[] {
    return [...this.manifest.releases];
  }

  deprecateVersion(version: string): boolean {
    const release = this.manifest.releases.find(r => r.version === version);
    if (release) {
      release.status = 'deprecated';
      this.save();
      return true;
    }
    return false;
  }

  verifyIntegrity(version: string, currentData: {
    skillGraph: unknown;
    templates: unknown;
    policies: unknown;
  }): {
    valid: boolean;
    mismatches: string[];
  } {
    const release = this.getVersion(version);
    if (!release) {
      return { valid: false, mismatches: ['version_not_found'] };
    }
    
    const currentChecksums: ReleaseChecksums = {
      skillGraph: simpleChecksum(currentData.skillGraph),
      templates: simpleChecksum(currentData.templates),
      policies: simpleChecksum(currentData.policies),
      overall: simpleChecksum(currentData)
    };
    
    const mismatches: string[] = [];
    
    if (currentChecksums.skillGraph !== release.checksums.skillGraph) {
      mismatches.push('skill_graph');
    }
    if (currentChecksums.templates !== release.checksums.templates) {
      mismatches.push('templates');
    }
    if (currentChecksums.policies !== release.checksums.policies) {
      mismatches.push('policies');
    }
    
    return {
      valid: mismatches.length === 0,
      mismatches
    };
  }

  exportRelease(version: string): string {
    const release = this.getVersion(version);
    if (!release) {
      throw new Error(`Version ${version} not found`);
    }
    
    return JSON.stringify({
      release,
      exportedAt: new Date().toISOString(),
      format: 'academy_release_v1'
    }, null, 2);
  }

  getVersionHistory(): Array<{
    version: string;
    frozenAt: string;
    status: string;
  }> {
    return this.manifest.releases.map(r => ({
      version: r.version,
      frozenAt: r.frozenAt,
      status: r.status
    }));
  }
}

export const releaseFreezer = new ReleaseFreezer();
