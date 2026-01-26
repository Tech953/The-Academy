import { useState } from 'react';

interface DesktopIconProps {
  icon: string;
  label: string;
  onDoubleClick: () => void;
  isSelected?: boolean;
  onSelect?: () => void;
}

export default function DesktopIcon({
  icon,
  label,
  onDoubleClick,
  isSelected = false,
  onSelect,
}: DesktopIconProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onClick={onSelect}
      onDoubleClick={onDoubleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '75px',
        padding: '4px',
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      <div
        style={{
          width: '48px',
          height: '48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '32px',
          background: isSelected ? 'rgba(0, 0, 128, 0.3)' : 'transparent',
          border: isSelected ? '1px dotted #ffffff' : '1px solid transparent',
          marginBottom: '4px',
        }}
      >
        {icon}
      </div>
      <span
        style={{
          color: '#ffffff',
          fontSize: '11px',
          fontFamily: '"MS Sans Serif", "Segoe UI", Tahoma, sans-serif',
          textAlign: 'center',
          textShadow: '1px 1px 2px #000000',
          background: isSelected ? '#000080' : (isHovered ? 'rgba(0, 0, 128, 0.5)' : 'transparent'),
          padding: '1px 3px',
          wordBreak: 'break-word',
          maxWidth: '70px',
        }}
      >
        {label}
      </span>
    </div>
  );
}
