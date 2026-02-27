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
  physical:  { stats: PHYSICAL_STATS,  barColor: '#00ff88', glowColor: '#00ff8850', label: 'PHYS' },
  mental:    { stats: MENTAL_STATS,    barColor: '#00ccff', glowColor: '#00ccff50', label: 'MENT' },
  spiritual: { stats: SPIRITUAL_STATS, barColor: '#cc66ff', glowColor: '#cc66ff50', label: 'SPIR' },
} as const;

function StatBar({ value, barColor, glowColor }: { value: number; barColor: string; glowColor: string }) {
  const pct = Math.min(value, 100);
  const tier = pct >= 80 ? 'ELITE' : pct >= 60 ? 'HIGH' : pct >= 40 ? 'MID' : pct >= 20 ? 'LOW' : 'BASE';
  return (
    <div style={{ flex: 1 }}>
      <div style={{ height: 7, background: '#111', borderRadius: 4, overflow: 'hidden', position: 'relative', border: '1px solid #ffffff08' }}>
        <div style={{
          width: `${pct}%`, height: '100%',
          background: `linear-gradient(90deg, ${barColor}50, ${barColor})`,
          boxShadow: pct > 40 ? `0 0 8px ${glowColor}` : 'none',
          borderRadius: 4,
          transition: 'width 0.5s ease',
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
        <span style={{ fontSize: 8, color: pct >= 80 ? barColor : '#ffffff20', letterSpacing: '0.6px', fontFamily: '"Courier New", monospace' }}>{tier}</span>
        <span style={{ fontSize: 8, color: '#ffffff25', fontFamily: '"Courier New", monospace' }}>{pct}/100</span>
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
        display: 'flex', alignItems: 'center', gap: 14,
        width: '100%', padding: '10px 12px',
        background: selected ? `${barColor}0f` : 'transparent',
        border: selected ? `1px solid ${barColor}35` : '1px solid transparent',
        borderRadius: 4, cursor: 'pointer', textAlign: 'left',
        transition: 'background 0.15s',
      }}
    >
      {/* Icon — md size for clear sprite rendering in list */}
      <StatIcon statKey={stat.iconKey as StatKey} size="md" showTooltip={false} glowColor={barColor} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 'bold', color: selected ? barColor : '#ffffffcc', fontFamily: '"Courier New", monospace', letterSpacing: '0.3px' }}>
            {stat.name}
          </span>
          <span style={{ fontSize: 9, color: '#ffffff25', fontFamily: '"Courier New", monospace' }}>{stat.abbreviation}</span>
        </div>
        <StatBar value={value} barColor={barColor} glowColor={glowColor} />
      </div>

      <span style={{
        fontSize: 18, fontWeight: 'bold', color: barColor,
        fontFamily: '"Courier New", monospace',
        minWidth: 32, textAlign: 'right',
        textShadow: selected ? `0 0 12px ${barColor}` : 'none',
        transition: 'text-shadow 0.2s',
      }}>
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
    <div style={{ marginBottom: 20 }}>
      {/* Category header — xl icon for maximum clarity */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '12px 14px', marginBottom: 4,
        borderBottom: `1px solid ${barColor}30`,
        background: `${barColor}06`,
      }}>
        <StatIcon statKey={categoryKey} size="lg" showTooltip={false} glowColor={barColor} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 'bold', color: barColor, letterSpacing: '0.8px', textTransform: 'uppercase', fontFamily: '"Courier New", monospace' }}>
            {catInfo.name}
          </div>
          <div style={{ fontSize: 9, color: '#ffffff35', marginTop: 3, fontFamily: '"Courier New", monospace', letterSpacing: '0.3px' }}>
            {catInfo.description}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 22, fontWeight: 'bold', color: barColor, fontFamily: '"Courier New", monospace', textShadow: `0 0 12px ${barColor}80` }}>{avg}</div>
          <div style={{ fontSize: 8, color: '#ffffff30', fontFamily: '"Courier New", monospace', letterSpacing: '0.5px' }}>avg</div>
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
    <div style={{ padding: '16px 18px', borderTop: `1px solid ${barColor}25`, background: '#0a0a0f', flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14 }}>
        {/* xl icon in detail panel — prominent but not overflowing */}
        <StatIcon statKey={statDef.iconKey as StatKey} size="xl" showTooltip={false} glowColor={barColor} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 'bold', color: barColor, fontFamily: '"Courier New", monospace', letterSpacing: '0.6px', textShadow: `0 0 10px ${barColor}80` }}>
            {statDef.name}
          </div>
          <div style={{ fontSize: 9, color: '#ffffff35', fontFamily: '"Courier New", monospace', letterSpacing: '0.5px', marginTop: 3 }}>
            {statDef.abbreviation} · {catKey.toUpperCase()}
          </div>
        </div>
        <div style={{ fontSize: 36, fontWeight: 'bold', color: barColor, fontFamily: '"Courier New", monospace', textShadow: `0 0 20px ${glowColor}` }}>
          {value}
        </div>
      </div>
      <div style={{ height: 10, background: '#111', borderRadius: 5, overflow: 'hidden', marginBottom: 10, border: '1px solid #ffffff08' }}>
        <div style={{
          width: `${Math.min(value, 100)}%`, height: '100%',
          background: `linear-gradient(90deg, ${barColor}50, ${barColor})`,
          boxShadow: `0 0 10px ${glowColor}`,
          transition: 'width 0.5s ease', borderRadius: 5,
        }} />
      </div>
      <div style={{ fontSize: 10, color: '#ffffff60', lineHeight: 1.7, fontFamily: '"Courier New", monospace' }}>{statDef.description}</div>
    </div>
  );
}

