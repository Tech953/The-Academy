import { POLAR_CUB_ICONS, PERK_DATABASE, type Perk } from "@shared/perks";

// Import all polar cub images
import strongCub from "@assets/stock_images/cute_polar_bear_cub__98a707c7.jpg";
import smartCub from "@assets/stock_images/cute_polar_bear_cub__ec414e02.jpg";
import socialCub from "@assets/stock_images/cute_polar_bear_cub__5ff14998.jpg";
import stealthCub from "@assets/stock_images/cute_polar_bear_cub__da0b1b5b.jpg";
import mysticalCub from "@assets/stock_images/cute_polar_bear_cub__392eeae5.jpg";

// Map icon keys to imported images
const CUB_IMAGE_MAP = {
  strong: strongCub,
  smart: smartCub,
  social: socialCub,
  stealth: stealthCub,
  mystical: mysticalCub
} as const;

interface PerkIconProps {
  perkId: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showTooltip?: boolean;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12', 
  lg: 'w-16 h-16',
  xl: 'w-24 h-24'
};

export function PerkIcon({ perkId, size = 'md', className = '', showTooltip = true }: PerkIconProps) {
  const perk = PERK_DATABASE[perkId];
  
  if (!perk) {
    return (
      <div className={`${sizeClasses[size]} bg-muted rounded-md flex items-center justify-center ${className}`}>
        <span className="text-xs text-muted-foreground">?</span>
      </div>
    );
  }

  const cubImage = CUB_IMAGE_MAP[perk.iconKey as keyof typeof CUB_IMAGE_MAP];
  
  // Get category color for border
  const categoryColors = {
    combat: 'border-red-500 shadow-red-500/20',
    academic: 'border-blue-500 shadow-blue-500/20', 
    social: 'border-green-500 shadow-green-500/20',
    survival: 'border-yellow-500 shadow-yellow-500/20',
    mystical: 'border-purple-500 shadow-purple-500/20'
  };

  // Get rarity glow effect
  const rarityGlow = {
    common: 'shadow-sm',
    uncommon: 'shadow-md shadow-green-500/30',
    rare: 'shadow-lg shadow-blue-500/40', 
    legendary: 'shadow-xl shadow-yellow-500/50 animate-pulse'
  };

  return (
    <div 
      className={`
        ${sizeClasses[size]} 
        ${categoryColors[perk.category]}
        ${rarityGlow[perk.rarity]}
        border-2 rounded-lg overflow-hidden 
        hover-elevate transition-all duration-200 
        relative group cursor-pointer
        ${className}
      `}
      data-testid={`perk-icon-${perkId}`}
    >
      <img 
        src={cubImage}
        alt={`${perk.name} - ${perk.description}`}
        className="w-full h-full object-cover"
      />
      
      {/* Rarity indicator overlay */}
      {perk.rarity !== 'common' && (
        <div className={`
          absolute top-0 right-0 w-3 h-3 rounded-bl-md
          ${perk.rarity === 'uncommon' ? 'bg-green-500' : 
            perk.rarity === 'rare' ? 'bg-blue-500' : 
            'bg-yellow-500'}
        `} />
      )}

      {/* Tooltip on hover */}
      {showTooltip && (
        <div className="
          absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2
          opacity-0 group-hover:opacity-100 transition-opacity duration-200
          bg-background border border-border rounded-md p-3 shadow-lg z-50
          w-64 pointer-events-none
        ">
          <h4 className="font-mono font-bold text-accent text-sm mb-1">{perk.name}</h4>
          <p className="font-mono text-xs text-muted-foreground mb-2">{perk.description}</p>
          
          <div className="space-y-1">
            {perk.effects.map((effect, index) => (
              <div key={index} className="text-xs font-mono">
                <span className="text-accent">→</span>
                <span className="text-foreground ml-1">{effect.description}</span>
              </div>
            ))}
          </div>
          
          <div className="flex justify-between items-center mt-2 text-xs">
            <span className={`
              font-mono capitalize
              ${perk.category === 'combat' ? 'text-red-500' :
                perk.category === 'academic' ? 'text-blue-500' :
                perk.category === 'social' ? 'text-green-500' :
                perk.category === 'survival' ? 'text-yellow-500' :
                'text-purple-500'}
            `}>
              {perk.category}
            </span>
            <span className={`
              font-mono capitalize
              ${perk.rarity === 'common' ? 'text-muted-foreground' :
                perk.rarity === 'uncommon' ? 'text-green-500' :
                perk.rarity === 'rare' ? 'text-blue-500' :
                'text-yellow-500'}
            `}>
              {perk.rarity}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default PerkIcon;