import { useState, useCallback } from 'react';
import { useCrtTheme } from '@/contexts/CrtThemeContext';
import {
  MEMORY_CATALOG, MemoryCatalogEntry, MemoryRarity, MemoryCategory,
  getEarnedMemories, getEarnedMemory, isMemoryEarned, saveMemoryImage,
  RARITY_COLORS, RARITY_GLOW, getRarityLabel, getCategoryColor,
} from '@/lib/memoriesStore';
import { Camera, Lock, Sparkles, Trophy, Star, ChevronRight, X, Loader } from 'lucide-react';

type FilterType = 'all' | 'earned' | 'locked';

interface ExpandedMemoryState {
  entry: MemoryCatalogEntry;
  imageDataUrl?: string;
  generating: boolean;
  error?: string;
}

function RarityIcon({ rarity, size = 14 }: { rarity: MemoryRarity; size?: number }) {
  const color = RARITY_COLORS[rarity];
  switch (rarity) {
    case 'platinum': return <Star size={size} color={color} fill={color} />;
    case 'gold': return <Trophy size={size} color={color} />;
    case 'silver': return <Trophy size={size} color={color} style={{ opacity: 0.85 }} />;
    default: return <Trophy size={size} color={color} style={{ opacity: 0.7 }} />;
  }
}

function ProgressBar({ earned, total }: { earned: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((earned / total) * 100);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ flex: 1, height: 6, background: '#ffffff18', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #00ff88, #00ffcc)', borderRadius: 3, transition: 'width 0.4s ease' }} />
      </div>
      <span style={{ fontSize: 11, color: '#ffffff80', whiteSpace: 'nowrap' }}>{earned} / {total}</span>
    </div>
  );
}

function RaritySummary({ earnedIds }: { earnedIds: Set<string> }) {
  const counts: Record<MemoryRarity, { earned: number; total: number }> = {
    platinum: { earned: 0, total: 0 },
    gold: { earned: 0, total: 0 },
    silver: { earned: 0, total: 0 },
    bronze: { earned: 0, total: 0 },
  };
  MEMORY_CATALOG.forEach(m => {
    counts[m.rarity].total++;
    if (earnedIds.has(m.id)) counts[m.rarity].earned++;
  });
  const rarities: MemoryRarity[] = ['platinum', 'gold', 'silver', 'bronze'];
  return (
    <div style={{ display: 'flex', gap: 16 }}>
      {rarities.map(r => (
        <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <RarityIcon rarity={r} size={13} />
          <span style={{ fontSize: 13, fontWeight: 'bold', color: RARITY_COLORS[r] }}>{counts[r].earned}</span>
          <span style={{ fontSize: 11, color: '#ffffff40' }}>/ {counts[r].total}</span>
        </div>
      ))}
    </div>
  );
}

