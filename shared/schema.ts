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

// Curriculum System Tables

// Course catalog
export const courses = pgTable("courses", {
  id: text("id").primaryKey(), // e.g., "HIST-101", "MYST-301"
  name: text("name").notNull(), // "Introduction to Academy History"
  department: text("department").notNull(), // "History", "Mysticism", "Combat", etc.
  level: integer("level").notNull(), // 100-level, 200-level, etc.
  credits: integer("credits").default(3),
  description: text("description").notNull(),
  syllabus: text("syllabus").notNull(), // Full course syllabus
  prerequisites: jsonb("prerequisites").default("[]"), // Array of course IDs
  difficulty: integer("difficulty").default(1), // 1-5 difficulty rating
  professorId: text("professor_id"), // NPC ID of the professor
  schedule: jsonb("schedule").notNull(), // Days/times the class meets
  maxStudents: integer("max_students").default(20),
  categoryTags: jsonb("category_tags").default("[]"), // "core", "elective", "major-requirement", etc.
});

// Student enrollments
export const enrollments = pgTable("enrollments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  characterId: varchar("character_id").references(() => characters.id).notNull(),
  courseId: text("course_id").references(() => courses.id).notNull(),
  semester: text("semester").notNull(), // "Fall 2025", "Spring 2026"
  status: text("status").default("enrolled"), // "enrolled", "dropped", "completed"
  attendanceRecord: jsonb("attendance_record").default("[]"), // Array of attendance dates
  currentGrade: integer("current_grade"), // 0-100
  finalGrade: text("final_grade"), // "A", "B+", "C", etc.
  gradePoints: integer("grade_points"), // Numeric grade value for GPA (4.0 scale * 100)
  assignmentGrades: jsonb("assignment_grades").default("{}"), // { assignmentId: grade }
  enrolledAt: timestamp("enrolled_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Assignments/coursework
export const assignments = pgTable("assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: text("course_id").references(() => courses.id).notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // "essay", "exam", "project", "participation"
  maxPoints: integer("max_points").default(100),
  weight: integer("weight").default(10), // Percentage of final grade
  dueDate: text("due_date"), // In-game date
  content: jsonb("content").notNull(), // Assignment details, questions, etc.
  requirements: jsonb("requirements").default("{}"), // Stat or skill requirements
});

// Graduation pathways and requirements
export const graduationPathways = pgTable("graduation_pathways", {
  id: text("id").primaryKey(), // "major-mysticism", "minor-history"
  name: text("name").notNull(), // "Bachelor of Mysticism"
  type: text("type").notNull(), // "major", "minor", "certificate"
  description: text("description").notNull(),
  requiredCredits: integer("required_credits").default(120),
  requiredCourses: jsonb("required_courses").notNull(), // Array of specific course IDs
  electiveCredits: integer("elective_credits").default(30),
  departmentRequirements: jsonb("department_requirements").default("{}"), // Credits per department
  minGPA: integer("min_gpa").default(200), // Minimum GPA * 100 (2.0 = 200)
});

// Character academic progress
export const academicProgress = pgTable("academic_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  characterId: varchar("character_id").references(() => characters.id).notNull().unique(),
  currentSemester: text("current_semester").default("Fall 2025"),
  semestersCompleted: integer("semesters_completed").default(0),
  totalCreditsEarned: integer("total_credits_earned").default(0),
  cumulativeGPA: integer("cumulative_gpa").default(0), // GPA * 100
  semesterGPA: integer("semester_gpa").default(0), // Current semester GPA * 100
  major: text("major"), // Pathway ID
  minor: text("minor"), // Pathway ID
  academicStanding: text("academic_standing").default("good"), // "good", "probation", "honors"
  transcript: jsonb("transcript").default("[]"), // Full course history
  degreesEarned: jsonb("degrees_earned").default("[]"), // Completed pathways
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
export const insertCourseSchema = createInsertSchema(courses);
export const insertEnrollmentSchema = createInsertSchema(enrollments).omit({
  id: true,
  enrolledAt: true,
  completedAt: true,
});
export const insertAssignmentSchema = createInsertSchema(assignments).omit({
  id: true,
});
export const insertGraduationPathwaySchema = createInsertSchema(graduationPathways);
export const insertAcademicProgressSchema = createInsertSchema(academicProgress).omit({
  id: true,
});

// Type definitions
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Character = typeof characters.$inferSelect;
export type InsertCharacter = z.infer<typeof insertCharacterSchema>;
export type Location = typeof locations.$inferSelect;
export type NPC = typeof npcs.$inferSelect;
export type Item = typeof items.$inferSelect;
export type GameSession = typeof gameSessions.$inferSelect;
export type Course = typeof courses.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Enrollment = typeof enrollments.$inferSelect;
export type InsertEnrollment = z.infer<typeof insertEnrollmentSchema>;
export type Assignment = typeof assignments.$inferSelect;
export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;
export type GraduationPathway = typeof graduationPathways.$inferSelect;
export type InsertGraduationPathway = z.infer<typeof insertGraduationPathwaySchema>;
export type AcademicProgress = typeof academicProgress.$inferSelect;
export type InsertAcademicProgress = z.infer<typeof insertAcademicProgressSchema>;

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

// Curriculum System Interfaces

export interface CourseSchedule {
  daysOfWeek: string[]; // ["Monday", "Wednesday", "Friday"]
  timeSlot: string; // "9:00 AM - 10:30 AM"
  location: string; // Location ID where class meets
}

export interface AttendanceRecord {
  date: string;
  attended: boolean;
  excused?: boolean;
}

export interface AssignmentContent {
  questions?: Array<{
    question: string;
    type: 'multiple-choice' | 'essay' | 'short-answer';
    options?: string[];
    correctAnswer?: string;
    points: number;
  }>;
  prompt?: string;
  requirements?: string[];
}

export interface TranscriptEntry {
  courseId: string;
  courseName: string;
  semester: string;
  credits: number;
  grade: string;
  gradePoints: number;
}

export interface DepartmentCredits {
  [department: string]: number; // e.g., { "Mysticism": 12, "History": 6 }
}

export interface GraduationRequirements {
  totalCredits: number;
  coreCredits: number;
  majorCredits: number;
  electiveCredits: number;
  minGPA: number;
  requiredCourses: string[];
}
