import { 
  ResearchNote, 
  ResearchNotebook, 
  LinkedResource, 
  NoteUsageTracking, 
  StudyRecommendation,
  StudentProgress 
} from '@shared/schema';

export function createInitialNotebook(characterId: string): ResearchNotebook {
  return {
    characterId,
    notes: [],
    usageTracking: {},
    recentSearches: [],
    bookmarks: [],
    preferences: {
      sortBy: 'date',
      showCompleted: true,
      autoLinkNotes: true
    }
  };
}

// Ensure notebook has all required fields (defensive migration for older saves)
export function ensureNotebookComplete(notebook: Partial<ResearchNotebook>, characterId: string): ResearchNotebook {
  return {
    characterId: notebook.characterId || characterId,
    notes: notebook.notes || [],
    usageTracking: notebook.usageTracking || {},
    recentSearches: notebook.recentSearches || [],
    bookmarks: notebook.bookmarks || [],
    preferences: notebook.preferences || {
      sortBy: 'date',
      showCompleted: true,
      autoLinkNotes: true
    }
  };
}

export function generateNoteId(): string {
  return `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function createNote(
  title: string,
  content: string,
  tags: string[] = [],
  citations: string[] = [],
  linkedResources: LinkedResource[] = []
): ResearchNote {
  const now = new Date().toISOString();
  return {
    id: generateNoteId(),
    title,
    content,
    tags,
    citations,
    linkedResources,
    createdAt: now,
    updatedAt: now,
    isRead: false,
    priority: 1
  };
}

export function addNote(notebook: ResearchNotebook, note: ResearchNote): ResearchNotebook {
  return {
    ...notebook,
    notes: [...notebook.notes, note],
    usageTracking: {
      ...notebook.usageTracking,
      [note.id]: {
        noteId: note.id,
        readCount: 0,
        markedComplete: false
      }
    }
  };
}

export function updateNote(
  notebook: ResearchNotebook,
  noteId: string,
  updates: Partial<ResearchNote>
): ResearchNotebook {
  return {
    ...notebook,
    notes: notebook.notes.map(note =>
      note.id === noteId
        ? { ...note, ...updates, updatedAt: new Date().toISOString() }
        : note
    )
  };
}

export function deleteNote(notebook: ResearchNotebook, noteId: string): ResearchNotebook {
  const { [noteId]: _, ...remainingTracking } = notebook.usageTracking;
  return {
    ...notebook,
    notes: notebook.notes.filter(note => note.id !== noteId),
    usageTracking: remainingTracking,
    bookmarks: notebook.bookmarks.filter(id => id !== noteId)
  };
}

export function markNoteAsRead(notebook: ResearchNotebook, noteId: string): ResearchNotebook {
  const note = notebook.notes.find(n => n.id === noteId);
  if (!note) return notebook;
  
  // Defensive: ensure usageTracking exists
  const usageTracking = notebook.usageTracking || {};
  const tracking = usageTracking[noteId] || {
    noteId,
    readCount: 0,
    markedComplete: false
  };

  return {
    ...notebook,
    notes: notebook.notes.map(n =>
      n.id === noteId ? { ...n, isRead: true } : n
    ),
    usageTracking: {
      ...usageTracking,
      [noteId]: {
        ...tracking,
        readCount: tracking.readCount + 1,
        lastRead: new Date().toISOString()
      }
    }
  };
}

export function toggleBookmark(notebook: ResearchNotebook, noteId: string): ResearchNotebook {
  // Defensive: ensure bookmarks exists
  const bookmarks = notebook.bookmarks || [];
  const isBookmarked = bookmarks.includes(noteId);
  return {
    ...notebook,
    bookmarks: isBookmarked
      ? bookmarks.filter(id => id !== noteId)
      : [...bookmarks, noteId]
  };
}

export function searchNotes(notebook: ResearchNotebook, query: string): ResearchNote[] {
  const lowercaseQuery = query.toLowerCase();
  
  return notebook.notes.filter(note =>
    note.title.toLowerCase().includes(lowercaseQuery) ||
    note.content.toLowerCase().includes(lowercaseQuery) ||
    note.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
  );
}

export function getNotesByTag(notebook: ResearchNotebook, tag: string): ResearchNote[] {
  return notebook.notes.filter(note =>
    note.tags.some(t => t.toLowerCase() === tag.toLowerCase())
  );
}

export function getRelatedNotes(
  notebook: ResearchNotebook,
  resourceTags: string[]
): ResearchNote[] {
  const normalizedTags = resourceTags.map(t => t.toLowerCase());
  
  const notesWithScore = notebook.notes.map(note => {
    const matchingTags = note.tags.filter(t => 
      normalizedTags.includes(t.toLowerCase())
    ).length;
    
    const tracking = notebook.usageTracking[note.id];
    const isUnread = !note.isRead;
    
    const recencyScore = Date.now() - new Date(note.updatedAt).getTime();
    const recencyNormalized = Math.max(0, 1 - recencyScore / (7 * 24 * 60 * 60 * 1000));
    
    const score = 
      (isUnread ? 100 : 0) + 
      matchingTags * 50 + 
      recencyNormalized * 20;
    
    return { note, score, matchingTags };
  });

  return notesWithScore
    .filter(item => item.matchingTags > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => item.note);
}

export function getPriorityRankedNotes(notebook: ResearchNotebook): ResearchNote[] {
  return [...notebook.notes].sort((a, b) => {
    const aUnread = !a.isRead ? 1 : 0;
    const bUnread = !b.isRead ? 1 : 0;
    
    if (aUnread !== bUnread) return bUnread - aUnread;
    if (a.priority !== b.priority) return b.priority - a.priority;
    
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

export function linkNoteToResource(
  notebook: ResearchNotebook,
  noteId: string,
  resource: LinkedResource
): ResearchNotebook {
  return updateNote(notebook, noteId, {
    linkedResources: [
      ...(notebook.notes.find(n => n.id === noteId)?.linkedResources || []),
      resource
    ]
  });
}

export function generateStudyRecommendations(
  notebook: ResearchNotebook,
  enrolledCourses: Array<{ id: string; name: string; department: string }>,
  chaptersRead: number[],
  assignmentsCompleted: string[]
): StudyRecommendation[] {
  const recommendations: StudyRecommendation[] = [];
  
  const unreadNotes = notebook.notes.filter(n => !n.isRead);
  unreadNotes.slice(0, 3).forEach(note => {
    recommendations.push({
      type: 'note',
      resourceId: note.id,
      resourceName: note.title,
      reason: 'Unread research note needs your attention',
      priority: note.priority + (notebook.bookmarks.includes(note.id) ? 2 : 0),
      unreadNotesCount: 1,
      subject: note.tags[0]
    });
  });

  enrolledCourses.forEach(course => {
    const courseNotes = notebook.notes.filter(n =>
      n.tags.includes(course.department) || n.tags.includes(course.name)
    );
    const unreadCourseNotes = courseNotes.filter(n => !n.isRead).length;
    
    if (unreadCourseNotes > 0) {
      recommendations.push({
        type: 'chapter',
        resourceId: course.id,
        resourceName: course.name,
        reason: `${unreadCourseNotes} unread notes for this course`,
        priority: 3,
        unreadNotesCount: unreadCourseNotes,
        subject: course.department
      });
    }
  });

  return recommendations.sort((a, b) => b.priority - a.priority);
}

export function calculateStudentProgress(
  notebook: ResearchNotebook,
  chaptersRead: number[],
  assignmentsCompleted: string[],
  lecturesAttended: string[]
): StudentProgress {
  const totalNotes = notebook.notes.length;
  const readNotes = notebook.notes.filter(n => n.isRead).length;
  
  const subjectProgress: Record<string, number> = {
    'Mathematical Reasoning': 0,
    'Language Arts': 0,
    'Science': 0,
    'Social Studies': 0
  };
  
  notebook.notes.forEach(note => {
    note.tags.forEach(tag => {
      if (tag in subjectProgress) {
        subjectProgress[tag] += note.isRead ? 1 : 0;
      }
    });
  });

  const overallProgress = totalNotes > 0 
    ? Math.round((readNotes / totalNotes) * 100) 
    : 0;

  return {
    totalNotesCreated: totalNotes,
    totalNotesRead: readNotes,
    chaptersCompleted: chaptersRead.length,
    assignmentsCompleted: assignmentsCompleted.length,
    lecturesAttended: lecturesAttended.length,
    overallProgress,
    subjectProgress,
    studyStreak: 0
  };
}

export function autoLinkNote(
  note: ResearchNote,
  availableResources: {
    chapters: Array<{ id: string; title: string; keywords: string[] }>;
    assignments: Array<{ id: string; title: string; subject: string }>;
    lectures: Array<{ id: string; title: string; topic: string }>;
  }
): ResearchNote {
  const linkedResources: LinkedResource[] = [...note.linkedResources];
  const contentLower = note.content.toLowerCase();
  const titleLower = note.title.toLowerCase();
  
  availableResources.chapters.forEach(chapter => {
    const hasMatch = chapter.keywords.some(kw => 
      contentLower.includes(kw.toLowerCase()) || titleLower.includes(kw.toLowerCase())
    );
    if (hasMatch && !linkedResources.some(r => r.resourceId === chapter.id)) {
      linkedResources.push({
        type: 'chapter',
        resourceId: chapter.id,
        resourceName: chapter.title
      });
    }
  });

  availableResources.assignments.forEach(assignment => {
    if (note.tags.includes(assignment.subject) && 
        !linkedResources.some(r => r.resourceId === assignment.id)) {
      linkedResources.push({
        type: 'assignment',
        resourceId: assignment.id,
        resourceName: assignment.title
      });
    }
  });

  return { ...note, linkedResources };
}

export function formatNoteForDisplay(note: ResearchNote): string {
  const lines: string[] = [];
  lines.push(`=== ${note.title} ===`);
  lines.push('');
  lines.push(note.content);
  lines.push('');
  
  if (note.tags.length > 0) {
    lines.push(`Tags: ${note.tags.join(', ')}`);
  }
  
  if (note.citations.length > 0) {
    lines.push('');
    lines.push('Citations:');
    note.citations.forEach(c => lines.push(`  - ${c}`));
  }
  
  if (note.linkedResources.length > 0) {
    lines.push('');
    lines.push('Related Resources:');
    note.linkedResources.forEach(r => 
      lines.push(`  - [${r.type}] ${r.resourceName}`)
    );
  }
  
  lines.push('');
  lines.push(`Created: ${new Date(note.createdAt).toLocaleDateString()}`);
  lines.push(`Last Updated: ${new Date(note.updatedAt).toLocaleDateString()}`);
  
  return lines.join('\n');
}

export function formatNotebookStats(notebook: ResearchNotebook): string {
  const total = notebook.notes.length;
  const read = notebook.notes.filter(n => n.isRead).length;
  const unread = total - read;
  const bookmarked = notebook.bookmarks.length;
  
  const tagCounts: Record<string, number> = {};
  notebook.notes.forEach(note => {
    note.tags.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });
  
  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag, count]) => `${tag} (${count})`)
    .join(', ');

  const lines: string[] = [
    '=== Research Notebook Statistics ===',
    '',
    `Total Notes: ${total}`,
    `Read: ${read}`,
    `Unread: ${unread}`,
    `Bookmarked: ${bookmarked}`,
    '',
    `Top Tags: ${topTags || 'None'}`,
    ''
  ];
  
  return lines.join('\n');
}
