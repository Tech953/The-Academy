import type { Textbook, TextbookChapter, Lecture } from '@shared/schema';
import type { Department } from './courseGenerator';
import { textbookCache, lectureCache } from './contentCache';

/**
 * Generate comprehensive textbooks with detailed chapters for all GED courses
 * Uses caching to avoid regenerating content for console memory optimization
 */
export function generateTextbooks(courses: Array<{ id: string; name: string; department: string; syllabus: string }>): Textbook[] {
  return courses.map(course => {
    // Check cache first for this specific textbook
    const cacheKey = `textbook-${course.id}`;
    const cached = textbookCache.get<Textbook>(cacheKey);
    if (cached) {
      return cached;
    }

    const chapters = generateChaptersForCourse(course.department as Department, course.name);
    
    const textbook: Textbook = {
      id: `textbook-${course.id}`,
      courseId: course.id,
      courseName: course.name,
      department: course.department,
      authors: getAuthorsForDepartment(course.department as Department),
      edition: '2024 GED Edition',
      chapters,
      glossary: generateGlossary(course.department as Department, course.name),
      references: generateReferences(course.department as Department),
    };

    // Store in cache for future access
    textbookCache.set(cacheKey, textbook);
    return textbook;
  });
}

/**
 * Get a single textbook by course ID with caching
 */
export function getTextbookByCourseId(courseId: string, courseName: string, department: string): Textbook | null {
  const cacheKey = `textbook-${courseId}`;
  return textbookCache.getOrCreate(cacheKey, () => {
    const chapters = generateChaptersForCourse(department as Department, courseName);
    return {
      id: `textbook-${courseId}`,
      courseId,
      courseName,
      department,
      authors: getAuthorsForDepartment(department as Department),
      edition: '2024 GED Edition',
      chapters,
      glossary: generateGlossary(department as Department, courseName),
      references: generateReferences(department as Department),
    };
  });
}

/**
 * Generate lectures for all courses
 * Uses caching to optimize memory usage for console platforms
 */
export function generateLectures(courses: Array<{ id: string; name: string; department: string }>): Lecture[] {
  const allLectures: Lecture[] = [];
  
  courses.forEach(course => {
    // Check cache for this course's lectures
    const cacheKey = `lectures-${course.id}`;
    let lectures = lectureCache.get<Lecture[]>(cacheKey);
    
    if (!lectures) {
      lectures = generateLecturesForCourse(course.id, course.name, course.department as Department);
      lectureCache.set(cacheKey, lectures);
    }
    
    allLectures.push(...lectures);
  });
  
  return allLectures;
}

/**
 * Get lectures for a specific course with caching
 */
export function getLecturesForCourse(courseId: string, courseName: string, department: string): Lecture[] {
  const cacheKey = `lectures-${courseId}`;
  return lectureCache.getOrCreate(cacheKey, () => {
    return generateLecturesForCourse(courseId, courseName, department as Department);
  });
}

function getAuthorsForDepartment(dept: Department): string[] {
  const authors: Record<Department, string[]> = {
    'Mathematical Reasoning': ['Dr. Sarah Martinez', 'Prof. James Chen', 'Dr. Emily Roberts'],
    'Language Arts': ['Dr. Michael Thompson', 'Prof. Jennifer Davis', 'Dr. Rachel Green'],
    'Science': ['Dr. David Wilson', 'Prof. Lisa Anderson', 'Dr. Robert Taylor'],
    'Social Studies': ['Dr. Patricia Moore', 'Prof. William Jackson', 'Dr. Maria Garcia'],
  };
  return authors[dept];
}

function generateChaptersForCourse(dept: Department, courseName: string): TextbookChapter[] {
  const chapterGenerators: Record<Department, (courseName: string) => TextbookChapter[]> = {
    'Mathematical Reasoning': generateMathChapters,
    'Language Arts': generateLanguageArtsChapters,
    'Science': generateScienceChapters,
    'Social Studies': generateSocialStudiesChapters,
  };
  
  return chapterGenerators[dept](courseName);
}

