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
  physical: { stats: PHYSICAL_STATS, barColor: '#00ff88', glowColor: '#00ff8850', label: 'Physical' },
  mental:   { stats: MENTAL_STATS,   barColor: '#00ccff', glowColor: '#00ccff50', label: 'Mental'   },
  spiritual:{ stats: SPIRITUAL_STATS,barColor: '#cc66ff', glowColor: '#cc66ff50', label: 'Spiritual'},
} as const;

function StatBar({ value, barColor, glowColor }: { value: number; barColor: string; glowColor: string }) {
  const pct = Math.min(value, 100);
  const tier = pct >= 80 ? 'elite' : pct >= 60 ? 'high' : pct >= 40 ? 'mid' : pct >= 20 ? 'low' : 'base';
  const tiers = { elite: 'ELITE', high: 'HIGH', mid: 'MID', low: 'LOW', base: 'BASE' };
  return (
    <div style={{ flex: 1 }}>
      <div style={{ height: 6, background: '#111', borderRadius: 3, overflow: 'hidden', position: 'relative' }}>
        <div style={{
          width: `${pct}%`, height: '100%',
          background: `linear-gradient(90deg, ${barColor}60, ${barColor})`,
          boxShadow: pct > 50 ? `0 0 6px ${glowColor}` : 'none',
          borderRadius: 3,
          transition: 'width 0.5s ease',
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
        <span style={{ fontSize: 8, color: pct >= 80 ? barColor : '#ffffff25', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
          {tiers[tier]}
        </span>
        <span style={{ fontSize: 8, color: '#ffffff30' }}>{pct}/100</span>
      </div>
    </div>
  );
}

function StatRow({ stat, value, barColor, glowColor, selected, onClick }:
  { stat: StatDefinition; value: number; barColor: string; glowColor: string; selected: boolean; onClick: () => void }
) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        width: '100%', padding: '9px 10px',
        background: selected ? `${barColor}12` : 'transparent',
        border: selected ? `1px solid ${barColor}40` : '1px solid transparent',
        borderRadius: 4, cursor: 'pointer', textAlign: 'left',
        transition: 'background 0.15s',
      }}
    >
      <StatIcon statKey={stat.iconKey as StatKey} size="sm" showTooltip={false} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 'bold', color: selected ? barColor : '#ffffffcc', fontFamily: '"Courier New", monospace', letterSpacing: '0.3px' }}>
            {stat.name}
          </span>
          <span style={{ fontSize: 9, color: '#ffffff30', fontFamily: '"Courier New", monospace' }}>{stat.abbreviation}</span>
        </div>
        <StatBar value={value} barColor={barColor} glowColor={glowColor} />
      </div>
      <span style={{ fontSize: 14, fontWeight: 'bold', color: barColor, fontFamily: '"Courier New", monospace', minWidth: 28, textAlign: 'right' }}>
        {value}
      </span>
    </button>
  );
}

function CategorySection({ categoryKey, stats, characterStats, selectedStat, onSelect, visible }:
  { categoryKey: 'physical' | 'mental' | 'spiritual'; stats: StatDefinition[]; characterStats: Record<string, number>; selectedStat: string | null; onSelect: (id: string) => void; visible: boolean }
) {
  if (!visible) return null;
  const { barColor, glowColor } = CATEGORY_META[categoryKey];
  const catInfo = STAT_CATEGORIES[categoryKey];
  const total = stats.reduce((sum, s) => sum + (characterStats[s.id] ?? 10), 0);
  const avg = Math.round(total / stats.length);

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderBottom: `1px solid ${barColor}25`, marginBottom: 4 }}>
        <StatIcon statKey={categoryKey} size="md" showTooltip={false} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 'bold', color: barColor, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            {catInfo.name}
          </div>
          <div style={{ fontSize: 9, color: '#ffffff40', marginTop: 1 }}>{catInfo.description}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 14, fontWeight: 'bold', color: barColor, fontFamily: '"Courier New", monospace' }}>{avg}</div>
          <div style={{ fontSize: 8, color: '#ffffff30' }}>avg</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {stats.map(stat => (
          <StatRow
            key={stat.id}
            stat={stat}
            value={characterStats[stat.id] ?? 10}
            barColor={barColor}
            glowColor={glowColor}
            selected={selectedStat === stat.id}
            onClick={() => onSelect(selectedStat === stat.id ? '' : stat.id)}
          />
        ))}
      </div>
    </div>
  );
}

