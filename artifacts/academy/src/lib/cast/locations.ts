/**
 * Academy location registry — Phase 7.2 (brief §7 rule 6).
 *
 * Real Academy locations, drawn from radiantAI's own schedule
 * templates (STUDENT_SCHEDULE / TEACHER_SCHEDULE) — never invented.
 * Shared by the generator (anchors, schedules) and the CastAuditor
 * (resolution rule), so both sides check against one list.
 */
export const ACADEMY_LOCATIONS = [
  'Dormitory',
  'Cafeteria',
  'Classroom',
  'Courtyard',
  'Library',
  'Club Room',
  'Office',
  'Faculty Lounge',
  'Faculty Housing',
  'Conference Room',
] as const;
