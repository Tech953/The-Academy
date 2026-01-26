import { useState } from 'react';
import { 
  STAT_ICONS, 
  ALL_STATS, 
  STAT_CATEGORIES,
  type StatKey,
  type StatCategory,
  type StatDefinition
} from '@shared/stats';

// Import stat icon images
import physicalMentalSpiritualImg from '@assets/STAT_ICON_PROTOTYPE_1769387147172.png';
import physicalStatsImg from '@assets/STAT_ICON_PROTOTYPE_2_1769387147169.png';
import mentalStatsImg from '@assets/STAT_ICON_PROTOTYPE_3_1769387147170.png';
import spiritualStatsImg from '@assets/STAT_ICON_PROTOTYPE_4_1769387147171.png';

// Icon position mapping for sprite-like cropping within the composite images
// Each stat icon is a portion of the larger image
const ICON_POSITIONS: Record<StatKey, { row: number; col: number; totalCols: number; totalRows: number; imageKey: 'main' | 'physical' | 'mental' | 'spiritual' }> = {
  // Main categories (from prototype 1 - 3 icons in a row)
  physical: { row: 0, col: 0, totalCols: 3, totalRows: 1, imageKey: 'main' },
  mental: { row: 0, col: 1, totalCols: 3, totalRows: 1, imageKey: 'main' },
  spiritual: { row: 0, col: 2, totalCols: 3, totalRows: 1, imageKey: 'main' },
  
  // Physical stats (from prototype 2 - 3 top, 2 bottom)
  quickness: { row: 0, col: 0, totalCols: 3, totalRows: 2, imageKey: 'physical' },
  endurance: { row: 0, col: 1, totalCols: 3, totalRows: 2, imageKey: 'physical' },
  agility: { row: 0, col: 2, totalCols: 3, totalRows: 2, imageKey: 'physical' },
  speed: { row: 1, col: 0, totalCols: 2, totalRows: 2, imageKey: 'physical' },
  strength: { row: 1, col: 1, totalCols: 2, totalRows: 2, imageKey: 'physical' },
  
  // Mental stats (from prototype 3 - 3 top, 2 bottom)
  mathLogic: { row: 0, col: 0, totalCols: 3, totalRows: 2, imageKey: 'mental' },
  linguistic: { row: 0, col: 1, totalCols: 3, totalRows: 2, imageKey: 'mental' },
  presence: { row: 0, col: 2, totalCols: 3, totalRows: 2, imageKey: 'mental' },
  fortitude: { row: 1, col: 0, totalCols: 2, totalRows: 2, imageKey: 'mental' },
  musicCreative: { row: 1, col: 1, totalCols: 2, totalRows: 2, imageKey: 'mental' },
  
  // Spiritual stats (from prototype 4 - 3 top, 4 bottom)
  faith: { row: 0, col: 0, totalCols: 3, totalRows: 2, imageKey: 'spiritual' },
  karma: { row: 0, col: 1, totalCols: 3, totalRows: 2, imageKey: 'spiritual' },
  resonance: { row: 0, col: 2, totalCols: 3, totalRows: 2, imageKey: 'spiritual' },
  luck: { row: 1, col: 0, totalCols: 4, totalRows: 2, imageKey: 'spiritual' },
  chi: { row: 1, col: 1, totalCols: 4, totalRows: 2, imageKey: 'spiritual' },
  nagual: { row: 1, col: 2, totalCols: 4, totalRows: 2, imageKey: 'spiritual' },
  ashe: { row: 1, col: 3, totalCols: 4, totalRows: 2, imageKey: 'spiritual' },
};

const IMAGES = {
  main: physicalMentalSpiritualImg,
  physical: physicalStatsImg,
  mental: mentalStatsImg,
  spiritual: spiritualStatsImg
};

interface StatIconProps {
  statKey: StatKey;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  showValue?: boolean;
  value?: number;
  className?: string;
}

