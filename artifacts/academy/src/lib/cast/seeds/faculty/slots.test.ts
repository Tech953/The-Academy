import { describe, it, expect } from 'vitest';
import { FACULTY_SLOTS, FACULTY_SUBJECTS, facultyIds } from './slots';

describe('faculty slots — D1, four empty mentor slots', () => {
  it('declares exactly the four GED subject slots', () => {
    expect(FACULTY_SUBJECTS).toEqual(['RLA', 'Math', 'Science', 'Social Studies']);
    expect(FACULTY_SLOTS.map((s) => s.subject)).toEqual([...FACULTY_SUBJECTS]);
  });

  it('leaves every slot unfilled — no names, no personalities invented', () => {
    for (const slot of FACULTY_SLOTS) {
      expect(slot.seed).toBeNull();
    }
  });

  it('reports no faculty ids while slots are empty', () => {
    expect(facultyIds()).toEqual([]);
  });
});
