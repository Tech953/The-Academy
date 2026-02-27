import { useState } from 'react';
import { BookOpen, CheckCircle, Clock, AlertCircle, Lock } from 'lucide-react';
import { DEFAULT_ASSIGNMENTS, AssignmentData } from '@shared/curriculum';
import { useGameState } from '@/contexts/GameStateContext';

const NEON_GREEN = '#00ff00';
const NEON_CYAN = '#00ffff';
const NEON_AMBER = '#ffaa00';
const NEON_RED = '#ff3366';

export default function AssignmentsPortal() {
  const { enrolledCourses } = useGameState();
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  const enrolledAssignments = DEFAULT_ASSIGNMENTS.filter(a =>
    enrolledCourses.includes(a.courseId)
  );

  const filteredAssignments = enrolledAssignments.filter(a => {
    if (filter === 'all') return true;
    if (filter === 'pending') return a.status === 'pending' || a.status === 'in_progress' || a.status === 'overdue';
    return a.status === 'completed';
  });

  const getStatusIcon = (status: AssignmentData['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle size={16} color={NEON_GREEN} />;
      case 'in_progress': return <Clock size={16} color={NEON_CYAN} />;
      case 'overdue': return <AlertCircle size={16} color={NEON_RED} />;
      default: return <BookOpen size={16} color={NEON_AMBER} />;
    }
  };

  const getStatusColor = (status: AssignmentData['status']) => {
    switch (status) {
      case 'completed': return NEON_GREEN;
      case 'in_progress': return NEON_CYAN;
      case 'overdue': return NEON_RED;
      default: return NEON_AMBER;
    }
  };

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
    marginBottom: '16px',
    textShadow: `0 0 10px ${NEON_GREEN}`,
    borderBottom: `1px solid ${NEON_GREEN}40`,
    paddingBottom: '8px',
  };

  const filterButtonStyle = (active: boolean): React.CSSProperties => ({
    background: active ? `${NEON_GREEN}20` : 'transparent',
    border: `1px solid ${active ? NEON_GREEN : NEON_GREEN + '60'}`,
    color: NEON_GREEN,
    padding: '6px 12px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: '11px',
    textShadow: active ? `0 0 5px ${NEON_GREEN}` : 'none',
  });

  const assignmentCardStyle: React.CSSProperties = {
    background: '#111',
    border: `1px solid ${NEON_GREEN}40`,
    padding: '12px',
    marginBottom: '8px',
    borderRadius: '2px',
  };

  if (enrolledCourses.length === 0) {
    return (
      <div style={containerStyle}>
        <div style={headerStyle}>[ ASSIGNMENTS PORTAL ]</div>
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
            Assignments will appear here after you enroll in courses.<br />
            Use the <span style={{ color: NEON_AMBER }}>ENROLL</span> command in the terminal to get started.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>[ ASSIGNMENTS PORTAL ]</div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button style={filterButtonStyle(filter === 'all')} onClick={() => setFilter('all')}>ALL</button>
        <button style={filterButtonStyle(filter === 'pending')} onClick={() => setFilter('pending')}>PENDING</button>
        <button style={filterButtonStyle(filter === 'completed')} onClick={() => setFilter('completed')}>COMPLETED</button>
      </div>

      <div style={{ fontSize: '11px', marginBottom: '12px', color: `${NEON_GREEN}80` }}>
        {filteredAssignments.length} assignment(s) found · {enrolledCourses.length} course(s) enrolled
      </div>

      {filteredAssignments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '30px 0', color: `${NEON_GREEN}40`, fontSize: '11px' }}>
          No {filter !== 'all' ? filter : ''} assignments found.
        </div>
      ) : (
        filteredAssignments.map(assignment => (
          <div key={assignment.id} style={assignmentCardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              {getStatusIcon(assignment.status)}
              <span style={{
                fontWeight: 'bold',
                fontSize: '12px',
                color: getStatusColor(assignment.status),
                textShadow: `0 0 5px ${getStatusColor(assignment.status)}40`,
              }}>
                {assignment.title}
              </span>
            </div>
            <div style={{ fontSize: '10px', color: `${NEON_GREEN}80`, marginLeft: '24px' }}>
              <div>Subject: {assignment.subject}</div>
              <div>Due: {assignment.dueDate}</div>
              {assignment.grade !== undefined && (
                <div style={{ color: NEON_CYAN }}>Grade: {assignment.grade}%</div>
              )}
            </div>
          </div>
        ))
      )}

      <div style={{
        marginTop: '16px',
        padding: '8px',
        background: '#0f0f0f',
        fontSize: '10px',
        borderTop: `1px solid ${NEON_GREEN}20`,
      }}>
        TIP: Complete assignments on time to boost your academic reputation.
      </div>
    </div>
  );
}
