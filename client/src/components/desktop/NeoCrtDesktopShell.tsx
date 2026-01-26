import { useState, useCallback, ReactNode } from 'react';
import NeoCrtWindow from './NeoCrtWindow';
import Calculator from './apps/Calculator';
import Notepad from './apps/Notepad';
import FileExplorer from './apps/FileExplorer';
import AssignmentsPortal from './apps/AssignmentsPortal';
import PerksViewer from './apps/PerksViewer';
import ResonanceDashboard from './apps/ResonanceDashboard';
import ClassSchedule from './apps/ClassSchedule';
import CubCompanion from './apps/CubCompanion';
import Home from '@/pages/Home';
import { 
  User, Mail, MessageCircle, FolderOpen, Search, Settings, 
  Calendar, Gamepad2, FileText, Calculator as CalcIcon, Trash2, Power,
  BookOpen, Star, Activity, Clock, Heart
} from 'lucide-react';
import bearMascot from '@assets/ChatGPT Image Nov 29, 2025, 01_44_34 AM_1764398698829.png';

interface WindowState {
  id: string;
  title: string;
  iconType: IconType;
  component: React.ReactNode;
  x: number;
  y: number;
  width: number;
  height: number;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
}

export type IconType = 'personal' | 'email' | 'messages' | 'academy' | 'files' | 'notepad' | 'calculator' | 'recycle' | 'settings' | 'search' | 'calendar' | 'power' | 'folder' | 'file' | 'assignments' | 'perks' | 'resonance' | 'schedule' | 'cub';

const NEON_COLORS = {
  green: '#00ff00',
  cyan: '#00ffff',
  amber: '#ffaa00',
  purple: '#cc66ff',
  pink: '#ff66cc',
  red: '#ff3366',
};

interface DesktopIconConfig {
  id: string;
  iconType: IconType;
  label: string;
  color?: string;
}

const SIDEBAR_ICONS: DesktopIconConfig[] = [
  { id: 'personal', iconType: 'personal', label: 'PERSONAL', color: NEON_COLORS.green },
  { id: 'email', iconType: 'email', label: 'E-MAIL', color: NEON_COLORS.cyan },
  { id: 'messages', iconType: 'messages', label: 'MESSAGES', color: NEON_COLORS.green },
  { id: 'assignments', iconType: 'assignments', label: 'ASSIGNMENTS', color: NEON_COLORS.amber },
  { id: 'perks', iconType: 'perks', label: 'PERKS', color: NEON_COLORS.purple },
  { id: 'resonance', iconType: 'resonance', label: 'RESONANCE', color: NEON_COLORS.purple },
];

const TASKBAR_ICONS: DesktopIconConfig[] = [
  { id: 'files', iconType: 'files', label: 'Files', color: NEON_COLORS.cyan },
  { id: 'schedule', iconType: 'schedule', label: 'Schedule', color: NEON_COLORS.amber },
  { id: 'cub', iconType: 'cub', label: 'Cub', color: NEON_COLORS.pink },
  { id: 'settings', iconType: 'settings', label: 'Settings', color: NEON_COLORS.amber },
];

const HIDDEN_APPS: DesktopIconConfig[] = [
  { id: 'academy', iconType: 'academy', label: 'The Academy', color: NEON_COLORS.green },
  { id: 'calculator', iconType: 'calculator', label: 'Calculator', color: NEON_COLORS.green },
  { id: 'notepad', iconType: 'notepad', label: 'Notepad', color: NEON_COLORS.green },
];

export function getNeoCrtIcon(iconType: IconType, size: number = 24, color: string = NEON_COLORS.green): ReactNode {
  const props = { size, strokeWidth: 1.5, color };
  switch (iconType) {
    case 'personal': return <User {...props} />;
    case 'email': return <Mail {...props} />;
    case 'messages': return <MessageCircle {...props} />;
    case 'academy': return <Gamepad2 {...props} />;
    case 'files': 
    case 'folder': return <FolderOpen {...props} />;
    case 'notepad':
    case 'file': return <FileText {...props} />;
    case 'calculator': return <CalcIcon {...props} />;
    case 'recycle': return <Trash2 {...props} />;
    case 'settings': return <Settings {...props} />;
    case 'search': return <Search {...props} />;
    case 'calendar': return <Calendar {...props} />;
    case 'power': return <Power {...props} />;
    case 'assignments': return <BookOpen {...props} />;
    case 'perks': return <Star {...props} />;
    case 'resonance': return <Activity {...props} />;
    case 'schedule': return <Clock {...props} />;
    case 'cub': return <Heart {...props} />;
    default: return <FileText {...props} />;
  }
}

