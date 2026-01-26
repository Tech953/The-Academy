import { useState, useRef, useCallback, useEffect } from 'react';

export interface WindowProps {
  id: string;
  title: string;
  icon?: string;
  children: React.ReactNode;
  initialX?: number;
  initialY?: number;
  initialWidth?: number;
  initialHeight?: number;
  minWidth?: number;
  minHeight?: number;
  isMinimized?: boolean;
  isMaximized?: boolean;
  isFocused?: boolean;
  onClose?: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
  onFocus?: () => void;
  onMove?: (x: number, y: number) => void;
  onResize?: (width: number, height: number) => void;
  resizable?: boolean;
  zIndex?: number;
}

export default function Window({
  id,
  title,
  icon,
  children,
  initialX = 100,
  initialY = 100,
  initialWidth = 400,
  initialHeight = 300,
  minWidth = 200,
  minHeight = 150,
  isMinimized = false,
  isMaximized = false,
  isFocused = false,
  onClose,
  onMinimize,
  onMaximize,
  onFocus,
  onMove,
  onResize,
  resizable = true,
  zIndex = 1,
}: WindowProps) {
  const [position, setPosition] = useState({ x: initialX, y: initialY });
  const [size, setSize] = useState({ width: initialWidth, height: initialHeight });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  const windowRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (onFocus) onFocus();
  }, [onFocus]);

  const handleTitleBarMouseDown = useCallback((e: React.MouseEvent) => {
    if (isMaximized) return;
    e.preventDefault();
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
    if (onFocus) onFocus();
  }, [isMaximized, position, onFocus]);

  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    if (!resizable || isMaximized) return;
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    if (onFocus) onFocus();
  }, [resizable, isMaximized, onFocus]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = Math.max(0, e.clientX - dragOffset.x);
        const newY = Math.max(0, e.clientY - dragOffset.y);
        setPosition({ x: newX, y: newY });
        if (onMove) onMove(newX, newY);
      }
      if (isResizing && windowRef.current) {
        const rect = windowRef.current.getBoundingClientRect();
        const newWidth = Math.max(minWidth, e.clientX - rect.left);
        const newHeight = Math.max(minHeight, e.clientY - rect.top);
        setSize({ width: newWidth, height: newHeight });
        if (onResize) onResize(newWidth, newHeight);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragOffset, minWidth, minHeight, onMove, onResize]);

  if (isMinimized) return null;

  const windowStyle: React.CSSProperties = isMaximized
    ? {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: 'calc(100vh - 40px)',
        zIndex,
      }
    : {
        position: 'absolute',
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        zIndex,
      };

  return (
    <div
      ref={windowRef}
      data-window-id={id}
      onMouseDown={handleMouseDown}
      style={{
        ...windowStyle,
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(180deg, #c0c0c0 0%, #d4d4d4 2%, #c0c0c0 100%)',
        border: '2px solid',
        borderColor: isFocused ? '#000080 #ffffff #ffffff #000080' : '#808080 #ffffff #ffffff #808080',
        boxShadow: isFocused 
          ? '2px 2px 0px #000000, inset 1px 1px 0px #dfdfdf'
          : '1px 1px 0px #000000, inset 1px 1px 0px #dfdfdf',
        fontFamily: '"MS Sans Serif", "Segoe UI", Tahoma, sans-serif',
        fontSize: '11px',
        userSelect: isDragging ? 'none' : 'auto',
      }}
    >
      {/* Title Bar */}
      <div
        onMouseDown={handleTitleBarMouseDown}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '2px 3px',
          background: isFocused
            ? 'linear-gradient(90deg, #000080 0%, #1084d0 100%)'
            : 'linear-gradient(90deg, #808080 0%, #b0b0b0 100%)',
          cursor: isMaximized ? 'default' : 'move',
          minHeight: '18px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {icon && (
            <span style={{ fontSize: '12px' }}>{icon}</span>
          )}
          <span
            style={{
              color: '#ffffff',
              fontWeight: 'bold',
              fontSize: '11px',
              textShadow: '1px 1px 0px #000000',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {title}
          </span>
        </div>
        
        {/* Window Controls */}
        <div style={{ display: 'flex', gap: '2px' }}>
          {onMinimize && (
            <button
              onClick={(e) => { e.stopPropagation(); onMinimize(); }}
              style={{
                width: '16px',
                height: '14px',
                background: 'linear-gradient(180deg, #c0c0c0 0%, #dfdfdf 50%, #c0c0c0 100%)',
                border: '1px solid',
                borderColor: '#ffffff #808080 #808080 #ffffff',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                cursor: 'pointer',
                padding: 0,
                fontSize: '9px',
                fontWeight: 'bold',
              }}
            >
              _
            </button>
          )}
          {onMaximize && (
            <button
              onClick={(e) => { e.stopPropagation(); onMaximize(); }}
              style={{
                width: '16px',
                height: '14px',
                background: 'linear-gradient(180deg, #c0c0c0 0%, #dfdfdf 50%, #c0c0c0 100%)',
                border: '1px solid',
                borderColor: '#ffffff #808080 #808080 #ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                padding: 0,
                fontSize: '8px',
              }}
            >
              {isMaximized ? '❐' : '□'}
            </button>
          )}
          {onClose && (
            <button
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              style={{
                width: '16px',
                height: '14px',
                background: 'linear-gradient(180deg, #c0c0c0 0%, #dfdfdf 50%, #c0c0c0 100%)',
                border: '1px solid',
                borderColor: '#ffffff #808080 #808080 #ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                padding: 0,
                fontSize: '10px',
                fontWeight: 'bold',
              }}
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Window Content */}
      <div
        style={{
          flex: 1,
          overflow: 'hidden',
          background: '#ffffff',
          border: '2px solid',
          borderColor: '#808080 #ffffff #ffffff #808080',
          margin: '2px',
        }}
      >
        {children}
      </div>

      {/* Resize Handle */}
      {resizable && !isMaximized && (
        <div
          onMouseDown={handleResizeMouseDown}
          style={{
            position: 'absolute',
            right: 0,
            bottom: 0,
            width: '16px',
            height: '16px',
            cursor: 'se-resize',
            background: 'transparent',
          }}
        >
          <div style={{
            position: 'absolute',
            right: '2px',
            bottom: '2px',
            width: '10px',
            height: '10px',
            background: `
              linear-gradient(135deg, transparent 30%, #808080 30%, #808080 40%, transparent 40%),
              linear-gradient(135deg, transparent 50%, #808080 50%, #808080 60%, transparent 60%),
              linear-gradient(135deg, transparent 70%, #808080 70%, #808080 80%, transparent 80%)
            `,
          }} />
        </div>
      )}
    </div>
  );
}