function generateMathChapters(courseName: string): TextbookChapter[] {
  const chaptersMap: Record<string, TextbookChapter[]> = {
    'Basic Math Skills': [
      {
        number: 1,
        title: 'Whole Numbers and Place Value',
        summary: 'Understanding place value, reading and writing whole numbers, and comparing numbers.',
        sections: [
          {
            title: 'Introduction to Place Value',
            content: 'Each digit in a number has a specific place value based on its position. The rightmost digit represents ones, the next represents tens, then hundreds, and so on. For example, in the number 3,456, the 6 is in the ones place, 5 in the tens place, 4 in the hundreds place, and 3 in the thousands place.',
            keyPoints: [
              'Place value determines the value of each digit',
              'Each place is 10 times the value of the place to its right',
              'Understanding place value is fundamental to all math operations',
            ],
            examples: [
              '4,567 = 4 thousands + 5 hundreds + 6 tens + 7 ones',
              '20,305 = 2 ten-thousands + 0 thousands + 3 hundreds + 0 tens + 5 ones',
            ],
          },
          {
            title: 'Comparing and Ordering Numbers',
            content: 'To compare numbers, start from the leftmost digit and compare place by place. The number with the greater digit in the highest place value is larger. Use symbols: > (greater than), < (less than), and = (equal to).',
            keyPoints: [
              'Compare digits from left to right',
              'Use < and > symbols correctly',
              'Ordering helps organize and understand number relationships',
            ],
            examples: [
              '5,432 > 5,234 (compare hundreds place)',
              '789 < 1,000 (4 digits is greater than 3 digits)',
            ],
          },
        ],
        practiceProblems: [
          'Write 45,309 in expanded form',
          'Compare: 3,456 ___ 3,546',
          'Order from least to greatest: 789, 987, 798, 879',
        ],
        reviewQuestions: [
          'What is the value of the 7 in 17,894?',
          'How do you know if one number is greater than another?',
        ],
      },
      {
        number: 2,
        title: 'Addition and Subtraction',
        summary: 'Mastering addition and subtraction with carrying and borrowing.',
        sections: [
          {
            title: 'Addition with Regrouping',
            content: 'When adding numbers, align digits by place value. If a column sum exceeds 9, carry the extra digit to the next column. This process is called regrouping or carrying.',
            keyPoints: [
              'Align numbers by place value',
              'Add from right to left',
              'Carry when sum is 10 or more',
            ],
            examples: [
              '347 + 286 = 633 (carry the 1 from 7+6=13)',
              '1,458 + 3,769 = 5,227 (multiple carries)',
            ],
          },
          {
            title: 'Subtraction with Borrowing',
            content: 'When subtracting, if a digit in the top number is smaller than the corresponding digit below, borrow from the next left column. Reduce that column by 1 and add 10 to the current column.',
            keyPoints: [
              'Borrow when top digit is smaller',
              'Subtract from right to left',
              'Check answer by adding',
            ],
            examples: [
              '543 - 278 = 265 (borrow from tens and hundreds)',
              '1,000 - 456 = 544 (multiple borrows from zeros)',
            ],
          },
        ],
        practiceProblems: [
          'Solve: 5,678 + 3,945',
          'Solve: 8,234 - 5,678',
          'Word problem: If you had $4,567 and spent $2,879, how much do you have left?',
        ],
      },
    ],
    'Pre-Algebra': [
      {
        number: 1,
        title: 'Introduction to Variables',
        summary: 'Understanding variables as symbols that represent unknown values.',
        sections: [
          {
            title: 'What is a Variable?',
            content: 'A variable is a letter or symbol that represents a number we don\'t know yet. Common variables are x, y, and z, but any letter can be used. Variables allow us to write general rules and solve problems where we need to find unknown values.',
            keyPoints: [
              'Variables represent unknown numbers',
              'Any letter can be a variable',
              'Variables help us solve real-world problems',
            ],
            examples: [
              'If x = 5, then 2x = 10',
              'In "y + 3 = 7", y represents the unknown value 4',
            ],
          },
        ],
      },
    ],
  };
  
  return chaptersMap[courseName] || generateDefaultChapters(courseName);
}

