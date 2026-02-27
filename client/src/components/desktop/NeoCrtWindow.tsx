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

type ResizeDir = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

const EDGE = 6;
const CORNER = 12;

const cursorMap: Record<ResizeDir, string> = {
  n: 'n-resize', s: 's-resize', e: 'e-resize', w: 'w-resize',
  ne: 'ne-resize', nw: 'nw-resize', se: 'se-resize', sw: 'sw-resize',
};

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
  const dimmedColor = colors.primary + '99';

  const [position, setPosition] = useState({ x: initialX, y: initialY });
  const [size, setSize] = useState({ width: initialWidth, height: initialHeight });
  const [isDragging, setIsDragging] = useState(false);
  const [resizeDir, setResizeDir] = useState<ResizeDir | null>(null);
  const [animState, setAnimState] = useState<WindowAnimationState>({ isOpening: true, isClosing: false });

  const windowRef = useRef<HTMLDivElement>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const resizeStart = useRef({ mouseX: 0, mouseY: 0, x: 0, y: 0, width: 0, height: 0 });

  useEffect(() => {
    const timer = setTimeout(() => setAnimState(prev => ({ ...prev, isOpening: false })), 400);
    return () => clearTimeout(timer);
  }, []);

  const handleMouseDown = useCallback(() => {
    if (onFocus) onFocus();
  }, [onFocus]);

  const handleTitleBarMouseDown = useCallback((e: React.MouseEvent) => {
    if (isMaximized) return;
    e.preventDefault();
    dragOffset.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    setIsDragging(true);
    if (onFocus) onFocus();
  }, [isMaximized, position, onFocus]);

  const handleResizeMouseDown = useCallback((e: React.MouseEvent, dir: ResizeDir) => {
    if (!resizable || isMaximized) return;
    e.preventDefault();
    e.stopPropagation();
    resizeStart.current = {
      mouseX: e.clientX, mouseY: e.clientY,
      x: position.x, y: position.y,
      width: size.width, height: size.height,
    };
    setResizeDir(dir);
    if (onFocus) onFocus();
  }, [resizable, isMaximized, position, size, onFocus]);

  useEffect(() => {
    if (!isDragging && !resizeDir) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = Math.max(0, e.clientX - dragOffset.current.x);
        const newY = Math.max(0, e.clientY - dragOffset.current.y);
        setPosition({ x: newX, y: newY });
        if (onMove) onMove(newX, newY);
        return;
      }

      if (resizeDir) {
        const { mouseX, mouseY, x: ox, y: oy, width: ow, height: oh } = resizeStart.current;
        const dx = e.clientX - mouseX;
        const dy = e.clientY - mouseY;

        let nx = ox, ny = oy, nw = ow, nh = oh;

        if (resizeDir.includes('e')) nw = Math.max(minWidth, ow + dx);
        if (resizeDir.includes('s')) nh = Math.max(minHeight, oh + dy);
        if (resizeDir.includes('w')) {
          nw = Math.max(minWidth, ow - dx);
          nx = ox + (ow - nw);
        }
        if (resizeDir.includes('n')) {
          nh = Math.max(minHeight, oh - dy);
          ny = oy + (oh - nh);
        }

        setPosition({ x: nx, y: ny });
        setSize({ width: nw, height: nh });
        if (onMove) onMove(nx, ny);
        if (onResize) onResize(nw, nh);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setResizeDir(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, resizeDir, minWidth, minHeight, onMove, onResize]);

  if (isMinimized) return null;

  const windowStyle: React.CSSProperties = isMaximized
    ? { position: 'fixed', top: 0, left: 0, width: '100vw', height: 'calc(100vh - 48px)', zIndex }
    : { position: 'absolute', left: position.x, top: position.y, width: size.width, height: size.height, zIndex };

  const isActive = !!isDragging || !!resizeDir;

  const edgeBase: React.CSSProperties = {
    position: 'absolute', zIndex: 20,
  };

  const cornerStyle = (dir: ResizeDir): React.CSSProperties => ({
    ...edgeBase,
    width: CORNER, height: CORNER,
    cursor: cursorMap[dir],
    ...(dir.includes('n') ? { top: 0 } : { bottom: 0 }),
    ...(dir.includes('w') ? { left: 0 } : { right: 0 }),
  });

  const edgeStyle = (dir: ResizeDir): React.CSSProperties => ({
    ...edgeBase,
    cursor: cursorMap[dir],
    ...(dir === 'n' ? { top: 0, left: CORNER, right: CORNER, height: EDGE } :
        dir === 's' ? { bottom: 0, left: CORNER, right: CORNER, height: EDGE } :
        dir === 'e' ? { right: 0, top: CORNER, bottom: CORNER, width: EDGE } :
                      { left: 0, top: CORNER, bottom: CORNER, width: EDGE }),
  });

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
        userSelect: isActive ? 'none' : 'auto',
        borderRadius: '2px',
      }}
    >
      {/* Title bar */}
      <div
        onMouseDown={handleTitleBarMouseDown}
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          height: '36px',
          padding: '0 0 0 12px',
          background: isFocused
            ? `linear-gradient(90deg, ${primaryColor}18 0%, transparent 60%)`
            : 'transparent',
          borderBottom: `1px solid ${isFocused ? primaryColor : dimmedColor}60`,
          cursor: isMaximized ? 'default' : 'move',
          flexShrink: 0,
          gap: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1, overflow: 'hidden' }}>
          {iconType && (
            <div style={{ filter: `drop-shadow(0 0 4px ${primaryColor})`, flexShrink: 0 }}>
              {getNeoCrtIcon(iconType, 13, primaryColor)}
            </div>
          )}
          <span style={{
            color: primaryColor,
            fontWeight: 'bold',
            fontSize: '12px',
            textShadow: `0 0 8px ${primaryColor}80`,
            letterSpacing: '0.8px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            textTransform: 'uppercase',
            opacity: isFocused ? 1 : 0.7,
          }}>
            {title}
          </span>
        </div>

        <div style={{
          display: 'flex',
          gap: '3px',
          flexShrink: 0,
          alignItems: 'center',
          height: '100%',
          padding: '0 8px',
          borderLeft: `1px solid ${primaryColor}20`,
          marginLeft: 8,
        }}>
          {onFullscreen && (
            <WinBtn color={primaryColor} title="Fullscreen" onClick={(e) => { e.stopPropagation(); onFullscreen(); }} testId="button-fullscreen-toggle">
              <Expand size={10} strokeWidth={2} />
            </WinBtn>
          )}
          {onMinimize && (
            <WinBtn color={primaryColor} title="Minimize" onClick={(e) => { e.stopPropagation(); onMinimize(); }}>
              <Minus size={10} strokeWidth={2} />
            </WinBtn>
          )}
          {onMaximize && (
            <WinBtn color={primaryColor} title={isMaximized ? 'Restore' : 'Maximize'} onClick={(e) => { e.stopPropagation(); onMaximize(); }}>
              {isMaximized ? <Maximize2 size={10} strokeWidth={2} /> : <Square size={10} strokeWidth={2} />}
            </WinBtn>
          )}
          {onClose && (
            <WinBtn color="#ff3366" title="Close" onClick={(e) => { e.stopPropagation(); onClose(); }} isClose>
              <X size={11} strokeWidth={2} />
            </WinBtn>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'hidden', background: '#000000', position: 'relative' }}>
        {children}
      </div>

      {/* Resize handles — all 8 directions */}
      {resizable && !isMaximized && (
        <>
          {/* Corners */}
          {(['nw', 'ne', 'sw', 'se'] as ResizeDir[]).map(dir => (
            <div
              key={dir}
              style={cornerStyle(dir)}
              onMouseDown={(e) => handleResizeMouseDown(e, dir)}
            >
              <div style={{
                position: 'absolute',
                width: 6, height: 6,
                ...(dir.includes('n') ? { top: 3 } : { bottom: 3 }),
                ...(dir.includes('w') ? { left: 3 } : { right: 3 }),
                borderTop: dir.includes('n') ? `2px solid ${primaryColor}70` : undefined,
                borderBottom: dir.includes('s') ? `2px solid ${primaryColor}70` : undefined,
                borderLeft: dir.includes('w') ? `2px solid ${primaryColor}70` : undefined,
                borderRight: dir.includes('e') ? `2px solid ${primaryColor}70` : undefined,
              }} />
            </div>
          ))}
          {/* Edges */}
          {(['n', 's', 'e', 'w'] as ResizeDir[]).map(dir => (
            <div
              key={dir}
              style={edgeStyle(dir)}
              onMouseDown={(e) => handleResizeMouseDown(e, dir)}
            />
          ))}
        </>
      )}
    </div>
  );
}

function WinBtn({ color, title, onClick, children, testId, isClose }: {
  color: string; title: string; onClick: (e: React.MouseEvent) => void;
  children: React.ReactNode; testId?: string; isClose?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      data-testid={testId}
      title={title}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '20px',
        height: '20px',
        background: hovered ? (isClose ? '#ff336630' : `${color}25`) : 'transparent',
        border: `1px solid ${isClose ? '#ff336660' : color + '60'}`,
        borderRadius: '2px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: isClose ? '#ff3366' : color,
        boxShadow: hovered ? `0 0 8px ${color}40` : 'none',
        transition: 'background 0.15s, box-shadow 0.15s',
      }}
    >
      {children}
    </button>
  );
}
