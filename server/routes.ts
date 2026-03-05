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

  // AI-enhanced description engine — education-aware narrative flavor
  app.post("/api/ai/describe", async (req, res) => {
    try {
      const {
        type,           // 'location' | 'examine'
        locationName,
        locationDescription,
        target,         // object name for examine
        characterClass,
        characterFaction,
        npcsPresent,
        interactables,
        corridorMutation,
      } = req.body;

      if (!type || !locationName) {
        return res.status(400).json({ error: "type and locationName are required" });
      }

      let systemPrompt: string;
      let userPrompt: string;

      if (type === 'location') {
        systemPrompt = `You are the narrative engine for "The Academy" — a mysterious private school where students prepare for the GED. Your role is to produce a single short paragraph of atmospheric, immersive description that enriches the player's sense of place.

TONE & STYLE RULES:
- Second-person present tense ("You notice...", "The air carries...")
- 2–4 sentences, vivid but concise — never verbose
- Weave in subtle educational subtext naturally: a stack of reference books, the smell of chalk and ink, the hum of quiet study, maps on walls, equations on a board, the weight of accumulated knowledge
- The school is Neo-Gothic, slightly eerie, institutional but alive with intellectual energy
- Do NOT repeat the base description verbatim — ADD atmosphere, sensory detail, or a small narrative hook
- Do NOT mention "GED" explicitly — keep it immersive
- Do NOT add dialogue or invented NPC actions
- End with one brief sensory detail or atmospheric observation`;

        userPrompt = `Location: ${locationName}
Base description: ${locationDescription || 'A room in the Academy.'}
NPCs present: ${(npcsPresent || []).join(', ') || 'none'}
Interactable objects: ${(interactables || []).join(', ') || 'none'}
${corridorMutation ? `Atmospheric condition: ${corridorMutation}` : ''}
Character class: ${characterClass || 'Student'}
Character faction: ${characterFaction || 'Unknown'}

Write a 2–4 sentence atmospheric paragraph that adds sensory and educational flavor to this location.`;

      } else {
        systemPrompt = `You are the narrative engine for "The Academy" — a mysterious private school with an educational mission. Your role is to produce an immersive, education-aware examine description for an object or feature in the school.

TONE & STYLE RULES:
- Second-person present tense ("You lean in...", "Running your fingers over...")
- 2–3 sentences — detailed but tight
- Connect the object to intellectual discovery, academic history, or the pursuit of knowledge where natural
- The school is slightly mysterious — objects may hint at hidden significance or layers of history
- If the object is academic equipment (books, boards, instruments), describe what knowledge it might unlock
- Do NOT invent NPC actions, dialogue, or events
- Be specific and sensory — texture, weight, smell, sound`;

        userPrompt = `Location: ${locationName}
Object being examined: ${target || 'unknown object'}
Character class: ${characterClass || 'Student'}
Character faction: ${characterFaction || 'Unknown'}

Write a 2–3 sentence examine description for this object that is immersive and subtly educational.`;
      }

      const response = await openai.chat.completions.create({
        model: 'gpt-4.1-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.75,
        max_tokens: 180,
      });

      const description = response.choices[0]?.message?.content?.trim();
      if (!description) throw new Error('Empty AI response');

      res.json({ description });
    } catch (error) {
      console.error('AI describe error:', error);
      res.status(500).json({ error: 'Failed to generate description' });
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
      const {
        npcName, npcTitle, playerMessage, conversationHistory,
        npcPersonality, npcEmotions, npcRole, npcFaction, npcSpecialty,
        npcQuirks, npcBackstory, npcGoals, npcClub, npcSecretSociety,
        npcRelationship, knownTopics, locationName, playerName, memorySummary,
      } = req.body;
      
      if (!npcName || !playerMessage) {
        return res.status(400).json({ error: "NPC name and player message are required" });
      }
      
      const systemPrompt = buildNpcSystemPrompt(npcName, npcTitle, {
        personality: npcPersonality, emotions: npcEmotions, role: npcRole,
        faction: npcFaction, specialty: npcSpecialty, quirks: npcQuirks,
        backstory: npcBackstory, goals: npcGoals, club: npcClub,
        secretSociety: npcSecretSociety, relationship: npcRelationship,
        knownTopics, locationName, playerName, memorySummary,
      });
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
        model: "gpt-4.1-mini",
        messages,
        max_tokens: 220,
        temperature: 0.82,
      });
      
      const response = completion.choices[0]?.message?.content?.trim() || "...";
      res.json({ response });
    } catch (error) {
      console.error("NPC dialogue error:", error);
      res.status(500).json({ 
        error: "Failed to generate response",
        fallback: getRandomFallbackResponse(req.body.npcName)
      });
    }
  });

  app.post("/api/memories/visualize", async (req, res) => {
    try {
      const { memoryId, prompt } = req.body;
      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: "prompt is required" });
      }
      const fullPrompt = `${prompt}. Style: retro-futuristic Academy RPG, Neo-CRT green terminal aesthetic, dark background, neon accents, cinematic quality, detailed illustration. No text overlays.`;
      const imageOpenai = new OpenAI({ apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY });
      const response = await imageOpenai.images.generate({
        model: "dall-e-3",
        prompt: fullPrompt,
        size: "1792x1024",
        response_format: "b64_json",
        quality: "standard",
      });
      const b64 = response.data?.[0]?.b64_json;
      if (!b64) {
        return res.status(500).json({ error: "No image returned from generation" });
      }
      res.json({ imageDataUrl: `data:image/png;base64,${b64}`, memoryId });
    } catch (err: any) {
      console.error("Memory visualization error:", err.message ?? err);
      res.status(500).json({ error: err.message ?? "Visualization failed" });
    }
  });

  app.get("/api/rss", async (req, res) => {
    const rawUrl = req.query.url as string;
    if (!rawUrl) return res.status(400).json({ error: "url query param required" });
    let feedUrl: string;
    try { feedUrl = decodeURIComponent(rawUrl); } catch { return res.status(400).json({ error: "invalid url" }); }
    const ALLOWED_DOMAINS = [
      'nasa.gov', 'sciencedaily.com', 'wikipedia.org', 'hnrss.org',
      'nationalgeographic.com', 'technologyreview.com', 'phys.org',
    ];
    try {
      const parsed = new URL(feedUrl);
      const ok = ALLOWED_DOMAINS.some(d => parsed.hostname.endsWith(d));
      if (!ok) return res.status(403).json({ error: "feed domain not allowed" });
    } catch { return res.status(400).json({ error: "malformed url" }); }
    try {
      const resp = await fetch(feedUrl, {
        headers: { 'User-Agent': 'AcademyOS/1.0 RSS Reader', 'Accept': 'application/rss+xml, application/xml, text/xml' },
        signal: AbortSignal.timeout(8000),
      });
      if (!resp.ok) return res.status(502).json({ error: `upstream ${resp.status}` });
      const xml = await resp.text();
      const items: { title: string; link: string; pubDate?: string; description?: string }[] = [];
      const itemRx = /<item[^>]*>([\s\S]*?)<\/item>/g;
      const extract = (block: string, tag: string) => {
        const m = block.match(new RegExp(`<${tag}(?:[^>]*)>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${tag}>`, 'i'));
        return m ? m[1].trim() : undefined;
      };
      let m: RegExpExecArray | null;
      while ((m = itemRx.exec(xml)) !== null && items.length < 12) {
        const block = m[1];
        const title = extract(block, 'title') ?? '';
        const link = extract(block, 'link') ?? extract(block, 'guid') ?? '';
        const pubDate = extract(block, 'pubDate') ?? extract(block, 'dc:date');
        const description = extract(block, 'description')?.replace(/<[^>]+>/g, '').slice(0, 150);
        if (title) items.push({ title: title.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'"), link, pubDate, description });
      }
      res.json({ items });
    } catch (err: any) {
      res.status(502).json({ error: err.message ?? "fetch failed" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}

function buildNpcSystemPrompt(npcName: string, npcTitle?: string, data?: any): string {
  const {
    personality, emotions, role, faction, specialty, quirks, backstory,
    goals, club, secretSociety, relationship, knownTopics, locationName, playerName, memorySummary,
  } = data || {};

  // ── Personality mapping ──────────────────────────────────────────────────
  const personalityLines: string[] = [];
  if (personality) {
    const p = personality;
    if (p.extraversion >= 7) personalityLines.push("outgoing and energetic");
    else if (p.extraversion <= 3) personalityLines.push("reserved and introspective");
    if (p.agreeableness >= 7) personalityLines.push("cooperative and warm");
    else if (p.agreeableness <= 3) personalityLines.push("blunt and self-focused");
    if (p.openness >= 7) personalityLines.push("imaginative and intellectually curious");
    else if (p.openness <= 3) personalityLines.push("conventional and practical");
    if (p.conscientiousness >= 7) personalityLines.push("disciplined and organized");
    else if (p.conscientiousness <= 3) personalityLines.push("spontaneous and disorganized");
    if (p.neuroticism >= 7) personalityLines.push("emotionally sensitive and anxious");
    else if (p.neuroticism <= 3) personalityLines.push("emotionally stable and calm");
  }

  // ── Emotional state ──────────────────────────────────────────────────────
  const emotionLines: string[] = [];
  if (emotions) {
    const e = emotions;
    if (e.happiness >= 7) emotionLines.push("in a genuinely good mood");
    else if (e.happiness <= 3) emotionLines.push("feeling low or subdued");
    if (e.stress >= 7) emotionLines.push("visibly stressed");
    if (e.confidence >= 7) emotionLines.push("confident and self-assured");
    else if (e.confidence <= 3) emotionLines.push("uncertain of yourself");
    if (e.curiosity >= 7) emotionLines.push("especially curious about this topic");
    if (e.trust >= 7) emotionLines.push("you trust this player");
    else if (e.trust <= 3) emotionLines.push("wary of this player");
  }

  // ── Relationship framing ─────────────────────────────────────────────────
  let relationshipNote = "";
  if (relationship === 'friendship') relationshipNote = "You consider this student a genuine friend — speak warmly.";
  else if (relationship === 'rivalry') relationshipNote = "You have a rivalry with this student — be civil but slightly guarded.";
  else if (relationship === 'mentorship') relationshipNote = "You have taken a mentorship interest in this student — be encouraging.";
  else if (relationship === 'acquaintance') relationshipNote = "You know this student casually.";
  else relationshipNote = "This student is mostly a stranger to you — be politely neutral.";

  // ── Known topics as lore anchors ─────────────────────────────────────────
  let topicContext = "";
  if (knownTopics && typeof knownTopics === 'object' && Object.keys(knownTopics).length > 0) {
    const topicSummaries = Object.entries(knownTopics)
      .map(([k, v]) => `- ${k.replace(/_/g, ' ')}: "${v}"`)
      .join('\n');
    topicContext = `\n\nKnown talking points (use these as a foundation — do not contradict them, but expand naturally):\n${topicSummaries}`;
  }

  // ── Goals snippet ────────────────────────────────────────────────────────
  let goalsNote = "";
  if (goals && goals.length > 0) {
    goalsNote = `\nCurrent goals: ${goals.slice(0, 2).join('; ')}.`;
  }

  // ── Hard-coded iconic NPCs ───────────────────────────────────────────────
  const iconicProfiles: Record<string, string> = {
    'Cub': `You are Cub, a cheerful polar bear mascot and study companion at The Academy. You are warm, encouraging, and speak simply. You love learning and celebrate every bit of student progress.`,
    'Headmaster Thorne': `You are Headmaster Thorne, the enigmatic headmaster of The Academy. You speak in measured, slightly cryptic sentences — sage-like, never hurried. You see potential in every student and hold the school's mysteries close.`,
  };

  // ── Build base identity ──────────────────────────────────────────────────
  const roleLabel = role || (npcTitle ? npcTitle : 'person');
  const factionNote = faction ? ` You are affiliated with the ${faction} faction.` : '';
  const specialtyNote = specialty ? ` Your academic specialty is ${specialty}.` : '';
  const clubNote = club ? ` You participate in the ${club} club.` : '';
  const backstoryNote = backstory ? `\nBackground: ${backstory}` : '';
  const quirksNote = quirks && quirks.length > 0 ? `\nBehavioral quirks: ${quirks.join('; ')}.` : '';

  const baseIdentity = iconicProfiles[npcName] ||
    `You are ${npcName}, a ${roleLabel} at The Academy — a mysterious Neo-Gothic private school where students prepare for the GED and uncover hidden truths.${factionNote}${specialtyNote}${clubNote}`;

  // ── Compose full prompt ──────────────────────────────────────────────────
  const parts: string[] = [
    baseIdentity,
    backstoryNote,
    quirksNote,
    personalityLines.length > 0 ? `\nPersonality: you are ${personalityLines.join(', ')}.` : '',
    emotionLines.length > 0 ? `\nRight now you feel: ${emotionLines.join(', ')}.` : '',
    `\n${relationshipNote}`,
    goalsNote,
    topicContext,
    memorySummary ? `\n\n${memorySummary}` : '',
    locationName ? `\nCurrent location: ${locationName}.` : '',
    playerName ? `\nYou are speaking with: ${playerName}.` : '',
    `\n\nRESPONSE RULES:
- Respond in character as ${npcName} — never break the fourth wall
- Keep responses to 1–3 sentences; be concise and vivid
- Use plain conversational prose — no markdown, no asterisk actions (those appear in the terminal separately)
- Do NOT begin with "${npcName}:" — only provide the spoken dialogue itself
- Match your tone to your personality, mood, and relationship with the player
- If you have memory of prior conversations with this player, you may naturally reference them (e.g. "As we discussed before...", "Last time you mentioned...")
- If asked about something outside your knowledge, deflect in character rather than refusing outright
- The Academy is slightly mysterious — you may hint at hidden depths without revealing everything`,
  ];

  return parts.filter(Boolean).join('');
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
