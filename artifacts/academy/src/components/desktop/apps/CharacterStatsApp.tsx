import { useState } from 'react';
import { useGameState } from '@/contexts/GameStateContext';
import StatIcon from '@/components/ui/stat-icon';
import {
  PHYSICAL_STATS, MENTAL_STATS, SPIRITUAL_STATS,
  STAT_CATEGORIES, ALL_STATS, type StatKey, type StatDefinition
} from '@shared/stats';
import { Star, TrendingUp, Zap } from 'lucide-react';

type CategoryFilter = 'all' | 'physical' | 'mental' | 'spiritual';

const CATEGORY_META = {
  physical:  { stats: PHYSICAL_STATS,  color: '#00ff88', label: 'PHYS' },
  mental:    { stats: MENTAL_STATS,    color: '#00ccff', label: 'MENT' },
  spiritual: { stats: SPIRITUAL_STATS, color: '#cc66ff', label: 'SPIR' },
} as const;

// ── Compact horizontal stat row ───────────────────────────────────────────────
function StatRow({
  stat, value, color, selected, onClick,
}: {
  stat: StatDefinition; value: number; color: string; selected: boolean; onClick: () => void;
}) {
  const pct = Math.min(value, 100);
  return (
    <button
      onClick={onClick}
      style={{
        display: 'grid',
        gridTemplateColumns: '28px 1fr auto',
        alignItems: 'center',
        gap: 8,
        width: '100%',
        padding: '5px 10px',
        background: selected ? `${color}10` : 'transparent',
        border: `1px solid ${selected ? `${color}40` : 'transparent'}`,
        borderRadius: 3,
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'background 0.12s',
      }}
    >
      {/* Bear icon — xs (32px) with the new centered crop */}
      <StatIcon statKey={stat.iconKey as StatKey} size="xs" showTooltip={false} glowColor={color} />

      {/* Name + bar */}
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginBottom: 3 }}>
          <span style={{ fontSize: 10, fontWeight: 'bold', color: selected ? color : '#ffffffbb', fontFamily: '"Courier New", monospace', letterSpacing: '0.2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {stat.name}
          </span>
          <span style={{ fontSize: 8, color: '#ffffff28', fontFamily: '"Courier New", monospace', flexShrink: 0 }}>
            {stat.abbreviation}
          </span>
        </div>
        {/* Slim progress bar */}
        <div style={{ height: 4, background: '#111', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{
            width: `${pct}%`, height: '100%',
            background: `linear-gradient(90deg, ${color}60, ${color})`,
            boxShadow: pct > 40 ? `0 0 5px ${color}60` : 'none',
            borderRadius: 2, transition: 'width 0.4s ease',
          }} />
        </div>
      </div>

      {/* Value */}
      <span style={{
        fontSize: 14, fontWeight: 'bold', color: selected ? color : `${color}cc`,
        fontFamily: '"Courier New", monospace', minWidth: 24, textAlign: 'right',
        textShadow: selected ? `0 0 10px ${color}` : 'none',
        transition: 'text-shadow 0.2s',
      }}>
        {value}
      </span>
    </button>
  );
}

// ── Compact category section ───────────────────────────────────────────────────
function CategorySection({
  categoryKey, stats, characterStats, selectedStat, onSelect, visible,
}: {
  categoryKey: 'physical' | 'mental' | 'spiritual';
  stats: StatDefinition[];
  characterStats: Record<string, number>;
  selectedStat: string | null;
  onSelect: (id: string) => void;
  visible: boolean;
}) {
  if (!visible) return null;
  const { color } = CATEGORY_META[categoryKey];
  const catInfo = STAT_CATEGORIES[categoryKey];
  const avg = Math.round(stats.reduce((s, st) => s + (characterStats[st.id] ?? 10), 0) / stats.length);

  return (
    <div style={{ marginBottom: 12 }}>
      {/* One-line category header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '28px 1fr auto',
        alignItems: 'center',
        gap: 8,
        padding: '6px 10px',
        background: `${color}08`,
        borderTop: `1px solid ${color}25`,
        borderBottom: `1px solid ${color}15`,
        marginBottom: 2,
      }}>
        <StatIcon statKey={categoryKey} size="xs" showTooltip={false} glowColor={color} />
        <div style={{ minWidth: 0 }}>
          <span style={{ fontSize: 10, fontWeight: 'bold', color, fontFamily: '"Courier New", monospace', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
            {catInfo.name}
          </span>
          <span style={{ fontSize: 8, color: '#ffffff30', fontFamily: '"Courier New", monospace', marginLeft: 8 }}>
            {catInfo.description}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
          <span style={{ fontSize: 14, fontWeight: 'bold', color, fontFamily: '"Courier New", monospace', textShadow: `0 0 8px ${color}60` }}>{avg}</span>
          <span style={{ fontSize: 7, color: '#ffffff28', fontFamily: '"Courier New", monospace' }}>avg</span>
        </div>
      </div>

      {/* Stat rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {stats.map(stat => (
          <StatRow
            key={stat.id}
            stat={stat}
            value={characterStats[stat.id] ?? 10}
            color={color}
            selected={selectedStat === stat.id}
            onClick={() => onSelect(selectedStat === stat.id ? '' : stat.id)}
          />
        ))}
      </div>
    </div>
  );
}

// ── Expandable detail panel ────────────────────────────────────────────────────
function StatDetail({ statId, characterStats }: { statId: string; characterStats: Record<string, number> }) {
  const statDef = ALL_STATS.find(s => s.id === statId);
  if (!statDef) return null;
  const value = characterStats[statId] ?? 10;
  const catKey = statDef.category as 'physical' | 'mental' | 'spiritual';
  const { color } = CATEGORY_META[catKey];
  const pct = Math.min(value, 100);
  const tier = pct >= 80 ? 'ELITE' : pct >= 60 ? 'HIGH' : pct >= 40 ? 'MID' : pct >= 20 ? 'LOW' : 'BASE';

  return (
    <div style={{ padding: '12px 14px', borderTop: `1px solid ${color}30`, background: '#080810', flexShrink: 0 }}>
      {/* Header row: icon + name + value */}
      <div style={{ display: 'grid', gridTemplateColumns: '52px 1fr auto', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <StatIcon statKey={statDef.iconKey as StatKey} size="md" showTooltip={false} glowColor={color} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 'bold', color, fontFamily: '"Courier New", monospace', letterSpacing: '0.5px', textShadow: `0 0 8px ${color}70` }}>
            {statDef.name}
          </div>
          <div style={{ fontSize: 8, color: '#ffffff35', fontFamily: '"Courier New", monospace', letterSpacing: '0.4px', marginTop: 2 }}>
            {statDef.abbreviation} · {catKey.toUpperCase()} · <span style={{ color }}>{tier}</span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 28, fontWeight: 'bold', color, fontFamily: '"Courier New", monospace', lineHeight: 1, textShadow: `0 0 16px ${color}80` }}>
            {value}
          </div>
          <div style={{ fontSize: 8, color: '#ffffff28', fontFamily: '"Courier New", monospace' }}>/100</div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 7, background: '#111', borderRadius: 4, overflow: 'hidden', marginBottom: 8, border: '1px solid #ffffff06' }}>
        <div style={{
          width: `${pct}%`, height: '100%',
          background: `linear-gradient(90deg, ${color}55, ${color})`,
          boxShadow: `0 0 8px ${color}70`,
          transition: 'width 0.5s ease', borderRadius: 4,
        }} />
      </div>

      {/* Description */}
      <div style={{ fontSize: 9, color: '#ffffff55', lineHeight: 1.7, fontFamily: '"Courier New", monospace' }}>
        {statDef.description}
      </div>
    </div>
  );
}

