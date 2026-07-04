import type { Course, Assignment, GraduationPathway, CourseSchedule, AssignmentContent } from '@shared/schema';

/**
 * GED-Focused Curriculum System
 * 
 * Prepares students for the General Educational Development (GED) test
 * with high school equivalency courses across the four main test areas:
 * - Mathematical Reasoning
 * - Reasoning Through Language Arts (Reading & Writing)
 * - Science
 * - Social Studies
 */

// GED test areas as departments
export const DEPARTMENTS = [
  'Mathematical Reasoning',
  'Language Arts',
  'Science',
  'Social Studies',
] as const;

export type Department = typeof DEPARTMENTS[number];

// Time slots for class schedules
const TIME_SLOTS = [
  '8:00 AM - 9:30 AM',
  '10:00 AM - 11:30 AM',
  '12:00 PM - 1:30 PM',
  '2:00 PM - 3:30 PM',
  '4:00 PM - 5:30 PM',
] as const;

const DAYS_OF_WEEK = [
  ['Monday', 'Wednesday', 'Friday'],
  ['Tuesday', 'Thursday'],
  ['Monday', 'Wednesday'],
  ['Tuesday', 'Thursday', 'Friday'],
] as const;

// Course templates for each GED test area
const COURSE_TEMPLATES: Record<Department, Array<{
  name: string;
  description: string;
  syllabus: string;
  prerequisites?: string[];
}>> = {
  'Mathematical Reasoning': [
    {
      name: 'Basic Math Skills',
      description: 'Master fundamental arithmetic operations, fractions, decimals, and percentages. Build the foundation for GED mathematical reasoning.',
      syllabus: `Week 1-3: Whole numbers and operations
Week 4-6: Fractions and mixed numbers
Week 7-9: Decimals and percentages
Week 10-12: Word problems and real-world applications`,
    },
    {
      name: 'Pre-Algebra',
      description: 'Learn essential algebraic concepts including variables, expressions, and basic equations.',
      syllabus: `Week 1-3: Variables and expressions
Week 4-6: Solving one-step equations
Week 7-9: Multi-step equations
Week 10-12: Inequalities and graphing`,
      prerequisites: ['MATH-101'],
    },
    {
      name: 'Algebra Fundamentals',
      description: 'Develop algebraic thinking with linear equations, systems, and graphing.',
      syllabus: `Week 1-3: Linear equations and functions
Week 4-6: Systems of equations
Week 7-9: Polynomials and factoring
Week 10-12: Quadratic equations introduction`,
      prerequisites: ['MATH-201'],
    },
    {
      name: 'Geometry & Measurement',
      description: 'Study geometric shapes, area, volume, and the Pythagorean theorem.',
      syllabus: `Week 1-3: Perimeter and area
Week 4-6: Volume and surface area
Week 7-9: Pythagorean theorem and right triangles
Week 10-12: Coordinate geometry`,
      prerequisites: ['MATH-101'],
    },
    {
      name: 'Data Analysis & Statistics',
      description: 'Interpret graphs, charts, and statistical measures for the GED test.',
      syllabus: `Week 1-3: Reading charts and graphs
Week 4-6: Mean, median, mode, and range
Week 7-9: Probability basics
Week 10-12: Data interpretation and analysis`,
      prerequisites: ['MATH-101'],
    },
    {
      name: 'GED Math Test Prep',
      description: 'Comprehensive preparation for the GED Mathematical Reasoning test with practice problems and strategies.',
      syllabus: `Week 1-3: Calculator and formula sheet usage
Week 4-6: Problem-solving strategies
Week 7-9: Practice test sections
Week 10-12: Full-length practice tests and review`,
      prerequisites: ['MATH-201', 'MATH-301', 'MATH-302'],
    },
  ],
  'Language Arts': [
    {
      name: 'Reading Comprehension',
      description: 'Develop essential reading skills for understanding and analyzing various text types.',
      syllabus: `Week 1-3: Main ideas and supporting details
Week 4-6: Making inferences and drawing conclusions
Week 7-9: Author's purpose and point of view
Week 10-12: Compare and contrast texts`,
    },
    {
      name: 'Grammar & Writing Mechanics',
      description: 'Master grammar rules, sentence structure, and punctuation for clear writing.',
      syllabus: `Week 1-3: Parts of speech and sentence structure
Week 4-6: Subject-verb agreement and verb tenses
Week 7-9: Punctuation and capitalization
Week 10-12: Common errors and editing practice`,
    },
    {
      name: 'Essay Writing',
      description: 'Learn to write clear, organized essays with strong thesis statements and supporting evidence.',
      syllabus: `Week 1-3: Essay structure and thesis statements
Week 4-6: Supporting paragraphs and evidence
Week 7-9: Introductions and conclusions
Week 10-12: Revision and editing techniques`,
      prerequisites: ['LANG-102'],
    },
    {
      name: 'Literature Analysis',
      description: 'Analyze fiction and nonfiction texts, including poetry, drama, and informational writing.',
      syllabus: `Week 1-3: Fiction elements and characterization
Week 4-6: Poetry and figurative language
Week 7-9: Drama and dialogue
Week 10-12: Nonfiction text structures`,
      prerequisites: ['LANG-101'],
    },
    {
      name: 'Workplace & Informational Reading',
      description: 'Read and interpret workplace documents, manuals, and informational texts.',
      syllabus: `Week 1-3: Instructions and manuals
Week 4-6: Business letters and emails
Week 7-9: Forms and applications
Week 10-12: Technical and scientific texts`,
      prerequisites: ['LANG-101'],
    },
    {
      name: 'GED Language Arts Test Prep',
      description: 'Comprehensive preparation for the GED Reasoning Through Language Arts test.',
      syllabus: `Week 1-3: Test format and question types
Week 4-6: Reading practice passages
Week 7-9: Extended response essay practice
Week 10-12: Full practice tests and strategies`,
      prerequisites: ['LANG-101', 'LANG-102', 'LANG-201'],
    },
  ],
  'Science': [
    {
      name: 'Life Science Basics',
      description: 'Study cells, organisms, heredity, and evolution fundamentals.',
      syllabus: `Week 1-3: Cell structure and function
Week 4-6: Organisms and ecosystems
Week 7-9: Heredity and genetics basics
Week 10-12: Evolution and natural selection`,
    },
    {
      name: 'Physical Science',
      description: 'Explore matter, energy, motion, and forces in everyday life.',
      syllabus: `Week 1-3: Properties of matter
Week 4-6: Chemical reactions and changes
Week 7-9: Energy and motion
Week 10-12: Forces and simple machines`,
    },
    {
      name: 'Earth & Space Science',
      description: 'Understand Earth systems, weather, climate, and astronomy basics.',
      syllabus: `Week 1-3: Earth's structure and plate tectonics
Week 4-6: Weather and climate
Week 7-9: Water cycle and natural resources
Week 10-12: Solar system and space`,
    },
    {
      name: 'Human Body & Health',
      description: 'Learn about human anatomy, physiology, and health maintenance.',
      syllabus: `Week 1-3: Body systems overview
Week 4-6: Nutrition and digestion
Week 7-9: Disease and immunity
Week 10-12: Health and wellness`,
      prerequisites: ['SCI-101'],
    },
    {
      name: 'Scientific Reasoning',
      description: 'Develop skills in analyzing experiments, data, and scientific evidence.',
      syllabus: `Week 1-3: Scientific method
Week 4-6: Reading graphs and data tables
Week 7-9: Experimental design
Week 10-12: Evaluating evidence and conclusions`,
    },
    {
      name: 'GED Science Test Prep',
      description: 'Comprehensive preparation for the GED Science test with practice questions.',
      syllabus: `Week 1-3: Test format and content areas
Week 4-6: Reading scientific passages
Week 7-9: Data interpretation practice
Week 10-12: Full practice tests and review`,
      prerequisites: ['SCI-101', 'SCI-102', 'SCI-103'],
    },
  ],
  'Social Studies': [
    {
      name: 'U.S. History',
      description: 'Survey American history from colonization through modern times.',
      syllabus: `Week 1-3: Colonial America and Revolution
Week 4-6: Constitution and early republic
Week 7-9: Civil War and Reconstruction
Week 10-12: 20th century to present`,
    },
    {
      name: 'World History',
      description: 'Explore major civilizations, revolutions, and global conflicts.',
      syllabus: `Week 1-3: Ancient civilizations
Week 4-6: Middle Ages and Renaissance
Week 7-9: Revolutions and industrialization
Week 10-12: World wars and modern era`,
    },
    {
      name: 'Civics & Government',
      description: 'Understand the U.S. government structure, rights, and civic responsibilities.',
      syllabus: `Week 1-3: Constitution and Bill of Rights
Week 4-6: Three branches of government
Week 7-9: Elections and political parties
Week 10-12: Citizens' rights and responsibilities`,
    },
    {
      name: 'Economics',
      description: 'Learn basic economic concepts, markets, and personal finance.',
      syllabus: `Week 1-3: Supply and demand
Week 4-6: Economic systems
Week 7-9: Banking and money
Week 10-12: Budgeting and personal finance`,
    },
    {
      name: 'Geography',
      description: 'Study maps, regions, cultures, and human-environment interaction.',
      syllabus: `Week 1-3: Map reading and geography tools
Week 4-6: World regions and cultures
Week 7-9: Human geography and migration
Week 10-12: Environmental geography`,
    },
    {
      name: 'GED Social Studies Test Prep',
      description: 'Comprehensive preparation for the GED Social Studies test.',
      syllabus: `Week 1-3: Test format and question types
Week 4-6: Document analysis practice
Week 7-9: Historical and civic reasoning
Week 10-12: Full practice tests and strategies`,
      prerequisites: ['SS-101', 'SS-103'],
    },
  ],
};

