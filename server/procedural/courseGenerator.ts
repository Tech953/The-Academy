import type { Course, Assignment, GraduationPathway, CourseSchedule, AssignmentContent } from '@shared/schema';

// Academy departments aligned with game themes
export const DEPARTMENTS = [
  'Mysticism',
  'History',
  'Combat Arts',
  'Diplomacy',
  'Arcane Sciences',
  'Philosophy',
  'Investigation',
  'Leadership',
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
  const deptCode = department.substring(0, 4).toUpperCase();

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
    'Mysticism': [
      {
        name: 'Introduction to the Arcane',
        description: 'Explore the fundamental principles of mystical energy manipulation and perception. Learn to sense and channel basic arcane forces.',
        topics: ['Energy Perception', 'Basic Channeling', 'Mystical Theory', 'Safety Protocols'],
      },
      {
        name: 'Advanced Scrying Techniques',
        description: 'Master the art of distant observation and information gathering through mystical means.',
        topics: ['Remote Viewing', 'Temporal Scrying', 'Warding Detection', 'Ethical Considerations'],
      },
      {
        name: 'Dimensional Theory',
        description: 'Study the nature of reality, parallel dimensions, and the spaces between worlds.',
        topics: ['Planar Geography', 'Dimensional Rifts', 'Portal Mechanics', 'Safety Protocols'],
      },
    ],
    'History': [
      {
        name: 'Academy Origins',
        description: 'Uncover the mysterious founding of The Academy and its enigmatic purpose.',
        topics: ['Founding Era', 'Original 144', 'Hidden Archives', 'Unexplained Events'],
      },
      {
        name: 'Secret Societies Through Time',
        description: 'Examine the role of secret organizations in shaping world events.',
        topics: ['Known Organizations', 'Power Structures', 'Historical Influence', 'Modern Connections'],
      },
      {
        name: 'Forbidden Knowledge',
        description: 'Study the historical suppression of dangerous information and its consequences.',
        topics: ['Lost Civilizations', 'Censored Records', 'Recovered Texts', 'Modern Implications'],
      },
    ],
    'Combat Arts': [
      {
        name: 'Tactical Analysis',
        description: 'Learn to assess combat situations and develop effective strategies.',
        topics: ['Threat Assessment', 'Resource Management', 'Team Tactics', 'Adaptation'],
      },
      {
        name: 'Advanced Self-Defense',
        description: 'Master defensive techniques for various threat scenarios.',
        topics: ['Hand-to-Hand Combat', 'Weapon Defense', 'Environmental Awareness', 'De-escalation'],
      },
      {
        name: 'Strategic Leadership',
        description: 'Develop skills for leading others in high-pressure situations.',
        topics: ['Command Presence', 'Decision Making', 'Team Coordination', 'Crisis Management'],
      },
    ],
    'Diplomacy': [
      {
        name: 'Negotiation Fundamentals',
        description: 'Master the art of productive discourse and conflict resolution.',
        topics: ['Active Listening', 'Win-Win Strategies', 'Cultural Sensitivity', 'Mediation'],
      },
      {
        name: 'Social Engineering',
        description: 'Study the psychology of influence and persuasion.',
        topics: ['Trust Building', 'Behavioral Analysis', 'Persuasion Techniques', 'Ethical Boundaries'],
      },
      {
        name: 'Coalition Building',
        description: 'Learn to form and maintain strategic alliances.',
        topics: ['Stakeholder Analysis', 'Alliance Management', 'Conflict Resolution', 'Long-term Partnerships'],
      },
    ],
    'Arcane Sciences': [
      {
        name: 'Magical Mathematics',
        description: 'Explore the mathematical foundations underlying mystical phenomena.',
        topics: ['Geometric Principles', 'Numerical Resonance', 'Pattern Recognition', 'Practical Applications'],
      },
      {
        name: 'Artifact Analysis',
        description: 'Study techniques for identifying and safely handling enchanted objects.',
        topics: ['Detection Methods', 'Power Assessment', 'Curse Identification', 'Containment Protocols'],
      },
      {
        name: 'Energy Systems',
        description: 'Examine the flow and interaction of various mystical energy types.',
        topics: ['Energy Classification', 'Interference Patterns', 'Amplification', 'Dampening Fields'],
      },
    ],
    'Philosophy': [
      {
        name: 'Ethics of Power',
        description: 'Examine moral frameworks for wielding supernatural abilities.',
        topics: ['Responsibility', 'Moral Dilemmas', 'Historical Case Studies', 'Personal Code Development'],
      },
      {
        name: 'Nature of Reality',
        description: 'Question fundamental assumptions about existence and perception.',
        topics: ['Epistemology', 'Metaphysics', 'Consciousness', 'Reality Manipulation'],
      },
      {
        name: 'Logic and Reasoning',
        description: 'Develop critical thinking skills essential for navigating deception.',
        topics: ['Logical Fallacies', 'Argument Analysis', 'Evidence Evaluation', 'Sound Reasoning'],
      },
    ],
    'Investigation': [
      {
        name: 'Evidence Collection',
        description: 'Learn systematic approaches to gathering and preserving information.',
        topics: ['Scene Analysis', 'Documentation', 'Chain of Custody', 'Digital Forensics'],
      },
      {
        name: 'Deductive Reasoning',
        description: 'Master the art of drawing conclusions from incomplete information.',
        topics: ['Pattern Recognition', 'Hypothesis Testing', 'Elimination', 'Intuition vs Logic'],
      },
      {
        name: 'Interrogation Techniques',
        description: 'Study methods for extracting truth from reluctant sources.',
        topics: ['Behavioral Cues', 'Questioning Strategies', 'Building Rapport', 'Detecting Deception'],
      },
    ],
    'Leadership': [
      {
        name: 'Principles of Command',
        description: 'Understand the foundations of effective leadership.',
        topics: ['Authority vs Influence', 'Vision Setting', 'Accountability', 'Leading by Example'],
      },
      {
        name: 'Team Dynamics',
        description: 'Study how groups function and how to optimize performance.',
        topics: ['Group Psychology', 'Conflict Management', 'Motivation', 'Diversity & Inclusion'],
      },
      {
        name: 'Strategic Planning',
        description: 'Develop long-term thinking and organizational skills.',
        topics: ['Goal Setting', 'Resource Allocation', 'Risk Assessment', 'Adaptive Planning'],
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

  // Major pathways
  DEPARTMENTS.forEach(dept => {
    const deptCode = dept.substring(0, 4).toUpperCase();
    pathways.push({
      id: `major-${dept.toLowerCase().replace(' ', '-')}`,
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
    const deptCode = dept.substring(0, 4).toUpperCase();
    pathways.push({
      id: `minor-${dept.toLowerCase().replace(' ', '-')}`,
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
