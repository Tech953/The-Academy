import type { Course, Assignment, GraduationPathway, CourseSchedule, AssignmentContent } from '@shared/schema';

// Real-world academic departments
export const DEPARTMENTS = [
  'Mathematics',
  'Natural Sciences',
  'Language Studies',
  'History',
  'Literature',
  'Philosophy',
  'Psychology',
  'Computer Science',
  'Economics',
  'Political Science',
  'Art',
  'Music',
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

// Procedurally generate course catalog
export function generateCourseCatalog(npcs: any[], locations: any[]): Course[] {
  const courses: Course[] = [];
  const professors = npcs.filter(npc => npc.isTeacher);
  const classrooms = locations.filter(loc => loc.type === 'classroom');

  // Generate courses for each department
  DEPARTMENTS.forEach((department, deptIndex) => {
    // 100-level courses (introductory)
    courses.push(...generateDepartmentCourses(department, 100, 3, professors, classrooms, deptIndex * 10));
    
    // 200-level courses (intermediate)
    courses.push(...generateDepartmentCourses(department, 200, 4, professors, classrooms, deptIndex * 10 + 100));
    
    // 300-level courses (advanced)
    courses.push(...generateDepartmentCourses(department, 300, 3, professors, classrooms, deptIndex * 10 + 200));
    
    // 400-level courses (senior seminar)
    courses.push(...generateDepartmentCourses(department, 400, 2, professors, classrooms, deptIndex * 10 + 300));
  });

  return courses;
}

function generateDepartmentCourses(
  department: Department,
  level: number,
  count: number,
  professors: any[],
  classrooms: any[],
  idOffset: number
): Course[] {
  const courses: Course[] = [];
  
  // Map department names to course codes
  const deptCodeMap: Record<Department, string> = {
    'Mathematics': 'MATH',
    'Natural Sciences': 'SCI',
    'Language Studies': 'LANG',
    'History': 'HIST',
    'Literature': 'LIT',
    'Philosophy': 'PHIL',
    'Psychology': 'PSYCH',
    'Computer Science': 'CS',
    'Economics': 'ECON',
    'Political Science': 'POLI',
    'Art': 'ART',
    'Music': 'MUS',
  };
  
  const deptCode = deptCodeMap[department];

  for (let i = 0; i < count; i++) {
    const courseNumber = level + i;
    const courseId = `${deptCode}-${courseNumber}`;
    
    const professor = professors[Math.floor(Math.random() * professors.length)];
    const classroom = classrooms[Math.floor(Math.random() * classrooms.length)];
    const timeSlot = TIME_SLOTS[Math.floor(Math.random() * TIME_SLOTS.length)];
    const daysOfWeek = DAYS_OF_WEEK[Math.floor(Math.random() * DAYS_OF_WEEK.length)];

    const schedule: CourseSchedule = {
      daysOfWeek: [...daysOfWeek],
      timeSlot,
      location: classroom.id,
    };

    const courseData = generateCourseContent(department, level, i);
    
    courses.push({
      id: courseId,
      name: courseData.name,
      department,
      level,
      credits: level >= 300 ? 4 : 3,
      description: courseData.description,
      syllabus: courseData.syllabus,
      prerequisites: courseData.prerequisites,
      difficulty: Math.ceil(level / 100),
      professorId: professor.id,
      schedule,
      maxStudents: 20,
      categoryTags: courseData.tags,
    });
  }

  return courses;
}

function generateCourseContent(department: Department, level: number, variant: number) {
  const courseTemplates = {
    'Mathematics': [
      {
        name: 'Calculus',
        description: 'Study limits, derivatives, integrals, and their applications to real-world problems.',
        topics: ['Limits and Continuity', 'Differentiation', 'Integration', 'Applications'],
      },
      {
        name: 'Linear Algebra',
        description: 'Explore vector spaces, matrices, linear transformations, and eigenvalues.',
        topics: ['Vector Spaces', 'Matrix Operations', 'Linear Transformations', 'Eigenvalues'],
      },
      {
        name: 'Statistics',
        description: 'Learn probability theory, statistical inference, and data analysis techniques.',
        topics: ['Probability Theory', 'Distributions', 'Hypothesis Testing', 'Regression Analysis'],
      },
      {
        name: 'Discrete Mathematics',
        description: 'Study mathematical structures and logic fundamental to computer science.',
        topics: ['Set Theory', 'Graph Theory', 'Combinatorics', 'Logic'],
      },
    ],
    'Natural Sciences': [
      {
        name: 'Biology',
        description: 'Examine living organisms, their structure, function, growth, and evolution.',
        topics: ['Cell Biology', 'Genetics', 'Evolution', 'Ecology'],
      },
      {
        name: 'Chemistry',
        description: 'Study matter, its properties, composition, structure, and changes.',
        topics: ['Atomic Structure', 'Chemical Bonding', 'Reactions', 'Thermodynamics'],
      },
      {
        name: 'Physics',
        description: 'Explore the fundamental laws governing energy, matter, motion, and force.',
        topics: ['Mechanics', 'Thermodynamics', 'Electromagnetism', 'Modern Physics'],
      },
      {
        name: 'Environmental Science',
        description: 'Analyze ecosystems, natural resources, and human environmental impact.',
        topics: ['Ecosystems', 'Conservation', 'Climate Change', 'Sustainability'],
      },
    ],
    'Language Studies': [
      {
        name: 'English Composition',
        description: 'Develop writing skills for academic and professional communication.',
        topics: ['Essay Writing', 'Research Papers', 'Argumentation', 'Grammar'],
      },
      {
        name: 'Spanish Language',
        description: 'Learn Spanish grammar, vocabulary, and conversational skills.',
        topics: ['Grammar Fundamentals', 'Vocabulary Building', 'Conversation', 'Culture'],
      },
      {
        name: 'Linguistics',
        description: 'Study the scientific analysis of language structure and development.',
        topics: ['Phonetics', 'Syntax', 'Semantics', 'Language Acquisition'],
      },
      {
        name: 'French Language',
        description: 'Master French language skills including reading, writing, and speaking.',
        topics: ['Grammar', 'Pronunciation', 'Composition', 'French Literature'],
      },
    ],
    'History': [
      {
        name: 'World History',
        description: 'Survey major civilizations, events, and movements throughout human history.',
        topics: ['Ancient Civilizations', 'Medieval Period', 'Renaissance', 'Modern Era'],
      },
      {
        name: 'American History',
        description: 'Examine the political, social, and economic development of the United States.',
        topics: ['Colonial Period', 'Revolution', 'Civil War', '20th Century'],
      },
      {
        name: 'European History',
        description: 'Study the history of Europe from antiquity to the present.',
        topics: ['Classical Greece and Rome', 'Middle Ages', 'World Wars', 'Modern Europe'],
      },
      {
        name: 'History of Science',
        description: 'Explore the development of scientific thought and discovery.',
        topics: ['Scientific Revolution', 'Major Discoveries', 'Scientists', 'Impact on Society'],
      },
    ],
    'Literature': [
      {
        name: 'American Literature',
        description: 'Study major works and movements in American literary history.',
        topics: ['Colonial Literature', 'Romanticism', 'Modernism', 'Contemporary'],
      },
      {
        name: 'British Literature',
        description: 'Explore classic and contemporary works from British authors.',
        topics: ['Shakespeare', 'Victorian Era', 'Romantic Poets', 'Modern British'],
      },
      {
        name: 'World Literature',
        description: 'Read and analyze significant works from diverse global traditions.',
        topics: ['Classical Works', 'Non-Western Literature', 'Translation', 'Cultural Context'],
      },
      {
        name: 'Creative Writing',
        description: 'Develop skills in fiction, poetry, and creative nonfiction.',
        topics: ['Fiction Techniques', 'Poetry', 'Character Development', 'Workshop'],
      },
    ],
    'Philosophy': [
      {
        name: 'Introduction to Philosophy',
        description: 'Explore fundamental questions about knowledge, reality, and ethics.',
        topics: ['Metaphysics', 'Epistemology', 'Ethics', 'Logic'],
      },
      {
        name: 'Ethics',
        description: 'Study moral philosophy and ethical decision-making frameworks.',
        topics: ['Moral Theories', 'Applied Ethics', 'Ethical Dilemmas', 'Justice'],
      },
      {
        name: 'Political Philosophy',
        description: 'Examine theories of government, justice, rights, and political authority.',
        topics: ['Social Contract', 'Democracy', 'Justice', 'Freedom'],
      },
      {
        name: 'Philosophy of Mind',
        description: 'Investigate the nature of consciousness, mental states, and cognition.',
        topics: ['Consciousness', 'Mind-Body Problem', 'Artificial Intelligence', 'Free Will'],
      },
    ],
    'Psychology': [
      {
        name: 'General Psychology',
        description: 'Introduction to the scientific study of behavior and mental processes.',
        topics: ['Research Methods', 'Cognition', 'Development', 'Social Psychology'],
      },
      {
        name: 'Developmental Psychology',
        description: 'Study human growth and development across the lifespan.',
        topics: ['Childhood', 'Adolescence', 'Adulthood', 'Aging'],
      },
      {
        name: 'Cognitive Psychology',
        description: 'Explore mental processes including memory, perception, and reasoning.',
        topics: ['Memory', 'Attention', 'Problem Solving', 'Language'],
      },
      {
        name: 'Abnormal Psychology',
        description: 'Examine psychological disorders, their causes, and treatments.',
        topics: ['Diagnostic Criteria', 'Anxiety Disorders', 'Mood Disorders', 'Treatment'],
      },
    ],
    'Computer Science': [
      {
        name: 'Programming Fundamentals',
        description: 'Learn core programming concepts and problem-solving techniques.',
        topics: ['Variables and Types', 'Control Structures', 'Functions', 'Algorithms'],
      },
      {
        name: 'Data Structures',
        description: 'Study efficient ways to organize and manipulate data.',
        topics: ['Arrays and Lists', 'Trees', 'Graphs', 'Hash Tables'],
      },
      {
        name: 'Algorithms',
        description: 'Analyze algorithm design, complexity, and optimization.',
        topics: ['Sorting', 'Searching', 'Dynamic Programming', 'Complexity Analysis'],
      },
      {
        name: 'Database Systems',
        description: 'Learn database design, SQL, and data management principles.',
        topics: ['Relational Model', 'SQL', 'Normalization', 'Transactions'],
      },
    ],
    'Economics': [
      {
        name: 'Microeconomics',
        description: 'Study individual economic decisions, markets, and price mechanisms.',
        topics: ['Supply and Demand', 'Market Structures', 'Consumer Theory', 'Pricing'],
      },
      {
        name: 'Macroeconomics',
        description: 'Analyze economy-wide phenomena including inflation, unemployment, and growth.',
        topics: ['GDP', 'Inflation', 'Monetary Policy', 'Fiscal Policy'],
      },
      {
        name: 'International Economics',
        description: 'Examine trade, finance, and economic relationships between nations.',
        topics: ['Trade Theory', 'Exchange Rates', 'Global Markets', 'Trade Policy'],
      },
      {
        name: 'Economic Development',
        description: 'Study factors contributing to economic growth and development.',
        topics: ['Growth Theory', 'Poverty', 'Institutions', 'Development Policy'],
      },
    ],
    'Political Science': [
      {
        name: 'American Government',
        description: 'Examine the structure and function of U.S. political institutions.',
        topics: ['Constitution', 'Congress', 'Presidency', 'Judiciary'],
      },
      {
        name: 'Comparative Politics',
        description: 'Analyze different political systems and governance structures worldwide.',
        topics: ['Political Systems', 'Democratization', 'Authoritarianism', 'Institutions'],
      },
      {
        name: 'International Relations',
        description: 'Study interactions between states, international organizations, and global politics.',
        topics: ['Foreign Policy', 'Conflict', 'Cooperation', 'Global Governance'],
      },
      {
        name: 'Political Theory',
        description: 'Explore foundational texts and ideas in political thought.',
        topics: ['Classical Theory', 'Modern Theory', 'Democracy', 'Power'],
      },
    ],
    'Art': [
      {
        name: 'Art History',
        description: 'Survey major periods, movements, and works in visual art history.',
        topics: ['Ancient Art', 'Renaissance', 'Modern Art', 'Contemporary'],
      },
      {
        name: 'Studio Art',
        description: 'Develop practical skills in drawing, painting, and composition.',
        topics: ['Drawing Techniques', 'Color Theory', 'Composition', 'Mixed Media'],
      },
      {
        name: 'Digital Art',
        description: 'Explore digital tools and techniques for creating visual art.',
        topics: ['Digital Painting', 'Photo Editing', 'Vector Graphics', 'Design Principles'],
      },
      {
        name: 'Sculpture',
        description: 'Learn three-dimensional art creation using various materials.',
        topics: ['Clay', 'Stone', 'Metal', 'Installation'],
      },
    ],
    'Music': [
      {
        name: 'Music Theory',
        description: 'Study the fundamental elements of music including harmony and composition.',
        topics: ['Notation', 'Harmony', 'Counterpoint', 'Form'],
      },
      {
        name: 'Music History',
        description: 'Explore the development of Western music from medieval to modern.',
        topics: ['Medieval Music', 'Baroque', 'Classical', 'Romantic and Modern'],
      },
      {
        name: 'Applied Music',
        description: 'Develop performance skills through private instruction and practice.',
        topics: ['Technique', 'Repertoire', 'Performance', 'Interpretation'],
      },
      {
        name: 'World Music',
        description: 'Study musical traditions from diverse cultures around the globe.',
        topics: ['African Music', 'Asian Music', 'Latin American', 'Folk Traditions'],
      },
    ],
  };

  const templates = courseTemplates[department] || courseTemplates['History'];
  const template = templates[variant % templates.length];
  
  // Adjust for level
  let levelPrefix = '';
  let levelDesc = '';
  let tags = ['elective'];
  
  if (level === 100) {
    levelPrefix = 'Introduction to ';
    levelDesc = 'An introductory course suitable for freshmen. No prerequisites required.';
    tags = ['core', 'introductory'];
  } else if (level === 200) {
    levelPrefix = 'Intermediate ';
    levelDesc = 'An intermediate course building on foundational knowledge.';
    tags = ['major-requirement'];
  } else if (level === 300) {
    levelPrefix = 'Advanced ';
    levelDesc = 'An advanced course requiring strong background in the subject.';
    tags = ['major-requirement', 'advanced'];
  } else {
    levelPrefix = 'Senior Seminar: ';
    levelDesc = 'A rigorous senior-level course requiring departmental approval.';
    tags = ['advanced', 'seminar'];
  }

  const prerequisites = level > 100 ? [`${department.substring(0, 4).toUpperCase()}-${level - 100}`] : [];

  const syllabus = generateSyllabus(template.name, template.topics, levelDesc);

  return {
    name: `${levelPrefix}${template.name}`,
    description: template.description,
    syllabus,
    prerequisites,
    tags,
  };
}

function generateSyllabus(courseName: string, topics: string[], levelDescription: string): string {
  return `COURSE SYLLABUS: ${courseName}

DESCRIPTION:
${levelDescription}

LEARNING OBJECTIVES:
By the end of this course, students will be able to:
${topics.map((topic, i) => `${i + 1}. Demonstrate proficiency in ${topic}`).join('\n')}

WEEKLY TOPICS:
${topics.map((topic, i) => `Week ${i + 1}-${i + 2}: ${topic}`).join('\n')}

ASSESSMENT:
- Class Participation: 20%
- Assignments & Quizzes: 30%
- Midterm Examination: 20%
- Final Project: 30%

GRADING SCALE:
A (90-100), B (80-89), C (70-79), D (60-69), F (<60)

ATTENDANCE POLICY:
Regular attendance is mandatory. More than 3 unexcused absences may result in grade penalties or course failure.

ACADEMIC INTEGRITY:
All work must be your own. Collaboration is encouraged for learning, but submissions must be individual.
`;
}

// Generate graduation pathways
export function generateGraduationPathways(): GraduationPathway[] {
  const pathways: GraduationPathway[] = [];
  
  const deptCodeMap: Record<Department, string> = {
    'Mathematics': 'MATH',
    'Natural Sciences': 'SCI',
    'Language Studies': 'LANG',
    'History': 'HIST',
    'Literature': 'LIT',
    'Philosophy': 'PHIL',
    'Psychology': 'PSYCH',
    'Computer Science': 'CS',
    'Economics': 'ECON',
    'Political Science': 'POLI',
    'Art': 'ART',
    'Music': 'MUS',
  };

  // Major pathways
  DEPARTMENTS.forEach(dept => {
    const deptCode = deptCodeMap[dept];
    pathways.push({
      id: `major-${dept.toLowerCase().replace(/ /g, '-')}`,
      name: `Bachelor of ${dept}`,
      type: 'major',
      description: `A comprehensive program in ${dept}, preparing students for advanced roles in this field.`,
      requiredCredits: 120,
      requiredCourses: [
        `${deptCode}-101`,
        `${deptCode}-102`,
        `${deptCode}-201`,
        `${deptCode}-301`,
        `${deptCode}-401`,
      ],
      electiveCredits: 30,
      departmentRequirements: {
        [dept]: 48, // 48 credits in major
        'Core': 24, // 24 core credits
      },
      minGPA: 200, // 2.0 GPA
    });
  });

  // Minor pathways (require fewer credits)
  DEPARTMENTS.forEach(dept => {
    const deptCode = deptCodeMap[dept];
    pathways.push({
      id: `minor-${dept.toLowerCase().replace(/ /g, '-')}`,
      name: `Minor in ${dept}`,
      type: 'minor',
      description: `A focused study in ${dept} to complement your major.`,
      requiredCredits: 18,
      requiredCourses: [
        `${deptCode}-101`,
        `${deptCode}-201`,
      ],
      electiveCredits: 6,
      departmentRequirements: {
        [dept]: 18,
      },
      minGPA: 200,
    });
  });

  return pathways;
}

// Generate assignments for a course
export function generateCourseAssignments(course: Course): Assignment[] {
  const assignments: Assignment[] = [];
  const baseId = course.id.replace('-', '_');

  // Weekly participation
  assignments.push({
    id: `${baseId}_participation`,
    courseId: course.id,
    title: 'Class Participation',
    description: 'Active engagement in class discussions and activities throughout the semester.',
    type: 'participation',
    maxPoints: 100,
    weight: 20,
    dueDate: 'End of Semester',
    content: {
      requirements: ['Attend classes regularly', 'Contribute to discussions', 'Complete in-class activities'],
    },
    requirements: {},
  });

  // Midterm exam
  assignments.push({
    id: `${baseId}_midterm`,
    courseId: course.id,
    title: 'Midterm Examination',
    description: 'Comprehensive exam covering the first half of the course material.',
    type: 'exam',
    maxPoints: 100,
    weight: 20,
    dueDate: 'Week 8',
    content: generateExamContent(course, 'midterm'),
    requirements: { intelligence: 10 },
  });

  // Weekly assignments
  for (let i = 1; i <= 4; i++) {
    assignments.push({
      id: `${baseId}_assignment_${i}`,
      courseId: course.id,
      title: `Assignment ${i}`,
      description: `Written assignment covering recent course material.`,
      type: i % 2 === 0 ? 'essay' : 'project',
      maxPoints: 100,
      weight: 7.5,
      dueDate: `Week ${i * 3}`,
      content: generateAssignmentContent(course, i),
      requirements: {},
    });
  }

  // Final project
  assignments.push({
    id: `${baseId}_final`,
    courseId: course.id,
    title: 'Final Project',
    description: 'Comprehensive final project demonstrating mastery of course concepts.',
    type: 'project',
    maxPoints: 100,
    weight: 30,
    dueDate: 'Finals Week',
    content: generateProjectContent(course),
    requirements: { intelligence: 15, perception: 10 },
  });

  return assignments;
}

function generateExamContent(course: Course, examType: string): AssignmentContent {
  return {
    questions: [
      {
        question: `Define the key principles of ${course.department} as covered in this course.`,
        type: 'essay',
        points: 25,
      },
      {
        question: `Explain the practical applications of concepts learned in ${course.name}.`,
        type: 'essay',
        points: 25,
      },
      {
        question: `Analyze a case study related to ${course.department}.`,
        type: 'essay',
        points: 25,
      },
      {
        question: `Discuss the ethical considerations in ${course.department}.`,
        type: 'short-answer',
        points: 25,
      },
    ],
  };
}

function generateAssignmentContent(course: Course, assignmentNumber: number): AssignmentContent {
  return {
    prompt: `Complete the following assignment for ${course.name}. Demonstrate your understanding of recent course material.`,
    requirements: [
      'Minimum 500 words',
      'Cite at least 2 course readings',
      'Include practical examples',
      'Submit by the due date',
    ],
  };
}

function generateProjectContent(course: Course): AssignmentContent {
  return {
    prompt: `Design and complete a comprehensive project demonstrating mastery of ${course.name}. Your project should synthesize concepts from throughout the semester.`,
    requirements: [
      'Original work demonstrating deep understanding',
      'Practical application of course concepts',
      'Presentation-ready format',
      'Bibliography of sources used',
      'Reflection on learning outcomes',
    ],
  };
}
