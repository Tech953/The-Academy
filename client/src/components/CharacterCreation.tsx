import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { User, Zap, Shield, Sword, Wand2 } from 'lucide-react';

interface CharacterCreationProps {
  onComplete: (character: any) => void;
}

export default function CharacterCreation({ onComplete }: CharacterCreationProps) {
  const [step, setStep] = useState(1);
  const [character, setCharacter] = useState({
    name: '',
    race: '',
    class: '',
    subClass: '',
    faction: '',
    background: '',
    stats: {
      perception: 50,
      intelligence: 50,
      charisma: 50,
      dexterity: 50,
      strength: 50,
      health: 100,
      endurance: 50
    }
  });

  const races = ['Human', 'Elf', 'Spirit', 'Mer-Person', 'Orc', 'Furret', 'Cartoon'];
  const classes = ['Bard', 'Samurai', 'Warlock', 'Ranger', 'Alchemist', 'Executioner'];
  const subClasses = ['Berserker', 'Assassin', 'Paladin', 'Demon', 'Angel', 'Beast Hunter', 'Lich', 'Lunar Guardian', 'Light Worker'];
  const factions = ['Archivist', 'Raider', 'Outcast', 'AI', 'Magi'];

  const getClassIcon = (className: string) => {
    switch (className) {
      case 'Bard': return <Wand2 className="h-4 w-4" />;
      case 'Samurai': return <Sword className="h-4 w-4" />;
      case 'Warlock': return <Zap className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  const getFactionDescription = (faction: string) => {
    switch (faction) {
      case 'Archivist': return 'Keepers of knowledge and ancient secrets';
      case 'Raider': return 'Bold explorers seeking power and adventure';
      case 'Outcast': return 'Independent spirits who forge their own path';
      case 'AI': return 'Technology-minded students embracing digital evolution';
      case 'Magi': return 'Masters of mystical arts and supernatural forces';
      default: return '';
    }
  };

  const handleComplete = () => {
    const fullCharacter = {
      ...character,
      background: `${character.race} ${character.class}`,
      reputation: {
        faculty: 50,
        students: 50,
        mysterious: 10
      },
      energy: 100,
      maxEnergy: 100,
      perks: [],
      currentClass: 'Orientation'
    };
    onComplete(fullCharacter);
  };

  return (
    <div className="min-h-screen bg-background p-6 flex items-center justify-center" data-testid="character-creation">
      <Card className="w-full max-w-2xl bg-card/80 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary font-mono">
            <User className="h-5 w-5" />
            Character Creation - Step {step} of 4
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-mono text-accent">Welcome to The Academy</h3>
                <p className="text-sm text-muted-foreground">
                  An esteemed private school in the far reaches of Toronto, Canada. 144 students call this mysterious place home.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="name" className="font-mono">Character Name</Label>
                <Input
                  id="name"
                  data-testid="input-character-name"
                  value={character.name}
                  onChange={(e) => setCharacter({ ...character, name: e.target.value })}
                  placeholder="Enter your character's name..."
                  className="font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label className="font-mono">Choose Your Race</Label>
                <div className="grid grid-cols-2 gap-2">
                  {races.map((race) => (
                    <Button
                      key={race}
                      data-testid={`button-race-${race.toLowerCase()}`}
                      variant={character.race === race ? 'default' : 'outline'}
                      onClick={() => setCharacter({ ...character, race })}
                      className="justify-start font-mono text-xs"
                    >
                      {race}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-mono text-accent">Choose Your Path</h3>
                <p className="text-sm text-muted-foreground">Your class and specialization will define your abilities</p>
              </div>

              <div className="space-y-3">
                <Label className="font-mono">Primary Class</Label>
                <div className="grid grid-cols-2 gap-2">
                  {classes.map((cls) => (
                    <Button
                      key={cls}
                      data-testid={`button-class-${cls.toLowerCase()}`}
                      variant={character.class === cls ? 'default' : 'outline'}
                      onClick={() => setCharacter({ ...character, class: cls })}
                      className="justify-start gap-2 font-mono text-xs"
                    >
                      {getClassIcon(cls)}
                      {cls}
                    </Button>
                  ))}
                </div>
              </div>

              {character.class && (
                <div className="space-y-3">
                  <Label className="font-mono">Specialization</Label>
                  <Select value={character.subClass} onValueChange={(value) => setCharacter({ ...character, subClass: value })}>
                    <SelectTrigger data-testid="select-subclass" className="font-mono">
                      <SelectValue placeholder="Choose specialization..." />
                    </SelectTrigger>
                    <SelectContent>
                      {subClasses.map((subClass) => (
                        <SelectItem key={subClass} value={subClass} className="font-mono">
                          {subClass}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-mono text-accent">Join a Faction</h3>
                <p className="text-sm text-muted-foreground">Align yourself with one of The Academy's mysterious factions</p>
              </div>

              <div className="space-y-3">
                {factions.map((faction) => (
                  <Card 
                    key={faction}
                    className={`cursor-pointer transition-colors hover-elevate ${
                      character.faction === faction ? 'border-primary bg-primary/10' : 'border-border'
                    }`}
                    onClick={() => setCharacter({ ...character, faction })}
                    data-testid={`button-faction-${faction.toLowerCase()}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-mono font-medium">{faction}</div>
                          <div className="text-xs text-muted-foreground">{getFactionDescription(faction)}</div>
                        </div>
                        {character.faction === faction && (
                          <Badge variant="default" className="font-mono">Selected</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-mono text-accent">Character Summary</h3>
                <p className="text-sm text-muted-foreground">Review your character before entering The Academy</p>
              </div>

              <Card className="bg-card/50">
                <CardContent className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Name:</span>
                      <div className="font-mono">{character.name}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Race:</span>
                      <div className="font-mono">{character.race}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Class:</span>
                      <div className="font-mono">{character.class}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Specialization:</span>
                      <div className="font-mono">{character.subClass}</div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <span className="text-muted-foreground">Faction:</span>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="font-mono">{character.faction}</Badge>
                      <span className="text-xs text-muted-foreground">{getFactionDescription(character.faction)}</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="text-xs text-center text-muted-foreground">
                    Starting stats will be based on your race and class combination
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button 
              variant="outline" 
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1}
              data-testid="button-previous"
            >
              Previous
            </Button>
            
            {step < 4 ? (
              <Button 
                onClick={() => setStep(step + 1)}
                disabled={
                  (step === 1 && (!character.name || !character.race)) ||
                  (step === 2 && (!character.class || !character.subClass)) ||
                  (step === 3 && !character.faction)
                }
                data-testid="button-next"
              >
                Next
              </Button>
            ) : (
              <Button 
                onClick={handleComplete}
                className="bg-primary"
                data-testid="button-enter-academy"
              >
                Enter The Academy
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}