function SidebarIcon({ 
  icon, 
  isSelected, 
  onClick, 
  onDoubleClick 
}: { 
  icon: DesktopIconConfig;
  isSelected: boolean;
  onClick: () => void;
  onDoubleClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      className="neo-crt-sidebar-icon"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        padding: '16px 20px',
        background: isSelected ? 'rgba(0, 255, 0, 0.15)' : 'transparent',
        border: 'none',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{
        filter: `drop-shadow(0 0 8px ${icon.color || NEON_COLORS.green})`,
      }}>
        {getNeoCrtIcon(icon.iconType, 32, icon.color || NEON_COLORS.green)}
      </div>
      <span style={{
        color: icon.color || NEON_COLORS.green,
        fontFamily: '"Press Start 2P", "Courier New", monospace',
        fontSize: '10px',
        fontWeight: 'bold',
        letterSpacing: '1px',
        textShadow: `0 0 10px ${icon.color || NEON_COLORS.green}`,
      }}>
        {icon.label}
      </span>
    </button>
  );
}

function TaskbarIcon({ 
  icon, 
  onClick 
}: { 
  icon: DesktopIconConfig;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="neo-crt-taskbar-icon"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '10px 14px',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{
        filter: `drop-shadow(0 0 6px ${icon.color || NEON_COLORS.green})`,
      }}>
        {getNeoCrtIcon(icon.iconType, 24, icon.color || NEON_COLORS.green)}
      </div>
    </button>
  );
}

function CubMascot({ mood = 'thinking' }: { mood?: 'idle' | 'thinking' | 'happy' | 'alert' }) {
  return (
    <div style={{
      position: 'relative',
      width: '280px',
      height: '280px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        border: `3px solid ${NEON_COLORS.green}`,
        borderRadius: '50%',
        boxShadow: `0 0 30px ${NEON_COLORS.green}40, inset 0 0 20px ${NEON_COLORS.green}20`,
        animation: 'pulse-glow 3s ease-in-out infinite',
      }} />
      
      <div style={{
        width: '90%',
        height: '90%',
        borderRadius: '50%',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <img
          src={bearMascot}
          alt="Cub - Academy Mascot"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: `
              brightness(1.1)
              contrast(1.2)
              drop-shadow(0 0 20px ${NEON_COLORS.green})
              drop-shadow(0 0 40px ${NEON_COLORS.green}66)
            `,
          }}
        />
      </div>
      
      <style>{`
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 30px ${NEON_COLORS.green}40, inset 0 0 20px ${NEON_COLORS.green}20; }
          50% { box-shadow: 0 0 50px ${NEON_COLORS.green}60, inset 0 0 30px ${NEON_COLORS.green}30; }
        }
      `}</style>
    </div>
  );
}

