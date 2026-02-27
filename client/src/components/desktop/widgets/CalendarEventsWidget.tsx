import { useState, useEffect } from 'react';

interface CalEvent {
  id: string;
  date: string;
  title: string;
}

interface CalendarEventsWidgetProps {
  primaryColor: string;
  accentRed: string;
  accentCyan: string;
}

const STORAGE_KEY = 'academy-cal-events';

function loadEvents(): CalEvent[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'); } catch { return []; }
}
function saveEvents(evs: CalEvent[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(evs));
}

export function CalendarEventsWidget({ primaryColor, accentRed, accentCyan }: CalendarEventsWidgetProps) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [events, setEvents] = useState<CalEvent[]>(loadEvents);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [addingFor, setAddingFor] = useState<number | null>(null);
  const [draftTitle, setDraftTitle] = useState('');

  useEffect(() => { saveEvents(events); }, [events]);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDow = new Date(viewYear, viewMonth, 1).getDay();

  const dateKey = (d: number) =>
    `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  const eventsOnDay = (d: number) => events.filter(e => e.date === dateKey(d));

  const addEvent = () => {
    if (!addingFor || !draftTitle.trim()) return;
    const ev: CalEvent = { id: Date.now().toString(), date: dateKey(addingFor), title: draftTitle.trim() };
    setEvents(prev => [...prev, ev]);
    setDraftTitle('');
    setAddingFor(null);
  };

  const removeEvent = (id: string) => setEvents(prev => prev.filter(e => e.id !== id));

  const DAYS = ['S','M','T','W','T','F','S'];
  const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
    setSelectedDay(null);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
    setSelectedDay(null);
  };

  const isToday = (d: number) =>
    d === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();

  const selectedEvents = selectedDay ? eventsOnDay(selectedDay) : [];

  return (
    <div
      onMouseDown={e => e.stopPropagation()}
      onClick={e => e.stopPropagation()}
      style={{
        width: 170,
        height: 180,
        background: '#0a0a0a',
        border: `1px solid ${primaryColor}60`,
        boxShadow: `0 2px 16px rgba(0,0,0,0.7), 0 0 8px ${primaryColor}10`,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        fontFamily: '"Courier New", monospace',
      }}
    >
      <div style={{
        height: 22,
        background: `${primaryColor}18`,
        borderBottom: `1px solid ${primaryColor}30`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 4px',
        flexShrink: 0,
      }}>
        <button onClick={prevMonth} style={{ background: 'none', border: 'none', color: primaryColor, cursor: 'pointer', fontSize: 10, padding: '0 2px' }}>‹</button>
        <span style={{ fontSize: 9, color: primaryColor, letterSpacing: 1 }}>
          {MONTHS[viewMonth]} {viewYear}
        </span>
        <button onClick={nextMonth} style={{ background: 'none', border: 'none', color: primaryColor, cursor: 'pointer', fontSize: 10, padding: '0 2px' }}>›</button>
      </div>

      <div style={{ padding: '3px 4px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, marginBottom: 2 }}>
          {DAYS.map((d, i) => (
            <div key={i} style={{ textAlign: 'center', fontSize: 7, color: `${primaryColor}50`, paddingBottom: 1 }}>{d}</div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, flex: 1 }}>
          {Array.from({ length: firstDow }).map((_, i) => <div key={`pad-${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const d = i + 1;
            const hasEvs = eventsOnDay(d).length > 0;
            const sel = selectedDay === d;
            const tod = isToday(d);
            return (
              <button
                key={d}
                onClick={() => {
                  setSelectedDay(sel ? null : d);
                  setAddingFor(null);
                }}
                onDoubleClick={() => { setSelectedDay(d); setAddingFor(d); }}
                title={`${dateKey(d)}${hasEvs ? ` — ${eventsOnDay(d).length} event(s)` : ''}\nDouble-click to add event`}
                style={{
                  textAlign: 'center',
                  fontSize: 8,
                  color: tod ? '#000' : sel ? primaryColor : `${primaryColor}80`,
                  background: tod ? primaryColor : sel ? `${primaryColor}25` : 'transparent',
                  border: hasEvs && !tod ? `1px solid ${accentCyan}60` : '1px solid transparent',
                  cursor: 'pointer',
                  padding: '1px 0',
                  position: 'relative',
                  fontFamily: 'monospace',
                }}
              >
                {d}
                {hasEvs && !tod && (
                  <span style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 3, height: 3, borderRadius: '50%', background: accentCyan, display: 'block' }} />
                )}
              </button>
            );
          })}
        </div>

        {selectedDay && (
          <div style={{
            marginTop: 3,
            borderTop: `1px solid ${primaryColor}20`,
            paddingTop: 3,
            maxHeight: 46,
            overflow: 'auto',
          }}>
            {addingFor === selectedDay ? (
              <div style={{ display: 'flex', gap: 2 }}>
                <input
                  autoFocus
                  value={draftTitle}
                  onChange={e => setDraftTitle(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addEvent(); if (e.key === 'Escape') setAddingFor(null); }}
                  placeholder="Event title..."
                  style={{
                    flex: 1, background: `${primaryColor}10`, border: `1px solid ${primaryColor}40`,
                    color: primaryColor, fontSize: 8, padding: '1px 3px', fontFamily: 'monospace', outline: 'none',
                  }}
                />
                <button onClick={addEvent} style={{ background: `${primaryColor}20`, border: `1px solid ${primaryColor}50`, color: primaryColor, fontSize: 7, padding: '1px 3px', cursor: 'pointer', fontFamily: 'monospace' }}>+</button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                <span style={{ fontSize: 7, color: `${primaryColor}50` }}>{dateKey(selectedDay)}</span>
                <button onClick={() => setAddingFor(selectedDay)} style={{ background: 'none', border: `1px solid ${primaryColor}40`, color: `${primaryColor}70`, fontSize: 7, padding: '0 3px', cursor: 'pointer', fontFamily: 'monospace' }}>+ ADD</button>
              </div>
            )}
            {selectedEvents.length === 0 && addingFor !== selectedDay && (
              <div style={{ fontSize: 7, color: `${primaryColor}30`, fontFamily: 'monospace' }}>No events. Double-click day to add.</div>
            )}
            {selectedEvents.map(ev => (
              <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: 1 }}>
                <span style={{ width: 4, height: 4, borderRadius: '50%', background: accentCyan, flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 8, color: primaryColor, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</span>
                <button onClick={() => removeEvent(ev.id)} style={{ background: 'none', border: 'none', color: accentRed, fontSize: 8, cursor: 'pointer', padding: 0, lineHeight: 1 }}>×</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
