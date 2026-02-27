import { useState } from 'react';
import { MessageCircle, Zap, Brain, Moon, Smile, HelpCircle, Sparkles, Coffee, BookOpen, Star, Heart, LucideIcon } from 'lucide-react';
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
  { name: 'Happy',      icon: Smile,      color: '#00ff00', message: 'The Cub is feeling great today!' },
  { name: 'Curious',   icon: HelpCircle, color: '#00ffff', message: 'The Cub is curious about your studies.' },
  { name: 'Sleepy',    icon: Moon,       color: '#cc66ff', message: 'The Cub is a bit tired...' },
  { name: 'Excited',   icon: Zap,        color: '#ffaa00', message: 'The Cub is excited about your progress!' },
  { name: 'Thoughtful',icon: Brain,      color: '#66ffcc', message: 'The Cub is deep in thought.' },
];

interface Activity {
  label: string;
  icon: LucideIcon;
  color: string;
  stats: string;
  handler: () => void;
}

const TIPS = [
  { text: 'Take regular breaks — chi recovers faster when rested.',       stat: 'CHI' },
  { text: 'Your karma shapes every NPC interaction around you.',          stat: 'KARMA' },
  { text: 'Completing assignments reinforces your math-logic circuits.',  stat: 'MATH' },
  { text: 'Meditation can meaningfully grow your resonance.',             stat: 'RESONANCE' },
  { text: 'Some perks have hidden synergies with spiritual stats!',      stat: 'FAITH' },
  { text: 'Social interactions raise your presence over time.',          stat: 'PRESENCE' },
  { text: 'The library holds exercises to sharpen your linguistic stat.', stat: 'LINGUISTIC' },
  { text: 'Physical training before study sessions boosts endurance.',   stat: 'ENDURANCE' },
  { text: 'Luck shifts based on Cub affection — keep the bond strong.',  stat: 'LUCK' },
  { text: 'Fortitude grows through exposure to difficult situations.',   stat: 'FORTITUDE' },
];

const AFFECTION_TIERS = [
  { threshold: 0,   label: 'Stranger',    color: '#555555' },
  { threshold: 20,  label: 'Acquaintance',color: '#888800' },
  { threshold: 40,  label: 'Friend',      color: '#00aa44' },
  { threshold: 60,  label: 'Close',       color: '#00ff88' },
  { threshold: 80,  label: 'Trusted',     color: '#cc66ff' },
  { threshold: 100, label: 'Bonded',      color: '#ffaa00' },
];

function getAffectionTier(value: number) {
  return [...AFFECTION_TIERS].reverse().find(t => value >= t.threshold) ?? AFFECTION_TIERS[0];
}

function AffectionBar({ value, color }: { value: number; color: string }) {
  const tier = getAffectionTier(value);
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Heart size={11} color={tier.color} fill={tier.color} />
          <span style={{ fontSize: 10, color: tier.color, fontFamily: '"Courier New", monospace', letterSpacing: '0.5px' }}>{tier.label}</span>
        </div>
        <span style={{ fontSize: 10, color: tier.color, fontFamily: '"Courier New", monospace' }}>{value}/100</span>
      </div>
      <div style={{ height: 7, background: '#1a1a1a', borderRadius: 4, overflow: 'hidden', border: `1px solid ${tier.color}30` }}>
        <div style={{ width: `${value}%`, height: '100%', background: `linear-gradient(90deg, ${tier.color}70, ${tier.color})`, boxShadow: `0 0 8px ${tier.color}50`, transition: 'width 0.4s ease' }} />
      </div>
      {value < 100 && (
        <div style={{ fontSize: 9, color: '#ffffff25', marginTop: 3, fontFamily: '"Courier New", monospace' }}>
          {100 - value} to next tier
        </div>
      )}
    </div>
  );
}

