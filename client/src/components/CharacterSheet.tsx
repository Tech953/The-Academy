import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { User, BookOpen, Users, Zap, Star } from 'lucide-react';
import PerkIcon from '@/components/ui/perk-icon';
import { applyPerkEffects, type CharacterPerk } from '@shared/perks';

export interface Character {
  name: string;
  background: string;
  race?: string;
  class?: string;
  subClass?: string;
  faction?: string;
  stats: {
    perception?: number;
    intelligence?: number;
    charisma?: number;
    dexterity?: number;
    strength?: number;
    health?: number;
    endurance?: number;
    // Legacy stats for backward compatibility
    intellect?: number;
    intuition?: number;
    resilience?: number;
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
  const getReputationColor = (value: number) => {
    if (value >= 70) return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (value >= 40) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    return 'bg-red-500/20 text-red-400 border-red-500/30';
  };

  // Apply perk effects to stats
  const baseStats = {
    perception: character.stats.perception || character.stats.intellect || 50,
    intelligence: character.stats.intelligence || character.stats.intellect || 50,
    charisma: character.stats.charisma || 50,
    dexterity: character.stats.dexterity || character.stats.intuition || 50,
    strength: character.stats.strength || character.stats.resilience || 50,
    health: character.stats.health || 100,
    endurance: character.stats.endurance || 50
  };
  
  const modifiedStats = character.perks ? applyPerkEffects(baseStats, character.perks) : baseStats;

  return (
    <Card className={`bg-card/80 border-primary/20 ${className}`} data-testid="character-sheet">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-mono">
          <User className="h-4 w-4 text-primary" />
          Character Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Basic Info */}
        <div className="space-y-2">
          <div>
            <div className="text-sm font-medium" data-testid="text-character-name">{character.name}</div>
            <div className="text-xs text-muted-foreground">{character.background}</div>
            {character.race && character.class && (
              <div className="flex gap-1 mt-1">
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

        {/* Stats */}
        <div className="space-y-2">
          <div className="text-xs font-mono text-accent">Core Attributes</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between">
              <span>Perception:</span>
              <span className={modifiedStats.perception !== baseStats.perception ? 'text-accent font-bold' : ''}>
                {modifiedStats.perception}
                {modifiedStats.perception !== baseStats.perception && (
                  <span className="text-accent ml-1">
                    ({modifiedStats.perception > baseStats.perception ? '+' : ''}{modifiedStats.perception - baseStats.perception})
                  </span>
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Intelligence:</span>
              <span className={modifiedStats.intelligence !== baseStats.intelligence ? 'text-accent font-bold' : ''}>
                {modifiedStats.intelligence}
                {modifiedStats.intelligence !== baseStats.intelligence && (
                  <span className="text-accent ml-1">
                    ({modifiedStats.intelligence > baseStats.intelligence ? '+' : ''}{modifiedStats.intelligence - baseStats.intelligence})
                  </span>
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Charisma:</span>
              <span className={modifiedStats.charisma !== baseStats.charisma ? 'text-accent font-bold' : ''}>
                {modifiedStats.charisma}
                {modifiedStats.charisma !== baseStats.charisma && (
                  <span className="text-accent ml-1">
                    ({modifiedStats.charisma > baseStats.charisma ? '+' : ''}{modifiedStats.charisma - baseStats.charisma})
                  </span>
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Dexterity:</span>
              <span className={modifiedStats.dexterity !== baseStats.dexterity ? 'text-accent font-bold' : ''}>
                {modifiedStats.dexterity}
                {modifiedStats.dexterity !== baseStats.dexterity && (
                  <span className="text-accent ml-1">
                    ({modifiedStats.dexterity > baseStats.dexterity ? '+' : ''}{modifiedStats.dexterity - baseStats.dexterity})
                  </span>
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Strength:</span>
              <span className={modifiedStats.strength !== baseStats.strength ? 'text-accent font-bold' : ''}>
                {modifiedStats.strength}
                {modifiedStats.strength !== baseStats.strength && (
                  <span className="text-accent ml-1">
                    ({modifiedStats.strength > baseStats.strength ? '+' : ''}{modifiedStats.strength - baseStats.strength})
                  </span>
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Endurance:</span>
              <span className={modifiedStats.endurance !== baseStats.endurance ? 'text-accent font-bold' : ''}>
                {modifiedStats.endurance}
                {modifiedStats.endurance !== baseStats.endurance && (
                  <span className="text-accent ml-1">
                    ({modifiedStats.endurance > baseStats.endurance ? '+' : ''}{modifiedStats.endurance - baseStats.endurance})
                  </span>
                )}
              </span>
            </div>
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