function generateLanguageArtsChapters(courseName: string): TextbookChapter[] {
  if (courseName === 'Reading Comprehension') {
    return [
      {
        number: 1,
        title: 'Main Ideas and Supporting Details',
        summary: 'Learning to identify the central message of a text and the details that support it.',
        sections: [
          {
            title: 'Identifying Main Ideas',
            content: 'The main idea is the most important point the author wants to make. It\'s often stated in a topic sentence, but sometimes you must infer it from the details. Ask yourself: What is this passage mostly about?',
            keyPoints: [
              'Main idea = central message',
              'Topic sentence often states main idea',
              'Supporting details provide evidence',
            ],
            examples: [
              'Topic sentence: "Regular exercise benefits both physical and mental health." Main idea: Exercise is beneficial.',
              'Paragraph about various fruits → Main idea might be inferred as "Fruits are nutritious"',
            ],
          },
          {
            title: 'Finding Supporting Details',
            content: 'Supporting details are facts, examples, or descriptions that develop and support the main idea. They answer who, what, when, where, why, and how questions about the main idea.',
            keyPoints: [
              'Details support the main idea',
              'Look for facts, examples, and descriptions',
              'Details answer specific questions',
            ],
            examples: [
              'Main idea: Dogs make great pets. Supporting details: loyal, protective, playful',
            ],
          },
        ],
        reviewQuestions: [
          'How do you identify the main idea of a paragraph?',
          'What makes a good supporting detail?',
        ],
      },
    ];
  }
  
  return generateDefaultChapters(courseName);
}

function generateScienceChapters(courseName: string): TextbookChapter[] {
  if (courseName === 'Life Science Basics') {
    return [
      {
        number: 1,
        title: 'Characteristics of Living Things',
        summary: 'Understanding what defines living organisms and their basic life processes.',
        sections: [
          {
            title: 'What Makes Something Alive?',
            content: 'Living things share several key characteristics: they are made of cells, they reproduce, they grow and develop, they respond to their environment, they maintain homeostasis, they use energy, and they adapt to their environment over time.',
            keyPoints: [
              'All living things are made of cells',
              'Life requires energy from food or sunlight',
              'Living things reproduce and pass on traits',
              'Organisms respond to environmental changes',
            ],
            examples: [
              'A plant grows toward sunlight (response to environment)',
              'Your body shivers when cold (maintaining homeostasis)',
            ],
          },
          {
            title: 'Cells: The Building Blocks of Life',
            content: 'Cells are the smallest unit of life. Single-celled organisms like bacteria perform all life functions in one cell. Multi-cellular organisms like humans have specialized cells that work together.',
            keyPoints: [
              'Cells are the basic unit of life',
              'Organisms can be unicellular or multicellular',
              'Cells have specialized functions',
            ],
          },
        ],
      },
    ];
  }
  
  return generateDefaultChapters(courseName);
}

function generateSocialStudiesChapters(courseName: string): TextbookChapter[] {
  if (courseName === 'U.S. History') {
    return [
      {
        number: 1,
        title: 'Colonial America',
        summary: 'Exploring the establishment and development of the thirteen colonies.',
        sections: [
          {
            title: 'European Exploration and Settlement',
            content: 'In the late 15th and early 16th centuries, European powers began exploring the Americas. Spain, France, and England established colonies for various reasons including wealth, religious freedom, and expanding their empires.',
            keyPoints: [
              'European exploration began in the 1400s',
              'Colonies were established for economic and religious reasons',
              'Native Americans were already living in the Americas',
            ],
            examples: [
              'Jamestown (1607) - first permanent English settlement',
              'Plymouth Colony (1620) - Pilgrims seeking religious freedom',
            ],
          },
          {
            title: 'The Thirteen Colonies',
            content: 'By the 1700s, thirteen British colonies existed along the Atlantic coast. They were divided into three regions: New England (Massachusetts, Rhode Island, Connecticut, New Hampshire), Middle (New York, New Jersey, Pennsylvania, Delaware), and Southern (Maryland, Virginia, North Carolina, South Carolina, Georgia).',
            keyPoints: [
              'Thirteen colonies grouped into three regions',
              'Each region had different economies and cultures',
              'Colonial governments developed self-rule traditions',
            ],
          },
        ],
        reviewQuestions: [
          'Why did Europeans come to the Americas?',
          'What were the three colonial regions?',
        ],
      },
    ];
  }
  
  return generateDefaultChapters(courseName);
}

function generateDefaultChapters(courseName: string): TextbookChapter[] {
  return Array.from({ length: 8 }, (_, i) => ({
    number: i + 1,
    title: `${courseName} - Chapter ${i + 1}`,
    summary: `Comprehensive coverage of key concepts in ${courseName}.`,
    sections: [
      {
        title: `Section ${i + 1}.1: Introduction`,
        content: `This chapter introduces fundamental concepts and skills needed for ${courseName}. Study the examples carefully and complete all practice problems.`,
        keyPoints: [
          'Master the foundational concepts',
          'Practice regularly',
          'Connect to real-world applications',
        ],
      },
    ],
    practiceProblems: [
      'Review all examples in this chapter',
      'Complete the practice exercises at the end of each section',
    ],
    reviewQuestions: [
      'What are the main topics covered in this chapter?',
      'How do these concepts apply to the GED test?',
    ],
  }));
}

