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
import { AmbientObjects } from './AmbientObjects';
import { WindowSnapZones, useWindowSnap, getSnapDimensions } from './WindowSnapZones';
import { NotificationContainer, useNotifications } from './FuzzyBubbleNotification';
import { 
  User, Mail, MessageCircle, FolderOpen, Search, Settings, 
  Calendar, Gamepad2, FileText, Calculator as CalcIcon, Trash2, Power,
  BookOpen, Star, Activity, Clock, Heart, Camera, Bell, FolderArchive, FolderHeart,
  Monitor, Terminal
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
  minWidth: number;
  minHeight: number;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
}

export type IconType = 'personal' | 'email' | 'messages' | 'academy' | 'files' | 'notepad' | 'calculator' | 'recycle' | 'settings' | 'search' | 'calendar' | 'power' | 'folder' | 'file' | 'assignments' | 'perks' | 'resonance' | 'schedule' | 'cub' | 'schoolfiles' | 'personalfiles' | 'memories' | 'notifications';

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
  { id: 'schoolfiles', iconType: 'schoolfiles', label: 'SCHOOL FILES', colorKey: 'cyan' },
  { id: 'personalfiles', iconType: 'personalfiles', label: 'PERSONAL FILES', colorKey: 'pink' },
];

const TASKBAR_ICONS: DesktopIconConfig[] = [
  { id: 'schedule', iconType: 'schedule', label: 'Schedule', colorKey: 'amber' },
  { id: 'cub', iconType: 'cub', label: 'Cub', colorKey: 'pink' },
  { id: 'memories', iconType: 'memories', label: 'Memories', colorKey: 'pink' },
  { id: 'settings', iconType: 'settings', label: 'Settings', colorKey: 'amber' },
];