// Procedurally generate course catalog
export function generateCourseCatalog(npcs: any[], locations: any[]): Course[] {
  const courses: Course[] = [];
  const professors = npcs.filter(npc => npc.isTeacher);
  const classrooms = locations.filter(loc => loc.type === 'classroom');

  // Generate courses for each GED test area
  DEPARTMENTS.forEach((department, deptIndex) => {
    courses.push(...generateDepartmentCourses(department, professors, classrooms, deptIndex));
  });

  return courses;
}

function generateDepartmentCourses(
  department: Department,
  professors: any[],
  classrooms: any[],
  deptIndex: number
): Course[] {
  const courses: Course[] = [];
  
  const deptCodeMap: Record<Department, string> = {
    'Mathematical Reasoning': 'MATH',
    'Language Arts': 'LANG',
    'Science': 'SCI',
    'Social Studies': 'SS',
  };

  const deptCode = deptCodeMap[department];
  const templates = COURSE_TEMPLATES[department];

  templates.forEach((template, index) => {
    const courseNumber = 101 + (index * 100);
    const courseCode = `${deptCode}-${courseNumber}`;
    
    // Assign professor and classroom
    const professor = professors[((deptIndex * templates.length) + index) % professors.length];
    const classroom = classrooms[((deptIndex * templates.length) + index) % classrooms.length];
    const timeSlot = TIME_SLOTS[index % TIME_SLOTS.length];
    const days = DAYS_OF_WEEK[index % DAYS_OF_WEEK.length];

    // Determine difficulty: later courses are harder
    const difficulty = index < 2 ? 1 : index < 4 ? 2 : 3;
    
    courses.push({
      id: courseCode,
      name: template.name,
      department: department,
      credits: 3,
      level: 100 + (index * 100), // Spread across levels
      description: template.description,
      syllabus: template.syllabus,
      prerequisites: template.prerequisites || [],
      professorId: professor?.id || 'staff-1',
      schedule: {
        daysOfWeek: days as unknown as string[],
        timeSlot: timeSlot,
        location: classroom?.id || 'main-hall',
      },
      maxStudents: 25,
      categoryTags: template.name.includes('Test Prep') ? ['test-prep', 'required'] : ['core'],
      difficulty: difficulty,
    });
  });

  return courses;
}

