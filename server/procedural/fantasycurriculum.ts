/**
 * Fantasy Curriculum System - Preserved for Spin-off Release
 * 
 * This file contains the original fantasy-themed academic system featuring:
 * - Mysticism, Combat Arts, Arcane Sciences, and other magical disciplines
 * - Perfect for a fantasy/magical academy setting
 * - Can be activated via configuration to replace the realistic curriculum
 */

import type { Course, Assignment, GraduationPathway } from '@shared/schema';

// Fantasy department definitions
export const FANTASY_DEPARTMENTS = [
  'Mysticism',
  'History', 
  'Combat Arts',
  'Diplomacy',
  'Arcane Sciences',
  'Philosophy',
  'Investigation',
  'Leadership',
] as const;

export type FantasyDepartment = typeof FANTASY_DEPARTMENTS[number];

// Fantasy course templates by department
const FANTASY_COURSE_TEMPLATES: Record<FantasyDepartment, Array<{
  name: string;
  description: string;
  syllabus: string;
  prerequisites?: string[];
}>> = {
  'Mysticism': [
    {
      name: 'Introduction to Mystical Arts',
      description: 'Explore the fundamental principles of mystical energy manipulation and spiritual awareness.',
      syllabus: 'Week 1-3: Energy sensing and basic meditation\nWeek 4-6: Aura reading and interpretation\nWeek 7-9: Mystical theory and history\nWeek 10-12: Practical applications and ethics',
    },
    {
      name: 'Advanced Divination',
      description: 'Master the art of foresight through various mystical traditions and techniques.',
      syllabus: 'Week 1-3: Tarot and rune systems\nWeek 4-6: Crystal scrying methods\nWeek 7-9: Dream interpretation\nWeek 10-12: Prophetic meditation',
      prerequisites: ['MYST-101'],
    },
    {
      name: 'Ritual Magic Theory',
      description: 'Study the construction and execution of complex mystical rituals.',
      syllabus: 'Week 1-3: Ritual components and symbolism\nWeek 4-6: Circle casting and sacred space\nWeek 7-9: Lunar and seasonal influences\nWeek 10-12: Group ritual coordination',
      prerequisites: ['MYST-101', 'MYST-201'],
    },
    {
      name: 'Master-Level Mysticism',
      description: 'Synthesize mystical knowledge into personal practice and teaching methodology.',
      syllabus: 'Week 1-3: Personal mystical system development\nWeek 4-6: Advanced energy manipulation\nWeek 7-9: Teaching and mentorship\nWeek 10-12: Thesis presentation',
      prerequisites: ['MYST-301'],
    },
  ],
  'Combat Arts': [
    {
      name: 'Basic Combat Fundamentals',
      description: 'Learn essential combat techniques, body mechanics, and tactical awareness.',
      syllabus: 'Week 1-3: Stance, balance, and footwork\nWeek 4-6: Basic strikes and blocks\nWeek 7-9: Defensive maneuvers\nWeek 10-12: Sparring introduction',
    },
    {
      name: 'Weapons Mastery',
      description: 'Develop proficiency with traditional and exotic weaponry.',
      syllabus: 'Week 1-3: Sword techniques\nWeek 4-6: Staff and polearms\nWeek 7-9: Ranged weapons\nWeek 10-12: Weapon selection and maintenance',
      prerequisites: ['COMB-101'],
    },
    {
      name: 'Tactical Combat',
      description: 'Study battlefield strategy, group formations, and advanced combat tactics.',
      syllabus: 'Week 1-3: Battlefield awareness\nWeek 4-6: Formation combat\nWeek 7-9: Terrain advantages\nWeek 10-12: Leadership in combat',
      prerequisites: ['COMB-101', 'COMB-201'],
    },
    {
      name: 'Combat Mastery',
      description: 'Achieve the pinnacle of martial skill through intensive practice and theory.',
      syllabus: 'Week 1-3: Personal style refinement\nWeek 4-6: Multiple opponent tactics\nWeek 7-9: Instructional methods\nWeek 10-12: Master demonstration',
      prerequisites: ['COMB-301'],
    },
  ],
  'Arcane Sciences': [
    {
      name: 'Introduction to Arcane Theory',
      description: 'Understand the scientific principles underlying magical phenomena.',
      syllabus: 'Week 1-3: Magical energy physics\nWeek 4-6: Spell construction basics\nWeek 7-9: Arcane notation systems\nWeek 10-12: Laboratory safety and ethics',
    },
    {
      name: 'Elemental Manipulation',
      description: 'Master the control of natural elements through arcane methodology.',
      syllabus: 'Week 1-3: Fire and heat manipulation\nWeek 4-6: Water and ice techniques\nWeek 7-9: Earth and stone control\nWeek 10-12: Air and lightning mastery',
      prerequisites: ['ARCA-101'],
    },
    {
      name: 'Transmutation Studies',
      description: 'Learn to alter matter and energy at the molecular level.',
      syllabus: 'Week 1-3: Material properties analysis\nWeek 4-6: Basic transmutation circles\nWeek 7-9: Complex transformations\nWeek 10-12: Conservation laws and limits',
      prerequisites: ['ARCA-101', 'ARCA-201'],
    },
    {
      name: 'Arcane Research Methods',
      description: 'Conduct original research in theoretical and applied arcane sciences.',
      syllabus: 'Week 1-3: Research design\nWeek 4-6: Experimental methodology\nWeek 7-9: Data analysis and peer review\nWeek 10-12: Thesis defense',
      prerequisites: ['ARCA-301'],
    },
  ],
  'Diplomacy': [
    {
      name: 'Fundamentals of Negotiation',
      description: 'Develop core skills in conflict resolution and agreement building.',
      syllabus: 'Week 1-3: Communication basics\nWeek 4-6: Active listening techniques\nWeek 7-9: Win-win negotiation\nWeek 10-12: Cultural sensitivity',
    },
    {
      name: 'Political Systems',
      description: 'Study various governmental structures and political philosophies.',
      syllabus: 'Week 1-3: Monarchies and hereditary rule\nWeek 4-6: Democratic systems\nWeek 7-9: Theocracies and religious governance\nWeek 10-12: Comparative analysis',
      prerequisites: ['DIPL-101'],
    },
    {
      name: 'International Relations',
      description: 'Navigate complex multi-party negotiations and alliance building.',
      syllabus: 'Week 1-3: Treaty formation\nWeek 4-6: Trade agreements\nWeek 7-9: Military alliances\nWeek 10-12: Crisis diplomacy',
      prerequisites: ['DIPL-101', 'DIPL-201'],
    },
    {
      name: 'Ambassador Training',
      description: 'Prepare for high-level diplomatic service and representation.',
      syllabus: 'Week 1-3: Protocol and etiquette\nWeek 4-6: Crisis management\nWeek 7-9: Public speaking\nWeek 10-12: Diplomatic simulation',
      prerequisites: ['DIPL-301'],
    },
  ],
  'History': [
    {
      name: 'Ancient Civilizations',
      description: 'Explore the rise and fall of early magical and mortal societies.',
      syllabus: 'Week 1-3: Pre-magical era\nWeek 4-6: First magical awakening\nWeek 7-9: Ancient empires\nWeek 10-12: Classical period transitions',
    },
    {
      name: 'Medieval Studies',
      description: 'Examine the feudal era and the integration of magic into society.',
      syllabus: 'Week 1-3: Feudal systems\nWeek 4-6: Religious institutions\nWeek 7-9: Magical guilds formation\nWeek 10-12: Cultural developments',
      prerequisites: ['HIST-101'],
    },
    {
      name: 'Modern Historical Analysis',
      description: 'Analyze recent centuries and the development of contemporary institutions.',
      syllabus: 'Week 1-3: Industrial revolution effects\nWeek 4-6: Political revolutions\nWeek 7-9: Modern magical regulation\nWeek 10-12: Contemporary issues',
      prerequisites: ['HIST-101', 'HIST-201'],
    },
    {
      name: 'Historiography Seminar',
      description: 'Master the methods of historical research and interpretation.',
      syllabus: 'Week 1-3: Source criticism\nWeek 4-6: Historical methodology\nWeek 7-9: Thesis development\nWeek 10-12: Original research presentation',
      prerequisites: ['HIST-301'],
    },
  ],
  'Philosophy': [
    {
      name: 'Introduction to Philosophy',
      description: 'Survey major philosophical traditions and fundamental questions.',
      syllabus: 'Week 1-3: What is philosophy?\nWeek 4-6: Logic and reasoning\nWeek 7-9: Ethics and morality\nWeek 10-12: Metaphysics basics',
    },
    {
      name: 'Ethics and Morality',
      description: 'Examine moral frameworks and their application to magical practice.',
      syllabus: 'Week 1-3: Virtue ethics\nWeek 4-6: Consequentialism\nWeek 7-9: Deontological ethics\nWeek 10-12: Applied ethics in magic',
      prerequisites: ['PHIL-101'],
    },
    {
      name: 'Metaphysics',
      description: 'Study the nature of reality, existence, and consciousness.',
      syllabus: 'Week 1-3: Reality and illusion\nWeek 4-6: Free will vs determinism\nWeek 7-9: Consciousness studies\nWeek 10-12: Magical ontology',
      prerequisites: ['PHIL-101', 'PHIL-201'],
    },
    {
      name: 'Advanced Philosophical Systems',
      description: 'Develop original philosophical frameworks incorporating magical theory.',
      syllabus: 'Week 1-3: Philosophical methodology\nWeek 4-6: System construction\nWeek 7-9: Peer critique\nWeek 10-12: Thesis defense',
      prerequisites: ['PHIL-301'],
    },
  ],
  'Investigation': [
    {
      name: 'Detective Fundamentals',
      description: 'Learn core investigative techniques and evidence analysis.',
      syllabus: 'Week 1-3: Observation skills\nWeek 4-6: Evidence collection\nWeek 7-9: Interview techniques\nWeek 10-12: Case analysis',
    },
    {
      name: 'Forensic Magic',
      description: 'Apply arcane methods to crime scene investigation.',
      syllabus: 'Week 1-3: Magical trace detection\nWeek 4-6: Spell residue analysis\nWeek 7-9: Temporal reconstruction\nWeek 10-12: Testimony verification',
      prerequisites: ['INVS-101'],
    },
    {
      name: 'Criminal Psychology',
      description: 'Understand criminal behavior patterns and motivations.',
      syllabus: 'Week 1-3: Behavioral profiling\nWeek 4-6: Interrogation tactics\nWeek 7-9: Deception detection\nWeek 10-12: Case studies',
      prerequisites: ['INVS-101', 'INVS-201'],
    },
    {
      name: 'Advanced Case Management',
      description: 'Lead complex investigations from initial report to resolution.',
      syllabus: 'Week 1-3: Team coordination\nWeek 4-6: Resource allocation\nWeek 7-9: Legal procedures\nWeek 10-12: Mock investigation',
      prerequisites: ['INVS-301'],
    },
  ],
  'Leadership': [
    {
      name: 'Leadership Principles',
      description: 'Develop foundational leadership skills and self-awareness.',
      syllabus: 'Week 1-3: Leadership styles\nWeek 4-6: Communication skills\nWeek 7-9: Team dynamics\nWeek 10-12: Personal leadership philosophy',
    },
    {
      name: 'Organizational Management',
      description: 'Master the administration of groups and institutions.',
      syllabus: 'Week 1-3: Organizational structure\nWeek 4-6: Resource management\nWeek 7-9: Conflict resolution\nWeek 10-12: Performance evaluation',
      prerequisites: ['LEAD-101'],
    },
    {
      name: 'Strategic Planning',
      description: 'Learn to develop and execute long-term organizational strategies.',
      syllabus: 'Week 1-3: Vision development\nWeek 4-6: Strategic analysis\nWeek 7-9: Implementation planning\nWeek 10-12: Assessment and adaptation',
      prerequisites: ['LEAD-101', 'LEAD-201'],
    },
    {
      name: 'Executive Leadership',
      description: 'Prepare for senior leadership roles in major organizations.',
      syllabus: 'Week 1-3: High-level decision making\nWeek 4-6: Crisis leadership\nWeek 7-9: Change management\nWeek 10-12: Leadership simulation',
      prerequisites: ['LEAD-301'],
    },
  ],
};

