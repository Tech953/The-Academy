import { randomUUID } from "crypto";
import { 
  User, 
  InsertUser, 
  Character, 
  InsertCharacter, 
  Location, 
  NPC, 
  Item,
  GameSession,
  GameStats,
  GameReputation 
} from "@shared/schema";

export interface IStorage {
  // User management
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Character management
  getCharacter(id: string): Promise<Character | undefined>;
  getCharactersByUser(userId: string): Promise<Character[]>;
  createCharacter(character: InsertCharacter): Promise<Character>;
  updateCharacter(id: string, updates: Partial<Character>): Promise<Character | undefined>;
  deleteCharacter(id: string): Promise<boolean>;
  
  // Location system
  getLocation(id: string): Promise<Location | undefined>;
  getAllLocations(): Promise<Location[]>;
  
  // NPC system
  getNPC(id: string): Promise<NPC | undefined>;
  getNPCsInLocation(locationId: string): Promise<NPC[]>;
  getAllNPCs(): Promise<NPC[]>;
  
  // Item system
  getItem(id: string): Promise<Item | undefined>;
  getAllItems(): Promise<Item[]>;
  
  // Game sessions
  saveGameSession(characterId: string, sessionData: any): Promise<GameSession>;
  getLatestGameSession(characterId: string): Promise<GameSession | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private characters: Map<string, Character>;
  private locations: Map<string, Location>;
  private npcs: Map<string, NPC>;
  private items: Map<string, Item>;
  private gameSessions: Map<string, GameSession>;

