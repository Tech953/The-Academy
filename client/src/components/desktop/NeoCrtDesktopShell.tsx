import { useState, useCallback, useEffect, useRef, ReactNode, memo, useMemo } from 'react';
import NeoCrtWindow from './NeoCrtWindow';
import Calculator from './apps/Calculator';
import Notepad from './apps/Notepad';
import RecycleBin from './apps/RecycleBin';
import FileExplorer from './apps/FileExplorer';
import AssignmentsPortal from './apps/AssignmentsPortal';
import PerksViewer from './apps/PerksViewer';
import ResonanceDashboard from './apps/ResonanceDashboard';
import ClassSchedule from './apps/ClassSchedule';
import CubCompanion from './apps/CubCompanion';
import SchoolFilesApp from './apps/SchoolFilesApp';
import SettingsApp from './apps/SettingsApp';
import AcademyEmailApp from './apps/AcademyEmailApp';
import MessagesApp from './apps/MessagesApp';
import PersonalProfileApp from './apps/PersonalProfileApp';
import { FileManagerApp } from './apps/FileManagerApp';
import MemoriesApp from './apps/MemoriesApp';
import { ResearchNotebookApp } from './apps/ResearchNotebookApp';
import { SkillGraphApp } from './apps/SkillGraphApp';
import { ProgressDashboardApp } from './apps/ProgressDashboardApp';
import CharacterStatsApp from './apps/CharacterStatsApp';
import StarterPerkFlow from './apps/StarterPerkFlow';
import PersonalFilesApp from './apps/PersonalFilesApp';
import Home from '@/pages/Home';
import { useCrtTheme } from '@/contexts/CrtThemeContext';
import { useNotificationsContext } from '@/contexts/NotificationsContext';
import { useGameState } from '@/contexts/GameStateContext';
import { useI18n } from '@/contexts/I18nContext';
import { AmbientObjects } from './AmbientObjects';
import { WindowSnapZones, useWindowSnap, getSnapDimensions } from './WindowSnapZones';
import { NotificationContainer, useNotifications } from './FuzzyBubbleNotification';
import { performanceManager, getPerformanceClass } from '@/lib/performanceTier';
import { 
  User, Mail, MessageCircle, FolderOpen, Search, Settings, 
  Calendar, Gamepad2, FileText, Calculator as CalcIcon, Trash2, Power,
  BookOpen, Star, Activity, Clock, Heart, Camera, Bell, FolderArchive, FolderHeart,
  Monitor, Terminal, Network, BarChart3, Notebook, Award, Lock
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

export type IconType = 'personal' | 'email' | 'messages' | 'academy' | 'files' | 'notepad' | 'calculator' | 'recycle' | 'settings' | 'search' | 'calendar' | 'power' | 'folder' | 'file' | 'assignments' | 'perks' | 'resonance' | 'schedule' | 'cub' | 'schoolfiles' | 'personalfiles' | 'memories' | 'notifications' | 'skillgraph' | 'notebook' | 'progress' | 'charstats';

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
  labelKey: string;
  colorKey: ColorKey;
}

const GRID_CELL_W = 104;
const GRID_CELL_H = 102;
const GRID_MARGIN_X = 16;
const GRID_MARGIN_Y = 16;
const TASKBAR_RESERVE = 60;
const ICON_W = 92;
const ICON_H = 96;
const DESKTOP_POSITIONS_KEY = 'academy-desktop-positions-v3';

function gridToPixel(col: number, row: number): { x: number; y: number } {
  return {
    x: GRID_MARGIN_X + col * GRID_CELL_W,
    y: GRID_MARGIN_Y + row * GRID_CELL_H,
  };
}

function pixelToGrid(x: number, y: number): { col: number; row: number } {
  return {
    col: Math.max(0, Math.round((x - GRID_MARGIN_X) / GRID_CELL_W)),
    row: Math.max(0, Math.round((y - GRID_MARGIN_Y) / GRID_CELL_H)),
  };
}

function snapPixelToGrid(x: number, y: number, vw: number, vh: number): { x: number; y: number } {
  const { col, row } = pixelToGrid(x, y);
  const maxCol = Math.max(0, Math.floor((vw - GRID_MARGIN_X) / GRID_CELL_W) - 1);
  const maxRow = Math.max(0, Math.floor((vh - TASKBAR_RESERVE - GRID_MARGIN_Y) / GRID_CELL_H) - 1);
  return gridToPixel(Math.min(col, maxCol), Math.min(row, maxRow));
}

interface DesktopIconEntry extends DesktopIconConfig {
  defaultCol: number;
  defaultRow: number;
}

