import { useGameState } from '@/contexts/GameStateContext';
import { useI18n } from '@/contexts/I18nContext';
import { User, Star, Zap, Heart, Brain, Shield, Sparkles } from 'lucide-react';

const NEON_GREEN = '#00ff00';
const NEON_CYAN = '#00ffff';
const NEON_AMBER = '#ffaa00';
const NEON_PURPLE = '#cc66ff';

export default function PersonalProfileApp() {
  const { character, cubAffection } = useGameState();
  const { t } = useI18n();

  const containerStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    background: '#0a0a0a',
    fontFamily: '"Courier New", monospace',
    color: NEON_GREEN,
    overflow: 'auto',
    padding: '16px',
    boxSizing: 'border-box',
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

  const sectionStyle: React.CSSProperties = {
    marginBottom: '16px',
    background: `${NEON_GREEN}08`,
    border: `1px solid ${NEON_GREEN}30`,
    padding: '12px',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '10px',
    opacity: 0.6,
    textTransform: 'uppercase' as const,
    marginBottom: '4px',
  };

  const valueStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 'bold',
  };

  const statRowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 0',
    borderBottom: `1px solid ${NEON_GREEN}20`,
  };

  const expPercentage = Math.round((character.experience / character.experienceToNextLevel) * 100);

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <User size={16} />
        <span>{t('desktop.profile.title')}</span>
      </div>

      <div style={sectionStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: `${NEON_GREEN}20`,
            border: `2px solid ${NEON_GREEN}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <User size={32} />
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '4px' }}>
              {character.name}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Star size={14} color={NEON_AMBER} />
              <span style={{ color: NEON_AMBER }}>Level {character.level}</span>
            </div>
            {character.faction && (
              <div style={{ fontSize: '10px', opacity: 0.7, marginTop: '4px' }}>
                {character.faction}
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={sectionStyle}>
        <div style={labelStyle}>Experience Progress</div>
        <div style={{ 
          background: '#111', 
          height: '20px', 
          border: `1px solid ${NEON_GREEN}40`,
          marginBottom: '4px',
        }}>
          <div style={{
            width: `${expPercentage}%`,
            height: '100%',
            background: `linear-gradient(90deg, ${NEON_GREEN}40, ${NEON_GREEN})`,
            boxShadow: `0 0 10px ${NEON_GREEN}`,
          }} />
        </div>
        <div style={{ fontSize: '10px', textAlign: 'right' }}>
          {character.experience} / {character.experienceToNextLevel} XP ({expPercentage}%)
        </div>
      </div>

      <div style={sectionStyle}>
        <div style={labelStyle}>Status</div>
        
        <div style={statRowStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Zap size={14} color={NEON_AMBER} />
            <span>Energy</span>
          </div>
          <span style={{ color: NEON_AMBER }}>
            {character.energy}/{character.maxEnergy}
          </span>
        </div>

        <div style={statRowStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Heart size={14} color={NEON_CYAN} />
            <span>Cub Affection</span>
          </div>
          <span style={{ color: NEON_CYAN }}>
            {cubAffection}%
          </span>
        </div>

        <div style={statRowStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={14} color={NEON_PURPLE} />
            <span>Resonance</span>
          </div>
          <span style={{ 
            color: character.resonanceState === 'stable' ? NEON_GREEN :
                   character.resonanceState === 'unstable' ? NEON_AMBER : '#ff3366',
            textTransform: 'uppercase',
          }}>
            {character.resonanceState}
          </span>
        </div>
      </div>

      <div style={sectionStyle}>
        <div style={labelStyle}>Perks ({character.starterPerks.length + character.unlockedPerks.length})</div>
        {character.starterPerks.length === 0 && character.unlockedPerks.length === 0 ? (
          <div style={{ fontSize: '11px', opacity: 0.5 }}>
            No perks selected yet. Start the game to choose perks!
          </div>
        ) : (
          <div style={{ fontSize: '11px' }}>
            {character.starterPerks.length} starter perks, {character.unlockedPerks.length} unlocked perks
          </div>
        )}
      </div>

      <div style={{ fontSize: '10px', opacity: 0.5, textAlign: 'center', marginTop: '16px' }}>
        Location: {character.currentLocation.toUpperCase()}
      </div>
    </div>
  );
}
