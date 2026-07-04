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

// All sprite sheets: 1536×1024px
// Main categories sheet:  3 cols × 2 rows → cell = 512×512 (mascots in row 0)
// Physical stats sheet:   3 cols × 2 rows → cell = 512×512
// Mental stats sheet:     3 cols × 2 rows → cell = 512×512
// Spiritual stats sheet:  4 cols × 2 rows → cell = 384×512 (portrait)
const ICON_POSITIONS: Record<StatKey, {
  row: number; col: number;
  cellW: number; cellH: number;
  imageKey: 'main' | 'physical' | 'mental' | 'spiritual';
}> = {
  physical:      { row: 0, col: 0, cellW: 512, cellH: 512, imageKey: 'main' },
  mental:        { row: 0, col: 1, cellW: 512, cellH: 512, imageKey: 'main' },
  spiritual:     { row: 0, col: 2, cellW: 512, cellH: 512, imageKey: 'main' },

  quickness:     { row: 0, col: 0, cellW: 512, cellH: 512, imageKey: 'physical' },
  endurance:     { row: 0, col: 1, cellW: 512, cellH: 512, imageKey: 'physical' },
  agility:       { row: 0, col: 2, cellW: 512, cellH: 512, imageKey: 'physical' },
  speed:         { row: 1, col: 0, cellW: 512, cellH: 512, imageKey: 'physical' },
  strength:      { row: 1, col: 1, cellW: 512, cellH: 512, imageKey: 'physical' },

  mathLogic:     { row: 0, col: 0, cellW: 512, cellH: 512, imageKey: 'mental' },
  linguistic:    { row: 0, col: 1, cellW: 512, cellH: 512, imageKey: 'mental' },
  presence:      { row: 0, col: 2, cellW: 512, cellH: 512, imageKey: 'mental' },
  fortitude:     { row: 1, col: 0, cellW: 512, cellH: 512, imageKey: 'mental' },
  musicCreative: { row: 1, col: 1, cellW: 512, cellH: 512, imageKey: 'mental' },

  faith:         { row: 0, col: 0, cellW: 384, cellH: 512, imageKey: 'spiritual' },
  karma:         { row: 0, col: 1, cellW: 384, cellH: 512, imageKey: 'spiritual' },
  resonance:     { row: 0, col: 2, cellW: 384, cellH: 512, imageKey: 'spiritual' },
  luck:          { row: 1, col: 0, cellW: 384, cellH: 512, imageKey: 'spiritual' },
  chi:           { row: 1, col: 1, cellW: 384, cellH: 512, imageKey: 'spiritual' },
  nagual:        { row: 1, col: 2, cellW: 384, cellH: 512, imageKey: 'spiritual' },
  ashe:          { row: 1, col: 3, cellW: 384, cellH: 512, imageKey: 'spiritual' },
};

const IMAGE_DIMS = { w: 1536, h: 1024 };

const IMAGES = {
  main:      physicalMentalSpiritualImg,
  physical:  physicalStatsImg,
  mental:    mentalStatsImg,
  spiritual: spiritualStatsImg,
};