function XpBar({ xp, xpToNext }: { xp: number; xpToNext: number }) {
  const pct = Math.min((xp / xpToNext) * 100, 100);
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
        <span style={{ fontSize: 9, color: '#ffffff35', textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: '"Courier New", monospace' }}>Experience</span>
        <span style={{ fontSize: 9, color: '#ffaa00', fontFamily: '"Courier New", monospace' }}>{xp} / {xpToNext} XP</span>
      </div>
      <div style={{ height: 5, background: '#111', borderRadius: 3, overflow: 'hidden', border: '1px solid #ffffff06' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #ffaa0050, #ffaa00)', boxShadow: '0 0 6px #ffaa0050', borderRadius: 3, transition: 'width 0.4s ease' }} />
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
    border: `1px solid ${categoryFilter === cat ? `${color}60` : '#ffffff12'}`,
    color: categoryFilter === cat ? color : '#ffffff40',
    padding: '7px 4px',
    cursor: 'pointer',
    fontSize: 9,
    fontFamily: '"Courier New", monospace',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    borderRadius: 3,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    transition: 'background 0.15s, border-color 0.15s',
  });

  const selectedStatDef = ALL_STATS.find(s => s.id === selectedStat);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#06060a', color: '#fff', fontFamily: '"Courier New", monospace', overflow: 'hidden' }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{ padding: '10px 14px', borderBottom: '1px solid #ffffff0f', background: '#0a0a12', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 'bold', letterSpacing: '0.5px', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {character.name}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 3, flexWrap: 'wrap' }}>
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
        <XpBar xp={character.experience} xpToNext={character.experienceToNextLevel} />
      </div>

      {/* ── Category filter tabs — sm icons for visibility ────────────── */}
      <div style={{ display: 'flex', gap: 4, padding: '8px 12px', borderBottom: '1px solid #ffffff08', flexShrink: 0 }}>
        <button style={catBtnStyle('all', '#ffffff')} onClick={() => setCategoryFilter('all')}>ALL</button>
        {(['physical', 'mental', 'spiritual'] as const).map(cat => (
          <button key={cat} style={catBtnStyle(cat, CATEGORY_META[cat].barColor)} onClick={() => setCategoryFilter(cat)}>
            <StatIcon statKey={cat} size="xxs" showTooltip={false} glowColor={CATEGORY_META[cat].barColor} />
            {CATEGORY_META[cat].label}
          </button>
        ))}
      </div>

      {/* ── Scrollable stat list ─────────────────────────────────────────── */}
      <div style={{ flex: 1, overflow: 'auto', padding: '10px 8px 0' }}>
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

      {/* ── Stat detail panel ──────────────────────────────────────────── */}
      {selectedStat && selectedStatDef && (
        <StatDetail statId={selectedStat} characterStats={stats} />
      )}

      {!selectedStat && (
        <div style={{ padding: '8px 16px', borderTop: '1px solid #ffffff06', background: '#0a0a0f', fontSize: 9, color: '#ffffff20', flexShrink: 0, letterSpacing: '0.3px' }}>
          Click any stat row to see its full description · 17 stats across 3 domains
        </div>
      )}
    </div>
  );
}
