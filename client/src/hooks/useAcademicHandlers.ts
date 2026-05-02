import { GameState, TerminalLine, gameStateManager } from '@/lib/gameState';
import { localizedContentManager } from '@/lib/localizedContent';

export interface AcademicDeps {
  gameState: GameState | null;
  character: any;
  addTerminalLine: (text: string, type?: TerminalLine['type']) => void;
  setGameState: (s: GameState) => void;
  addEnrolledCourse: (courseId: string) => void;
  updateCharacter: (updates: any) => void;
  addExperience: (xp: number) => void;
  addEmail: (msg: any) => void;
}

export function useAcademicHandlers(deps: AcademicDeps) {
  const {
    gameState, addTerminalLine, setGameState,
    addEnrolledCourse, addExperience, addEmail,
  } = deps;

  async function grades() {
    if (!gameState) return;
    try {
      const response = await fetch(`/api/enrollments/character/${gameState.character.id}`);
      if (!response.ok) {
        addTerminalLine('');
        addTerminalLine('Failed to fetch grades.', 'error');
        return;
      }
      const enrollments = await response.json();
      addTerminalLine('');
      addTerminalLine('CURRENT GRADES:');
      addTerminalLine('===============');
      if (enrollments.length === 0) {
        addTerminalLine('You are not currently enrolled in any courses.');
        addTerminalLine('Visit the library or academic hall to enroll in GED preparation courses.');
      } else {
        const active = enrollments.filter((e: any) => e.status === 'enrolled');
        if (active.length === 0) {
          addTerminalLine('You have no active enrollments.');
        } else {
          for (const enrollment of active) {
            const courseRes = await fetch(`/api/courses/${enrollment.courseId}`);
            const course = await courseRes.json();
            const grade = enrollment.currentGrade || 0;
            const display = grade > 0 ? `${grade.toFixed(1)}%` : 'No assignments submitted';
            addTerminalLine(`${course.name}: ${display}`);
          }
        }
      }
      addTerminalLine('');
      addTerminalLine('Type TRANSCRIPT to see completed courses or GPA to see overall standing.');
    } catch {
      addTerminalLine('');
      addTerminalLine('Error fetching grades. Please try again.', 'error');
    }
  }

  async function transcript() {
    if (!gameState) return;
    try {
      const response = await fetch(`/api/enrollments/character/${gameState.character.id}`);
      if (!response.ok) {
        addTerminalLine('');
        addTerminalLine('Failed to fetch transcript.', 'error');
        return;
      }
      const enrollments = await response.json();
      addTerminalLine('');
      addTerminalLine('OFFICIAL ACADEMIC TRANSCRIPT');
      addTerminalLine('============================');
      addTerminalLine(`Student: ${gameState.character.name}`);
      addTerminalLine(`Student ID: ${gameState.character.id.substring(0, 8).toUpperCase()}`);
      addTerminalLine('');
      const completed = enrollments.filter((e: any) => e.status === 'completed');
      if (completed.length === 0) {
        addTerminalLine('No completed courses yet.');
        addTerminalLine('');
        addTerminalLine('Type GRADES to see current enrollments.');
      } else {
        addTerminalLine('COMPLETED COURSES:');
        addTerminalLine('');
        for (const enrollment of completed) {
          const courseRes = await fetch(`/api/courses/${enrollment.courseId}`);
          const course = await courseRes.json();
          addTerminalLine(`${course.name} (${course.id})`);
          addTerminalLine(`  Grade: ${enrollment.finalGrade} | Credits: ${course.credits}`);
          addTerminalLine(`  Completed: ${new Date(enrollment.completedAt).toLocaleDateString()}`);
          addTerminalLine('');
        }
      }
    } catch {
      addTerminalLine('');
      addTerminalLine('Error fetching transcript. Please try again.', 'error');
    }
  }

  async function schedule() {
    if (!gameState) return;
    try {
      const response = await fetch(`/api/enrollments/character/${gameState.character.id}`);
      if (!response.ok) {
        addTerminalLine('');
        addTerminalLine('Failed to fetch schedule.', 'error');
        return;
      }
      const enrollments = await response.json();
      const active = enrollments.filter((e: any) => e.status === 'enrolled');
      addTerminalLine('');
      addTerminalLine('CLASS SCHEDULE');
      addTerminalLine('==============');
      addTerminalLine(`Semester: ${active[0]?.semester || 'Fall 2025'}`);
      addTerminalLine('');
      if (active.length === 0) {
        addTerminalLine('You are not currently enrolled in any courses.');
        addTerminalLine('Visit the library to browse available GED preparation courses.');
      } else {
        for (const enrollment of active) {
          const courseRes = await fetch(`/api/courses/${enrollment.courseId}`);
          const course = await courseRes.json();
          const sched = course.schedule as any;
          addTerminalLine(`${course.name} (${course.id})`);
          if (sched?.days && Array.isArray(sched.days)) {
            addTerminalLine(`  ${sched.days.join(', ')} | ${sched.time || 'TBD'}`);
            addTerminalLine(`  Location: ${sched.room || 'TBA'}`);
          } else {
            addTerminalLine(`  Schedule: To be announced`);
          }
          addTerminalLine('');
        }
      }
    } catch {
      addTerminalLine('');
      addTerminalLine('Error fetching schedule. Please try again.', 'error');
    }
  }

  async function gpa() {
    if (!gameState) return;
    try {
      const progressRes = await fetch(`/api/academic-progress/${gameState.character.id}`);
      if (!progressRes.ok) {
        addTerminalLine('');
        addTerminalLine('Failed to fetch GPA information.', 'error');
        return;
      }
      const calcRes = await fetch(`/api/academic-progress/${gameState.character.id}/calculate`, {
        method: 'POST',
      });
      if (!calcRes.ok) {
        addTerminalLine('');
        addTerminalLine('Failed to calculate GPA.', 'error');
        return;
      }
      const updated = await calcRes.json();
      const gpaVal = (updated.cumulativeGPA / 100).toFixed(2);
      const standing = updated.academicStanding;
      addTerminalLine('');
      addTerminalLine('GPA & ACADEMIC STANDING');
      addTerminalLine('=======================');
      addTerminalLine(`Student: ${gameState.character.name}`);
      addTerminalLine(`Cumulative GPA: ${gpaVal}`);
      addTerminalLine(`Academic Standing: ${standing.toUpperCase()}`);
      addTerminalLine(`Total Credits: ${updated.totalCredits}`);
      addTerminalLine('');
      if (standing === 'honors') {
        addTerminalLine('Congratulations! You are on the Honor Roll!');
      } else if (standing === 'probation' || standing === 'warning') {
        addTerminalLine('Warning: Your GPA is below good standing. Work on improving your grades.');
      } else {
        addTerminalLine('Keep up the good work!');
      }
      addTerminalLine('');
      addTerminalLine('Type GRADES to see current course grades.');
    } catch {
      addTerminalLine('');
      addTerminalLine('Error fetching GPA. Please try again.', 'error');
    }
  }

  function notes(target: string) {
    addTerminalLine('');
    if (!target) {
      const allNotes = gameStateManager.getAllNotes();
      if (allNotes.length === 0) {
        addTerminalLine('RESEARCH NOTEBOOK');
        addTerminalLine('=================');
        addTerminalLine('');
        addTerminalLine('Your research notebook is empty.');
        addTerminalLine('');
        addTerminalLine('Commands:');
        addTerminalLine('  NOTE NEW [title] - Create a new note');
        addTerminalLine('  NOTE [id]        - View a specific note');
        addTerminalLine('  NOTE SEARCH [query] - Search notes');
        return;
      }
      addTerminalLine('RESEARCH NOTES');
      addTerminalLine('==============');
      addTerminalLine('');
      const notebook = gameStateManager.getResearchNotebook();
      const bookmarkedIds = notebook?.bookmarks || [];
      allNotes.forEach((note, index) => {
        const readStatus = note.isRead ? ' ' : '*';
        const isBookmarked = bookmarkedIds.includes(note.id);
        const bookmarkStatus = isBookmarked ? '[B]' : '   ';
        const tags = note.tags.length > 0 ? ` [${note.tags.join(', ')}]` : '';
        const shortId = note.id.slice(0, 6);
        addTerminalLine(`${readStatus} ${bookmarkStatus} ${index + 1}. [${shortId}] ${note.title}${tags}`);
      });
      addTerminalLine('');
      addTerminalLine('* = unread, [B] = bookmarked');
      addTerminalLine('');
      addTerminalLine('Type NOTE [number or id] to view a note.');
      return;
    }
    const parts = target.split(' ');
    const subCmd = parts[0].toLowerCase();
    if (subCmd === 'new' || subCmd === 'create') {
      const title = parts.slice(1).join(' ') || 'Untitled Note';
      const note = gameStateManager.createResearchNote(title, 'Enter your notes here...', [], []);
      if (note) {
        addTerminalLine(`Created new note: "${title}"`);
        addTerminalLine(`Note ID: ${note.id}`);
        addTerminalLine('');
        addTerminalLine('Edit your note in the Research Notebook desktop app.');
      } else {
        addTerminalLine('Failed to create note.', 'error');
      }
      return;
    }
    if (subCmd === 'search') {
      const query = parts.slice(1).join(' ');
      if (!query) { addTerminalLine('Usage: NOTE SEARCH [query]', 'error'); return; }
      const results = gameStateManager.searchResearchNotes(query);
      if (results.length === 0) { addTerminalLine(`No notes found matching "${query}".`); return; }
      addTerminalLine(`SEARCH RESULTS FOR "${query.toUpperCase()}"`);
      addTerminalLine('='.repeat(25 + query.length));
      addTerminalLine('');
      results.forEach((note, index) => {
        const preview = note.content.substring(0, 60) + (note.content.length > 60 ? '...' : '');
        addTerminalLine(`${index + 1}. ${note.title}`);
        addTerminalLine(`   ${preview}`);
        addTerminalLine('');
      });
      return;
    }
    if (subCmd === 'tag') {
      const tag = parts.slice(1).join(' ');
      if (!tag) { addTerminalLine('Usage: NOTE TAG [tag name]', 'error'); return; }
      const results = gameStateManager.getNotesByTag(tag);
      if (results.length === 0) { addTerminalLine(`No notes found with tag "${tag}".`); return; }
      addTerminalLine(`NOTES TAGGED: ${tag.toUpperCase()}`);
      addTerminalLine('='.repeat(14 + tag.length));
      addTerminalLine('');
      results.forEach((note, index) => addTerminalLine(`${index + 1}. ${note.title}`));
      return;
    }
    if (subCmd === 'delete') {
      const noteNum = parseInt(parts[1]) - 1;
      const allNotes = gameStateManager.getAllNotes();
      if (isNaN(noteNum) || noteNum < 0 || noteNum >= allNotes.length) {
        addTerminalLine('Invalid note number.', 'error'); return;
      }
      const note = allNotes[noteNum];
      gameStateManager.deleteResearchNote(note.id);
      addTerminalLine(`Deleted note: "${note.title}"`);
      return;
    }
    if (subCmd === 'bookmark') {
      const noteNum = parseInt(parts[1]) - 1;
      const allNotes = gameStateManager.getAllNotes();
      if (isNaN(noteNum) || noteNum < 0 || noteNum >= allNotes.length) {
        addTerminalLine('Invalid note number.', 'error'); return;
      }
      const note = allNotes[noteNum];
      const notebook = gameStateManager.getResearchNotebook();
      const wasBookmarked = notebook?.bookmarks?.includes(note.id) || false;
      gameStateManager.toggleNoteBookmark(note.id);
      addTerminalLine(`Note "${note.title}" ${wasBookmarked ? 'unbookmarked' : 'bookmarked'}.`);
      return;
    }
    const noteNum = parseInt(target) - 1;
    const allNotes = gameStateManager.getAllNotes();
    if (!isNaN(noteNum) && noteNum >= 0 && noteNum < allNotes.length) {
      const note = allNotes[noteNum];
      gameStateManager.markNoteRead(note.id);
      gameStateManager.formatNote(note.id).split('\n').forEach(line => addTerminalLine(line));
      return;
    }
    const noteById = allNotes.find(n => n.id.startsWith(target) || n.id === target);
    if (noteById) {
      gameStateManager.markNoteRead(noteById.id);
      gameStateManager.formatNote(noteById.id).split('\n').forEach(line => addTerminalLine(line));
      return;
    }
    addTerminalLine(`Unknown note command: ${target}`, 'error');
    addTerminalLine('');
    addTerminalLine('Commands:');
    addTerminalLine('  NOTES            - List all notes');
    addTerminalLine('  NOTE [number]    - View a note');
    addTerminalLine('  NOTE NEW [title] - Create a note');
    addTerminalLine('  NOTE SEARCH [q]  - Search notes');
    addTerminalLine('  NOTE TAG [tag]   - Filter by tag');
    addTerminalLine('  NOTE DELETE [n]  - Delete a note');
    addTerminalLine('  NOTE BOOKMARK [n] - Toggle bookmark');
  }

  function notebook() {
    addTerminalLine('');
    const stats = gameStateManager.getNotebookStats();
    stats.split('\n').forEach(line => addTerminalLine(line));
    addTerminalLine('');
    addTerminalLine('Type NOTES to view all notes, or STUDY for recommendations.');
  }

  function studyRecommendations() {
    addTerminalLine('');
    addTerminalLine('STUDY RECOMMENDATIONS');
    addTerminalLine('=====================');
    addTerminalLine('');
    const recommendations = gameStateManager.getStudyRecommendations([]);
    if (recommendations.length === 0) {
      addTerminalLine('No specific recommendations at this time.');
      addTerminalLine('');
      addTerminalLine('Tips:');
      addTerminalLine('  - Create notes while reading textbooks');
      addTerminalLine('  - Tag notes by subject for organization');
      addTerminalLine('  - Review unread notes regularly');
      return;
    }
    recommendations.slice(0, 5).forEach((rec, index) => {
      addTerminalLine(`${index + 1}. ${rec.resourceName}`);
      addTerminalLine(`   ${rec.reason}`);
      if (rec.unreadNotesCount && rec.unreadNotesCount > 0) {
        addTerminalLine(`   ${rec.unreadNotesCount} unread notes`);
      }
      addTerminalLine('');
    });
    addTerminalLine('Type PROGRESS to see your overall academic progress.');
  }

  function progress() {
    addTerminalLine('');
    addTerminalLine('ACADEMIC PROGRESS');
    addTerminalLine('=================');
    addTerminalLine('');
    const p = gameStateManager.getStudentProgress();
    addTerminalLine(`Notes Created: ${p.totalNotesCreated}`);
    addTerminalLine(`Notes Reviewed: ${p.totalNotesRead}`);
    addTerminalLine(`Chapters Completed: ${p.chaptersCompleted}`);
    addTerminalLine(`Assignments Done: ${p.assignmentsCompleted}`);
    addTerminalLine(`Lectures Attended: ${p.lecturesAttended}`);
    addTerminalLine('');
    addTerminalLine(`Overall Progress: ${Math.round(p.overallProgress * 100)}%`);
    addTerminalLine(`Study Streak: ${p.studyStreak} days`);
    const subjects = Object.keys(p.subjectProgress);
    if (subjects.length > 0) {
      addTerminalLine('');
      addTerminalLine('SUBJECT PROGRESS');
      addTerminalLine('----------------');
      subjects.forEach(subject => {
        const pct = Math.round(p.subjectProgress[subject] * 100);
        const bar = '='.repeat(Math.floor(pct / 5)) + ' '.repeat(20 - Math.floor(pct / 5));
        addTerminalLine(`${subject}: [${bar}] ${pct}%`);
      });
    }
    addTerminalLine('');
    addTerminalLine('Type STUDY for personalized study recommendations.');
  }

  async function enroll(target?: string) {
    if (!gameState) return;
    addTerminalLine('');
    try {
      const coursesRes = await fetch('/api/courses');
      if (!coursesRes.ok) {
        addTerminalLine('Failed to access course catalog.', 'error');
        return;
      }
      const courses = await coursesRes.json();
      if (!target || target === 'list') {
        addTerminalLine('AVAILABLE GED PREPARATION COURSES');
        addTerminalLine('==================================');
        addTerminalLine('');
        const areas = ['Language Arts', 'Mathematics', 'Science', 'Social Studies'];
        areas.forEach(area => {
          const areaCourses = courses.filter((c: any) => c.gedArea === area);
          if (areaCourses.length > 0) {
            addTerminalLine(`${area}:`);
            areaCourses.forEach((c: any, idx: number) => {
              addTerminalLine(`  ${idx + 1}. ${c.name} (${c.credits} credits)`);
            });
            addTerminalLine('');
          }
        });
        addTerminalLine('To enroll, type ENROLL [course name]');
        addTerminalLine('Example: ENROLL Algebra');
        return;
      }
      const matchingCourse = courses.find((c: any) =>
        c.name.toLowerCase().includes(target.toLowerCase()) ||
        c.id.toLowerCase() === target.toLowerCase()
      );
      if (!matchingCourse) {
        addTerminalLine(`Course "${target}" not found.`, 'error');
        addTerminalLine('Type ENROLL to see available courses.');
        return;
      }
      const enrollRes = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterId: gameState.character.id,
          courseId: matchingCourse.id,
          semester: 'Fall 2024',
          status: 'enrolled',
        }),
      });
      if (!enrollRes.ok) {
        const err = await enrollRes.json();
        if (err.error?.includes('Already enrolled')) {
          addTerminalLine(`You are already enrolled in ${matchingCourse.name}.`, 'system');
        } else {
          addTerminalLine(`Failed to enroll: ${err.error}`, 'error');
        }
        return;
      }
      addTerminalLine(`Successfully enrolled in ${matchingCourse.name}!`, 'system');
      addTerminalLine('');
      addTerminalLine(`Course: ${matchingCourse.name}`);
      addTerminalLine(`Credits: ${matchingCourse.credits}`);
      addTerminalLine(`GED Area: ${matchingCourse.gedArea}`);
      addTerminalLine('');
      addTerminalLine('Type SCHEDULE to view your class schedule.');
      addTerminalLine('Type READ [course] to access your textbook.');
      addEnrolledCourse(String(matchingCourse.id));
    } catch {
      addTerminalLine('Failed to access enrollment system.', 'error');
    }
  }

  async function courses() {
    addTerminalLine('');
    try {
      const coursesRes = await fetch('/api/courses');
      if (!coursesRes.ok) { addTerminalLine('Failed to access course catalog.', 'error'); return; }
      const allCourses = await coursesRes.json();
      addTerminalLine('GED PREPARATION COURSE CATALOG');
      addTerminalLine('==============================');
      addTerminalLine('');
      const areas = ['Language Arts', 'Mathematics', 'Science', 'Social Studies'];
      areas.forEach(area => {
        const areaCourses = allCourses.filter((c: any) => c.gedArea === area);
        if (areaCourses.length > 0) {
          addTerminalLine(`${area}:`);
          areaCourses.forEach((c: any) => {
            addTerminalLine(`  - ${c.name}: ${c.description?.slice(0, 60) || 'No description'}...`);
          });
          addTerminalLine('');
        }
      });
      addTerminalLine('Type ENROLL [course name] to enroll in a course.');
    } catch {
      addTerminalLine('Failed to load course catalog.', 'error');
    }
  }

  async function assignments() {
    if (!gameState) return;
    addTerminalLine('');
    addTerminalLine('YOUR ASSIGNMENTS');
    addTerminalLine('================');
    addTerminalLine('');
    try {
      const enrollmentsRes = await fetch(`/api/enrollments/character/${gameState.character.id}`);
      if (!enrollmentsRes.ok) {
        addTerminalLine('You are not enrolled in any courses.', 'system');
        addTerminalLine('Type ENROLL to see available courses.');
        return;
      }
      const enrollments = await enrollmentsRes.json();
      if (enrollments.length === 0) {
        addTerminalLine('You are not enrolled in any courses.', 'system');
        addTerminalLine('Type ENROLL to see available courses.');
        return;
      }
      let hasAssignments = false;
      for (const enrollment of enrollments) {
        const assignmentsRes = await fetch(`/api/courses/${enrollment.courseId}/assignments`);
        if (assignmentsRes.ok) {
          const assignmentList = await assignmentsRes.json();
          if (assignmentList.length > 0) {
            hasAssignments = true;
            const courseRes = await fetch(`/api/courses/${enrollment.courseId}`);
            const course = await courseRes.json();
            addTerminalLine(`${course.name}:`);
            assignmentList.slice(0, 3).forEach((a: any) => {
              const status = a.status || 'pending';
              addTerminalLine(`  [${status.toUpperCase()}] ${a.title}`);
              if (a.dueDate) {
                addTerminalLine(`  Due: ${new Date(a.dueDate).toLocaleDateString()}`);
              }
            });
            addTerminalLine('');
          }
        }
      }
      if (!hasAssignments) {
        addTerminalLine('No assignments found. Attend classes to receive assignments.');
      }
    } catch {
      addTerminalLine('Error loading assignments. Please try again.', 'error');
    }
  }

  async function read(target: string) {
    if (!gameState) return;
    if (!target) {
      addTerminalLine('');
      addTerminalLine('What would you like to read? Try READ [textbook name].', 'error');
      return;
    }
    try {
      const coursesRes = await fetch('/api/courses');
      if (!coursesRes.ok) {
        addTerminalLine('');
        addTerminalLine('Failed to access course catalog.', 'error');
        return;
      }
      const allCourses = await coursesRes.json();
      const matchingCourse = allCourses.find((c: any) =>
        c.name.toLowerCase().includes(target.toLowerCase()) ||
        c.id.toLowerCase() === target.toLowerCase()
      );
      if (!matchingCourse) {
        addTerminalLine('');
        addTerminalLine(`You don't have a textbook about "${target}".`, 'error');
        addTerminalLine('Type SCHEDULE to see your enrolled courses.');
        return;
      }
      const textbookRes = await fetch(`/api/courses/${matchingCourse.id}/textbook`);
      if (!textbookRes.ok) {
        addTerminalLine('');
        addTerminalLine(`Reading: ${matchingCourse.name} Textbook`);
        addTerminalLine('='.repeat(matchingCourse.name.length + 18));
        addTerminalLine('');
        addTerminalLine(matchingCourse.description);
        return;
      }
      const textbook = await textbookRes.json();
      const labels = localizedContentManager.getTextbookLabels();
      addTerminalLine('');
      addTerminalLine(`${textbook.courseName} Textbook`);
      addTerminalLine('='.repeat(textbook.courseName.length + 10));
      addTerminalLine('');
      addTerminalLine(`${labels.authors}: ${textbook.authors.join(', ')}`);
      addTerminalLine(`${labels.edition}: ${textbook.edition}`);
      addTerminalLine(`${labels.department}: ${localizedContentManager.getSubjectName(textbook.department)}`);
      addTerminalLine('');
      addTerminalLine(`${labels.toc}:`);
      addTerminalLine('');
      textbook.chapters.forEach((chapter: any) => {
        addTerminalLine(`${labels.chapter} ${chapter.number}: ${chapter.title}`);
        addTerminalLine(`  ${chapter.summary}`);
      });
      addTerminalLine('');
      addTerminalLine(`${labels.commands}:`);
      addTerminalLine(`  CHAPTER "${textbook.courseName}" <number>  - ${labels.readChapter}`);
      addTerminalLine(`  LECTURE "${textbook.courseName}" <week>    - ${labels.viewLecture}`);
      addTerminalLine('');
      if (textbook.glossary && textbook.glossary.length > 0) {
        addTerminalLine(`${labels.keyTerms}:`);
        textbook.glossary.slice(0, 5).forEach((term: any) => {
          addTerminalLine(`  ${term.term}: ${term.definition}`);
        });
        if (textbook.glossary.length > 5) {
          addTerminalLine(`  ... ${textbook.glossary.length - 5} ${labels.moreTerms}`);
        }
        addTerminalLine('');
      }
    } catch {
      addTerminalLine('');
      addTerminalLine('Error reading textbook. Please try again.', 'error');
    }
  }

  async function textbook(target?: string) {
    if (!gameState) return;
    if (!target) {
      addTerminalLine('');
      addTerminalLine('Which textbook would you like to read?', 'error');
      addTerminalLine('Type TEXTBOOK [course name] to read a textbook.');
      addTerminalLine('Type SCHEDULE to see your enrolled courses.');
      return;
    }
    await read(target);
  }

  async function attend(target: string) {
    if (!gameState) return;
    if (!target) {
      addTerminalLine('');
      addTerminalLine('Which class would you like to attend? Try ATTEND [course name].', 'error');
      addTerminalLine('Type SCHEDULE to see your enrolled courses.');
      return;
    }
    try {
      const enrollmentsRes = await fetch(`/api/enrollments/character/${gameState.character.id}`);
      if (!enrollmentsRes.ok) {
        addTerminalLine('');
        addTerminalLine('Failed to fetch enrollments.', 'error');
        return;
      }
      const enrollments = await enrollmentsRes.json();
      const activeEnrollments = enrollments.filter((e: any) => e.status === 'enrolled');
      if (activeEnrollments.length === 0) {
        addTerminalLine('');
        addTerminalLine('You are not enrolled in any courses.', 'error');
        addTerminalLine('Visit the library to enroll in GED preparation courses.');
        return;
      }
      let matchingEnrollment = null;
      for (const enrollment of activeEnrollments) {
        const courseRes = await fetch(`/api/courses/${enrollment.courseId}`);
        const course = await courseRes.json();
        if (
          course.name.toLowerCase().includes(target.toLowerCase()) ||
          course.id.toLowerCase() === target.toLowerCase()
        ) {
          matchingEnrollment = { enrollment, course };
          break;
        }
      }
      if (!matchingEnrollment) {
        addTerminalLine('');
        addTerminalLine(`You are not enrolled in "${target}".`, 'error');
        addTerminalLine('Type SCHEDULE to see your enrolled courses.');
        return;
      }
      const { enrollment, course } = matchingEnrollment;
      const attendRes = await fetch(`/api/enrollments/${enrollment.id}/attend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ characterId: gameState.character.id }),
      });
      if (!attendRes.ok) {
        const err = await attendRes.json();
        addTerminalLine('');
        if (err.error === 'Insufficient energy') {
          addTerminalLine('You are too tired to attend class.', 'error');
          addTerminalLine(`Attending class requires ${err.required} energy. You have ${err.available}.`);
        } else {
          addTerminalLine(err.error || 'Failed to mark attendance.', 'error');
        }
        return;
      }
      const result = await attendRes.json();
      const sched = course.schedule as any;
      addTerminalLine('');
      addTerminalLine(`You attend ${course.name}.`);
      addTerminalLine(`Location: ${sched.room}`);
      addTerminalLine(`Time: ${sched.time}`);
      addTerminalLine('');
      addTerminalLine('You participate in class discussions and take notes.');
      addTerminalLine(`Energy: -${result.energyCost} (${gameState.character.energy} → ${result.character.energy})`);
      addTerminalLine('');
      addTerminalLine('Attendance has been recorded. Keep attending to maintain good standing!');
      const updatedState = await gameStateManager.getGameState();
      if (updatedState) setGameState(updatedState);
      addExperience(10);
      const gedAreaToSkillPrefix: Record<string, string> = {
        'Mathematics': 'MATH', 'Language Arts': 'LANG', 'Science': 'SCI', 'Social Studies': 'SOC',
      };
      const skillPrefix = gedAreaToSkillPrefix[course.gedArea];
      if (skillPrefix) {
        const skillId = `${skillPrefix}_${course.id.replace(/-/g, '_')}`;
        const attendanceKey = `attendance_${course.id}`;
        const currentCount = gameStateManager.getGameFlag(attendanceKey, 0);
        const newCount = currentCount + 1;
        gameStateManager.setGameFlag(attendanceKey, newCount);
        if (newCount >= 5) {
          gameStateManager.addStableSkill(skillId);
          addTerminalLine(`Skill Mastered: ${skillId}`, 'system');
        } else if (newCount >= 2) {
          gameStateManager.addEmergingSkill(skillId);
          addTerminalLine(`Skill Progress: ${skillId} (${newCount}/5 to mastery)`, 'system');
        } else {
          addTerminalLine(`Starting to learn: ${skillId}`, 'system');
        }
      }
      if (Math.random() < 0.25) {
        const templates = [
          {
            subject: `${course.name} - Today's Lecture Notes`,
            body: `Dear Student,\n\nThank you for attending class today. I've posted the lecture notes and additional resources on the course portal.\n\nRemember to review the material before our next session.\n\nBest regards,\nYour Instructor`,
          },
          {
            subject: `Homework Reminder: ${course.name}`,
            body: `Hello,\n\nI wanted to remind you about the upcoming assignment for ${course.name}. Please check the Assignments Portal for details.\n\nKeep up the good work!\n\nYour Instructor`,
          },
          {
            subject: `${course.name} - Great Participation Today`,
            body: `I noticed your engagement in today's class. Keep asking those thoughtful questions!\n\nSee you next class!\n\nYour Instructor`,
          },
        ];
        const template = templates[Math.floor(Math.random() * templates.length)];
        setTimeout(() => {
          addEmail({ from: `${course.name} Instructor`, subject: template.subject, body: template.body, category: 'academic' });
        }, 3000 + Math.random() * 5000);
      }
    } catch {
      addTerminalLine('');
      addTerminalLine('Error attending class. Please try again.', 'error');
    }
  }

  async function chapter(courseNameAndNumber: string) {
    if (!gameState) return;
    if (!courseNameAndNumber) {
      addTerminalLine('');
      addTerminalLine('Usage: CHAPTER "[course name]" <number>', 'error');
      addTerminalLine('Example: CHAPTER "Basic Math Skills" 1');
      return;
    }
    try {
      const parts = courseNameAndNumber.match(/"([^"]+)"\s+(\d+)|(.+)\s+(\d+)/);
      if (!parts) {
        addTerminalLine('');
        addTerminalLine('Usage: CHAPTER "[course name]" <number>', 'error');
        return;
      }
      const courseName = parts[1] || parts[3];
      const chapterNum = parseInt(parts[2] || parts[4]);
      const coursesRes = await fetch('/api/courses');
      const allCourses = await coursesRes.json();
      const matchingCourse = allCourses.find((c: any) =>
        c.name.toLowerCase().includes(courseName.toLowerCase())
      );
      if (!matchingCourse) {
        addTerminalLine('');
        addTerminalLine(`Course "${courseName}" not found.`, 'error');
        return;
      }
      const textbookRes = await fetch(`/api/courses/${matchingCourse.id}/textbook`);
      if (!textbookRes.ok) {
        addTerminalLine('');
        addTerminalLine('Textbook not available.', 'error');
        return;
      }
      const textbook = await textbookRes.json();
      const chapterObj = textbook.chapters.find((ch: any) => ch.number === chapterNum);
      if (!chapterObj) {
        addTerminalLine('');
        addTerminalLine(`Chapter ${chapterNum} not found in this textbook.`, 'error');
        addTerminalLine(`Available chapters: 1-${textbook.chapters.length}`);
        return;
      }
      const lbls = localizedContentManager.getChapterLabels();
      addTerminalLine('');
      addTerminalLine(`${textbook.courseName}`);
      addTerminalLine(`${lbls.chapter} ${chapterObj.number}: ${chapterObj.title}`);
      addTerminalLine('='.repeat(chapterObj.title.length + 12));
      addTerminalLine('');
      addTerminalLine(`${lbls.summary}:`);
      addTerminalLine(chapterObj.summary);
      addTerminalLine('');
      chapterObj.sections.forEach((section: any, idx: number) => {
        addTerminalLine(`${lbls.section} ${idx + 1}: ${section.title}`);
        addTerminalLine('');
        addTerminalLine(section.content);
        addTerminalLine('');
        if (section.keyPoints?.length > 0) {
          addTerminalLine(`${lbls.keyPoints}:`);
          section.keyPoints.forEach((point: string) => addTerminalLine(`  • ${point}`));
          addTerminalLine('');
        }
        if (section.examples?.length > 0) {
          addTerminalLine(`${lbls.examples}:`);
          section.examples.forEach((example: string) => addTerminalLine(`  ${example}`));
          addTerminalLine('');
        }
      });
      if (chapterObj.practiceProblems?.length > 0) {
        addTerminalLine('PRACTICE PROBLEMS:');
        chapterObj.practiceProblems.forEach((problem: string, idx: number) => {
          addTerminalLine(`  ${idx + 1}. ${problem}`);
        });
        addTerminalLine('');
      }
      if (chapterObj.reviewQuestions?.length > 0) {
        addTerminalLine('REVIEW QUESTIONS:');
        chapterObj.reviewQuestions.forEach((question: string) => addTerminalLine(`  • ${question}`));
        addTerminalLine('');
      }
      await fetch(`/api/reading-progress/${gameState.character.id}/${textbook.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chaptersRead: [chapterNum], lecturesAttended: [] }),
      });
    } catch {
      addTerminalLine('');
      addTerminalLine('Error reading chapter. Please try again.', 'error');
    }
  }

  async function lecture(courseNameAndWeek: string) {
    if (!gameState) return;
    if (!courseNameAndWeek) {
      addTerminalLine('');
      addTerminalLine('Usage: LECTURE "[course name]" <week>', 'error');
      addTerminalLine('Example: LECTURE "Basic Math Skills" 1');
      return;
    }
    try {
      const parts = courseNameAndWeek.match(/"([^"]+)"\s+(\d+)|(.+)\s+(\d+)/);
      if (!parts) {
        addTerminalLine('');
        addTerminalLine('Usage: LECTURE "[course name]" <week>', 'error');
        return;
      }
      const courseName = parts[1] || parts[3];
      const week = parseInt(parts[2] || parts[4]);
      const coursesRes = await fetch('/api/courses');
      const allCourses = await coursesRes.json();
      const matchingCourse = allCourses.find((c: any) =>
        c.name.toLowerCase().includes(courseName.toLowerCase())
      );
      if (!matchingCourse) {
        addTerminalLine('');
        addTerminalLine(`Course "${courseName}" not found.`, 'error');
        return;
      }
      const lectureRes = await fetch(`/api/courses/${matchingCourse.id}/lectures/${week}`);
      if (!lectureRes.ok) {
        addTerminalLine('');
        addTerminalLine(`Lecture for week ${week} not found.`, 'error');
        addTerminalLine('Available weeks: 1-12');
        return;
      }
      const lectureObj = await lectureRes.json();
      const lLabels = localizedContentManager.getLectureLabels();
      addTerminalLine('');
      addTerminalLine(`${matchingCourse.name}`);
      addTerminalLine(lectureObj.title);
      addTerminalLine('='.repeat(lectureObj.title.length));
      addTerminalLine('');
      addTerminalLine(`${lLabels.duration}: ${lectureObj.duration}`);
      addTerminalLine(`${lLabels.topic}: ${lectureObj.topic}`);
      addTerminalLine('');
      addTerminalLine(`${lLabels.objectives}:`);
      lectureObj.objectives.forEach((obj: string) => addTerminalLine(`  • ${obj}`));
      addTerminalLine('');
      addTerminalLine(`${lLabels.content}:`);
      addTerminalLine('');
      lectureObj.content.split('\n\n').forEach((line: string) => {
        addTerminalLine(line);
        addTerminalLine('');
      });
      if (lectureObj.keyTerms?.length > 0) {
        addTerminalLine(`${lLabels.keyTerms}:`);
        lectureObj.keyTerms.forEach((term: any) => addTerminalLine(`  ${term.term}: ${term.definition}`));
        addTerminalLine('');
      }
      if (lectureObj.examples?.length > 0) {
        addTerminalLine(`${lLabels.examples}:`);
        lectureObj.examples.forEach((example: string) => addTerminalLine(`  ${example}`));
        addTerminalLine('');
      }
      if (lectureObj.homework) {
        addTerminalLine('HOMEWORK:');
        addTerminalLine(`  ${lectureObj.homework}`);
        addTerminalLine('');
      }
      const textbookId = `textbook-${matchingCourse.id}`;
      await fetch(`/api/reading-progress/${gameState.character.id}/${textbookId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chaptersRead: [], lecturesAttended: [lectureObj.id] }),
      });
    } catch {
      addTerminalLine('');
      addTerminalLine('Error viewing lecture. Please try again.', 'error');
    }
  }

  return {
    grades, transcript, schedule, gpa, notes, notebook,
    studyRecommendations, progress, enroll, courses, assignments,
    textbook, read, attend, chapter, lecture,
  };
}
