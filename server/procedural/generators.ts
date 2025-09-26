// Procedural Generation Engine for NPCs, Events, and Locations
// This engine creates dynamic content instead of hardcoded lists

interface GenerationConfig {
  seed: number;
  worldType: string;
  npcCount: number;
  locationCount: number;
  factionCount: number;
}

interface GenerationTemplate {
  namePatterns: string[];
  races: string[];
  classes: string[];
  personalityTraits: string[];
  locationTypes: string[];
  eventTypes: string[];
  dialoguePatterns: string[];
  // Add configurable defaults
  defaultNPCCounts: {
    student: number;
    faculty: number;
    staff: number;
  };
  defaultLocationCount: number;
  factions: string[];
  eventFrequency: number; // Events per game hour
}

// Seeded random number generator for consistent results
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  choice<T>(array: T[]): T {
    return array[this.nextInt(0, array.length - 1)];
  }

  shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}

// Name generation using patterns and syllables
class NameGenerator {
  private static readonly SYLLABLES = {
    first: ['al', 'an', 'ar', 'as', 'at', 'ea', 'ed', 'en', 'er', 'es', 'ha', 'he', 'hi', 'in', 'is', 'it', 'le', 'me', 'nd', 'ne', 'ng', 'nt', 'on', 'or', 're', 'se', 'st', 'te', 'th', 'ti', 'to', 've', 'wa'],
    middle: ['tar', 'las', 'rin', 'del', 'mor', 'kan', 'eth', 'ara', 'ion', 'ith', 'ame', 'ell', 'ess', 'ard', 'orn', 'ine', 'ust', 'ent', 'ant', 'ose'],
    last: ['ius', 'ian', 'iel', 'eon', 'lyn', 'wen', 'ara', 'ith', 'orn', 'ess', 'ard', 'ine', 'ent', 'ant', 'ose', 'ell', 'ame', 'eth', 'del']
  };

  private static readonly PREFIXES = ['Al', 'An', 'Ar', 'As', 'El', 'Em', 'En', 'Ev', 'Ka', 'Ki', 'La', 'Le', 'Ma', 'Mi', 'Na', 'Ni', 'Ra', 'Re', 'Sa', 'Si', 'Ta', 'Te', 'Va', 'Ve', 'Za', 'Ze'];
  private static readonly SUFFIXES = ['a', 'ah', 'ai', 'an', 'ar', 'as', 'e', 'eh', 'el', 'en', 'er', 'es', 'i', 'ia', 'iel', 'in', 'ir', 'is', 'o', 'on', 'or', 'os', 'u', 'ul', 'un', 'ur', 'us'];

  static generateName(rng: SeededRandom, type: 'first' | 'last' = 'first'): string {
    if (type === 'first') {
      const prefix = rng.choice(this.PREFIXES);
      const middle = rng.choice(this.SYLLABLES.middle);
      const suffix = rng.choice(this.SUFFIXES);
      return prefix + middle + suffix;
    } else {
      const first = rng.choice(this.SYLLABLES.first);
      const middle = rng.choice(this.SYLLABLES.middle);
      const last = rng.choice(this.SYLLABLES.last);
      return (first + middle + last).charAt(0).toUpperCase() + (first + middle + last).slice(1);
    }
  }

  static generateFullName(rng: SeededRandom): string {
    return `${this.generateName(rng, 'first')} ${this.generateName(rng, 'last')}`;
  }
}

// Template-based content generation
export class ProceduralGenerator {
  private rng: SeededRandom;
  private config: GenerationConfig;
  private template: GenerationTemplate;

  constructor(config: GenerationConfig, template: GenerationTemplate) {
    this.rng = new SeededRandom(config.seed);
    this.config = config;
    this.template = template;
  }

  // Generate a single NPC with procedural traits
  generateNPC(id: string, roleType: 'student' | 'faculty' | 'staff'): any {
    const firstName = NameGenerator.generateName(this.rng, 'first');
    const lastName = NameGenerator.generateName(this.rng, 'last');
    const fullName = `${firstName} ${lastName}`;
    
    const race = this.rng.choice(this.template.races);
    const npcClass = this.rng.choice(this.template.classes);
    const personality = this.generatePersonality();
    const backstory = this.generateBackstory(fullName, roleType);
    const dialogue = this.generateDialogue(fullName, roleType);
    const stats = this.generateStats();
    
    return {
      id: id, // Use the provided unique ID instead of generating from name
      name: fullName,
      title: roleType === 'student' ? 'Student' : (roleType === 'faculty' ? 'Professor' : 'Staff'),
      race: race,
      class: npcClass,
      faction: this.generateFaction(),
      personality: personality,
      backstory: backstory,
      currentLocation: this.generateStartingLocation(roleType),
      schedule: this.generateSchedule(roleType),
      relationships: {},
      dialogue: dialogue,
      stats: stats,
      isTeacher: roleType === 'faculty'
    };
  }