// Generate graduation pathways for GED
export function generateGraduationPathways(): GraduationPathway[] {
  const pathways: GraduationPathway[] = [];
  
  // Main GED diploma pathway
  pathways.push({
    id: 'ged-diploma',
    name: 'GED Diploma',
    type: 'major',
    description: 'Complete preparation for all four GED test areas and earn your high school equivalency diploma.',
    requiredCredits: 48, // 12 courses × 4 test areas
    requiredCourses: [
      'MATH-101', 'MATH-201', 'MATH-501', // Math core + test prep
      'LANG-101', 'LANG-102', 'LANG-501', // Language arts core + test prep
      'SCI-101', 'SCI-102', 'SCI-501',    // Science core + test prep
      'SS-101', 'SS-103', 'SS-501',       // Social studies core + test prep
    ],
    electiveCredits: 12,
    departmentRequirements: {
      'Mathematical Reasoning': 12,
      'Language Arts': 12,
      'Science': 12,
      'Social Studies': 12,
    },
    minGPA: 200, // 2.0 GPA to pass
  });

  // Individual test area certificates
  const testAreas = [
    { dept: 'Mathematical Reasoning', code: 'MATH', courses: ['MATH-101', 'MATH-201', 'MATH-501'] },
    { dept: 'Language Arts', code: 'LANG', courses: ['LANG-101', 'LANG-102', 'LANG-501'] },
    { dept: 'Science', code: 'SCI', courses: ['SCI-101', 'SCI-102', 'SCI-501'] },
    { dept: 'Social Studies', code: 'SS', courses: ['SS-101', 'SS-103', 'SS-501'] },
  ];

  testAreas.forEach(area => {
    pathways.push({
      id: `certificate-${area.code.toLowerCase()}`,
      name: `${area.dept} Certificate`,
      type: 'minor',
      description: `Focused preparation for the GED ${area.dept} test.`,
      requiredCredits: 12,
      requiredCourses: area.courses,
      electiveCredits: 3,
      departmentRequirements: {
        [area.dept]: 12,
      },
      minGPA: 200,
    });
  });

  return pathways;
}

