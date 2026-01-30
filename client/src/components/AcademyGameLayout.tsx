import { useState, useCallback } from 'react';
import { Minus, Plus, PanelLeftClose, PanelLeft, Maximize2, Minimize2, ArrowLeft } from 'lucide-react';
import TerminalInterface from './TerminalInterface';
import { Character } from './CharacterSheet';
import { useCrtTheme } from '@/contexts/CrtThemeContext';
import { 
  PHYSICAL_STATS, 
  MENTAL_STATS, 
  SPIRITUAL_STATS,
  getCategoryTotal,
  mapLegacyStats,
  type FullCharacterStats,
  type StatCategory
} from '@shared/stats';

interface TerminalLine {
  id: string;
  text: string;
  type: 'output' | 'command' | 'system' | 'error';
}

interface AcademyGameLayoutProps {
  character: Character | null;
  terminalLines: TerminalLine[];
  onCommand: (command: string) => void;
  commandHistory: string[];
  statusLine?: string;
  onExit?: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export default function AcademyGameLayout({
  character,
  terminalLines,
  onCommand,
  commandHistory,
  statusLine,
  onExit,
  isFullscreen = false,
  onToggleFullscreen
}: AcademyGameLayoutProps) {
  const { colors } = useCrtTheme();
  const primaryColor = colors.primary;
  const dimmedColor = colors.primaryDim;
  const [showSidebar, setShowSidebar] = useState(true);
  const [textSize, setTextSize] = useState(14);

  const adjustTextSize = useCallback((delta: number) => {
    setTextSize(prev => Math.max(10, Math.min(24, prev + delta)));
  }, []);

  const fullStats: FullCharacterStats | null = character ? (
    ('quickness' in character.stats || 'mathLogic' in character.stats || 'faith' in character.stats)
      ? {
          quickness: character.stats.quickness || 10,
          endurance: character.stats.endurance || 10,
          agility: character.stats.agility || 10,
          speed: character.stats.speed || 10,
          strength: character.stats.strength || 10,
          mathLogic: character.stats.mathLogic || 10,
          linguistic: character.stats.linguistic || 10,
          presence: character.stats.presence || 10,
          fortitude: character.stats.fortitude || 10,
          musicCreative: character.stats.musicCreative || 10,
          faith: character.stats.faith || 5,
          karma: character.stats.karma || 50,
          resonance: character.stats.resonance || 5,
          luck: character.stats.luck || 10,
          chi: character.stats.chi || 10,
          nagual: character.stats.nagual || 0,
          ashe: character.stats.ashe || 0
        }
      : mapLegacyStats(character.stats) as FullCharacterStats
  ) : null;

  const renderStatCategory = (
    title: string, 
    stats: typeof PHYSICAL_STATS, 
    category: StatCategory
  ) => {
    if (!fullStats) return null;
    const total = getCategoryTotal(fullStats, category);
    
    return (
      <div style={{ marginBottom: '12px' }}>
        <div 
          style={{ 
            color: primaryColor, 
            fontSize: '11px', 
            fontWeight: 'bold',
            marginBottom: '4px',
            borderBottom: `1px solid ${primaryColor}40`
          }}
        >
          {title} ({total})
        </div>
        {stats.map(stat => {
          const value = fullStats[stat.id as keyof FullCharacterStats] || 0;
          return (
            <div 
              key={stat.id}
              style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                fontSize: '10px',
                color: dimmedColor,
                padding: '1px 0'
              }}
            >
              <span>{stat.abbreviation}</span>
              <span style={{ color: primaryColor }}>{value}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div 
      style={{ 
        display: 'flex', 
        flexDirection: 'column',
        height: isFullscreen ? '100vh' : '100%', 
        width: isFullscreen ? '100vw' : '100%',
        background: '#000',
        fontFamily: 'monospace',
        position: isFullscreen ? 'fixed' : 'relative',
        top: isFullscreen ? 0 : undefined,
        left: isFullscreen ? 0 : undefined,
        zIndex: isFullscreen ? 9999 : undefined,
      }}
    >
      {onToggleFullscreen && (
        <button
          onClick={onToggleFullscreen}
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            zIndex: 10,
            background: `${primaryColor}15`,
            border: `1px solid ${primaryColor}40`,
            borderRadius: '4px',
            padding: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0.6,
            transition: 'opacity 0.2s ease, background 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '1';
            e.currentTarget.style.background = `${primaryColor}30`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '0.6';
            e.currentTarget.style.background = `${primaryColor}15`;
          }}
        >
          {isFullscreen ? (
            <Minimize2 size={14} color={primaryColor} />
          ) : (
            <Maximize2 size={14} color={primaryColor} />
          )}
        </button>
      )}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
      {showSidebar && character && (
        <div
          style={{
            width: '180px',
            minWidth: '180px',
            background: '#000',
            borderRight: `1px solid ${primaryColor}60`,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              padding: '10px',
              borderBottom: `1px solid ${primaryColor}40`,
              background: `${primaryColor}10`
            }}
          >
            <div style={{ 
              color: primaryColor, 
              fontSize: '13px', 
              fontWeight: 'bold',
              marginBottom: '4px'
            }}>
              {character.name}
            </div>
            <div style={{ 
              color: dimmedColor, 
              fontSize: '10px'
            }}>
              {character.class} {character.subClass && `/ ${character.subClass}`}
            </div>
            {character.faction && (
              <div style={{ 
                color: dimmedColor, 
                fontSize: '9px',
                marginTop: '2px'
              }}>
                {character.faction}
              </div>
            )}
          </div>

          <div
            style={{
              padding: '10px',
              borderBottom: `1px solid ${primaryColor}40`
            }}
          >
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              marginBottom: '4px',
              fontSize: '10px'
            }}>
              <span style={{ color: dimmedColor }}>ENERGY</span>
              <span style={{ color: primaryColor }}>
                {character.energy}/{character.maxEnergy}
              </span>
            </div>
            <div 
              style={{ 
                height: '6px', 
                background: `${primaryColor}20`,
                borderRadius: '3px',
                overflow: 'hidden'
              }}
            >
              <div 
                style={{ 
                  height: '100%', 
                  width: `${(character.energy / character.maxEnergy) * 100}%`,
                  background: primaryColor,
                  transition: 'width 0.3s ease'
                }}
              />
            </div>
          </div>

          <div
            style={{
              padding: '10px',
              borderBottom: `1px solid ${primaryColor}40`,
              fontSize: '10px'
            }}
          >
            <div style={{ 
              color: primaryColor, 
              fontWeight: 'bold',
              marginBottom: '6px',
              fontSize: '11px'
            }}>
              REPUTATION
            </div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              color: dimmedColor,
              marginBottom: '2px'
            }}>
              <span>Faculty</span>
              <span style={{ color: character.reputation.faculty >= 50 ? primaryColor : '#ff6666' }}>
                {character.reputation.faculty}
              </span>
            </div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              color: dimmedColor,
              marginBottom: '2px'
            }}>
              <span>Students</span>
              <span style={{ color: character.reputation.students >= 50 ? primaryColor : '#ff6666' }}>
                {character.reputation.students}
              </span>
            </div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              color: dimmedColor
            }}>
              <span>Mysterious</span>
              <span style={{ color: primaryColor }}>
                {character.reputation.mysterious}
              </span>
            </div>
          </div>

          <div
            style={{
              flex: 1,
              padding: '10px',
              overflowY: 'auto',
              scrollbarWidth: 'thin',
              scrollbarColor: `${primaryColor} transparent`
            }}
          >
            {renderStatCategory('PHYSICAL', PHYSICAL_STATS, 'physical')}
            {renderStatCategory('MENTAL', MENTAL_STATS, 'mental')}
            {renderStatCategory('SPIRITUAL', SPIRITUAL_STATS, 'spiritual')}
          </div>
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '6px 12px',
            background: `${primaryColor}10`,
            borderBottom: `1px solid ${primaryColor}40`
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {onExit && (
              <button
                onClick={onExit}
                data-testid="button-exit-academy"
                style={{
                  background: 'transparent',
                  border: `1px solid ${primaryColor}60`,
                  color: primaryColor,
                  padding: '4px 8px',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '11px',
                  fontFamily: 'monospace'
                }}
                title="Return to Desktop"
              >
                <ArrowLeft size={12} />
                <span>Desktop</span>
              </button>
            )}
            
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              style={{
                background: 'transparent',
                border: 'none',
                color: primaryColor,
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center'
              }}
              title={showSidebar ? 'Hide Stats' : 'Show Stats'}
            >
              {showSidebar ? <PanelLeftClose size={16} /> : <PanelLeft size={16} />}
            </button>
            
            <span style={{ 
              color: primaryColor, 
              fontSize: '12px',
              fontWeight: 'bold',
              fontFamily: 'monospace'
            }}>
              THE ACADEMY
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: dimmedColor, fontSize: '10px' }}>TEXT</span>
            <button
              onClick={() => adjustTextSize(-2)}
              style={{
                background: 'transparent',
                border: `1px solid ${primaryColor}60`,
                color: primaryColor,
                width: '24px',
                height: '24px',
                borderRadius: '2px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Decrease text size"
            >
              <Minus size={12} />
            </button>
            <span style={{ 
              color: primaryColor, 
              fontSize: '11px',
              minWidth: '24px',
              textAlign: 'center'
            }}>
              {textSize}
            </span>
            <button
              onClick={() => adjustTextSize(2)}
              style={{
                background: 'transparent',
                border: `1px solid ${primaryColor}60`,
                color: primaryColor,
                width: '24px',
                height: '24px',
                borderRadius: '2px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Increase text size"
            >
              <Plus size={12} />
            </button>
          </div>
        </div>

        <div 
          style={{ 
            flex: 1, 
            overflow: 'hidden',
            ['--terminal-font-size' as any]: `${textSize}px`
          }}
        >
          <style>{`
            .academy-terminal .terminal-text {
              font-size: ${textSize}px !important;
              line-height: 1.5 !important;
            }
            .academy-terminal input {
              font-size: ${textSize}px !important;
            }
          `}</style>
          <div className="academy-terminal h-full">
            <TerminalInterface
              lines={terminalLines}
              onCommand={onCommand}
              prompt=">"
              statusLine={statusLine}
              enableCrtEffect={true}
              commandHistory={commandHistory}
            />
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