  // Generate multiple NPCs of a given type with guaranteed unique IDs
  generateNPCs(count: number, roleType: 'student' | 'faculty' | 'staff'): any[] {
    const npcs = [];
    for (let i = 0; i < count; i++) {
      // Use seed-based unique ID generation to prevent overwrites
      const uniqueId = `${this.config.seed}_${roleType}_${i}_${this.rng.nextInt(1000, 9999)}`;
      npcs.push(this.generateNPC(uniqueId, roleType));
    }
    return npcs;
  }

  // Generate a procedural location
  generateLocation(id: string): any {
    const locationType = this.rng.choice(this.template.locationTypes);
    const name = this.generateLocationName(locationType);
    const description = this.generateLocationDescription(name, locationType);
    const exits = this.generateLocationExits();
    const interactables = this.generateLocationInteractables(locationType);
    
    return {
      id: id,
      name: name,
      description: description,
      type: locationType,
      exits: exits,
      npcs: [], // NPCs will be assigned by location during world generation
      items: [],
      interactables: interactables,
      requirements: this.generateLocationRequirements()
    };
  }

  // Generate a procedural event
  generateEvent(id: string): any {
    const eventType = this.rng.choice(this.template.eventTypes);
    const name = this.generateEventName(eventType);
    const description = this.generateEventDescription(eventType);
    
    return {
      id: id,
      name: name,
      type: eventType,
      description: description,
      trigger: this.generateEventTrigger(),
      effects: this.generateEventEffects(),
      duration: this.rng.nextInt(1, 10),
      cooldown: this.rng.nextInt(5, 30)
    };
  }

  private generatePersonality(): any {
    const traits = this.rng.shuffle(this.template.personalityTraits).slice(0, 4);
    const personality: any = {};
    traits.forEach(trait => {
      personality[trait] = this.rng.nextInt(3, 10);
    });
    return personality;
  }

  private generateBackstory(name: string, roleType: string): string {
    const templates = [
      `${name} arrived here seeking knowledge and understanding of their abilities.`,
      `${name} has always been drawn to places of learning and mystery.`,
      `${name} comes from a long line of scholars and practitioners.`,
      `${name} discovered their calling through unexpected circumstances.`,
      `${name} seeks to unlock the secrets that lie hidden in this place.`
    ];
    return this.rng.choice(templates);
  }

  private generateDialogue(name: string, roleType: string): any {
    const greetingTemplates = [
      `Hello! I'm ${name.split(' ')[0]}. Nice to meet you!`,
      `Greetings. You can call me ${name.split(' ')[0]}.`,
      `Oh, hello there! I'm ${name.split(' ')[0]}. How are you?`,
      `Welcome! ${name.split(' ')[0]} is the name.`
    ];

    const topicTemplates = {
      introduction: `I'm still getting used to this place myself.`,
      studies: `There's always something new to learn here.`,
      mysteries: `This place holds many secrets, doesn't it?`,
      community: `The people here are quite interesting.`
    };

    return {
      greeting: this.rng.choice(greetingTemplates),
      topics: topicTemplates
    };
  }

  private generateStats(): any {
    return {
      knowledge: this.rng.nextInt(3, 8),
      social: this.rng.nextInt(3, 8),
      athletics: this.rng.nextInt(3, 8),
      creativity: this.rng.nextInt(3, 8),
      mysticism: this.rng.nextInt(3, 8)
    };
  }

  private generateFaction(): string | null {
    // Use template-specific factions instead of hardcoded list
    const factions = this.template.factions;
    return this.rng.nextInt(1, 10) > 2 ? this.rng.choice(factions) : null;
  }

  private generateStartingLocation(roleType: 'student' | 'faculty' | 'staff'): string {
    const locations: Record<string, string[]> = {
      student: ['common_room', 'study_hall', 'library', 'dormitory'],
      faculty: ['faculty_lounge', 'office', 'classroom', 'library'],
      staff: ['main_lobby', 'administrative_office', 'maintenance_room']
    };
    return this.rng.choice(locations[roleType] || ['common_room']);
  }

  private generateSchedule(roleType: string): any {
    if (roleType === 'student') {
      return {
        "8:00-12:00": this.rng.choice(['classroom', 'study_hall', 'library']),
        "12:00-13:00": "cafeteria",
        "13:00-17:00": this.rng.choice(['classroom', 'laboratory', 'workshop']),
        "17:00-22:00": this.rng.choice(['common_room', 'dormitory', 'recreation']),
        "22:00-8:00": "dormitory"
      };
    } else {
      return {
        "9:00-17:00": this.rng.choice(['office', 'classroom', 'meeting_room']),
        "17:00-9:00": "off_duty"
      };
    }
  }

