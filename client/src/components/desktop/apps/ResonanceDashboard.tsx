import { useState, useEffect } from 'react';
import { Activity, Heart, Zap, Moon, Sun, Sparkles, TrendingUp, TrendingDown } from 'lucide-react';

interface ResonanceData {
  overall: number;
  faith: number;
  karma: number;
  chi: number;
  luck: number;
  resonance: number;
  nagual: number;
  ashe: number;
}

const NEON_GREEN = '#00ff00';
const NEON_CYAN = '#00ffff';
const NEON_AMBER = '#ffaa00';
const NEON_PURPLE = '#cc66ff';
const NEON_PINK = '#ff66cc';

const INITIAL_DATA: ResonanceData = {
  overall: 72,
  faith: 5,
  karma: 50,
  chi: 10,
  luck: 10,
  resonance: 5,
  nagual: 0,
  ashe: 0,
};

export default function ResonanceDashboard() {
  const [data, setData] = useState<ResonanceData>(INITIAL_DATA);
  const [pulse, setPulse] = useState(false);

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

  const karmaStatus = getKarmaLabel(data.karma);

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
            {data.overall}%
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
            {data.karma}/100
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
        
        {renderStatBar('Faith', data.faith, 100, NEON_AMBER, <Sun size={12} />)}
        {renderStatBar('Chi', data.chi, 100, NEON_GREEN, <Zap size={12} />)}
        {renderStatBar('Resonance', data.resonance, 100, NEON_PURPLE, <Activity size={12} />)}
        {renderStatBar('Luck', data.luck, 100, NEON_CYAN, <Sparkles size={12} />)}
        {renderStatBar('Nagual', data.nagual, 100, NEON_PINK, <Moon size={12} />)}
        {renderStatBar('Ashe', data.ashe, 100, NEON_AMBER, <Heart size={12} />)}
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
