export interface ScheduleEntry {
  id: string;
  time: string;
  subject: string;
  instructor: string;
  room: string;
  type: 'core' | 'elective' | 'study' | 'break';
  courseId?: string;
}

export interface AssignmentData {
  id: string;
  title: string;
  subject: string;
  courseId: string;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  grade?: number;
  description?: string;
  type: 'essay' | 'exam' | 'project' | 'participation' | 'quiz';
  maxPoints: number;
}

export const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'] as const;
export type DayOfWeek = typeof DAYS[number];

export const GED_SUBJECTS = {
  MATH: { id: 'math', name: 'Mathematical Reasoning', color: '#00ff00' },
  RLA: { id: 'rla', name: 'Reasoning Through Language Arts', color: '#00ffff' },
  SCIENCE: { id: 'science', name: 'Science', color: '#cc66ff' },
  SOCIAL: { id: 'social', name: 'Social Studies', color: '#ffaa00' },
} as const;

export const INSTRUCTORS = {
  CHEN: { id: 'chen', name: 'Prof. Chen', subject: 'Mathematics' },
  THOMPSON: { id: 'thompson', name: 'Mrs. Thompson', subject: 'Language Arts' },
  PATEL: { id: 'patel', name: 'Dr. Patel', subject: 'Science' },
  RIVERA: { id: 'rivera', name: 'Mr. Rivera', subject: 'Social Studies' },
  GARCIA: { id: 'garcia', name: 'Ms. Garcia', subject: 'Arts & Music' },
  DAVIS: { id: 'davis', name: 'Coach Davis', subject: 'Physical Education' },
} as const;

export const DEFAULT_SCHEDULE: Record<DayOfWeek, ScheduleEntry[]> = {
  MONDAY: [
    { id: 'm1', time: '08:00', subject: 'Mathematical Reasoning', instructor: 'Prof. Chen', room: 'Room 101', type: 'core', courseId: 'MATH-101' },
    { id: 'm2', time: '09:30', subject: 'Language Arts', instructor: 'Mrs. Thompson', room: 'Room 205', type: 'core', courseId: 'RLA-101' },
    { id: 'm3', time: '11:00', subject: 'BREAK', instructor: '', room: 'Cafeteria', type: 'break' },
    { id: 'm4', time: '12:00', subject: 'Social Studies', instructor: 'Mr. Rivera', room: 'Room 303', type: 'core', courseId: 'SOC-101' },
    { id: 'm5', time: '14:00', subject: 'Study Hall', instructor: '', room: 'Library', type: 'study' },
  ],
  TUESDAY: [
    { id: 't1', time: '08:00', subject: 'Science', instructor: 'Dr. Patel', room: 'Lab A', type: 'core', courseId: 'SCI-101' },
    { id: 't2', time: '09:30', subject: 'Algebra', instructor: 'Prof. Chen', room: 'Room 101', type: 'core', courseId: 'MATH-102' },
    { id: 't3', time: '11:00', subject: 'BREAK', instructor: '', room: 'Cafeteria', type: 'break' },
    { id: 't4', time: '12:00', subject: 'Creative Writing', instructor: 'Mrs. Thompson', room: 'Room 205', type: 'elective', courseId: 'RLA-201' },
    { id: 't5', time: '14:00', subject: 'Physical Education', instructor: 'Coach Davis', room: 'Gymnasium', type: 'elective', courseId: 'PE-101' },
  ],
  WEDNESDAY: [
    { id: 'w1', time: '08:00', subject: 'Language Arts', instructor: 'Mrs. Thompson', room: 'Room 205', type: 'core', courseId: 'RLA-101' },
    { id: 'w2', time: '09:30', subject: 'Mathematical Reasoning', instructor: 'Prof. Chen', room: 'Room 101', type: 'core', courseId: 'MATH-101' },
    { id: 'w3', time: '11:00', subject: 'BREAK', instructor: '', room: 'Cafeteria', type: 'break' },
    { id: 'w4', time: '12:00', subject: 'Science Lab', instructor: 'Dr. Patel', room: 'Lab A', type: 'core', courseId: 'SCI-101' },
    { id: 'w5', time: '14:00', subject: 'Art & Music', instructor: 'Ms. Garcia', room: 'Art Studio', type: 'elective', courseId: 'ART-101' },
  ],
  THURSDAY: [
    { id: 'th1', time: '08:00', subject: 'Social Studies', instructor: 'Mr. Rivera', room: 'Room 303', type: 'core', courseId: 'SOC-101' },
    { id: 'th2', time: '09:30', subject: 'Science', instructor: 'Dr. Patel', room: 'Lab A', type: 'core', courseId: 'SCI-101' },
    { id: 'th3', time: '11:00', subject: 'BREAK', instructor: '', room: 'Cafeteria', type: 'break' },
    { id: 'th4', time: '12:00', subject: 'Language Arts', instructor: 'Mrs. Thompson', room: 'Room 205', type: 'core', courseId: 'RLA-101' },
    { id: 'th5', time: '14:00', subject: 'Study Hall', instructor: '', room: 'Library', type: 'study' },
  ],
  FRIDAY: [
    { id: 'f1', time: '08:00', subject: 'Algebra Review', instructor: 'Prof. Chen', room: 'Room 101', type: 'core', courseId: 'MATH-102' },
    { id: 'f2', time: '09:30', subject: 'Reading Comprehension', instructor: 'Mrs. Thompson', room: 'Room 205', type: 'core', courseId: 'RLA-101' },
    { id: 'f3', time: '11:00', subject: 'BREAK', instructor: '', room: 'Cafeteria', type: 'break' },
    { id: 'f4', time: '12:00', subject: 'GED Prep Workshop', instructor: 'Various', room: 'Auditorium', type: 'core' },
    { id: 'f5', time: '14:00', subject: 'Free Period', instructor: '', room: '', type: 'study' },
  ],
};

