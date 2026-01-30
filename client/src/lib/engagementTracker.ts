import { EngagementEvent, EngagementAnalytics, TextbookUsage, AssignmentUsage, NotesUsage, EngagementSummary } from '@shared/schema';

export function createEngagementEvent(
  type: EngagementEvent['type'],
  resourceId: string,
  metadata: Record<string, unknown> = {}
): EngagementEvent {
  return {
    id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    resourceId,
    timestamp: new Date().toISOString(),
    metadata
  };
}

export function createInitialAnalytics(characterId: string): EngagementAnalytics {
  return {
    characterId,
    events: [],
    textbookUsage: {},
    assignmentUsage: {},
    notesUsage: {},
    sessionStats: {
      totalSessions: 0,
      totalStudyTime: 0,
      averageSessionLength: 0,
      lastSessionStart: null,
      currentSessionStart: null
    },
    dailyStreak: {
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: null
    }
  };
}

export function logEngagementEvent(
  analytics: EngagementAnalytics,
  event: EngagementEvent
): EngagementAnalytics {
  const updatedEvents = [...analytics.events, event].slice(-500);
  
  let updatedAnalytics = {
    ...analytics,
    events: updatedEvents
  };

  switch (event.type) {
    case 'textbook_open':
    case 'textbook_read':
    case 'chapter_complete':
      updatedAnalytics = updateTextbookUsage(updatedAnalytics, event);
      break;
    case 'note_create':
    case 'note_edit':
    case 'note_read':
      updatedAnalytics = updateNotesUsage(updatedAnalytics, event);
      break;
    case 'assignment_start':
    case 'assignment_submit':
    case 'exam_start':
    case 'exam_submit':
      updatedAnalytics = updateAssignmentUsage(updatedAnalytics, event);
      break;
    case 'session_start':
      updatedAnalytics = startSession(updatedAnalytics);
      break;
    case 'session_end':
      updatedAnalytics = endSession(updatedAnalytics);
      break;
  }

  return updateDailyStreak(updatedAnalytics);
}

function updateTextbookUsage(
  analytics: EngagementAnalytics,
  event: EngagementEvent
): EngagementAnalytics {
  const textbookId = event.resourceId;
  const existing = analytics.textbookUsage[textbookId] || createTextbookUsage(textbookId);
  
  const updated: TextbookUsage = {
    ...existing,
    lastAccessed: event.timestamp
  };

  if (event.type === 'textbook_open') {
    updated.accessCount = (existing.accessCount || 0) + 1;
  } else if (event.type === 'textbook_read') {
    const readTime = (event.metadata.duration as number) || 0;
    updated.totalReadTime = (existing.totalReadTime || 0) + readTime;
  } else if (event.type === 'chapter_complete') {
    const chapterId = event.metadata.chapterId as string;
    if (chapterId && !updated.chaptersCompleted.includes(chapterId)) {
      updated.chaptersCompleted = [...updated.chaptersCompleted, chapterId];
    }
  }

  return {
    ...analytics,
    textbookUsage: {
      ...analytics.textbookUsage,
      [textbookId]: updated
    }
  };
}

function updateNotesUsage(
  analytics: EngagementAnalytics,
  event: EngagementEvent
): EngagementAnalytics {
  const noteId = event.resourceId;
  const existing = analytics.notesUsage[noteId] || createNotesUsage(noteId);
  
  const updated: NotesUsage = {
    ...existing,
    lastAccessed: event.timestamp
  };

  if (event.type === 'note_create') {
    updated.createdAt = event.timestamp;
  } else if (event.type === 'note_edit') {
    updated.editCount = (existing.editCount || 0) + 1;
  } else if (event.type === 'note_read') {
    updated.readCount = (existing.readCount || 0) + 1;
  }

  return {
    ...analytics,
    notesUsage: {
      ...analytics.notesUsage,
      [noteId]: updated
    }
  };
}

