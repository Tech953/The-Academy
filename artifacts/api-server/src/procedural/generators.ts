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

// Structured Campus Layout Definition
interface CampusBuilding {
  id: string;
  name: string;
  type: 'dormitory' | 'academic' | 'central_plaza' | 'admin' | 'dining' | 'recreation' | 'forest';
  rooms: number; // Number of rooms to generate inside
  connections: string[]; // Building IDs this connects to
  position: { x: number; y: number }; // Position on campus map
}

interface CampusLayout {
  buildings: CampusBuilding[];
  paths: { from: string; to: string; direction: string }[];
}

// Structured Campus Layout based on hand-drawn map
const ACADEMY_CAMPUS_LAYOUT: CampusLayout = {
  buildings: [
    // Central Plaza (starting point)
    { id: 'main_lobby', name: 'Central Plaza', type: 'central_plaza', rooms: 3, connections: ['north_dorm', 'south_dorm', 'east_dorm', 'west_dorm', 'main_hall', 'library'], position: { x: 50, y: 50 } },
    
    // Main Academic Buildings
    { id: 'main_hall', name: 'Main Academic Hall', type: 'academic', rooms: 8, connections: ['main_lobby', 'library', 'lab_building'], position: { x: 50, y: 30 } },
    { id: 'library', name: 'Grand Library', type: 'academic', rooms: 6, connections: ['main_lobby', 'main_hall', 'east_dorm'], position: { x: 70, y: 40 } },
    { id: 'lab_building', name: 'Research Laboratories', type: 'academic', rooms: 10, connections: ['main_hall', 'west_dorm'], position: { x: 30, y: 30 } },
    
    // Dormitory Buildings (around perimeter)
    { id: 'north_dorm', name: 'North Dormitory', type: 'dormitory', rooms: 12, connections: ['main_lobby', 'dining_hall'], position: { x: 50, y: 20 } },
    { id: 'south_dorm', name: 'South Dormitory', type: 'dormitory', rooms: 12, connections: ['main_lobby', 'recreation'], position: { x: 50, y: 80 } },
    { id: 'east_dorm', name: 'East Dormitory', type: 'dormitory', rooms: 12, connections: ['main_lobby', 'library'], position: { x: 80, y: 50 } },
    { id: 'west_dorm', name: 'West Dormitory', type: 'dormitory', rooms: 12, connections: ['main_lobby', 'lab_building'], position: { x: 20, y: 50 } },
    
    // Support Buildings
    { id: 'dining_hall', name: 'Dining Hall', type: 'dining', rooms: 4, connections: ['north_dorm', 'main_lobby'], position: { x: 40, y: 15 } },
    { id: 'recreation', name: 'Recreation Center', type: 'recreation', rooms: 6, connections: ['south_dorm', 'main_lobby'], position: { x: 60, y: 85 } },
    { id: 'admin_building', name: 'Administration Building', type: 'admin', rooms: 8, connections: ['main_lobby'], position: { x: 35, y: 65 } },
    
    // Forest Areas (surrounding campus)
    { id: 'north_forest', name: 'Northern Woods', type: 'forest', rooms: 3, connections: ['north_dorm'], position: { x: 50, y: 5 } },
    { id: 'south_forest', name: 'Southern Woods', type: 'forest', rooms: 3, connections: ['south_dorm'], position: { x: 50, y: 95 } },
    { id: 'east_forest', name: 'Eastern Woods', type: 'forest', rooms: 3, connections: ['east_dorm'], position: { x: 95, y: 50 } },
    { id: 'west_forest', name: 'Western Woods', type: 'forest', rooms: 3, connections: ['west_dorm'], position: { x: 5, y: 50 } }
  ],
  paths: [
    // Central plaza connections
    { from: 'main_lobby', to: 'north_dorm', direction: 'north' },
    { from: 'main_lobby', to: 'south_dorm', direction: 'south' },
    { from: 'main_lobby', to: 'east_dorm', direction: 'east' },
    { from: 'main_lobby', to: 'west_dorm', direction: 'west' },
    { from: 'main_lobby', to: 'main_hall', direction: 'northeast' },
    { from: 'main_lobby', to: 'library', direction: 'southeast' },
    
    // Academic building connections
    { from: 'main_hall', to: 'library', direction: 'east' },
    { from: 'main_hall', to: 'lab_building', direction: 'west' },
    
    // Dormitory to support building connections
    { from: 'north_dorm', to: 'dining_hall', direction: 'west' },
    { from: 'south_dorm', to: 'recreation', direction: 'east' },
    
    // Forest connections
    { from: 'north_dorm', to: 'north_forest', direction: 'north' },
    { from: 'south_dorm', to: 'south_forest', direction: 'south' },
    { from: 'east_dorm', to: 'east_forest', direction: 'east' },
    { from: 'west_dorm', to: 'west_forest', direction: 'west' }
  ]
};

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

  // Generate structured campus locations based on campus layout
  generateStructuredCampus(): any[] {
    const locations: any[] = [];
    
    for (const building of ACADEMY_CAMPUS_LAYOUT.buildings) {
      const buildingLocation = this.generateBuildingLocation(building);
      locations.push(buildingLocation);
      
      // Generate internal rooms for each building
      const internalRooms = this.generateInternalRooms(building);
      locations.push(...internalRooms);
    }
    
    // Set up connections between buildings based on campus layout
    this.setupCampusConnections(locations);
    
    return locations;
  }
  
  // Generate a single building as a location
  private generateBuildingLocation(building: CampusBuilding): any {
    const description = this.generateBuildingDescription(building);
    const exits = this.generateBuildingExits(building);
    const interactables = this.generateBuildingInteractables(building.type);
    
    return {
      id: building.id,
      name: building.name,
      description: description,
      type: building.type,
      exits: exits,
      npcs: [], // NPCs will be assigned later
      items: [],
      interactables: interactables,
      requirements: this.generateLocationRequirements(),
      isBuilding: true,
      internalRooms: [] // Will be populated by generateInternalRooms
    };
  }
  
  // Generate internal rooms within a building
  private generateInternalRooms(building: CampusBuilding): any[] {
    const rooms: any[] = [];
    
    for (let i = 0; i < building.rooms; i++) {
      const roomId = `${building.id}_room_${i + 1}`;
      const room = this.generateInternalRoom(roomId, building.type, i + 1);
      rooms.push(room);
    }
    
    return rooms;
  }
  
  // Generate an internal room within a building
  private generateInternalRoom(id: string, buildingType: string, roomNumber: number): any {
    const roomType = this.generateRoomType(buildingType);
    const name = this.generateRoomName(roomType, roomNumber);
    const description = this.generateRoomDescription(name, roomType, buildingType);
    const exits = this.generateRoomExits(roomNumber);
    const interactables = this.generateRoomInteractables(roomType);
    
    return {
      id: id,
      name: name,
      description: description,
      type: roomType,
      buildingType: buildingType,
      exits: exits,
      npcs: [],
      items: [],
      interactables: interactables,
      requirements: this.generateLocationRequirements(),
      isRoom: true,
      roomNumber: roomNumber
    };
  }

  // Helper methods for structured campus generation
  private generateBuildingDescription(building: CampusBuilding): string {
    const typeDescriptions: Record<string, string> = {
      central_plaza: `The heart of the academy, where paths converge and students gather. The air hums with energy and conversation.`,
      academic: `A stately academic building with tall windows and brick walls. Knowledge flows through its corridors.`,
      dormitory: `A residential building where students make their temporary homes. Laughter and study sounds echo from within.`,
      dining: `The rich aroma of food fills the air. This is where the academy community comes together to share meals.`,
      recreation: `A place for leisure and social activities. Equipment and comfortable spaces invite relaxation and play.`,
      admin: `The administrative heart of the academy, where important decisions are made and records are kept.`,
      forest: `Ancient trees stretch skyward, their branches creating a natural canopy. The forest whispers with hidden secrets.`
    };
    
    return typeDescriptions[building.type] || `${building.name} stands as an important part of the academy campus.`;
  }
  
  private generateBuildingExits(building: CampusBuilding): any {
    const exits: any = {};
    
    // Add connections to other buildings based on campus layout
    for (const path of ACADEMY_CAMPUS_LAYOUT.paths) {
      if (path.from === building.id) {
        exits[path.direction] = path.to;
      }
      // Add reverse connections
      if (path.to === building.id) {
        const reverseDirection = this.getReverseDirection(path.direction);
        exits[reverseDirection] = path.from;
      }
    }
    
    // Add internal room access
    if (building.rooms > 0) {
      exits['enter'] = `${building.id}_room_1`;
    }
    
    return exits;
  }
  
  private generateBuildingInteractables(buildingType: string): string[] {
    const interactables: Record<string, string[]> = {
      central_plaza: ['fountain', 'benches', 'notice_board', 'statue'],
      academic: ['entrance_doors', 'directory', 'bulletin_board'],
      dormitory: ['entrance', 'mailboxes', 'common_area'],
      dining: ['entrance', 'menu_board', 'seating_area'],
      recreation: ['entrance', 'activity_board', 'equipment'],
      admin: ['reception_desk', 'waiting_area', 'directories'],
      forest: ['ancient_trees', 'hidden_paths', 'wildlife']
    };
    
    return this.rng.shuffle(interactables[buildingType] || ['doors', 'windows']).slice(0, this.rng.nextInt(2, 4));
  }
  
  private setupCampusConnections(locations: any[]): void {
    // Connect internal rooms to their building and each other
    for (const location of locations) {
      if (location.isRoom && location.roomNumber) {
        const buildingId = location.id.split('_room_')[0];
        
        // Connect to building (exit)
        location.exits['out'] = buildingId;
        
        // Connect to adjacent rooms
        if (location.roomNumber > 1) {
          location.exits['previous'] = `${buildingId}_room_${location.roomNumber - 1}`;
        }
        
        // Check if next room exists
        const nextRoomId = `${buildingId}_room_${location.roomNumber + 1}`;
        if (locations.some(l => l.id === nextRoomId)) {
          location.exits['next'] = nextRoomId;
        }
      }
    }
  }
  
  private generateRoomType(buildingType: string): string {
    const roomTypes: Record<string, string[]> = {
      central_plaza: ['information_center', 'seating_area', 'event_space'],
      academic: ['classroom', 'lecture_hall', 'study_room', 'faculty_office', 'laboratory'],
      dormitory: ['student_room', 'common_room', 'study_lounge', 'bathroom', 'laundry'],
      dining: ['dining_room', 'kitchen', 'private_dining', 'storage'],
      recreation: ['game_room', 'fitness_area', 'lounge', 'workshop', 'meeting_room'],
      admin: ['office', 'reception', 'meeting_room', 'archive', 'records'],
      forest: ['clearing', 'grove', 'hidden_spot']
    };
    
    return this.rng.choice(roomTypes[buildingType] || ['room']);
  }
  
  private generateRoomName(roomType: string, roomNumber: number): string {
    const nameTemplates: Record<string, string[]> = {
      classroom: ['Classroom', 'Lecture Hall', 'Seminar Room'],
      laboratory: ['Research Lab', 'Experiment Chamber', 'Analysis Room'],
      student_room: ['Student Room', 'Dormitory Room'],
      common_room: ['Common Area', 'Social Lounge', 'Study Hall'],
      office: ['Office', 'Administrative Office', 'Faculty Office'],
      dining_room: ['Dining Hall', 'Banquet Room', 'Meal Area'],
      game_room: ['Recreation Room', 'Game Area', 'Activity Center']
    };
    
    const template = this.rng.choice(nameTemplates[roomType] || ['Room']);
    return `${template} ${roomNumber}`;
  }
  
  private generateRoomDescription(name: string, roomType: string, buildingType: string): string {
    const templates: Record<string, string> = {
      classroom: `${name} is equipped for learning with desks, a teaching area, and educational materials.`,
      laboratory: `${name} contains specialized equipment for research and experimentation.`,
      student_room: `${name} is a cozy living space for academy students with personal belongings and study materials.`,
      common_room: `${name} provides a comfortable space for students to gather, socialize, and study together.`,
      office: `${name} serves as a workspace with a desk, filing systems, and professional materials.`,
      dining_room: `${name} offers seating and dining facilities for enjoying meals together.`,
      game_room: `${name} is designed for recreation and leisure activities.`
    };
    
    return templates[roomType] || `${name} is a functional space within the ${buildingType} building.`;
  }
  
  private generateRoomExits(roomNumber: number): any {
    return {
      out: 'building_main' // Will be replaced with actual building ID by setupCampusConnections
    };
  }
  
  private generateRoomInteractables(roomType: string): string[] {
    const interactables: Record<string, string[]> = {
      classroom: ['desks', 'chalkboard', 'books', 'supplies', 'projector'],
      laboratory: ['equipment', 'specimens', 'instruments', 'computers', 'safety_gear'],
      student_room: ['bed', 'desk', 'wardrobe', 'books', 'personal_items'],
      common_room: ['couches', 'tables', 'bulletin_board', 'games', 'study_materials'],
      office: ['desk', 'filing_cabinet', 'computer', 'bookshelf', 'phone'],
      dining_room: ['tables', 'chairs', 'food_service', 'beverages'],
      game_room: ['games', 'entertainment_system', 'seating', 'equipment']
    };
    
    return this.rng.shuffle(interactables[roomType] || ['furniture', 'fixtures']).slice(0, this.rng.nextInt(3, 5));
  }
  
  private getReverseDirection(direction: string): string {
    const reverseMap: Record<string, string> = {
      north: 'south',
      south: 'north',
      east: 'west',
      west: 'east',
      northeast: 'southwest',
      southeast: 'northwest',
      northwest: 'southeast',
      southwest: 'northeast',
      up: 'down',
      down: 'up'
    };
    
    return reverseMap[direction] || direction;
  }

  // Generate a procedural location (fallback method)
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
    const studentTemplates = [
      `${name} transferred here without much explanation. Their coursework suggests they have been studying independently for some time.`,
      `${name} is the first in their family to be in a place like this. They carry that weight quietly.`,
      `${name} applied on impulse and got in. The surprise still hasn't entirely worn off. They work hard to justify the spot.`,
      `${name} had a mentor who shaped how they see learning. That person is gone now. ${name} keeps going in their memory.`,
      `${name} is known for arriving at the right answer through the wrong method. Their reasoning is unconventional — but it tends to hold.`,
      `${name} almost didn't come back after the last break. Something changed. They're here, more focused, saying less.`,
      `${name} keeps detailed notes going back years. They've never shown them to anyone but references them constantly.`,
      `${name} ran out of reasons to stay somewhere else and ended up here. It turned out to be the right move.`,
    ];
    const facultyTemplates = [
      `${name} spent years in the field before returning to education. The classroom, they decided, was where the real questions lived.`,
      `${name} once failed spectacularly before mastering their subject. That failure is, they'll admit, their best credential.`,
      `${name} published work at an early age that caused minor controversy. The field eventually caught up.`,
      `${name} turned down a more prestigious position to come here. The students at this institution, they said, are worth teaching.`,
      `${name} came to the Academy to fix something they experienced as a student — the sense that the subject had nothing to do with real life.`,
      `${name} ran a small learning center before this. The students who failed everywhere else became the ones who surprised everyone.`,
    ];
    const staffTemplates = [
      `${name} has been here longer than most of the faculty. Things that feel institutional were often ${name}'s doing, implemented quietly years ago.`,
      `${name} could have moved on several times. They chose not to. The Academy, they'll say if pressed, has the right kind of problems.`,
      `${name} came here after a career in a completely different field. They don't volunteer the details, and the personnel file doesn't explain it.`,
      `${name} knows every room, every shortcut, and most of the unwritten rules. New arrivals figure out quickly that a good relationship with ${name} is useful.`,
    ];
    const templates = roleType === 'faculty' ? facultyTemplates
      : roleType === 'staff' ? staffTemplates
      : studentTemplates;
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