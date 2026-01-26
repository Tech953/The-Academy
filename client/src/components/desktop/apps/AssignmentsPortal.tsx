import { useState } from 'react';
import { BookOpen, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface Assignment {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  grade?: number;
}

const SAMPLE_ASSIGNMENTS: Assignment[] = [
  { id: '1', title: 'Mathematical Reasoning Quiz', subject: 'Mathematics', dueDate: 'Tomorrow', status: 'pending' },
  { id: '2', title: 'Essay: Personal Narrative', subject: 'Language Arts', dueDate: 'In 3 days', status: 'in_progress' },
  { id: '3', title: 'Science Lab Report', subject: 'Science', dueDate: 'Next Week', status: 'pending' },
  { id: '4', title: 'Social Studies Reading', subject: 'Social Studies', dueDate: 'Completed', status: 'completed', grade: 92 },
  { id: '5', title: 'Algebra Practice Set', subject: 'Mathematics', dueDate: 'Yesterday', status: 'overdue' },
];

const NEON_GREEN = '#00ff00';
const NEON_CYAN = '#00ffff';
const NEON_AMBER = '#ffaa00';
const NEON_RED = '#ff3366';

export default function AssignmentsPortal() {
  const [assignments] = useState<Assignment[]>(SAMPLE_ASSIGNMENTS);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  const filteredAssignments = assignments.filter(a => {
    if (filter === 'all') return true;
    if (filter === 'pending') return a.status === 'pending' || a.status === 'in_progress' || a.status === 'overdue';
    return a.status === 'completed';
  });

  const getStatusIcon = (status: Assignment['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle size={16} color={NEON_GREEN} />;
      case 'in_progress': return <Clock size={16} color={NEON_CYAN} />;
      case 'overdue': return <AlertCircle size={16} color={NEON_RED} />;
      default: return <BookOpen size={16} color={NEON_AMBER} />;
    }
  };

  const getStatusColor = (status: Assignment['status']) => {
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

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        [ ASSIGNMENTS PORTAL ]
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button style={filterButtonStyle(filter === 'all')} onClick={() => setFilter('all')}>
          ALL
        </button>
        <button style={filterButtonStyle(filter === 'pending')} onClick={() => setFilter('pending')}>
          PENDING
        </button>
        <button style={filterButtonStyle(filter === 'completed')} onClick={() => setFilter('completed')}>
          COMPLETED
        </button>
      </div>

      <div style={{ fontSize: '11px', marginBottom: '12px', color: `${NEON_GREEN}80` }}>
        {filteredAssignments.length} assignment(s) found
      </div>

      {filteredAssignments.map(assignment => (
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
      ))}

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
