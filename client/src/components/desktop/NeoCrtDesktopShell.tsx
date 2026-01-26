import { useState, useCallback, useEffect, ReactNode } from 'react';
import NeoCrtWindow from './NeoCrtWindow';
import Calculator from './apps/Calculator';
import Notepad from './apps/Notepad';
import FileExplorer from './apps/FileExplorer';
import AssignmentsPortal from './apps/AssignmentsPortal';
import PerksViewer from './apps/PerksViewer';
import ResonanceDashboard from './apps/ResonanceDashboard';
import ClassSchedule from './apps/ClassSchedule';
import CubCompanion from './apps/CubCompanion';
import SettingsApp from './apps/SettingsApp';
import Home from '@/pages/Home';
import { useCrtTheme } from '@/contexts/CrtThemeContext';
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

type ColorKey = 'green' | 'cyan' | 'amber' | 'purple' | 'pink' | 'red';

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
  colorKey: ColorKey;
}

const SIDEBAR_ICONS: DesktopIconConfig[] = [
  { id: 'personal', iconType: 'personal', label: 'PERSONAL', colorKey: 'green' },
  { id: 'email', iconType: 'email', label: 'E-MAIL', colorKey: 'cyan' },
  { id: 'messages', iconType: 'messages', label: 'MESSAGES', colorKey: 'green' },
  { id: 'assignments', iconType: 'assignments', label: 'ASSIGNMENTS', colorKey: 'amber' },
  { id: 'perks', iconType: 'perks', label: 'PERKS', colorKey: 'purple' },
  { id: 'resonance', iconType: 'resonance', label: 'RESONANCE', colorKey: 'purple' },
];

const TASKBAR_ICONS: DesktopIconConfig[] = [
  { id: 'files', iconType: 'files', label: 'Files', colorKey: 'cyan' },
  { id: 'schedule', iconType: 'schedule', label: 'Schedule', colorKey: 'amber' },
  { id: 'cub', iconType: 'cub', label: 'Cub', colorKey: 'pink' },
  { id: 'settings', iconType: 'settings', label: 'Settings', colorKey: 'amber' },
];

const HIDDEN_APPS: DesktopIconConfig[] = [
  { id: 'academy', iconType: 'academy', label: 'The Academy', colorKey: 'green' },
  { id: 'calculator', iconType: 'calculator', label: 'Calculator', colorKey: 'green' },
  { id: 'notepad', iconType: 'notepad', label: 'Notepad', colorKey: 'green' },
];

type AccentColors = Record<ColorKey, string>;

export function getNeoCrtIcon(iconType: IconType, size: number = 24, color: string = '#00ff00'): ReactNode {
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
  onDoubleClick,
  accentColors,
}: { 
  icon: DesktopIconConfig;
  isSelected: boolean;
  onClick: () => void;
  onDoubleClick: () => void;
  accentColors: AccentColors;
}) {
  const color = accentColors[icon.colorKey];
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
        background: isSelected ? `${color}26` : 'transparent',
        border: 'none',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
      }}
    >
      <div style={{
        filter: `drop-shadow(0 0 8px ${color})`,
        transition: 'filter 0.3s ease',
      }}>
        {getNeoCrtIcon(icon.iconType, 32, color)}
      </div>
      <span style={{
        color: color,
        fontFamily: '"Press Start 2P", "Courier New", monospace',
        fontSize: '10px',
        fontWeight: 'bold',
        letterSpacing: '1px',
        textShadow: `0 0 10px ${color}`,
        transition: 'color 0.3s ease, text-shadow 0.3s ease',
      }}>
        {icon.label}
      </span>
    </button>
  );
}

function TaskbarIcon({ 
  icon, 
  onClick,
  accentColors,
}: { 
  icon: DesktopIconConfig;
  onClick: () => void;
  accentColors: AccentColors;
}) {
  const color = accentColors[icon.colorKey];
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
        transition: 'all 0.3s ease',
      }}
    >
      <div style={{
        filter: `drop-shadow(0 0 6px ${color})`,
        transition: 'filter 0.3s ease',
      }}>
        {getNeoCrtIcon(icon.iconType, 24, color)}
      </div>
    </button>
  );
}