  constructor() {
    this.users = new Map();
    this.characters = new Map();
    this.locations = new Map();
    this.npcs = new Map();
    this.items = new Map();
    this.gameSessions = new Map();
    
    // Initialize game world data
    this.initializeGameWorld();
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Character methods
  async getCharacter(id: string): Promise<Character | undefined> {
    return this.characters.get(id);
  }

  async getCharactersByUser(userId: string): Promise<Character[]> {
    return Array.from(this.characters.values()).filter(
      (character) => character.userId === userId
    );
  }

  async createCharacter(insertCharacter: InsertCharacter): Promise<Character> {
    const id = randomUUID();
    const now = new Date();
    const character: Character = { 
      ...insertCharacter, 
      id,
      userId: insertCharacter.userId || null,
      subClass: insertCharacter.subClass || null,
      createdAt: now,
      lastPlayed: now
    };
    this.characters.set(id, character);
    return character;
  }

  async updateCharacter(id: string, updates: Partial<Character>): Promise<Character | undefined> {
    const character = this.characters.get(id);
    if (!character) return undefined;
    
    const updatedCharacter = { 
      ...character, 
      ...updates, 
      lastPlayed: new Date() 
    };
    this.characters.set(id, updatedCharacter);
    return updatedCharacter;
  }

  async deleteCharacter(id: string): Promise<boolean> {
    return this.characters.delete(id);
  }

  // Location methods
  async getLocation(id: string): Promise<Location | undefined> {
    return this.locations.get(id);
  }

  async getAllLocations(): Promise<Location[]> {
    return Array.from(this.locations.values());
  }

  // NPC methods
  async getNPC(id: string): Promise<NPC | undefined> {
    return this.npcs.get(id);
  }

  async getNPCsInLocation(locationId: string): Promise<NPC[]> {
    return Array.from(this.npcs.values()).filter(
      (npc) => npc.currentLocation === locationId
    );
  }

  async getAllNPCs(): Promise<NPC[]> {
    return Array.from(this.npcs.values());
  }

  // Item methods
  async getItem(id: string): Promise<Item | undefined> {
    return this.items.get(id);
  }

  async getAllItems(): Promise<Item[]> {
    return Array.from(this.items.values());
  }

  // Game session methods
  async saveGameSession(characterId: string, sessionData: any): Promise<GameSession> {
    const id = randomUUID();
    const session: GameSession = {
      id,
      characterId,
      sessionData,
      timestamp: new Date()
    };
    this.gameSessions.set(id, session);
    return session;
  }

  async getLatestGameSession(characterId: string): Promise<GameSession | undefined> {
    const sessions = Array.from(this.gameSessions.values())
      .filter(session => session.characterId === characterId)
      .sort((a, b) => b.timestamp!.getTime() - a.timestamp!.getTime());
    
    return sessions[0];
  }

  private initializeGameWorld() {
    // Initialize Academy locations
    this.initializeLocations();
    
    // Initialize the 144 Academy students and faculty
    this.initializeNPCs();
    
    // Initialize items and objects
    this.initializeItems();
  }

  private initializeLocations() {
    const locations: Location[] = [
      {
        id: "main_lobby",
        name: "Main Lobby",
        description: "You are standing in the main lobby of The Academy. Ancient portraits line the walls, their eyes following your movement. A receptionist desk sits empty, and hallways branch off toward different wings of the school.",
        type: "lobby",
        exits: { north: "cafeteria", east: "library_larcen", up: "upper_hallway", west: "dormitory_wing" },
        npcs: ["receptionist_emily"],
        items: [],
        interactables: ["portraits", "reception_desk", "academy_plaque"],
        requirements: {}
      },
      {
        id: "cafeteria",
        name: "Academy Cafeteria",
        description: "A spacious dining hall with long wooden tables. The smell of institutional food mingles with whispered conversations. Large windows look out onto the Academy grounds.",
        type: "dining",
        exits: { south: "main_lobby", east: "kitchen", west: "outdoor_courtyard" },
        npcs: ["chef_marcus", "lunch_lady_janet"],
        items: ["academy_menu"],
        interactables: ["serving_line", "notice_board", "vending_machines"],
        requirements: {}
      },
      {
        id: "library_larcen",
        name: "Library (Larcen)",
        description: "The mysterious Library Larcen. Towering shelves disappear into shadows above. Ancient tomes whisper secrets, and some books seem to move when you're not looking directly at them.",
        type: "library",
        exits: { west: "main_lobby", north: "restricted_section", up: "library_upper" },
        npcs: ["librarian_sage", "student_researcher_alex"],
        items: ["academy_handbook", "mysterious_tome"],
        interactables: ["card_catalog", "study_tables", "ancient_globe"],
        requirements: {}
      },
      {
        id: "upper_hallway",
        name: "Upper Hallway",
        description: "A long corridor lined with classroom doors. Faded murals on the walls depict the Academy's founding. The sound of footsteps echoes strangely here.",
        type: "hallway",
        exits: { down: "main_lobby", north: "classroom_101", south: "classroom_102", east: "faculty_wing" },
        npcs: [],
        items: [],
        interactables: ["murals", "trophy_case", "water_fountain"],
        requirements: {}
      },
      {
        id: "dormitory_wing",
        name: "Dormitory Wing",
        description: "A quieter section of the Academy where students live. Doors line both sides of the hallway, each marked with student names and faction symbols.",
        type: "dormitory",
        exits: { east: "main_lobby", north: "common_room", up: "dorm_upper_floor" },
        npcs: ["dorm_supervisor_helen"],
        items: [],
        interactables: ["room_assignments", "faction_banners", "mail_slots"],
        requirements: {}
      }
    ];

    locations.forEach(location => {
      this.locations.set(location.id, location);
    });
  }

  private initializeNPCs() {
    const npcs: NPC[] = [
      {
        id: "receptionist_emily",
        name: "Emily Carter",
        title: "Receptionist",
        race: "Human",
        class: "Administrative",
        faction: null,
        personality: { friendly: 8, helpful: 9, mysterious: 3, authoritative: 6 },
        backstory: "Emily has worked at The Academy for over a decade. She knows everyone's name and seems to appear wherever she's needed most.",
        currentLocation: "main_lobby",
        schedule: { "8:00-17:00": "main_lobby", "17:00-8:00": "off_duty" },
        relationships: {},
        dialogue: {
          greeting: "Welcome to The Academy! How may I help you today?",
          topics: {
            academy_info: "This school has been here for over 150 years. Some say it's built on something much older...",
            students: "We have exactly 144 students this year. Always 144, never more, never less.",
            help: "If you need anything, just ask! I'm here to help students succeed."
          }
        },
        stats: { social: 8, knowledge: 7, intuition: 6 },
        isTeacher: false
      },
      {
        id: "librarian_sage",
        name: "Professor Sage Whitmore",
        title: "Head Librarian",
        race: "Elf",
        class: "Scholar",
        faction: "Seekers",
        personality: { mysterious: 9, knowledgeable: 10, protective: 7, secretive: 8 },
        backstory: "Professor Whitmore has guarded the Library's secrets for decades. Some say they know more about the Academy's true nature than anyone else.",
        currentLocation: "library_larcen",
        schedule: { "6:00-22:00": "library_larcen", "22:00-6:00": "private_study" },
        relationships: {},
        dialogue: {
          greeting: "Shh... knowledge demands respect. What brings you to my sanctuary?",
          topics: {
            library: "This library contains knowledge that spans millennia. Some books choose their readers, not the other way around.",
            restricted_section: "The restricted section? That requires... special permission. And special understanding.",
            academy_secrets: "Every school has its mysteries. This one just happens to have more than most."
          }
        },
        stats: { knowledge: 10, intuition: 9, wisdom: 8 },
        isTeacher: true
      },
      {
        id: "chef_marcus",
        name: "Chef Marcus Thompson",
        title: "Head Chef",
        race: "Dwarf",
        class: "Artisan",
        faction: "Guardians",
        personality: { jolly: 8, protective: 7, traditional: 6, gossip: 5 },
        backstory: "Marcus has fed generations of Academy students. His kitchen is a place of warmth and comfort in an otherwise mysterious school.",
        currentLocation: "cafeteria",
        schedule: { "5:00-20:00": "cafeteria", "20:00-5:00": "chef_quarters" },
        relationships: {},
        dialogue: {
          greeting: "Hungry? Good! A well-fed student is a successful student!",
          topics: {
            food: "I make everything from scratch. Real food for real students, not that processed nonsense.",
            students: "I see all the students come through here. You can tell a lot about someone by how they eat.",
            academy: "Been cooking here for 20 years. This place... it takes care of those who take care of it."
          }
        },
        stats: { crafting: 9, social: 6, strength: 7 },
        isTeacher: false
      }
    ];

    npcs.forEach(npc => {
      this.npcs.set(npc.id, npc);
    });
  }

  private initializeItems() {
    const items: Item[] = [
      {
        id: "academy_handbook",
        name: "Academy Student Handbook",
        description: "A well-worn handbook containing rules, maps, and student policies. Some pages seem to have been deliberately obscured.",
        type: "book",
        weight: 1,
        value: 0,
        properties: { readable: true, provides_map: true },
        canUse: true,
        isQuestItem: false
      },
      {
        id: "mysterious_tome",
        name: "Leather-Bound Tome",
        description: "An ancient book with symbols that seem to shift when you're not looking directly at them. It feels warm to the touch.",
        type: "book",
        weight: 3,
        value: 0,
        properties: { magical: true, requires_permission: true },
        canUse: false,
        isQuestItem: true
      },
      {
        id: "academy_menu",
        name: "Today's Menu",
        description: "A simple paper menu listing today's offerings. Nothing unusual... or is there?",
        type: "document",
        weight: 0,
        value: 0,
        properties: { consumable: true },
        canUse: true,
        isQuestItem: false
      }
    ];

    items.forEach(item => {
      this.items.set(item.id, item);
    });
  }
}

export const storage = new MemStorage();
