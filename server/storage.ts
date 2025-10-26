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
  GameReputation,
  Course,
  InsertCourse,
  Enrollment,
  InsertEnrollment,
  Assignment,
  InsertAssignment,
  GraduationPathway,
  InsertGraduationPathway,
  AcademicProgress,
  InsertAcademicProgress
} from "@shared/schema";
import { ProceduralGenerator, WORLD_TEMPLATES } from "./procedural/generators";
import { generateCourseCatalog, generateGraduationPathways, generateCourseAssignments, generateTextbooks } from "./procedural/courseGenerator";

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
  
  // Curriculum system
  getCourse(id: string): Promise<Course | undefined>;
  getAllCourses(): Promise<Course[]>;
  getCoursesByDepartment(department: string): Promise<Course[]>;
  
  getEnrollment(id: string): Promise<Enrollment | undefined>;
  getEnrollmentsByCourse(courseId: string): Promise<Enrollment[]>;
  getEnrollmentsByCharacter(characterId: string): Promise<Enrollment[]>;
  createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment>;
  updateEnrollment(id: string, updates: Partial<Enrollment>): Promise<Enrollment | undefined>;
  
  getAssignment(id: string): Promise<Assignment | undefined>;
  getAssignmentsByCourse(courseId: string): Promise<Assignment[]>;
  
  getGraduationPathway(id: string): Promise<GraduationPathway | undefined>;
  getAllGraduationPathways(): Promise<GraduationPathway[]>;
  
  getAcademicProgress(characterId: string): Promise<AcademicProgress | undefined>;
  createAcademicProgress(progress: InsertAcademicProgress): Promise<AcademicProgress>;
  updateAcademicProgress(characterId: string, updates: Partial<AcademicProgress>): Promise<AcademicProgress | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private characters: Map<string, Character>;
  private locations: Map<string, Location>;
  private npcs: Map<string, NPC>;
  private items: Map<string, Item>;
  private gameSessions: Map<string, GameSession>;
  private events: Map<string, any>; // Store procedural events
  private courses: Map<string, Course>;
  private enrollments: Map<string, Enrollment>;
  private assignments: Map<string, Assignment>;
  private graduationPathways: Map<string, GraduationPathway>;
  private academicProgress: Map<string, AcademicProgress>; // Keyed by characterId

  constructor() {
    this.users = new Map();
    this.characters = new Map();
    this.locations = new Map();
    this.npcs = new Map();
    this.items = new Map();
    this.gameSessions = new Map();
    this.events = new Map();
    this.courses = new Map();
    this.enrollments = new Map();
    this.assignments = new Map();
    this.graduationPathways = new Map();
    this.academicProgress = new Map();
    
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
      background: insertCharacter.background || null,
      currentLocation: insertCharacter.currentLocation || null,
      energy: insertCharacter.energy || null,
      maxEnergy: insertCharacter.maxEnergy || null,
      inventory: insertCharacter.inventory || [],
      reputation: insertCharacter.reputation || {},
      stats: insertCharacter.stats || {},
      perks: insertCharacter.perks || [],
      questProgress: insertCharacter.questProgress || {},
      socialConnections: insertCharacter.socialConnections || {},
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
    // Use procedural generation instead of hardcoded data
    console.log('🌍 Initializing world with procedural generation...');
    
    // Generate the default academy world procedurally
    this.generateWorld('academy', 12345); // Fixed seed for consistency
    
    // Initialize basic items (these are universal across world types)
    this.initializeItems();
    
    // Initialize curriculum system
    this.initializeCurriculum();
    
    console.log(`✅ Procedural world initialized: ${this.npcs.size} NPCs, ${this.locations.size} locations, ${this.courses.size} courses, ${this.events.size} events`);
  }
  
  private initializeCurriculum() {
    const npcArray = Array.from(this.npcs.values());
    const locationArray = Array.from(this.locations.values());
    
    // Generate course catalog
    const courses = generateCourseCatalog(npcArray, locationArray);
    courses.forEach((course: Course) => {
      this.courses.set(course.id, course);
      
      // Generate assignments for each course
      const assignments = generateCourseAssignments(course);
      assignments.forEach((assignment: Assignment) => {
        this.assignments.set(assignment.id, assignment);
      });
    });
    
    // Generate textbooks for all courses
    const textbooks = generateTextbooks(Array.from(this.courses.values()));
    textbooks.forEach((textbook: any) => {
      this.items.set(textbook.id, textbook);
    });
    
    // Generate graduation pathways
    const pathways = generateGraduationPathways();
    pathways.forEach((pathway: GraduationPathway) => {
      this.graduationPathways.set(pathway.id, pathway);
    });
    
    console.log(`📚 Curriculum initialized: ${this.courses.size} courses, ${this.assignments.size} assignments, ${this.graduationPathways.size} pathways, ${textbooks.length} textbooks`);
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
      },
      {
        id: "kitchen",
        name: "Academy Kitchen",
        description: "A bustling industrial kitchen filled with steam and the clatter of pots. The chef works tirelessly preparing meals that somehow taste better than they should.",
        type: "service",
        exits: { west: "cafeteria", south: "storage_room" },
        npcs: ["sous_chef_maria"],
        items: ["kitchen_knife", "recipe_book"],
        interactables: ["stove", "preparation_counter", "walk_in_freezer"],
        requirements: {}
      },
      {
        id: "outdoor_courtyard",
        name: "Academy Courtyard",
        description: "An open courtyard surrounded by Academy buildings. Ancient oak trees provide shade, and stone benches invite contemplation. The sky above seems unusually starry, even during the day.",
        type: "outdoor",
        exits: { east: "cafeteria", south: "greenhouse", north: "athletics_field" },
        npcs: ["groundskeeper_tom"],
        items: ["fallen_leaves"],
        interactables: ["ancient_oak", "stone_fountain", "memorial_plaques"],
        requirements: {}
      },
      {
        id: "restricted_section",
        name: "Restricted Section",
        description: "The forbidden part of the library. Chains and mystical wards protect these ancient tomes. The air crackles with magical energy, and whispers echo from the shadows.",
        type: "restricted",
        exits: { south: "library_larcen" },
        npcs: ["archive_guardian"],
        items: ["forbidden_grimoire", "ancient_scroll"],
        interactables: ["warded_bookshelf", "ritual_circle", "enchanted_chains"],
        requirements: { permission_level: "faculty", special_key: "master_librarian_key" }
      },
      {
        id: "library_upper",
        name: "Library Upper Level",
        description: "The second floor of the library contains study carrels and rare book collections. Tall windows overlook the Academy grounds, and the silence here is profound.",
        type: "study",
        exits: { down: "library_larcen", west: "reading_room" },
        npcs: ["student_scholar_jenny"],
        items: ["research_notes", "quill_pen"],
        interactables: ["study_carrels", "rare_book_collection", "observation_deck"],
        requirements: {}
      },
      {
        id: "classroom_101",
        name: "History Classroom",
        description: "Professor Dawn's history classroom. Maps of ancient civilizations cover the walls, and an antique globe sits on the desk. The lessons here reveal more than just textbook knowledge.",
        type: "classroom",
        exits: { south: "upper_hallway" },
        npcs: ["professor_dawn"],
        items: ["history_textbook", "ancient_map"],
        interactables: ["chalkboard", "antique_globe", "artifact_display"],
        requirements: {}
      },
      {
        id: "classroom_102",
        name: "Mathematics Classroom",
        description: "A pristine classroom where numbers and equations seem to dance across the blackboard. Professor Klein's precise teaching makes even the most complex formulas comprehensible.",
        type: "classroom",
        exits: { north: "upper_hallway" },
        npcs: ["professor_klein"],
        items: ["calculator", "geometry_set"],
        interactables: ["equation_board", "calculator_station", "geometric_models"],
        requirements: {}
      },
      {
        id: "faculty_wing",
        name: "Faculty Wing",
        description: "The domain of the Academy's teachers. Offices line the hallway, each door bearing nameplaques of distinguished faculty members. The air here feels heavy with academic authority.",
        type: "faculty",
        exits: { west: "upper_hallway", north: "headmaster_office", south: "teachers_lounge" },
        npcs: ["department_head_wilson"],
        items: [],
        interactables: ["faculty_directory", "bulletin_board", "coffee_station"],
        requirements: {}
      },
      {
        id: "headmaster_office",
        name: "Headmaster's Office",
        description: "The seat of Academy authority. Heavy oak furniture dominates the room, and portraits of past headmasters watch with knowing eyes. The current Headmaster's presence fills every corner.",
        type: "restricted",
        exits: { south: "faculty_wing" },
        npcs: ["headmaster_kane"],
        items: ["academy_charter", "disciplinary_records"],
        interactables: ["massive_desk", "portrait_gallery", "hidden_safe"],
        requirements: { permission_level: "summons_only", appointment: true }
      },
      {
        id: "teachers_lounge",
        name: "Teachers' Lounge",
        description: "A comfortable retreat for Academy faculty. Worn leather chairs and the aroma of coffee create a sanctuary away from student eyes. Hushed conversations hint at Academy secrets.",
        type: "faculty",
        exits: { north: "faculty_wing" },
        npcs: ["teacher_collective"],
        items: ["faculty_newsletter", "coffee_mug"],
        interactables: ["coffee_machine", "comfortable_chairs", "faculty_mailboxes"],
        requirements: { permission_level: "faculty", student_access: false }
      },
      {
        id: "common_room",
        name: "Student Common Room",
        description: "A cozy gathering place for dormitory residents. Mismatched furniture and faction banners create a warm atmosphere. Late-night conversations and study sessions happen here.",
        type: "social",
        exits: { south: "dormitory_wing", east: "game_room" },
        npcs: ["resident_assistant_mike"],
        items: ["board_games", "study_materials"],
        interactables: ["comfortable_couches", "study_tables", "faction_notice_boards"],
        requirements: {}
      },
      {
        id: "dorm_upper_floor",
        name: "Upper Dormitory Floor",
        description: "The second floor of the dormitory wing. Student rooms line both sides of the hallway. Each door tells a story through its decorations and posted schedules.",
        type: "dormitory",
        exits: { down: "dormitory_wing" },
        npcs: ["various_students"],
        items: [],
        interactables: ["student_doors", "study_lounge", "laundry_room"],
        requirements: { permission_level: "residents_only" }
      },
      {
        id: "gymnasium",
        name: "Gymnasium (Rixik)",
        description: "The Academy's impressive gymnasium. Basketball hoops and exercise equipment fill the space, but strange symbols carved into the floor suggest this place serves purposes beyond normal athletics.",
        type: "athletics",
        exits: { north: "athletics_field", south: "locker_rooms", east: "equipment_storage" },
        npcs: ["coach_reynolds", "athletic_director"],
        items: ["basketball", "exercise_equipment"],
        interactables: ["basketball_court", "climbing_wall", "mysterious_floor_symbols"],
        requirements: {}
      },
      {
        id: "athletics_field",
        name: "Athletics Field",
        description: "An outdoor field where students practice various sports. The track circles a central field marked with unusual geometric patterns. Evening practices here sometimes produce strange lights.",
        type: "outdoor",
        exits: { south: "outdoor_courtyard", down: "gymnasium" },
        npcs: ["track_coach"],
        items: ["sports_equipment"],
        interactables: ["running_track", "field_markers", "equipment_shed"],
        requirements: {}
      },
      {
        id: "greenhouse",
        name: "Academy Greenhouse",
        description: "A glass structure filled with exotic plants that shouldn't grow in Toronto's climate. Professor Bloom tends to specimens that seem to respond to emotions and thoughts.",
        type: "classroom",
        exits: { north: "outdoor_courtyard" },
        npcs: ["professor_bloom"],
        items: ["rare_seeds", "botanical_journal"],
        interactables: ["exotic_plants", "growth_chambers", "watering_system"],
        requirements: {}
      },
      {
        id: "chemistry_lab",
        name: "Chemistry Laboratory",
        description: "A well-equipped lab where students learn both mundane chemistry and more esoteric alchemical practices. Bubbling beakers and strange vapors fill the air with possibility.",
        type: "classroom",
        exits: { west: "science_wing", north: "chemical_storage" },
        npcs: ["professor_vance"],
        items: ["test_tubes", "chemical_samples"],
        interactables: ["laboratory_benches", "fume_hoods", "periodic_table"],
        requirements: {}
      },
      {
        id: "computer_lab",
        name: "Computer Laboratory",
        description: "State-of-the-art computers hum quietly in perfect rows. The AI presence here feels almost sentient, and students often report their programs developing unexpected capabilities.",
        type: "classroom",
        exits: { south: "science_wing" },
        npcs: ["tech_coordinator_ray"],
        items: ["programming_manual", "data_storage"],
        interactables: ["computer_stations", "server_rack", "ai_terminal"],
        requirements: {}
      },
      {
        id: "science_wing",
        name: "Science Wing Corridor",
        description: "A hallway connecting the Academy's science facilities. Display cases show student experiments and scientific achievements, though some exhibits seem to defy conventional physics.",
        type: "hallway",
        exits: { east: "chemistry_lab", north: "computer_lab", west: "main_lobby", south: "physics_lab" },
        npcs: [],
        items: [],
        interactables: ["science_displays", "achievement_awards", "experiment_showcase"],
        requirements: {}
      },
      {
        id: "physics_lab",
        name: "Physics Laboratory",
        description: "Where the laws of physics are explored... and occasionally bent. Professor Newton's experiments with force and motion sometimes produce results that challenge conventional understanding.",
        type: "classroom",
        exits: { north: "science_wing" },
        npcs: ["professor_newton"],
        items: ["physics_equipment", "measurement_tools"],
        interactables: ["experiment_tables", "force_demonstration", "gravity_chamber"],
        requirements: {}
      },
      {
        id: "art_studio",
        name: "Art Studio",
        description: "A creative space filled with canvases, sculptures, and artistic supplies. Student artwork covers the walls, and some pieces seem to move when viewed from different angles.",
        type: "classroom",
        exits: { east: "art_gallery", south: "supply_closet" },
        npcs: ["art_teacher_luna"],
        items: ["paint_supplies", "canvas"],
        interactables: ["easels", "sculpture_station", "kiln"],
        requirements: {}
      },
      {
        id: "art_gallery",
        name: "Art Exhibition Gallery",
        description: "A refined space displaying the finest student and faculty artwork. The paintings here seem to watch visitors, and the sculptures cast shadows that don't match their forms.",
        type: "exhibition",
        exits: { west: "art_studio" },
        npcs: ["gallery_curator"],
        items: ["exhibition_catalog"],
        interactables: ["painting_collection", "sculpture_display", "interactive_installations"],
        requirements: {}
      },
      {
        id: "music_room",
        name: "Music Practice Room",
        description: "Soundproofed walls contain the Academy's musical activities. Instruments of all kinds fill the space, and the acoustics here produce harmonies that resonate beyond normal hearing.",
        type: "classroom",
        exits: { north: "performance_hall" },
        npcs: ["music_director"],
        items: ["sheet_music", "instruments"],
        interactables: ["piano", "instrument_collection", "recording_equipment"],
        requirements: {}
      },
      {
        id: "performance_hall",
        name: "Academy Performance Hall",
        description: "An elegant auditorium with perfect acoustics. The stage has hosted countless performances, and the building itself seems to retain echoes of every great moment performed here.",
        type: "auditorium",
        exits: { south: "music_room", west: "backstage" },
        npcs: ["theater_director"],
        items: ["program_archives"],
        interactables: ["grand_stage", "lighting_booth", "orchestra_pit"],
        requirements: {}
      }
    ];

    locations.forEach(location => {
      this.locations.set(location.id, location);
    });
  }

  private generateProceduralContent() {
    // Configuration for procedural generation
    const config = {
      seed: 12345, // Can be made configurable via API
      worldType: 'academy',
      npcCount: 140,
      locationCount: 25,
      factionCount: 4
    };
    
    const generator = new ProceduralGenerator(config, WORLD_TEMPLATES.academy);
    
    // Generate NPCs procedurally
    const students = generator.generateNPCs(140, 'student');
    const faculty = generator.generateNPCs(4, 'faculty');
    
    return { students, faculty, generator };
  }

  private generateStudentNPCs(): NPC[] {
    // Now using procedural generation instead of hardcoded lists
    const { students } = this.generateProceduralContent();
    return students;
    
    // OLD HARDCODED VERSION - replaced with procedural generation
    /*
    const studentNames = [
      // Diverse selection of names from various backgrounds
      "Alex Chen", "Maya Patel", "Jordan Smith", "Zara Ali", "Kai Nakamura",
      "Isabella Rodriguez", "Ethan O'Connor", "Amara Johnson", "Lucas Berg", "Naia Thompson",
      "Darius Volkov", "Luna Martinez", "Sebastian Kim", "Aria Santos", "Phoenix Lee",
      "Sage Williams", "River Andersen", "Nova Singh", "Atlas Cooper", "Iris Dimitriou",
      "Felix Andersson", "Zoe Laurent", "Orion Jackson", "Maya Okafor", "Jasper Clarke",
      "Lyra Petrova", "Storm Davidson", "Ember Walsh", "Rowan Fletcher", "Celeste Park",
      "Adrian Müller", "Skylar Brown", "Magnus Olsson", "Violet Hayes", "Caspian Reed",
      "Aurora Mitchell", "Dante Torres", "Willow Cameron", "Axel Novak", "Serenity Gray",
      "Zephyr Ahmed", "Scarlett Ford", "Orion Bell", "Ivy Watanabe", "Atlas Morrison",
      "Luna Foster", "Phoenix Rivera", "Sage Butler", "Storm Campbell", "Ember Wilson",
      "River Martinez", "Nova Taylor", "Jasper Anderson", "Lyra Thompson", "Rowan Davis",
      "Celeste Miller", "Adrian Johnson", "Skylar Wilson", "Magnus Brown", "Violet Jones",
      "Caspian Garcia", "Aurora Rodriguez", "Dante Martinez", "Willow Lopez", "Axel Gonzalez",
      "Serenity Hernandez", "Zephyr Young", "Scarlett King", "Orion Wright", "Ivy Scott",
      "Atlas Green", "Luna Baker", "Phoenix Adams", "Sage Nelson", "Storm Carter",
      "Ember Mitchell", "River Perez", "Nova Roberts", "Jasper Turner", "Lyra Phillips",
      "Rowan Campbell", "Celeste Parker", "Adrian Evans", "Skylar Edwards", "Magnus Collins",
      "Violet Stewart", "Caspian Sanchez", "Aurora Morris", "Dante Rogers", "Willow Reed",
      "Axel Cook", "Serenity Bailey", "Zephyr Cooper", "Scarlett Richardson", "Orion Cox",
      "Ivy Howard", "Atlas Ward", "Luna Torres", "Phoenix Peterson", "Sage Gray",
      "Storm Ramirez", "Ember James", "River Watson", "Nova Brooks", "Jasper Kelly",
      "Lyra Sanders", "Rowan Price", "Celeste Bennett", "Adrian Wood", "Skylar Barnes",
      "Magnus Ross", "Violet Henderson", "Caspian Coleman", "Aurora Jenkins", "Dante Perry",
      "Willow Powell", "Axel Long", "Serenity Patterson", "Zephyr Hughes", "Scarlett Flores",
      "Orion Washington", "Ivy Butler", "Atlas Simmons", "Luna Foster", "Phoenix Bryant",
      "Sage Alexander", "Storm Russell", "Ember Griffin", "River Diaz", "Nova Hayes",
      "Jasper Myers", "Lyra Ford", "Rowan Hamilton", "Celeste Graham", "Adrian Sullivan",
      "Skylar Wallace", "Magnus Woods", "Violet Cole", "Caspian West", "Aurora Jordan",
      "Dante Owens", "Willow Reynolds", "Axel Fisher", "Serenity Ellis", "Zephyr Harrison",
      "Scarlett Gibson", "Orion McDonald", "Ivy Cruz", "Atlas Marshall", "Luna Ortiz",
      "Phoenix Gomez", "Sage Murray", "Storm Freeman", "Ember Wells"
    ];
    
    const races = ["Human", "Elf", "Spirit", "Mer-Person", "Orc", "Furret", "Cartoon"];
    const classes = ["Bard", "Rogue", "Wizard", "Paladin", "Ranger", "Barbarian", "Druid"];
    const factions = ["Archivists", "Seekers", "Guardians", "Innovators"];
    const subClasses = ["Berserker", "Assassin", "Elementalist", "Divine", "Beast Master", "Frenzy", "Circle of Stars"];
    
    // Common student locations during different times
    const studentLocations = [
      "student_dorms", "library_larcen", "cafeteria", "main_lobby", 
      "study_hall", "common_room", "courtyard", "greenhouse", 
      "art_studio", "computer_lab", "chemistry_lab", "music_room"
    ];
    
    const personalityTraits = [
      { curious: 8, friendly: 7, studious: 6, creative: 5 },
      { mysterious: 7, intelligent: 9, reserved: 6, analytical: 8 },
      { outgoing: 9, social: 8, energetic: 7, optimistic: 6 },
      { protective: 8, loyal: 9, practical: 7, determined: 6 },
      { artistic: 9, intuitive: 8, dreamy: 7, expressive: 6 },
      { rebellious: 7, independent: 8, witty: 9, confident: 6 },
      { wise: 8, patient: 7, observant: 9, calm: 8 }
    ];
    
    const dialogueTemplates = [
      {
        greeting: "Hey there! Haven't seen you around before. I'm {name}!",
        topics: {
          academy: "This place is wild! Every day I discover something new and mysterious.",
          classes: "The classes here are unlike anywhere else. Magic theory is my favorite!",
          faction: "Being part of {faction} has opened my eyes to so many possibilities.",
          students: "There are so many interesting people here. Everyone has their own story."
        }
      },
      {
        greeting: "Oh, hello. I was just studying. I'm {name}, nice to meet you.",
        topics: {
          studies: "I spend most of my time in the library. The knowledge here is incredible.",
          academy: "The Academy has secrets layered upon secrets. Fascinating, really.",
          faction: "{faction} values align perfectly with my pursuit of understanding.",
          mystery: "Have you noticed how the shadows move differently here? Intriguing..."
        }
      },
      {
        greeting: "What's up! Always great to meet someone new. Name's {name}!",
        topics: {
          friends: "I love meeting new people! The social dynamics here are amazing.",
          events: "There's always something happening around campus. Join the fun!",
          faction: "{faction} has the best people - we stick together!",
          academy: "This school has such a unique energy. You can feel it everywhere!"
        }
      }
    ];
    
    const students: NPC[] = [];
    
    // Generate exactly 140 students (plus 4 faculty we'll add separately)
    for (let i = 0; i < 140; i++) {
      const name = studentNames[i % studentNames.length];
      const race = races[i % races.length];
      const npcClass = classes[i % classes.length];
      const faction = factions[i % factions.length];
      const personality = personalityTraits[i % personalityTraits.length];
      const dialogueTemplate = dialogueTemplates[i % dialogueTemplates.length];
      const currentLocation = studentLocations[i % studentLocations.length];
      
      // Create personalized dialogue
      const dialogue = {
        greeting: dialogueTemplate.greeting.replace('{name}', name.split(' ')[0]),
        topics: Object.fromEntries(
          Object.entries(dialogueTemplate.topics).map(([key, value]) => [
            key,
            value.replace('{name}', name.split(' ')[0]).replace('{faction}', faction)
          ])
        )
      };
      
      // Generate schedule (students move around during the day)
      const schedule = {
        "8:00-12:00": i % 2 === 0 ? "study_hall" : "library_larcen",
        "12:00-13:00": "cafeteria",
        "13:00-17:00": currentLocation,
        "17:00-22:00": i % 3 === 0 ? "common_room" : "student_dorms",
        "22:00-8:00": "student_dorms"
      };
      
      // Create backstory
      const backstories = [
        `${name} is a dedicated student who came to The Academy seeking knowledge and adventure.`,
        `${name} has always felt drawn to mysterious places, and The Academy called to them.`,
        `${name} is here to master their abilities and uncover the truth behind the Academy's secrets.`,
        `${name} believes The Academy holds the key to understanding their true potential.`
      ];
      
      const student: NPC = {
        id: `student_${name.toLowerCase().replace(/[^a-z]/g, '_')}`,
        name: name,
        title: "Student",
        race: race,
        class: npcClass,
        faction: faction,
        personality: personality,
        backstory: backstories[i % backstories.length],
        currentLocation: currentLocation,
        schedule: schedule,
        relationships: {},
        dialogue: dialogue,
        stats: {
          knowledge: Math.floor(Math.random() * 5) + 3,
          social: Math.floor(Math.random() * 5) + 3,
          athletics: Math.floor(Math.random() * 5) + 3,
          creativity: Math.floor(Math.random() * 5) + 3,
          mysticism: Math.floor(Math.random() * 5) + 3
        },
        isTeacher: false
      };
      
      students.push(student);
    }
    
    return students;
    */
  }

  private initializeNPCs() {
    const students = this.generateStudentNPCs();
    
    const npcs: NPC[] = [
      // Faculty and staff
      ...students,
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
  
  // New method for generating worlds with different templates
  generateWorld(worldType: string = 'academy', seed?: number): void {
    console.log(`🎲 Generating ${worldType} world with seed ${seed}...`);
    const config = {
      seed: seed || Math.floor(Math.random() * 1000000),
      worldType: worldType,
      npcCount: 100,
      locationCount: 20,
      factionCount: 4
    };
    
    const template = WORLD_TEMPLATES[worldType as keyof typeof WORLD_TEMPLATES] || WORLD_TEMPLATES.academy;
    const generator = new ProceduralGenerator(config, template);
    
    // Clear existing content
    this.npcs.clear();
    this.locations.clear();
    
    // Generate new procedural content
    const students = generator.generateNPCs(80, 'student');
    const faculty = generator.generateNPCs(10, 'faculty');
    const staff = generator.generateNPCs(10, 'staff');
    
    // Store generated NPCs
    [...students, ...faculty, ...staff].forEach(npc => {
      this.npcs.set(npc.id, npc);
    });
    
    // Generate structured campus locations based on hand-drawn map
    const structuredLocations = generator.generateStructuredCampus();
    for (const location of structuredLocations) {
      // Add location to the map
      // Location is already generated by structured campus
      this.locations.set(location.id, location);
    }
    
    console.log(`Generated ${worldType} world with seed ${config.seed}:`);
    console.log(`- ${this.npcs.size} NPCs`);
    console.log(`- ${this.locations.size} locations`);
  }
  
  // Method to generate procedural events
  generateEvents(count: number = 10): any[] {
    const config = {
      seed: Math.floor(Math.random() * 1000000),
      worldType: 'academy',
      npcCount: 0,
      locationCount: 0,
      factionCount: 4
    };
    
    const generator = new ProceduralGenerator(config, WORLD_TEMPLATES.academy);
    const events = [];
    
    for (let i = 0; i < count; i++) {
      events.push(generator.generateEvent(`event_${i}`));
    }
    
    return events;
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
  
  // Curriculum system methods
  
  async getCourse(id: string): Promise<Course | undefined> {
    return this.courses.get(id);
  }
  
  async getAllCourses(): Promise<Course[]> {
    return Array.from(this.courses.values());
  }
  
  async getCoursesByDepartment(department: string): Promise<Course[]> {
    return Array.from(this.courses.values()).filter(
      course => course.department === department
    );
  }
  
  async getEnrollment(id: string): Promise<Enrollment | undefined> {
    return this.enrollments.get(id);
  }
  
  async getEnrollmentsByCourse(courseId: string): Promise<Enrollment[]> {
    return Array.from(this.enrollments.values()).filter(
      enrollment => enrollment.courseId === courseId
    );
  }
  
  async getEnrollmentsByCharacter(characterId: string): Promise<Enrollment[]> {
    return Array.from(this.enrollments.values()).filter(
      enrollment => enrollment.characterId === characterId
    );
  }
  
  async createEnrollment(insertEnrollment: InsertEnrollment): Promise<Enrollment> {
    const id = randomUUID();
    const now = new Date();
    const enrollment: Enrollment = {
      ...insertEnrollment,
      id,
      status: insertEnrollment.status || 'enrolled',
      attendanceRecord: insertEnrollment.attendanceRecord || [],
      currentGrade: insertEnrollment.currentGrade || null,
      finalGrade: insertEnrollment.finalGrade || null,
      gradePoints: insertEnrollment.gradePoints || null,
      assignmentGrades: insertEnrollment.assignmentGrades || {},
      enrolledAt: now,
      completedAt: null
    };
    this.enrollments.set(id, enrollment);
    return enrollment;
  }
  
  async updateEnrollment(id: string, updates: Partial<Enrollment>): Promise<Enrollment | undefined> {
    const enrollment = this.enrollments.get(id);
    if (!enrollment) return undefined;
    
    const updatedEnrollment = { ...enrollment, ...updates };
    this.enrollments.set(id, updatedEnrollment);
    return updatedEnrollment;
  }
  
  async getAssignment(id: string): Promise<Assignment | undefined> {
    return this.assignments.get(id);
  }
  
  async getAssignmentsByCourse(courseId: string): Promise<Assignment[]> {
    return Array.from(this.assignments.values()).filter(
      assignment => assignment.courseId === courseId
    );
  }
  
  async getGraduationPathway(id: string): Promise<GraduationPathway | undefined> {
    return this.graduationPathways.get(id);
  }
  
  async getAllGraduationPathways(): Promise<GraduationPathway[]> {
    return Array.from(this.graduationPathways.values());
  }
  
  async getAcademicProgress(characterId: string): Promise<AcademicProgress | undefined> {
    return this.academicProgress.get(characterId);
  }
  
  async createAcademicProgress(insertProgress: InsertAcademicProgress): Promise<AcademicProgress> {
    const id = randomUUID();
    const progress: AcademicProgress = {
      ...insertProgress,
      id,
      currentSemester: insertProgress.currentSemester || 'Fall 2025',
      semestersCompleted: insertProgress.semestersCompleted || 0,
      totalCreditsEarned: insertProgress.totalCreditsEarned || 0,
      cumulativeGPA: insertProgress.cumulativeGPA || 0,
      semesterGPA: insertProgress.semesterGPA || 0,
      major: insertProgress.major || null,
      minor: insertProgress.minor || null,
      academicStanding: insertProgress.academicStanding || 'good',
      transcript: insertProgress.transcript || [],
      degreesEarned: insertProgress.degreesEarned || []
    };
    this.academicProgress.set(progress.characterId, progress);
    return progress;
  }
  
  async updateAcademicProgress(characterId: string, updates: Partial<AcademicProgress>): Promise<AcademicProgress | undefined> {
    const progress = this.academicProgress.get(characterId);
    if (!progress) return undefined;
    
    const updatedProgress = { ...progress, ...updates };
    this.academicProgress.set(characterId, updatedProgress);
    return updatedProgress;
  }
}

export const storage = new MemStorage();