function generateLecturesForCourse(courseId: string, courseName: string, dept: Department): Lecture[] {
  return Array.from({ length: 12 }, (_, i) => {
    const week = i + 1;
    return {
      id: `lecture-${courseId}-week${week}`,
      courseId,
      week,
      title: `Week ${week}: ${getWeeklyTopic(dept, courseName, week)}`,
      topic: getWeeklyTopic(dept, courseName, week),
      objectives: getWeeklyObjectives(dept, week),
      content: getLectureContent(dept, courseName, week),
      keyTerms: getKeyTerms(dept, week),
      examples: getLectureExamples(dept, week),
      homework: `Read Chapter ${Math.ceil(week / 1.5)} and complete practice problems. Prepare for ${week % 3 === 0 ? 'quiz' : 'class discussion'}.`,
      relatedChapters: [Math.ceil(week / 1.5)],
      duration: '90 minutes',
    };
  });
}

function getWeeklyTopic(dept: Department, courseName: string, week: number): string {
  const topics: Record<Department, string[]> = {
    'Mathematical Reasoning': [
      'Whole Numbers and Basic Operations',
      'Fractions and Decimals',
      'Percentages and Ratios',
      'Introduction to Algebra',
      'Linear Equations',
      'Graphing and Coordinate Plane',
      'Geometry Fundamentals',
      'Area and Perimeter',
      'Volume and Surface Area',
      'Statistics and Probability',
      'Data Analysis',
      'Test Preparation and Review',
    ],
    'Language Arts': [
      'Reading Strategies',
      'Main Ideas and Details',
      'Inference and Analysis',
      'Grammar Fundamentals',
      'Sentence Structure',
      'Essay Organization',
      'Thesis Development',
      'Supporting Arguments',
      'Revision Techniques',
      'Research Skills',
      'Citation and References',
      'Final Review',
    ],
    'Science': [
      'Scientific Method',
      'Life Science Basics',
      'Cell Biology',
      'Ecosystems',
      'Physical Science Intro',
      'Matter and Energy',
      'Chemical Reactions',
      'Forces and Motion',
      'Earth Science',
      'Weather and Climate',
      'Human Body Systems',
      'Review and Application',
    ],
    'Social Studies': [
      'Introduction to History',
      'Early Civilizations',
      'Government Systems',
      'U.S. Constitution',
      'Economic Principles',
      'Global Geography',
      'World Cultures',
      'Historical Analysis',
      'Current Events',
      'Civic Participation',
      'Critical Thinking',
      'Comprehensive Review',
    ],
  };
  
  return topics[dept][week - 1] || `Week ${week} Topics`;
}

function getWeeklyObjectives(dept: Department, week: number): string[] {
  return [
    `Understand key concepts from Week ${week}`,
    `Apply knowledge to solve problems`,
    `Prepare for assignments and assessments`,
    `Connect material to real-world situations`,
  ];
}

function getLectureContent(dept: Department, courseName: string, week: number): string {
  return `Welcome to Week ${week} of ${courseName}!

In today's lecture, we will explore essential concepts that build on what you've learned so far. This week's material is crucial for your success in the course and on the GED exam.

INTRODUCTION:
We begin by reviewing key concepts from previous weeks and introducing new material that expands your understanding. Pay close attention to the examples and take notes on important formulas, definitions, and strategies.

MAIN CONTENT:
The core material for this week focuses on practical applications of ${dept} concepts. We will work through several examples together, starting with simpler problems and building to more complex scenarios.

KEY CONCEPTS:
- Foundational principles that support this week's learning
- Techniques and strategies for problem-solving
- Common mistakes to avoid
- Tips for GED test preparation

PRACTICE AND APPLICATION:
You will have opportunities to apply what you've learned through guided practice during class. Remember, asking questions is an important part of learning!

CONCLUSION:
This week's content connects to upcoming material and prepares you for future coursework. Complete all assigned homework and review your notes regularly.

Next class, we'll continue building on these foundations with new material.`;
}

