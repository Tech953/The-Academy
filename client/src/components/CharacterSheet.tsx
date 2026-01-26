import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { User, BookOpen, Users, Zap, Star, ChevronDown, ChevronUp } from 'lucide-react';
import PerkIcon from '@/components/ui/perk-icon';
import { applyPerkEffects, type CharacterPerk } from '@shared/perks';
import { 
  PHYSICAL_STATS, 
  MENTAL_STATS, 
  SPIRITUAL_STATS,
  STAT_CATEGORIES,
  getCategoryTotal,
  mapLegacyStats,
  type FullCharacterStats,
  type StatCategory
} from '@shared/stats';
import StatIcon, { StatCategoryHeader, StatRow } from '@/components/ui/stat-icon';
import BearMascot, { type BearAnimation } from '@/components/BearMascot';
import { useState } from 'react';

export interface Character {
  name: string;
  background: string;
  race?: string;
  class?: string;
  subClass?: string;
  faction?: string;
  characterSummary?: string;
  physicalTraits?: Record<string, string>;
  stats: Partial<FullCharacterStats> & {
    // Legacy stats for backward compatibility
    perception?: number;
    intelligence?: number;
    charisma?: number;
    dexterity?: number;
    health?: number;
    // New stats are included via FullCharacterStats
  };
  reputation: {
    faculty: number;
    students: number;
    mysterious: number;
  };
  currentClass?: string;
  energy: number;
  maxEnergy: number;
  perks?: CharacterPerk[];
}

interface CharacterSheetProps {
  character: Character;
  className?: string;
}

