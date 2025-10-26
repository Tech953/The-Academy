import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export interface PhysicalQuestion {
  question: string;
  category: string; // "appearance", "build", "features", "mannerisms", etc.
  suggestedAnswers?: string[]; // Optional preset answers the player can choose from
}

export async function generatePhysicalQuestions(
  characterSummary: string
): Promise<PhysicalQuestion[]> {
  try {
    const systemPrompt = `You are a character creation assistant for a text-based RPG called "The Academy" - a mysterious private school with 144 students. Your job is to generate 4-6 thoughtful, contextual questions about a character's physical appearance and traits based on their background description.

GUIDELINES:
1. Read the character summary carefully and ask questions that make sense given their background
2. Questions should cover: appearance, build, distinctive features, mannerisms, style
3. Make questions specific and interesting - not generic
4. For each question, provide 3-5 suggested answers as options
5. Questions should help flesh out the character's visual identity
6. Keep the tone consistent with a mysterious academy setting

Return ONLY valid JSON in this exact format:
{
  "questions": [
    {
      "question": "What is most striking about your appearance?",
      "category": "appearance",
      "suggestedAnswers": ["option1", "option2", "option3", "option4"]
    }
  ]
}`;

    const userPrompt = `CHARACTER SUMMARY:
"${characterSummary}"

Generate 4-6 contextual questions about this character's physical traits and appearance. Make the questions and suggested answers specific to their background.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.8,
      max_tokens: 800,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from AI');
    }

    const parsed = JSON.parse(content);
    
    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      throw new Error('Invalid AI response format');
    }

    return parsed.questions;
  } catch (error) {
    console.error('Error generating physical questions:', error);
    
    // Fallback to generic questions if AI fails
    return getFallbackQuestions();
  }
}

// Fallback questions when AI is unavailable
function getFallbackQuestions(): PhysicalQuestion[] {
  return [
    {
      question: "What is your character's build?",
      category: "build",
      suggestedAnswers: ["Athletic and muscular", "Lean and agile", "Average build", "Stocky and solid", "Tall and lanky", "Small and compact"]
    },
    {
      question: "What is most noticeable about your face?",
      category: "appearance",
      suggestedAnswers: ["Piercing eyes", "Strong jawline", "Gentle features", "Sharp cheekbones", "Warm smile", "Intense gaze"]
    },
    {
      question: "How do you typically dress?",
      category: "style",
      suggestedAnswers: ["Formal and proper", "Casual and comfortable", "Dark and mysterious", "Practical and functional", "Stylish and modern", "Traditional and classic"]
    },
    {
      question: "Do you have any distinctive features?",
      category: "features",
      suggestedAnswers: ["A notable scar", "Unique tattoo", "Striking hair color", "Unusual eye color", "Birthmark", "None in particular"]
    },
    {
      question: "What's your typical demeanor?",
      category: "mannerisms",
      suggestedAnswers: ["Confident and assertive", "Calm and collected", "Energetic and animated", "Quiet and observant", "Friendly and approachable", "Reserved and distant"]
    }
  ];
}