const HIDDEN_APPS: DesktopIconConfig[] = [
  { id: 'academy', iconType: 'academy', label: 'The Academy', colorKey: 'green' },
  { id: 'calculator', iconType: 'calculator', label: 'Calculator', colorKey: 'green' },
  { id: 'notepad', iconType: 'notepad', label: 'Notepad', colorKey: 'green' },
  { id: 'files', iconType: 'files', label: 'Files', colorKey: 'cyan' },
  { id: 'notifications', iconType: 'notifications', label: 'Notifications', colorKey: 'amber' },
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
    case 'schoolfiles': return <FolderArchive {...props} />;
    case 'personalfiles': return <FolderHeart {...props} />;
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
    case 'memories': return <Camera {...props} />;
    case 'notifications': return <Bell {...props} />;
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

interface Memory {
  id: string;
  title: string;
  description: string;
  timestamp: Date;
  type: 'achievement' | 'relationship' | 'discovery' | 'milestone';
}

function MemoriesApp({ accentColors }: { accentColors: AccentColors }) {
  const [memories] = useState<Memory[]>([
    { id: '1', title: 'First Day at The Academy', description: 'Arrived at the gates, unsure what awaited inside...', timestamp: new Date(), type: 'milestone' },
    { id: '2', title: 'Met Cub', description: 'The little polar bear mascot became your guide.', timestamp: new Date(), type: 'relationship' },
    { id: '3', title: 'Library Discovery', description: 'Found a hidden section in the archives.', timestamp: new Date(), type: 'discovery' },
  ]);

  const getTypeColor = (type: Memory['type']) => {
    switch (type) {
      case 'achievement': return accentColors.amber;
      case 'relationship': return accentColors.pink;
      case 'discovery': return accentColors.cyan;
      case 'milestone': return accentColors.green;
      default: return accentColors.green;
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      color: accentColors.pink, 
      fontFamily: 'monospace', 
      height: '100%', 
      overflow: 'auto',
      background: 'linear-gradient(180deg, #0a0a0a 0%, #111 100%)'
    }}>
      <h2 style={{ 
        borderBottom: `1px solid ${accentColors.pink}40`, 
        paddingBottom: '10px', 
        whiteSpace: 'nowrap',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <Camera size={20} />
        POLAROID MEMORIES
      </h2>
      <p style={{ opacity: 0.6, fontSize: '11px', marginTop: '10px' }}>
        Snapshots of your journey at The Academy
      </p>
      
      <div style={{ 
        marginTop: '20px', 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', 
        gap: '15px' 
      }}>
        {memories.map((memory) => (
          <div 
            key={memory.id}
            style={{ 
              background: '#1a1a1a', 
              border: `2px solid ${getTypeColor(memory.type)}40`,
              borderRadius: '4px',
              padding: '12px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: `0 4px 12px ${getTypeColor(memory.type)}20`,
            }}
          >
            <div style={{
              width: '100%',
              height: '80px',
              background: `linear-gradient(135deg, ${getTypeColor(memory.type)}20, transparent)`,
              borderRadius: '2px',
              marginBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `1px solid ${getTypeColor(memory.type)}30`,
            }}>
              <Camera size={24} color={getTypeColor(memory.type)} style={{ opacity: 0.5 }} />
            </div>
            <div style={{ 
              fontSize: '10px', 
              fontWeight: 'bold', 
              color: getTypeColor(memory.type),
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '4px'
            }}>
              {memory.title}
            </div>
            <div style={{ 
              fontSize: '9px', 
              color: '#888',
              lineHeight: '1.3'
            }}>
              {memory.description}
            </div>
          </div>
        ))}
        
        <div style={{ 
          border: `2px dashed ${accentColors.pink}30`,
          borderRadius: '4px',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '130px',
          opacity: 0.5,
          cursor: 'not-allowed'
        }}>
          <Camera size={24} color={accentColors.pink} />
          <span style={{ fontSize: '9px', marginTop: '8px', textAlign: 'center' }}>
            More memories await...
          </span>
        </div>
      </div>
    </div>
  );
}

function NotificationBadge({ count, color }: { count: number; color: string }) {
  if (count === 0) return null;
  return (
    <div style={{
      position: 'absolute',
      top: '-4px',
      right: '-4px',
      minWidth: '16px',
      height: '16px',
      background: color,
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '9px',
      fontWeight: 'bold',
      color: '#000',
      padding: '0 4px',
      boxShadow: `0 0 8px ${color}`,
    }}>
      {count > 9 ? '9+' : count}
    </div>
  );
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'assignment';
  timestamp: Date;
  read: boolean;
}

function NotificationsApp({ accentColors }: { accentColors: AccentColors }) {
  const [notifications] = useState<Notification[]>([
    { id: '1', title: 'Welcome to The Academy', message: 'Your journey begins now. Explore the campus and meet your fellow students.', type: 'info', timestamp: new Date(), read: false },
    { id: '2', title: 'Assignment Due Soon', message: 'Mathematical Reasoning Chapter 1 quiz is due tomorrow.', type: 'assignment', timestamp: new Date(), read: false },
    { id: '3', title: 'New Message', message: 'You have received a message from the Censorium faction.', type: 'info', timestamp: new Date(), read: false },
  ]);

  const getTypeColor = (type: Notification['type']) => {
    switch (type) {
      case 'info': return accentColors.cyan;
      case 'warning': return accentColors.amber;
      case 'success': return accentColors.green;
      case 'assignment': return accentColors.purple;
      default: return accentColors.green;
    }
  };

  const getTypeIcon = (type: Notification['type']) => {
    switch (type) {
      case 'info': return <MessageCircle size={16} />;
      case 'warning': return <Bell size={16} />;
      case 'success': return <Star size={16} />;
      case 'assignment': return <BookOpen size={16} />;
      default: return <Bell size={16} />;
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      color: accentColors.amber, 
      fontFamily: 'monospace', 
      height: '100%', 
      overflow: 'auto',
      background: 'linear-gradient(180deg, #0a0a0a 0%, #111 100%)'
    }}>
      <h2 style={{ 
        borderBottom: `1px solid ${accentColors.amber}40`, 
        paddingBottom: '10px', 
        whiteSpace: 'nowrap',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <Bell size={20} />
        NOTIFICATIONS
        <span style={{ 
          fontSize: '11px', 
          background: accentColors.red, 
          color: '#000',
          padding: '2px 8px',
          borderRadius: '10px',
          marginLeft: 'auto'
        }}>
          {notifications.filter(n => !n.read).length} new
        </span>
      </h2>
      
      <div style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {notifications.map((notification) => (
          <div 
            key={notification.id}
            style={{ 
              padding: '12px',
              border: `1px solid ${getTypeColor(notification.type)}40`,
              borderLeft: `3px solid ${getTypeColor(notification.type)}`,
              borderRadius: '4px',
              background: notification.read ? 'transparent' : `${getTypeColor(notification.type)}10`,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              marginBottom: '6px'
            }}>
              <span style={{ color: getTypeColor(notification.type) }}>
                {getTypeIcon(notification.type)}
              </span>
              <span style={{ 
                fontSize: '11px', 
                fontWeight: 'bold', 
                color: getTypeColor(notification.type),
                flex: 1
              }}>
                {notification.title}
              </span>
              {!notification.read && (
                <span style={{
                  width: '8px',
                  height: '8px',
                  background: accentColors.red,
                  borderRadius: '50%',
                  boxShadow: `0 0 6px ${accentColors.red}`,
                }} />
              )}
            </div>
            <div style={{ 
              fontSize: '10px', 
              color: '#888',
              lineHeight: '1.4'
            }}>
              {notification.message}
            </div>
          </div>
        ))}
      </div>
      
      <p style={{ marginTop: '20px', fontSize: '10px', opacity: 0.5, textAlign: 'center' }}>
        Click a notification to dismiss
      </p>
    </div>
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

export type UiMode = 'legacy' | 'student';

export default function NeoCrtDesktopShell() {
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [focusedWindowId, setFocusedWindowId] = useState<string | null>(null);
  const [nextZIndex, setNextZIndex] = useState(100);
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
  const [viewport, setViewport] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [academyFullscreen, setAcademyFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notificationCount] = useState(3);
  const { colors, accentColors, modeLabel } = useCrtTheme();
  
  const [uiMode, setUiMode] = useState<UiMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('academy-ui-mode');
      if (saved === 'legacy' || saved === 'student') {
        return saved as UiMode;
      }
    }
    return 'student';
  });
  
  const { notifications, addNotification, dismissNotification } = useNotifications();
  const windowSnap = useWindowSnap();
  const [characterLevel] = useState(3);
  const [resonanceState, setResonanceState] = useState<'stable' | 'unstable' | 'critical'>('stable');
  
  const toggleUiMode = useCallback(() => {
    const newMode = uiMode === 'legacy' ? 'student' : 'legacy';
    setUiMode(newMode);
    localStorage.setItem('academy-ui-mode', newMode);
    addNotification({
      type: 'info',
      title: 'UI Mode Changed',
      message: `Switched to ${newMode === 'legacy' ? 'Legacy Terminal' : 'Student Desktop'} mode.`,
    });
  }, [uiMode, addNotification]);
  
  useEffect(() => {
    const handleUiModeChange = (e: CustomEvent) => {
      const newMode = e.detail as UiMode;
      setUiMode(newMode);
    };
    window.addEventListener('ui-mode-change', handleUiModeChange as EventListener);
    return () => window.removeEventListener('ui-mode-change', handleUiModeChange as EventListener);
  }, []);
  
  const getResonanceClass = () => {
    switch (resonanceState) {
      case 'unstable': return 'resonance-unstable';
      case 'critical': return 'resonance-critical';
      default: return '';
    }
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getAppComponent = (appId: string): { component: React.ReactNode; title: string; width: number; height: number; minWidth: number; minHeight: number } => {
    const sidebarWidth = 120;
    const taskbarHeight = 100;
    const maxWidth = viewport.width - sidebarWidth - 40;
    const maxHeight = viewport.height - taskbarHeight - 40;
    
    switch (appId) {
      case 'academy':
        return { 
          component: <Home 
            isFullscreen={academyFullscreen}
            onToggleFullscreen={() => setAcademyFullscreen(prev => !prev)}
          />, 
          title: 'The Academy', 
          width: Math.min(900, maxWidth), 
          height: Math.min(650, maxHeight),
          minWidth: 400,
          minHeight: 300
        };
      case 'personal':
        return { 
          component: <div style={{ padding: '20px', color: accentColors.green, fontFamily: 'monospace', height: '100%', overflow: 'auto' }}>
            <h2 style={{ borderBottom: `1px solid ${accentColors.green}40`, paddingBottom: '10px', whiteSpace: 'nowrap' }}>STUDENT PROFILE</h2>
            <p style={{ opacity: 0.7 }}>Access your personal records and settings.</p>
            <p style={{ marginTop: '20px' }}>Double-click The Academy icon to begin your adventure.</p>
          </div>, 
          title: 'Personal', 
          width: 400, 
          height: 300,
          minWidth: 280,
          minHeight: 180
        };
      case 'email':
        return { 
          component: <div style={{ padding: '20px', color: accentColors.cyan, fontFamily: 'monospace', height: '100%', overflow: 'auto' }}>
            <h2 style={{ borderBottom: `1px solid ${accentColors.cyan}40`, paddingBottom: '10px', whiteSpace: 'nowrap' }}>E-MAIL SYSTEM</h2>
            <p style={{ opacity: 0.7 }}>No new messages.</p>
            <p style={{ marginTop: '20px', fontSize: '12px' }}>Academy mail server is operational.</p>
          </div>, 
          title: 'E-Mail', 
          width: 450, 
          height: 350,
          minWidth: 300,
          minHeight: 200
        };
      case 'messages':
        return { 
          component: <div style={{ padding: '20px', color: accentColors.green, fontFamily: 'monospace', height: '100%', overflow: 'auto' }}>
            <h2 style={{ borderBottom: `1px solid ${accentColors.green}40`, paddingBottom: '10px', whiteSpace: 'nowrap' }}>MESSAGES</h2>
            <p style={{ opacity: 0.7 }}>Direct messaging system.</p>
            <p style={{ marginTop: '20px', fontSize: '12px' }}>Connect with faculty and students.</p>
          </div>, 
          title: 'Messages', 
          width: 400, 
          height: 350,
          minWidth: 280,
          minHeight: 200
        };
      case 'calculator':
        return { component: <Calculator />, title: 'Calculator', width: 220, height: 320, minWidth: 180, minHeight: 280 };
      case 'notepad':
        return { component: <Notepad />, title: 'Notepad', width: 450, height: 350, minWidth: 300, minHeight: 200 };
      case 'files':
        return { component: <FileExplorer onOpenApp={openWindow} />, title: 'Files', width: 500, height: 400, minWidth: 350, minHeight: 280 };
      case 'search':
        return { 
          component: <div style={{ padding: '20px', color: accentColors.amber, fontFamily: 'monospace', height: '100%', overflow: 'auto' }}>
            <h2 style={{ whiteSpace: 'nowrap' }}>SEARCH</h2>
            <p style={{ opacity: 0.7 }}>Search functionality coming soon.</p>
          </div>, 
          title: 'Search', 
          width: 400, 
          height: 300,
          minWidth: 250,
          minHeight: 150
        };
      case 'settings':
        return { 
          component: <SettingsApp />, 
          title: 'Settings', 
          width: 450, 
          height: 480,
          minWidth: 350,
          minHeight: 350
        };
      case 'calendar':
        return { 
          component: <div style={{ padding: '20px', color: accentColors.purple, fontFamily: 'monospace', height: '100%', overflow: 'auto' }}>
            <h2 style={{ whiteSpace: 'nowrap' }}>ACADEMY CALENDAR</h2>
            <p style={{ opacity: 0.7 }}>View your class schedule and events.</p>
          </div>, 
          title: 'Calendar', 
          width: 450, 
          height: 400,
          minWidth: 300,
          minHeight: 200
        };
      case 'assignments':
        return { component: <AssignmentsPortal />, title: 'Assignments Portal', width: 500, height: 450, minWidth: 380, minHeight: 300 };
      case 'perks':
        return { component: <PerksViewer />, title: 'Perks Viewer', width: 550, height: 480, minWidth: 400, minHeight: 350 };
      case 'resonance':
        return { component: <ResonanceDashboard />, title: 'Resonance Dashboard', width: 450, height: 520, minWidth: 350, minHeight: 400 };
      case 'schedule':
        return { component: <ClassSchedule />, title: 'Class Schedule', width: 480, height: 450, minWidth: 350, minHeight: 300 };
      case 'cub':
        return { component: <CubCompanion />, title: 'Cub Companion', width: 350, height: 500, minWidth: 280, minHeight: 350 };
      case 'schoolfiles':
        return { 
          component: <div style={{ padding: '20px', color: accentColors.cyan, fontFamily: 'monospace', height: '100%', overflow: 'auto' }}>
            <h2 style={{ borderBottom: `1px solid ${accentColors.cyan}40`, paddingBottom: '10px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FolderArchive size={20} color={accentColors.cyan} />
              SCHOOL FILES
            </h2>
            <div style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ padding: '8px', border: `1px solid ${accentColors.cyan}40`, borderRadius: '4px', cursor: 'pointer', opacity: 0.8, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FolderOpen size={16} color={accentColors.cyan} /> Textbooks
              </div>
              <div style={{ padding: '8px', border: `1px solid ${accentColors.cyan}40`, borderRadius: '4px', cursor: 'pointer', opacity: 0.8, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FolderOpen size={16} color={accentColors.cyan} /> Lecture Notes
              </div>
              <div style={{ padding: '8px', border: `1px solid ${accentColors.cyan}40`, borderRadius: '4px', cursor: 'pointer', opacity: 0.8, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FolderOpen size={16} color={accentColors.cyan} /> Research Papers
              </div>
              <div style={{ padding: '8px', border: `1px solid ${accentColors.cyan}40`, borderRadius: '4px', cursor: 'pointer', opacity: 0.8, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FolderOpen size={16} color={accentColors.cyan} /> Past Assignments
              </div>
            </div>
            <p style={{ marginTop: '20px', fontSize: '11px', opacity: 0.5 }}>Access your academic materials here.</p>
          </div>, 
          title: 'School Files', 
          width: 400, 
          height: 380,
          minWidth: 280,
          minHeight: 250
        };
      case 'personalfiles':
        return { 
          component: <div style={{ padding: '20px', color: accentColors.pink, fontFamily: 'monospace', height: '100%', overflow: 'auto' }}>
            <h2 style={{ borderBottom: `1px solid ${accentColors.pink}40`, paddingBottom: '10px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FolderHeart size={20} color={accentColors.pink} />
              PERSONAL FILES
            </h2>
            <div style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ padding: '8px', border: `1px solid ${accentColors.pink}40`, borderRadius: '4px', cursor: 'pointer', opacity: 0.8, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={16} color={accentColors.pink} /> Journal Entries
              </div>
              <div style={{ padding: '8px', border: `1px solid ${accentColors.pink}40`, borderRadius: '4px', cursor: 'pointer', opacity: 0.8, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={16} color={accentColors.pink} /> Private Notes
              </div>
              <div style={{ padding: '8px', border: `1px solid ${accentColors.pink}40`, borderRadius: '4px', cursor: 'pointer', opacity: 0.8, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mail size={16} color={accentColors.pink} /> Saved Letters
              </div>
              <div style={{ padding: '8px', border: `1px solid ${accentColors.pink}40`, borderRadius: '4px', cursor: 'pointer', opacity: 0.8, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Heart size={16} color={accentColors.pink} /> Keepsakes
              </div>
            </div>
            <p style={{ marginTop: '20px', fontSize: '11px', opacity: 0.5 }}>Your personal memories and files.</p>
          </div>, 
          title: 'Personal Files', 
          width: 400, 
          height: 380,
          minWidth: 280,
          minHeight: 250
        };
      case 'memories':
        return { 
          component: <MemoriesApp accentColors={accentColors} />, 
          title: 'Polaroid Memories', 
          width: 480, 
          height: 450,
          minWidth: 350,
          minHeight: 350
        };
      case 'notifications':
        return { 
          component: <NotificationsApp accentColors={accentColors} />, 
          title: 'Notifications', 
          width: 380, 
          height: 420,
          minWidth: 300,
          minHeight: 300
        };
      default:
        return { component: <div style={{ padding: '20px' }}>Application not found</div>, title: 'Unknown', width: 300, height: 200, minWidth: 200, minHeight: 150 };
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

    const { component, title, width, height, minWidth, minHeight } = getAppComponent(appId);
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
      minWidth,
      minHeight,
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

  const resizeWindow = useCallback((id: string, width: number, height: number) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, width, height } : w));
  }, []);

  const moveWindow = useCallback((id: string, x: number, y: number) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, x, y } : w));
  }, []);

  const handleDesktopClick = () => setSelectedIcon(null);


  return (
    <div
      onClick={handleDesktopClick}
      className={`neo-crt-desktop ${getResonanceClass()}`}
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
      
      <AmbientObjects characterLevel={characterLevel} />
      
      <WindowSnapZones 
        activeZone={windowSnap.activeZone} 
        visible={windowSnap.showZones} 
      />
      
      <NotificationContainer 
        notifications={notifications} 
        onDismiss={dismissNotification} 
      />

      {uiMode === 'student' && (
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
          <div data-testid="academy-game-launcher">
            <SidebarIcon
              icon={{ id: 'academy', iconType: 'academy', label: 'THE ACADEMY', colorKey: 'green' }}
              isSelected={selectedIcon === 'academy'}
              onClick={() => setSelectedIcon('academy')}
              onDoubleClick={() => openWindow('academy')}
              accentColors={accentColors}
            />
          </div>
        </div>
      </div>
      )}

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
        
        <div style={{ width: '1px', height: '24px', background: `${colors.primary}40`, margin: '0 12px' }} />
        
        <button
          onClick={toggleUiMode}
          title={uiMode === 'legacy' ? 'Switch to Student Mode' : 'Switch to Legacy Mode'}
          className="mode-toggle-option"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '8px 12px',
            background: `${colors.primary}15`,
            border: `1px solid ${colors.primary}40`,
            borderRadius: '4px',
            cursor: 'pointer',
            color: colors.primary,
            transition: 'all 0.3s ease',
          }}
        >
          {uiMode === 'legacy' ? <Terminal size={14} /> : <Monitor size={14} />}
          <span style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {uiMode === 'legacy' ? 'LEGACY' : 'STUDENT'}
          </span>
        </button>
        
        <div style={{ width: '1px', height: '24px', background: `${colors.primary}40`, margin: '0 12px' }} />
        
        <button
          onClick={() => openWindow('notifications')}
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '10px 14px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
          }}
          title="Notifications"
        >
          <div style={{ filter: `drop-shadow(0 0 6px ${accentColors.amber})` }}>
            <Bell size={20} color={accentColors.amber} />
          </div>
          <NotificationBadge count={notificationCount} color={accentColors.red} />
        </button>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          marginLeft: '8px',
          borderLeft: `1px solid ${colors.primary}40`,
        }}>
          <Clock size={16} color={colors.primary} style={{ opacity: 0.7 }} />
          <span style={{
            color: colors.primary,
            fontFamily: '"Courier New", monospace',
            fontSize: '12px',
            letterSpacing: '1px',
            textShadow: `0 0 8px ${colors.primary}`,
          }}>
            {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
          </span>
        </div>
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
          minWidth={win.minWidth}
          minHeight={win.minHeight}
          isMinimized={win.isMinimized || (win.id === 'academy' && academyFullscreen)}
          isMaximized={win.isMaximized}
          isFocused={focusedWindowId === win.id}
          zIndex={win.zIndex}
          resizable={true}
          onClose={() => closeWindow(win.id)}
          onMinimize={() => minimizeWindow(win.id)}
          onMaximize={() => maximizeWindow(win.id)}
          onFocus={() => focusWindow(win.id)}
          onResize={(width, height) => resizeWindow(win.id, width, height)}
          onMove={(x, y) => moveWindow(win.id, x, y)}
          onFullscreen={win.id === 'academy' ? () => setAcademyFullscreen(true) : undefined}
        >
          {win.id === 'academy' ? (
            <Home 
              isFullscreen={false}
              onToggleFullscreen={() => setAcademyFullscreen(true)}
            />
          ) : win.component}
        </NeoCrtWindow>
      ))}

      {academyFullscreen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 9999,
          background: '#000',
        }}>
          <button
            onClick={() => setAcademyFullscreen(false)}
            data-testid="button-exit-fullscreen"
            title="Exit Fullscreen"
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              zIndex: 10000,
              background: 'rgba(0, 255, 0, 0.1)',
              border: `1px solid ${colors.primary}60`,
              borderRadius: '4px',
              padding: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: colors.primary,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="4 14 10 14 10 20" />
              <polyline points="20 10 14 10 14 4" />
              <line x1="14" y1="10" x2="21" y2="3" />
              <line x1="3" y1="21" x2="10" y2="14" />
            </svg>
          </button>
          <Home 
            isFullscreen={true}
            onToggleFullscreen={() => setAcademyFullscreen(false)}
          />
        </div>
      )}

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