// Generate assignments for a course
export function generateCourseAssignments(course: Course): Assignment[] {
  const assignments: Assignment[] = [];
  const dept = course.department as Department;
  
  // 1. Class participation (20%)
  assignments.push({
    id: `${course.id}-participation`,
    courseId: course.id,
    title: 'Class Participation',
    description: 'Active engagement in class discussions, activities, and group work.',
    type: 'participation',
    maxPoints: 100,
    weight: 20,
    dueDate: 'Ongoing throughout semester',
    content: {
      prompt: 'Participate actively in all class sessions, complete in-class activities, and contribute to group discussions.',
      requirements: [
        'Attend all scheduled classes',
        'Participate in discussions',
        'Complete in-class activities',
        'Work collaboratively with peers',
      ],
    },
    requirements: {},
  });

  // 2. Midterm exam (20%)
  assignments.push({
    id: `${course.id}-midterm`,
    courseId: course.id,
    title: 'Midterm Examination',
    description: 'Comprehensive exam covering the first half of course material.',
    type: 'exam',
    maxPoints: 100,
    weight: 20,
    dueDate: 'Week 6',
    content: {
      prompt: 'The midterm exam will test your understanding of all topics covered in weeks 1-6.',
      requirements: [
        'Review all class notes and materials',
        'Complete practice problems',
        'Bring calculator (if applicable)',
        'Arrive on time - no late entry allowed',
      ],
    },
    requirements: {},
  });

  // 3-6. Four regular assignments (30% total, 7.5% each)
  for (let i = 1; i <= 4; i++) {
    assignments.push({
      id: `${course.id}-assignment${i}`,
      courseId: course.id,
      title: `Assignment ${i}`,
      description: `${getAssignmentDescription(dept, i)}`,
      type: i === 4 ? 'project' : 'essay',
      maxPoints: 100,
      weight: 7.5,
      dueDate: `Week ${i * 2 + 1}`,
      content: {
        prompt: getAssignmentPrompt(dept, course.name, i),
        requirements: getAssignmentRequirements(dept, i),
      },
      requirements: {},
    });
  }

  // 7. Final project (30%)
  assignments.push({
    id: `${course.id}-final`,
    courseId: course.id,
    title: 'Final Project',
    description: 'Comprehensive final project demonstrating mastery of all course concepts.',
    type: 'project',
    maxPoints: 100,
    weight: 30,
    dueDate: 'Week 12',
    content: {
      prompt: getFinalProjectPrompt(dept, course.name),
      requirements: [
        'Demonstrate understanding of all major topics',
        'Include real-world applications',
        'Present work professionally',
        'Cite all sources properly',
        'Submit by final deadline',
      ],
    },
    requirements: {},
  });

  return assignments;
}