const DESKTOP_ICONS: DesktopIconEntry[] = [
  // Row 0 — Communication (enrollment-gated)
  { id: 'email',        iconType: 'email',        labelKey: 'desktop.email',        colorKey: 'cyan',   defaultCol: 0, defaultRow: 0 },
  { id: 'messages',     iconType: 'messages',     labelKey: 'desktop.messages',     colorKey: 'green',  defaultCol: 1, defaultRow: 0 },
  // Row 1 — Academic core
  { id: 'assignments',  iconType: 'assignments',  labelKey: 'desktop.assignments',  colorKey: 'amber',  defaultCol: 0, defaultRow: 1 },
  { id: 'schedule',     iconType: 'schedule',     labelKey: 'desktop.schedule',     colorKey: 'amber',  defaultCol: 1, defaultRow: 1 },
  { id: 'notebook',     iconType: 'notebook',     labelKey: 'desktop.notebook',     colorKey: 'cyan',   defaultCol: 2, defaultRow: 1 },
  // Row 2 — Progress & skills
  { id: 'progress',     iconType: 'progress',     labelKey: 'desktop.progress',     colorKey: 'green',  defaultCol: 0, defaultRow: 2 },
  { id: 'perks',        iconType: 'perks',        labelKey: 'desktop.perks',        colorKey: 'purple', defaultCol: 1, defaultRow: 2 },
  { id: 'skillgraph',   iconType: 'skillgraph',   labelKey: 'desktop.skillgraph',   colorKey: 'purple', defaultCol: 2, defaultRow: 2 },
  // Row 3 — Mystical & companion
  { id: 'resonance',    iconType: 'resonance',    labelKey: 'desktop.resonance',    colorKey: 'purple', defaultCol: 0, defaultRow: 3 },
  { id: 'cub',          iconType: 'cub',          labelKey: 'desktop.cub',          colorKey: 'pink',   defaultCol: 1, defaultRow: 3 },
  { id: 'charstats',    iconType: 'charstats',    labelKey: 'desktop.charstats',    colorKey: 'purple', defaultCol: 2, defaultRow: 3 },
  // Row 4 — Files & system
  { id: 'schoolfiles',  iconType: 'schoolfiles',  labelKey: 'desktop.schoolfiles',  colorKey: 'cyan',   defaultCol: 0, defaultRow: 4 },
  { id: 'personalfiles',iconType: 'personalfiles',labelKey: 'desktop.personalfiles',colorKey: 'pink',   defaultCol: 1, defaultRow: 4 },
  { id: 'settings',     iconType: 'settings',     labelKey: 'desktop.settings',     colorKey: 'green',  defaultCol: 2, defaultRow: 4 },
  // Row 5 — Game & utility
  { id: 'recycle',      iconType: 'recycle',      labelKey: 'desktop.recycle',      colorKey: 'red',    defaultCol: 0, defaultRow: 5 },
  { id: 'academy',      iconType: 'academy',      labelKey: 'desktop.academy',      colorKey: 'green',  defaultCol: 1, defaultRow: 5 },
];

type WidgetType = 'cub-mascot' | 'photo' | 'sticker' | 'calendar' | 'book-stack' | 'badge';

interface AmbientWidgetDef {
  id: string;
  widgetType: WidgetType;
  defaultCol: number;
  defaultRow: number;
  unlockLevel?: number;
}

const AMBIENT_WIDGETS: AmbientWidgetDef[] = [
  { id: 'w-mascot',   widgetType: 'cub-mascot',  defaultCol: 10, defaultRow: 1 },
  { id: 'w-photo',    widgetType: 'photo',        defaultCol: 9,  defaultRow: 0 },
  { id: 'w-sticker',  widgetType: 'sticker',      defaultCol: 10, defaultRow: 0, unlockLevel: 2 },
  { id: 'w-calendar', widgetType: 'calendar',     defaultCol: 9,  defaultRow: 2 },
  { id: 'w-book',     widgetType: 'book-stack',   defaultCol: 9,  defaultRow: 3, unlockLevel: 3 },
  { id: 'w-badge',    widgetType: 'badge',        defaultCol: 10, defaultRow: 3 },
];

function getDefaultPositions(): Record<string, { x: number; y: number }> {
  const positions: Record<string, { x: number; y: number }> = {};
  DESKTOP_ICONS.forEach(icon => {
    positions[icon.id] = gridToPixel(icon.defaultCol, icon.defaultRow);
  });
  AMBIENT_WIDGETS.forEach(w => {
    positions[w.id] = gridToPixel(w.defaultCol, w.defaultRow);
  });
  return positions;
}

function loadIconPositions(): Record<string, { x: number; y: number }> {
  try {
    const stored = localStorage.getItem(DESKTOP_POSITIONS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const defaults = getDefaultPositions();
      return { ...defaults, ...parsed };
    }
  } catch {/* ignore */}
  return getDefaultPositions();
}

const TASKBAR_QUICK_APPS: DesktopIconConfig[] = [
  { id: 'calculator', iconType: 'calculator', labelKey: 'desktop.calculator', colorKey: 'green' },
  { id: 'notepad',    iconType: 'notepad',    labelKey: 'desktop.notepad',    colorKey: 'cyan'  },
  { id: 'files',      iconType: 'files',      labelKey: 'desktop.files',      colorKey: 'cyan'  },
];

const HIDDEN_APPS: DesktopIconConfig[] = [
  { id: 'personal',      iconType: 'personal',      labelKey: 'desktop.personal',      colorKey: 'green' },
  { id: 'memories',      iconType: 'memories',      labelKey: 'desktop.memories',      colorKey: 'pink'  },
  { id: 'notifications', iconType: 'notifications', labelKey: 'desktop.notifications', colorKey: 'amber' },
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
    case 'skillgraph': return <Network {...props} />;
    case 'notebook': return <Notebook {...props} />;
    case 'progress': return <BarChart3 {...props} />;
    case 'charstats': return <Award {...props} />;
    default: return <FileText {...props} />;
  }
}

