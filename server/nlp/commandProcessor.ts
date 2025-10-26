import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export interface GameContext {
  currentLocation: string;
  locationDescription: string;
  availableExits: string[];
  npcsPresent: string[];
  interactables: string[];
  characterName: string;
  characterClass: string;
  characterRace: string;
  characterFaction: string;
  inventory: string[];
  energy: number;
}

export interface ParsedCommand {
  action: string;
  target?: string;
  confidence: number;
  reasoning: string;
  alternativeActions?: string[];
}

const GAME_COMMANDS = {
  movement: ['north', 'south', 'east', 'west', 'up', 'down', 'enter', 'go'],
  observation: ['look', 'examine', 'inspect', 'search', 'check'],
  interaction: ['talk', 'speak', 'ask', 'tell', 'greet', 'converse'],
  inventory: ['inventory', 'items', 'possessions'],
  status: ['status', 'stats', 'character', 'self'],
  social: ['list', 'who', 'people', 'characters'],
  academic: ['grades', 'transcript', 'schedule', 'gpa', 'read'],
  meta: ['help', 'save', 'load', 'quit', 'exit', 'time', 'score', 'clear'],
};

export async function processNaturalLanguage(
  userInput: string,
  context: GameContext
): Promise<ParsedCommand> {
  try {
    const systemPrompt = `You are a command interpreter for a text-based RPG game called "The Academy" - a mysterious private school with 144 students and faculty. Your job is to interpret natural language input from players and convert it into structured game commands.

AVAILABLE COMMAND TYPES:
- Movement: north, south, east, west, up, down, enter (+ location name)
- Observation: look (at surroundings), examine (specific object/person)
- Interaction: talk (to NPC), ask (NPC about topic)
- Inventory: inventory, status
- Social: list (show people in location - use for "who's here?", "who else is around?", "show people", etc.)
- Academic: grades (view current course grades), transcript (view completed courses), schedule (view class schedule), gpa (view GPA and academic standing), read (read a textbook - requires textbook name/course name)
- Meta: help, save, load, quit, time, score, clear

CURRENT GAME CONTEXT:
Location: ${context.currentLocation}
Description: ${context.locationDescription}
Available exits: ${context.availableExits.join(', ') || 'none'}
NPCs present: ${context.npcsPresent.join(', ') || 'none'}
Objects you can examine: ${context.interactables.join(', ') || 'none'}
Character: ${context.characterName} (${context.characterRace} ${context.characterClass}, ${context.characterFaction} faction)

INSTRUCTIONS:
1. Interpret the player's natural language input
2. Map it to the most appropriate game action
3. Extract any targets (NPC names, directions, objects, topics)
4. Handle variations like "go to library" → action: "enter", target: "library"
5. Handle casual phrasings like "what's here?" → action: "look"
6. IMPORTANT: Questions about WHO is present ("who's around?", "who else is here?", "show me the people") → action: "list"
7. Questions about general surroundings ("what do I see?", "look around") → action: "look"
8. If unclear, suggest the most likely action with high confidence
9. Consider the context - if they ask about a specific person by name, use "talk" or "examine"
10. For inventory questions ("what am I carrying?", "check my stuff") → action: "inventory"
11. For status questions ("how am I doing?", "check myself") → action: "status"

Respond ONLY with valid JSON in this exact format:
{
  "action": "the game command (e.g., 'look', 'north', 'talk', 'examine')",
  "target": "the target of the action (e.g., NPC name, object, direction, or null if not applicable)",
  "confidence": 0.95,
  "reasoning": "brief explanation of interpretation",
  "alternativeActions": ["alternative1", "alternative2"]
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userInput }
      ],
      temperature: 0.3,
      max_tokens: 300,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from AI');
    }

    // Parse the JSON response
    const parsed = JSON.parse(content) as ParsedCommand;
    
    // Validate the response
    if (!parsed.action || parsed.confidence === undefined) {
      throw new Error('Invalid AI response format');
    }

    return parsed;
  } catch (error) {
    console.error('NLP processing error:', error);
    
    // Fallback to simple parsing if AI fails
    return fallbackParser(userInput, context);
  }
}

// Simple fallback parser when AI is unavailable
function fallbackParser(input: string, context: GameContext): ParsedCommand {
  const lowered = input.toLowerCase().trim();
  
  // Check for direction words
  const directions = ['north', 'south', 'east', 'west', 'up', 'down'];
  for (const dir of directions) {
    if (lowered.includes(dir)) {
      return {
        action: dir,
        confidence: 0.8,
        reasoning: 'Detected direction keyword',
      };
    }
  }
  
  // Check for common action words
  if (lowered.includes('look') || lowered.includes('see') || lowered.includes('around')) {
    return {
      action: 'look',
      confidence: 0.7,
      reasoning: 'Detected observation intent',
    };
  }
  
  if (lowered.includes('talk') || lowered.includes('speak') || lowered.includes('ask')) {
    // Try to find NPC name in input
    const npc = context.npcsPresent.find(name => 
      lowered.includes(name.toLowerCase().split(' ')[0])
    );
    return {
      action: 'talk',
      target: npc?.split(' ')[0],
      confidence: 0.7,
      reasoning: 'Detected conversation intent',
    };
  }
  
  if (lowered.includes('who') || lowered.includes('people') || lowered.includes('here')) {
    return {
      action: 'list',
      confidence: 0.7,
      reasoning: 'Detected social query',
    };
  }
  
  if (lowered.includes('inventory') || lowered.includes('items') || lowered.includes('carrying')) {
    return {
      action: 'inventory',
      confidence: 0.8,
      reasoning: 'Detected inventory request',
    };
  }
  
  if (lowered.includes('status') || lowered.includes('stats') || lowered.includes('me')) {
    return {
      action: 'status',
      confidence: 0.8,
      reasoning: 'Detected status request',
    };
  }
  
  // Default to help if we can't parse
  return {
    action: 'help',
    confidence: 0.3,
    reasoning: 'Could not parse command, showing help',
    alternativeActions: ['look', 'status', 'list'],
  };
}
