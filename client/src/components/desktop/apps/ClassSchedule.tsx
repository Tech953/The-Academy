import { useState } from 'react';
import { Clock, BookOpen, User, MapPin } from 'lucide-react';

interface ScheduleEntry {
  id: string;
  time: string;
  subject: string;
  instructor: string;
  room: string;
  type: 'core' | 'elective' | 'study' | 'break';
}

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

const SCHEDULE: Record<string, ScheduleEntry[]> = {
  MONDAY: [
    { id: 'm1', time: '08:00', subject: 'Mathematical Reasoning', instructor: 'Prof. Chen', room: 'Room 101', type: 'core' },
    { id: 'm2', time: '09:30', subject: 'Language Arts', instructor: 'Mrs. Thompson', room: 'Room 205', type: 'core' },
    { id: 'm3', time: '11:00', subject: 'BREAK', instructor: '', room: 'Cafeteria', type: 'break' },
    { id: 'm4', time: '12:00', subject: 'Social Studies', instructor: 'Mr. Rivera', room: 'Room 303', type: 'core' },
    { id: 'm5', time: '14:00', subject: 'Study Hall', instructor: '', room: 'Library', type: 'study' },
  ],
  TUESDAY: [
    { id: 't1', time: '08:00', subject: 'Science', instructor: 'Dr. Patel', room: 'Lab A', type: 'core' },
    { id: 't2', time: '09:30', subject: 'Algebra', instructor: 'Prof. Chen', room: 'Room 101', type: 'core' },
    { id: 't3', time: '11:00', subject: 'BREAK', instructor: '', room: 'Cafeteria', type: 'break' },
    { id: 't4', time: '12:00', subject: 'Creative Writing', instructor: 'Mrs. Thompson', room: 'Room 205', type: 'elective' },
    { id: 't5', time: '14:00', subject: 'Physical Education', instructor: 'Coach Davis', room: 'Gymnasium', type: 'elective' },
  ],
  WEDNESDAY: [
    { id: 'w1', time: '08:00', subject: 'Language Arts', instructor: 'Mrs. Thompson', room: 'Room 205', type: 'core' },
    { id: 'w2', time: '09:30', subject: 'Mathematical Reasoning', instructor: 'Prof. Chen', room: 'Room 101', type: 'core' },
    { id: 'w3', time: '11:00', subject: 'BREAK', instructor: '', room: 'Cafeteria', type: 'break' },
    { id: 'w4', time: '12:00', subject: 'Science Lab', instructor: 'Dr. Patel', room: 'Lab A', type: 'core' },
    { id: 'w5', time: '14:00', subject: 'Art & Music', instructor: 'Ms. Garcia', room: 'Art Studio', type: 'elective' },
  ],
  THURSDAY: [
    { id: 'th1', time: '08:00', subject: 'Social Studies', instructor: 'Mr. Rivera', room: 'Room 303', type: 'core' },
    { id: 'th2', time: '09:30', subject: 'Science', instructor: 'Dr. Patel', room: 'Lab A', type: 'core' },
    { id: 'th3', time: '11:00', subject: 'BREAK', instructor: '', room: 'Cafeteria', type: 'break' },
    { id: 'th4', time: '12:00', subject: 'Language Arts', instructor: 'Mrs. Thompson', room: 'Room 205', type: 'core' },
    { id: 'th5', time: '14:00', subject: 'Study Hall', instructor: '', room: 'Library', type: 'study' },
  ],
  FRIDAY: [
    { id: 'f1', time: '08:00', subject: 'Algebra Review', instructor: 'Prof. Chen', room: 'Room 101', type: 'core' },
    { id: 'f2', time: '09:30', subject: 'Reading Comprehension', instructor: 'Mrs. Thompson', room: 'Room 205', type: 'core' },
    { id: 'f3', time: '11:00', subject: 'BREAK', instructor: '', room: 'Cafeteria', type: 'break' },
    { id: 'f4', time: '12:00', subject: 'GED Prep Workshop', instructor: 'Various', room: 'Auditorium', type: 'core' },
    { id: 'f5', time: '14:00', subject: 'Free Period', instructor: '', room: '', type: 'study' },
  ],
};

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
  const [selectedDay, setSelectedDay] = useState('MONDAY');

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

  const schedule = SCHEDULE[selectedDay] || [];

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <Clock size={16} color={NEON_CYAN} />
        [ CLASS SCHEDULE ]
      </div>

      <div style={{ display: 'flex', gap: '2px', marginBottom: '16px' }}>
        {DAYS.map(day => (
          <button
            key={day}
            style={dayTabStyle(selectedDay === day)}
            onClick={() => setSelectedDay(day)}
          >
            {day.substring(0, 3)}
          </button>
        ))}
      </div>

      <div style={{ 
        fontSize: '12px', 
        fontWeight: 'bold', 
        marginBottom: '12px',
        color: NEON_CYAN,
      }}>
        {selectedDay}
      </div>

      {schedule.map(entry => (
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
      ))}

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
