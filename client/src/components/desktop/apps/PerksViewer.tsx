import { useState } from 'react';
import { Star, Lock, Zap, Shield, Brain, Users, Sparkles } from 'lucide-react';
import { STARTER_PERKS, LEVELUP_PERKS, StarterPerk, LevelUpPerk } from '@shared/perks';
import { useGameState } from '@/contexts/GameStateContext';

type TabType = 'starter' | 'unlocked' | 'available';

const NEON_GREEN = '#00ff00';
const NEON_CYAN = '#00ffff';
const NEON_AMBER = '#ffaa00';
const NEON_PURPLE = '#cc66ff';

const CATEGORY_COLORS: Record<string, string> = {
  combat: '#ff6666',
  social: NEON_CYAN,
  academic: NEON_AMBER,
  survival: '#66ff66',
  mystical: NEON_PURPLE,
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  combat: <Shield size={14} />,
  social: <Users size={14} />,
  academic: <Brain size={14} />,
  survival: <Zap size={14} />,
  mystical: <Sparkles size={14} />,
};

export default function PerksViewer() {
  const { character } = useGameState();
  const [activeTab, setActiveTab] = useState<TabType>('starter');
  const [selectedPerk, setSelectedPerk] = useState<StarterPerk | LevelUpPerk | null>(null);
  
  const unlockedPerkIds = [...character.starterPerks, ...character.unlockedPerks];

  const containerStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    background: '#0a0a0a',
    padding: '16px',
    boxSizing: 'border-box',
    fontFamily: '"Courier New", monospace',
    color: NEON_GREEN,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  };

  const headerStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 'bold',
    marginBottom: '12px',
    textShadow: `0 0 10px ${NEON_GREEN}`,
    borderBottom: `1px solid ${NEON_GREEN}40`,
    paddingBottom: '8px',
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    background: active ? `${NEON_GREEN}20` : 'transparent',
    border: `1px solid ${active ? NEON_GREEN : NEON_GREEN + '40'}`,
    color: NEON_GREEN,
    padding: '6px 10px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: '10px',
    textShadow: active ? `0 0 5px ${NEON_GREEN}` : 'none',
  });

  const perkCardStyle = (isSelected: boolean): React.CSSProperties => ({
    background: isSelected ? `${NEON_GREEN}15` : '#111',
    border: `1px solid ${isSelected ? NEON_GREEN : NEON_GREEN + '30'}`,
    padding: '8px',
    marginBottom: '4px',
    cursor: 'pointer',
    borderRadius: '2px',
    transition: 'all 0.15s ease',
  });

  const renderPerkList = () => {
    let perks: (StarterPerk | LevelUpPerk)[] = [];
    
    if (activeTab === 'starter') {
      perks = STARTER_PERKS;
    } else if (activeTab === 'available') {
      perks = LEVELUP_PERKS.filter(p => !unlockedPerkIds.includes(p.id)).slice(0, 15);
    } else if (activeTab === 'unlocked') {
      const unlockedStarter = STARTER_PERKS.filter(p => character.starterPerks.includes(p.id));
      const unlockedLevelUp = LEVELUP_PERKS.filter(p => character.unlockedPerks.includes(p.id));
      perks = [...unlockedStarter, ...unlockedLevelUp];
    }

    return (
      <div style={{ flex: 1, overflow: 'auto', paddingRight: '8px' }}>
        {perks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: `${NEON_GREEN}60` }}>
            <Lock size={32} style={{ marginBottom: '8px' }} />
            <div>No perks unlocked yet</div>
            <div style={{ fontSize: '10px', marginTop: '4px' }}>Play the game to unlock perks!</div>
          </div>
        ) : (
          perks.map((perk, index) => (
            <div
              key={perk.id || index}
              style={perkCardStyle(selectedPerk?.id === perk.id)}
              onClick={() => setSelectedPerk(perk)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Star size={12} color={NEON_AMBER} />
                <span style={{ fontSize: '11px', fontWeight: 'bold' }}>{perk.name}</span>
              </div>
            </div>
          ))
        )}
      </div>
    );
  };

  const renderPerkDetails = () => {
    if (!selectedPerk) {
      return (
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: `${NEON_GREEN}60`,
          fontSize: '11px',
        }}>
          Select a perk to view details
        </div>
      );
    }

    const category = 'category' in selectedPerk ? selectedPerk.category : 'academic';
    const categoryColor = CATEGORY_COLORS[category] || NEON_GREEN;

    return (
      <div style={{ 
        flex: 1, 
        background: '#111', 
        padding: '12px', 
        border: `1px solid ${NEON_GREEN}40`,
        overflow: 'auto',
      }}>
        <div style={{ 
          fontSize: '13px', 
          fontWeight: 'bold', 
          marginBottom: '8px',
          color: categoryColor,
          textShadow: `0 0 8px ${categoryColor}40`,
        }}>
          {selectedPerk.name}
        </div>

        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '6px', 
          marginBottom: '12px',
          fontSize: '10px',
          color: categoryColor,
        }}>
          {CATEGORY_ICONS[category]}
          <span style={{ textTransform: 'uppercase' }}>{category}</span>
        </div>

        <div style={{ fontSize: '11px', lineHeight: '1.5', marginBottom: '12px' }}>
          {selectedPerk.description}
        </div>

        <div style={{ borderTop: `1px solid ${NEON_GREEN}30`, paddingTop: '10px' }}>
          <div style={{ fontSize: '10px', color: NEON_CYAN, marginBottom: '6px' }}>EFFECTS:</div>
          {selectedPerk.effects.map((effect, i) => (
            <div key={i} style={{ fontSize: '10px', color: `${NEON_GREEN}90`, marginBottom: '4px' }}>
              • {effect.description}
            </div>
          ))}
        </div>

        {'drawbacks' in selectedPerk && selectedPerk.drawbacks && (
          <div style={{ marginTop: '10px', color: '#ff6666', fontSize: '10px' }}>
            DRAWBACK: {selectedPerk.drawbacks}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        [ PERKS VIEWER ]
      </div>

      <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
        <button style={tabStyle(activeTab === 'starter')} onClick={() => setActiveTab('starter')}>
          STARTER
        </button>
        <button style={tabStyle(activeTab === 'unlocked')} onClick={() => setActiveTab('unlocked')}>
          UNLOCKED
        </button>
        <button style={tabStyle(activeTab === 'available')} onClick={() => setActiveTab('available')}>
          AVAILABLE
        </button>
      </div>

      <div style={{ display: 'flex', gap: '12px', flex: 1, minHeight: 0 }}>
        <div style={{ width: '45%', display: 'flex', flexDirection: 'column' }}>
          {renderPerkList()}
        </div>
        <div style={{ width: '55%', display: 'flex', flexDirection: 'column' }}>
          {renderPerkDetails()}
        </div>
      </div>

      <div style={{ 
        marginTop: '12px', 
        padding: '6px', 
        background: '#0f0f0f', 
        fontSize: '9px',
        borderTop: `1px solid ${NEON_GREEN}20`,
        color: `${NEON_GREEN}70`,
      }}>
        Perks are earned every other level. Choose wisely!
      </div>
    </div>
  );
}
