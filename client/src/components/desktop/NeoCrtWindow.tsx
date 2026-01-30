import { useState, useRef, useCallback, useEffect } from 'react';
import { Minus, Square, X, Maximize2, Expand } from 'lucide-react';
import { getNeoCrtIcon, IconType } from './NeoCrtDesktopShell';
import { useCrtTheme } from '@/contexts/CrtThemeContext';

interface WindowAnimationState {
  isOpening: boolean;
  isClosing: boolean;
}

export interface NeoCrtWindowProps {
  id: string;
  title: string;
  iconType?: IconType;
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
  onFullscreen?: () => void;
}

export default function NeoCrtWindow({
  id,
  title,
  iconType,
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
  onFullscreen,
}: NeoCrtWindowProps) {
  const { colors } = useCrtTheme();
  const primaryColor = colors.primary;
  const dimmedColor = colors.primary.replace('#', '#') + '99';
  
  const [position, setPosition] = useState({ x: initialX, y: initialY });
  const [size, setSize] = useState({ width: initialWidth, height: initialHeight });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  const windowRef = useRef<HTMLDivElement>(null);
  const [animState, setAnimState] = useState<WindowAnimationState>({ isOpening: true, isClosing: false });

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimState(prev => ({ ...prev, isOpening: false }));
    }, 400);
    return () => clearTimeout(timer);
  }, []);

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
        height: 'calc(100vh - 80px)',
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
      className={animState.isOpening ? 'screen-bloom' : ''}
      style={{
        ...windowStyle,
        display: 'flex',
        flexDirection: 'column',
        background: '#0a0a0a',
        border: `2px solid ${isFocused ? primaryColor : dimmedColor}`,
        boxShadow: isFocused 
          ? `0 0 20px ${primaryColor}40, 0 0 40px ${primaryColor}20, inset 0 0 20px ${primaryColor}10`
          : `0 0 10px ${primaryColor}20`,
        fontFamily: '"Courier New", monospace',
        fontSize: '12px',
        userSelect: isDragging ? 'none' : 'auto',
        borderRadius: '2px',
      }}
    >
      <div
        onMouseDown={handleTitleBarMouseDown}
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 10px',
          background: isFocused
            ? `linear-gradient(90deg, ${primaryColor}20 0%, transparent 100%)`
            : 'transparent',
          borderBottom: `1px solid ${isFocused ? primaryColor : dimmedColor}80`,
          cursor: isMaximized ? 'default' : 'move',
          minHeight: '28px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {iconType && (
            <div style={{ filter: `drop-shadow(0 0 4px ${primaryColor})` }}>
              {getNeoCrtIcon(iconType, 14, primaryColor)}
            </div>
          )}
          <span
            style={{
              color: primaryColor,
              fontWeight: 'bold',
              fontSize: '12px',
              textShadow: `0 0 10px ${primaryColor}`,
              letterSpacing: '1px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              textTransform: 'uppercase',
            }}
          >
            {title}
          </span>
        </div>
        
        <div style={{ display: 'flex', gap: '6px', position: 'relative', zIndex: 100 }}>
          {onFullscreen && (
            <button
              onClick={(e) => { e.stopPropagation(); onFullscreen(); }}
              data-testid="button-fullscreen-toggle"
              className="neo-crt-window-btn"
              title="Enter Fullscreen"
              style={{
                width: '20px',
                height: '20px',
                background: 'transparent',
                border: `1px solid ${primaryColor}60`,
                borderRadius: '2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: primaryColor,
                transition: 'all 0.2s ease',
              }}
            >
              <Expand size={10} strokeWidth={2} />
            </button>
          )}
          {onMinimize && (
            <button
              onClick={(e) => { e.stopPropagation(); onMinimize(); }}
              className="neo-crt-window-btn"
              style={{
                width: '20px',
                height: '20px',
                background: 'transparent',
                border: `1px solid ${primaryColor}60`,
                borderRadius: '2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: primaryColor,
                transition: 'all 0.2s ease',
              }}
            >
              <Minus size={10} strokeWidth={2} />
            </button>
          )}
          {onMaximize && (
            <button
              onClick={(e) => { e.stopPropagation(); onMaximize(); }}
              className="neo-crt-window-btn"
              style={{
                width: '20px',
                height: '20px',
                background: 'transparent',
                border: `1px solid ${primaryColor}60`,
                borderRadius: '2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: primaryColor,
                transition: 'all 0.2s ease',
              }}
            >
              {isMaximized ? <Maximize2 size={10} strokeWidth={2} /> : <Square size={10} strokeWidth={2} />}
            </button>
          )}
          {onClose && (
            <button
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              className="neo-crt-window-btn neo-crt-close-btn"
              style={{
                width: '20px',
                height: '20px',
                background: 'transparent',
                border: `1px solid #ff336660`,
                borderRadius: '2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#ff3366',
                transition: 'all 0.2s ease',
              }}
            >
              <X size={12} strokeWidth={2} />
            </button>
          )}
        </div>
      </div>

      <div
        style={{
          flex: 1,
          overflow: 'hidden',
          background: '#000000',
        }}
      >
        {children}
      </div>

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
            right: '4px',
            bottom: '4px',
            width: '8px',
            height: '8px',
            borderRight: `2px solid ${primaryColor}60`,
            borderBottom: `2px solid ${primaryColor}60`,
          }} />
        </div>
      )}

      <style>{`
        .neo-crt-window-btn:hover {
          background: ${primaryColor}20 !important;
          box-shadow: 0 0 10px ${primaryColor}40;
        }
        .neo-crt-close-btn:hover {
          background: #ff336620 !important;
          box-shadow: 0 0 10px #ff336640;
        }
      `}</style>
    </div>
  );
}
