/**
 * Phase 4: Lore / Narrative Skin
 * Adds meaning, identity, and motivation without altering mechanics.
 * Zero logic contamination - wraps prompts and logs narrative events only.
 */

export type LoreMode = 'neutral' | 'real_world' | 'academy_lore';

export interface LoreFragment {
  key: string;
  text: string;
  context?: string;
  relatedSkills?: string[];
}

export interface CanonEvent {
  id: string;
  timestamp: string;
  studentId: string;
  eventType: CanonEventType;
  detail: string;
  skillNode?: string;
  significance: 'minor' | 'notable' | 'major' | 'legendary';
}

export type CanonEventType = 
  | 'first_attempt'
  | 'mastery_achieved'
  | 'breakthrough'
  | 'persistence'
  | 'helping_others'
  | 'domain_completion'
  | 'ged_ready'
  | 'mentor_status';

const LORE_PREFIXES: Record<LoreMode, string> = {
  neutral: '',
  real_world: '[Real-World Context] ',
  academy_lore: '[Academy Archive] '
};

const LORE_WRAPPERS: Record<LoreMode, (prompt: string) => string> = {
  neutral: (prompt) => prompt,
  real_world: (prompt) => `In a practical scenario: ${prompt.toLowerCase()}`,
  academy_lore: (prompt) => 
    `As part of your training to preserve and rebuild knowledge: ${prompt.toLowerCase()}`
};

const STORAGE_KEY_EVENTS = 'academy_canon_events';
const STORAGE_KEY_MODE = 'academy_lore_mode';
const STORAGE_KEY_REGISTRY = 'academy_lore_registry';

export class PromptSkinner {
  private mode: LoreMode;

  constructor(mode: LoreMode = 'neutral') {
    this.mode = mode;
  }

  skin(prompt: string, skillId?: string): string {
    const wrapper = LORE_WRAPPERS[this.mode];
    return wrapper(prompt);
  }

  getPrefix(): string {
    return LORE_PREFIXES[this.mode];
  }

  setMode(mode: LoreMode): void {
    this.mode = mode;
  }

  getMode(): LoreMode {
    return this.mode;
  }

  wrapWithContext(prompt: string, context: string): string {
    if (this.mode === 'academy_lore') {
      return `[Context: ${context}]\n${this.skin(prompt)}`;
    }
    return this.skin(prompt);
  }
}

export class LoreRegistry {
  private fragments: Map<string, LoreFragment[]> = new Map();

  constructor() {
    this.load();
    this.initializeDefaultLore();
  }

  private load(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_REGISTRY);
      if (stored) {
        const data = JSON.parse(stored);
        this.fragments = new Map(Object.entries(data));
      }
    } catch (e) {
      console.warn('Failed to load lore registry:', e);
    }
  }

  private save(): void {
    try {
      const data: Record<string, LoreFragment[]> = {};
      this.fragments.forEach((frags, key) => {
        data[key] = frags;
      });
      localStorage.setItem(STORAGE_KEY_REGISTRY, JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save lore registry:', e);
    }
  }

  private initializeDefaultLore(): void {
    if (this.fragments.size > 0) return;

    const defaultLore: LoreFragment[] = [
      {
        key: 'math_intro',
        text: 'The mathematical arts were among the first knowledge systems preserved in the Academy\'s founding.',
        context: 'Mathematical Reasoning',
        relatedSkills: ['MATH.ARITH.001']
      },
      {
        key: 'language_intro',
        text: 'Communication and comprehension form the bridge between minds, essential for any reconstruction effort.',
        context: 'Language Arts',
        relatedSkills: ['LANG.READ.001']
      },
      {
        key: 'science_intro',
        text: 'The scientific method represents humanity\'s most reliable tool for understanding the natural world.',
        context: 'Science',
        relatedSkills: ['SCI.SCI.001']
      },
      {
        key: 'social_intro',
        text: 'Understanding our societies and their histories prevents us from repeating past mistakes.',
        context: 'Social Studies',
        relatedSkills: ['SOC.USHIST.001']
      },
      {
        key: 'mastery_achieved',
        text: 'The student has demonstrated reliable competence in {skill}, a significant milestone on the path to reconstruction.',
        context: 'Achievement'
      },
      {
        key: 'ged_ready',
        text: 'Having proven their capabilities across the foundational domains, the student stands ready to receive formal recognition.',
        context: 'Culmination'
      }
    ];

    for (const fragment of defaultLore) {
      this.register(fragment.key, fragment);
    }
    this.save();
  }

  register(key: string, fragment: LoreFragment): void {
    const existing = this.fragments.get(key) || [];
    existing.push(fragment);
    this.fragments.set(key, existing);
    this.save();
  }

  get(key: string): LoreFragment[] {
    return this.fragments.get(key) || [];
  }

  getForSkill(skillId: string): LoreFragment[] {
    const results: LoreFragment[] = [];
    this.fragments.forEach(frags => {
      for (const frag of frags) {
        if (frag.relatedSkills?.includes(skillId)) {
          results.push(frag);
        }
      }
    });
    return results;
  }

  getAllKeys(): string[] {
    return Array.from(this.fragments.keys());
  }
}

