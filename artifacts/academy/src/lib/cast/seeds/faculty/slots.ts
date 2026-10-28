/**
 * Faculty seed slots — Phase 7.0 (brief D1, §2).
 *
 * The four GED subject mentor slots. They are deliberately EMPTY: no
 * names, no personalities, no authored content exist until the owner
 * fills them. The subjects themselves are program facts (the four GED
 * subjects), not invented characters.
 *
 * The CastAuditor reads facultyIds() to reject generated engrams that
 * collide with a faculty id. While every slot is empty, no collision is
 * possible — the gate still runs, against an empty faculty set.
 */
import type { FacultySeed } from '../schema';

export const FACULTY_SUBJECTS = ['RLA', 'Math', 'Science', 'Social Studies'] as const;
export type FacultySubject = (typeof FACULTY_SUBJECTS)[number];

export interface FacultySlot {
  subject: FacultySubject;
  /** Null until the owner authors and clears this mentor's seed. */
  seed: FacultySeed | null;
}

export const FACULTY_SLOTS: FacultySlot[] = FACULTY_SUBJECTS.map((subject) => ({
  subject,
  seed: null,
}));

/** Ids of authored faculty seeds (empty until the owner fills slots). */
export function facultyIds(): string[] {
  const ids: string[] = [];
  for (const slot of FACULTY_SLOTS) {
    if (slot.seed !== null) ids.push(slot.seed.id);
  }
  return ids;
}