function updateAssignmentUsage(
  analytics: EngagementAnalytics,
  event: EngagementEvent
): EngagementAnalytics {
  const assignmentId = event.resourceId;
  const existing = analytics.assignmentUsage[assignmentId] || createAssignmentUsage(assignmentId);
  
  const updated: AssignmentUsage = {
    ...existing,
    lastAccessed: event.timestamp
  };

  if (event.type === 'assignment_start' || event.type === 'exam_start') {
    updated.startedAt = event.timestamp;
    updated.attempts = (existing.attempts || 0) + 1;
  } else if (event.type === 'assignment_submit' || event.type === 'exam_submit') {
    updated.completedAt = event.timestamp;
    updated.score = event.metadata.score as number;
    updated.graded = true;
    if (updated.score !== undefined) {
      updated.scores = [...(existing.scores || []), updated.score];
    }
  }

  return {
    ...analytics,
    assignmentUsage: {
      ...analytics.assignmentUsage,
      [assignmentId]: updated
    }
  };
}

function startSession(analytics: EngagementAnalytics): EngagementAnalytics {
  return {
    ...analytics,
    sessionStats: {
      ...analytics.sessionStats,
      totalSessions: analytics.sessionStats.totalSessions + 1,
      currentSessionStart: new Date().toISOString()
    }
  };
}

function endSession(analytics: EngagementAnalytics): EngagementAnalytics {
  const currentStart = analytics.sessionStats.currentSessionStart;
  if (!currentStart) return analytics;

  const sessionLength = Date.now() - new Date(currentStart).getTime();
  const newTotalTime = analytics.sessionStats.totalStudyTime + sessionLength;
  const newTotalSessions = analytics.sessionStats.totalSessions;

  return {
    ...analytics,
    sessionStats: {
      ...analytics.sessionStats,
      totalStudyTime: newTotalTime,
      averageSessionLength: newTotalSessions > 0 ? newTotalTime / newTotalSessions : 0,
      lastSessionStart: currentStart,
      currentSessionStart: null
    }
  };
}

function updateDailyStreak(analytics: EngagementAnalytics): EngagementAnalytics {
  const today = new Date().toISOString().split('T')[0];
  const lastActive = analytics.dailyStreak.lastActiveDate;

  if (lastActive === today) {
    return analytics;
  }

  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const isConsecutive = lastActive === yesterday;

  return {
    ...analytics,
    dailyStreak: {
      currentStreak: isConsecutive ? analytics.dailyStreak.currentStreak + 1 : 1,
      longestStreak: Math.max(
        analytics.dailyStreak.longestStreak,
        isConsecutive ? analytics.dailyStreak.currentStreak + 1 : 1
      ),
      lastActiveDate: today
    }
  };
}

function createTextbookUsage(textbookId: string): TextbookUsage {
  return {
    textbookId,
    accessCount: 0,
    totalReadTime: 0,
    chaptersCompleted: [],
    lastAccessed: null
  };
}

function createNotesUsage(noteId: string): NotesUsage {
  return {
    noteId,
    createdAt: null,
    editCount: 0,
    readCount: 0,
    lastAccessed: null
  };
}

function createAssignmentUsage(assignmentId: string): AssignmentUsage {
  return {
    assignmentId,
    startedAt: null,
    completedAt: null,
    attempts: 0,
    score: undefined,
    scores: [],
    graded: false,
    lastAccessed: null
  };
}

