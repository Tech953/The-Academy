import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PerkSelection from "@/components/ui/perk-selection";
import CharacterSheet from "@/components/CharacterSheet";
import { PERK_DATABASE, type CharacterPerk } from "@shared/perks";
import { type GameStats } from "@shared/schema";

export default function PerkDemo() {
  const [demoCharacter, setDemoCharacter] = useState({
    name: "Demo Character",
    background: "Academy Perk Tester",
    race: "Human",
    class: "Ranger", 
    faction: "Archivists",
    stats: {
      perception: 55,
      intelligence: 60,
      charisma: 50,
      dexterity: 65,
      strength: 70,
      health: 100,
      endurance: 45
    } as GameStats,
    reputation: {
      faculty: 50,
      students: 50,
      mysterious: 50
    },
    energy: 100,
    maxEnergy: 100,
    perks: [] as CharacterPerk[]
  });

  const [availablePoints] = useState(3);

  const handlePerkSelect = (perkId: string) => {
    if (!PERK_DATABASE[perkId] || demoCharacter.perks.some(p => p.perkId === perkId)) {
      return;
    }

    const newPerk: CharacterPerk = {
      perkId,
      level: 1,
      unlockedAt: new Date().toISOString()
    };

    setDemoCharacter(prev => ({
      ...prev,
      perks: [...prev.perks, newPerk]
    }));
  };

  const handlePerkRemove = (perkId: string) => {
    setDemoCharacter(prev => ({
      ...prev,
      perks: prev.perks.filter(p => p.perkId !== perkId)
    }));
  };

  const addSamplePerks = () => {
    const samplePerks: CharacterPerk[] = [
      { perkId: 'quick_learner', level: 1, unlockedAt: new Date().toISOString() },
      { perkId: 'silver_tongue', level: 1, unlockedAt: new Date().toISOString() },
      { perkId: 'keen_senses', level: 1, unlockedAt: new Date().toISOString() }
    ];

    setDemoCharacter(prev => ({
      ...prev,
      perks: samplePerks
    }));
  };

  const clearPerks = () => {
    setDemoCharacter(prev => ({
      ...prev,
      perks: []
    }));
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-mono text-accent text-center">
              🐻‍❄️ Polar Cub Perk System Demo 🐻‍❄️
            </CardTitle>
            <p className="text-center text-muted-foreground font-mono text-sm">
              Inspired by Fallout's Vault Boy, each perk features expressive polar cub illustrations!
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center gap-4">
              <Button onClick={addSamplePerks} className="font-mono" data-testid="button-add-sample-perks">
                Add Sample Perks
              </Button>
              <Button 
                onClick={clearPerks} 
                variant="outline" 
                className="font-mono"
                data-testid="button-clear-perks"
              >
                Clear Perks
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Character Sheet - Shows how perks affect stats */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="font-mono text-sm">Character with Perks</CardTitle>
                <p className="text-xs text-muted-foreground font-mono">
                  Stats show bonuses from active perks
                </p>
              </CardHeader>
              <CardContent>
                <CharacterSheet 
                  character={demoCharacter}
                  data-testid="demo-character-sheet"
                />
              </CardContent>
            </Card>
          </div>

          {/* Perk Selection Interface */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="font-mono text-sm">Perk Selection System</CardTitle>
                <p className="text-xs text-muted-foreground font-mono">
                  Browse perks by category. Each polar cub illustration represents the perk's effect!
                </p>
              </CardHeader>
              <CardContent>
                <PerkSelection
                  characterStats={demoCharacter.stats}
                  currentPerks={demoCharacter.perks}
                  availablePoints={availablePoints}
                  onPerkSelect={handlePerkSelect}
                  onPerkRemove={handlePerkRemove}
                  showCategories={true}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Perk Icon Gallery */}
        <Card>
          <CardHeader>
            <CardTitle className="font-mono text-sm">Polar Cub Icon Gallery</CardTitle>
            <p className="text-xs text-muted-foreground font-mono">
              Each category uses a different polar cub pose to demonstrate the perk's effect
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 mx-auto bg-red-500/10 rounded-lg p-2">
                  <img 
                    src="/attached_assets/stock_images/cute_polar_bear_cub__98a707c7.jpg" 
                    alt="Combat Cub"
                    className="w-full h-full object-cover rounded"
                  />
                </div>
                <div className="text-xs font-mono">
                  <div className="text-red-500 font-bold">Combat</div>
                  <div className="text-muted-foreground">Strong & Determined</div>
                </div>
              </div>
              
              <div className="text-center space-y-2">
                <div className="w-16 h-16 mx-auto bg-blue-500/10 rounded-lg p-2">
                  <img 
                    src="/attached_assets/stock_images/cute_polar_bear_cub__ec414e02.jpg" 
                    alt="Academic Cub"
                    className="w-full h-full object-cover rounded"
                  />
                </div>
                <div className="text-xs font-mono">
                  <div className="text-blue-500 font-bold">Academic</div>
                  <div className="text-muted-foreground">Curious & Thinking</div>
                </div>
              </div>
              
              <div className="text-center space-y-2">
                <div className="w-16 h-16 mx-auto bg-green-500/10 rounded-lg p-2">
                  <img 
                    src="/attached_assets/stock_images/cute_polar_bear_cub__5ff14998.jpg" 
                    alt="Social Cub"
                    className="w-full h-full object-cover rounded"
                  />
                </div>
                <div className="text-xs font-mono">
                  <div className="text-green-500 font-bold">Social</div>
                  <div className="text-muted-foreground">Friendly & Playful</div>
                </div>
              </div>
              
              <div className="text-center space-y-2">
                <div className="w-16 h-16 mx-auto bg-yellow-500/10 rounded-lg p-2">
                  <img 
                    src="/attached_assets/stock_images/cute_polar_bear_cub__da0b1b5b.jpg" 
                    alt="Survival Cub"
                    className="w-full h-full object-cover rounded"
                  />
                </div>
                <div className="text-xs font-mono">
                  <div className="text-yellow-500 font-bold">Survival</div>
                  <div className="text-muted-foreground">Alert & Cautious</div>
                </div>
              </div>
              
              <div className="text-center space-y-2">
                <div className="w-16 h-16 mx-auto bg-purple-500/10 rounded-lg p-2">
                  <img 
                    src="/attached_assets/stock_images/cute_polar_bear_cub__392eeae5.jpg" 
                    alt="Mystical Cub"
                    className="w-full h-full object-cover rounded"
                  />
                </div>
                <div className="text-xs font-mono">
                  <div className="text-purple-500 font-bold">Mystical</div>
                  <div className="text-muted-foreground">Magical & Serene</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}