import { Character, Location, NPC, Item, GameStats, GameReputation, GameInventoryItem, SocialConnection, ResearchNotebook, ResearchNote, StudyRecommendation, StudentProgress } from "@shared/schema";
import { 
  WorldMemory, 
  createInitialWorldMemory, 
  updateWorldMemory,
  resolveInteraction,
  createPlayerSignalFromStats,
  ObjectArchetype,
  OBJECT_ARCHETYPES,
  IntentEnum,
  Outcome,
  MYTHIC_FLAGS,
  CORRIDOR_MUTATION_RULES,
  getAmbientSignals,
  generateConfluenceHallState,
  determineGedCulmination,
  AmbientSignal,
  ConfluenceHallState,
  DepartureVector,
  FACTION_AMBIENT_PROFILES
} from "./interactionResolver";
import {
  calculateDialogueAxes,
  calculateToneProfile,
  detectStatConflicts,
  detectFactionMisread,
  calculateFactionAffinity,
  modulateDialogue,
  generateConflictAmbience,
  DialogueAxes,
  ToneProfile,
  StatConflict,
  ModulatedDialogue,
  ACADEMY_FACTIONS
} from "./dialogueModulator";
import {
  assessEscalation,
  generateInterventionSequence,
  createCrisisModeState,
  activateCrisisMode,
  resolveCrisisMode,
  getDialogueForPhase,
  HALE_NPC,
  WATCHWARDEN_HALE,
  GROUNDING_EXERCISES,
  CrisisModeState,
  EscalationAssessment,
  InterventionSequence
} from "./crisisIntervention";
import {
  createInitialNotebook,
  ensureNotebookComplete,
  createNote,
  addNote,
  updateNote,
  deleteNote,
  markNoteAsRead,
  searchNotes,
  getNotesByTag,
  getRelatedNotes,
  toggleBookmark,
  formatNoteForDisplay,
  formatNotebookStats,
  generateStudyRecommendations,
  calculateStudentProgress
} from "./researchNotebook";

export interface GameState {
  character: Character;
  currentLocation: Location;
  inventory: GameInventoryItem[];
  locationHistory: string[];
  gameFlags: Record<string, any>;
  temporaryEffects: Record<string, { value: any; expires?: Date }>;
  lastSaveTime?: Date;
  worldMemory: WorldMemory;
  researchNotebook: ResearchNotebook;
  crisisMode: CrisisModeState;
}

export interface TerminalLine {
  id: string;
  text: string;
  type: 'output' | 'command' | 'system' | 'error';
}

export class GameStateManager {
  private gameState: GameState | null = null;
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor() {}

  // Initialize or load game state
  async initializeGame(character: Character): Promise<GameState> {
    // Try to load existing game state from server
    try {
      const response = await fetch(`/api/game/load/${character.id}`);
      if (response.ok) {
        const savedState = await response.json();
        // Ensure worldMemory exists (migration for older saves)
        if (!savedState.worldMemory) {
          savedState.worldMemory = createInitialWorldMemory();
        }
        // Ensure researchNotebook exists and is complete (migration for older saves)
        if (!savedState.researchNotebook) {
          savedState.researchNotebook = createInitialNotebook(character.id);
        } else {
          // Defensive migration: ensure all notebook fields exist
          savedState.researchNotebook = ensureNotebookComplete(savedState.researchNotebook, character.id);
        }
        // Ensure crisisMode exists (migration for older saves)
        if (!savedState.crisisMode) {
          savedState.crisisMode = createCrisisModeState();
        }
        this.gameState = savedState;
        return savedState;
      }
    } catch (error) {
      console.warn('Could not load saved game state:', error);
    }

    // Create new game state
    const location = await this.fetchLocation(character.currentLocation || 'main_lobby');
    
    this.gameState = {
      character,
      currentLocation: location,
      inventory: Array.isArray(character.inventory) ? character.inventory : [],
      locationHistory: [character.currentLocation || 'main_lobby'],
      gameFlags: {},
      temporaryEffects: {},
      lastSaveTime: new Date(),
      worldMemory: createInitialWorldMemory(),
      researchNotebook: createInitialNotebook(character.id),
      crisisMode: createCrisisModeState()
    };

    return this.gameState;
  }