function StatDetail({ statId, characterStats }: { statId: string; characterStats: Record<string, number> }) {
  const statDef = ALL_STATS.find(s => s.id === statId);
  if (!statDef) return null;
  const value = characterStats[statId] ?? 10;
  const catKey = statDef.category as 'physical' | 'mental' | 'spiritual';
  const { barColor, glowColor } = CATEGORY_META[catKey];

  return (
    <div style={{ padding: '14px', borderTop: '1px solid #ffffff0a', background: '#0a0a0f', flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <StatIcon statKey={statDef.iconKey as StatKey} size="md" showTooltip={false} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 'bold', color: barColor, fontFamily: '"Courier New", monospace' }}>{statDef.name}</div>
          <div style={{ fontSize: 9, color: '#ffffff40', fontFamily: '"Courier New", monospace', letterSpacing: '0.5px' }}>{statDef.abbreviation} · {catKey.toUpperCase()}</div>
        </div>
        <div style={{ fontSize: 24, fontWeight: 'bold', color: barColor, fontFamily: '"Courier New", monospace', textShadow: `0 0 12px ${glowColor}` }}>{value}</div>
      </div>
      <div style={{ height: 8, background: '#111', borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
        <div style={{ width: `${Math.min(value, 100)}%`, height: '100%', background: `linear-gradient(90deg, ${barColor}60, ${barColor})`, boxShadow: `0 0 8px ${glowColor}`, transition: 'width 0.5s ease', borderRadius: 4 }} />
      </div>
      <div style={{ fontSize: 10, color: '#ffffff60', lineHeight: 1.6 }}>{statDef.description}</div>
    </div>
  );
}

function XpBar({ level, xp, xpToNext }: { level: number; xp: number; xpToNext: number }) {
  const pct = Math.min((xp / xpToNext) * 100, 100);
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
        <span style={{ fontSize: 9, color: '#ffffff40', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Experience</span>
        <span style={{ fontSize: 9, color: '#ffaa00', fontFamily: '"Courier New", monospace' }}>{xp} / {xpToNext} XP</span>
      </div>
      <div style={{ height: 5, background: '#111', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #ffaa0060, #ffaa00)', boxShadow: '0 0 6px #ffaa0050', borderRadius: 3, transition: 'width 0.4s ease' }} />
      </div>
    </div>
  );
}

export default function CharacterStatsApp() {
  const { character } = useGameState();
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [selectedStat, setSelectedStat] = useState<string>('');

  const stats = character.stats as unknown as Record<string, number>;

  const overallAvg = Math.round(ALL_STATS.reduce((sum, s) => sum + (stats[s.id] ?? 10), 0) / ALL_STATS.length);

  const catBtnStyle = (cat: CategoryFilter, color: string): React.CSSProperties => ({
    flex: 1,
    background: categoryFilter === cat ? `${color}18` : 'transparent',
    border: `1px solid ${categoryFilter === cat ? color : '#ffffff15'}`,
    color: categoryFilter === cat ? color : '#ffffff50',
    padding: '5px 0',
    cursor: 'pointer',
    fontSize: 9,
    fontFamily: '"Courier New", monospace',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    borderRadius: 3,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  });

  const selectedStatDef = ALL_STATS.find(s => s.id === selectedStat);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#06060a', color: '#fff', fontFamily: '"Courier New", monospace', overflow: 'hidden' }}>
      <div style={{ padding: '12px 14px', borderBottom: '1px solid #ffffff12', background: '#0a0a12', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['physical', 'mental', 'spiritual'] as const).map(cat => (
              <StatIcon key={cat} statKey={cat} size="sm" showTooltip={false} />
            ))}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 'bold', letterSpacing: '0.5px', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {character.name}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Star size={10} color="#ffaa00" fill="#ffaa00" />
                <span style={{ fontSize: 10, color: '#ffaa00', fontWeight: 'bold' }}>Lv. {character.level}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <TrendingUp size={10} color="#00ff88" />
                <span style={{ fontSize: 10, color: '#00ff88' }}>AVG {overallAvg}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Zap size={10} color="#cc66ff" />
                <span style={{ fontSize: 10, color: '#cc66ff' }}>
                  {character.faction ? character.faction.toUpperCase() : 'UNAFFILIATED'}
                </span>
              </div>
            </div>
          </div>
        </div>
        <XpBar level={character.level} xp={character.experience} xpToNext={character.experienceToNextLevel} />
      </div>

      <div style={{ display: 'flex', gap: 4, padding: '8px 10px', borderBottom: '1px solid #ffffff08', flexShrink: 0 }}>
        <button style={catBtnStyle('all', '#ffffff')} onClick={() => setCategoryFilter('all')}>All</button>
        <button style={catBtnStyle('physical', '#00ff88')} onClick={() => setCategoryFilter('physical')}>
          <StatIcon statKey="physical" size="xs" showTooltip={false} /> Phys
        </button>
        <button style={catBtnStyle('mental', '#00ccff')} onClick={() => setCategoryFilter('mental')}>
          <StatIcon statKey="mental" size="xs" showTooltip={false} /> Ment
        </button>
        <button style={catBtnStyle('spiritual', '#cc66ff')} onClick={() => setCategoryFilter('spiritual')}>
          <StatIcon statKey="spiritual" size="xs" showTooltip={false} /> Spir
        </button>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '10px 8px 0' }}>
        <CategorySection
          categoryKey="physical"
          stats={PHYSICAL_STATS}
          characterStats={stats}
          selectedStat={selectedStat}
          onSelect={setSelectedStat}
          visible={categoryFilter === 'all' || categoryFilter === 'physical'}
        />
        <CategorySection
          categoryKey="mental"
          stats={MENTAL_STATS}
          characterStats={stats}
          selectedStat={selectedStat}
          onSelect={setSelectedStat}
          visible={categoryFilter === 'all' || categoryFilter === 'mental'}
        />
        <CategorySection
          categoryKey="spiritual"
          stats={SPIRITUAL_STATS}
          characterStats={stats}
          selectedStat={selectedStat}
          onSelect={setSelectedStat}
          visible={categoryFilter === 'all' || categoryFilter === 'spiritual'}
        />
      </div>

      {selectedStat && selectedStatDef && (
        <StatDetail statId={selectedStat} characterStats={stats} />
      )}

      {!selectedStat && (
        <div style={{ padding: '8px 14px', borderTop: '1px solid #ffffff08', background: '#0a0a0f', fontSize: 9, color: '#ffffff25', flexShrink: 0 }}>
          Click any stat row to see its full description · 17 stats across 3 domains
        </div>
      )}
    </div>
  );
}
