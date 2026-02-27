import { useState, useEffect } from 'react';
import { Heart, Sparkles, MessageCircle, Star, Coffee, Book, Smile, HelpCircle, Moon, Zap, Brain, LucideIcon } from 'lucide-react';
import bearMascot from '@assets/ChatGPT Image Nov 29, 2025, 01_44_34 AM_1764398698829.png';
import { useGameState } from '@/contexts/GameStateContext';
import { earnMemory } from '@/lib/memoriesStore';

interface CubMood {
  name: string;
  icon: LucideIcon;
  color: string;
  message: string;
}

const MOODS: CubMood[] = [
  { name: 'Happy', icon: Smile, color: '#00ff00', message: 'The Cub is feeling great today!' },
  { name: 'Curious', icon: HelpCircle, color: '#00ffff', message: 'The Cub is curious about your studies.' },
  { name: 'Sleepy', icon: Moon, color: '#cc66ff', message: 'The Cub is a bit tired...' },
  { name: 'Excited', icon: Zap, color: '#ffaa00', message: 'The Cub is excited about your progress!' },
  { name: 'Thoughtful', icon: Brain, color: '#66ffcc', message: 'The Cub is deep in thought.' },
];

const TIPS = [
  "Remember to take breaks while studying!",
  "Your karma affects how NPCs treat you.",
  "Check your assignments regularly to stay on track.",
  "Meditation can boost your spiritual stats.",
  "Some perks have hidden synergies!",
  "Talk to other students to learn secrets.",
  "The library has valuable study materials.",
  "Your resonance level affects mystical events.",
  "Don't forget to eat - energy matters!",
  "Class attendance boosts academic reputation.",
];

const NEON_GREEN = '#00ff00';
const NEON_CYAN = '#00ffff';
const NEON_AMBER = '#ffaa00';
const NEON_PURPLE = '#cc66ff';

export default function CubCompanion() {
  const { cubAffection, setCubAffection } = useGameState();
  const [currentMood, setCurrentMood] = useState<CubMood>(MOODS[0]);
  const [currentTip, setCurrentTip] = useState(TIPS[0]);
  const [isAnimating, setIsAnimating] = useState(false);
  const affection = cubAffection;
  const setAffection = setCubAffection;

  useEffect(() => {
    earnMemory('met_cub');
  }, []);

  useEffect(() => {
    const moodInterval = setInterval(() => {
      setCurrentMood(MOODS[Math.floor(Math.random() * MOODS.length)]);
    }, 30000);

    const tipInterval = setInterval(() => {
      setCurrentTip(TIPS[Math.floor(Math.random() * TIPS.length)]);
    }, 15000);

    return () => {
      clearInterval(moodInterval);
      clearInterval(tipInterval);
    };
  }, []);

  const handlePet = () => {
    setIsAnimating(true);
    setAffection(prev => Math.min(prev + 5, 100));
    setCurrentMood({ ...MOODS[0], message: 'The Cub loves the attention!' });
    setTimeout(() => setIsAnimating(false), 500);
  };

  const handleFeed = () => {
    setIsAnimating(true);
    setAffection(prev => Math.min(prev + 10, 100));
    setCurrentMood({ ...MOODS[3], message: 'Yum! The Cub enjoys the treat!' });
    setTimeout(() => setIsAnimating(false), 500);
  };

  const handleStudy = () => {
    setCurrentMood({ ...MOODS[4], message: 'The Cub is helping you focus!' });
    setCurrentTip(TIPS[Math.floor(Math.random() * TIPS.length)]);
  };

  const containerStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    background: '#0a0a0a',
    padding: '16px',
    boxSizing: 'border-box',
    fontFamily: '"Courier New", monospace',
    color: NEON_GREEN,
    overflow: 'auto',
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
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const buttonStyle: React.CSSProperties = {
    background: '#111',
    border: `1px solid ${NEON_GREEN}60`,
    color: NEON_GREEN,
    padding: '8px 12px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: '10px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flex: 1,
    justifyContent: 'center',
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <Heart size={16} color={NEON_PURPLE} />
        [ CUB COMPANION LINK ]
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'center',
        marginBottom: '16px',
      }}>
        <div style={{
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          border: `3px solid ${currentMood.color}`,
          boxShadow: `0 0 20px ${currentMood.color}60, inset 0 0 20px ${currentMood.color}20`,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#111',
          transform: isAnimating ? 'scale(1.05)' : 'scale(1)',
          transition: 'transform 0.2s ease',
        }}>
          <img 
            src={bearMascot} 
            alt="Polar Cub" 
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover',
              filter: `drop-shadow(0 0 10px ${currentMood.color})`,
            }} 
          />
        </div>
      </div>

      <div style={{
        textAlign: 'center',
        marginBottom: '12px',
      }}>
        <div style={{ 
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '4px',
        }}>
          <currentMood.icon size={24} color={currentMood.color} style={{ filter: `drop-shadow(0 0 6px ${currentMood.color})` }} />
        </div>
        <div style={{ 
          fontSize: '12px', 
          fontWeight: 'bold',
          color: currentMood.color,
          textShadow: `0 0 8px ${currentMood.color}60`,
        }}>
          {currentMood.name}
        </div>
      </div>

      <div style={{
        background: '#111',
        border: `1px solid ${NEON_GREEN}30`,
        padding: '10px',
        marginBottom: '12px',
        fontSize: '11px',
        textAlign: 'center',
      }}>
        {currentMood.message}
      </div>

      <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '4px' }}>
          <span>Affection</span>
          <span style={{ color: NEON_PURPLE }}>{affection}/100</span>
        </div>
        <div style={{
          height: '8px',
          background: '#222',
          borderRadius: '4px',
          overflow: 'hidden',
          border: `1px solid ${NEON_PURPLE}40`,
        }}>
          <div style={{
            width: `${affection}%`,
            height: '100%',
            background: `linear-gradient(90deg, ${NEON_PURPLE}80, ${NEON_PURPLE})`,
            boxShadow: `0 0 10px ${NEON_PURPLE}60`,
            transition: 'width 0.3s ease',
          }} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button style={buttonStyle} onClick={handlePet}>
          <Sparkles size={12} color={NEON_CYAN} />
          PET
        </button>
        <button style={buttonStyle} onClick={handleFeed}>
          <Coffee size={12} color={NEON_AMBER} />
          FEED
        </button>
        <button style={buttonStyle} onClick={handleStudy}>
          <Book size={12} color={NEON_GREEN} />
          STUDY
        </button>
      </div>

      <div style={{
        flex: 1,
        background: '#0f0f0f',
        border: `1px solid ${NEON_CYAN}30`,
        padding: '10px',
        fontSize: '10px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: NEON_CYAN }}>
          <MessageCircle size={12} />
          <span style={{ fontWeight: 'bold' }}>CUB'S TIP:</span>
        </div>
        <div style={{ color: `${NEON_GREEN}90`, lineHeight: '1.5' }}>
          {currentTip}
        </div>
      </div>

      <div style={{
        marginTop: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
        fontSize: '9px',
        color: `${NEON_GREEN}50`,
      }}>
        <Star size={10} color={NEON_AMBER} />
        <span>The Cub is always watching over you</span>
        <Star size={10} color={NEON_AMBER} />
      </div>
    </div>
  );
}
