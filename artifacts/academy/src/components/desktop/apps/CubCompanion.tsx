import { useState } from 'react';
import { MessageCircle, Zap, Brain, Moon, Smile, HelpCircle, Sparkles, Coffee, BookOpen, Star, Heart, LucideIcon } from 'lucide-react';
import bearMascot from '@assets/ChatGPT Image Nov 29, 2025, 01_44_34 AM_1764398698829.png';
import { useGameState } from '@/contexts/GameStateContext';
import { earnMemory } from '@/lib/memoriesStore';
import { useI18n } from '@/contexts/I18nContext';

interface CubMoodDef { key: string; icon: LucideIcon; color: string; }

const MOOD_DEFS: CubMoodDef[] = [
  { key: 'happy',     icon: Smile,      color: '#00ff00' },
  { key: 'curious',   icon: HelpCircle, color: '#00ffff' },
  { key: 'sleepy',    icon: Moon,       color: '#cc66ff' },
  { key: 'excited',   icon: Zap,        color: '#ffaa00' },
  { key: 'thoughtful',icon: Brain,      color: '#66ffcc' },
];

const TIP_COUNT = 10;

const TIER_DEFS = [
  { threshold: 0,   key: 'stranger',     color: '#555555' },
  { threshold: 20,  key: 'acquaintance', color: '#888800' },
  { threshold: 40,  key: 'friend',       color: '#00aa44' },
  { threshold: 60,  key: 'close',        color: '#00ff88' },
  { threshold: 80,  key: 'trusted',      color: '#cc66ff' },
  { threshold: 100, key: 'bonded',       color: '#ffaa00' },
];

const ACTIVITY_DEFS = [
  { key: 'pet',      icon: Sparkles, color: '#ffaa00', stats: 'QCK'       },
  { key: 'feed',     icon: Coffee,   color: '#00ff88', stats: 'END · CHI' },
  { key: 'study',    icon: BookOpen, color: '#00ffff', stats: 'MTH · LNG' },
  { key: 'meditate', icon: Star,     color: '#cc66ff', stats: 'CHI · RSN' },
];

function getAffectionTier(value: number) {
  return [...TIER_DEFS].reverse().find(t => value >= t.threshold) ?? TIER_DEFS[0];
}

function AffectionBar({ value, tierColor, tierLabel, toNextLabel }: { value: number; tierColor: string; tierLabel: string; toNextLabel: string }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Heart size={11} color={tierColor} fill={tierColor} />
          <span style={{ fontSize: 10, color: tierColor, fontFamily: '"Courier New", monospace', letterSpacing: '0.5px' }}>{tierLabel}</span>
        </div>
        <span style={{ fontSize: 10, color: tierColor, fontFamily: '"Courier New", monospace' }}>{value}/100</span>
      </div>
      <div style={{ height: 7, background: '#1a1a1a', borderRadius: 4, overflow: 'hidden', border: `1px solid ${tierColor}30` }}>
        <div style={{ width: `${value}%`, height: '100%', background: `linear-gradient(90deg, ${tierColor}70, ${tierColor})`, boxShadow: `0 0 8px ${tierColor}50`, transition: 'width 0.4s ease' }} />
      </div>
      {value < 100 && (
        <div style={{ fontSize: 9, color: '#ffffff25', marginTop: 3, fontFamily: '"Courier New", monospace' }}>
          {toNextLabel}
        </div>
      )}
    </div>
  );
}