  private generateLocationName(type: string): string {
    const prefixes = ['Ancient', 'Forgotten', 'Hidden', 'Sacred', 'Mystic', 'Grand', 'Silent', 'Echoing'];
    const suffixes: Record<string, string[]> = {
      classroom: ['Hall', 'Chamber', 'Room', 'Sanctum'],
      library: ['Archive', 'Repository', 'Collection', 'Vault'],
      laboratory: ['Workshop', 'Laboratory', 'Atelier', 'Studio'],
      outdoor: ['Garden', 'Courtyard', 'Grove', 'Plaza']
    };
    
    const prefix = this.rng.choice(prefixes);
    const suffix = this.rng.choice(suffixes[type] || ['Room', 'Area', 'Space']);
    return `${prefix} ${suffix}`;
  }

  private generateLocationDescription(name: string, type: string): string {
    const templates: Record<string, string> = {
      classroom: `${name} is a spacious learning environment filled with desks and teaching materials. The atmosphere encourages focus and discovery.`,
      library: `${name} contains countless volumes of knowledge, their pages whispering secrets to those who know how to listen.`,
      laboratory: `${name} is equipped with various apparatus and tools for experimentation and research. The air hums with potential.`,
      outdoor: `${name} offers a peaceful respite from indoor activities, where natural elements provide their own form of wisdom.`
    };
    
    return templates[type] || `${name} is a unique space with its own character and purpose.`;
  }

  private generateLocationExits(): any {
    const exitCount = this.rng.nextInt(1, 4);
    const directions = ['north', 'south', 'east', 'west', 'up', 'down'];
    const exits: any = {};
    
    for (let i = 0; i < exitCount; i++) {
      const direction = directions[i];
      exits[direction] = `generated_location_${this.rng.nextInt(1, 100)}`;
    }
    
    return exits;
  }

  private generateLocationInteractables(type: string): string[] {
    const interactables: Record<string, string[]> = {
      classroom: ['desk', 'chalkboard', 'books', 'supplies'],
      library: ['bookshelves', 'reading_table', 'scroll_case', 'catalog'],
      laboratory: ['equipment', 'specimens', 'instruments', 'notes'],
      outdoor: ['plants', 'fountain', 'bench', 'pathway']
    };
    
    return this.rng.shuffle(interactables[type] || ['furniture', 'decorations']).slice(0, this.rng.nextInt(2, 4));
  }

  private generateLocationRequirements(): any {
    if (this.rng.nextInt(1, 10) > 7) {
      const requirementTypes = ['permission_level', 'special_key', 'faction_membership'];
      const reqType = this.rng.choice(requirementTypes);
      
      switch (reqType) {
        case 'permission_level':
          return { permission_level: this.rng.choice(['faculty', 'staff', 'advanced_student']) };
        case 'special_key':
          return { special_key: `key_${this.rng.nextInt(1, 10)}` };
        case 'faction_membership':
          return { faction_required: this.rng.choice(['Seekers', 'Guardians', 'Innovators', 'Archivists']) };
        default:
          return {};
      }
    }
    return {};
  }

  private generateEventTrigger(): any {
    const triggers = [
      { type: 'time_based', condition: `hour_${this.rng.nextInt(8, 20)}` },
      { type: 'location_based', condition: this.rng.choice(['library', 'classroom', 'courtyard']) },
      { type: 'interaction_based', condition: 'talk_to_npc' },
      { type: 'random', condition: `chance_${this.rng.nextInt(10, 50)}` }
    ];
    
    return this.rng.choice(triggers);
  }

  private generateEventEffects(): any {
    return {
      reputation_change: this.rng.nextInt(-2, 3),
      stat_change: { [this.rng.choice(['knowledge', 'social', 'mysticism'])]: this.rng.nextInt(-1, 2) },
      unlock_location: this.rng.nextInt(1, 10) > 8,
      receive_item: this.rng.nextInt(1, 10) > 7
    };
  }

  private generateEventName(type: string): string {
    const prefixes = ['Mysterious', 'Unexpected', 'Ancient', 'Hidden', 'Forgotten'];
    const suffixes: Record<string, string[]> = {
      discovery: ['Discovery', 'Revelation', 'Finding', 'Uncovering'],
      social: ['Gathering', 'Meeting', 'Encounter', 'Exchange'],
      academic: ['Lesson', 'Study', 'Research', 'Investigation'],
      mystical: ['Manifestation', 'Vision', 'Occurrence', 'Phenomenon']
    };
    
    const prefix = this.rng.choice(prefixes);
    const suffix = this.rng.choice(suffixes[type] || ['Event', 'Happening']);
    return `${prefix} ${suffix}`;
  }

