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

  // Helper functions
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

  const displayLocationInfo = async (gameStateData: GameState) => {
    addTerminalLine('');
    addTerminalLine(gameStateData.currentLocation.name.toUpperCase(), 'system');
    addTerminalLine(gameStateData.currentLocation.description);
    
    // Show NPCs in location
    try {
      const npcs = await gameStateManager.getNPCsInCurrentLocation();
      if (npcs.length > 0) {
        addTerminalLine('');
        addTerminalLine('You see:');
        npcs.forEach(npc => {
          addTerminalLine(`- ${npc.name} (${npc.title})`);
        });
      }
    } catch (error) {
      console.warn('Failed to fetch NPCs:', error);
    }
    
    // Show available exits
    const exits = gameStateData.currentLocation.exits as Record<string, string>;
    if (exits && Object.keys(exits).length > 0) {
      addTerminalLine('');
      const exitList = Object.entries(exits)
        .map(([direction, destination]) => `${direction.toUpperCase()}`)
        .join(', ');
      addTerminalLine(`Exits: ${exitList}`, 'system');
    }
    
    // Show interactable objects
    const interactables = gameStateData.currentLocation.interactables as string[];
    if (interactables && interactables.length > 0) {
      addTerminalLine('');
      const interactableList = interactables
        .map(item => item.toUpperCase())
        .join(', ');
      addTerminalLine(`You can examine: ${interactableList}`, 'system');
    }
  };

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
        
        // Set initial welcome message and then display location
        setTerminalLines(welcomeLines);
        
        // Use the shared display function for consistency
        await displayLocationInfo(initialGameState);
        setGameState(initialGameState);
      }
    } catch (error) {
      console.error('Failed to initialize game:', error);
      
      // Reset to character creation on failure
      setCharacter(null);
      setGameStarted(false);
      setLoading(false);
      
      // Also add error message for debugging
      addTerminalLine('Failed to initialize game. Returning to character creation.', 'error');
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

  const handleLookCommand = async () => {
    if (!gameState) return;
    await displayLocationInfo(gameState);
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
    
    // Check access requirements before moving
    try {
      const response = await fetch(`/api/locations/${destination}`);
      if (!response.ok) {
        addTerminalLine('');
        addTerminalLine('That location is not accessible.', 'error');
        return;
      }
      
      const targetLocation = await response.json();
      const requirements = targetLocation.requirements as Record<string, any>;
      
      if (requirements && Object.keys(requirements).length > 0) {
        // Check permission level requirements
        if (requirements.permission_level === 'faculty') {
          addTerminalLine('');
          addTerminalLine('This area is restricted to faculty members only.', 'error');
          return;
        }
        
        if (requirements.permission_level === 'summons_only') {
          addTerminalLine('');
          addTerminalLine('You must be summoned to enter the Headmaster\'s office.', 'error');
          return;
        }
        
        if (requirements.permission_level === 'residents_only') {
          addTerminalLine('');
          addTerminalLine('This floor is restricted to dormitory residents.', 'error');
          return;
        }
        
        if (requirements.student_access === false) {
          addTerminalLine('');
          addTerminalLine('Students are not permitted in this area.', 'error');
          return;
        }
        
        if (requirements.special_key && !gameState.inventory.some(item => item.itemId === requirements.special_key)) {
          addTerminalLine('');
          addTerminalLine('This area requires special authorization to enter.', 'error');
          return;
        }
      }
    } catch (error) {
      addTerminalLine('');
      addTerminalLine('Something prevents you from going that way.', 'error');
      return;
    }
    
    const newLocation = await gameStateManager.moveToLocation(destination);
    if (newLocation) {
      const updatedGameState = gameStateManager.getGameState();
      if (updatedGameState) {
        setGameState({...updatedGameState}); // Create new object to trigger React re-render
        await displayLocationInfo(updatedGameState);
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

  // Enhanced command parsing with aliases and synonyms
  const parseCommand = (command: string) => {
    const cmd = command.toLowerCase().trim();
    if (!cmd) {
      return { action: '', target: '', originalAction: '', parts: [] };
    }
    
    const parts = cmd.split(/\s+/).filter(part => part.length > 0);
    if (parts.length === 0) {
      return { action: '', target: '', originalAction: '', parts: [] };
    }
    
    let action = parts[0];
    let target = parts.slice(1).join(' ');
    
    // Handle command aliases and synonyms
    const aliases: Record<string, string> = {
      'l': 'look',
      'i': 'inventory', 'inv': 'inventory',
      'st': 'status', 'stat': 'status', 'stats': 'status',
      'ex': 'examine', 'x': 'examine',
      't': 'talk', 'say': 'talk', 'speak': 'talk',
      'n': 'north', 's': 'south', 'e': 'east', 'w': 'west',
      'u': 'up', 'd': 'down',
      'help': 'help', '?': 'help',
      'quit': 'quit', 'exit': 'quit', 'q': 'quit'
    };
    
    // Special handling for "GO N/S/E/W" - convert to direct movement
    if (action === 'go' && target && ['n', 's', 'e', 'w', 'u', 'd'].includes(target)) {
      const directionMap: Record<string, string> = {
        'n': 'north', 's': 'south', 'e': 'east', 'w': 'west',
        'u': 'up', 'd': 'down'
      };
      return { 
        action: directionMap[target], 
        target: '', 
        originalAction: `${action} ${target}`, 
        parts 
      };
    }
    
    const normalizedAction = aliases[action] || action;
    return { action: normalizedAction, target, originalAction: action, parts };
  };
  
  const getCommandSuggestions = (invalidCommand: string): string[] => {
    const commands = ['look', 'go', 'examine', 'talk', 'inventory', 'status', 'save', 'load', 'help', 'north', 'south', 'east', 'west', 'up', 'down'];
    const suggestions = commands.filter(cmd => 
      cmd.includes(invalidCommand) || invalidCommand.includes(cmd) ||
      cmd.startsWith(invalidCommand.charAt(0))
    );
    return suggestions.slice(0, 3); // Return up to 3 suggestions
  };

  const handleCommand = async (command: string) => {
    // Handle empty or whitespace-only commands
    if (!command || command.trim().length === 0) {
      addTerminalLine(`> ${command}`, 'command');
      return; // Silently ignore empty commands
    }
    
    const { action, target, originalAction } = parseCommand(command);
    
    // Additional safety check in case parsing fails
    if (!action) {
      addTerminalLine(`> ${command}`, 'command');
      addTerminalLine('', '');
      addTerminalLine('Invalid command. Type HELP for available commands.', 'error');
      return;
    }
    
    // Add command to terminal
    addTerminalLine(`> ${command}`, 'command');

    // Process commands
    if (action === 'help' || action === '?') {
      if (target) {
        // Context-specific help
        addTerminalLine('');
        addTerminalLine(`Help for "${target.toUpperCase()}":`);
        switch (target.toLowerCase()) {
          case 'movement':
          case 'go':
          case 'move':
            addTerminalLine('Movement commands:');
            addTerminalLine('GO [direction] or just [direction] - Move in that direction');
            addTerminalLine('Directions: NORTH/N, SOUTH/S, EAST/E, WEST/W, UP/U, DOWN/D');
            addTerminalLine('Example: "GO NORTH" or just "NORTH" or "N"');
            break;
          case 'examine':
          case 'look':
            addTerminalLine('Observation commands:');
            addTerminalLine('LOOK/L - Examine your surroundings');
            addTerminalLine('EXAMINE/EX/X [object] - Look closely at something');
            addTerminalLine('Example: "EXAMINE desk" or "X portraits"');
            break;
          default:
            addTerminalLine(`No specific help available for "${target}".`);
            addTerminalLine('Type HELP for general commands.');
        }
      } else {
        // General help
        addTerminalLine('');
        addTerminalLine('THE ACADEMY - Available Commands:');
        addTerminalLine('');
        addTerminalLine('== Movement ==');
        addTerminalLine('LOOK/L - Examine your surroundings');
        addTerminalLine('GO [dir] - Move (or just use direction)');
        addTerminalLine('Directions: NORTH/N, SOUTH/S, EAST/E, WEST/W, UP/U, DOWN/D');
        addTerminalLine('');
        addTerminalLine('== Interaction ==');
        addTerminalLine('EXAMINE/X [object] - Look closely at something');
        addTerminalLine('TALK/T [person] - Start a conversation');
        addTerminalLine('');
        addTerminalLine('== Character ==');
        addTerminalLine('INVENTORY/I - Check your belongings');
        addTerminalLine('STATUS/STAT - View character information');
        addTerminalLine('');
        addTerminalLine('== Game ==');
        addTerminalLine('SAVE - Save your progress');
        addTerminalLine('LOAD - Load saved game');
        addTerminalLine('TIME - Check current game time');
        addTerminalLine('SCORE - View your progress');
        addTerminalLine('CLEAR - Clear terminal');
        addTerminalLine('QUIT/EXIT - Leave the game');
        addTerminalLine('');
        addTerminalLine('Type HELP [topic] for specific help (e.g., HELP MOVEMENT)');
      }
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
    } else if (action === 'time') {
      handleTime();
    } else if (action === 'score') {
      handleScore();
    } else if (action === 'quit' || action === 'exit') {
      handleQuit();
    } else if (action === 'clear') {
      setTerminalLines([]);
      addTerminalLine('Terminal cleared.', 'system');
    } else {
      addTerminalLine('');
      const suggestions = getCommandSuggestions(originalAction);
      if (suggestions.length > 0) {
        addTerminalLine(`I don't understand "${originalAction}". Did you mean: ${suggestions.join(', ')}?`, 'error');
      } else {
        addTerminalLine(`I don't understand "${originalAction}". Type HELP for available commands.`, 'error');
      }
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
        case 'fireplace':
          addTerminalLine('A grand stone fireplace dominates this wall. The fire crackles');
          addTerminalLine('warmly, but the flames seem to dance in patterns that almost');
          addTerminalLine('look like they\'re trying to form shapes or symbols.');
          break;
        case 'bookshelves':
        case 'books':
          addTerminalLine('Towering bookshelves stretch from floor to ceiling, packed with');
          addTerminalLine('ancient tomes and mysterious volumes. Some books seem to');
          addTerminalLine('shimmer slightly, and you swear you saw one move on its own.');
          break;
        case 'chandelier':
          addTerminalLine('An ornate crystal chandelier hangs overhead, casting dancing');
          addTerminalLine('shadows throughout the room. The crystals tinkle softly even');
          addTerminalLine('when there\'s no breeze.');
          break;
        case 'windows':
        case 'window':
          addTerminalLine('Large windows offer a view of the Academy grounds. The glass');
          addTerminalLine('seems unusually thick, and sometimes you glimpse movement');
          addTerminalLine('in the reflections that doesn\'t match what\'s in the room.');
          break;
        case 'food':
        case 'cafeteria_food':
          addTerminalLine('The food looks surprisingly appetizing for institutional fare.');
          addTerminalLine('There\'s a wide variety, and some dishes seem to shift and');
          addTerminalLine('change when you\'re not looking directly at them.');
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
      addTerminalLine('Your pockets are otherwise empty.');
      addTerminalLine('');
      addTerminalLine('(The mystical items you always carry are not lost or consumed)');
    } else {
      addTerminalLine('- Student ID badge (glowing with faction insignia)');
      addTerminalLine('- Academy handbook (pages seem to change when not being read)');
      addTerminalLine('');
      addTerminalLine('Additional items:');
      gameState.inventory.forEach(item => {
        addTerminalLine(`- ${item.itemId} (qty: ${item.quantity})`);
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
    addTerminalLine('');
    addTerminalLine('STATISTICS:');
    addTerminalLine(`Knowledge: ${stats.knowledge}`);
    addTerminalLine(`Social: ${stats.social}`);
    addTerminalLine(`Athletics: ${stats.athletics}`);
    addTerminalLine(`Creativity: ${stats.creativity}`);
    addTerminalLine(`Mysticism: ${stats.mysticism}`);
  };
  
  const handleTime = () => {
    addTerminalLine('');
    addTerminalLine('ACADEMY TIME:');
    addTerminalLine('Term: Fall Semester, 1993');
    addTerminalLine('Week: First Week of Classes');
    addTerminalLine('Time: Morning (Classes in session)');
    addTerminalLine('');
    addTerminalLine('The Academy operates on its own mysterious schedule.');
    addTerminalLine('Time seems to flow differently within these walls.');
  };
  
  const handleScore = () => {
    if (!gameState) return;
    
    const stats = gameState.character.stats as GameStats;
    const rep = gameState.character.reputation as GameReputation;
    
    addTerminalLine('');
    addTerminalLine('ACADEMY PROGRESS REPORT:');
    addTerminalLine('========================');
    addTerminalLine(`Student: ${gameState.character.name}`);
    addTerminalLine(`Faction: ${gameState.character.faction}`);
    addTerminalLine('');
    
    // Calculate total reputation
    const totalRep = rep.faculty + rep.students + rep.mysterious;
    addTerminalLine(`Total Reputation Points: ${totalRep}`);
    
    // Calculate total stats
    const totalStats = stats.knowledge + stats.social + stats.athletics + stats.creativity + stats.mysticism;
    addTerminalLine(`Total Skill Points: ${totalStats}`);
    
    addTerminalLine('');
    addTerminalLine('Academic Standing: Enrolled');
    addTerminalLine('Mysteries Uncovered: Beginning your journey...');
    addTerminalLine('');
    addTerminalLine('Continue exploring to uncover the Academy\'s secrets!');
  };
  
  const handleQuit = () => {
    addTerminalLine('');
    addTerminalLine('Are you sure you want to leave The Academy?');
    addTerminalLine('Your progress has been automatically saved.');
    addTerminalLine('');
    addTerminalLine('Thank you for playing! Type any command to continue.');
    addTerminalLine('Or refresh the page to start fresh.');
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