export class CanonEventLogger {
  private events: CanonEvent[] = [];
  private studentId: string;

  constructor(studentId: string) {
    this.studentId = studentId;
    this.load();
  }

  private load(): void {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY_EVENTS}_${this.studentId}`);
      if (stored) {
        this.events = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load canon events:', e);
    }
  }

  private save(): void {
    try {
      localStorage.setItem(`${STORAGE_KEY_EVENTS}_${this.studentId}`, JSON.stringify(this.events));
    } catch (e) {
      console.warn('Failed to save canon events:', e);
    }
  }

  private generateId(): string {
    return `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  log(
    eventType: CanonEventType,
    detail: string,
    skillNode?: string,
    significance: CanonEvent['significance'] = 'minor'
  ): CanonEvent {
    const event: CanonEvent = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      studentId: this.studentId,
      eventType,
      detail,
      skillNode,
      significance
    };
    
    this.events.push(event);
    this.save();
    
    return event;
  }

  logMasteryAchieved(skillNode: string, skillName: string): CanonEvent {
    return this.log(
      'mastery_achieved',
      `Achieved stable mastery of ${skillName}`,
      skillNode,
      'notable'
    );
  }

  logBreakthrough(skillNode: string, description: string): CanonEvent {
    return this.log('breakthrough', description, skillNode, 'major');
  }

  logPersistence(skillNode: string, attempts: number): CanonEvent {
    return this.log(
      'persistence',
      `Demonstrated persistence through ${attempts} attempts`,
      skillNode,
      'notable'
    );
  }

  logDomainCompletion(domain: string): CanonEvent {
    return this.log(
      'domain_completion',
      `Completed all skills in ${domain}`,
      undefined,
      'major'
    );
  }

  logGEDReady(): CanonEvent {
    return this.log(
      'ged_ready',
      'Ready for GED certification',
      undefined,
      'legendary'
    );
  }

  getEvents(): CanonEvent[] {
    return [...this.events];
  }

  getEventsByType(eventType: CanonEventType): CanonEvent[] {
    return this.events.filter(e => e.eventType === eventType);
  }

  getSignificantEvents(): CanonEvent[] {
    return this.events.filter(e => 
      e.significance === 'notable' || 
      e.significance === 'major' || 
      e.significance === 'legendary'
    );
  }

  getTimeline(): CanonEvent[] {
    return [...this.events].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }
}

export class LoreModeManager {
  private mode: LoreMode;

  constructor() {
    this.mode = this.load();
  }

  private load(): LoreMode {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_MODE);
      if (stored && ['neutral', 'real_world', 'academy_lore'].includes(stored)) {
        return stored as LoreMode;
      }
    } catch (e) {
      console.warn('Failed to load lore mode:', e);
    }
    return 'neutral';
  }

  private save(): void {
    try {
      localStorage.setItem(STORAGE_KEY_MODE, this.mode);
    } catch (e) {
      console.warn('Failed to save lore mode:', e);
    }
  }

  getMode(): LoreMode {
    return this.mode;
  }

  setMode(mode: LoreMode): void {
    this.mode = mode;
    this.save();
  }

  toggleMode(): LoreMode {
    const modes: LoreMode[] = ['neutral', 'real_world', 'academy_lore'];
    const currentIndex = modes.indexOf(this.mode);
    this.mode = modes[(currentIndex + 1) % modes.length];
    this.save();
    return this.mode;
  }

  getModeLabel(): string {
    const labels: Record<LoreMode, string> = {
      neutral: 'Standard',
      real_world: 'Real-World',
      academy_lore: 'Academy Lore'
    };
    return labels[this.mode];
  }
}

export const loreRegistry = new LoreRegistry();
export const loreModeManager = new LoreModeManager();