  private generateEventDescription(type: string): string {
    const templates: Record<string, string> = {
      discovery: "Something previously hidden has been revealed, changing the understanding of this place.",
      social: "An opportunity arises to connect with others and share knowledge or experiences.",
      academic: "A chance to learn something new or deepen existing understanding through study.",
      mystical: "The boundaries between the ordinary and extraordinary seem to blur momentarily."
    };
    
    return templates[type] || "Something interesting happens that affects the environment.";
  }
}

// World template definitions for different types of procedural worlds
export const WORLD_TEMPLATES = {
  academy: {
    namePatterns: ['scholarly', 'mystical', 'ancient'],
    races: ['Human', 'Elf', 'Spirit', 'Mer-Person', 'Orc', 'Furret', 'Cartoon'],
    classes: ['Scholar', 'Mystic', 'Artisan', 'Guardian', 'Seeker', 'Innovator'],
    personalityTraits: ['curious', 'studious', 'friendly', 'mysterious', 'creative', 'analytical', 'intuitive', 'protective'],
    locationTypes: ['classroom', 'library', 'laboratory', 'outdoor', 'dormitory', 'cafeteria'],
    eventTypes: ['discovery', 'social', 'academic', 'mystical', 'examination', 'ceremony'],
    dialoguePatterns: ['scholarly', 'friendly', 'mysterious', 'helpful'],
    defaultNPCCounts: { student: 80, faculty: 12, staff: 8 },
    defaultLocationCount: 25,
    factions: ['Archivists', 'Seekers', 'Guardians', 'Innovators'],
    eventFrequency: 0.3
  },
  
  village: {
    namePatterns: ['rustic', 'pastoral', 'traditional'],
    races: ['Human', 'Halfling', 'Dwarf', 'Elf', 'Gnome'],
    classes: ['Farmer', 'Merchant', 'Craftsperson', 'Guard', 'Healer', 'Mayor', 'Innkeeper'],
    personalityTraits: ['hardworking', 'honest', 'traditional', 'gossip', 'protective', 'generous', 'stubborn', 'wise'],
    locationTypes: ['shop', 'tavern', 'workshop', 'farm', 'mill', 'blacksmith', 'temple'],
    eventTypes: ['market', 'festival', 'problem', 'visitor', 'harvest', 'dispute', 'celebration'],
    dialoguePatterns: ['folksy', 'direct', 'gossip', 'trade'],
    defaultNPCCounts: { student: 0, faculty: 0, staff: 40 },
    defaultLocationCount: 15,
    factions: ['Merchants Guild', 'Farmers Alliance', 'Town Guard', 'Clergy'],
    eventFrequency: 0.2
  },
  
  dungeon: {
    namePatterns: ['dark', 'ancient', 'forgotten', 'cursed', 'lost'],
    races: ['Orc', 'Goblin', 'Undead', 'Construct', 'Beast', 'Shadow', 'Demon'],
    classes: ['Guardian', 'Prisoner', 'Explorer', 'Monster', 'Warden', 'Cultist', 'Treasure Hunter'],
    personalityTraits: ['hostile', 'territorial', 'cunning', 'desperate', 'ancient', 'mad', 'vengeful', 'trapped'],
    locationTypes: ['chamber', 'corridor', 'prison', 'treasure_room', 'trap_room', 'altar', 'cavern'],
    eventTypes: ['trap', 'encounter', 'treasure', 'mystery', 'ambush', 'ritual', 'collapse'],
    dialoguePatterns: ['threatening', 'cryptic', 'desperate', 'ancient'],
    defaultNPCCounts: { student: 0, faculty: 0, staff: 25 },
    defaultLocationCount: 20,
    factions: ['Dungeon Guardians', 'Lost Explorers', 'Ancient Cult', 'Treasure Seekers'],
    eventFrequency: 0.5
  },
  
  // New world template: Frontier Town
  frontier: {
    namePatterns: ['wild', 'rough', 'frontier', 'lawless'],
    races: ['Human', 'Orc', 'Dwarf', 'Halfling', 'Elf'],
    classes: ['Sheriff', 'Outlaw', 'Prospector', 'Saloon Keeper', 'Gunslinger', 'Merchant', 'Doctor'],
    personalityTraits: ['tough', 'independent', 'lawless', 'ambitious', 'survival-minded', 'opportunistic'],
    locationTypes: ['saloon', 'jail', 'general_store', 'mine', 'stable', 'bank'],
    eventTypes: ['showdown', 'gold_rush', 'bandit_raid', 'law_enforcement', 'trade_deal'],
    dialoguePatterns: ['gruff', 'direct', 'suspicious', 'opportunistic'],
    defaultNPCCounts: { student: 0, faculty: 0, staff: 30 },
    defaultLocationCount: 12,
    factions: ['Law Enforcement', 'Outlaws', 'Prospectors', 'Business Owners'],
    eventFrequency: 0.4
  }
};