function MemoryRow({
  entry,
  earned,
  earnedAt,
  onClick,
  accentGreen,
}: {
  entry: MemoryCatalogEntry;
  earned: boolean;
  earnedAt?: string;
  onClick: () => void;
  accentGreen: string;
}) {
  const rarityColor = RARITY_COLORS[entry.rarity];
  const catColor = getCategoryColor(entry.category);
  const earnedMemory = earned ? getEarnedMemory(entry.id) : undefined;

  const formatDate = (iso: string) => {
    try { return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }); }
    catch { return ''; }
  };

  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        width: '100%',
        padding: '12px 14px',
        background: earned ? `${rarityColor}08` : 'transparent',
        border: 'none',
        borderBottom: '1px solid #ffffff0a',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'background 0.15s',
        opacity: earned ? 1 : 0.55,
      }}
    >
      <div style={{
        width: 52,
        height: 52,
        borderRadius: 6,
        border: `2px solid ${earned ? rarityColor : '#ffffff18'}`,
        boxShadow: earned ? `0 0 12px ${RARITY_GLOW[entry.rarity]}` : 'none',
        background: earned
          ? (earnedMemory?.imageDataUrl
            ? `url(${earnedMemory.imageDataUrl}) center/cover no-repeat`
            : `linear-gradient(135deg, ${rarityColor}22, ${catColor}11)`)
          : '#0a0a0a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        overflow: 'hidden',
      }}>
        {(!earned || !earnedMemory?.imageDataUrl) && (
          earned
            ? <RarityIcon rarity={entry.rarity} size={22} />
            : <Lock size={18} color='#ffffff28' />
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 'bold', color: earned ? '#ffffff' : '#ffffff50', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {earned ? entry.title : '??? ' + entry.hiddenTitle.replace(/./g, '·')}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            <RarityIcon rarity={entry.rarity} size={11} />
            <span style={{ fontSize: 9, color: rarityColor, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {getRarityLabel(entry.rarity)}
            </span>
          </div>
          <span style={{ fontSize: 9, color: catColor, background: `${catColor}18`, padding: '1px 6px', borderRadius: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {entry.category}
          </span>
        </div>
        <div style={{ fontSize: 11, color: earned ? '#ffffff80' : '#ffffff28', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {earned ? entry.description : entry.hiddenHint}
        </div>
        {earned && earnedAt && (
          <div style={{ fontSize: 10, color: '#ffffff35', marginTop: 3 }}>
            Earned {formatDate(earnedAt)}
          </div>
        )}
      </div>

      <ChevronRight size={14} color={earned ? '#ffffff40' : '#ffffff15'} style={{ flexShrink: 0 }} />
    </button>
  );
}

function MemoryDetailPanel({
  state,
  onClose,
  onGenerate,
}: {
  state: ExpandedMemoryState;
  onClose: () => void;
  onGenerate: () => void;
}) {
  const { entry, imageDataUrl, generating, error } = state;
  const rarityColor = RARITY_COLORS[entry.rarity];
  const catColor = getCategoryColor(entry.category);
  const earnedMemory = getEarnedMemory(entry.id);
  const customImage = imageDataUrl || earnedMemory?.imageDataUrl;
  const displayImage = customImage || entry.defaultImage;
  const isCustom = Boolean(customImage);

  return (
    <div style={{
      position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.88)',
      zIndex: 200, display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
        borderBottom: `1px solid ${rarityColor}40`,
        background: `${rarityColor}10`,
        flexShrink: 0,
      }}>
        <RarityIcon rarity={entry.rarity} size={16} />
        <span style={{ flex: 1, fontSize: 13, fontWeight: 'bold', color: '#fff', letterSpacing: '0.3px' }}>
          {entry.title}
        </span>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#ffffff60', cursor: 'pointer', padding: 4 }}>
          <X size={16} />
        </button>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{
          width: '100%',
          aspectRatio: '16/9',
          border: `1px solid ${rarityColor}40`,
          borderRadius: 6,
          overflow: 'hidden',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 0 30px ${RARITY_GLOW[entry.rarity]}`,
          flexShrink: 0,
          background: '#000',
        }}>
          {generating ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, color: rarityColor }}>
              <Loader size={28} style={{ animation: 'spin 1s linear infinite' }} />
              <span style={{ fontSize: 11, opacity: 0.7 }}>Generating custom visualization...</span>
            </div>
          ) : displayImage ? (
            <>
              <img src={displayImage} alt={entry.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              {!isCustom && (
                <div style={{
                  position: 'absolute', bottom: 6, right: 8,
                  fontSize: 9, color: '#ffffff35', letterSpacing: '0.5px',
                  fontFamily: '"Courier New", monospace', textTransform: 'uppercase',
                }}>
                  Academy Archive
                </div>
              )}
            </>
          ) : null}
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <RarityIcon rarity={entry.rarity} size={13} />
              <span style={{ fontSize: 11, color: rarityColor, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 'bold' }}>
                {getRarityLabel(entry.rarity)}
              </span>
            </div>
            <span style={{ fontSize: 10, color: catColor, background: `${catColor}18`, padding: '2px 8px', borderRadius: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {entry.category}
            </span>
            {isCustom && (
              <span style={{ fontSize: 10, color: '#00ff8880', background: '#00ff8810', padding: '2px 8px', borderRadius: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                AI Generated
              </span>
            )}
          </div>
          <p style={{ fontSize: 13, color: '#ffffffcc', lineHeight: 1.6, margin: 0 }}>
            {entry.description}
          </p>
        </div>

        {error && (
          <div style={{ fontSize: 11, color: '#ff4466', padding: '8px 12px', background: '#ff446618', border: '1px solid #ff446640', borderRadius: 4 }}>
            {error}
          </div>
        )}

        {!generating && (
          <button
            onClick={onGenerate}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: isCustom ? 'transparent' : `${rarityColor}20`,
              border: `1px solid ${isCustom ? '#ffffff25' : rarityColor + '60'}`,
              color: isCustom ? '#ffffff50' : rarityColor,
              padding: isCustom ? '8px 16px' : '10px 20px',
              cursor: 'pointer',
              fontSize: isCustom ? 11 : 12,
              fontFamily: '"Courier New", monospace',
              letterSpacing: '0.5px',
              borderRadius: 4,
              flexShrink: 0,
            }}
          >
            <Sparkles size={isCustom ? 12 : 14} />
            {isCustom ? 'Regenerate Custom Visualization' : 'Generate Custom AI Visualization'}
          </button>
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function MemoriesApp() {
  const { accentColors } = useCrtTheme();
  const [filter, setFilter] = useState<FilterType>('all');
  const [expanded, setExpanded] = useState<ExpandedMemoryState | null>(null);
  const [, forceUpdate] = useState(0);

  const earned = getEarnedMemories();
  const earnedIds = new Set(earned.map(m => m.id));
  const totalEarned = earnedIds.size;
  const total = MEMORY_CATALOG.length;

  const filtered = MEMORY_CATALOG.filter(entry => {
    if (filter === 'earned') return earnedIds.has(entry.id);
    if (filter === 'locked') return !earnedIds.has(entry.id);
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const rarityOrder: Record<MemoryRarity, number> = { platinum: 0, gold: 1, silver: 2, bronze: 3 };
    const aEarned = earnedIds.has(a.id) ? 0 : 1;
    const bEarned = earnedIds.has(b.id) ? 0 : 1;
    if (aEarned !== bEarned) return aEarned - bEarned;
    return rarityOrder[a.rarity] - rarityOrder[b.rarity];
  });

  const handleGenerate = useCallback(async (entry: MemoryCatalogEntry) => {
    setExpanded(prev => prev ? { ...prev, generating: true, error: undefined } : null);
    try {
      const res = await fetch('/api/memories/visualize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memoryId: entry.id, prompt: entry.visualizationPrompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Generation failed');
      saveMemoryImage(entry.id, data.imageDataUrl);
      setExpanded(prev => prev ? { ...prev, generating: false, imageDataUrl: data.imageDataUrl } : null);
      forceUpdate(n => n + 1);
    } catch (err: any) {
      setExpanded(prev => prev ? { ...prev, generating: false, error: err.message } : null);
    }
  }, []);

  const openMemory = useCallback((entry: MemoryCatalogEntry) => {
    if (!earnedIds.has(entry.id)) return;
    const existing = getEarnedMemory(entry.id);
    setExpanded({ entry, imageDataUrl: existing?.imageDataUrl, generating: false });
  }, [earnedIds]);

  const filterBtnStyle = (active: boolean): React.CSSProperties => ({
    background: active ? '#ffffff15' : 'transparent',
    border: `1px solid ${active ? '#ffffff50' : '#ffffff18'}`,
    color: active ? '#fff' : '#ffffff50',
    padding: '5px 14px',
    cursor: 'pointer',
    fontSize: 11,
    fontFamily: '"Courier New", monospace',
    letterSpacing: '0.5px',
    borderRadius: 3,
  });

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#050508', color: '#fff', fontFamily: '"Courier New", monospace', overflow: 'hidden', position: 'relative' }}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid #ffffff12', flexShrink: 0, background: 'linear-gradient(180deg, #0d0d12 0%, #050508 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <Camera size={16} color={accentColors.pink} />
          <span style={{ fontSize: 13, fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase', color: '#fff' }}>
            Academy Chronicle
          </span>
          <span style={{ marginLeft: 'auto', fontSize: 10, color: '#ffffff40' }}>
            {totalEarned === 0 ? 'No memories earned yet' : `${Math.round((totalEarned / total) * 100)}% complete`}
          </span>
        </div>
        <ProgressBar earned={totalEarned} total={total} />
        <div style={{ marginTop: 10 }}>
          <RaritySummary earnedIds={earnedIds} />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderBottom: '1px solid #ffffff08', flexShrink: 0 }}>
        <button style={filterBtnStyle(filter === 'all')} onClick={() => setFilter('all')}>All</button>
        <button style={filterBtnStyle(filter === 'earned')} onClick={() => setFilter('earned')}>
          Earned ({totalEarned})
        </button>
        <button style={filterBtnStyle(filter === 'locked')} onClick={() => setFilter('locked')}>
          Locked ({total - totalEarned})
        </button>
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        {totalEarned === 0 && filter === 'earned' ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 14, color: '#ffffff35', textAlign: 'center', padding: 24 }}>
            <Trophy size={40} strokeWidth={1} />
            <div style={{ fontSize: 13, letterSpacing: '0.5px', textTransform: 'uppercase' }}>No memories earned yet</div>
            <div style={{ fontSize: 11, color: '#ffffff25', lineHeight: 1.6, maxWidth: 240 }}>
              Play the text adventure, enroll in courses, and explore the Academy to earn memories.
            </div>
          </div>
        ) : sorted.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#ffffff30', fontSize: 12 }}>
            No memories match this filter.
          </div>
        ) : (
          sorted.map(entry => {
            const earnedEntry = earned.find(e => e.id === entry.id);
            return (
              <MemoryRow
                key={entry.id}
                entry={entry}
                earned={earnedIds.has(entry.id)}
                earnedAt={earnedEntry?.earnedAt}
                onClick={() => openMemory(entry)}
                accentGreen={accentColors.green}
              />
            );
          })
        )}
      </div>

      {totalEarned === 0 && filter !== 'earned' && (
        <div style={{ padding: '10px 16px', borderTop: '1px solid #ffffff08', background: '#0d0d12', fontSize: 10, color: '#ffffff30', flexShrink: 0 }}>
          Play the Academy to unlock memories · Click any earned memory to view its visualization
        </div>
      )}

      {expanded && (
        <MemoryDetailPanel
          state={expanded}
          onClose={() => setExpanded(null)}
          onGenerate={() => handleGenerate(expanded.entry)}
        />
      )}
    </div>
  );
}
