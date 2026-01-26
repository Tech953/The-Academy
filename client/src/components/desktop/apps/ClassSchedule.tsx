import { useState } from 'react';
import { Clock, User, MapPin } from 'lucide-react';
import { DAYS, DEFAULT_SCHEDULE, DayOfWeek, ScheduleEntry } from '@shared/curriculum';

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

interface ClassScheduleProps {
  schedule?: Record<DayOfWeek, ScheduleEntry[]>;
}

export default function ClassSchedule({ schedule = DEFAULT_SCHEDULE }: ClassScheduleProps) {
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

  const daySchedule = schedule[selectedDay] || [];

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

      {daySchedule.map(entry => (
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