export function calculateEngagementSummary(analytics: EngagementAnalytics): EngagementSummary {
  const textbooks = Object.values(analytics.textbookUsage);
  const assignments = Object.values(analytics.assignmentUsage);
  const notes = Object.values(analytics.notesUsage);

  const totalTextbooksAccessed = textbooks.filter(t => t.accessCount > 0).length;
  const totalChaptersCompleted = textbooks.reduce(
    (sum, t) => sum + t.chaptersCompleted.length,
    0
  );
  const totalReadTime = textbooks.reduce((sum, t) => sum + t.totalReadTime, 0);

  const completedAssignments = assignments.filter(a => a.graded);
  const totalScore = completedAssignments.reduce((sum, a) => sum + (a.score || 0), 0);
  const avgScore = completedAssignments.length > 0 
    ? Math.round(totalScore / completedAssignments.length) 
    : 0;

  const totalNotes = notes.length;
  const totalNoteEdits = notes.reduce((sum, n) => sum + n.editCount, 0);

  let engagementLevel: 'low' | 'medium' | 'high' | 'excellent' = 'low';
  const engagementScore = 
    totalTextbooksAccessed * 10 +
    totalChaptersCompleted * 15 +
    completedAssignments.length * 20 +
    totalNotes * 5 +
    analytics.dailyStreak.currentStreak * 5;

  if (engagementScore >= 200) engagementLevel = 'excellent';
  else if (engagementScore >= 100) engagementLevel = 'high';
  else if (engagementScore >= 50) engagementLevel = 'medium';

  return {
    engagementLevel,
    engagementScore,
    totalTextbooksAccessed,
    totalChaptersCompleted,
    totalReadTime,
    totalAssignmentsCompleted: completedAssignments.length,
    averageScore: avgScore,
    totalNotes,
    totalNoteEdits,
    studyStreak: analytics.dailyStreak.currentStreak,
    totalStudyTime: analytics.sessionStats.totalStudyTime,
    lastActive: analytics.dailyStreak.lastActiveDate
  };
}

export function getRecentActivity(
  analytics: EngagementAnalytics,
  limit: number = 10
): EngagementEvent[] {
  return analytics.events
    .slice(-limit)
    .reverse();
}

export function getSubjectBreakdown(
  analytics: EngagementAnalytics,
  courseMapping: Record<string, string>
): Record<string, { time: number; completed: number; avgScore: number }> {
  const subjects: Record<string, { time: number; completed: number; scores: number[] }> = {
    'Mathematical Reasoning': { time: 0, completed: 0, scores: [] },
    'Language Arts': { time: 0, completed: 0, scores: [] },
    'Science': { time: 0, completed: 0, scores: [] },
    'Social Studies': { time: 0, completed: 0, scores: [] }
  };

  Object.entries(analytics.textbookUsage).forEach(([textbookId, usage]) => {
    const subject = courseMapping[textbookId];
    if (subject && subjects[subject]) {
      subjects[subject].time += usage.totalReadTime;
      subjects[subject].completed += usage.chaptersCompleted.length;
    }
  });

  Object.entries(analytics.assignmentUsage).forEach(([assignmentId, usage]) => {
    const subject = courseMapping[assignmentId];
    if (subject && subjects[subject] && usage.graded && usage.score !== undefined) {
      subjects[subject].scores.push(usage.score);
    }
  });

  const result: Record<string, { time: number; completed: number; avgScore: number }> = {};
  Object.entries(subjects).forEach(([subject, data]) => {
    result[subject] = {
      time: data.time,
      completed: data.completed,
      avgScore: data.scores.length > 0 
        ? Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length)
        : 0
    };
  });

  return result;
}

export function formatEngagementStats(summary: EngagementSummary): string {
  const lines: string[] = [
    '=== ENGAGEMENT ANALYTICS ===',
    '',
    `Engagement Level: ${summary.engagementLevel.toUpperCase()}`,
    `Engagement Score: ${summary.engagementScore}`,
    '',
    '--- Study Activity ---',
    `Textbooks Accessed: ${summary.totalTextbooksAccessed}`,
    `Chapters Completed: ${summary.totalChaptersCompleted}`,
    `Total Reading Time: ${formatTime(summary.totalReadTime)}`,
    '',
    '--- Assignments ---',
    `Completed: ${summary.totalAssignmentsCompleted}`,
    `Average Score: ${summary.averageScore}%`,
    '',
    '--- Notes ---',
    `Total Notes: ${summary.totalNotes}`,
    `Total Edits: ${summary.totalNoteEdits}`,
    '',
    '--- Streaks ---',
    `Current Study Streak: ${summary.studyStreak} days`,
    `Total Study Time: ${formatTime(summary.totalStudyTime)}`,
    ''
  ];

  if (summary.lastActive) {
    lines.push(`Last Active: ${summary.lastActive}`);
  }

  return lines.join('\n');
}

function formatTime(ms: number): string {
  if (ms < 60000) return `${Math.round(ms / 1000)}s`;
  if (ms < 3600000) return `${Math.round(ms / 60000)}m`;
  return `${(ms / 3600000).toFixed(1)}h`;
}