  // Get current game state
  getGameState(): GameState | null {
    return this.gameState;
  }

  // Move to a new location
  async moveToLocation(locationId: string): Promise<Location | null> {
    if (!this.gameState) return null;

    try {
      const newLocation = await this.fetchLocation(locationId);
      
      // Create new game state object instead of mutating existing one
      const newLocationHistory = [...this.gameState.locationHistory, locationId];
      
      // Keep location history to reasonable size
      if (newLocationHistory.length > 50) {
        newLocationHistory.splice(0, newLocationHistory.length - 50);
      }

      this.gameState = {
        ...this.gameState,
        currentLocation: newLocation,
        character: {
          ...this.gameState.character,
          currentLocation: locationId
        },
        locationHistory: newLocationHistory
      };

      this.scheduleSave();
      return newLocation;
    } catch (error) {
      console.error('Failed to move to location:', error);
      return null;
    }
  }

  // Update character stats
  updateCharacterStats(updates: Partial<GameStats>): void {
    if (!this.gameState) return;

    const currentStats = this.gameState.character.stats as GameStats;
    
    this.gameState = {
      ...this.gameState,
      character: {
        ...this.gameState.character,
        stats: {
          ...currentStats,
          ...updates
        }
      }
    };

    this.scheduleSave();
  }

  // Update reputation
  updateReputation(faction: keyof GameReputation, change: number): void {
    if (!this.gameState) return;

    const currentRep = this.gameState.character.reputation as GameReputation;
    const newRepValue = Math.max(-100, Math.min(100, currentRep[faction] + change));
    
    this.gameState = {
      ...this.gameState,
      character: {
        ...this.gameState.character,
        reputation: {
          ...currentRep,
          [faction]: newRepValue
        }
      }
    };

    this.scheduleSave();
  }

  // Add item to inventory
  addItemToInventory(itemId: string, quantity: number = 1): boolean {
    if (!this.gameState) return false;

    const existingItemIndex = this.gameState.inventory.findIndex(item => item.itemId === itemId);
    let newInventory;
    
    if (existingItemIndex >= 0) {
      // Update existing item quantity
      newInventory = [...this.gameState.inventory];
      newInventory[existingItemIndex] = {
        ...newInventory[existingItemIndex],
        quantity: newInventory[existingItemIndex].quantity + quantity
      };
    } else {
      // Add new item
      newInventory = [...this.gameState.inventory, {
        itemId,
        quantity,
        equipped: false
      }];
    }

    this.gameState = {
      ...this.gameState,
      inventory: newInventory
    };

    this.scheduleSave();
    return true;
  }

  // Remove item from inventory
  removeItemFromInventory(itemId: string, quantity: number = 1): boolean {
    if (!this.gameState) return false;

    const itemIndex = this.gameState.inventory.findIndex(item => item.itemId === itemId);
    if (itemIndex === -1) return false;

    const item = this.gameState.inventory[itemIndex];
    
    if (item.quantity <= quantity) {
      this.gameState.inventory.splice(itemIndex, 1);
    } else {
      item.quantity -= quantity;
    }

    this.scheduleSave();
    return true;
  }

  // Set game flag
  setGameFlag(key: string, value: any): void {
    if (!this.gameState) return;

    this.gameState.gameFlags[key] = value;
    this.scheduleSave();
  }

  // Get game flag
  getGameFlag(key: string, defaultValue: any = null): any {
    if (!this.gameState) return defaultValue;
    return this.gameState.gameFlags[key] ?? defaultValue;
  }

