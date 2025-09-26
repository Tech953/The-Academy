import { useState, useEffect } from 'react';
import TerminalInterface from '@/components/TerminalInterface';
import TextCharacterCreation from '@/components/TextCharacterCreation';
import { Character } from '@/components/CharacterSheet';
import { gameStateManager, GameState, TerminalLine } from '@/lib/gameState';
import { Location, NPC, GameStats, GameReputation } from '@shared/schema';

export default function Home() {
  const [character, setCharacter] = useState<Character | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([]);
  const [loading, setLoading] = useState(false);

  // Initialize game when character is created
  useEffect(() => {
    if (character && gameStarted && !gameState) {
      initializeGame();
    }
  }, [character, gameStarted]);

  const initializeGame = async () => {
    if (!character) return;
    
    setLoading(true);
    try {
      // Convert character creation format to backend format
      const backendCharacter = {
        userId: null,
        name: character.name,
        race: character.race,
        class: character.class,
        subClass: character.subClass,
        faction: character.faction,
        background: character.background,
        currentLocation: 'main_lobby',
        stats: character.stats,
        reputation: character.reputation,
        energy: character.energy,
        maxEnergy: character.maxEnergy,
        inventory: [],
        perks: character.perks || [],
        questProgress: {},
        socialConnections: {}
      };

      // Create character in backend and initialize game state
      const response = await fetch('/api/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backendCharacter)
      });

      if (response.ok) {
        const savedCharacter = await response.json();
        const initialGameState = await gameStateManager.initializeGame(savedCharacter);
        
        // Add initial welcome message
        const welcomeLines: TerminalLine[] = [
          { id: '1', text: 'THE ACADEMY', type: 'system' },
          { id: '2', text: '', type: 'output' },
          { id: '3', text: `Welcome to "The Academy", ${character.name}.`, type: 'output' },
          { id: '4', text: `You are a ${character.race} ${character.class} aligned with the ${character.faction} faction.`, type: 'output' },
          { id: '5', text: '', type: 'output' },
          { id: '6', text: 'This esteemed private school houses exactly 144 students in the far', type: 'output' },
          { id: '7', text: 'reaches of Toronto, Canada. As a freshman arriving from places unknown', type: 'output' },
          { id: '8', text: 'to a place even more unknown, you must navigate the mysteries that await.', type: 'output' },
          { id: '9', text: '', type: 'output' },
          { id: '10', text: `Your ${character.subClass} specialization will serve you well in the`, type: 'output' },
          { id: '11', text: 'trials ahead. Type HELP for available commands.', type: 'output' },
          { id: '12', text: '', type: 'output' }
        ];
        
        // Display initial location using the game state directly
        const locationLines = await generateLocationDescription(initialGameState);
        const allLines = [...welcomeLines, ...locationLines];
        
        setTerminalLines(allLines);
        setGameState(initialGameState);
      }
    } catch (error) {
      console.error('Failed to initialize game:', error);
      addTerminalLine('Failed to initialize game. Please try refreshing.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // If character hasn't been created yet, show character creation
  if (!character || !gameStarted) {
    return (
      <TextCharacterCreation 
        onComplete={(newCharacter) => {
          setCharacter(newCharacter);
          setGameStarted(true);
        }}
      />
    );
  }

  // Show loading state while initializing
  if (loading || !gameState) {
    return (
      <div className="h-screen bg-background text-foreground font-mono flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl mb-4">THE ACADEMY</div>
          <div>Initializing game world...</div>
        </div>
      </div>
    );
  }

  const addTerminalLine = (text: string, type: TerminalLine['type'] = 'output') => {
    const newLine: TerminalLine = {
      id: Date.now().toString() + Math.random(),
      text,
      type
    };
    setTerminalLines(prev => [...prev, newLine]);
  };

  const generateLocationDescription = async (gameStateData: GameState): Promise<TerminalLine[]> => {
    const lines: TerminalLine[] = [];
    
    lines.push({ id: Date.now().toString() + Math.random(), text: '', type: 'output' });
    lines.push({ id: Date.now().toString() + Math.random(), text: gameStateData.currentLocation.name.toUpperCase(), type: 'system' });
    lines.push({ id: Date.now().toString() + Math.random(), text: gameStateData.currentLocation.description, type: 'output' });
    
    // Show NPCs in location
    try {
      const npcs = await gameStateManager.getNPCsInCurrentLocation();
      if (npcs.length > 0) {
        lines.push({ id: Date.now().toString() + Math.random(), text: '', type: 'output' });
        lines.push({ id: Date.now().toString() + Math.random(), text: 'You see:', type: 'output' });
        npcs.forEach(npc => {
          lines.push({ id: Date.now().toString() + Math.random(), text: `- ${npc.name} (${npc.title})`, type: 'output' });
        });
      }
    } catch (error) {
      console.warn('Failed to fetch NPCs:', error);
    }
    
    // Show available exits
    const exits = gameStateData.currentLocation.exits as Record<string, string>;
    if (exits && Object.keys(exits).length > 0) {
      lines.push({ id: Date.now().toString() + Math.random(), text: '', type: 'output' });
      const exitList = Object.entries(exits)
        .map(([direction, destination]) => `${direction.toUpperCase()}`)
        .join(', ');
      lines.push({ id: Date.now().toString() + Math.random(), text: `Exits: ${exitList}`, type: 'system' });
    }
    
    // Show interactable objects
    const interactables = gameStateData.currentLocation.interactables as string[];
    if (interactables && interactables.length > 0) {
      const interactableList = interactables
        .map(item => item.toUpperCase())
        .join(', ');
      lines.push({ id: Date.now().toString() + Math.random(), text: `You can examine: ${interactableList}`, type: 'system' });
    }
    
    return lines;
  };

  const handleLookCommand = async () => {
    if (!gameState) return;
    
    addTerminalLine('');
    addTerminalLine(gameState.currentLocation.name.toUpperCase(), 'system');
    addTerminalLine(gameState.currentLocation.description);
    
    // Show NPCs in location
    const npcs = await gameStateManager.getNPCsInCurrentLocation();
    if (npcs.length > 0) {
      addTerminalLine('');
      addTerminalLine('You see:');
      npcs.forEach(npc => {
        addTerminalLine(`- ${npc.name} (${npc.title})`);
      });
    }
    
    // Show available exits
    const exits = gameState.currentLocation.exits as Record<string, string>;
    if (exits && Object.keys(exits).length > 0) {
      addTerminalLine('');
      const exitList = Object.entries(exits)
        .map(([direction, destination]) => `${direction.toUpperCase()}`)
        .join(', ');
      addTerminalLine(`Exits: ${exitList}`);
    }
    
    // Show interactable objects
    const interactables = gameState.currentLocation.interactables as string[];
    if (interactables && interactables.length > 0) {
      const interactableList = interactables
        .map(item => item.toUpperCase())
        .join(', ');
      addTerminalLine(`You can examine: ${interactableList}`);
    }
  };

  const handleMovement = async (direction: string) => {
    if (!gameState) return;
    
    const exits = gameState.currentLocation.exits as Record<string, string>;
    const destination = exits[direction];
    
    if (!destination) {
      addTerminalLine('');
      addTerminalLine(`You can't go ${direction} from here.`, 'error');
      return;
    }
    
    const newLocation = await gameStateManager.moveToLocation(destination);
    if (newLocation) {
      const updatedGameState = gameStateManager.getGameState();
      if (updatedGameState) {
        setGameState(updatedGameState);
        await handleLookCommand();
      }
    } else {
      addTerminalLine('');
      addTerminalLine('Something prevents you from going that way.', 'error');
    }
  };

  const handleSave = async () => {
    const success = await gameStateManager.manualSave();
    addTerminalLine('');
    if (success) {
      addTerminalLine('Game saved successfully.', 'system');
    } else {
      addTerminalLine('Failed to save game.', 'error');
    }
  };

  const handleCommand = async (command: string) => {
    const cmd = command.toLowerCase().trim();
    const parts = cmd.split(' ');
    const action = parts[0];
    const target = parts.slice(1).join(' ');
    
    // Add command to terminal
    addTerminalLine(`> ${command}`, 'command');

    // Process commands
    if (action === 'help') {
      addTerminalLine('');
      addTerminalLine('Available commands:');
      addTerminalLine('LOOK - Examine your surroundings');
      addTerminalLine('GO [direction] - Move (NORTH, SOUTH, EAST, WEST, UP, DOWN)');
      addTerminalLine('EXAMINE [object] - Look at something closely');
      addTerminalLine('TALK [person] - Start a conversation');
      addTerminalLine('INVENTORY - Check your belongings');
      addTerminalLine('STATUS - View character information');
      addTerminalLine('SAVE - Save your progress');
      addTerminalLine('LOAD - Load saved game');
    } else if (action === 'look') {
      await handleLookCommand();
    } else if (action === 'go' && target) {
      await handleMovement(target);
    } else if (['north', 'south', 'east', 'west', 'up', 'down'].includes(action)) {
      await handleMovement(action);
    } else if (action === 'examine' && target) {
      await handleExamine(target);
    } else if (action === 'talk' && target) {
      await handleTalk(target);
    } else if (action === 'inventory') {
      handleInventory();
    } else if (action === 'status') {
      handleStatus();
    } else if (action === 'save') {
      await handleSave();
    } else if (action === 'load') {
      addTerminalLine('');
      addTerminalLine('Load functionality coming soon.', 'system');
    } else {
      addTerminalLine('');
      addTerminalLine(`I don't understand "${command}". Type HELP for available commands.`, 'error');
    }
  };

  const handleExamine = async (target: string) => {
    if (!gameState) return;
    
    const interactables = gameState.currentLocation.interactables as string[];
    if (interactables.includes(target)) {
      addTerminalLine('');
      // Add specific examine descriptions based on the object
      switch (target) {
        case 'portraits':
          addTerminalLine('You step closer to examine the portraits. The painted figures seem');
          addTerminalLine('ancient, wearing academic robes from centuries past. Their eyes');
          addTerminalLine('definitely follow you as you move. One portrait\'s nameplate reads');
          addTerminalLine('"Professor Blackwood - Founder." The paint seems to shift when');
          addTerminalLine('you\'re not looking directly at it.');
          break;
        case 'reception_desk':
          addTerminalLine('The receptionist desk appears to be made of dark mahogany. It\'s');
          addTerminalLine('currently unattended, but papers and schedules are neatly organized.');
          addTerminalLine('A small nameplate reads "Emily Carter - Academy Receptionist."');
          break;
        default:
          addTerminalLine(`You examine the ${target}. Nothing particularly unusual stands out.`);
      }
    } else {
      addTerminalLine('');
      addTerminalLine(`You don't see any ${target} here.`, 'error');
    }
  };

  const handleTalk = async (target: string) => {
    const npcs = await gameStateManager.getNPCsInCurrentLocation();
    const npc = npcs.find(n => 
      n.name.toLowerCase().includes(target) || 
      n.title?.toLowerCase().includes(target)
    );
    
    if (npc) {
      addTerminalLine('');
      const dialogue = npc.dialogue as any;
      addTerminalLine(`${npc.name}: "${dialogue.greeting || 'Hello there.'}"`);
    } else {
      addTerminalLine('');
      addTerminalLine(`You don't see anyone named ${target} here.`, 'error');
    }
  };

  const handleInventory = () => {
    if (!gameState) return;
    
    addTerminalLine('');
    addTerminalLine('INVENTORY:');
    
    if (gameState.inventory.length === 0) {
      addTerminalLine('- Student ID badge (glowing with faction insignia)');
      addTerminalLine('- Academy handbook (pages seem to change when not being read)');
      addTerminalLine('Your inventory is otherwise empty.');
    } else {
      gameState.inventory.forEach(item => {
        addTerminalLine(`- ${item.itemId} (${item.quantity})`);
      });
    }
  };

  const handleStatus = () => {
    if (!gameState) return;
    
    const stats = gameState.character.stats as GameStats;
    const rep = gameState.character.reputation as GameReputation;
    
    addTerminalLine('');
    addTerminalLine('CHARACTER STATUS:');
    addTerminalLine(`Name: ${gameState.character.name}`);
    addTerminalLine(`Race: ${gameState.character.race}`);
    addTerminalLine(`Class: ${gameState.character.class} (${gameState.character.subClass})`);
    addTerminalLine(`Faction: ${gameState.character.faction}`);
    addTerminalLine(`Location: ${gameState.currentLocation.name}`);
    addTerminalLine(`Energy: ${gameState.character.energy}/${gameState.character.maxEnergy}`);
    addTerminalLine('');
    addTerminalLine('REPUTATION:');
    addTerminalLine(`Faculty: ${rep.faculty}`);
    addTerminalLine(`Students: ${rep.students}`);
    addTerminalLine(`Mysterious: ${rep.mysterious}`);
  };

  const statusLine = `${gameState.character.name} | ${gameState.character.race} ${gameState.character.class} | Location: ${gameState.currentLocation.name} | Energy: ${gameState.character.energy}/${gameState.character.maxEnergy}`;

  return (
    <TerminalInterface
      lines={terminalLines}
      onCommand={handleCommand}
      prompt=">"
      statusLine={statusLine}
    />
  );
}