function getKeyTerms(dept: Department, week: number): Array<{ term: string; definition: string }> {
  const termsByDept: Record<Department, Array<{ term: string; definition: string }>> = {
    'Mathematical Reasoning': [
      { term: 'Variable', definition: 'A letter or symbol representing an unknown number' },
      { term: 'Equation', definition: 'A mathematical statement showing two expressions are equal' },
      { term: 'Coefficient', definition: 'A number multiplied by a variable' },
    ],
    'Language Arts': [
      { term: 'Thesis', definition: 'The main argument or central claim of an essay' },
      { term: 'Context Clues', definition: 'Hints in surrounding text that help determine word meaning' },
      { term: 'Topic Sentence', definition: 'A sentence stating the main idea of a paragraph' },
    ],
    'Science': [
      { term: 'Hypothesis', definition: 'A testable prediction about a scientific question' },
      { term: 'Variable', definition: 'A factor that can change in an experiment' },
      { term: 'Control', definition: 'The standard for comparison in an experiment' },
    ],
    'Social Studies': [
      { term: 'Democracy', definition: 'Government by the people, typically through elected representatives' },
      { term: 'Constitution', definition: 'A document establishing the fundamental laws of a nation' },
      { term: 'Economy', definition: 'The system of production, distribution, and consumption of goods' },
    ],
  };
  
  return termsByDept[dept].slice(0, 3);
}

function getLectureExamples(dept: Department, week: number): string[] {
  const examples: Record<Department, string[]> = {
    'Mathematical Reasoning': [
      'Example 1: Solve for x: 2x + 5 = 13 → x = 4',
      'Example 2: Calculate 15% of 80 → 12',
      'Example 3: Find area of rectangle: length=8, width=5 → 40 square units',
    ],
    'Language Arts': [
      'Example 1: Identify the main idea in a passage about climate change',
      'Example 2: Correct sentence: "The students goes to school" → "The students go to school"',
      'Example 3: Write a strong thesis statement for an argumentative essay',
    ],
    'Science': [
      'Example 1: Design an experiment to test plant growth with different light levels',
      'Example 2: Balance a chemical equation: H₂ + O₂ → H₂O',
      'Example 3: Calculate speed: distance=100m, time=10s → 10 m/s',
    ],
    'Social Studies': [
      'Example 1: Analyze the causes of the American Revolution',
      'Example 2: Compare parliamentary and presidential systems',
      'Example 3: Interpret an economic graph showing supply and demand',
    ],
  };
  
  return examples[dept];
}

function generateGlossary(dept: Department, courseName: string): Array<{ term: string; definition: string }> {
  const glossaries: Record<Department, Array<{ term: string; definition: string }>> = {
    'Mathematical Reasoning': [
      { term: 'Absolute Value', definition: 'The distance of a number from zero, always positive' },
      { term: 'Coefficient', definition: 'A number that multiplies a variable' },
      { term: 'Equation', definition: 'A mathematical statement that two expressions are equal' },
      { term: 'Exponent', definition: 'A number showing how many times to multiply the base by itself' },
      { term: 'Integer', definition: 'A whole number that can be positive, negative, or zero' },
    ],
    'Language Arts': [
      { term: 'Alliteration', definition: 'Repetition of initial consonant sounds in nearby words' },
      { term: 'Anecdote', definition: 'A short personal story used to illustrate a point' },
      { term: 'Context Clues', definition: 'Words or phrases that help determine meaning of unfamiliar words' },
      { term: 'Inference', definition: 'A conclusion based on evidence and reasoning' },
      { term: 'Thesis Statement', definition: 'The main claim or argument of an essay' },
    ],
    'Science': [
      { term: 'Atom', definition: 'The smallest unit of a chemical element' },
      { term: 'Cell', definition: 'The basic structural and functional unit of life' },
      { term: 'Ecosystem', definition: 'A community of living organisms interacting with their environment' },
      { term: 'Hypothesis', definition: 'A testable prediction about a phenomenon' },
      { term: 'Photosynthesis', definition: 'Process by which plants convert light energy into chemical energy' },
    ],
    'Social Studies': [
      { term: 'Amendment', definition: 'A change or addition to a legal document' },
      { term: 'Democracy', definition: 'Government by the people through voting and representation' },
      { term: 'Economy', definition: 'System of production and exchange of goods and services' },
      { term: 'Geography', definition: 'Study of Earth\'s physical features and human activity' },
      { term: 'Primary Source', definition: 'Original document or firsthand account from a historical period' },
    ],
  };
  
  return glossaries[dept];
}

function generateReferences(dept: Department): string[] {
  return [
    'GED Testing Service. (2024). Official GED Study Guide.',
    'Educational Testing Service. (2024). GED Test Preparation Materials.',
    'National Council of Teachers. (2024). Standards for GED Preparation.',
    'Various academic journals and educational resources.',
  ];
}
