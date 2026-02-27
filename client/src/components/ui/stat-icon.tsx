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

// All sprite sheets are 1536×1024px.
// Physical/Mental sheets: 3 cols × 2 rows → each cell = 512×512px (square)
// Spiritual sheet:        4 cols × 2 rows → each cell = 384×512px (portrait)
// Main categories sheet:  3 cols × 2 rows → each cell = 512×512px (square, mascots in row 0)
const ICON_POSITIONS: Record<StatKey, {
  row: number;
  col: number;
  cellW: number;  // px width of one sprite cell in the source image
  cellH: number;  // px height of one sprite cell in the source image
  imageKey: 'main' | 'physical' | 'mental' | 'spiritual';
}> = {
  // Main category mascots — sheet: 1536×1024, grid 3×2, cell 512×512
  physical:      { row: 0, col: 0, cellW: 512, cellH: 512, imageKey: 'main' },
  mental:        { row: 0, col: 1, cellW: 512, cellH: 512, imageKey: 'main' },
  spiritual:     { row: 0, col: 2, cellW: 512, cellH: 512, imageKey: 'main' },

  // Physical stats — sheet: 1536×1024, grid 3×2, cell 512×512
  quickness:     { row: 0, col: 0, cellW: 512, cellH: 512, imageKey: 'physical' },
  endurance:     { row: 0, col: 1, cellW: 512, cellH: 512, imageKey: 'physical' },
  agility:       { row: 0, col: 2, cellW: 512, cellH: 512, imageKey: 'physical' },
  speed:         { row: 1, col: 0, cellW: 512, cellH: 512, imageKey: 'physical' },
  strength:      { row: 1, col: 1, cellW: 512, cellH: 512, imageKey: 'physical' },

  // Mental stats — sheet: 1536×1024, grid 3×2, cell 512×512
  mathLogic:     { row: 0, col: 0, cellW: 512, cellH: 512, imageKey: 'mental' },
  linguistic:    { row: 0, col: 1, cellW: 512, cellH: 512, imageKey: 'mental' },
  presence:      { row: 0, col: 2, cellW: 512, cellH: 512, imageKey: 'mental' },
  fortitude:     { row: 1, col: 0, cellW: 512, cellH: 512, imageKey: 'mental' },
  musicCreative: { row: 1, col: 1, cellW: 512, cellH: 512, imageKey: 'mental' },

  // Spiritual stats — sheet: 1536×1024, grid 4×2, cell 384×512 (portrait)
  faith:         { row: 0, col: 0, cellW: 384, cellH: 512, imageKey: 'spiritual' },
  karma:         { row: 0, col: 1, cellW: 384, cellH: 512, imageKey: 'spiritual' },
  resonance:     { row: 0, col: 2, cellW: 384, cellH: 512, imageKey: 'spiritual' },
  luck:          { row: 1, col: 0, cellW: 384, cellH: 512, imageKey: 'spiritual' },
  chi:           { row: 1, col: 1, cellW: 384, cellH: 512, imageKey: 'spiritual' },
  nagual:        { row: 1, col: 2, cellW: 384, cellH: 512, imageKey: 'spiritual' },
  ashe:          { row: 1, col: 3, cellW: 384, cellH: 512, imageKey: 'spiritual' },
};

// Full image dimensions (all sheets: 1536×1024)
const IMAGE_DIMS = { w: 1536, h: 1024 };