  // Set temporary effect
  setTemporaryEffect(key: string, value: any, duration?: number): void {
    if (!this.gameState) return;

    const effect: { value: any; expires?: Date } = { value };
    
    if (duration) {
      effect.expires = new Date(Date.now() + duration);
    }

    this.gameState.temporaryEffects[key] = effect;
    this.scheduleSave();
  }

  // Get temporary effect
  getTemporaryEffect(key: string): any {
    if (!this.gameState) return null;

    const effect = this.gameState.temporaryEffects[key];
    if (!effect) return null;

    // Check if effect has expired
    if (effect.expires && effect.expires < new Date()) {
      delete this.gameState.temporaryEffects[key];
      this.scheduleSave();
      return null;
    }

    return effect.value;
  }

  // Schedule auto-save (debounced)
  private scheduleSave(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    this.saveTimeout = setTimeout(() => {
      this.saveGame();
    }, 2000); // Save after 2 seconds of inactivity
  }

  // Save game state to server
  async saveGame(): Promise<boolean> {
    if (!this.gameState) return false;

    try {
      const response = await fetch('/api/game/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          characterId: this.gameState.character.id,
          gameState: this.gameState
        })
      });

      if (response.ok) {
        this.gameState.lastSaveTime = new Date();
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to save game:', error);
      return false;
    }
  }

  // Manual save
  async manualSave(): Promise<boolean> {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
    
    return await this.saveGame();
  }

  // Helper method to fetch location data
  private async fetchLocation(locationId: string): Promise<Location> {
    const response = await fetch(`/api/locations/${locationId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch location: ${locationId}`);
    }
    return response.json();
  }

  // Helper method to fetch NPC data
  async fetchNPC(npcId: string): Promise<NPC | null> {
    try {
      const response = await fetch(`/api/npcs/${npcId}`);
      if (!response.ok) return null;
      return response.json();
    } catch (error) {
      console.error('Failed to fetch NPC:', error);
      return null;
    }
  }

  // Helper method to fetch item data
  async fetchItem(itemId: string): Promise<Item | null> {
    try {
      const response = await fetch(`/api/items/${itemId}`);
      if (!response.ok) return null;
      return response.json();
    } catch (error) {
      console.error('Failed to fetch item:', error);
      return null;
    }
  }

  // Get NPCs in current location
  async getNPCsInCurrentLocation(): Promise<NPC[]> {
    if (!this.gameState) return [];

    try {
      const response = await fetch(`/api/npcs/location/${this.gameState.currentLocation.id}`);
      if (!response.ok) return [];
      return response.json();
    } catch (error) {
      console.error('Failed to fetch NPCs in location:', error);
      return [];
    }
  }

  // Get world memory
  getWorldMemory(): WorldMemory | null {
    return this.gameState?.worldMemory || null;
  }

  // Process an object interaction using the resolver
  processInteraction(
    intent: IntentEnum,
    objectArchetypeId: string,
    additionalContext: Record<string, any> = {}
  ): Outcome | null {
    if (!this.gameState) return null;
    
    // Ensure worldMemory exists
    if (!this.gameState.worldMemory) {
      this.gameState.worldMemory = createInitialWorldMemory();
    }

    // Find the object archetype
    const archetype = OBJECT_ARCHETYPES.find(a => a.id === objectArchetypeId);
    if (!archetype) {
      console.warn(`Unknown object archetype: ${objectArchetypeId}`);
      return null;
    }

    // Build player signal from current character state
    const stats = this.gameState.character.stats as GameStats;
    const reputation = this.gameState.character.reputation as GameReputation;
    
    const recentActions = this.gameState.worldMemory.interactionHistory
      .slice(-5)
      .map(h => `${h.intent} on ${h.objectId}`);

    const playerSignal = createPlayerSignalFromStats(
      intent,
      {
        quickness: stats.quickness,
        endurance: stats.endurance,
        agility: stats.agility,
        speed: stats.speed,
        strength: stats.strength,
        mathLogic: stats.mathLogic,
        linguistic: stats.linguistic,
        presence: stats.presence,
        fortitude: stats.fortitude,
        musicCreative: stats.musicCreative,
        faith: stats.faith,
        karma: stats.karma,
        resonance: stats.resonance,
        luck: stats.luck,
        chi: stats.chi,
        nagual: stats.nagual,
        ashe: stats.ashe
      },
      {
        faculty: reputation.faculty / 100,
        students: reputation.students / 100,
        mysterious: reputation.mysterious / 100
      },
      recentActions
    );

    // Add context like faction permissions
    const context = {
      ...additionalContext,
      factionPermission: Math.max(
        reputation.faculty / 100,
        reputation.students / 100,
        reputation.mysterious / 100
      ),
      playerReputation: (reputation.faculty + reputation.students + reputation.mysterious) / 300
    };

    // Resolve the interaction
    const outcome = resolveInteraction(
      playerSignal,
      archetype,
      this.gameState.worldMemory,
      context
    );

    // Update world memory with the outcome
    this.gameState = {
      ...this.gameState,
      worldMemory: updateWorldMemory(
        this.gameState.worldMemory,
        outcome,
        objectArchetypeId,
        this.gameState.currentLocation.id
      )
    };

    this.scheduleSave();
    return outcome;
  }

  // Get active mythic flags
  getActiveMythicFlags(): { id: string; description: string }[] {
    if (!this.gameState) return [];
    
    const activeFlags: { id: string; description: string }[] = [];
    
    for (const flag of MYTHIC_FLAGS) {
      if (this.gameState.worldMemory.activeMythicFlags[flag.id]) {
        activeFlags.push({
          id: flag.id,
          description: flag.description
        });
      }
    }
    
    return activeFlags;
  }

  // Get current corridor state for a location
  getCorridorState(locationId?: string): { visualShift?: string; audioShift?: string; accessShift?: string } | null {
    if (!this.gameState) return null;
    
    const locId = locationId || this.gameState.currentLocation.id;
    return this.gameState.worldMemory.corridorState[locId] || null;
  }

  // Get misread count
  getMisreadCount(): number {
    return this.gameState?.worldMemory.misreads || 0;
  }

  // Get faction tensions
  getFactionTensions(): Record<string, number> {
    return this.gameState?.worldMemory.factionTension || {};
  }

  // Check if a specific mythic flag is active
  isMythicFlagActive(flagId: string): boolean {
    return this.gameState?.worldMemory.activeMythicFlags[flagId] || false;
  }

  // Get corridor mutation description for current location
  getCorridorDescription(): string[] {
    if (!this.gameState) return [];
    
    const corridorState = this.getCorridorState();
    if (!corridorState) return [];
    
    const descriptions: string[] = [];
    
    if (corridorState.visualShift) {
      const visualDescriptions: Record<string, string> = {
        'lights_dim': 'The lights flicker and dim, casting long shadows.',
        'shadows_lengthen': 'Shadows seem to stretch unnaturally across the walls.',
        'symbols_glow': 'Strange symbols pulse with a faint, ethereal glow.',
        'eyes_follow': 'You feel watched. Portraits and windows seem to track your movement.'
      };
      descriptions.push(visualDescriptions[corridorState.visualShift] || corridorState.visualShift);
    }
    
    if (corridorState.audioShift) {
      const audioDescriptions: Record<string, string> = {
        'silence_deepen': 'An unnatural silence blankets the area. Even your footsteps seem muted.',
        'whispers_echo': 'Faint whispers echo through the corridors, just beyond comprehension.',
        'resonance_hum': 'A low, thrumming resonance vibrates through the air.',
        'murmurs_surround': 'Hushed conversations fall silent as you approach, only to resume behind you.'
      };
      descriptions.push(audioDescriptions[corridorState.audioShift] || corridorState.audioShift);
    }
    
    return descriptions;
  }

  // =====================
  // Research Notebook Methods
  // =====================

  // Get the research notebook
  getResearchNotebook(): ResearchNotebook | null {
    return this.gameState?.researchNotebook || null;
  }

  // Create a new research note
  createResearchNote(
    title: string,
    content: string,
    tags: string[] = [],
    citations: string[] = []
  ): ResearchNote | null {
    if (!this.gameState) return null;
    
    // Ensure notebook exists
    if (!this.gameState.researchNotebook) {
      this.gameState.researchNotebook = createInitialNotebook(this.gameState.character.id);
    }

    const note = createNote(title, content, tags, citations);
    this.gameState = {
      ...this.gameState,
      researchNotebook: addNote(this.gameState.researchNotebook, note)
    };

    this.scheduleSave();
    return note;
  }

  // Update an existing note
  updateResearchNote(noteId: string, updates: Partial<ResearchNote>): boolean {
    if (!this.gameState?.researchNotebook) return false;

    this.gameState = {
      ...this.gameState,
      researchNotebook: updateNote(this.gameState.researchNotebook, noteId, updates)
    };

    this.scheduleSave();
    return true;
  }

  // Delete a note
  deleteResearchNote(noteId: string): boolean {
    if (!this.gameState?.researchNotebook) return false;

    this.gameState = {
      ...this.gameState,
      researchNotebook: deleteNote(this.gameState.researchNotebook, noteId)
    };

    this.scheduleSave();
    return true;
  }

  // Mark note as read
  markNoteRead(noteId: string): boolean {
    if (!this.gameState?.researchNotebook) return false;

    this.gameState = {
      ...this.gameState,
      researchNotebook: markNoteAsRead(this.gameState.researchNotebook, noteId)
    };

    this.scheduleSave();
    return true;
  }

  // Toggle note bookmark
  toggleNoteBookmark(noteId: string): boolean {
    if (!this.gameState?.researchNotebook) return false;

    this.gameState = {
      ...this.gameState,
      researchNotebook: toggleBookmark(this.gameState.researchNotebook, noteId)
    };

    this.scheduleSave();
    return true;
  }

  // Search notes
  searchResearchNotes(query: string): ResearchNote[] {
    if (!this.gameState?.researchNotebook) return [];
    return searchNotes(this.gameState.researchNotebook, query);
  }

  // Get notes by tag
  getNotesByTag(tag: string): ResearchNote[] {
    if (!this.gameState?.researchNotebook) return [];
    return getNotesByTag(this.gameState.researchNotebook, tag);
  }

  // Get related notes for current subject/location
  getRelatedNotesForContext(tags: string[]): ResearchNote[] {
    if (!this.gameState?.researchNotebook) return [];
    return getRelatedNotes(this.gameState.researchNotebook, tags);
  }

  // Get all notes
  getAllNotes(): ResearchNote[] {
    return this.gameState?.researchNotebook?.notes || [];
  }

  // Get a specific note
  getNote(noteId: string): ResearchNote | null {
    return this.gameState?.researchNotebook?.notes.find(n => n.id === noteId) || null;
  }

  // Get notebook statistics
  getNotebookStats(): string {
    if (!this.gameState?.researchNotebook) return 'No research notebook found.';
    return formatNotebookStats(this.gameState.researchNotebook);
  }

  // Format a note for display
  formatNote(noteId: string): string {
    const note = this.getNote(noteId);
    if (!note) return 'Note not found.';
    return formatNoteForDisplay(note);
  }

  // Get study recommendations
  getStudyRecommendations(enrolledCourses: Array<{ id: string; name: string; department: string }> = []): StudyRecommendation[] {
    if (!this.gameState?.researchNotebook) return [];
    return generateStudyRecommendations(
      this.gameState.researchNotebook,
      enrolledCourses,
      [],
      []
    );
  }

  // Get student progress
  getStudentProgress(): StudentProgress {
    if (!this.gameState?.researchNotebook) {
      return {
        totalNotesCreated: 0,
        totalNotesRead: 0,
        chaptersCompleted: 0,
        assignmentsCompleted: 0,
        lecturesAttended: 0,
        overallProgress: 0,
        subjectProgress: {},
        studyStreak: 0
      };
    }
    return calculateStudentProgress(this.gameState.researchNotebook, [], [], []);
  }

  // -----------------------------
  // Dialogue Modulation System
  // -----------------------------

  // Get dialogue axes based on current character stats
  getDialogueAxes(): DialogueAxes | null {
    if (!this.gameState) return null;
    const stats = this.gameState.character.stats as GameStats;
    return calculateDialogueAxes(stats);
  }

  // Get current tone profile for NPC interactions
  getToneProfile(): ToneProfile | null {
    const axes = this.getDialogueAxes();
    if (!axes) return null;
    return calculateToneProfile(axes);
  }

  // Detect active stat conflicts that will cause NPC misreads
  getActiveStatConflicts(): StatConflict[] {
    const axes = this.getDialogueAxes();
    if (!axes) return [];
    return detectStatConflicts(axes);
  }

  // Get faction-specific misread for an NPC
  getFactionMisread(factionId: string): string | null {
    const axes = this.getDialogueAxes();
    if (!axes) return null;
    return detectFactionMisread(axes, factionId);
  }

  // Calculate affinity with all Academy factions
  getFactionAffinities(): Record<string, number> {
    const axes = this.getDialogueAxes();
    if (!axes) return {};
    return calculateFactionAffinity(axes);
  }

  // Modulate a dialogue line based on current build
  modulateNpcDialogue(baseLine: string, npcFactionId?: string): ModulatedDialogue {
    const axes = this.getDialogueAxes();
    if (!axes) {
      return {
        originalLine: baseLine,
        modulatedLine: baseLine,
        toneAdjustments: [],
        activeMisreads: []
      };
    }
    return modulateDialogue(baseLine, axes, npcFactionId);
  }

  // Generate ambient descriptions based on stat conflicts
  getConflictAmbience(): string[] {
    const conflicts = this.getActiveStatConflicts();
    return generateConflictAmbience(conflicts);
  }

  // -----------------------------
  // Faction Reputation System
  // -----------------------------

  // Get faction reputation from game flags
  getFactionReputation(factionId: string): number {
    if (!this.gameState) return 0.5; // Neutral default
    return this.getGameFlag(`faction_rep_${factionId}`, 0.5);
  }

  // Update faction reputation
  updateFactionReputation(factionId: string, delta: number): void {
    if (!this.gameState) return;
    const current = this.getFactionReputation(factionId);
    const newValue = Math.max(0, Math.min(1, current + delta));
    this.setGameFlag(`faction_rep_${factionId}`, newValue);
  }

  // Get all faction reputations
  getAllFactionReputations(): Record<string, number> {
    const reputations: Record<string, number> = {};
    for (const faction of ACADEMY_FACTIONS) {
      reputations[faction.id] = this.getFactionReputation(faction.id);
    }
    return reputations;
  }

  // Track collapsed misreads
  getMisreadsCollapsed(): number {
    return this.getGameFlag('misreads_collapsed', 0);
  }

  incrementMisreadsCollapsed(): void {
    const current = this.getMisreadsCollapsed();
    this.setGameFlag('misreads_collapsed', current + 1);
  }

  // Track if contradictions have been embraced
  hasEmbracedContradictions(): boolean {
    return this.getGameFlag('contradictions_embraced', false);
  }

  setContradictionsEmbraced(value: boolean): void {
    this.setGameFlag('contradictions_embraced', value);
  }

  // -----------------------------
  // Ambient World & Confluence Hall
  // -----------------------------

  // Get ambient signals for a specific faction based on reputation
  getAmbientSignalsForFaction(factionId: string): AmbientSignal[] {
    const reputation = this.getFactionReputation(factionId);
    return getAmbientSignals(factionId, reputation);
  }

  // Generate Confluence Hall state based on current build
  getConfluenceHallState(): ConfluenceHallState | null {
    if (!this.gameState) return null;
    
    const stats = this.gameState.character.stats as GameStats;
    const factionReps = this.getAllFactionReputations();
    
    return generateConfluenceHallState(
      {
        mathLogic: stats.mathLogic,
        linguistic: stats.linguistic,
        presence: stats.presence,
        fortitude: stats.fortitude,
        musicCreative: stats.musicCreative,
        resonance: stats.resonance,
        faith: stats.faith
      },
      factionReps
    );
  }

  // Check for GED Culmination (graduation)
  checkGedCulmination(): DepartureVector | null {
    if (!this.gameState) return null;
    
    const stats = this.gameState.character.stats as GameStats;
    const misreadsCollapsed = this.getMisreadsCollapsed();
    const contradictionsEmbraced = this.hasEmbracedContradictions();
    
    return determineGedCulmination(
      {
        mathLogic: stats.mathLogic,
        linguistic: stats.linguistic,
        presence: stats.presence,
        fortitude: stats.fortitude,
        musicCreative: stats.musicCreative,
        resonance: stats.resonance,
        faith: stats.faith
      },
      misreadsCollapsed,
      contradictionsEmbraced
    );
  }

  // Generate location description with faction ambient signals
  generateAmbientLocationDescription(baseDescription: string): string {
    if (!this.gameState) return baseDescription;
    
    // Check if in Confluence Hall
    const currentLocation = this.gameState.currentLocation?.id;
    if (currentLocation === 'confluence_hall' || currentLocation === 'shared_corridor') {
      const hallState = this.getConfluenceHallState();
      if (hallState) {
        let description = hallState.ambientDescription;
        if (hallState.interferencePatterns.length > 0) {
          description += '\n\n' + hallState.interferencePatterns.join('\n');
        }
        description += '\n\n' + hallState.npcBehavior;
        return description;
      }
    }
    
    // Add ambient signals from dominant factions
    const factionReps = this.getAllFactionReputations();
    const dominantFactions = Object.entries(factionReps)
      .filter(([, rep]) => Math.abs(rep - 0.5) > 0.2)
      .sort(([, a], [, b]) => Math.abs(b - 0.5) - Math.abs(a - 0.5))
      .slice(0, 2);
    
    let ambientDescription = baseDescription;
    
    for (const [factionId] of dominantFactions) {
      const signals = this.getAmbientSignalsForFaction(factionId);
      if (signals.length > 0) {
        ambientDescription += '\n\n' + signals[0].description;
      }
    }
    
    // Add stat conflict ambience
    const conflictAmbience = this.getConflictAmbience();
    if (conflictAmbience.length > 0) {
      ambientDescription += '\n\n' + conflictAmbience[0];
    }
    
    return ambientDescription;
  }

  // -----------------------------
  // Crisis Intervention System (Watchwarden Hale)
  // -----------------------------

  // Check if crisis mode is currently active
  isCrisisModeActive(): boolean {
    return this.gameState?.crisisMode?.active || false;
  }

  // Get current crisis mode state
  getCrisisModeState(): CrisisModeState | null {
    return this.gameState?.crisisMode || null;
  }

  // Assess player input for escalation markers
  assessPlayerInput(input: string): EscalationAssessment {
    return assessEscalation(input);
  }

  // Trigger crisis intervention if needed
  triggerCrisisIntervention(input: string): InterventionSequence | null {
    if (!this.gameState) return null;
    
    const assessment = assessEscalation(input);
    
    if (assessment.detected && assessment.responseType !== 'none') {
      this.gameState = {
        ...this.gameState,
        crisisMode: activateCrisisMode(this.gameState.crisisMode, assessment)
      };
      
      return this.gameState.crisisMode.interventionSequence || null;
    }
    
    return null;
  }

  // Get Watchwarden Hale's dialogue for a specific intervention phase
  getHaleDialogue(phase: string): string[] {
    const responseType = this.gameState?.crisisMode?.assessment?.responseType;
    return getDialogueForPhase(phase, responseType as any);
  }

  // Advance to next intervention phase
  advanceInterventionPhase(): string | null {
    if (!this.gameState?.crisisMode?.interventionSequence) return null;
    
    const sequence = this.gameState.crisisMode.interventionSequence;
    const currentPhaseId = this.gameState.crisisMode.currentPhase;
    const phases = sequence.phases;
    
    const currentIndex = phases.findIndex(p => p.phase.id === currentPhaseId);
    if (currentIndex < 0 || currentIndex >= phases.length - 1) {
      // No more phases, resolve crisis mode
      this.resolveCrisis();
      return null;
    }
    
    const nextPhase = phases[currentIndex + 1].phase.id;
    
    this.gameState = {
      ...this.gameState,
      crisisMode: {
        ...this.gameState.crisisMode,
        currentPhase: nextPhase
      }
    };
    
    return nextPhase;
  }

  // Resolve crisis mode and return to normal gameplay
  resolveCrisis(): void {
    if (!this.gameState) return;
    
    this.gameState = {
      ...this.gameState,
      crisisMode: resolveCrisisMode(this.gameState.crisisMode)
    };
    
    this.scheduleSave();
  }

  // Get Watchwarden Hale NPC data
  getWatchwardenHale(): typeof HALE_NPC {
    return HALE_NPC;
  }

  // Get Watchwarden Hale's profile
  getWatchwardenProfile(): typeof WATCHWARDEN_HALE {
    return WATCHWARDEN_HALE;
  }

  // Get available grounding exercises
  getGroundingExercises(): typeof GROUNDING_EXERCISES {
    return GROUNDING_EXERCISES;
  }

  // Generate Hale's entrance description
  generateHaleEntrance(): string[] {
    return [
      '',
      '═══════════════════════════════════════════════════════════════',
      '',
      'The terminal freezes. The ambient noise fades to silence.',
      'A low-frequency chime hums through the interface.',
      'The UI locks. A new window forces open.',
      '',
      'WATCHWARDEN AUTH ACCESS: LEVEL OMEGA',
      'DIRECTOR: ELIAS HALE — CRISIS OVERSIGHT',
      '',
      'A tall figure in dark, structured attire steps into frame.',
      'Sharp gaze, never wavering. Everything about him is purposeful.',
      '',
      '═══════════════════════════════════════════════════════════════',
      ''
    ];
  }

  // Generate Hale's exit description
  generateHaleExit(): string[] {
    return [
      '',
      'Watchwarden Hale steps back.',
      '"Take what you need from this moment. Then we continue."',
      '',
      'The terminal unlocks. Normal operations resume.',
      'But you know: he is watching. He is protecting.',
      '',
      '═══════════════════════════════════════════════════════════════',
      ''
    ];
  }
}

// Global game state manager instance
export const gameStateManager = new GameStateManager();

// Re-export types from interactionResolver for convenience
export type { WorldMemory, Outcome, IntentEnum, ObjectArchetype, AmbientSignal, ConfluenceHallState, DepartureVector };

// Re-export types from dialogueModulator for convenience
export type { DialogueAxes, ToneProfile, StatConflict, ModulatedDialogue };

// Re-export types from crisisIntervention for convenience
export type { CrisisModeState, EscalationAssessment, InterventionSequence };

// Re-export faction data for external use
export { ACADEMY_FACTIONS };

// Re-export Watchwarden Hale data for external use
export { HALE_NPC, WATCHWARDEN_HALE, GROUNDING_EXERCISES };