export default function NeoCrtDesktopShell() {
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [focusedWindowId, setFocusedWindowId] = useState<string | null>(null);
  const [nextZIndex, setNextZIndex] = useState(1);
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);

  const getAppComponent = (appId: string): { component: React.ReactNode; title: string; width: number; height: number } => {
    switch (appId) {
      case 'academy':
        return { component: <Home />, title: 'The Academy', width: 900, height: 650 };
      case 'personal':
        return { 
          component: <div style={{ padding: '20px', color: NEON_COLORS.green, fontFamily: 'monospace' }}>
            <h2 style={{ borderBottom: `1px solid ${NEON_COLORS.green}40`, paddingBottom: '10px' }}>STUDENT PROFILE</h2>
            <p style={{ opacity: 0.7 }}>Access your personal records and settings.</p>
            <p style={{ marginTop: '20px' }}>Double-click The Academy icon to begin your adventure.</p>
          </div>, 
          title: 'Personal', 
          width: 400, 
          height: 300 
        };
      case 'email':
        return { 
          component: <div style={{ padding: '20px', color: NEON_COLORS.cyan, fontFamily: 'monospace' }}>
            <h2 style={{ borderBottom: `1px solid ${NEON_COLORS.cyan}40`, paddingBottom: '10px' }}>E-MAIL SYSTEM</h2>
            <p style={{ opacity: 0.7 }}>No new messages.</p>
            <p style={{ marginTop: '20px', fontSize: '12px' }}>Academy mail server is operational.</p>
          </div>, 
          title: 'E-Mail', 
          width: 450, 
          height: 350 
        };
      case 'messages':
        return { 
          component: <div style={{ padding: '20px', color: NEON_COLORS.green, fontFamily: 'monospace' }}>
            <h2 style={{ borderBottom: `1px solid ${NEON_COLORS.green}40`, paddingBottom: '10px' }}>MESSAGES</h2>
            <p style={{ opacity: 0.7 }}>Direct messaging system.</p>
            <p style={{ marginTop: '20px', fontSize: '12px' }}>Connect with faculty and students.</p>
          </div>, 
          title: 'Messages', 
          width: 400, 
          height: 350 
        };
      case 'calculator':
        return { component: <Calculator />, title: 'Calculator', width: 200, height: 280 };
      case 'notepad':
        return { component: <Notepad />, title: 'Notepad', width: 450, height: 350 };
      case 'files':
        return { component: <FileExplorer onOpenApp={openWindow} />, title: 'Files', width: 500, height: 400 };
      case 'search':
        return { 
          component: <div style={{ padding: '20px', color: NEON_COLORS.amber, fontFamily: 'monospace' }}>
            <h2>SEARCH</h2>
            <p style={{ opacity: 0.7 }}>Search functionality coming soon.</p>
          </div>, 
          title: 'Search', 
          width: 400, 
          height: 300 
        };
      case 'settings':
        return { 
          component: <div style={{ padding: '20px', color: NEON_COLORS.amber, fontFamily: 'monospace' }}>
            <h2>SYSTEM SETTINGS</h2>
            <p style={{ opacity: 0.7 }}>Configure your Academy OS experience.</p>
          </div>, 
          title: 'Settings', 
          width: 450, 
          height: 400 
        };
      case 'calendar':
        return { 
          component: <div style={{ padding: '20px', color: NEON_COLORS.purple, fontFamily: 'monospace' }}>
            <h2>ACADEMY CALENDAR</h2>
            <p style={{ opacity: 0.7 }}>View your class schedule and events.</p>
          </div>, 
          title: 'Calendar', 
          width: 450, 
          height: 400 
        };
      case 'assignments':
        return { component: <AssignmentsPortal />, title: 'Assignments Portal', width: 500, height: 450 };
      case 'perks':
        return { component: <PerksViewer />, title: 'Perks Viewer', width: 550, height: 480 };
      case 'resonance':
        return { component: <ResonanceDashboard />, title: 'Resonance Dashboard', width: 450, height: 520 };
      case 'schedule':
        return { component: <ClassSchedule />, title: 'Class Schedule', width: 480, height: 450 };
      case 'cub':
        return { component: <CubCompanion />, title: 'Cub Companion', width: 350, height: 500 };
      default:
        return { component: <div style={{ padding: '20px' }}>Application not found</div>, title: 'Unknown', width: 300, height: 200 };
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
    const iconConfig = [...SIDEBAR_ICONS, ...TASKBAR_ICONS, ...HIDDEN_APPS].find(i => i.id === appId);
    
    const offsetX = (windows.length % 5) * 30;
    const offsetY = (windows.length % 5) * 30;

    const newWindow: WindowState = {
      id: appId,
      title,
      iconType: iconConfig?.iconType || 'file',
      component,
      x: 200 + offsetX,
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
  }, [windows, nextZIndex]);

  const closeWindow = useCallback((id: string) => {
    setWindows(prev => prev.filter(w => w.id !== id));
    if (focusedWindowId === id) setFocusedWindowId(null);
  }, [focusedWindowId]);

  const minimizeWindow = useCallback((id: string) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, isMinimized: true } : w));
    if (focusedWindowId === id) setFocusedWindowId(null);
  }, [focusedWindowId]);

  const maximizeWindow = useCallback((id: string) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, isMaximized: !w.isMaximized } : w));
  }, []);

  const focusWindow = useCallback((id: string) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, zIndex: nextZIndex } : w));
    setFocusedWindowId(id);
    setNextZIndex(prev => prev + 1);
  }, [nextZIndex]);

  const handleDesktopClick = () => setSelectedIcon(null);

  return (
    <div
      onClick={handleDesktopClick}
      className="neo-crt-desktop"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: '#000000',
        overflow: 'hidden',
        fontFamily: '"Courier New", monospace',
      }}
    >
      <div className="crt-scanlines" />
      <div className="crt-vignette" />

      <div style={{
        position: 'absolute',
        top: '30px',
        left: '30px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        zIndex: 10,
      }}
        onClick={(e) => e.stopPropagation()}
      >
        {SIDEBAR_ICONS.map((icon) => (
          <SidebarIcon
            key={icon.id}
            icon={icon}
            isSelected={selectedIcon === icon.id}
            onClick={() => setSelectedIcon(icon.id)}
            onDoubleClick={() => openWindow(icon.id)}
          />
        ))}
        
        <div style={{ height: '20px' }} />
        
        <div 
          style={{
            position: 'relative',
            padding: '4px',
            border: `2px solid ${NEON_COLORS.green}`,
            borderRadius: '8px',
            background: 'rgba(0, 255, 0, 0.05)',
            boxShadow: `0 0 20px ${NEON_COLORS.green}40, inset 0 0 10px ${NEON_COLORS.green}10`,
            animation: 'pulse-glow 2s ease-in-out infinite',
          }}
        >
          <div style={{
            position: 'absolute',
            top: '-12px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#000',
            padding: '2px 8px',
            fontSize: '8px',
            color: NEON_COLORS.green,
            fontFamily: '"Courier New", monospace',
            letterSpacing: '1px',
            textShadow: `0 0 5px ${NEON_COLORS.green}`,
            whiteSpace: 'nowrap',
          }}>
            START GAME
          </div>
          <SidebarIcon
            icon={{ id: 'academy', iconType: 'academy', label: 'THE ACADEMY', color: NEON_COLORS.green }}
            isSelected={selectedIcon === 'academy'}
            onClick={() => setSelectedIcon('academy')}
            onDoubleClick={() => openWindow('academy')}
          />
        </div>
      </div>

      <div style={{
        position: 'absolute',
        right: '80px',
        top: '50%',
        transform: 'translateY(-60%)',
        zIndex: 5,
      }}>
        <CubMascot mood="thinking" />
      </div>

      <div style={{
        position: 'absolute',
        bottom: '30px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 16px',
        border: `2px solid ${NEON_COLORS.green}`,
        borderRadius: '4px',
        boxShadow: `0 0 20px ${NEON_COLORS.green}30, inset 0 0 10px ${NEON_COLORS.green}10`,
        background: 'rgba(0, 0, 0, 0.8)',
        zIndex: 10,
      }}>
        {TASKBAR_ICONS.map((icon) => (
          <TaskbarIcon
            key={icon.id}
            icon={icon}
            onClick={() => openWindow(icon.id)}
          />
        ))}
        
        <div style={{ width: '200px', height: '1px' }} />
      </div>

      {windows.map((win) => (
        <NeoCrtWindow
          key={win.id}
          id={win.id}
          title={win.title}
          iconType={win.iconType}
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
        </NeoCrtWindow>
      ))}

      <div style={{
        position: 'absolute',
        bottom: '8px',
        right: '16px',
        color: NEON_COLORS.green,
        fontFamily: 'monospace',
        fontSize: '10px',
        opacity: 0.5,
        textShadow: `0 0 5px ${NEON_COLORS.green}`,
        zIndex: 5,
      }}>
        ACADEMY OS v1.0 | [RES: STABLE]
      </div>

      <style>{`
        .crt-scanlines {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 1000;
          background: repeating-linear-gradient(
            0deg,
            rgba(0, 0, 0, 0.15) 0px,
            rgba(0, 0, 0, 0.15) 1px,
            transparent 1px,
            transparent 2px
          );
          opacity: 0.3;
        }
        
        .crt-vignette {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 999;
          background: radial-gradient(
            ellipse at center,
            transparent 0%,
            transparent 60%,
            rgba(0, 0, 0, 0.4) 100%
          );
        }
        
        .neo-crt-sidebar-icon:hover {
          background: rgba(0, 255, 0, 0.1) !important;
        }
        
        .neo-crt-sidebar-icon:hover div {
          transform: scale(1.1);
        }
        
        .neo-crt-taskbar-icon:hover {
          background: rgba(0, 255, 0, 0.15) !important;
        }
        
        .neo-crt-taskbar-icon:hover div {
          transform: scale(1.15);
        }
      `}</style>
    </div>
  );
}
