import { Character, Location, NPC, Item, GameStats, GameReputation, GameInventoryItem, SocialConnection } from "@shared/schema";

export interface GameState {
  character: Character;
  currentLocation: Location;
  inventory: GameInventoryItem[];
  locationHistory: string[];
  gameFlags: Record<string, any>;
  temporaryEffects: Record<string, { value: any; expires?: Date }>;
  lastSaveTime?: Date;
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
      lastSaveTime: new Date()
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
      
      // Update game state
      this.gameState.currentLocation = newLocation;
      this.gameState.character.currentLocation = locationId;
      this.gameState.locationHistory.push(locationId);
      
      // Keep location history to reasonable size
      if (this.gameState.locationHistory.length > 50) {
        this.gameState.locationHistory = this.gameState.locationHistory.slice(-50);
      }

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
    this.gameState.character.stats = {
      ...currentStats,
      ...updates
    };

    this.scheduleSave();
  }

  // Update reputation
  updateReputation(faction: keyof GameReputation, change: number): void {
    if (!this.gameState) return;

    const currentRep = this.gameState.character.reputation as GameReputation;
    currentRep[faction] = Math.max(-100, Math.min(100, currentRep[faction] + change));

    this.scheduleSave();
  }

  // Add item to inventory
  addItemToInventory(itemId: string, quantity: number = 1): boolean {
    if (!this.gameState) return false;

    const existingItem = this.gameState.inventory.find(item => item.itemId === itemId);
    
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      this.gameState.inventory.push({
        itemId,
        quantity,
        equipped: false
      });
    }

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
}

// Global game state manager instance
export const gameStateManager = new GameStateManager();