const DraggableDesktopIcon = memo(function DraggableDesktopIcon({
  icon,
  position,
  isSelected,
  isDragging = false,
  onMouseDown,
  onOpen,
  accentColors,
  badgeCount = 0,
  label,
  locked = false,
  isAcademy = false,
  primaryColor = '#00ff00',
}: {
  icon: DesktopIconConfig;
  position: { x: number; y: number };
  isSelected: boolean;
  isDragging?: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onOpen: () => void;
  accentColors: AccentColors;
  badgeCount?: number;
  label: string;
  locked?: boolean;
  isAcademy?: boolean;
  primaryColor?: string;
}) {
  const color = locked ? '#444' : accentColors[icon.colorKey];
  const activeColor = accentColors[icon.colorKey];

  return (
    <div
      onMouseDown={onMouseDown}
      onDoubleClick={(e) => { e.stopPropagation(); if (!locked) onOpen(); }}
      title={locked ? `${label} — enroll in a class to unlock` : label}
      data-testid={isAcademy ? 'academy-game-launcher' : undefined}
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        width: ICON_W,
        height: ICON_H,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: '5px',
        padding: '8px 5px 6px',
        background: isSelected ? `${activeColor}18` : 'transparent',
        border: isSelected
          ? `1px solid ${activeColor}50`
          : '1px solid transparent',
        borderRadius: '8px',
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        transition: isDragging ? 'none' : 'left 0.12s ease, top 0.12s ease, background 0.2s ease, opacity 0.2s ease',
        opacity: locked ? 0.5 : isDragging ? 0.72 : 1,
        zIndex: isDragging ? 999 : isSelected ? 20 : 10,
        boxShadow: isDragging ? `0 8px 24px rgba(0,0,0,0.5), 0 0 18px ${color}40` : 'none',
        transform: isDragging ? 'scale(1.06)' : 'scale(1)',
      }}
    >
      <div style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 44,
        height: 44,
        background: locked ? 'transparent' : `${color}12`,
        borderRadius: '11px',
        border: locked ? 'none' : `1px solid ${color}${isAcademy ? '55' : '25'}`,
        boxShadow: locked ? 'none' : `0 0 ${isAcademy ? '18px' : '10px'} ${color}${isAcademy ? '55' : '30'}`,
        transition: 'box-shadow 0.2s ease',
        animation: isAcademy ? 'academy-icon-pulse 2.5s ease-in-out infinite' : undefined,
      }}>
        {getNeoCrtIcon(icon.iconType, 24, color)}
        {!locked && badgeCount > 0 && (
          <div style={{
            position: 'absolute',
            top: '-5px',
            right: '-6px',
            background: accentColors.red,
            color: '#000',
            fontSize: '8px',
            fontWeight: 'bold',
            minWidth: '15px',
            height: '15px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: '"Courier New", monospace',
            boxShadow: `0 0 6px ${accentColors.red}`,
            zIndex: 2,
          }}>
            {badgeCount > 9 ? '9+' : badgeCount}
          </div>
        )}
        {locked && (
          <div style={{ position: 'absolute', bottom: '-4px', right: '-4px', color: '#555' }}>
            <Lock size={9} strokeWidth={2.5} />
          </div>
        )}
      </div>
      <span style={{
        color: locked ? '#555' : color,
        fontFamily: '"Courier New", monospace',
        fontSize: '10px',
        letterSpacing: '0.3px',
        textTransform: 'uppercase',
        textAlign: 'center',
        lineHeight: '1.35',
        maxWidth: ICON_W - 8,
        wordBreak: 'break-word',
        transition: 'color 0.2s ease',
        textShadow: locked ? 'none' : `0 1px 3px rgba(0,0,0,0.9), 0 0 8px ${color}70`,
      }}>
        {label}
      </span>
    </div>
  );
});

