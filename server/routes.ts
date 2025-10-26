import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCharacterSchema } from "@shared/schema";
import { z } from "zod";
import { processNaturalLanguage, type GameContext } from "./nlp/commandProcessor";

// Character update validation schema
const characterUpdateSchema = z.object({
  name: z.string().optional(),
  currentLocation: z.string().optional(),
  stats: z.object({
    perception: z.number().optional(),
    intelligence: z.number().optional(),
    charisma: z.number().optional(),
    dexterity: z.number().optional(),
    strength: z.number().optional(),
    health: z.number().optional(),
    endurance: z.number().optional(),
  }).optional(),
  reputation: z.object({
    faculty: z.number().optional(),
    students: z.number().optional(),
    mysterious: z.number().optional(),
  }).optional(),
  energy: z.number().min(0).optional(),
  maxEnergy: z.number().min(1).optional(),
  inventory: z.array(z.object({
    itemId: z.string(),
    quantity: z.number().min(1),
    equipped: z.boolean().optional(),
  })).optional(),
  perks: z.array(z.string()).optional(),
  questProgress: z.record(z.any()).optional(),
  socialConnections: z.record(z.any()).optional(),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Character management routes
  app.get("/api/characters/:id", async (req, res) => {
    try {
      const character = await storage.getCharacter(req.params.id);
      if (!character) {
        return res.status(404).json({ error: "Character not found" });
      }
      res.json(character);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch character" });
    }
  });

  app.get("/api/characters/user/:userId", async (req, res) => {
    try {
      const characters = await storage.getCharactersByUser(req.params.userId);
      res.json(characters);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch characters" });
    }
  });

  app.post("/api/characters", async (req, res) => {
    try {
      const characterData = insertCharacterSchema.parse(req.body);
      const character = await storage.createCharacter(characterData);
      res.status(201).json(character);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid character data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create character" });
    }
  });

  app.put("/api/characters/:id", async (req, res) => {
    try {
      // Validate character update data with proper structure validation
      const validatedUpdates = characterUpdateSchema.parse(req.body);
      
      const character = await storage.updateCharacter(req.params.id, validatedUpdates);
      if (!character) {
        return res.status(404).json({ error: "Character not found" });
      }
      res.json(character);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid character update data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update character" });
    }
  });

  app.delete("/api/characters/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteCharacter(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Character not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete character" });
    }
  });

  // Location routes
  app.get("/api/locations/:id", async (req, res) => {
    try {
      const location = await storage.getLocation(req.params.id);
      if (!location) {
        return res.status(404).json({ error: "Location not found" });
      }
      res.json(location);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch location" });
    }
  });

  app.get("/api/locations", async (req, res) => {
    try {
      const locations = await storage.getAllLocations();
      res.json(locations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch locations" });
    }
  });

  // NPC routes
  app.get("/api/npcs/:id", async (req, res) => {
    try {
      const npc = await storage.getNPC(req.params.id);
      if (!npc) {
        return res.status(404).json({ error: "NPC not found" });
      }
      res.json(npc);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch NPC" });
    }
  });

  app.get("/api/npcs/location/:locationId", async (req, res) => {
    try {
      const npcs = await storage.getNPCsInLocation(req.params.locationId);
      res.json(npcs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch NPCs" });
    }
  });

  app.get("/api/npcs", async (req, res) => {
    try {
      const npcs = await storage.getAllNPCs();
      res.json(npcs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch NPCs" });
    }
  });

  // Item routes
  app.get("/api/items/:id", async (req, res) => {
    try {
      const item = await storage.getItem(req.params.id);
      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch item" });
    }
  });

  app.get("/api/items", async (req, res) => {
    try {
      const items = await storage.getAllItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch items" });
    }
  });

  // Game session routes
  app.post("/api/game/save", async (req, res) => {
    try {
      const { characterId, gameState } = req.body;
      if (!characterId || !gameState) {
        return res.status(400).json({ error: "Character ID and game state required" });
      }
      
      const session = await storage.saveGameSession(characterId, gameState);
      res.json(session);
    } catch (error) {
      res.status(500).json({ error: "Failed to save game session" });
    }
  });

  app.get("/api/game/load/:characterId", async (req, res) => {
    try {
      const session = await storage.getLatestGameSession(req.params.characterId);
      if (!session) {
        return res.status(404).json({ error: "No saved game found" });
      }
      res.json(session.sessionData);
    } catch (error) {
      res.status(500).json({ error: "Failed to load game session" });
    }
  });

  // Natural Language Processing route
  app.post("/api/nlp/process", async (req, res) => {
    try {
      const { input, context } = req.body;
      
      if (!input || typeof input !== 'string') {
        return res.status(400).json({ error: "Input text is required" });
      }
      
      if (!context) {
        return res.status(400).json({ error: "Game context is required" });
      }
      
      // Validate context structure
      const gameContext: GameContext = {
        currentLocation: context.currentLocation || 'Unknown',
        locationDescription: context.locationDescription || '',
        availableExits: context.availableExits || [],
        npcsPresent: context.npcsPresent || [],
        interactables: context.interactables || [],
        characterName: context.characterName || 'Player',
        characterClass: context.characterClass || 'Unknown',
        characterRace: context.characterRace || 'Unknown',
        characterFaction: context.characterFaction || 'Unknown',
        inventory: context.inventory || [],
        energy: context.energy || 100,
      };
      
      const result = await processNaturalLanguage(input, gameContext);
      res.json(result);
    } catch (error) {
      console.error('NLP processing error:', error);
      res.status(500).json({ 
        error: "Failed to process natural language input",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
