import { useState, useEffect } from 'react';
import { Activity, Heart, Zap, Moon, Sun, Sparkles, TrendingUp, LucideIcon } from 'lucide-react';
import { SPIRITUAL_STATS, DEFAULT_STATS, FullCharacterStats } from '@shared/stats';

const NEON_GREEN = '#00ff00';
const NEON_CYAN = '#00ffff';
const NEON_AMBER = '#ffaa00';
const NEON_PURPLE = '#cc66ff';
const NEON_PINK = '#ff66cc';

const STAT_ICONS: Record<string, LucideIcon> = {
  faith: Sun,
  karma: Activity,
  resonance: Activity,
  luck: Sparkles,
  chi: Zap,
  nagual: Moon,
  ashe: Heart,
};

const STAT_COLORS: Record<string, string> = {
  faith: NEON_AMBER,
  karma: NEON_GREEN,
  resonance: NEON_PURPLE,
  luck: NEON_CYAN,
  chi: NEON_GREEN,
  nagual: NEON_PINK,
  ashe: NEON_AMBER,
};

interface ResonanceDashboardProps {
  stats?: Partial<FullCharacterStats>;
}

export default function ResonanceDashboard({ stats }: ResonanceDashboardProps) {
  const characterStats: FullCharacterStats = { ...DEFAULT_STATS, ...stats };
  const [pulse, setPulse] = useState(false);
  
  const calculateOverallResonance = (s: FullCharacterStats): number => {
    const spiritualTotal = s.faith + s.karma + s.resonance + s.luck + s.chi + s.nagual + s.ashe;
    const maxSpiritual = 700;
    return Math.round((spiritualTotal / maxSpiritual) * 100);
  };
  
  const overallResonance = calculateOverallResonance(characterStats);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(p => !p);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  const containerStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    background: '#0a0a0a',
    padding: '16px',
    boxSizing: 'border-box',
    fontFamily: '"Courier New", monospace',
    color: NEON_GREEN,
    overflow: 'auto',
  };

  const headerStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 'bold',
    marginBottom: '16px',
    textShadow: `0 0 10px ${NEON_GREEN}`,
    borderBottom: `1px solid ${NEON_GREEN}40`,
    paddingBottom: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const renderStatBar = (label: string, value: number, maxValue: number, color: string, icon: React.ReactNode) => {
    const percentage = Math.min((value / maxValue) * 100, 100);
    
    return (
      <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
            <span style={{ color }}>{icon}</span>
            <span>{label}</span>
          </div>
          <span style={{ color, fontSize: '11px', fontWeight: 'bold' }}>{value}</span>
        </div>
        <div style={{ 
          height: '8px', 
          background: '#222', 
          borderRadius: '2px',
          overflow: 'hidden',
          border: `1px solid ${color}30`,
        }}>
          <div style={{
            width: `${percentage}%`,
            height: '100%',
            background: `linear-gradient(90deg, ${color}80, ${color})`,
            boxShadow: `0 0 10px ${color}60`,
            transition: 'width 0.3s ease',
          }} />
        </div>
      </div>
    );
  };

  const getKarmaLabel = (karma: number) => {
    if (karma >= 75) return { text: 'VIRTUOUS', color: NEON_GREEN };
    if (karma >= 50) return { text: 'NEUTRAL', color: NEON_AMBER };
    if (karma >= 25) return { text: 'TROUBLED', color: '#ff9966' };
    return { text: 'DARK', color: '#ff3366' };
  };

  const karmaStatus = getKarmaLabel(characterStats.karma);

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <Activity 
          size={18} 
          style={{ 
            filter: `drop-shadow(0 0 8px ${NEON_PURPLE})`,
            opacity: pulse ? 1 : 0.7,
            transition: 'opacity 0.3s ease',
          }} 
          color={NEON_PURPLE}
        />
        [ RESONANCE DASHBOARD ]
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px',
        marginBottom: '16px',
      }}>
        <div style={{
          background: '#111',
          border: `1px solid ${NEON_PURPLE}40`,
          padding: '12px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '10px', color: `${NEON_GREEN}80`, marginBottom: '4px' }}>
            OVERALL RESONANCE
          </div>
          <div style={{ 
            fontSize: '28px', 
            fontWeight: 'bold', 
            color: NEON_PURPLE,
            textShadow: `0 0 15px ${NEON_PURPLE}`,
          }}>
            {overallResonance}%
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '4px' }}>
            <TrendingUp size={12} color={NEON_GREEN} />
            <span style={{ fontSize: '9px', color: NEON_GREEN }}>STABLE</span>
          </div>
        </div>

        <div style={{
          background: '#111',
          border: `1px solid ${karmaStatus.color}40`,
          padding: '12px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '10px', color: `${NEON_GREEN}80`, marginBottom: '4px' }}>
            KARMA STATUS
          </div>
          <div style={{ 
            fontSize: '16px', 
            fontWeight: 'bold', 
            color: karmaStatus.color,
            textShadow: `0 0 10px ${karmaStatus.color}60`,
          }}>
            {karmaStatus.text}
          </div>
          <div style={{ fontSize: '20px', color: karmaStatus.color, marginTop: '2px' }}>
            {characterStats.karma}/100
          </div>
        </div>
      </div>

      <div style={{ 
        background: '#111', 
        border: `1px solid ${NEON_GREEN}30`,
        padding: '12px',
        marginBottom: '16px',
      }}>
        <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '12px', color: NEON_CYAN }}>
          SPIRITUAL ATTRIBUTES
        </div>
        
        {SPIRITUAL_STATS.map(stat => {
          const IconComponent = STAT_ICONS[stat.id] || Activity;
          const color = STAT_COLORS[stat.id] || NEON_GREEN;
          const value = characterStats[stat.id as keyof FullCharacterStats] as number;
          return renderStatBar(stat.name, value, 100, color, <IconComponent size={12} />);
        })}
      </div>

      <div style={{ 
        padding: '10px', 
        background: '#0f0f0f', 
        fontSize: '10px',
        border: `1px solid ${NEON_PURPLE}20`,
        lineHeight: '1.5',
      }}>
        <div style={{ color: NEON_PURPLE, marginBottom: '4px' }}>RESONANCE STATUS:</div>
        <div style={{ color: `${NEON_GREEN}80` }}>
          Your spiritual energies are in harmony. Maintain balance through meditation and positive actions.
        </div>
      </div>
    </div>
  );
}
