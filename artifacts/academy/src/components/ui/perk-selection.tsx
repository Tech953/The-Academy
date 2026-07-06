import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import PerkIcon from "@/components/ui/perk-icon";
import { PERK_DATABASE, getPerksByCategory, getAvailablePerks, type Perk, type CharacterPerk } from "@shared/perks";
import { type GameStats } from "@shared/schema";

interface PerkSelectionProps {
  characterStats: GameStats;
  currentPerks: CharacterPerk[];
  availablePoints?: number;
  onPerkSelect?: (perkId: string) => void;
  onPerkRemove?: (perkId: string) => void;
  readOnly?: boolean;
  showCategories?: boolean;
}

export function PerkSelection({ 
  characterStats, 
  currentPerks, 
  availablePoints = 0,
  onPerkSelect,
  onPerkRemove,
  readOnly = false,
  showCategories = true 
}: PerkSelectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<Perk['category']>('combat');
  
  const character = { stats: characterStats as Record<string, number>, perks: currentPerks };
  const availablePerks = getAvailablePerks(character);
  const unlockedPerkIds = currentPerks.map(p => p.perkId);
  
  const categories: { key: Perk['category'], label: string, icon: string }[] = [
    { key: 'combat', label: 'Combat', icon: '⚔️' },
    { key: 'academic', label: 'Academic', icon: '📚' },
    { key: 'social', label: 'Social', icon: '👥' },
    { key: 'survival', label: 'Survival', icon: '🌲' },
    { key: 'mystical', label: 'Mystical', icon: '✨' }
  ];

  const renderPerkCard = (perk: Perk, isUnlocked: boolean, isAvailable: boolean) => (
    <Card 
      key={perk.id}
      className={`
        hover-elevate transition-all duration-200 cursor-pointer
        ${isUnlocked ? 'border-accent bg-accent/5' : 
          isAvailable ? 'border-muted-foreground/20' : 
          'border-muted-foreground/10 opacity-50'}
      `}
      data-testid={`perk-card-${perk.id}`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start gap-3">
          <PerkIcon 
            perkId={perk.id} 
            size="lg" 
            showTooltip={false}
            className="flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <CardTitle className="font-mono text-sm">{perk.name}</CardTitle>
              <Badge 
                variant="outline" 
                className={`
                  text-xs font-mono
                  ${perk.rarity === 'common' ? 'border-muted-foreground/50' :
                    perk.rarity === 'uncommon' ? 'border-green-500 text-green-500' :
                    perk.rarity === 'rare' ? 'border-blue-500 text-blue-500' :
                    'border-yellow-500 text-yellow-500'}
                `}
              >
                {perk.rarity}
              </Badge>
            </div>
            <p className="font-mono text-xs text-muted-foreground mt-1 line-clamp-2">
              {perk.description}
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-2">
          {/* Effects */}
          <div className="space-y-1">
            {perk.effects.map((effect, index) => (
              <div key={index} className="flex items-center gap-2 text-xs font-mono">
                <span className="text-accent">→</span>
                <span className="text-foreground">{effect.description}</span>
              </div>
            ))}
          </div>
          
          {/* Prerequisites */}
          {perk.prerequisites && (
            <div className="space-y-1 pt-2 border-t border-border">
              <span className="text-xs font-mono text-muted-foreground">Requirements:</span>
              {perk.prerequisites.stats && (
                <div className="flex flex-wrap gap-1">
                  {Object.entries(perk.prerequisites.stats).map(([stat, value]) => (
                    <Badge 
                      key={stat}
                      variant="secondary" 
                      className={`
                        text-xs font-mono
                        ${(characterStats[stat as keyof GameStats] || 0) >= value 
                          ? 'bg-green-500/20 text-green-600' 
                          : 'bg-red-500/20 text-red-600'}
                      `}
                    >
                      {stat}: {value}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Action buttons */}
          {!readOnly && (
            <div className="flex gap-2 pt-2">
              {isUnlocked ? (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => onPerkRemove?.(perk.id)}
                  className="font-mono text-xs"
                  data-testid={`button-remove-perk-${perk.id}`}
                >
                  Remove
                </Button>
              ) : isAvailable && availablePoints > 0 ? (
                <Button 
                  size="sm"
                  onClick={() => onPerkSelect?.(perk.id)}
                  className="font-mono text-xs"
                  data-testid={`button-select-perk-${perk.id}`}
                >
                  Select ({availablePoints} pts)
                </Button>
              ) : (
                <Button 
                  size="sm" 
                  variant="ghost" 
                  disabled 
                  className="font-mono text-xs"
                >
                  {!isAvailable ? 'Locked' : 'No Points'}
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (!showCategories) {
    // Simple list view for character sheet
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-mono text-lg">Perks</h3>
          {!readOnly && (
            <Badge variant="outline" className="font-mono">
              Points: {availablePoints}
            </Badge>
          )}
        </div>
        
        <ScrollArea className="h-64">
          <div className="grid gap-3">
            {currentPerks.map(characterPerk => {
              const perk = PERK_DATABASE[characterPerk.perkId];
              return perk ? renderPerkCard(perk, true, true) : null;
            })}
            
            {!readOnly && availablePerks.slice(0, 5).map(perk => 
              renderPerkCard(perk, false, true)
            )}
          </div>
        </ScrollArea>
      </div>
    );
  }

  // Full category-based view
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-mono text-lg">Perk Selection</h3>
        {!readOnly && (
          <Badge variant="outline" className="font-mono">
            Available Points: {availablePoints}
          </Badge>
        )}
      </div>

      <Tabs value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as Perk['category'])}>
        <TabsList className="grid w-full grid-cols-5">
          {categories.map(category => (
            <TabsTrigger 
              key={category.key} 
              value={category.key}
              className="font-mono text-xs"
              data-testid={`tab-perk-category-${category.key}`}
            >
              <span className="mr-1">{category.icon}</span>
              {category.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map(category => (
          <TabsContent key={category.key} value={category.key} className="mt-4">
            <ScrollArea className="h-96">
              <div className="grid gap-3">
                {getPerksByCategory(category.key).map(perk => {
                  const isUnlocked = unlockedPerkIds.includes(perk.id);
                  const isAvailable = availablePerks.some(ap => ap.id === perk.id);
                  return renderPerkCard(perk, isUnlocked, isAvailable);
                })}
              </div>
            </ScrollArea>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

export default PerkSelection;