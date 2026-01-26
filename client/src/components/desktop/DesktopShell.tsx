import { useState, useCallback } from 'react';
import Window from './Window';
import DesktopIcon from './DesktopIcon';
import Taskbar from './Taskbar';
import Calculator from './apps/Calculator';
import Notepad from './apps/Notepad';
import FileExplorer from './apps/FileExplorer';
import Home from '@/pages/Home';

interface WindowState {
  id: string;
  title: string;
  icon: string;
  component: React.ReactNode;
  x: number;
  y: number;
  width: number;
  height: number;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
}

const DESKTOP_ICONS = [
  { id: 'academy', icon: '🎮', label: 'The Academy' },
  { id: 'files', icon: '📁', label: 'My Computer' },
  { id: 'notepad', icon: '📝', label: 'Notepad' },
  { id: 'calculator', icon: '🔢', label: 'Calculator' },
  { id: 'recycle', icon: '🗑️', label: 'Recycle Bin' },
];

export default function DesktopShell() {
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [focusedWindowId, setFocusedWindowId] = useState<string | null>(null);
  const [nextZIndex, setNextZIndex] = useState(1);
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
  const [showStartMenu, setShowStartMenu] = useState(false);

  const getAppComponent = (appId: string): { component: React.ReactNode; title: string; width: number; height: number } => {
    switch (appId) {
      case 'academy':
        return {
          component: <Home />,
          title: 'The Academy',
          width: 800,
          height: 600,
        };
      case 'calculator':
        return {
          component: <Calculator />,
          title: 'Calculator',
          width: 200,
          height: 280,
        };
      case 'notepad':
        return {
          component: <Notepad />,
          title: 'Notepad',
          width: 450,
          height: 350,
        };
      case 'files':
        return {
          component: <FileExplorer onOpenApp={openWindow} />,
          title: 'My Computer',
          width: 500,
          height: 400,
        };
      default:
        return {
          component: <div style={{ padding: '20px' }}>Application not found</div>,
          title: 'Unknown',
          width: 300,
          height: 200,
        };
    }
  };

  const openWindow = useCallback((appId: string) => {
    const existingWindow = windows.find(w => w.id === appId);
    if (existingWindow) {
      setWindows(prev => prev.map(w => 
        w.id === appId 
          ? { ...w, isMinimized: false, zIndex: nextZIndex }
          : w
      ));
      setFocusedWindowId(appId);
      setNextZIndex(prev => prev + 1);
      return;
    }

    const { component, title, width, height } = getAppComponent(appId);
    const icon = DESKTOP_ICONS.find(i => i.id === appId)?.icon || '📄';
    
    const offsetX = (windows.length % 5) * 30;
    const offsetY = (windows.length % 5) * 30;

    const newWindow: WindowState = {
      id: appId,
      title,
      icon,
      component,
      x: 50 + offsetX,
      y: 50 + offsetY,
      width,
      height,
      isMinimized: false,
      isMaximized: false,
      zIndex: nextZIndex,
    };

    setWindows(prev => [...prev, newWindow]);
    setFocusedWindowId(appId);
    setNextZIndex(prev => prev + 1);
    setShowStartMenu(false);
  }, [windows, nextZIndex]);

  const closeWindow = useCallback((id: string) => {
    setWindows(prev => prev.filter(w => w.id !== id));
    if (focusedWindowId === id) {
      setFocusedWindowId(null);
    }
  }, [focusedWindowId]);

  const minimizeWindow = useCallback((id: string) => {
    setWindows(prev => prev.map(w =>
      w.id === id ? { ...w, isMinimized: true } : w
    ));
    if (focusedWindowId === id) {
      setFocusedWindowId(null);
    }
  }, [focusedWindowId]);

  const maximizeWindow = useCallback((id: string) => {
    setWindows(prev => prev.map(w =>
      w.id === id ? { ...w, isMaximized: !w.isMaximized } : w
    ));
  }, []);

  const focusWindow = useCallback((id: string) => {
    setWindows(prev => prev.map(w =>
      w.id === id ? { ...w, zIndex: nextZIndex } : w
    ));
    setFocusedWindowId(id);
    setNextZIndex(prev => prev + 1);
    setShowStartMenu(false);
  }, [nextZIndex]);

  const handleTaskbarWindowClick = useCallback((id: string) => {
    const win = windows.find(w => w.id === id);
    if (win?.isMinimized) {
      setWindows(prev => prev.map(w =>
        w.id === id ? { ...w, isMinimized: false, zIndex: nextZIndex } : w
      ));
      setFocusedWindowId(id);
      setNextZIndex(prev => prev + 1);
    } else if (focusedWindowId === id) {
      minimizeWindow(id);
    } else {
      focusWindow(id);
    }
  }, [windows, focusedWindowId, nextZIndex, minimizeWindow, focusWindow]);

  const handleDesktopClick = () => {
    setSelectedIcon(null);
    setShowStartMenu(false);
  };

  return (
    <div
      onClick={handleDesktopClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'linear-gradient(135deg, #008080 0%, #006666 50%, #004d4d 100%)',
        overflow: 'hidden',
        fontFamily: '"MS Sans Serif", "Segoe UI", Tahoma, sans-serif',
      }}
    >
      {/* Desktop Icons */}
      <div
        style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {DESKTOP_ICONS.map((icon) => (
          <DesktopIcon
            key={icon.id}
            icon={icon.icon}
            label={icon.label}
            isSelected={selectedIcon === icon.id}
            onSelect={() => setSelectedIcon(icon.id)}
            onDoubleClick={() => openWindow(icon.id)}
          />
        ))}
      </div>

      {/* Windows */}
      {windows.map((win) => (
        <Window
          key={win.id}
          id={win.id}
          title={win.title}
          icon={win.icon}
          initialX={win.x}
          initialY={win.y}
          initialWidth={win.width}
          initialHeight={win.height}
          isMinimized={win.isMinimized}
          isMaximized={win.isMaximized}
          isFocused={focusedWindowId === win.id}
          zIndex={win.zIndex}
          onClose={() => closeWindow(win.id)}
          onMinimize={() => minimizeWindow(win.id)}
          onMaximize={() => maximizeWindow(win.id)}
          onFocus={() => focusWindow(win.id)}
        >
          {win.component}
        </Window>
      ))}

      {/* Start Menu */}
      {showStartMenu && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            bottom: '30px',
            left: '0',
            width: '200px',
            background: '#c0c0c0',
            border: '2px solid',
            borderColor: '#ffffff #808080 #808080 #ffffff',
            boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.3)',
            zIndex: 99999,
          }}
        >
          <div style={{
            display: 'flex',
            height: '100%',
          }}>
            {/* Side Banner */}
            <div style={{
              width: '24px',
              background: 'linear-gradient(180deg, #000080 0%, #1084d0 100%)',
              display: 'flex',
              alignItems: 'flex-end',
              padding: '8px 4px',
            }}>
              <span style={{
                color: '#c0c0c0',
                fontSize: '14px',
                fontWeight: 'bold',
                writingMode: 'vertical-rl',
                transform: 'rotate(180deg)',
                letterSpacing: '2px',
              }}>
                StudentOS
              </span>
            </div>

            {/* Menu Items */}
            <div style={{ flex: 1, padding: '4px 0' }}>
              {[
                { icon: '🎮', label: 'The Academy', id: 'academy' },
                { icon: '📁', label: 'My Computer', id: 'files' },
                { icon: '📝', label: 'Notepad', id: 'notepad' },
                { icon: '🔢', label: 'Calculator', id: 'calculator' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => { openWindow(item.id); setShowStartMenu(false); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '6px 12px',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '11px',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#000080';
                    e.currentTarget.style.color = '#ffffff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#000000';
                  }}
                >
                  <span style={{ fontSize: '16px' }}>{item.icon}</span>
                  {item.label}
                </button>
              ))}

              <div style={{
                height: '1px',
                background: '#808080',
                margin: '4px 8px',
              }} />

              <button
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '6px 12px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '11px',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#000080';
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#000000';
                }}
              >
                <span style={{ fontSize: '16px' }}>🔒</span>
                Shut Down...
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Taskbar */}
      <Taskbar
        windows={windows.map(w => ({
          id: w.id,
          title: w.title,
          icon: w.icon,
          isMinimized: w.isMinimized,
          isFocused: focusedWindowId === w.id,
        }))}
        onWindowClick={handleTaskbarWindowClick}
        onStartClick={() => setShowStartMenu(!showStartMenu)}
        showStartMenu={showStartMenu}
      />
    </div>
  );
}