export default function CubCompanion() {
  const { cubAffection, setCubAffection, character } = useGameState();
  const [mood, setMood] = useState<CubMood>(MOODS[0]);
  const [tip] = useState(TIPS[Math.floor(Math.random() * TIPS.length)]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [recentBoosts, setRecentBoosts] = useState<{ label: string; stat: string; color: string }[]>([]);
  const [activeTab, setActiveTab] = useState<'link' | 'boosts'>('link');

  const animate = (newMood: CubMood, cb: () => void) => {
    setIsAnimating(true);
    setMood(newMood);
    cb();
    setTimeout(() => setIsAnimating(false), 500);
  };

  const addBoost = (label: string, stat: string, color: string) => {
    setRecentBoosts(prev => [{ label, stat, color }, ...prev.slice(0, 4)]);
  };

  const bump = (amount: number) =>
    setCubAffection(Math.min(100, Math.max(0, cubAffection + amount)));

  const handlePet = () => {
    animate(MOODS[3], () => { bump(5); addBoost('+QCK', 'QUICKNESS', '#ffaa00'); });
    earnMemory('cub_pet');
  };
  const handleFeed = () => {
    animate(MOODS[0], () => { bump(8); addBoost('+END', 'ENDURANCE', '#00ff88'); addBoost('+CHI', 'CHI', '#cc66ff'); });
  };
  const handleStudy = () => {
    animate(MOODS[1], () => { bump(6); addBoost('+MTH', 'MATH', '#00ffff'); addBoost('+LNG', 'LINGUISTIC', '#00ffff'); });
  };
  const handleMeditate = () => {
    animate(MOODS[2], () => { bump(4); addBoost('+CHI', 'CHI', '#cc66ff'); addBoost('+RSN', 'RESONANCE', '#ff66aa'); });
  };

  const ACTIVITIES: Activity[] = [
    { label: 'PET',      icon: Sparkles, color: '#ffaa00', stats: 'QCK',       handler: handlePet      },
    { label: 'FEED',     icon: Coffee,   color: '#00ff88', stats: 'END · CHI', handler: handleFeed     },
    { label: 'STUDY',    icon: BookOpen, color: '#00ffff', stats: 'MTH · LNG', handler: handleStudy    },
    { label: 'MEDITATE', icon: Star,     color: '#cc66ff', stats: 'CHI · RSN', handler: handleMeditate },
  ];

  const tier = getAffectionTier(cubAffection);

  const tabBtn = (tab: 'link' | 'boosts', label: string): React.CSSProperties => ({
    flex: 1,
    background: activeTab === tab ? '#ffffff12' : 'transparent',
    border: 'none',
    borderBottom: `2px solid ${activeTab === tab ? tier.color : 'transparent'}`,
    color: activeTab === tab ? '#fff' : '#ffffff50',
    padding: '7px 0',
    cursor: 'pointer',
    fontSize: 10,
    fontFamily: '"Courier New", monospace',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
  });

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#06060a', color: '#fff', fontFamily: '"Courier New", monospace', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '10px 14px', borderBottom: `1px solid ${tier.color}30`, background: `${tier.color}08`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Heart size={14} color={tier.color} fill={tier.color} />
          <span style={{ fontSize: 12, fontWeight: 'bold', letterSpacing: '0.8px', textTransform: 'uppercase', color: tier.color }}>
            Cub Companion Link
          </span>
          <span style={{ marginLeft: 'auto', fontSize: 9, color: `${tier.color}70`, fontFamily: '"Courier New", monospace' }}>
            {tier.label}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #ffffff10', flexShrink: 0 }}>
        <button style={tabBtn('link', 'link')} onClick={() => setActiveTab('link')}>Link</button>
        <button style={tabBtn('boosts', 'boosts')} onClick={() => setActiveTab('boosts')}>Stat Feed</button>
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        {activeTab === 'link' ? (
          <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Mood + portrait */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 90, height: 90, borderRadius: '50%',
                border: `3px solid ${mood.color}`,
                boxShadow: `0 0 24px ${mood.color}50`,
                overflow: 'hidden', flexShrink: 0,
                transform: isAnimating ? 'scale(1.06)' : 'scale(1)',
                transition: 'transform 0.25s ease, border-color 0.4s ease',
                background: '#111',
              }}>
                <img src={bearMascot} alt="Polar Cub" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: `drop-shadow(0 0 8px ${mood.color})` }} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <mood.icon size={15} color={mood.color} style={{ filter: `drop-shadow(0 0 5px ${mood.color})` }} />
                  <span style={{ fontSize: 12, fontWeight: 'bold', color: mood.color }}>{mood.name}</span>
                </div>
                <div style={{ fontSize: 10, color: '#ffffff70', lineHeight: 1.5, marginBottom: 8 }}>{mood.message}</div>
                <AffectionBar value={cubAffection} color={tier.color} />
              </div>
            </div>

            {/* Activity buttons — 2×2 grid, no icons inside */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {ACTIVITIES.map(act => (
                <button
                  key={act.label}
                  onClick={act.handler}
                  style={{
                    background: `${act.color}0e`,
                    border: `1px solid ${act.color}40`,
                    color: act.color,
                    padding: '10px 10px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                    transition: 'background 0.15s',
                    borderRadius: 4,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <act.icon size={13} />
                    <span style={{ fontSize: 10, fontFamily: '"Courier New", monospace', letterSpacing: '0.5px' }}>{act.label}</span>
                  </div>
                  <span style={{ fontSize: 8, color: `${act.color}80`, fontFamily: '"Courier New", monospace', letterSpacing: '0.4px' }}>
                    {act.stats}
                  </span>
                </button>
              ))}
            </div>

            {/* Cub's tip */}
            <div style={{ background: '#0c0c12', border: '1px solid #00ffff25', borderRadius: 4, padding: '10px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <MessageCircle size={11} color="#00ffff" />
                <span style={{ fontSize: 10, color: '#00ffff', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Cub's Tip</span>
                <span style={{ marginLeft: 'auto', fontSize: 8, color: '#00ffff50', fontFamily: '"Courier New", monospace' }}>→ {tip.stat}</span>
              </div>
              <div style={{ fontSize: 10, color: '#ffffff80', lineHeight: 1.6 }}>{tip.text}</div>
            </div>
          </div>
        ) : (
          <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 10, color: '#ffffff40', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Recent stat influences from Cub interactions
            </div>
            {recentBoosts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: '#ffffff25', fontSize: 11 }}>
                Interact with Cub to see stat boosts appear here.
              </div>
            ) : (
              recentBoosts.map((b, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: `${b.color}08`, border: `1px solid ${b.color}25`, borderRadius: 4 }}>
                  <span style={{ fontSize: 12, color: b.color, fontWeight: 'bold', fontFamily: '"Courier New", monospace' }}>{b.label}</span>
                  <span style={{ fontSize: 9, color: `${b.color}80`, fontFamily: '"Courier New", monospace' }}>{b.stat}</span>
                  <span style={{ fontSize: 10, color: '#ffffff40', marginLeft: 'auto' }}>just now</span>
                </div>
              ))
            )}

            <div style={{ marginTop: 8, borderTop: '1px solid #ffffff0a', paddingTop: 12 }}>
              <div style={{ fontSize: 10, color: '#ffffff40', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Interaction → Stat Mapping
              </div>
              {ACTIVITIES.map(act => (
                <div key={act.label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: '1px solid #ffffff06' }}>
                  <act.icon size={12} color={act.color} />
                  <span style={{ fontSize: 10, color: act.color, minWidth: 70, letterSpacing: '0.5px' }}>{act.label}</span>
                  <span style={{ fontSize: 9, color: `${act.color}80`, fontFamily: '"Courier New", monospace' }}>{act.stats}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