const DraggableWidget = memo(function DraggableWidget({
  widget,
  position,
  isDragging = false,
  isSelected = false,
  onMouseDown,
  accentColors,
  primaryColor,
  mascotSrc,
}: {
  widget: AmbientWidgetDef;
  position: { x: number; y: number };
  isDragging?: boolean;
  isSelected?: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  accentColors: AccentColors;
  primaryColor: string;
  mascotSrc?: string;
}) {
  const renderInner = () => {
    switch (widget.widgetType) {
      case 'cub-mascot':
        return (
          <div style={{
            width: ICON_W - 4,
            height: ICON_H - 4,
            borderRadius: '50%',
            border: `2px solid ${primaryColor}80`,
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: `${primaryColor}10`,
            boxShadow: `0 0 12px ${primaryColor}40`,
          }}>
            {mascotSrc ? (
              <img src={mascotSrc} alt="Cub" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: `drop-shadow(0 0 6px ${primaryColor})` }} />
            ) : (
              <Heart size={24} color={primaryColor} />
            )}
          </div>
        );
      case 'photo':
        return (
          <div style={{
            width: 50,
            height: 60,
            background: 'linear-gradient(180deg, #f5f5dc 0%, #e8e4d0 100%)',
            border: '3px solid #fff',
            boxShadow: '2px 2px 8px rgba(0,0,0,0.5)',
            padding: '4px',
            paddingBottom: '12px',
            transform: 'rotate(-5deg)',
          }}>
            <div style={{
              width: '100%',
              height: '70%',
              background: `linear-gradient(135deg, ${accentColors.cyan}40, ${accentColors.purple}40)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Heart size={16} color={accentColors.pink} />
            </div>
          </div>
        );
      case 'sticker':
        return (
          <div style={{ filter: `drop-shadow(0 0 6px ${accentColors.amber})` }}>
            <Star size={36} color={accentColors.amber} fill={accentColors.amber} />
          </div>
        );
      case 'calendar':
        return (
          <div style={{
            width: 44,
            height: 50,
            background: '#1a1a1a',
            border: `1px solid ${accentColors.green}60`,
            borderRadius: '4px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <div style={{ background: accentColors.red, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={8} color="#fff" />
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accentColors.green, fontSize: 18, fontWeight: 'bold', fontFamily: 'monospace' }}>
              {new Date().getDate()}
            </div>
          </div>
        );
      case 'book-stack':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {[accentColors.purple, accentColors.cyan, accentColors.amber].map((color, i) => (
              <div key={i} style={{ width: 40, height: 10, background: color, borderRadius: 2, boxShadow: `0 0 4px ${color}60` }} />
            ))}
          </div>
        );
      case 'badge':
        return (
          <div style={{ filter: `drop-shadow(0 0 8px ${accentColors.purple})` }}>
            <Award size={36} color={accentColors.purple} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      onMouseDown={onMouseDown}
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        width: ICON_W,
        height: ICON_H,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        transition: isDragging ? 'none' : 'left 0.12s ease, top 0.12s ease, opacity 0.2s ease',
        opacity: isDragging ? 0.72 : 0.75,
        zIndex: isDragging ? 999 : isSelected ? 15 : 4,
        transform: isDragging ? 'scale(1.06)' : 'scale(1)',
        filter: isDragging ? 'brightness(1.3)' : 'none',
        boxSizing: 'border-box',
        border: isSelected ? `1px dashed ${primaryColor}40` : '1px solid transparent',
        borderRadius: '8px',
      }}
    >
      {renderInner()}
    </div>
  );
});

const TaskbarIcon = memo(function TaskbarIcon({ 
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
});


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

function NotificationsApp({ accentColors }: { accentColors: AccentColors }) {
  const { notifications, unreadCount, markAsRead, markAllAsRead, dismissNotification, clearAll } = useNotificationsContext();

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'info': return accentColors.cyan;
      case 'warning': return accentColors.amber;
      case 'success': return accentColors.green;
      case 'assignment': return accentColors.purple;
      case 'message': return accentColors.green;
      default: return accentColors.green;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'info': return <MessageCircle size={16} />;
      case 'warning': return <Bell size={16} />;
      case 'success': return <Star size={16} />;
      case 'assignment': return <BookOpen size={16} />;
      case 'message': return <MessageCircle size={16} />;
      default: return <Bell size={16} />;
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
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
        {unreadCount > 0 && (
          <span style={{ 
            fontSize: '11px', 
            background: accentColors.red, 
            color: '#000',
            padding: '2px 8px',
            borderRadius: '10px',
            marginLeft: 'auto'
          }}>
            {unreadCount} new
          </span>
        )}
      </h2>
      
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        marginTop: '12px',
        marginBottom: '15px'
      }}>
        <button
          onClick={markAllAsRead}
          disabled={unreadCount === 0}
          style={{
            padding: '6px 12px',
            fontSize: '10px',
            background: unreadCount > 0 ? `${accentColors.cyan}20` : 'transparent',
            border: `1px solid ${unreadCount > 0 ? accentColors.cyan : accentColors.amber}40`,
            borderRadius: '4px',
            color: unreadCount > 0 ? accentColors.cyan : accentColors.amber,
            cursor: unreadCount > 0 ? 'pointer' : 'default',
            opacity: unreadCount > 0 ? 1 : 0.5,
            fontFamily: 'monospace',
          }}
        >
          Mark All Read
        </button>
        <button
          onClick={clearAll}
          disabled={notifications.length === 0}
          style={{
            padding: '6px 12px',
            fontSize: '10px',
            background: notifications.length > 0 ? `${accentColors.red}20` : 'transparent',
            border: `1px solid ${notifications.length > 0 ? accentColors.red : accentColors.amber}40`,
            borderRadius: '4px',
            color: notifications.length > 0 ? accentColors.red : accentColors.amber,
            cursor: notifications.length > 0 ? 'pointer' : 'default',
            opacity: notifications.length > 0 ? 1 : 0.5,
            fontFamily: 'monospace',
          }}
        >
          Clear All
        </button>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {notifications.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px 20px',
            opacity: 0.5,
            fontSize: '12px'
          }}>
            No notifications
          </div>
        ) : (
          notifications.map((notification) => (
            <div 
              key={notification.id}
              onClick={() => markAsRead(notification.id)}
              style={{ 
                padding: '12px',
                border: `1px solid ${getTypeColor(notification.type)}40`,
                borderLeft: `3px solid ${getTypeColor(notification.type)}`,
                borderRadius: '4px',
                background: notification.read ? 'transparent' : `${getTypeColor(notification.type)}10`,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative',
              }}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  dismissNotification(notification.id);
                }}
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  background: 'transparent',
                  border: 'none',
                  color: accentColors.amber,
                  cursor: 'pointer',
                  opacity: 0.5,
                  padding: '2px',
                  fontSize: '14px',
                  lineHeight: 1,
                }}
                title="Dismiss"
              >
                ×
              </button>
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
                lineHeight: '1.4',
                marginBottom: '4px',
                paddingRight: '20px',
              }}>
                {notification.message}
              </div>
              <div style={{
                fontSize: '9px',
                color: '#555',
                marginTop: '6px',
              }}>
                {formatTimestamp(notification.timestamp)}
                {notification.from && ` · From: ${notification.from}`}
              </div>
            </div>
          ))
        )}
      </div>
      
      <p style={{ marginTop: '20px', fontSize: '10px', opacity: 0.5, textAlign: 'center' }}>
        Click a notification to mark as read
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
  const nextZIndexRef = useRef(100);
  const claimZ = () => { nextZIndexRef.current += 1; return nextZIndexRef.current; };
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
  const [viewport, setViewport] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [academyFullscreen, setAcademyFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { colors, accentColors, modeLabel } = useCrtTheme();
  const { unreadCount: notificationCount } = useNotificationsContext();
  const { unreadEmailCount, unreadMessageCount, isEnrolled, character } = useGameState();
  const { t } = useI18n();
  
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

  const [iconPositions, setIconPositions] = useState<Record<string, { x: number; y: number }>>(loadIconPositions);
  const [dragGhost, setDragGhost] = useState<{ x: number; y: number } | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [hiddenWidgets, setHiddenWidgets] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('academy-hidden-widgets') ?? '[]'); } catch { return []; }
  });
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [showWidgetPanel, setShowWidgetPanel] = useState(false);

  const dragRef = useRef<{
    iconId: string;
    startMouseX: number;
    startMouseY: number;
    startIconX: number;
    startIconY: number;
    originSnappedX: number;
    originSnappedY: number;
    hasMoved: boolean;
  } | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(DESKTOP_POSITIONS_KEY, JSON.stringify(iconPositions));
    } catch {/* ignore */}
  }, [iconPositions]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = e.clientX - dragRef.current.startMouseX;
      const dy = e.clientY - dragRef.current.startMouseY;
      if (!dragRef.current.hasMoved && Math.abs(dx) < 5 && Math.abs(dy) < 5) return;
      dragRef.current.hasMoved = true;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const rawX = dragRef.current.startIconX + dx;
      const rawY = dragRef.current.startIconY + dy;
      const maxX = vw - ICON_W - 4;
      const maxY = vh - ICON_H - TASKBAR_RESERVE;
      const clampedX = Math.max(4, Math.min(maxX, rawX));
      const clampedY = Math.max(4, Math.min(maxY, rawY));
      const id = dragRef.current.iconId;
      setIconPositions(prev => ({ ...prev, [id]: { x: clampedX, y: clampedY } }));
      const snapped = snapPixelToGrid(clampedX, clampedY, vw, vh);
      setDragGhost(snapped);
    };
    const handleMouseUp = () => {
      if (!dragRef.current) return;
      if (!dragRef.current.hasMoved) {
        setSelectedIcon(dragRef.current.iconId);
        dragRef.current = null;
        setDraggingId(null);
        setDragGhost(null);
        return;
      }
      const id = dragRef.current.iconId;
      const originX = dragRef.current.originSnappedX;
      const originY = dragRef.current.originSnappedY;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      setIconPositions(prev => {
        const curPos = prev[id] ?? { x: 20, y: 20 };
        const snapped = snapPixelToGrid(curPos.x, curPos.y, vw, vh);
        const targetCell = pixelToGrid(snapped.x, snapped.y);
        const occupant = Object.entries(prev).find(([otherId, pos]) => {
          if (otherId === id) return false;
          const cell = pixelToGrid(pos.x, pos.y);
          return cell.col === targetCell.col && cell.row === targetCell.row;
        });
        const next = { ...prev, [id]: snapped };
        if (occupant) {
          const [occupantId] = occupant;
          next[occupantId] = { x: originX, y: originY };
        }
        return next;
      });
      dragRef.current = null;
      setDraggingId(null);
      setDragGhost(null);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleIconMouseDown = useCallback((e: React.MouseEvent, iconId: string) => {
    e.stopPropagation();
    e.preventDefault();
    const pos = iconPositions[iconId] ?? { x: 20, y: 20 };
    const snappedOrigin = snapPixelToGrid(pos.x, pos.y, window.innerWidth, window.innerHeight);
    dragRef.current = {
      iconId,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startIconX: pos.x,
      startIconY: pos.y,
      originSnappedX: snappedOrigin.x,
      originSnappedY: snappedOrigin.y,
      hasMoved: false,
    };
    setDraggingId(iconId);
  }, [iconPositions]);

  const resetIconLayout = useCallback(() => {
    const vw = viewport.width;
    const vh = viewport.height;
    const positions: Record<string, { x: number; y: number }> = {};
    DESKTOP_ICONS.forEach(icon => {
      const raw = gridToPixel(icon.defaultCol, icon.defaultRow);
      positions[icon.id] = snapPixelToGrid(raw.x, raw.y, vw, vh);
    });
    AMBIENT_WIDGETS.forEach(w => {
      const raw = gridToPixel(w.defaultCol, w.defaultRow);
      positions[w.id] = snapPixelToGrid(raw.x, raw.y, vw, vh);
    });
    setIconPositions(positions);
    localStorage.removeItem(DESKTOP_POSITIONS_KEY);
  }, [viewport]);
  
  const toggleUiMode = useCallback(() => {
    const newMode = uiMode === 'legacy' ? 'student' : 'legacy';
    setUiMode(newMode);
    localStorage.setItem('academy-ui-mode', newMode);
    if (newMode === 'legacy') {
      setAcademyFullscreen(true);
    }
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

  useEffect(() => {
    performanceManager.startMonitoring();
    return () => performanceManager.stopMonitoring();
  }, []);

  const getAppComponent = (appId: string, params?: Record<string, unknown>): { component: React.ReactNode; title: string; width: number; height: number; minWidth: number; minHeight: number } => {
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
          component: <PersonalProfileApp />, 
          title: 'Personal Profile', 
          width: 400, 
          height: 500,
          minWidth: 320,
          minHeight: 400
        };
      case 'email':
        return { 
          component: <AcademyEmailApp />, 
          title: t('desktop.window.email'), 
          width: 500, 
          height: 400,
          minWidth: 350,
          minHeight: 300
        };
      case 'messages':
        return { 
          component: <MessagesApp />, 
          title: t('desktop.window.messages'), 
          width: 450, 
          height: 400,
          minWidth: 320,
          minHeight: 300
        };
      case 'calculator':
        return { component: <Calculator />, title: 'Calculator', width: 220, height: 320, minWidth: 180, minHeight: 280 };
      case 'notepad':
      case 'recycle': {
        if (appId === 'recycle') {
          return {
            component: <RecycleBin onRestoreFile={(path, content) => {
              const instanceId = `notepad-restored-${Date.now()}`;
              openWindowWithParams(instanceId, 'notepad', { filePath: path, initialContent: content ?? '', initialFileName: path.split('/').pop() ?? 'Untitled' });
            }} />,
            title: 'Recycle Bin',
            width: 440,
            height: 380,
            minWidth: 320,
            minHeight: 280,
          };
        }
        return {
          component: <Notepad
            initialContent={(params?.initialContent as string) ?? ''}
            initialFileName={(params?.initialFileName as string) ?? 'Untitled'}
            filePath={(params?.filePath as string) ?? ''}
          />,
          title: params?.initialFileName ? `Notepad — ${params.initialFileName as string}` : 'Notepad',
          width: 500,
          height: 380,
          minWidth: 300,
          minHeight: 200,
        };
      }
      case 'files':
        return {
          component: <FileManagerApp windowId={appId} onOpenFile={(filePath, content) => {
            const instanceId = `notepad-${filePath}`;
            const fileName = filePath.split('/').pop() ?? 'Untitled';
            openWindowWithParams(instanceId, 'notepad', { filePath, initialContent: content, initialFileName: fileName });
          }} />,
          title: 'File Manager',
          width: 550,
          height: 420,
          minWidth: 400,
          minHeight: 320,
        };
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
          title: t('desktop.window.settings'), 
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
      case 'skillgraph':
        return { component: <SkillGraphApp windowId="skillgraph" studentId="default-student" />, title: 'Skill Graph', width: 700, height: 550, minWidth: 500, minHeight: 400 };
      case 'notebook':
        return { component: <ResearchNotebookApp windowId="notebook" studentId="default-student" />, title: 'Research Notebook', width: 600, height: 500, minWidth: 450, minHeight: 350 };
      case 'progress':
        return { component: <ProgressDashboardApp windowId="progress" studentId="default-student" />, title: 'Progress Dashboard', width: 650, height: 600, minWidth: 500, minHeight: 450 };
      case 'schedule':
        return { component: <ClassSchedule />, title: 'Class Schedule', width: 480, height: 450, minWidth: 350, minHeight: 300 };
      case 'cub':
        return { component: <CubCompanion />, title: 'Cub Companion', width: 350, height: 500, minWidth: 280, minHeight: 350 };
      case 'schoolfiles':
        return { 
          component: <SchoolFilesApp />, 
          title: 'School Files', 
          width: 500, 
          height: 520,
          minWidth: 360,
          minHeight: 380
        };
      case 'personalfiles':
        return { 
          component: <PersonalFilesApp />, 
          title: 'Personal Files', 
          width: 420, 
          height: 460,
          minWidth: 300,
          minHeight: 320
        };
      case 'memories':
        return { 
          component: <MemoriesApp />, 
          title: 'Academy Chronicle', 
          width: 480, 
          height: 450,
          minWidth: 350,
          minHeight: 350
        };
      case 'charstats':
        return {
          component: <CharacterStatsApp />,
          title: 'Character Stats',
          width: 420,
          height: 580,
          minWidth: 340,
          minHeight: 420,
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

  const openWindowWithParams = useCallback((windowId: string, appId: string, params: Record<string, unknown>) => {
    const existingWindow = windows.find(w => w.id === windowId);
    if (existingWindow) {
      const z = claimZ();
      setWindows(prev => prev.map(w =>
        w.id === windowId ? { ...w, isMinimized: false, zIndex: z } : w
      ));
      setFocusedWindowId(windowId);
      return;
    }
    const { component, title, width, height, minWidth, minHeight } = getAppComponent(appId, params);
    const iconConfig = [...DESKTOP_ICONS, ...TASKBAR_QUICK_APPS, ...HIDDEN_APPS].find(i => i.id === appId);
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
    const z = claimZ();
    setWindows(prev => [...prev, {
      id: windowId, title, iconType: iconConfig?.iconType || 'file', component,
      x, y, width, height, minWidth, minHeight, isMinimized: false, isMaximized: false, zIndex: z,
    }]);
    setFocusedWindowId(windowId);
  }, [windows, viewport]);

  const openWindow = useCallback((appId: string) => {
    if (appId === 'academy') {
      setAcademyFullscreen(true);
      return;
    }

    const existingWindow = windows.find(w => w.id === appId);
    if (existingWindow) {
      const z = claimZ();
      setWindows(prev => prev.map(w => 
        w.id === appId 
          ? { ...w, isMinimized: false, zIndex: z }
          : w
      ));
      setFocusedWindowId(appId);
      return;
    }

    const { component, title, width, height, minWidth, minHeight } = getAppComponent(appId);
    const iconConfig = [...DESKTOP_ICONS, ...TASKBAR_QUICK_APPS, ...HIDDEN_APPS].find(i => i.id === appId);
    
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

    const z = claimZ();
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
      zIndex: z,
    };

    setWindows(prev => [...prev, newWindow]);
    setFocusedWindowId(appId);
  }, [windows, viewport]);

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
    const z = claimZ();
    setWindows(prev => prev.map(w => w.id === id ? { ...w, zIndex: z } : w));
    setFocusedWindowId(id);
  }, []);

  const resizeWindow = useCallback((id: string, width: number, height: number) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, width, height } : w));
  }, []);

  const moveWindow = useCallback((id: string, x: number, y: number) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, x, y } : w));
  }, []);

  const toggleWidgetVisibility = useCallback((widgetId: string) => {
    setHiddenWidgets(prev => {
      const next = prev.includes(widgetId) ? prev.filter(id => id !== widgetId) : [...prev, widgetId];
      localStorage.setItem('academy-hidden-widgets', JSON.stringify(next));
      return next;
    });
  }, []);

  const handleDesktopContextMenu = useCallback((e: React.MouseEvent) => {
    if (uiMode !== 'student') return;
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
    setSelectedIcon(null);
  }, [uiMode]);

  const closeContextMenu = useCallback(() => setContextMenu(null), []);

  const handleDesktopClick = () => {
    setSelectedIcon(null);
    setContextMenu(null);
  };


  return (
    <div
      onClick={handleDesktopClick}
      onContextMenu={handleDesktopContextMenu}
      className={`neo-crt-desktop ${getResonanceClass()} ${getPerformanceClass()}`}
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
      {character.starterPerks.length === 0 && <StarterPerkFlow />}
      <div className="crt-scanlines" style={{ opacity: colors.scanlineOpacity }} />
      <div className="crt-vignette" />
      
      
      
      <WindowSnapZones 
        activeZone={windowSnap.activeZone} 
        visible={windowSnap.showZones} 
      />
      
      <NotificationContainer 
        notifications={notifications} 
        onDismiss={dismissNotification} 
      />

      {uiMode === 'student' && dragGhost && draggingId && (
        <div
          style={{
            position: 'absolute',
            left: dragGhost.x,
            top: dragGhost.y,
            width: ICON_W,
            height: ICON_H,
            border: `1px dashed ${colors.primary}60`,
            borderRadius: '8px',
            background: `${colors.primary}08`,
            pointerEvents: 'none',
            zIndex: 998,
            boxSizing: 'border-box',
          }}
        />
      )}

      {uiMode === 'student' && DESKTOP_ICONS.map((icon) => {
        const pos = iconPositions[icon.id] ?? gridToPixel(0, 0);
        const isLocked = !isEnrolled && (icon.id === 'email' || icon.id === 'messages');
        const isAcademy = icon.id === 'academy';
        const isIconDragging = draggingId === icon.id;
        return (
          <DraggableDesktopIcon
            key={icon.id}
            icon={icon}
            position={pos}
            isSelected={selectedIcon === icon.id}
            isDragging={isIconDragging}
            onMouseDown={(e) => handleIconMouseDown(e, icon.id)}
            onOpen={() => openWindow(icon.id)}
            accentColors={accentColors}
            badgeCount={
              icon.id === 'email' ? unreadEmailCount :
              icon.id === 'messages' ? unreadMessageCount : 0
            }
            label={t(icon.labelKey)}
            locked={isLocked}
            isAcademy={isAcademy}
            primaryColor={colors.primary}
          />
        );
      })}

      {uiMode === 'student' && viewport.width > 900 && AMBIENT_WIDGETS.map((widget) => {
        if (widget.unlockLevel && widget.unlockLevel > characterLevel) return null;
        if (hiddenWidgets.includes(widget.id)) return null;
        const pos = iconPositions[widget.id] ?? gridToPixel(widget.defaultCol, widget.defaultRow);
        return (
          <DraggableWidget
            key={widget.id}
            widget={widget}
            position={pos}
            isDragging={draggingId === widget.id}
            isSelected={selectedIcon === widget.id}
            onMouseDown={(e) => handleIconMouseDown(e, widget.id)}
            accentColors={accentColors}
            primaryColor={colors.primary}
            mascotSrc={widget.widgetType === 'cub-mascot' ? bearMascot : undefined}
          />
        );
      })}

      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: viewport.width < 600 ? '4px' : '8px',
        padding: viewport.width < 600 ? '5px 10px' : '6px 20px',
        borderTop: `1px solid ${colors.primary}60`,
        boxShadow: `0 -4px 24px ${colors.primary}18, inset 0 1px 0 ${colors.primary}30`,
        background: `${colors.background}f0`,
        zIndex: 10,
        height: `${TASKBAR_RESERVE}px`,
        boxSizing: 'border-box',
        transition: 'border-color 0.5s ease, box-shadow 0.5s ease, background 0.5s ease',
      }}>
        {TASKBAR_QUICK_APPS.map((icon) => (
          <TaskbarIcon
            key={icon.id}
            icon={icon}
            onClick={() => openWindow(icon.id)}
            accentColors={accentColors}
          />
        ))}
        
        <div style={{ width: '1px', height: '24px', background: `${colors.primary}40`, margin: '0 8px' }} />
        
        <button
          onClick={() => openWindow('memories')}
          title="Polaroid Memories"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            padding: '6px 10px',
            background: `${accentColors.pink}15`,
            border: `1px solid ${accentColors.pink}40`,
            borderRadius: '4px',
            cursor: 'pointer',
            color: accentColors.pink,
            transition: 'all 0.3s ease',
          }}
        >
          <Camera size={14} />
          <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{t('desktop.taskbar.memories')}</span>
        </button>
        
        {uiMode === 'student' && (
          <>
            <div style={{ width: '1px', height: '24px', background: `${colors.primary}40`, margin: '0 8px' }} />
            <button
              onClick={resetIconLayout}
              title="Reset icon positions to default layout"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                padding: '6px 10px',
                background: 'transparent',
                border: `1px solid ${colors.primary}30`,
                borderRadius: '4px',
                cursor: 'pointer',
                color: `${colors.primary}80`,
                transition: 'all 0.2s ease',
                fontFamily: '"Courier New", monospace',
              }}
            >
              <Search size={12} />
              <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Reset Layout</span>
            </button>
          </>
        )}

        <div style={{ width: '1px', height: '24px', background: `${colors.primary}40`, margin: '0 8px' }} />
        
        <button
          onClick={toggleUiMode}
          title={uiMode === 'legacy' ? t('desktop.taskbar.switchToStudent') : t('desktop.taskbar.switchToLegacy')}
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
          <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
            {uiMode === 'legacy' ? t('desktop.taskbar.legacy') : t('desktop.taskbar.student')}
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

      {/* ── DESKTOP CONTEXT MENU ─────────────────────────────────────────── */}
      {contextMenu && uiMode === 'student' && (
        <div
          onContextMenu={e => e.preventDefault()}
          style={{
            position: 'fixed',
            left: Math.min(contextMenu.x, viewport.width - 200),
            top: Math.min(contextMenu.y, viewport.height - 140),
            zIndex: 99000,
            background: '#0a0a0a',
            border: `1px solid ${colors.primary}60`,
            boxShadow: `0 4px 24px rgba(0,0,0,0.8), 0 0 12px ${colors.primary}20`,
            minWidth: 190,
            fontFamily: '"Courier New", monospace',
          }}
        >
          <div style={{ padding: '4px 10px', fontSize: 9, color: `${colors.primary}60`, letterSpacing: 1, borderBottom: `1px solid ${colors.primary}22` }}>
            ACADEMY OS — DESKTOP
          </div>
          {[
            { label: '◧  Customize Widgets', action: () => { setShowWidgetPanel(true); closeContextMenu(); } },
            { label: '⟳  Reset Icon Layout', action: () => { resetIconLayout(); closeContextMenu(); } },
            { label: `${uiMode === 'student' ? '◉' : '◎'}  Switch to ${uiMode === 'student' ? 'Legacy' : 'Student'} Mode`, action: () => { toggleUiMode(); closeContextMenu(); } },
          ].map(item => (
            <button
              key={item.label}
              onClick={item.action}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                background: 'transparent', border: 'none',
                padding: '8px 14px', cursor: 'pointer',
                fontFamily: '"Courier New", monospace', fontSize: 11,
                color: colors.primary, letterSpacing: 0.5,
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = `${colors.primary}15`; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      {/* ── WIDGET CUSTOMIZATION PANEL ────────────────────────────────────── */}
      {showWidgetPanel && (
        <div
          onClick={e => e.stopPropagation()}
          onContextMenu={e => e.preventDefault()}
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 99500,
            background: '#080808',
            border: `1px solid ${colors.primary}80`,
            boxShadow: `0 0 40px rgba(0,0,0,0.9), 0 0 20px ${colors.primary}20`,
            width: 340,
            fontFamily: '"Courier New", monospace',
          }}
        >
          <div style={{
            padding: '10px 14px', borderBottom: `1px solid ${colors.primary}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 'bold', color: colors.primary, letterSpacing: 1 }}>[ CUSTOMIZE WIDGETS ]</div>
              <div style={{ fontSize: 9, color: `${colors.primary}60`, marginTop: 2 }}>Toggle desktop decorations on/off</div>
            </div>
            <button
              onClick={() => setShowWidgetPanel(false)}
              style={{
                background: 'transparent', border: `1px solid ${colors.primary}40`,
                color: colors.primary, width: 24, height: 24, cursor: 'pointer',
                fontFamily: 'inherit', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >×</button>
          </div>
          <div style={{ padding: '8px' }}>
            {AMBIENT_WIDGETS.map(widget => {
              const isLocked = !!(widget.unlockLevel && widget.unlockLevel > characterLevel);
              const isHidden = hiddenWidgets.includes(widget.id);
              const isVisible = !isHidden && !isLocked;
              const LABELS: Record<string, { name: string; desc: string; icon: string }> = {
                'w-mascot':   { name: 'Academy Mascot',   desc: 'Your loyal bear mascot companion',        icon: '♡' },
                'w-photo':    { name: 'Polaroid Frame',   desc: 'Decorative photo frame on your desktop',  icon: '◻' },
                'w-sticker':  { name: 'Sticker',          desc: 'A decorative sticker for your desktop',   icon: '★' },
                'w-calendar': { name: 'Day Planner',      desc: "Today's date at a glance",                icon: '▦' },
                'w-book':     { name: 'Book Stack',       desc: 'Stack of books decoration',               icon: '▤' },
                'w-badge':    { name: 'Achievement Badge',desc: 'Displays your current rank badge',         icon: '◈' },
              };
              const meta = LABELS[widget.id] ?? { name: widget.widgetType, desc: '', icon: '■' };
              return (
                <div key={widget.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 8px',
                  borderBottom: `1px solid ${colors.primary}15`,
                  opacity: isLocked ? 0.45 : 1,
                }}>
                  <div style={{
                    width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: `1px solid ${colors.primary}30`, fontSize: 16, color: colors.primary,
                    flexShrink: 0,
                  }}>
                    {meta.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, color: colors.primary, fontWeight: 'bold' }}>
                      {meta.name}
                      {isLocked && (
                        <span style={{ fontSize: 9, color: accentColors.amber, marginLeft: 6 }}>
                          [LVL {widget.unlockLevel}]
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 9, color: `${colors.primary}60`, marginTop: 1 }}>{meta.desc}</div>
                  </div>
                  <button
                    onClick={() => !isLocked && toggleWidgetVisibility(widget.id)}
                    disabled={isLocked}
                    title={isLocked ? `Unlocks at Level ${widget.unlockLevel}` : isHidden ? 'Show widget' : 'Hide widget'}
                    style={{
                      background: isVisible ? `${colors.primary}20` : 'transparent',
                      border: `1px solid ${isVisible ? colors.primary : colors.primary + '40'}`,
                      color: isVisible ? colors.primary : `${colors.primary}50`,
                      padding: '4px 10px', cursor: isLocked ? 'not-allowed' : 'pointer',
                      fontFamily: 'inherit', fontSize: 10, letterSpacing: 0.5, flexShrink: 0,
                    }}
                  >
                    {isLocked ? 'LOCKED' : isHidden ? 'SHOW' : 'HIDE'}
                  </button>
                </div>
              );
            })}
          </div>
          <div style={{ padding: '8px 14px', borderTop: `1px solid ${colors.primary}20` }}>
            <button
              onClick={() => { setHiddenWidgets([]); localStorage.removeItem('academy-hidden-widgets'); }}
              style={{
                width: '100%', background: 'transparent', border: `1px solid ${colors.primary}40`,
                color: `${colors.primary}80`, padding: '6px 0', cursor: 'pointer',
                fontFamily: 'inherit', fontSize: 10, letterSpacing: 1,
              }}
            >
              SHOW ALL WIDGETS
            </button>
          </div>
        </div>
      )}

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
