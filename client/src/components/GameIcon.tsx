import { useState, useEffect } from 'react';
import bearImage from '@assets/ChatGPT Image Nov 29, 2025, 01_44_34 AM_1764398698829.png';

export type IconContext = 
  | 'stat'
  | 'perk'
  | 'status'
  | 'reputation'
  | 'item'
  | 'location'
  | 'neutral';

export type StatType = 'strength' | 'intelligence' | 'charisma' | 'endurance' | 'perception' | 'luck';
export type PerkCategory = 'combat' | 'academic' | 'social' | 'survival' | 'mystical';
export type StatusType = 'buff' | 'debuff' | 'neutral' | 'curse' | 'blessing';
export type ReputationType = 'faculty' | 'students' | 'mysterious';

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface GameIconProps {
  context: IconContext;
  subtype?: StatType | PerkCategory | StatusType | ReputationType | string;
  size?: IconSize;
  animated?: boolean;
  showLabel?: boolean;
  label?: string;
  intensity?: 'low' | 'medium' | 'high';
  className?: string;
}

const sizeMap: Record<IconSize, { container: string; icon: number; label: string }> = {
  xs: { container: '24px', icon: 20, label: '8px' },
  sm: { container: '32px', icon: 28, label: '10px' },
  md: { container: '48px', icon: 40, label: '11px' },
  lg: { container: '64px', icon: 56, label: '12px' },
  xl: { container: '96px', icon: 80, label: '14px' },
};

const contextColors: Record<IconContext, string> = {
  stat: '#00ccff',
  perk: '#ffcc00',
  status: '#ff6600',
  reputation: '#cc66ff',
  item: '#66ff66',
  location: '#ff9999',
  neutral: '#00ff00',
};

const statColors: Record<StatType, { primary: string; secondary: string; symbol: string }> = {
  strength: { primary: '#ff4444', secondary: '#ff8888', symbol: 'STR' },
  intelligence: { primary: '#4488ff', secondary: '#88bbff', symbol: 'INT' },
  charisma: { primary: '#ff44ff', secondary: '#ff88ff', symbol: 'CHA' },
  endurance: { primary: '#44ff44', secondary: '#88ff88', symbol: 'END' },
  perception: { primary: '#ffff44', secondary: '#ffff88', symbol: 'PER' },
  luck: { primary: '#44ffff', secondary: '#88ffff', symbol: 'LCK' },
};

const perkColors: Record<PerkCategory, { primary: string; secondary: string }> = {
  combat: { primary: '#ff3333', secondary: '#ff6666' },
  academic: { primary: '#3366ff', secondary: '#6699ff' },
  social: { primary: '#33ff66', secondary: '#66ff99' },
  survival: { primary: '#ffcc33', secondary: '#ffdd66' },
  mystical: { primary: '#9933ff', secondary: '#bb66ff' },
};

const statusColors: Record<StatusType, { primary: string; secondary: string; animation: string }> = {
  buff: { primary: '#00ff88', secondary: '#66ffbb', animation: 'pulse' },
  debuff: { primary: '#ff4444', secondary: '#ff8888', animation: 'shake' },
  neutral: { primary: '#888888', secondary: '#aaaaaa', animation: 'none' },
  curse: { primary: '#660066', secondary: '#990099', animation: 'flicker' },
  blessing: { primary: '#ffdd00', secondary: '#ffee66', animation: 'glow' },
};

const reputationColors: Record<ReputationType, { primary: string; secondary: string; icon: string }> = {
  faculty: { primary: '#4466aa', secondary: '#6688cc', icon: 'mortarboard' },
  students: { primary: '#66aa44', secondary: '#88cc66', icon: 'users' },
  mysterious: { primary: '#aa44aa', secondary: '#cc66cc', icon: 'eye' },
};

