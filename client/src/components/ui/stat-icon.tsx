import { useState } from 'react';
import { 
  ALL_STATS, 
  STAT_CATEGORIES,
  type StatKey,
  type StatCategory,
  type StatDefinition
} from '@shared/stats';

import physicalMentalSpiritualImg from '@assets/STAT_ICON_PROTOTYPE_1769387147172.png';
import physicalStatsImg from '@assets/STAT_ICON_PROTOTYPE_2_1769387147169.png';
import mentalStatsImg from '@assets/STAT_ICON_PROTOTYPE_3_1769387147170.png';
import spiritualStatsImg from '@assets/STAT_ICON_PROTOTYPE_4_1769387147171.png';

// Each sprite sheet has a fixed column count across ALL rows.
// Physical sheet: 3 columns × 2 rows  (row 0: 3 icons, row 1: 2 icons left-aligned)
// Mental sheet:   3 columns × 2 rows  (row 0: 3 icons, row 1: 2 icons left-aligned)
// Spiritual sheet:4 columns × 2 rows  (row 0: 3 icons left-aligned, row 1: 4 icons)
// Main sheet:     3 columns × 1 row   (physical, mental, spiritual categories)
const ICON_POSITIONS: Record<StatKey, {
  row: number; col: number;
  totalCols: number; totalRows: number;
  imageKey: 'main' | 'physical' | 'mental' | 'spiritual';
}> = {
  // Main category mascots (prototype 1 – 3 × 1 grid)
  physical:      { row: 0, col: 0, totalCols: 3, totalRows: 1, imageKey: 'main' },
  mental:        { row: 0, col: 1, totalCols: 3, totalRows: 1, imageKey: 'main' },
  spiritual:     { row: 0, col: 2, totalCols: 3, totalRows: 1, imageKey: 'main' },

  // Physical stats (prototype 2 – 3 × 2 grid; row 1 has 2 icons, left-aligned)
  quickness:     { row: 0, col: 0, totalCols: 3, totalRows: 2, imageKey: 'physical' },
  endurance:     { row: 0, col: 1, totalCols: 3, totalRows: 2, imageKey: 'physical' },
  agility:       { row: 0, col: 2, totalCols: 3, totalRows: 2, imageKey: 'physical' },
  speed:         { row: 1, col: 0, totalCols: 3, totalRows: 2, imageKey: 'physical' },
  strength:      { row: 1, col: 1, totalCols: 3, totalRows: 2, imageKey: 'physical' },

  // Mental stats (prototype 3 – 3 × 2 grid; row 1 has 2 icons, left-aligned)
  mathLogic:     { row: 0, col: 0, totalCols: 3, totalRows: 2, imageKey: 'mental' },
  linguistic:    { row: 0, col: 1, totalCols: 3, totalRows: 2, imageKey: 'mental' },
  presence:      { row: 0, col: 2, totalCols: 3, totalRows: 2, imageKey: 'mental' },
  fortitude:     { row: 1, col: 0, totalCols: 3, totalRows: 2, imageKey: 'mental' },
  musicCreative: { row: 1, col: 1, totalCols: 3, totalRows: 2, imageKey: 'mental' },

  // Spiritual stats (prototype 4 – 4 × 2 grid; row 0 has 3 icons, left-aligned)
  faith:         { row: 0, col: 0, totalCols: 4, totalRows: 2, imageKey: 'spiritual' },
  karma:         { row: 0, col: 1, totalCols: 4, totalRows: 2, imageKey: 'spiritual' },
  resonance:     { row: 0, col: 2, totalCols: 4, totalRows: 2, imageKey: 'spiritual' },
  luck:          { row: 1, col: 0, totalCols: 4, totalRows: 2, imageKey: 'spiritual' },
  chi:           { row: 1, col: 1, totalCols: 4, totalRows: 2, imageKey: 'spiritual' },
  nagual:        { row: 1, col: 2, totalCols: 4, totalRows: 2, imageKey: 'spiritual' },
  ashe:          { row: 1, col: 3, totalCols: 4, totalRows: 2, imageKey: 'spiritual' },
};