export const CATEGORY_COLORS: Record<string, string> = {
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

// Display sizes
const SIZE_PX: Record<string, number> = {
  xxs: 24,  // tiny inline (PerksViewer compact chips)
  xs:  32,  // small (stat list rows)
  sm:  40,  // medium-small (category headers)
  md:  52,  // medium (detail panel secondary)
  lg:  68,  // large (detail panel primary)
  xl:  88,  // xlarge (hero display)
  xxl: 112, // hero/standalone
};

// ── Sprite centering math ─────────────────────────────────────────────────────
// The bears tend to occupy the bottom ~75% of each sprite cell.
// We zoom in by 1/CROP (≈1.33×) so the cell is larger than the box, then
// crop to show: horizontally centered, vertically focused on the lower portion.
const CROP = 0.75; // fraction of the cell to reveal

function computeSpritePx(displayPx: number, pos: typeof ICON_POSITIONS[StatKey]) {
  const largerDim = Math.max(pos.cellW, pos.cellH);
  // Scale so that CROP fraction of the larger dimension == displayPx
  const scale = displayPx / (largerDim * CROP);

  const scaledCellW = pos.cellW * scale;
  const scaledCellH = pos.cellH * scale;
  const scaledImageW = IMAGE_DIMS.w * scale;
  const scaledImageH = IMAGE_DIMS.h * scale;

  // Center horizontally within the cell
  const offsetX = (displayPx - scaledCellW) / 2;
  // Show the bottom CROP fraction vertically (crop off the empty top)
  const yStart = scaledCellH * (1 - CROP);
  const offsetY = -yStart;

  const bpX = -(pos.col * scaledCellW) + offsetX;
  const bpY = -(pos.row * scaledCellH) + offsetY;

  return { scaledImageW, scaledImageH, bpX, bpY };
}
// ─────────────────────────────────────────────────────────────────────────────

export interface StatIconProps {
  statKey: StatKey;
  size?: 'xxs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  showTooltip?: boolean;
  glowColor?: string;
  className?: string;
  style?: React.CSSProperties;
}

export default function StatIcon({
  statKey,
  size = 'xs',
  showTooltip = false,
  glowColor,
  className = '',
  style,
}: StatIconProps) {
  const [isHovered, setIsHovered] = useState(false);

  const pos = ICON_POSITIONS[statKey];
  if (!pos) return null;

  const imageSrc = IMAGES[pos.imageKey];
  const displayPx = SIZE_PX[size] ?? 32;
  const catColor = glowColor ?? getCategoryColor(statKey);

  const { scaledImageW, scaledImageH, bpX, bpY } = computeSpritePx(displayPx, pos);

  const statDef = ALL_STATS.find(s => s.id === statKey) ??
    (statKey === 'physical' || statKey === 'mental' || statKey === 'spiritual'
      ? { name: STAT_CATEGORIES[statKey as StatCategory].name, description: STAT_CATEGORIES[statKey as StatCategory].description }
      : null);

  // ── Outer container — strict size, clips everything ───────────────────────
  const containerStyle: React.CSSProperties = {
    position: 'relative',
    width: displayPx,
    height: displayPx,
    flexShrink: 0,
    overflow: 'hidden',   // ensures sprite never bleeds outside
    border: `1px solid ${catColor}55`,
    background: '#04040a',
    boxShadow: isHovered
      ? `0 0 10px ${catColor}70, inset 0 0 8px ${catColor}12`
      : `0 0 4px ${catColor}30`,
    transition: 'box-shadow 0.2s ease',
    ...style,
  };

  // ── Sprite img positioned with negative margins ───────────────────────────
  const imgStyle: React.CSSProperties = {
    position: 'absolute',
    left: bpX,
    top: bpY,
    width: scaledImageW,
    height: scaledImageH,
    imageRendering: 'pixelated',
    filter: isHovered
      ? `brightness(1.25) drop-shadow(0 0 4px ${catColor}aa)`
      : 'brightness(1.0)',
    transition: 'filter 0.2s ease',
    pointerEvents: 'none',
    userSelect: 'none',
  };

  // CRT scanlines overlaid on top of the sprite
  const scanlineStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    background: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.20) 1px, rgba(0,0,0,0.20) 2px)',
    pointerEvents: 'none',
    zIndex: 2,
  };

  return (
    <div
      className={className}
      style={containerStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <img
        src={imageSrc}
        alt={statDef?.name ?? statKey}
        draggable={false}
        style={imgStyle}
      />
      <div style={scanlineStyle} />

      {showTooltip && statDef && isHovered && (
        <div style={{
          position: 'absolute', bottom: '100%', left: '50%',
          transform: 'translateX(-50%)',
          marginBottom: 8,
          background: '#06060f',
          border: `1px solid ${catColor}50`,
          borderRadius: 3,
          padding: '8px 12px',
          boxShadow: `0 4px 20px #00000090, 0 0 10px ${catColor}18`,
          zIndex: 9999,
          width: 180,
          pointerEvents: 'none',
        }}>
          <div style={{ fontSize: 10, fontWeight: 'bold', color: catColor, marginBottom: 3, fontFamily: '"Courier New", monospace', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {statDef.name}
          </div>
          <div style={{ fontSize: 9, color: '#ffffff60', lineHeight: 1.6 }}>{statDef.description}</div>
        </div>
      )}
    </div>
  );
}

// ── Lightweight exports for use outside CharacterStatsApp ─────────────────────
export { CATEGORY_COLORS as StatCategoryColors };