const DEPT_CODE_MAP: Record<FantasyDepartment, string> = {
  'Mysticism': 'MYST',
  'Combat Arts': 'COMB',
  'Arcane Sciences': 'ARCA',
  'Diplomacy': 'DIPL',
  'History': 'HIST',
  'Philosophy': 'PHIL',
  'Investigation': 'INVS',
  'Leadership': 'LEAD',
};

/**
 * Generate fantasy-themed courses
 * Can be used to replace the realistic curriculum for a fantasy spin-off
 */
export function generateFantasyCourses(): Course[] {
  const courses: Course[] = [];

  FANTASY_DEPARTMENTS.forEach(dept => {
    const deptCode = DEPT_CODE_MAP[dept];
    const templates = FANTASY_COURSE_TEMPLATES[dept];
    
    // Generate courses at each level
    const levels = [
      { level: 100, count: 3 },
      { level: 200, count: 4 },
      { level: 300, count: 3 },
      { level: 400, count: 2 },
    ];

    levels.forEach(({ level, count }) => {
      for (let i = 0; i < count; i++) {
        const templateIndex = Math.floor((level - 100) / 100);
        const template = templates[templateIndex % templates.length];
        
        const courseNumber = level + i + 1;
        const courseCode = `${deptCode}-${courseNumber}`;
        
        courses.push({
          id: courseCode,
          name: template.name,
          department: dept,
          credits: 3,
          level: level,
          description: template.description,
          syllabus: template.syllabus,
          prerequisites: template.prerequisites || [],
          professorId: `npc-${Math.floor(Math.random() * 20) + 1}`, // Random professor assignment
          schedule: {
            daysOfWeek: ['Monday', 'Wednesday', 'Friday'],
            timeSlot: '9:00 AM - 10:30 AM',
            location: `${dept} Hall, Room ${100 + Math.floor(Math.random() * 50)}`,
          },
          maxStudents: 25,
          categoryTags: ['elective'],
          difficulty: level >= 300 ? 4 : level >= 200 ? 3 : level >= 100 ? 2 : 1,
        });
      }
    });
  });

  return courses;
}

/**
 * Generate fantasy graduation pathways
 */
export function generateFantasyPathways(): GraduationPathway[] {
  const pathways: GraduationPathway[] = [];

  // Major pathways
  FANTASY_DEPARTMENTS.forEach(dept => {
    const deptCode = DEPT_CODE_MAP[dept];
    pathways.push({
      id: `major-${dept.toLowerCase().replace(/ /g, '-')}`,
      name: `Master of ${dept}`,
      type: 'major',
      description: `A comprehensive program in ${dept}, preparing students for mastery of this discipline.`,
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
        [dept]: 48,
        'Core': 24,
      },
      minGPA: 200,
    });
  });

  // Minor pathways
  FANTASY_DEPARTMENTS.forEach(dept => {
    const deptCode = DEPT_CODE_MAP[dept];
    pathways.push({
      id: `minor-${dept.toLowerCase().replace(/ /g, '-')}`,
      name: `Specialization in ${dept}`,
      type: 'minor',
      description: `A focused study in ${dept} to complement your primary discipline.`,
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

/**
 * Configuration flag to enable fantasy curriculum
 * Set to true to use fantasy theme instead of realistic courses
 */
export const USE_FANTASY_CURRICULUM = false;