function getAssignmentDescription(dept: Department, number: number): string {
  const descriptions: Record<Department, string[]> = {
    'Mathematical Reasoning': [
      'Practice problems covering arithmetic and basic algebra',
      'Word problems and real-world math applications',
      'Geometry and measurement exercises',
      'Data analysis and graphing project',
    ],
    'Language Arts': [
      'Reading comprehension exercises',
      'Grammar and mechanics worksheet',
      'Analytical essay on assigned reading',
      'Research-based writing project',
    ],
    'Science': [
      'Lab report and data analysis',
      'Scientific reading comprehension',
      'Experiment design and hypothesis testing',
      'Research project on scientific topic',
    ],
    'Social Studies': [
      'Historical document analysis',
      'Current events essay',
      'Civics and government case study',
      'Research project on social studies topic',
    ],
  };
  
  return descriptions[dept][number - 1] || 'Course assignment';
}

function getAssignmentPrompt(dept: Department, courseName: string, number: number): string {
  return `Complete the assigned ${getAssignmentDescription(dept, number).toLowerCase()} based on the concepts covered in ${courseName}. Follow all instructions provided in class.`;
}

function getAssignmentRequirements(dept: Department, number: number): string[] {
  const baseRequirements = [
    'Complete all parts of the assignment',
    'Show your work or reasoning',
    'Follow proper formatting guidelines',
    'Submit on time',
  ];

  if (dept === 'Language Arts') {
    baseRequirements.push('Use proper grammar and punctuation', 'Organize ideas clearly');
  } else if (dept === 'Mathematical Reasoning') {
    baseRequirements.push('Check your calculations', 'Label units clearly');
  } else if (dept === 'Science') {
    baseRequirements.push('Use scientific terminology', 'Include diagrams if applicable');
  } else if (dept === 'Social Studies') {
    baseRequirements.push('Support claims with evidence', 'Use historical context');
  }

  return baseRequirements;
}

function getFinalProjectPrompt(dept: Department, courseName: string): string {
  const prompts: Record<Department, string> = {
    'Mathematical Reasoning': `For your final project in ${courseName}, solve a comprehensive set of problems that demonstrate your mastery of all mathematical concepts covered this semester. Include word problems, equations, graphs, and real-world applications.`,
    'Language Arts': `Write a comprehensive essay or create a portfolio that demonstrates your reading, writing, and analytical skills developed in ${courseName}. Your work should showcase proper grammar, organization, and critical thinking.`,
    'Science': `Design and conduct a scientific investigation related to ${courseName}. Document your hypothesis, experimental procedure, data collection, analysis, and conclusions in a formal lab report format.`,
    'Social Studies': `Research and present a comprehensive analysis of a topic related to ${courseName}. Include historical context, multiple perspectives, primary sources, and real-world connections.`,
  };
  
  return prompts[dept];
}

/**
 * Generate textbook items for all courses
 * Students can read these textbooks to study course material
 */
export function generateTextbooks(courses: Course[]): Array<{
  id: string;
  name: string;
  description: string;
  type: string;
  weight: number;
  value: number;
  properties: {
    courseId: string;
    courseName: string;
    department: string;
    canRead: boolean;
    content: string;
  };
  canUse: boolean;
  isQuestItem: boolean;
}> {
  return courses.map(course => ({
    id: `textbook-${course.id}`,
    name: `${course.name} Textbook`,
    description: `Official textbook for ${course.name}. Contains all course material, syllabus, and study guides needed for this ${course.department} course.`,
    type: 'book',
    weight: 2,
    value: 50,
    properties: {
      courseId: course.id,
      courseName: course.name,
      department: course.department,
      canRead: true,
      content: course.syllabus,
    },
    canUse: true,
    isQuestItem: false,
  }));
}