// ── XP bar ────────────────────────────────────────────────────────────────────
function XpBar({ xp, xpToNext }: { xp: number; xpToNext: number }) {
  const pct = Math.min((xp / xpToNext) * 100, 100);
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span style={{ fontSize: 8, color: '#ffffff30', fontFamily: '"Courier New", monospace', letterSpacing: '0.4px', textTransform: 'uppercase' }}>Experience</span>
        <span style={{ fontSize: 8, color: '#ffaa00', fontFamily: '"Courier New", monospace' }}>{xp} / {xpToNext} XP</span>
      </div>
      <div style={{ height: 4, background: '#111', borderRadius: 2, overflow: 'hidden', border: '1px solid #ffffff06' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #ffaa0055, #ffaa00)', boxShadow: '0 0 5px #ffaa0060', borderRadius: 2, transition: 'width 0.4s ease' }} />
      </div>
    </div>
  );
}

// ── Root component ────────────────────────────────────────────────────────────
export default function CharacterStatsApp() {
  const { character } = useGameState();
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [selectedStat, setSelectedStat] = useState<string>('');

  const stats = character.stats as unknown as Record<string, number>;
  const overallAvg = Math.round(
    ALL_STATS.reduce((sum, s) => sum + (stats[s.id] ?? 10), 0) / ALL_STATS.length
  );

  const selectedStatDef = ALL_STATS.find(s => s.id === selectedStat);

  // Category tab styles — pure text, no sprite icons
  const tabStyle = (cat: CategoryFilter, color: string): React.CSSProperties => ({
    flex: 1,
    background: categoryFilter === cat ? `${color}18` : 'transparent',
    borderBottom: `2px solid ${categoryFilter === cat ? color : 'transparent'}`,
    border: 'none',
    borderBottomStyle: 'solid',
    borderBottomWidth: 2,
    borderBottomColor: categoryFilter === cat ? color : 'transparent',
    color: categoryFilter === cat ? color : '#ffffff38',
    padding: '7px 4px',
    cursor: 'pointer',
    fontSize: 9,
    fontFamily: '"Courier New", monospace',
    letterSpacing: '1px',
    textTransform: 'uppercase',
    transition: 'color 0.15s, border-color 0.15s, background 0.15s',
  });

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#06060a', color: '#fff', fontFamily: '"Courier New", monospace', overflow: 'hidden' }}>

      {/* ── Compact header ────────────────────────────────────────────── */}
      <div style={{ padding: '10px 12px', borderBottom: '1px solid #ffffff0d', background: '#09090f', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 'bold', letterSpacing: '0.4px', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {character.name}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Star size={9} color="#ffaa00" fill="#ffaa00" />
              <span style={{ fontSize: 9, color: '#ffaa00', fontFamily: '"Courier New", monospace' }}>Lv.{character.level}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <TrendingUp size={9} color="#00ff88" />
              <span style={{ fontSize: 9, color: '#00ff88', fontFamily: '"Courier New", monospace' }}>AVG {overallAvg}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Zap size={9} color="#cc66ff" />
              <span style={{ fontSize: 9, color: '#cc66ff', fontFamily: '"Courier New", monospace' }}>
                {character.faction ? character.faction.toUpperCase() : 'UNAFFILIATED'}
              </span>
            </div>
          </div>
        </div>
        <XpBar xp={character.experience} xpToNext={character.experienceToNextLevel} />
      </div>

      {/* ── Filter tabs — text only, underline indicator ───────────────── */}
      <div style={{ display: 'flex', borderBottom: '1px solid #ffffff08', flexShrink: 0 }}>
        <button style={tabStyle('all', '#ffffff88')} onClick={() => setCategoryFilter('all')}>ALL</button>
        <button style={tabStyle('physical',  '#00ff88')} onClick={() => setCategoryFilter('physical')}>PHYS</button>
        <button style={tabStyle('mental',    '#00ccff')} onClick={() => setCategoryFilter('mental')}>MENT</button>
        <button style={tabStyle('spiritual', '#cc66ff')} onClick={() => setCategoryFilter('spiritual')}>SPIR</button>
      </div>

      {/* ── Scrollable stat list ──────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 4px 0' }}>
        {(['physical', 'mental', 'spiritual'] as const).map(cat => (
          <CategorySection
            key={cat}
            categoryKey={cat}
            stats={CATEGORY_META[cat].stats}
            characterStats={stats}
            selectedStat={selectedStat}
            onSelect={setSelectedStat}
            visible={categoryFilter === 'all' || categoryFilter === cat}
          />
        ))}
      </div>

      {/* ── Stat detail panel ────────────────────────────────────────── */}
      {selectedStat && selectedStatDef && (
        <StatDetail statId={selectedStat} characterStats={stats} />
      )}

      {!selectedStat && (
        <div style={{ padding: '6px 14px', borderTop: '1px solid #ffffff06', background: '#080810', fontSize: 8, color: '#ffffff1a', flexShrink: 0, letterSpacing: '0.3px' }}>
          Click any stat row to see its full description · 17 stats across 3 domains
        </div>
      )}
    </div>
  );
}