export default function StatIcon({ 
  statKey, 
  size = 'md', 
  showTooltip = true,
  showValue = false,
  value,
  className = '' 
}: StatIconProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const position = ICON_POSITIONS[statKey];
  const imageSrc = IMAGES[position.imageKey];
  
  // Find stat definition for tooltip
  const statDef = ALL_STATS.find(s => s.id === statKey) || 
    (statKey === 'physical' || statKey === 'mental' || statKey === 'spiritual' 
      ? { name: STAT_CATEGORIES[statKey as StatCategory].name, description: STAT_CATEGORIES[statKey as StatCategory].description }
      : null);
  
  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };
  
  // Calculate crop position as percentage
  const widthPercent = 100 / position.totalCols;
  const heightPercent = 100 / position.totalRows;
  const leftPercent = position.col * widthPercent;
  const topPercent = position.row * heightPercent;

  return (
    <div 
      className={`relative group ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div 
        className={`
          ${sizeClasses[size]} 
          rounded-md overflow-hidden
          border border-primary/30
          bg-black/50
          relative
        `}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${imageSrc})`,
            backgroundSize: `${position.totalCols * 100}% ${position.totalRows * 100}%`,
            backgroundPosition: `${(position.col / (position.totalCols - 1)) * 100}% ${(position.row / (position.totalRows - 1)) * 100}%`,
          }}
        />
        
        {/* Glow effect on hover */}
        {isHovered && (
          <div className="absolute inset-0 bg-primary/20 animate-pulse" />
        )}
      </div>
      
      {/* Value display */}
      {showValue && value !== undefined && (
        <div className="absolute -bottom-1 -right-1 bg-background border border-primary/50 rounded px-1 text-xs font-mono text-primary">
          {value}
        </div>
      )}
      
      {/* Tooltip */}
      {showTooltip && statDef && isHovered && (
        <div className="
          absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2
          bg-background border border-border rounded-md p-2 shadow-lg z-50
          w-48 pointer-events-none
          text-xs
        ">
          <div className="font-bold text-primary mb-1">{statDef.name}</div>
          <div className="text-muted-foreground">{statDef.description}</div>
          {value !== undefined && (
            <div className="mt-1 text-accent font-mono">Value: {value}</div>
          )}
        </div>
      )}
    </div>
  );
}

// Category header component
interface StatCategoryHeaderProps {
  category: StatCategory;
  total?: number;
  className?: string;
}

export function StatCategoryHeader({ category, total, className = '' }: StatCategoryHeaderProps) {
  const categoryInfo = STAT_CATEGORIES[category];
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <StatIcon statKey={category} size="sm" showTooltip={false} />
      <div className="flex-1">
        <div className="font-mono text-sm text-primary">{categoryInfo.name}</div>
        <div className="text-xs text-muted-foreground">{categoryInfo.description}</div>
      </div>
      {total !== undefined && (
        <div className="text-xs font-mono text-accent bg-accent/10 px-2 py-1 rounded">
          Total: {total}
        </div>
      )}
    </div>
  );
}

// Stat row component for displaying a single stat with icon and bar
interface StatRowProps {
  stat: StatDefinition;
  value: number;
  maxValue?: number;
  showBar?: boolean;
  compact?: boolean;
}

export function StatRow({ stat, value, maxValue = 100, showBar = true, compact = false }: StatRowProps) {
  const barWidth = Math.min((value / maxValue) * 100, 100);
  
  const getBarColor = () => {
    if (stat.category === 'physical') return 'bg-green-500';
    if (stat.category === 'mental') return 'bg-blue-500';
    return 'bg-purple-500';
  };
  
  if (compact) {
    return (
      <div className="flex items-center gap-1 text-xs">
        <span className="text-muted-foreground w-8">{stat.abbreviation}</span>
        <span className="font-mono text-primary">{value}</span>
      </div>
    );
  }
  
  return (
    <div className="flex items-center gap-2 py-1">
      <StatIcon statKey={stat.iconKey} size="xs" showTooltip />
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center text-xs">
          <span className="truncate">{stat.name}</span>
          <span className="font-mono text-primary ml-2">{value}</span>
        </div>
        {showBar && (
          <div className="h-1 bg-muted rounded-full mt-0.5 overflow-hidden">
            <div 
              className={`h-full ${getBarColor()} transition-all duration-300`}
              style={{ width: `${barWidth}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
