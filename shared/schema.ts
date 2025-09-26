import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, jsonb, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

// Game character saves
export const characters = pgTable("characters", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  name: text("name").notNull(),
  race: text("race").notNull(),
  class: text("class").notNull(),
  subClass: text("sub_class"),
  faction: text("faction").notNull(),
  background: text("background"),
  currentLocation: text("current_location").default("main_lobby"),
  stats: jsonb("stats").notNull(),
  reputation: jsonb("reputation").notNull(),
  energy: integer("energy").default(100),
  maxEnergy: integer("max_energy").default(100),
  inventory: jsonb("inventory").default("[]"),
  perks: jsonb("perks").default("[]"),
  questProgress: jsonb("quest_progress").default("{}"),
  socialConnections: jsonb("social_connections").default("{}"),
  createdAt: timestamp("created_at").defaultNow(),
  lastPlayed: timestamp("last_played").defaultNow(),
});

// Game locations (Academy rooms)
export const locations = pgTable("locations", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // "classroom", "hallway", "dormitory", etc.
  exits: jsonb("exits").notNull(), // { "north": "cafeteria", "east": "library" }
  npcs: jsonb("npcs").default("[]"), // Array of NPC IDs present
  items: jsonb("items").default("[]"), // Available items
  interactables: jsonb("interactables").default("[]"), // Examine-able objects
  requirements: jsonb("requirements").default("{}"), // Access requirements
});

// NPCs (the 144 Academy students + faculty)
export const npcs = pgTable("npcs", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  title: text("title"), // "Student", "Professor", etc.
  race: text("race"),
  class: text("class"),
  faction: text("faction"),
  personality: jsonb("personality").notNull(),
  backstory: text("backstory"),
  currentLocation: text("current_location"),
  schedule: jsonb("schedule").default("{}"), // When they're where
  relationships: jsonb("relationships").default("{}"), // Relations with other NPCs
  dialogue: jsonb("dialogue").notNull(), // Conversation trees
  stats: jsonb("stats").default("{}"),
  isTeacher: boolean("is_teacher").default(false),
});

// Items and inventory
export const items = pgTable("items", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // "book", "tool", "key", "consumable"
  weight: integer("weight").default(1),
  value: integer("value").default(0),
  properties: jsonb("properties").default("{}"), // Special properties
  canUse: boolean("can_use").default(false),
  isQuestItem: boolean("is_quest_item").default(false),
});

// Game sessions for auto-save
export const gameSessions = pgTable("game_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  characterId: varchar("character_id").references(() => characters.id),
  sessionData: jsonb("session_data").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Schemas for inserts
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertCharacterSchema = createInsertSchema(characters).omit({
  id: true,
  createdAt: true,
  lastPlayed: true,
});

export const insertLocationSchema = createInsertSchema(locations);
export const insertNpcSchema = createInsertSchema(npcs);
export const insertItemSchema = createInsertSchema(items);

// Type definitions
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Character = typeof characters.$inferSelect;
export type InsertCharacter = z.infer<typeof insertCharacterSchema>;
export type Location = typeof locations.$inferSelect;
export type NPC = typeof npcs.$inferSelect;
export type Item = typeof items.$inferSelect;
export type GameSession = typeof gameSessions.$inferSelect;

// Game state interfaces
export interface GameStats {
  perception: number;
  intelligence: number;
  charisma: number;
  dexterity: number;
  strength: number;
  health: number;
  endurance: number;
}

export interface GameReputation {
  faculty: number;
  students: number;
  mysterious: number;
}

export interface GameInventoryItem {
  itemId: string;
  quantity: number;
  equipped?: boolean;
}

export interface GamePerk {
  perkId: string;
  level: number;
  unlockedAt: string;
}

export interface SocialConnection {
  npcId: string;
  relationship: number; // -100 to 100
  trust: number; // 0 to 100
  lastInteraction?: string;
  sharedSecrets?: string[];
}

export interface QuestProgress {
  [questId: string]: {
    status: 'available' | 'active' | 'completed' | 'failed';
    progress: number;
    variables?: Record<string, any>;
  };
}
