import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { User, BookOpen, Users, Zap } from 'lucide-react';

export interface Character {
  name: string;
  background: string;
  stats: {
    intellect: number;
    charisma: number;
    intuition: number;
    resilience: number;
  };
  reputation: {
    faculty: number;
    students: number;
    mysterious: number;
  };
  currentClass?: string;
  energy: number;
  maxEnergy: number;
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
            <div>Intellect: {character.stats.intellect}</div>
            <div>Charisma: {character.stats.charisma}</div>
            <div>Intuition: {character.stats.intuition}</div>
            <div>Resilience: {character.stats.resilience}</div>
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
      </CardContent>
    </Card>
  );
}