export default function GameIcon({
  context,
  subtype,
  size = 'md',
  animated = true,
  showLabel = false,
  label,
  intensity = 'medium',
  className = '',
}: GameIconProps) {
  const [animationPhase, setAnimationPhase] = useState(0);

  useEffect(() => {
    if (!animated) return;
    
    const interval = setInterval(() => {
      setAnimationPhase(prev => (prev + 1) % 360);
    }, 50);
    
    return () => clearInterval(interval);
  }, [animated]);

  const sizeConfig = sizeMap[size];
  
  const getColors = () => {
    if (context === 'stat' && subtype) {
      return statColors[subtype as StatType] || { primary: contextColors.stat, secondary: '#88ddff' };
    }
    if (context === 'perk' && subtype) {
      return perkColors[subtype as PerkCategory] || { primary: contextColors.perk, secondary: '#ffdd66' };
    }
    if (context === 'status' && subtype) {
      return statusColors[subtype as StatusType] || { primary: contextColors.status, secondary: '#ff9944' };
    }
    if (context === 'reputation' && subtype) {
      return reputationColors[subtype as ReputationType] || { primary: contextColors.reputation, secondary: '#dd88ff' };
    }
    return { primary: contextColors[context], secondary: '#88ff88' };
  };

  const colors = getColors();
  
  const getGlowIntensity = () => {
    const intensityMap = {
      low: { blur: 5, spread: 2, opacity: 0.3 },
      medium: { blur: 10, spread: 4, opacity: 0.5 },
      high: { blur: 20, spread: 8, opacity: 0.7 },
    };
    return intensityMap[intensity];
  };

  const glowConfig = getGlowIntensity();
  
  const getAnimationStyle = () => {
    if (!animated) return {};
    
    const baseTransform = `rotate(${Math.sin(animationPhase * 0.02) * 3}deg)`;
    
    if (context === 'status' && subtype) {
      const statusConfig = statusColors[subtype as StatusType];
      if (statusConfig?.animation === 'shake') {
        return { transform: `${baseTransform} translateX(${Math.sin(animationPhase * 0.1) * 2}px)` };
      }
      if (statusConfig?.animation === 'flicker') {
        return { 
          transform: baseTransform,
          opacity: 0.7 + Math.sin(animationPhase * 0.15) * 0.3 
        };
      }
    }
    
    return { 
      transform: `${baseTransform} scale(${1 + Math.sin(animationPhase * 0.03) * 0.02})` 
    };
  };

  const getOverlaySymbol = () => {
    if (context === 'stat' && subtype) {
      return statColors[subtype as StatType]?.symbol || '';
    }
    if (context === 'reputation' && subtype) {
      const icons: Record<string, string> = {
        faculty: '🎓',
        students: '👥',
        mysterious: '👁',
      };
      return '';
    }
    return '';
  };

  const displayLabel = label || (context === 'stat' && subtype ? 
    (subtype as string).charAt(0).toUpperCase() + (subtype as string).slice(1) : '');

  return (
    <div 
      className={className}
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
      }}
      data-testid={`game-icon-${context}-${subtype || 'default'}`}
    >
      <div
        style={{
          width: sizeConfig.container,
          height: sizeConfig.container,
          borderRadius: '50%',
          border: `2px solid ${colors.primary}`,
          boxShadow: `
            0 0 ${glowConfig.blur}px ${colors.primary},
            0 0 ${glowConfig.blur * 2}px ${colors.secondary},
            inset 0 0 ${glowConfig.blur / 2}px ${colors.primary}
          `,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          background: `radial-gradient(circle at 30% 30%, ${colors.secondary}22, ${colors.primary}11, #000000)`,
          ...getAnimationStyle(),
        }}
      >
        <img
          src={bearImage}
          alt={`${context} icon`}
          style={{
            width: `${sizeConfig.icon}px`,
            height: `${sizeConfig.icon}px`,
            objectFit: 'cover',
            borderRadius: '50%',
            filter: `
              drop-shadow(0 0 ${glowConfig.blur / 2}px ${colors.primary})
              hue-rotate(${context === 'stat' ? getStatHueRotation(subtype as StatType) : 0}deg)
              saturate(${intensity === 'high' ? 1.3 : intensity === 'low' ? 0.8 : 1})
            `,
          }}
        />
        
        {context === 'stat' && subtype && (
          <div
            style={{
              position: 'absolute',
              bottom: '-2px',
              right: '-2px',
              background: colors.primary,
              color: '#000',
              fontSize: size === 'xs' ? '6px' : size === 'sm' ? '7px' : '8px',
              fontFamily: 'monospace',
              fontWeight: 'bold',
              padding: '1px 3px',
              borderRadius: '3px',
              boxShadow: `0 0 4px ${colors.primary}`,
            }}
          >
            {statColors[subtype as StatType]?.symbol}
          </div>
        )}

        {context === 'status' && subtype && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: '50%',
              background: subtype === 'buff' ? 
                `linear-gradient(135deg, transparent 40%, ${colors.primary}44 100%)` :
                subtype === 'debuff' ?
                `linear-gradient(135deg, ${colors.primary}44 0%, transparent 60%)` :
                'transparent',
              pointerEvents: 'none',
            }}
          />
        )}

        {context === 'reputation' && (
          <div
            style={{
              position: 'absolute',
              top: '-4px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: colors.primary,
              boxShadow: `0 0 6px ${colors.primary}`,
            }}
          />
        )}
      </div>

      {showLabel && displayLabel && (
        <span
          style={{
            color: colors.primary,
            fontSize: sizeConfig.label,
            fontFamily: 'monospace',
            fontWeight: 'bold',
            textShadow: `0 0 4px ${colors.primary}`,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          {displayLabel}
        </span>
      )}
    </div>
  );
}

function getStatHueRotation(stat?: StatType): number {
  const rotations: Record<StatType, number> = {
    strength: 0,
    intelligence: 200,
    charisma: 280,
    endurance: 100,
    perception: 50,
    luck: 160,
  };
  return stat ? rotations[stat] : 0;
}

export function StatIcon({ stat, ...props }: Omit<GameIconProps, 'context' | 'subtype'> & { stat: StatType }) {
  return <GameIcon context="stat" subtype={stat} {...props} />;
}

export function PerkIcon({ category, ...props }: Omit<GameIconProps, 'context' | 'subtype'> & { category: PerkCategory }) {
  return <GameIcon context="perk" subtype={category} {...props} />;
}

export function StatusIcon({ status, ...props }: Omit<GameIconProps, 'context' | 'subtype'> & { status: StatusType }) {
  return <GameIcon context="status" subtype={status} {...props} />;
}

export function ReputationIcon({ faction, ...props }: Omit<GameIconProps, 'context' | 'subtype'> & { faction: ReputationType }) {
  return <GameIcon context="reputation" subtype={faction} {...props} />;
}
