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
  characterSummary: text("character_summary"), // Player-written character description
  physicalTraits: jsonb("physical_traits").default("{}"), // AI-generated questions and player answers
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
// Legacy stats interface (for backward compatibility)
export interface LegacyGameStats {
  perception: number;
  intelligence: number;
  charisma: number;
  dexterity: number;
  strength: number;
  health: number;
  endurance: number;
}

// New comprehensive 17-stat system (matches shared/stats.ts)
export interface GameStats {
  // Physical (5 stats)
  quickness: number;
  endurance: number;
  agility: number;
  speed: number;
  strength: number;
  
  // Mental (5 stats)
  mathLogic: number;
  linguistic: number;
  presence: number;
  fortitude: number;
  musicCreative: number;
  
  // Spiritual (7 stats)
  faith: number;
  karma: number;
  resonance: number;
  luck: number;
  chi: number;
  nagual: number;
  ashe: number;
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

// Textbook and Lecture System Interfaces

export interface TextbookSection {
  title: string;
  content: string;
  keyPoints?: string[];
  examples?: string[];
}

export interface TextbookChapter {
  number: number;
  title: string;
  summary: string;
  sections: TextbookSection[];
  practiceProblems?: string[];
  reviewQuestions?: string[];
  relatedAssignments?: string[]; // Assignment IDs
}

export interface Lecture {
  id: string;
  courseId: string;
  week: number;
  title: string;
  topic: string;
  objectives: string[];
  content: string;
  keyTerms?: Array<{ term: string; definition: string }>;
  examples?: string[];
  homework?: string;
  relatedChapters?: number[]; // Chapter numbers
  duration: string; // e.g., "90 minutes"
}

export interface Textbook {
  id: string;
  courseId: string;
  courseName: string;
  department: string;
  authors: string[];
  edition: string;
  chapters: TextbookChapter[];
  glossary?: Array<{ term: string; definition: string }>;
  references?: string[];
}

export interface ReadingProgress {
  characterId: string;
  textbookId: string;
  chaptersRead: number[];
  lecturesAttended: string[];
  lastRead?: string;
  notes?: string;
}

// Research Notebook System - Educational Ecosystem

export interface ResearchNote {
  id: string;
  title: string;
  content: string;
  tags: string[];
  citations: string[];
  linkedResources: LinkedResource[];
  createdAt: string;
  updatedAt: string;
  isRead: boolean;
  priority: number; // For sorting/recommendations
}

export interface LinkedResource {
  type: 'chapter' | 'assignment' | 'lecture' | 'course' | 'note';
  resourceId: string;
  resourceName: string;
}

export interface NoteUsageTracking {
  noteId: string;
  readCount: number;
  lastRead?: string;
  markedComplete: boolean;
}

export interface StudyRecommendation {
  type: 'chapter' | 'assignment' | 'note' | 'lecture';
  resourceId: string;
  resourceName: string;
  reason: string;
  priority: number;
  unreadNotesCount: number;
  subject?: string;
}

export interface StudentProgress {
  totalNotesCreated: number;
  totalNotesRead: number;
  chaptersCompleted: number;
  assignmentsCompleted: number;
  lecturesAttended: number;
  overallProgress: number; // 0-100
  subjectProgress: Record<string, number>; // Per GED subject
  lastStudySession?: string;
  studyStreak: number; // Days in a row
}

export interface ResearchNotebook {
  characterId: string;
  notes: ResearchNote[];
  usageTracking: Record<string, NoteUsageTracking>;
  recentSearches: string[];
  bookmarks: string[]; // Note IDs
  preferences: {
    sortBy: 'date' | 'priority' | 'alphabetical';
    showCompleted: boolean;
    autoLinkNotes: boolean;
  };
}

// Engagement Tracking System - Academy OS Analytics

export interface EngagementEvent {
  id: string;
  type: 'textbook_open' | 'textbook_read' | 'chapter_complete' | 
        'note_create' | 'note_edit' | 'note_read' |
        'assignment_start' | 'assignment_submit' | 
        'exam_start' | 'exam_submit' |
        'lecture_attend' | 'session_start' | 'session_end';
  resourceId: string;
  timestamp: string;
  metadata: Record<string, unknown>;
}

export interface TextbookUsage {
  textbookId: string;
  accessCount: number;
  totalReadTime: number; // milliseconds
  chaptersCompleted: string[];
  lastAccessed: string | null;
}

export interface NotesUsage {
  noteId: string;
  createdAt: string | null;
  editCount: number;
  readCount: number;
  lastAccessed: string | null;
}

export interface AssignmentUsage {
  assignmentId: string;
  startedAt: string | null;
  completedAt: string | null;
  attempts: number;
  score: number | undefined;
  scores: number[]; // History of scores
  graded: boolean;
  lastAccessed: string | null;
}

export interface SessionStats {
  totalSessions: number;
  totalStudyTime: number; // milliseconds
  averageSessionLength: number;
  lastSessionStart: string | null;
  currentSessionStart: string | null;
}

export interface DailyStreak {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
}

export interface EngagementAnalytics {
  characterId: string;
  events: EngagementEvent[];
  textbookUsage: Record<string, TextbookUsage>;
  assignmentUsage: Record<string, AssignmentUsage>;
  notesUsage: Record<string, NotesUsage>;
  sessionStats: SessionStats;
  dailyStreak: DailyStreak;
}

export interface EngagementSummary {
  engagementLevel: 'low' | 'medium' | 'high' | 'excellent';
  engagementScore: number;
  totalTextbooksAccessed: number;
  totalChaptersCompleted: number;
  totalReadTime: number;
  totalAssignmentsCompleted: number;
  averageScore: number;
  totalNotes: number;
  totalNoteEdits: number;
  studyStreak: number;
  totalStudyTime: number;
  lastActive: string | null;
}

// Adaptive Recommendations System

export interface AdaptiveRecommendation {
  type: string;
  title: string;
  description: string;
  priority: number;
  resourceType: 'textbook' | 'chapter' | 'assignment' | 'lecture' | 'note' | 'course' | 'break';
  resourceId?: string;
  actionLabel: string;
  estimatedTime?: number; // minutes
}

export interface CourseProgress {
  courseId: string;
  courseName: string;
  subject: string;
  chaptersRead: number;
  totalChapters: number;
  assignmentsCompleted: number;
  totalAssignments: number;
  lecturesAttended: number;
  totalLectures: number;
  averageScore: number;
  lastAccessed: string | null;
}

export interface LearningPath {
  subject: string;
  currentLevel: number;
  targetLevel: number;
  milestones: Array<{
    level: number;
    title: string;
    requirements: string[];
    completed: boolean;
  }>;
  estimatedWeeks: number;
  startedAt: string;
  progress: number; // 0-100
}

// GED Textbook Content Structure

export type GEDSubjectKey = 'Mathematical Reasoning' | 'Language Arts' | 'Science' | 'Social Studies';
export type LangSubjectKey = 'Language: Spanish' | 'Language: French' | 'Language: German' | 'Language: Chinese';
export type AnySubjectKey = GEDSubjectKey | LangSubjectKey;
export type QuestionDifficulty = 'foundational' | 'standard' | 'extended';
export type QuestionType = 'mcq' | 'short_answer' | 'extended_response';

export interface GEDPracticeQuestion {
  id: string;
  question: string;
  type: QuestionType;
  choices?: { A: string; B: string; C: string; D: string };
  answer: string;          // 'A'|'B'|'C'|'D' for MCQ, free text otherwise
  explanation: string;
  difficulty: QuestionDifficulty;
  gedCode?: string;        // e.g. 'Q.1.a', 'RLA.2.1'
  skillNodeId?: string;    // links to SkillGraph node
}

export interface GEDLesson {
  number: number;          // within chapter
  title: string;
  gedCode: string;         // e.g. 'RLA.Ch1.L2'
  content: string;
  keyTerms?: string[];
  practiceQuestions: GEDPracticeQuestion[];
}

export interface GEDChapter {
  number: number;
  title: string;
  topics: string[];
  content: string;         // chapter overview / intro
  lessons?: GEDLesson[];
  practiceQuestions?: Array<{ question: string; answer: string }>;
}

export interface GEDTextbook {
  id: string;
  subject: AnySubjectKey;
  title: string;
  description?: string;
  chapters: GEDChapter[];
}

// ── Curriculum Progress Tracking ─────────────────────────────────────────────

export type CognitiveState = 'fractured' | 'integrating' | 'internalized' | 'untouched';

export interface LessonEcology {
  stability: number;    // 0–100 — knowledge durability; decays with time
  coherence: number;    // 0–100 — cross-domain integration strength
  strain: number;       // 0–100 — accumulated cognitive friction
  lastInteraction: string | null;
}

export interface LessonProgress {
  lessonCode: string;       // e.g. 'RLA.Ch1.L2'
  completed: boolean;
  quizScore?: number;       // 0–100
  attempts: number;
  lastAttemptAt?: string;
  // Reflection & resonance (from CSV mentor commentary integration)
  reflectionText?: string;      // learner-authored pre-lesson reflection
  preReadCommentary?: boolean;  // whether learner opened the mentor panel
  resonanceScore?: number;      // grows from reflection depth; amplifies mastery
  lastAccessed?: string;        // ISO timestamp; used for temporal drift
  // Knowledge ecology
  ecology?: LessonEcology;
}

export interface LearnerCognitiveModel {
  persistence: number;           // 0–1  — responds to difficulty by retrying
  abstractionComfort: number;    // 0–1  — handles conceptual vs concrete
  integrationTendency: number;   // 0–1  — naturally connects ideas cross-domain
  recoveryVelocity: number;      // 0–1  — how fast frustration resolves
  history: Array<{
    lessonCode: string;
    retries: number;
    reflectionLength: number;
    timeToSuccess: number | null;
    timestamp: string;
  }>;
}

export interface ChapterProgress {
  chapterKey: string;       // e.g. 'MATH.Ch3'
  lessonsCompleted: number;
  totalLessons: number;
  bestQuizAverage: number;  // 0–100
  mastered: boolean;        // all lessons ≥60% or all complete
}

export interface SubjectProgress {
  subject: GEDSubjectKey;
  chaptersCompleted: number;
  totalChapters: number;
  readinessScore: number;   // 0–100, GED readiness estimate
  passReady: boolean;       // readinessScore ≥ 70
}

export interface StudentCurriculumProgress {
  lessonProgress: Record<string, LessonProgress>;
  chapterProgress: Record<string, ChapterProgress>;
  totalXpEarned: number;
  lastStudiedAt: string;
  learnerModel?: LearnerCognitiveModel;
}