export default function CharacterSheet({ character, className = "" }: CharacterSheetProps) {
  const [expandedCategory, setExpandedCategory] = useState<StatCategory | null>(null);
  
  const getReputationColor = (value: number) => {
    if (value >= 70) return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (value >= 40) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    return 'bg-red-500/20 text-red-400 border-red-500/30';
  };

  const getBearAnimation = (): BearAnimation => {
    const energyPercent = character.energy / character.maxEnergy;
    if (energyPercent >= 0.8) return 'celebrate';
    if (energyPercent >= 0.5) return 'idle';
    if (energyPercent >= 0.3) return 'think';
    return 'sleep';
  };

  // Convert legacy stats to new system if needed
  const hasNewStats = 'quickness' in character.stats || 'mathLogic' in character.stats || 'faith' in character.stats;
  
  const fullStats: FullCharacterStats = hasNewStats 
    ? {
        // Physical
        quickness: character.stats.quickness || 10,
        endurance: character.stats.endurance || 10,
        agility: character.stats.agility || 10,
        speed: character.stats.speed || 10,
        strength: character.stats.strength || 10,
        // Mental
        mathLogic: character.stats.mathLogic || 10,
        linguistic: character.stats.linguistic || 10,
        presence: character.stats.presence || 10,
        fortitude: character.stats.fortitude || 10,
        musicCreative: character.stats.musicCreative || 10,
        // Spiritual
        faith: character.stats.faith || 5,
        karma: character.stats.karma || 50,
        resonance: character.stats.resonance || 5,
        luck: character.stats.luck || 10,
        chi: character.stats.chi || 10,
        nagual: character.stats.nagual || 0,
        ashe: character.stats.ashe || 0
      }
    : mapLegacyStats(character.stats) as FullCharacterStats;

  // Calculate category totals
  const physicalTotal = getCategoryTotal(fullStats, 'physical');
  const mentalTotal = getCategoryTotal(fullStats, 'mental');
  const spiritualTotal = getCategoryTotal(fullStats, 'spiritual');

  const toggleCategory = (category: StatCategory) => {
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  return (
    <Card className={`bg-card/80 border-primary/20 ${className}`} data-testid="character-sheet">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <BearMascot 
            animation={getBearAnimation()} 
            size="sm" 
            glowIntensity="low"
          />
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2 text-sm font-mono">
              <User className="h-4 w-4 text-primary" />
              Character Profile
            </CardTitle>
            <div className="text-xs text-muted-foreground mt-1">Academy Guardian watching over you</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Basic Info */}
        <div className="space-y-2">
          <div>
            <div className="text-sm font-medium" data-testid="text-character-name">{character.name}</div>
            <div className="text-xs text-muted-foreground">{character.background}</div>
            {character.race && character.class && (
              <div className="flex gap-1 mt-1 flex-wrap">
                <Badge variant="outline" className="text-xs">{character.race}</Badge>
                <Badge variant="outline" className="text-xs">{character.class}</Badge>
                {character.faction && <Badge variant="secondary" className="text-xs">{character.faction}</Badge>}
              </div>
            )}
          </div>
          
          {/* Energy */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs">
              <Zap className="h-3 w-3 text-accent" />
              <span>Energy: {character.energy}/{character.maxEnergy}</span>
            </div>
            <Progress 
              value={(character.energy / character.maxEnergy) * 100} 
              className="h-2" 
            />
          </div>
        </div>

        {/* Stats - New 3-tier system with icons */}
        <div className="space-y-3">
          <div className="text-xs font-mono text-accent">Core Attributes</div>
          
          {/* Physical Stats */}
          <div 
            className="border border-green-500/20 rounded-md overflow-hidden cursor-pointer"
            onClick={() => toggleCategory('physical')}
          >
            <div className="flex items-center justify-between p-2 bg-green-500/5 hover:bg-green-500/10 transition-colors">
              <div className="flex items-center gap-2">
                <StatIcon statKey="physical" size="xs" showTooltip={false} />
                <span className="text-xs font-mono text-green-400">Physical</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-green-300">{physicalTotal}</span>
                {expandedCategory === 'physical' ? (
                  <ChevronUp className="h-3 w-3 text-green-400" />
                ) : (
                  <ChevronDown className="h-3 w-3 text-green-400" />
                )}
              </div>
            </div>
            {expandedCategory === 'physical' && (
              <div className="p-2 space-y-1 bg-green-500/5">
                {PHYSICAL_STATS.map(stat => (
                  <StatRow 
                    key={stat.id}
                    stat={stat}
                    value={fullStats[stat.id as keyof FullCharacterStats] as number}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Mental Stats */}
          <div 
            className="border border-blue-500/20 rounded-md overflow-hidden cursor-pointer"
            onClick={() => toggleCategory('mental')}
          >
            <div className="flex items-center justify-between p-2 bg-blue-500/5 hover:bg-blue-500/10 transition-colors">
              <div className="flex items-center gap-2">
                <StatIcon statKey="mental" size="xs" showTooltip={false} />
                <span className="text-xs font-mono text-blue-400">Mental</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-blue-300">{mentalTotal}</span>
                {expandedCategory === 'mental' ? (
                  <ChevronUp className="h-3 w-3 text-blue-400" />
                ) : (
                  <ChevronDown className="h-3 w-3 text-blue-400" />
                )}
              </div>
            </div>
            {expandedCategory === 'mental' && (
              <div className="p-2 space-y-1 bg-blue-500/5">
                {MENTAL_STATS.map(stat => (
                  <StatRow 
                    key={stat.id}
                    stat={stat}
                    value={fullStats[stat.id as keyof FullCharacterStats] as number}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Spiritual Stats */}
          <div 
            className="border border-purple-500/20 rounded-md overflow-hidden cursor-pointer"
            onClick={() => toggleCategory('spiritual')}
          >
            <div className="flex items-center justify-between p-2 bg-purple-500/5 hover:bg-purple-500/10 transition-colors">
              <div className="flex items-center gap-2">
                <StatIcon statKey="spiritual" size="xs" showTooltip={false} />
                <span className="text-xs font-mono text-purple-400">Spiritual</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-purple-300">{spiritualTotal}</span>
                {expandedCategory === 'spiritual' ? (
                  <ChevronUp className="h-3 w-3 text-purple-400" />
                ) : (
                  <ChevronDown className="h-3 w-3 text-purple-400" />
                )}
              </div>
            </div>
            {expandedCategory === 'spiritual' && (
              <div className="p-2 space-y-1 bg-purple-500/5">
                {SPIRITUAL_STATS.map(stat => (
                  <StatRow 
                    key={stat.id}
                    stat={stat}
                    value={fullStats[stat.id as keyof FullCharacterStats] as number}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Reputation */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono text-accent">
            <Users className="h-3 w-3" />
            Reputation
          </div>
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-xs">Faculty</span>
              <Badge variant="outline" className={getReputationColor(character.reputation.faculty)}>
                {character.reputation.faculty}%
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs">Students</span>
              <Badge variant="outline" className={getReputationColor(character.reputation.students)}>
                {character.reputation.students}%
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs">Mysterious Forces</span>
              <Badge variant="outline" className={getReputationColor(character.reputation.mysterious)}>
                {character.reputation.mysterious}%
              </Badge>
            </div>
          </div>
        </div>

        {/* Current Class */}
        {character.currentClass && (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono text-accent">
              <BookOpen className="h-3 w-3" />
              Current Class
            </div>
            <div className="text-xs text-foreground">{character.currentClass}</div>
          </div>
        )}

        {/* Perks */}
        {character.perks && character.perks.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono text-accent">
              <Star className="h-3 w-3" />
              Active Perks
            </div>
            <div className="flex flex-wrap gap-2">
              {character.perks.slice(0, 4).map((perk, index) => (
                <PerkIcon 
                  key={perk.perkId}
                  perkId={perk.perkId}
                  size="sm"
                  data-testid={`character-perk-${perk.perkId}`}
                />
              ))}
              {character.perks.length > 4 && (
                <div className="w-8 h-8 bg-muted rounded-md flex items-center justify-center">
                  <span className="text-xs text-muted-foreground font-mono">
                    +{character.perks.length - 4}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