function CubMascot({ mood = 'thinking', primaryColor }: { mood?: 'idle' | 'thinking' | 'happy' | 'alert'; primaryColor: string }) {
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
        border: `3px solid ${primaryColor}`,
        borderRadius: '50%',
        boxShadow: `0 0 30px ${primaryColor}40, inset 0 0 20px ${primaryColor}20`,
        animation: 'pulse-glow 3s ease-in-out infinite',
        transition: 'border-color 0.5s ease, box-shadow 0.5s ease',
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
              drop-shadow(0 0 20px ${primaryColor})
              drop-shadow(0 0 40px ${primaryColor}66)
            `,
            transition: 'filter 0.5s ease',
          }}
        />
      </div>
      
    </div>
  );
}

export default function NeoCrtDesktopShell() {
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [focusedWindowId, setFocusedWindowId] = useState<string | null>(null);
  const [nextZIndex, setNextZIndex] = useState(1);
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
  const [viewport, setViewport] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [academyFullscreen, setAcademyFullscreen] = useState(false);
  const { colors, accentColors, modeLabel } = useCrtTheme();

  useEffect(() => {
    const handleResize = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getAppComponent = (appId: string): { component: React.ReactNode; title: string; width: number; height: number } => {
    const sidebarWidth = 120;
    const taskbarHeight = 100;
    const maxWidth = viewport.width - sidebarWidth - 40;
    const maxHeight = viewport.height - taskbarHeight - 40;
    
    switch (appId) {
      case 'academy':
        return { 
          component: <Home />, 
          title: 'The Academy', 
          width: Math.min(900, maxWidth), 
          height: Math.min(650, maxHeight) 
        };
      case 'personal':
        return { 
          component: <div style={{ padding: '20px', color: accentColors.green, fontFamily: 'monospace' }}>
            <h2 style={{ borderBottom: `1px solid ${accentColors.green}40`, paddingBottom: '10px' }}>STUDENT PROFILE</h2>
            <p style={{ opacity: 0.7 }}>Access your personal records and settings.</p>
            <p style={{ marginTop: '20px' }}>Double-click The Academy icon to begin your adventure.</p>
          </div>, 
          title: 'Personal', 
          width: 400, 
          height: 300 
        };
      case 'email':
        return { 
          component: <div style={{ padding: '20px', color: accentColors.cyan, fontFamily: 'monospace' }}>
            <h2 style={{ borderBottom: `1px solid ${accentColors.cyan}40`, paddingBottom: '10px' }}>E-MAIL SYSTEM</h2>
            <p style={{ opacity: 0.7 }}>No new messages.</p>
            <p style={{ marginTop: '20px', fontSize: '12px' }}>Academy mail server is operational.</p>
          </div>, 
          title: 'E-Mail', 
          width: 450, 
          height: 350 
        };
      case 'messages':
        return { 
          component: <div style={{ padding: '20px', color: accentColors.green, fontFamily: 'monospace' }}>
            <h2 style={{ borderBottom: `1px solid ${accentColors.green}40`, paddingBottom: '10px' }}>MESSAGES</h2>
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
          component: <div style={{ padding: '20px', color: accentColors.amber, fontFamily: 'monospace' }}>
            <h2>SEARCH</h2>
            <p style={{ opacity: 0.7 }}>Search functionality coming soon.</p>
          </div>, 
          title: 'Search', 
          width: 400, 
          height: 300 
        };
      case 'settings':
        return { 
          component: <SettingsApp />, 
          title: 'Settings', 
          width: 450, 
          height: 480 
        };
      case 'calendar':
        return { 
          component: <div style={{ padding: '20px', color: accentColors.purple, fontFamily: 'monospace' }}>
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
    if (appId === 'academy') {
      setAcademyFullscreen(true);
      return;
    }

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
    
    const sidebarWidth = 120;
    const taskbarHeight = 80;
    const availableWidth = viewport.width - sidebarWidth;
    const availableHeight = viewport.height - taskbarHeight;
    
    const centerX = sidebarWidth + (availableWidth - width) / 2;
    const centerY = (availableHeight - height) / 2;
    
    const offsetX = (windows.length % 5) * 25;
    const offsetY = (windows.length % 5) * 25;
    
    const x = Math.max(sidebarWidth + 10, Math.min(centerX + offsetX, viewport.width - width - 20));
    const y = Math.max(10, Math.min(centerY + offsetY, viewport.height - height - taskbarHeight - 20));

    const newWindow: WindowState = {
      id: appId,
      title,
      iconType: iconConfig?.iconType || 'file',
      component,
      x,
      y,
      width,
      height,
      isMinimized: false,
      isMaximized: false,
      zIndex: nextZIndex,
    };

    setWindows(prev => [...prev, newWindow]);
    setFocusedWindowId(appId);
    setNextZIndex(prev => prev + 1);
  }, [windows, nextZIndex, viewport]);

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

  if (academyFullscreen) {
    return <Home onExit={() => setAcademyFullscreen(false)} />;
  }

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
        background: colors.background,
        overflow: 'hidden',
        fontFamily: '"Courier New", monospace',
        transition: 'background 0.5s ease',
      }}
    >
      <div className="crt-scanlines" style={{ opacity: colors.scanlineOpacity }} />
      <div className="crt-vignette" />

      <div style={{
        position: 'absolute',
        top: viewport.height < 600 ? '15px' : '30px',
        left: viewport.width < 800 ? '15px' : '30px',
        display: 'flex',
        flexDirection: 'column',
        gap: viewport.height < 600 ? '12px' : '20px',
        zIndex: 10,
        maxHeight: 'calc(100vh - 140px)',
        overflowY: 'auto',
        overflowX: 'hidden',
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
            accentColors={accentColors}
          />
        ))}
        
        <div style={{ height: '20px' }} />
        
        <div 
          style={{
            position: 'relative',
            padding: '4px',
            border: `2px solid ${colors.primary}`,
            borderRadius: '8px',
            background: `${colors.primary}08`,
            boxShadow: `0 0 20px ${colors.primaryGlow}, inset 0 0 10px ${colors.primary}10`,
            animation: 'pulse-glow 2s ease-in-out infinite',
            transition: 'border-color 0.5s ease, box-shadow 0.5s ease',
          }}
        >
          <div style={{
            position: 'absolute',
            top: '-12px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: colors.background,
            padding: '2px 8px',
            fontSize: '8px',
            color: colors.primary,
            fontFamily: '"Courier New", monospace',
            letterSpacing: '1px',
            textShadow: `0 0 5px ${colors.primary}`,
            whiteSpace: 'nowrap',
            transition: 'color 0.5s ease, background 0.5s ease',
          }}>
            START GAME
          </div>
          <SidebarIcon
            icon={{ id: 'academy', iconType: 'academy', label: 'THE ACADEMY', colorKey: 'green' }}
            isSelected={selectedIcon === 'academy'}
            onClick={() => setSelectedIcon('academy')}
            onDoubleClick={() => openWindow('academy')}
            accentColors={accentColors}
          />
        </div>
      </div>

      {viewport.width > 900 && viewport.height > 500 && (
        <div style={{
          position: 'absolute',
          right: viewport.width < 1200 ? '40px' : '80px',
          top: '50%',
          transform: `translateY(-60%) scale(${viewport.width < 1100 ? 0.7 : 1})`,
          transformOrigin: 'center center',
          zIndex: 5,
          transition: 'right 0.3s ease, transform 0.3s ease',
        }}>
          <CubMascot mood="thinking" primaryColor={colors.primary} />
        </div>
      )}

      <div style={{
        position: 'absolute',
        bottom: viewport.height < 600 ? '15px' : '30px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: viewport.width < 600 ? '4px' : '8px',
        padding: viewport.width < 600 ? '6px 10px' : '8px 16px',
        border: `2px solid ${colors.primary}`,
        borderRadius: '4px',
        boxShadow: `0 0 20px ${colors.primaryGlow}, inset 0 0 10px ${colors.primary}10`,
        background: `${colors.background}cc`,
        zIndex: 10,
        transition: 'border-color 0.5s ease, box-shadow 0.5s ease, background 0.5s ease',
      }}>
        {TASKBAR_ICONS.map((icon) => (
          <TaskbarIcon
            key={icon.id}
            icon={icon}
            onClick={() => openWindow(icon.id)}
            accentColors={accentColors}
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
        color: colors.primary,
        fontFamily: 'monospace',
        fontSize: '10px',
        opacity: 0.5,
        textShadow: `0 0 5px ${colors.primary}`,
        zIndex: 5,
        transition: 'color 0.5s ease',
      }}>
        ACADEMY OS v1.0 | {modeLabel.toUpperCase()} | [RES: STABLE]
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
          background: var(--crt-primary-glow, rgba(0, 255, 0, 0.1)) !important;
        }
        
        .neo-crt-sidebar-icon:hover div {
          transform: scale(1.1);
        }
        
        .neo-crt-taskbar-icon:hover {
          background: var(--crt-primary-glow, rgba(0, 255, 0, 0.15)) !important;
        }
        
        .neo-crt-taskbar-icon:hover div {
          transform: scale(1.15);
        }
      `}</style>
    </div>
  );
}
