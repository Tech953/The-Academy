import { useMemo } from 'react';
import { useCrtTheme } from '@/contexts/CrtThemeContext';
import { Heart, Star, Award, Calendar } from 'lucide-react';

interface AmbientObject {
  id: string;
  type: 'photo' | 'sticker' | 'calendar' | 'book' | 'badge';
  position: { x: number; y: number };
  rotation: number;
  visible: boolean;
  unlockCondition?: string;
}

interface AmbientObjectsProps {
  characterLevel?: number;
  factionRep?: { [key: string]: number };
  achievements?: string[];
}

const emptyFactionRep: { [key: string]: number } = {};
const emptyAchievements: string[] = [];

export function AmbientObjects({ 
  characterLevel = 1, 
  factionRep, 
  achievements 
}: AmbientObjectsProps) {
  const { accentColors } = useCrtTheme();
  
  const stableFactionRep = factionRep ?? emptyFactionRep;
  const stableAchievements = achievements ?? emptyAchievements;
  
  const hasFactionBadge = useMemo(() => 
    Object.values(stableFactionRep).some(rep => rep >= 25),
    [stableFactionRep]
  );

  const objects = useMemo(() => {
    const baseObjects: AmbientObject[] = [
      { 
        id: 'photo-corner', 
        type: 'photo', 
        position: { x: 10, y: 10 }, 
        rotation: -5, 
        visible: true 
      },
      { 
        id: 'sticker-star', 
        type: 'sticker', 
        position: { x: 85, y: 15 }, 
        rotation: 15, 
        visible: characterLevel >= 2 
      },
      { 
        id: 'calendar', 
        type: 'calendar', 
        position: { x: 5, y: 70 }, 
        rotation: 0, 
        visible: true 
      },
      { 
        id: 'book-stack', 
        type: 'book', 
        position: { x: 90, y: 75 }, 
        rotation: -3, 
        visible: characterLevel >= 3 
      },
      { 
        id: 'faction-badge', 
        type: 'badge', 
        position: { x: 50, y: 5 }, 
        rotation: 0, 
        visible: hasFactionBadge 
      },
    ];

    return baseObjects.filter(obj => obj.visible);
  }, [characterLevel, hasFactionBadge]);

  const renderObject = (obj: AmbientObject) => {
    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      left: `${obj.position.x}%`,
      top: `${obj.position.y}%`,
      transform: `rotate(${obj.rotation}deg)`,
      pointerEvents: 'none',
      opacity: 0.6,
      transition: 'all 0.5s ease',
      zIndex: 1,
    };

    switch (obj.type) {
      case 'photo':
        return (
          <div 
            key={obj.id}
            className="ambient-sway"
            style={{
              ...baseStyle,
              width: '50px',
              height: '60px',
              background: 'linear-gradient(180deg, #f5f5dc 0%, #e8e4d0 100%)',
              border: '3px solid #fff',
              boxShadow: '2px 2px 8px rgba(0,0,0,0.3)',
              padding: '4px',
              paddingBottom: '12px',
            }}
          >
            <div style={{
              width: '100%',
              height: '70%',
              background: `linear-gradient(135deg, ${accentColors.cyan}40, ${accentColors.purple}40)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Heart size={16} color={accentColors.pink} />
            </div>
          </div>
        );

      case 'sticker':
        return (
          <div 
            key={obj.id}
            className="ambient-float"
            style={{
              ...baseStyle,
              fontSize: '24px',
              filter: `drop-shadow(0 0 4px ${accentColors.amber})`,
            }}
          >
            <Star size={28} color={accentColors.amber} fill={accentColors.amber} />
          </div>
        );

      case 'calendar':
        return (
          <div 
            key={obj.id}
            style={{
              ...baseStyle,
              width: '40px',
              height: '45px',
              background: '#1a1a1a',
              border: `1px solid ${accentColors.green}40`,
              borderRadius: '4px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <div style={{
              background: accentColors.red,
              height: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Calendar size={8} color="#fff" />
            </div>
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: accentColors.green,
              fontSize: '16px',
              fontWeight: 'bold',
              fontFamily: 'monospace',
            }}>
              {new Date().getDate()}
            </div>
          </div>
        );

      case 'book':
        return (
          <div 
            key={obj.id}
            className="ambient-sway"
            style={{
              ...baseStyle,
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
            }}
          >
            {[accentColors.purple, accentColors.cyan, accentColors.amber].map((color, i) => (
              <div 
                key={i}
                style={{
                  width: '35px',
                  height: '8px',
                  background: color,
                  borderRadius: '2px',
                  boxShadow: `0 0 4px ${color}40`,
                }}
              />
            ))}
          </div>
        );

      case 'badge':
        return (
          <div 
            key={obj.id}
            className="ambient-float"
            style={{
              ...baseStyle,
              filter: `drop-shadow(0 0 6px ${accentColors.purple})`,
            }}
          >
            <Award size={24} color={accentColors.purple} />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div 
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {objects.map(renderObject)}
    </div>
  );
}