const IMAGES = {
  main:      physicalMentalSpiritualImg,
  physical:  physicalStatsImg,
  mental:    mentalStatsImg,
  spiritual: spiritualStatsImg,
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

// Display sizes — use multiples of 512÷N where possible for pixel-perfect rendering
const SIZE_PX: Record<string, number> = {
  xxs: 32,   // inline-badge contexts only
  xs:  48,
  sm:  64,
  md:  88,
  lg:  112,
  xl:  144,
  xxl: 180,
};

export interface StatIconProps {
  statKey: StatKey;
  size?: 'xxs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
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
  const displayPx = SIZE_PX[size] ?? 88;
  const catColor = glowColor ?? getCategoryColor(statKey);

  // ── Pixel-precise sprite positioning ─────────────────────────────────
  // Scale so the cell HEIGHT fits exactly into the display box.
  // This preserves aspect ratio — portrait cells get horizontal letterboxing.
  const scale = displayPx / pos.cellH;
  const scaledImageW = IMAGE_DIMS.w * scale;
  const scaledImageH = IMAGE_DIMS.h * scale;
  const cellDisplayW = pos.cellW * scale;   // may be < displayPx for portrait cells
  const cellDisplayH = pos.cellH * scale;   // always equals displayPx

  // Center portrait cells (like the 384×512 spiritual sprites) horizontally
  const letterboxX = (displayPx - cellDisplayW) / 2;
  const bpX = -(pos.col * cellDisplayW) + letterboxX;
  const bpY = -(pos.row * cellDisplayH);
  // ─────────────────────────────────────────────────────────────────────

  const statDef = ALL_STATS.find(s => s.id === statKey) ??
    (statKey === 'physical' || statKey === 'mental' || statKey === 'spiritual'
      ? { name: STAT_CATEGORIES[statKey as StatCategory].name, description: STAT_CATEGORIES[statKey as StatCategory].description }
      : null);

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    width: displayPx,
    height: displayPx,
    flexShrink: 0,
    ...style,
  };

  const borderGlow = isHovered
    ? `0 0 16px ${catColor}90, 0 0 4px ${catColor}60, inset 0 0 12px ${catColor}18`
    : `0 0 8px ${catColor}40, 0 0 2px ${catColor}30, inset 0 0 6px ${catColor}0a`;

  const boxStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    border: `1px solid ${catColor}60`,
    boxShadow: borderGlow,
    background: '#040408',
    overflow: 'hidden',
    position: 'relative',
    transition: 'box-shadow 0.2s ease',
  };

  const spriteStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    backgroundImage: `url(${imageSrc})`,
    backgroundSize: `${scaledImageW}px ${scaledImageH}px`,
    backgroundPosition: `${bpX}px ${bpY}px`,
    backgroundRepeat: 'no-repeat',
    imageRendering: 'pixelated',
    filter: isHovered
      ? `brightness(1.3) contrast(1.1) drop-shadow(0 0 6px ${catColor}cc)`
      : `brightness(1.05) contrast(1.05)`,
    transition: 'filter 0.2s ease',
  };

  // CRT scanline overlay — subtle alternating lines for retro feel
  const scanlineStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    background: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.18) 1px, rgba(0,0,0,0.18) 2px)',
    pointerEvents: 'none',
    zIndex: 2,
  };

  // Hover color wash
  const hoverWashStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    background: `${catColor}10`,
    pointerEvents: 'none',
    zIndex: 3,
    opacity: isHovered ? 1 : 0,
    transition: 'opacity 0.2s ease',
  };

  return (
    <div
      className={className}
      style={containerStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={boxStyle}>
        <div style={spriteStyle} />
        <div style={scanlineStyle} />
        <div style={hoverWashStyle} />
      </div>

      {showValue && value !== undefined && (
        <div style={{
          position: 'absolute', bottom: -5, right: -5,
          background: '#060609',
          border: `1px solid ${catColor}70`,
          borderRadius: 3,
          padding: '1px 5px',
          fontSize: Math.max(9, displayPx * 0.18),
          fontFamily: '"Courier New", monospace',
          color: catColor,
          fontWeight: 'bold',
          lineHeight: 1.3,
          zIndex: 10,
          boxShadow: `0 0 6px ${catColor}40`,
        }}>
          {value}
        </div>
      )}

      {showTooltip && statDef && isHovered && (
        <div style={{
          position: 'absolute', bottom: '100%', left: '50%',
          transform: 'translateX(-50%)',
          marginBottom: 8,
          background: '#08080f',
          border: `1px solid ${catColor}50`,
          borderRadius: 4,
          padding: '9px 12px',
          boxShadow: `0 0 20px #00000090, 0 0 10px ${catColor}20`,
          zIndex: 9999,
          width: 190,
          pointerEvents: 'none',
          whiteSpace: 'normal',
        }}>
          <div style={{ fontSize: 11, fontWeight: 'bold', color: catColor, marginBottom: 4, fontFamily: '"Courier New", monospace', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            {statDef.name}
          </div>
          <div style={{ fontSize: 10, color: '#ffffff65', lineHeight: 1.6 }}>{statDef.description}</div>
          {value !== undefined && (
            <div style={{ marginTop: 6, fontSize: 11, color: catColor, fontFamily: '"Courier New", monospace', fontWeight: 'bold' }}>
              VALUE: {value}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Category header icon + label ──────────────────────────────────────────────
interface StatCategoryHeaderProps {
  category: StatCategory;
  total?: number;
  className?: string;
}

export function StatCategoryHeader({ category, total, className = '' }: StatCategoryHeaderProps) {
  const categoryInfo = STAT_CATEGORIES[category];
  const catColor = CATEGORY_COLORS[category] ?? '#00ff88';
  return (
    <div className={className} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <StatIcon statKey={category} size="lg" showTooltip={false} glowColor={catColor} />
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

// ── Compact stat row (sidebar panels) ────────────────────────────────────────
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
