import { useState } from 'react';
import { Clock, User, MapPin, Lock } from 'lucide-react';
import { DAYS, DEFAULT_SCHEDULE, DayOfWeek, ScheduleEntry } from '@shared/curriculum';
import { useGameState } from '@/contexts/GameStateContext';

const NEON_GREEN = '#00ff00';
const NEON_CYAN = '#00ffff';
const NEON_AMBER = '#ffaa00';
const NEON_PURPLE = '#cc66ff';

const TYPE_COLORS: Record<string, string> = {
  core: NEON_GREEN,
  elective: NEON_PURPLE,
  study: NEON_CYAN,
  break: NEON_AMBER,
};

export default function ClassSchedule() {
  const { enrolledCourses } = useGameState();
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('MONDAY');

  const containerStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    background: '#0a0a0a',
    padding: '16px',
    boxSizing: 'border-box',
    fontFamily: '"Courier New", monospace',
    color: NEON_GREEN,
    overflow: 'auto',
  };

  const headerStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 'bold',
    marginBottom: '12px',
    textShadow: `0 0 10px ${NEON_GREEN}`,
    borderBottom: `1px solid ${NEON_GREEN}40`,
    paddingBottom: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const dayTabStyle = (active: boolean): React.CSSProperties => ({
    background: active ? `${NEON_GREEN}20` : 'transparent',
    border: `1px solid ${active ? NEON_GREEN : NEON_GREEN + '30'}`,
    color: active ? NEON_GREEN : `${NEON_GREEN}60`,
    padding: '4px 8px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: '9px',
    textShadow: active ? `0 0 5px ${NEON_GREEN}` : 'none',
    flex: 1,
    textAlign: 'center' as const,
  });

  const scheduleEntryStyle = (type: string): React.CSSProperties => ({
    background: '#111',
    border: `1px solid ${TYPE_COLORS[type]}40`,
    borderLeft: `3px solid ${TYPE_COLORS[type]}`,
    padding: '10px',
    marginBottom: '6px',
    borderRadius: '2px',
  });

  const fullDaySchedule: ScheduleEntry[] = DEFAULT_SCHEDULE[selectedDay] || [];

  const filteredDaySchedule = enrolledCourses.length === 0
    ? []
    : fullDaySchedule.filter(entry =>
        entry.type === 'break' || entry.type === 'study' ||
        (entry.courseId && enrolledCourses.includes(entry.courseId))
      );

  if (enrolledCourses.length === 0) {
    return (
      <div style={containerStyle}>
        <div style={headerStyle}>
          <Clock size={16} color={NEON_CYAN} />
          [ CLASS SCHEDULE ]
        </div>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: 'calc(100% - 80px)',
          gap: '16px',
          color: `${NEON_GREEN}50`,
          textAlign: 'center',
        }}>
          <Lock size={36} strokeWidth={1} color={`${NEON_GREEN}50`} />
          <div style={{ fontSize: '13px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            No Courses Enrolled
          </div>
          <div style={{ fontSize: '10px', color: `${NEON_GREEN}40`, maxWidth: 260, lineHeight: 1.6 }}>
            Your schedule will populate once you enroll in courses.<br />
            Use the <span style={{ color: NEON_AMBER }}>ENROLL</span> command in the terminal to get started.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <Clock size={16} color={NEON_CYAN} />
        [ CLASS SCHEDULE ]
      </div>

      <div style={{ display: 'flex', gap: '2px', marginBottom: '16px' }}>
        {DAYS.map(day => (
          <button key={day} style={dayTabStyle(selectedDay === day)} onClick={() => setSelectedDay(day)}>
            {day.substring(0, 3)}
          </button>
        ))}
      </div>

      <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '12px', color: NEON_CYAN }}>
        {selectedDay}
      </div>

      {filteredDaySchedule.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px 0', color: `${NEON_GREEN}40`, fontSize: '11px' }}>
          No enrolled classes scheduled for {selectedDay.toLowerCase()}.
        </div>
      ) : (
        filteredDaySchedule.map(entry => (
          <div key={entry.id} style={scheduleEntryStyle(entry.type)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{
                  fontSize: '12px',
                  fontWeight: 'bold',
                  color: TYPE_COLORS[entry.type],
                  marginBottom: '4px',
                }}>
                  {entry.subject}
                </div>
                {entry.instructor && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: `${NEON_GREEN}80` }}>
                    <User size={10} />
                    {entry.instructor}
                  </div>
                )}
                {entry.room && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: `${NEON_GREEN}60` }}>
                    <MapPin size={10} />
                    {entry.room}
                  </div>
                )}
              </div>
              <div style={{
                fontSize: '11px',
                fontWeight: 'bold',
                color: NEON_AMBER,
                background: '#1a1a0a',
                padding: '2px 6px',
                border: `1px solid ${NEON_AMBER}40`,
              }}>
                {entry.time}
              </div>
            </div>
          </div>
        ))
      )}

      <div style={{
        marginTop: '12px',
        display: 'flex',
        gap: '12px',
        fontSize: '9px',
        color: `${NEON_GREEN}60`,
      }}>
        <span><span style={{ color: NEON_GREEN }}>■</span> Core</span>
        <span><span style={{ color: NEON_PURPLE }}>■</span> Elective</span>
        <span><span style={{ color: NEON_CYAN }}>■</span> Study</span>
        <span><span style={{ color: NEON_AMBER }}>■</span> Break</span>
      </div>
    </div>
  );
}