export default function CubCompanion() {
  const { cubAffection, setCubAffection } = useGameState();
  const { t } = useI18n();
  const [moodKey, setMoodKey] = useState<string>('happy');
  const [tipIndex] = useState(() => Math.floor(Math.random() * TIP_COUNT));
  const [isAnimating, setIsAnimating] = useState(false);
  const [recentBoosts, setRecentBoosts] = useState<{ label: string; stat: string; color: string }[]>([]);
  const [activeTab, setActiveTab] = useState<'link' | 'boosts'>('link');

  const tierDef = getAffectionTier(cubAffection);
  const moodDef = MOOD_DEFS.find(m => m.key === moodKey) ?? MOOD_DEFS[0];

  const animate = (newMoodKey: string, cb: () => void) => {
    setIsAnimating(true);
    setMoodKey(newMoodKey);
    cb();
    setTimeout(() => setIsAnimating(false), 500);
  };

  const addBoost = (label: string, stat: string, color: string) => {
    setRecentBoosts(prev => [{ label, stat, color }, ...prev.slice(0, 4)]);
  };

  const bump = (amount: number) =>
    setCubAffection(Math.min(100, Math.max(0, cubAffection + amount)));

  const handlePet = () => { animate('excited', () => { bump(5); addBoost('+QCK', 'QUICKNESS', '#ffaa00'); }); earnMemory('cub_pet'); };
  const handleFeed = () => animate('happy', () => { bump(8); addBoost('+END', 'ENDURANCE', '#00ff88'); addBoost('+CHI', 'CHI', '#cc66ff'); });
  const handleStudy = () => animate('curious', () => { bump(6); addBoost('+MTH', 'MATH', '#00ffff'); addBoost('+LNG', 'LINGUISTIC', '#00ffff'); });
  const handleMeditate = () => animate('sleepy', () => { bump(4); addBoost('+CHI', 'CHI', '#cc66ff'); addBoost('+RSN', 'RESONANCE', '#ff66aa'); });

  const handlers: Record<string, () => void> = { pet: handlePet, feed: handleFeed, study: handleStudy, meditate: handleMeditate };

  const tabBtn = (tab: 'link' | 'boosts'): React.CSSProperties => ({
    flex: 1,
    background: activeTab === tab ? '#ffffff12' : 'transparent',
    border: 'none',
    borderBottom: `2px solid ${activeTab === tab ? tierDef.color : 'transparent'}`,
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
      <div style={{ padding: '10px 14px', borderBottom: `1px solid ${tierDef.color}30`, background: `${tierDef.color}08`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Heart size={14} color={tierDef.color} fill={tierDef.color} />
          <span style={{ fontSize: 12, fontWeight: 'bold', letterSpacing: '0.8px', textTransform: 'uppercase', color: tierDef.color }}>
            {t('cub.title')}
          </span>
          <span style={{ marginLeft: 'auto', fontSize: 9, color: `${tierDef.color}70`, fontFamily: '"Courier New", monospace' }}>
            {t(`cub.tier.${tierDef.key}`)}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid #ffffff10', flexShrink: 0 }}>
        <button style={tabBtn('link')} onClick={() => setActiveTab('link')}>{t('cub.tab.link')}</button>
        <button style={tabBtn('boosts')} onClick={() => setActiveTab('boosts')}>{t('cub.tab.statFeed')}</button>
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        {activeTab === 'link' ? (
          <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 90, height: 90, borderRadius: '50%',
                border: `3px solid ${moodDef.color}`,
                boxShadow: `0 0 24px ${moodDef.color}50`,
                overflow: 'hidden', flexShrink: 0,
                transform: isAnimating ? 'scale(1.06)' : 'scale(1)',
                transition: 'transform 0.25s ease, border-color 0.4s ease',
                background: '#111',
              }}>
                <img src={bearMascot} alt="Polar Cub" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: `drop-shadow(0 0 8px ${moodDef.color})` }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <moodDef.icon size={15} color={moodDef.color} style={{ filter: `drop-shadow(0 0 5px ${moodDef.color})` }} />
                  <span style={{ fontSize: 12, fontWeight: 'bold', color: moodDef.color }}>{t(`cub.mood.${moodDef.key}`)}</span>
                </div>
                <div style={{ fontSize: 10, color: '#ffffff70', lineHeight: 1.5, marginBottom: 8 }}>{t(`cub.mood.${moodDef.key}.msg`)}</div>
                <AffectionBar
                  value={cubAffection}
                  tierColor={tierDef.color}
                  tierLabel={t(`cub.tier.${tierDef.key}`)}
                  toNextLabel={t('cub.toNextTier', { n: String(100 - cubAffection) })}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {ACTIVITY_DEFS.map(act => (
                <button
                  key={act.key}
                  onClick={handlers[act.key]}
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
                    <span style={{ fontSize: 10, fontFamily: '"Courier New", monospace', letterSpacing: '0.5px' }}>{t(`cub.activity.${act.key}`)}</span>
                  </div>
                  <span style={{ fontSize: 8, color: `${act.color}80`, fontFamily: '"Courier New", monospace', letterSpacing: '0.4px' }}>
                    {act.stats}
                  </span>
                </button>
              ))}
            </div>

            <div style={{ background: '#0c0c12', border: '1px solid #00ffff25', borderRadius: 4, padding: '10px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <MessageCircle size={11} color="#00ffff" />
                <span style={{ fontSize: 10, color: '#00ffff', letterSpacing: '0.5px', textTransform: 'uppercase' }}>{t('cub.tip.header')}</span>
                <span style={{ marginLeft: 'auto', fontSize: 8, color: '#00ffff50', fontFamily: '"Courier New", monospace' }}>→ KARMA</span>
              </div>
              <div style={{ fontSize: 10, color: '#ffffff80', lineHeight: 1.6 }}>{t(`cub.tip.${tipIndex}`)}</div>
            </div>
          </div>
        ) : (
          <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 10, color: '#ffffff40', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {t('cub.statFeed.recent')}
            </div>
            {recentBoosts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: '#ffffff25', fontSize: 11 }}>
                {t('cub.statFeed.empty')}
              </div>
            ) : (
              recentBoosts.map((b, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: `${b.color}08`, border: `1px solid ${b.color}25`, borderRadius: 4 }}>
                  <span style={{ fontSize: 12, color: b.color, fontWeight: 'bold', fontFamily: '"Courier New", monospace' }}>{b.label}</span>
                  <span style={{ fontSize: 9, color: `${b.color}80`, fontFamily: '"Courier New", monospace' }}>{b.stat}</span>
                  <span style={{ fontSize: 10, color: '#ffffff40', marginLeft: 'auto' }}>{t('cub.justNow')}</span>
                </div>
              ))
            )}

            <div style={{ marginTop: 8, borderTop: '1px solid #ffffff0a', paddingTop: 12 }}>
              <div style={{ fontSize: 10, color: '#ffffff40', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {t('cub.statFeed.mapping')}
              </div>
              {ACTIVITY_DEFS.map(act => (
                <div key={act.key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: '1px solid #ffffff06' }}>
                  <act.icon size={12} color={act.color} />
                  <span style={{ fontSize: 10, color: act.color, minWidth: 70, letterSpacing: '0.5px' }}>{t(`cub.activity.${act.key}`)}</span>
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