const IMAGES = {
  main:     physicalMentalSpiritualImg,
  physical: physicalStatsImg,
  mental:   mentalStatsImg,
  spiritual:spiritualStatsImg,
};

const CATEGORY_COLORS: Record<string, string> = {
  physical:  '#00ff88',
  mental:    '#00ccff',
  spiritual: '#cc66ff',
};

function getCategoryColor(statKey: StatKey): string {
  if (statKey === 'physical' || statKey === 'mental' || statKey === 'spiritual') {
    return CATEGORY_COLORS[statKey];
  }
  const stat = ALL_STATS.find(s => s.id === statKey);
  return stat ? (CATEGORY_COLORS[stat.category] ?? '#00ff88') : '#00ff88';
}

// Size → pixel side length
const SIZE_PX: Record<string, number> = {
  xs:  24,
  sm:  36,
  md:  48,
  lg:  64,
  xl:  80,
};

export interface StatIconProps {
  statKey: StatKey;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showTooltip?: boolean;
  showValue?: boolean;
  value?: number;
  glowColor?: string;
  className?: string;
  style?: React.CSSProperties;
}

export default function StatIcon({
  statKey,
  size = 'md',
  showTooltip = true,
  showValue = false,
  value,
  glowColor,
  className = '',
  style,
}: StatIconProps) {
  const [isHovered, setIsHovered] = useState(false);

  const pos = ICON_POSITIONS[statKey];
  if (!pos) return null;

  const imageSrc = IMAGES[pos.imageKey];
  const px = SIZE_PX[size] ?? 48;

  // Background-size: stretch the full sprite sheet to fill N×M times the container.
  const bgW = pos.totalCols * 100;
  const bgH = pos.totalRows * 100;

  // Background-position: select the correct cell.
  // Formula: col/(cols-1)*100%, row/(rows-1)*100%  — safe-guarded for single col/row.
  const xPct = pos.totalCols > 1 ? (pos.col / (pos.totalCols - 1)) * 100 : 0;
  const yPct = pos.totalRows > 1 ? (pos.row / (pos.totalRows - 1)) * 100 : 0;

  const catColor = glowColor ?? getCategoryColor(statKey);

  const statDef = ALL_STATS.find(s => s.id === statKey) ??
    (statKey === 'physical' || statKey === 'mental' || statKey === 'spiritual'
      ? { name: STAT_CATEGORIES[statKey as StatCategory].name, description: STAT_CATEGORIES[statKey as StatCategory].description }
      : null);

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    width: px,
    height: px,
    flexShrink: 0,
    ...style,
  };

  const boxStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    border: `1px solid ${catColor}50`,
    boxShadow: isHovered
      ? `0 0 12px ${catColor}80, inset 0 0 8px ${catColor}20`
      : `0 0 6px ${catColor}30, inset 0 0 4px ${catColor}10`,
    background: `#060608`,
    overflow: 'hidden',
    position: 'relative',
    transition: 'box-shadow 0.2s ease',
  };

  const imgStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    backgroundImage: `url(${imageSrc})`,
    backgroundSize: `${bgW}% ${bgH}%`,
    backgroundPosition: `${xPct}% ${yPct}%`,
    backgroundRepeat: 'no-repeat',
    imageRendering: 'pixelated',
    filter: isHovered ? `brightness(1.25) drop-shadow(0 0 4px ${catColor})` : `brightness(1.05)`,
    transition: 'filter 0.2s ease',
  };

  return (
    <div
      className={className}
      style={containerStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={boxStyle}>
        <div style={imgStyle} />

        {isHovered && (
          <div style={{ position: 'absolute', inset: 0, background: `${catColor}15`, pointerEvents: 'none' }} />
        )}
      </div>

      {showValue && value !== undefined && (
        <div style={{
          position: 'absolute', bottom: -4, right: -4,
          background: '#06060a',
          border: `1px solid ${catColor}60`,
          borderRadius: 3,
          padding: '1px 4px',
          fontSize: Math.max(8, px * 0.22),
          fontFamily: '"Courier New", monospace',
          color: catColor,
          fontWeight: 'bold',
          lineHeight: 1.2,
        }}>
          {value}
        </div>
      )}

      {showTooltip && statDef && isHovered && (
        <div style={{
          position: 'absolute', bottom: '100%', left: '50%',
          transform: 'translateX(-50%)',
          marginBottom: 6,
          background: '#0a0a12',
          border: `1px solid ${catColor}40`,
          borderRadius: 4,
          padding: '8px 10px',
          boxShadow: `0 0 16px #00000080, 0 0 8px ${catColor}20`,
          zIndex: 9999,
          width: 180,
          pointerEvents: 'none',
          whiteSpace: 'normal',
        }}>
          <div style={{ fontSize: 11, fontWeight: 'bold', color: catColor, marginBottom: 4, fontFamily: '"Courier New", monospace', letterSpacing: '0.4px' }}>
            {statDef.name}
          </div>
          <div style={{ fontSize: 10, color: '#ffffff70', lineHeight: 1.5 }}>{statDef.description}</div>
          {value !== undefined && (
            <div style={{ marginTop: 6, fontSize: 11, color: catColor, fontFamily: '"Courier New", monospace' }}>
              VALUE: {value}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Category header — larger icon with label
interface StatCategoryHeaderProps {
  category: StatCategory;
  total?: number;
  className?: string;
}

export function StatCategoryHeader({ category, total, className = '' }: StatCategoryHeaderProps) {
  const categoryInfo = STAT_CATEGORIES[category];
  const catColor = CATEGORY_COLORS[category] ?? '#00ff88';
  return (
    <div className={className} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <StatIcon statKey={category} size="md" showTooltip={false} glowColor={catColor} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, fontFamily: '"Courier New", monospace', color: catColor, fontWeight: 'bold', letterSpacing: '0.5px' }}>
          {categoryInfo.name}
        </div>
        <div style={{ fontSize: 10, color: '#ffffff50' }}>{categoryInfo.description}</div>
      </div>
      {total !== undefined && (
        <div style={{ fontSize: 11, fontFamily: '"Courier New", monospace', color: catColor, background: `${catColor}12`, border: `1px solid ${catColor}30`, borderRadius: 3, padding: '2px 8px' }}>
          {total}
        </div>
      )}
    </div>
  );
}

// Compact stat row (used in sidebar panels)
interface StatRowProps {
  stat: StatDefinition;
  value: number;
  maxValue?: number;
  showBar?: boolean;
  compact?: boolean;
}

export function StatRow({ stat, value, maxValue = 100, showBar = true, compact = false }: StatRowProps) {
  const catColor = CATEGORY_COLORS[stat.category] ?? '#00ff88';
  const barPct = Math.min((value / maxValue) * 100, 100);

  if (compact) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
        <span style={{ color: '#ffffff50', width: 28, fontFamily: '"Courier New", monospace' }}>{stat.abbreviation}</span>
        <span style={{ fontFamily: '"Courier New", monospace', color: catColor }}>{value}</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0' }}>
      <StatIcon statKey={stat.iconKey as StatKey} size="sm" showTooltip />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, marginBottom: 2 }}>
          <span style={{ color: '#ffffffcc', fontFamily: '"Courier New", monospace' }}>{stat.name}</span>
          <span style={{ color: catColor, fontFamily: '"Courier New", monospace', fontWeight: 'bold' }}>{value}</span>
        </div>
        {showBar && (
          <div style={{ height: 4, background: '#111', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ width: `${barPct}%`, height: '100%', background: `linear-gradient(90deg, ${catColor}60, ${catColor})`, transition: 'width 0.3s ease' }} />
          </div>
        )}
      </div>
    </div>
  );
}
