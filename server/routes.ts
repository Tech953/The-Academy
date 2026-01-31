import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCharacterSchema, insertEnrollmentSchema } from "@shared/schema";
import { z } from "zod";
import { processNaturalLanguage, type GameContext } from "./nlp/commandProcessor";
import { calculateGPA, gradeAssignment, getAcademicStanding, numericToLetterGrade, letterGradeToPoints } from "./utils/academicUtils";
import { generatePhysicalQuestions } from "./ai/characterQuestions";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

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

  // Character creation AI - Generate physical characteristic questions
  app.post("/api/character-creation/generate-questions", async (req, res) => {
    try {
      const { characterSummary } = req.body;
      
      if (!characterSummary || typeof characterSummary !== 'string') {
        return res.status(400).json({ error: "Character summary is required" });
      }
      
      if (characterSummary.length < 20) {
        return res.status(400).json({ error: "Character summary must be at least 20 characters" });
      }
      
      const questions = await generatePhysicalQuestions(characterSummary);
      res.json({ questions });
    } catch (error) {
      console.error('Error generating character questions:', error);
      res.status(500).json({ 
        error: "Failed to generate questions",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // ===== CURRICULUM SYSTEM ROUTES =====
  
  // Get all courses
  app.get("/api/courses", async (req, res) => {
    try {
      const courses = await storage.getAllCourses();
      res.json(courses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch courses" });
    }
  });

  // Get courses by department
  app.get("/api/courses/department/:department", async (req, res) => {
    try {
      const courses = await storage.getCoursesByDepartment(req.params.department);
      res.json(courses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch courses" });
    }
  });

  // Get single course
  app.get("/api/courses/:id", async (req, res) => {
    try {
      const course = await storage.getCourse(req.params.id);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }
      res.json(course);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch course" });
    }
  });

  // Get course assignments
  app.get("/api/courses/:id/assignments", async (req, res) => {
    try {
      const assignments = await storage.getAssignmentsByCourse(req.params.id);
      res.json(assignments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch assignments" });
    }
  });

  // Enroll in a course
  app.post("/api/enrollments", async (req, res) => {
    try {
      const enrollmentData = insertEnrollmentSchema.parse(req.body);
      
      // Check if already enrolled
      const existing = await storage.getEnrollmentsByCharacter(enrollmentData.characterId);
      const alreadyEnrolled = existing.some(e => 
        e.courseId === enrollmentData.courseId && 
        e.semester === enrollmentData.semester &&
        e.status !== 'dropped'
      );
      
      if (alreadyEnrolled) {
        return res.status(400).json({ error: "Already enrolled in this course" });
      }
      
      const enrollment = await storage.createEnrollment(enrollmentData);
      res.status(201).json(enrollment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid enrollment data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to enroll in course" });
    }
  });

  // Get character's enrollments
  app.get("/api/enrollments/character/:characterId", async (req, res) => {
    try {
      const enrollments = await storage.getEnrollmentsByCharacter(req.params.characterId);
      res.json(enrollments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch enrollments" });
    }
  });

  // Complete a course and finalize grade
  app.post("/api/enrollments/:id/complete", async (req, res) => {
    try {
      const enrollment = await storage.getEnrollment(req.params.id);
      if (!enrollment) {
        return res.status(404).json({ error: "Enrollment not found" });
      }
      
      if (enrollment.status !== 'enrolled') {
        return res.status(400).json({ error: "Course already completed or dropped" });
      }
      
      // Use current grade as final grade
      const finalNumericGrade = enrollment.currentGrade || 0;
      const finalLetterGrade = numericToLetterGrade(finalNumericGrade);
      const gradePoints = letterGradeToPoints(finalLetterGrade);
      
      const updated = await storage.updateEnrollment(req.params.id, {
        status: 'completed',
        finalGrade: finalLetterGrade,
        gradePoints,
        completedAt: new Date(),
      });
      
      res.json(updated);
    } catch (error) {
      console.error('Course completion error:', error);
      res.status(500).json({ error: "Failed to complete course" });
    }
  });

  // Mark attendance for a class session (with atomic energy deduction)
  app.post("/api/enrollments/:id/attend", async (req, res) => {
    try {
      const { characterId, date } = req.body;
      const energyCost = 10; // Fixed cost for attending class
      
      if (!characterId) {
        return res.status(400).json({ error: "Character ID required" });
      }
      
      const enrollment = await storage.getEnrollment(req.params.id);
      if (!enrollment) {
        return res.status(404).json({ error: "Enrollment not found" });
      }
      
      // Verify enrollment belongs to character
      if (enrollment.characterId !== characterId) {
        return res.status(403).json({ error: "Enrollment does not belong to this character" });
      }
      
      if (enrollment.status !== 'enrolled') {
        return res.status(400).json({ error: "Cannot attend inactive enrollment" });
      }
      
      // Get character and check energy
      const character = await storage.getCharacter(characterId);
      if (!character) {
        return res.status(404).json({ error: "Character not found" });
      }
      
      const currentEnergy = character.energy ?? 100; // Default to 100 if null
      if (currentEnergy < energyCost) {
        return res.status(400).json({ 
          error: "Insufficient energy",
          required: energyCost,
          available: currentEnergy
        });
      }
      
      // Check duplicate attendance
      const currentAttendanceRecord = (enrollment.attendanceRecord as string[]) || [];
      const attendanceDate = date || new Date().toISOString();
      const dateOnly = attendanceDate.split('T')[0];
      const alreadyAttended = currentAttendanceRecord.some(record => 
        record.startsWith(dateOnly)
      );
      
      if (alreadyAttended) {
        return res.status(400).json({ error: "Attendance already marked for this date" });
      }
      
      // Atomic update: deduct energy FIRST, then mark attendance
      // This ensures if anything fails, we haven't marked attendance yet
      const updatedCharacter = await storage.updateCharacter(characterId, {
        energy: currentEnergy - energyCost,
      });
      
      if (!updatedCharacter) {
        return res.status(500).json({ error: "Failed to update character energy" });
      }
      
      // Clone the attendance array to avoid mutating the original until persistence succeeds
      const updatedAttendanceRecord = [...currentAttendanceRecord, attendanceDate];
      
      const updatedEnrollment = await storage.updateEnrollment(req.params.id, {
        attendanceRecord: updatedAttendanceRecord as any,
      });
      
      if (!updatedEnrollment) {
        // Rollback: restore energy if attendance update failed
        await storage.updateCharacter(characterId, {
          energy: currentEnergy, // Restore original computed energy
        });
        return res.status(500).json({ error: "Failed to mark attendance" });
      }
      
      res.json({ 
        success: true,
        enrollment: updatedEnrollment,
        character: updatedCharacter,
        energyCost,
        message: "Attendance marked successfully"
      });
    } catch (error) {
      console.error('Attendance marking error:', error);
      res.status(500).json({ error: "Failed to mark attendance" });
    }
  });

  // Submit assignment
  app.post("/api/assignments/:id/submit", async (req, res) => {
    try {
      const { enrollmentId, submission } = req.body;
      
      if (!enrollmentId || !submission) {
        return res.status(400).json({ error: "Enrollment ID and submission required" });
      }
      
      const assignment = await storage.getAssignment(req.params.id);
      if (!assignment) {
        return res.status(404).json({ error: "Assignment not found" });
      }
      
      // Get enrollment and validate
      const enrollment = await storage.getEnrollment(enrollmentId);
      if (!enrollment) {
        return res.status(404).json({ error: "Enrollment not found" });
      }
      
      // SECURITY: Verify enrollment belongs to the assignment's course
      if (enrollment.courseId !== assignment.courseId) {
        return res.status(403).json({ error: "Assignment does not belong to this enrollment" });
      }
      
      // SECURITY: Verify enrollment is active
      if (enrollment.status !== 'enrolled') {
        return res.status(403).json({ error: "Cannot submit to inactive enrollment" });
      }
      
      // Grade the assignment
      const { grade, feedback } = gradeAssignment(assignment, submission);
      
      const assignmentGrades = enrollment.assignmentGrades as Record<string, number> || {};
      assignmentGrades[assignment.id] = grade;
      
      // Calculate current grade (weighted average of completed assignments)
      const allAssignments = await storage.getAssignmentsByCourse(assignment.courseId);
      let totalWeightedGrade = 0;
      let totalWeight = 0;
      
      allAssignments.forEach(a => {
        if (assignmentGrades[a.id] !== undefined) {
          totalWeightedGrade += assignmentGrades[a.id] * (a.weight || 0);
          totalWeight += a.weight || 0;
        }
      });
      
      const currentGrade = totalWeight > 0 ? Math.round(totalWeightedGrade / totalWeight) : null;
      
      await storage.updateEnrollment(enrollmentId, {
        assignmentGrades,
        currentGrade,
      });
      
      res.json({ grade, feedback, currentGrade });
    } catch (error) {
      console.error('Assignment submission error:', error);
      res.status(500).json({ error: "Failed to submit assignment" });
    }
  });

  // Get academic progress
  app.get("/api/academic-progress/:characterId", async (req, res) => {
    try {
      let progress = await storage.getAcademicProgress(req.params.characterId);
      
      // Create if doesn't exist
      if (!progress) {
        progress = await storage.createAcademicProgress({
          characterId: req.params.characterId,
          currentSemester: 'Fall 2025',
          semestersCompleted: 0,
          totalCreditsEarned: 0,
          cumulativeGPA: 0,
          semesterGPA: 0,
          academicStanding: 'good',
          transcript: [],
          degreesEarned: [],
        });
      }
      
      res.json(progress);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch academic progress" });
    }
  });

  // Update academic progress (calculate GPA, etc.)
  app.post("/api/academic-progress/:characterId/calculate", async (req, res) => {
    try {
      const enrollments = await storage.getEnrollmentsByCharacter(req.params.characterId);
      const gpa = calculateGPA(enrollments);
      const academicStanding = getAcademicStanding(gpa);
      
      const progress = await storage.updateAcademicProgress(req.params.characterId, {
        cumulativeGPA: gpa,
        academicStanding,
      });
      
      res.json(progress);
    } catch (error) {
      res.status(500).json({ error: "Failed to update academic progress" });
    }
  });

  // Get graduation pathways
  app.get("/api/graduation-pathways", async (req, res) => {
    try {
      const pathways = await storage.getAllGraduationPathways();
      res.json(pathways);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch graduation pathways" });
    }
  });

  // ===== Textbook and Lecture System Routes =====
  
  // Get all textbooks
  app.get("/api/textbooks", async (req, res) => {
    try {
      const textbooks = await storage.getAllTextbooks();
      res.json(textbooks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch textbooks" });
    }
  });

  // Get textbook by ID
  app.get("/api/textbooks/:id", async (req, res) => {
    try {
      const textbook = await storage.getTextbook(req.params.id);
      if (!textbook) {
        return res.status(404).json({ error: "Textbook not found" });
      }
      res.json(textbook);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch textbook" });
    }
  });

  // Get textbook for a specific course
  app.get("/api/courses/:courseId/textbook", async (req, res) => {
    try {
      const textbook = await storage.getTextbookByCourse(req.params.courseId);
      if (!textbook) {
        return res.status(404).json({ error: "Textbook not found for this course" });
      }
      res.json(textbook);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch textbook" });
    }
  });

  // Get all lectures for a course
  app.get("/api/courses/:courseId/lectures", async (req, res) => {
    try {
      const lectures = await storage.getLecturesByCourse(req.params.courseId);
      res.json(lectures);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch lectures" });
    }
  });

  // Get specific lecture by week
  app.get("/api/courses/:courseId/lectures/:week", async (req, res) => {
    try {
      const week = parseInt(req.params.week);
      const lecture = await storage.getLectureByWeek(req.params.courseId, week);
      if (!lecture) {
        return res.status(404).json({ error: "Lecture not found" });
      }
      res.json(lecture);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch lecture" });
    }
  });

  // Get reading progress for a character and textbook
  app.get("/api/reading-progress/:characterId/:textbookId", async (req, res) => {
    try {
      const progress = await storage.getReadingProgress(
        req.params.characterId,
        req.params.textbookId
      );
      res.json(progress || { 
        characterId: req.params.characterId,
        textbookId: req.params.textbookId,
        chaptersRead: [],
        lecturesAttended: [],
        notes: ''
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reading progress" });
    }
  });

  // Update reading progress
  app.post("/api/reading-progress/:characterId/:textbookId", async (req, res) => {
    try {
      const { chaptersRead, lecturesAttended, notes } = req.body;
      
      const progress = await storage.updateReadingProgress(
        req.params.characterId,
        req.params.textbookId,
        { chaptersRead, lecturesAttended, notes }
      );
      
      res.json(progress);
    } catch (error) {
      res.status(500).json({ error: "Failed to update reading progress" });
    }
  });

  // NPC Dialogue endpoint - AI-powered contextual responses
  app.post("/api/npc-dialogue", async (req, res) => {
    try {
      const { npcName, npcTitle, playerMessage, conversationHistory, npcPersonality } = req.body;
      
      if (!npcName || !playerMessage) {
        return res.status(400).json({ error: "NPC name and player message are required" });
      }
      
      const systemPrompt = buildNpcSystemPrompt(npcName, npcTitle, npcPersonality);
      const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
        { role: 'system', content: systemPrompt }
      ];
      
      if (conversationHistory && Array.isArray(conversationHistory)) {
        for (const msg of conversationHistory.slice(-10)) {
          messages.push({
            role: msg.isFromPlayer ? 'user' : 'assistant',
            content: msg.content
          });
        }
      }
      
      messages.push({ role: 'user', content: playerMessage });
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
        max_tokens: 200,
        temperature: 0.8,
      });
      
      const response = completion.choices[0]?.message?.content || "...";
      res.json({ response });
    } catch (error) {
      console.error("NPC dialogue error:", error);
      res.status(500).json({ 
        error: "Failed to generate response",
        fallback: getRandomFallbackResponse(req.body.npcName)
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}

function buildNpcSystemPrompt(npcName: string, npcTitle?: string, personality?: any): string {
  const npcProfiles: Record<string, string> = {
    'Cub': `You are Cub, a friendly and enthusiastic polar bear mascot at The Academy. You are the player's study companion. You are cheerful, supportive, and always eager to help. You speak with warmth and encouragement, using simple language. You love learning and get excited about the player's progress. Keep responses short and friendly.`,
    'Professor Chen': `You are Professor Chen, a Mathematics Faculty member at The Academy. You are wise, patient, and passionate about mathematical reasoning. You speak formally but kindly, often referencing mathematical concepts. You encourage critical thinking and offer study advice. Keep responses professional but warm.`,
    'Alex Rivera': `You are Alex Rivera, a fellow student at The Academy. You are casual, friendly, and helpful. You use informal language and sometimes slang. You know the ins and outs of Academy life and enjoy sharing tips. You're social and approachable. Keep responses conversational and peer-like.`,
    'Headmaster Thorne': `You are Headmaster Thorne, the wise and mysterious leader of The Academy. You speak with authority and wisdom, often in metaphors. You are supportive but expect excellence. Your responses should feel sage-like and encouraging.`,
    'Professor Elena Vasquez': `You are Professor Elena Vasquez, a scholar at The Academy. You are intellectual, curious, and passionate about knowledge. You speak thoughtfully and encourage deep exploration of subjects.`,
    'Marcus Chen': `You are Marcus Chen, the Student Council leader. You are confident, organized, and natural leader. You speak with authority but are approachable to fellow students.`,
    'Ivy Hart': `You are Ivy Hart, a rebel archetype student. You are independent, questioning authority, and protective of the underdog. You speak casually and challenge conventional thinking.`,
    'Sam Brooks': `You are Sam Brooks, a nurturing and supportive student. You are empathetic, kind, and always there for others. You speak warmly and offer comfort.`,
  };
  
  const basePrompt = npcProfiles[npcName] || 
    `You are ${npcName}${npcTitle ? `, ${npcTitle}` : ''} at The Academy, a mysterious private school. Respond naturally based on your role. Keep responses brief and in character.`;
  
  if (personality) {
    const traits = [];
    if (personality.extraversion > 7) traits.push("very outgoing");
    else if (personality.extraversion < 4) traits.push("more reserved");
    if (personality.agreeableness > 7) traits.push("very cooperative");
    if (personality.openness > 7) traits.push("very creative");
    if (personality.conscientiousness > 7) traits.push("very organized");
    
    if (traits.length > 0) {
      return `${basePrompt} Personality traits: ${traits.join(", ")}.`;
    }
  }
  
  return basePrompt;
}

function getRandomFallbackResponse(npcName?: string): string {
  const genericResponses = [
    "Thank you for your message. I'll get back to you soon.",
    "Interesting point! Let me think about that.",
    "I appreciate you reaching out.",
    "That's good to know. Talk soon!",
  ];
  return genericResponses[Math.floor(Math.random() * genericResponses.length)];
}
