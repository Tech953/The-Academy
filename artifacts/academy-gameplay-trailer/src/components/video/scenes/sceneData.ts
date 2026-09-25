export type SceneMode =
  | 'boot'
  | 'creator'
  | 'factions'
  | 'directory'
  | 'terminal'
  | 'dialogue'
  | 'confluence'
  | 'catalog'
  | 'practice'
  | 'progress'
  | 'notebook'
  | 'radiant'
  | 'character'
  | 'mobile'
  | 'finale';

export interface AcademySceneData {
  key: string;
  title: string;
  mode: SceneMode;
  eyebrow: string;
  headline: string;
  beats: string[];
  records: string[];
  accent?: 'green' | 'cyan' | 'amber';
}

export const ACADEMY_SCENES: AcademySceneData[] = [
  {
    key: 'archive',
    title: 'Archive Online',
    mode: 'boot',
    eyebrow: 'SYSTEM // INITIALIZATION',
    headline: 'THE ARCHIVE IS AWAKE.',
    beats: [
      '144 SUBJECTS. ONE CAMPUS.',
      'A WORLD TO EXPLORE.',
      'YOUR STORY STARTS HERE.',
      'INSTITUTIONAL MANAGEMENT SYSTEM',
      'MOTHER-ARCHIVE // OBSERVING',
    ],
    records: ['POWER ON', 'ARCHIVE READY', 'TERMINAL ACTIVE'],
  },
  {
    key: 'student',
    title: 'Build Your Student',
    mode: 'creator',
    eyebrow: 'CHARACTER CREATION',
    headline: 'BUILD YOUR STUDENT.',
    beats: [
      'NAME: AVERY',
      'RACE: HUMAN',
      'CLASS MEETS SUBCLASS.',
      'BACKGROUND: CURIOUS',
      'STUDENT FILE CREATED.',
    ],
    records: ['NAME', 'RACE', 'CLASS', 'SUBCLASS', 'BACKGROUND', 'FACTION'],
  },
  {
    key: 'alignment',
    title: 'Choose an Alignment',
    mode: 'factions',
    eyebrow: 'CHOOSE AN ALIGNMENT',
    headline: 'FIVE FACTIONS.',
    beats: [
      'ARCHIVIST',
      'RAIDER',
      'OUTCAST',
      'AI',
      'MAGI',
      'PHYSICAL',
      'MENTAL',
      'SPIRITUAL',
      'YOUR BUILD. YOUR LENS.',
    ],
    records: ['ARCHIVIST', 'RAIDER', 'OUTCAST', 'AI', 'MAGI'],
  },
  {
    key: 'campus',
    title: 'Explore the Campus',
    mode: 'directory',
    eyebrow: 'CAMPUS DIRECTORY // 12 LOCATIONS',
    headline: 'THE CAMPUS IS THE MAP.',
    beats: [
      'MAIN LOBBY',
      'CAFETERIA',
      'LIBRARY (LARCEN)',
      'COMPUTER HALL',
      'CHEMISTRY LAB A',
      'GYMNASIUM (RIXIK)',
      'GUIDANCE COUNSELOR',
      'ART EXHIBIT HALL',
      'HEAD MASTER’S OFFICE — LOCKED',
    ],
    records: [
      'MAIN LOBBY',
      'CAFETERIA',
      'LIBRARY (LARCEN)',
      'COMPUTER HALL',
      'CHEMISTRY LAB A',
      'GYMNASIUM (RIXIK)',
      'GUIDANCE COUNSELOR',
      'ART EXHIBIT HALL',
      'HEAD MASTER’S OFFICE  /  LOCKED',
    ],
    accent: 'cyan',
  },
  {
    key: 'commands',
    title: 'Type. Look. Go.',
    mode: 'terminal',
    eyebrow: 'INTERFACE // COMMAND LINE',
    headline: 'TYPE. LOOK. GO.',
    beats: [
      '> HELP',
      '> LOOK',
      '> GO NORTH',
      '> EXAMINE LIBRARY',
      '> STATUS',
      'DIRECTIONS',
      'CURRENT LOCATION',
      'STUDENT STATUS',
    ],
    records: ['HELP', 'LOOK', 'GO NORTH', 'EXAMINE LIBRARY', 'STATUS'],
  },
  {
    key: 'people',
    title: 'People & Reputation',
    mode: 'dialogue',
    eyebrow: 'SOCIAL SYSTEMS',
    headline: 'TALK IS GAMEPLAY.',
    beats: [
      '> TALK TO EMILY',
      'Good to meet you.',
      'Faction changes the tone.',
      'FRIENDSHIP',
      'FACULTY REPUTATION',
      'STUDENT REPUTATION',
      'MYSTERIOUS REPUTATION',
    ],
    records: ['FRIENDSHIP', 'FACULTY', 'STUDENTS', 'MYSTERIOUS'],
    accent: 'amber',
  },
  {
    key: 'confluence',
    title: 'Confluence Hall',
    mode: 'confluence',
    eyebrow: 'CONFLUENCE HALL',
    headline: 'FOLLOW THE STRANGE THREAD.',
    beats: [
      'A CLAIM.',
      'A COUNTERPOINT.',
      'CONTRADICTION MAP',
      'TRACE THE CONNECTION.',
      'YOUR NEXT MOVE.',
      'THE CAMPUS DOESN’T EXPLAIN EVERYTHING.',
    ],
    records: ['CLAIM', 'COUNTERPOINT', 'CONTRADICTION', 'CONFLUENCE HALL'],
    accent: 'amber',
  },
  {
    key: 'courses',
    title: 'Choose a Course',
    mode: 'catalog',
    eyebrow: 'GED PREPARATION // COURSE CATALOG',
    headline: 'CHOOSE A COURSE.',
    beats: [
      'MATHEMATICAL REASONING',
      'REASONING THROUGH LANGUAGE ARTS',
      'SOCIAL STUDIES',
      'SCIENCE',
      '> ENROLL',
      'A COURSE BECOMES PART OF YOUR STORY.',
    ],
    records: [
      'MATHEMATICAL REASONING',
      'REASONING THROUGH LANGUAGE ARTS',
      'SOCIAL STUDIES',
      'SCIENCE',
    ],
  },
  {
    key: 'practice',
    title: 'Practice & Learn',
    mode: 'practice',
    eyebrow: 'STUDY LOOP',
    headline: 'LEARNING IS PLAY.',
    beats: [
      'STUDY',
      'PRACTICE',
      'FEEDBACK',
      'NEXT STEP',
      'WHICH OPERATION ISOLATES X?',
      'ADD',
      'SUBTRACT',
      'MULTIPLY',
      'CHECK YOUR REASONING',
      'ONE STEP CLOSER.',
    ],
    records: ['x + 7 = 12', 'ADD', 'SUBTRACT', 'MULTIPLY'],
  },
  {
    key: 'mastery',
    title: 'Track Your Progress',
    mode: 'progress',
    eyebrow: 'ACADEMIC PROGRESS',
    headline: 'PROGRESS YOU CAN READ.',
    beats: [
      'ENROLLED',
      'IN PROGRESS',
      'MATHEMATICAL REASONING',
      'LANGUAGE ARTS',
      'SOCIAL STUDIES',
      'SCIENCE',
      'GED READY',
      'MASTERY ACROSS ALL GED DOMAINS.',
    ],
    records: ['MATHEMATICS', 'LANGUAGE ARTS', 'SOCIAL STUDIES', 'SCIENCE'],
    accent: 'cyan',
  },
  {
    key: 'notebook',
    title: 'Research Notebook',
    mode: 'notebook',
    eyebrow: 'RESEARCH NOTEBOOK',
    headline: 'KEEP THE CLUES.',
    beats: [
      'NOTES',
      'TAGS',
      'BOOKMARKS',
      'GED',
      'CAMPUS',
      'MYSTERY',
      '> NOTES',
      'CONNECT WHAT YOU LEARN.',
    ],
    records: ['GED', 'CAMPUS', 'MYSTERY'],
  },
  {
    key: 'radiant',
    title: 'Radiant AI',
    mode: 'radiant',
    eyebrow: 'CONTEXT-AWARE DIALOGUE',
    headline: 'THE WORLD RESPONDS.',
    beats: [
      'RADIANT AI',
      'YOUR FACTION',
      'YOUR RECENT CHOICES',
      'THE PERSON IN FRONT OF YOU',
      'You asked about the library.',
      'There may be more here than books.',
      'LIVE WHEN AVAILABLE. LOCAL PATHS REMAIN.',
    ],
    records: ['YOUR FACTION', 'RECENT CHOICES', 'THE PERSON IN FRONT OF YOU'],
    accent: 'cyan',
  },
  {
    key: 'character',
    title: 'Character Growth',
    mode: 'character',
    eyebrow: 'CHARACTER SHEET',
    headline: 'GROW INTO YOUR ROLE.',
    beats: [
      'PHYSICAL',
      'MENTAL',
      'SPIRITUAL',
      'FACULTY',
      'STUDENTS',
      'MYSTERIOUS',
      'ENERGY',
      'PERKS',
      'YOUR CAMPUS STORY LEAVES A MARK.',
    ],
    records: ['PHYSICAL', 'MENTAL', 'SPIRITUAL', 'FACULTY', 'STUDENTS', 'MYSTERIOUS'],
    accent: 'amber',
  },
  {
    key: 'mobile',
    title: 'The Mobile Companion',
    mode: 'mobile',
    eyebrow: 'THE ACADEMY // MOBILE',
    headline: 'TAKE YOUR LEARNING WITH YOU.',
    beats: [
      'STUDY',
      'TRAVEL',
      'DIALOGUE',
      'OFFLINE-FIRST',
      'KEEP THE ADVENTURE MOVING.',
    ],
    records: ['STUDY', 'TRAVEL', 'DIALOGUE', 'OFFLINE-FIRST'],
    accent: 'cyan',
  },
  {
    key: 'finale',
    title: 'The Academy',
    mode: 'finale',
    eyebrow: 'BUILDATHON PROJECT',
    headline: 'THE ACADEMY',
    beats: [
      'PLAY.',
      'LEARN.',
      'BELONG.',
      'AN EDUCATIONAL RPG',
      'A CAMPUS ADVENTURE. A REAL LEARNING PATH.',
      'BUILT TO MAKE LEARNING PLAYABLE.',
    ],
    records: ['PLAY', 'LEARN', 'BELONG'],
  },
];