export const DEFAULT_ASSIGNMENTS: AssignmentData[] = [
  { 
    id: 'a1', 
    title: 'Mathematical Reasoning Quiz', 
    subject: 'Mathematics', 
    courseId: 'MATH-101',
    dueDate: 'Tomorrow', 
    status: 'pending',
    type: 'quiz',
    maxPoints: 50,
    description: 'Basic algebra and number operations'
  },
  { 
    id: 'a2', 
    title: 'Essay: Personal Narrative', 
    subject: 'Language Arts', 
    courseId: 'RLA-101',
    dueDate: 'In 3 days', 
    status: 'in_progress',
    type: 'essay',
    maxPoints: 100,
    description: 'Write a 500-word personal narrative'
  },
  { 
    id: 'a3', 
    title: 'Science Lab Report', 
    subject: 'Science', 
    courseId: 'SCI-101',
    dueDate: 'Next Week', 
    status: 'pending',
    type: 'project',
    maxPoints: 75,
    description: 'Document your lab experiment findings'
  },
  { 
    id: 'a4', 
    title: 'Social Studies Reading', 
    subject: 'Social Studies', 
    courseId: 'SOC-101',
    dueDate: 'Completed', 
    status: 'completed', 
    grade: 92,
    type: 'participation',
    maxPoints: 100,
    description: 'Chapter 5: American Government'
  },
  { 
    id: 'a5', 
    title: 'Algebra Practice Set', 
    subject: 'Mathematics', 
    courseId: 'MATH-102',
    dueDate: 'Yesterday', 
    status: 'overdue',
    type: 'quiz',
    maxPoints: 50,
    description: 'Practice problems for linear equations'
  },
];

export function getScheduleForDay(day: DayOfWeek): ScheduleEntry[] {
  return DEFAULT_SCHEDULE[day] || [];
}

export function getAssignmentsByStatus(status?: AssignmentData['status']): AssignmentData[] {
  if (!status) return DEFAULT_ASSIGNMENTS;
  return DEFAULT_ASSIGNMENTS.filter(a => a.status === status);
}

export function getAssignmentsBySubject(subject: string): AssignmentData[] {
  return DEFAULT_ASSIGNMENTS.filter(a => a.subject === subject);
}
