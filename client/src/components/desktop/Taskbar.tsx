import { useState, useEffect } from 'react';

interface TaskbarWindow {
  id: string;
  title: string;
  icon?: string;
  isMinimized: boolean;
  isFocused: boolean;
}

interface TaskbarProps {
  windows: TaskbarWindow[];
  onWindowClick: (id: string) => void;
  onStartClick: () => void;
  showStartMenu: boolean;
}

export default function Taskbar({
  windows,
  onWindowClick,
  onStartClick,
  showStartMenu,
}: TaskbarProps) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '28px',
        background: 'linear-gradient(180deg, #c0c0c0 0%, #d4d4d4 2%, #c0c0c0 3%, #c0c0c0 97%, #808080 100%)',
        borderTop: '2px solid #ffffff',
        display: 'flex',
        alignItems: 'center',
        padding: '2px 4px',
        gap: '4px',
        zIndex: 99998,
        fontFamily: '"MS Sans Serif", "Segoe UI", Tahoma, sans-serif',
        fontSize: '11px',
      }}
    >
      {/* Start Button */}
      <button
        onClick={onStartClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '2px 6px',
          height: '22px',
          background: showStartMenu
            ? 'linear-gradient(180deg, #808080 0%, #c0c0c0 100%)'
            : 'linear-gradient(180deg, #c0c0c0 0%, #dfdfdf 50%, #c0c0c0 100%)',
          border: '2px solid',
          borderColor: showStartMenu
            ? '#808080 #ffffff #ffffff #808080'
            : '#ffffff #808080 #808080 #ffffff',
          cursor: 'pointer',
          fontWeight: 'bold',
          fontSize: '11px',
        }}
      >
        <span style={{ fontSize: '14px' }}>🪟</span>
        Start
      </button>

      {/* Quick Launch Divider */}
      <div style={{
        width: '2px',
        height: '20px',
        background: 'linear-gradient(90deg, #808080 0%, #ffffff 100%)',
        marginLeft: '4px',
        marginRight: '4px',
      }} />

      {/* Window Buttons */}
      <div style={{ flex: 1, display: 'flex', gap: '2px', overflow: 'hidden' }}>
        {windows.map((win) => (
          <button
            key={win.id}
            onClick={() => onWindowClick(win.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              height: '22px',
              minWidth: '120px',
              maxWidth: '180px',
              background: win.isFocused
                ? 'linear-gradient(180deg, #808080 0%, #c0c0c0 100%)'
                : 'linear-gradient(180deg, #c0c0c0 0%, #dfdfdf 50%, #c0c0c0 100%)',
              border: '2px solid',
              borderColor: win.isFocused
                ? '#808080 #ffffff #ffffff #808080'
                : '#ffffff #808080 #808080 #ffffff',
              cursor: 'pointer',
              fontSize: '11px',
              textAlign: 'left',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {win.icon && <span style={{ fontSize: '12px' }}>{win.icon}</span>}
            <span style={{ 
              overflow: 'hidden', 
              textOverflow: 'ellipsis',
              fontWeight: win.isFocused ? 'bold' : 'normal',
            }}>
              {win.title}
            </span>
          </button>
        ))}
      </div>

      {/* System Tray */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '2px 8px',
        height: '22px',
        background: '#c0c0c0',
        border: '1px solid',
        borderColor: '#808080 #ffffff #ffffff #808080',
      }}>
        <span style={{ fontSize: '12px' }}>🔊</span>
        <span style={{ fontSize: '11px' }}>{formatTime(time)}</span>
      </div>
    </div>
  );
}
