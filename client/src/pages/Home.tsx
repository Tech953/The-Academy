import { useState, useEffect } from 'react';
import TerminalInterface from '@/components/TerminalInterface';
import TextCharacterCreation from '@/components/TextCharacterCreation';
import RetroBootScreen from '@/components/RetroBootScreen';
import { Character } from '@/components/CharacterSheet';
import { gameStateManager, GameState, TerminalLine } from '@/lib/gameState';
import { Location, NPC, GameStats, GameReputation } from '@shared/schema';

export default function Home() {
  const [bootComplete, setBootComplete] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('themnion-booted') === 'true';
    }
    return false;
  });
  const [character, setCharacter] = useState<Character | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([]);
  const [loading, setLoading] = useState(false);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);

  const handleBootComplete = () => {
    setBootComplete(true);
    sessionStorage.setItem('themnion-booted', 'true');
  };

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
        characterSummary: character.characterSummary || '',
        physicalTraits: character.physicalTraits || {},
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
          { id: '5', text: '', type: 'output' }
        ];

        // Add character summary if available
        if (character.characterSummary) {
          welcomeLines.push({ id: '5a', text: 'YOUR STORY:', type: 'system' });
          welcomeLines.push({ id: '5b', text: character.characterSummary, type: 'output' });
          welcomeLines.push({ id: '5c', text: '', type: 'output' });
        }

        // Add physical description if available
        const physicalTraitsEntries = Object.entries(character.physicalTraits || {});
        if (physicalTraitsEntries.length > 0) {
          const traitsText = physicalTraitsEntries
            .map(([, value]) => value)
            .filter(Boolean)
            .slice(0, 2) // Show first 2 traits
            .join('. ');
          if (traitsText) {
            welcomeLines.push({ id: '5d', text: `At first glance: ${traitsText}.`, type: 'output' });
            welcomeLines.push({ id: '5e', text: '', type: 'output' });
          }
        }

        welcomeLines.push(
          { id: '6', text: 'This esteemed private school houses exactly 144 students in the far', type: 'output' },
          { id: '7', text: 'reaches of Toronto, Canada. As a freshman arriving from places unknown', type: 'output' },
          { id: '8', text: 'to a place even more unknown, you must navigate the mysteries that await.', type: 'output' },
          { id: '9', text: '', type: 'output' },
          { id: '10', text: `Your ${character.subClass} specialization will serve you well in the`, type: 'output' },
          { id: '11', text: 'trials ahead. Type HELP for available commands.', type: 'output' },
          { id: '12', text: '', type: 'output' }
        );
        
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

  // Show boot screen on first load (skippable after a few seconds)
  if (!bootComplete) {
    return (
      <RetroBootScreen 
        onBootComplete={handleBootComplete}
        skipEnabled={true}
      />
    );
  }

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
  const parseCommandWithNLP = async (command: string): Promise<{ action: string; target: string; originalAction: string; parts: string[]; nlpUsed?: boolean; confidence?: number; reasoning?: string }> => {
    // Try NLP processing first for more natural input
    if (gameState) {
      try {
        const npcs = await gameStateManager.getNPCsInCurrentLocation();
        const context = {
          currentLocation: gameState.currentLocation.name,
          locationDescription: gameState.currentLocation.description,
          availableExits: Object.keys((gameState.currentLocation.exits as Record<string, string>) || {}),
          npcsPresent: npcs.map(n => n.name),
          interactables: (gameState.currentLocation.interactables as string[]) || [],
          characterName: gameState.character.name,
          characterClass: gameState.character.class,
          characterRace: gameState.character.race,
          characterFaction: gameState.character.faction,
          inventory: gameState.inventory.map(i => i.itemId),
          energy: gameState.character.energy || 100,
        };

        const response = await fetch('/api/nlp/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ input: command, context }),
        });

        if (response.ok) {
          const nlpResult = await response.json();
          
          // Log NLP interpretation for transparency
          if (nlpResult.confidence < 0.5) {
            console.log('Low confidence NLP result:', nlpResult);
          }
          
          return {
            action: nlpResult.action,
            target: nlpResult.target || '',
            originalAction: command,
            parts: command.toLowerCase().split(/\s+/),
            nlpUsed: true,
            confidence: nlpResult.confidence,
            reasoning: nlpResult.reasoning,
          };
        }
      } catch (error) {
        console.warn('NLP processing failed, falling back to traditional parsing:', error);
      }
    }

    // Fallback to traditional parsing
    return parseCommandTraditional(command);
  };

  const parseCommandTraditional = (command: string) => {
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
      'quit': 'quit', 'exit': 'quit', 'q': 'quit',
      'who': 'list', 'people': 'list', 'characters': 'list'
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
    const commands = ['look', 'go', 'examine', 'talk', 'inventory', 'status', 'save', 'load', 'help', 'list', 'who', 'people', 'north', 'south', 'east', 'west', 'up', 'down'];
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
    
    // Track command in history (limit to last 50 commands)
    setCommandHistory(prev => [...prev.slice(-49), command.toUpperCase()]);
    
    const { action, target, originalAction, nlpUsed, confidence, reasoning } = await parseCommandWithNLP(command);
    
    // Additional safety check in case parsing fails
    if (!action) {
      addTerminalLine(`> ${command}`, 'command');
      addTerminalLine('', '');
      addTerminalLine('Invalid command. Type HELP for available commands.', 'error');
      return;
    }
    
    // Add command to terminal
    addTerminalLine(`> ${command}`, 'command');
    
    // Show NLP interpretation if used and confidence is low (for transparency)
    if (nlpUsed && confidence !== undefined && confidence < 0.7) {
      addTerminalLine(`[Interpreting as: ${action}${target ? ' ' + target : ''}]`, 'system');
    }

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
        addTerminalLine('LIST/WHO/PEOPLE - List people in current area');
        addTerminalLine('');
        addTerminalLine('== Character ==');
        addTerminalLine('INVENTORY/I - Check your belongings');
        addTerminalLine('STATUS/STAT - View character information');
        addTerminalLine('');
        addTerminalLine('== Academic ==');
        addTerminalLine('GRADES - View current course grades');
        addTerminalLine('TRANSCRIPT - View full academic transcript');
        addTerminalLine('SCHEDULE - View class schedule');
        addTerminalLine('GPA - View current GPA and standing');
        addTerminalLine('READ [textbook] - Read a course textbook');
        addTerminalLine('ATTEND [course] - Mark attendance for a class');
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
    } else if (action === 'list' || (action === 'list' && (target === 'people' || target === 'characters' || target === ''))) {
      // Handle list people command inline
      if (!gameState) return;
      try {
        const npcs = await gameStateManager.getNPCsInCurrentLocation();
        addTerminalLine('');
        if (npcs.length === 0) {
          addTerminalLine('There is no one else here.');
        } else {
          addTerminalLine(`People in ${gameState.currentLocation.name}:`);
          addTerminalLine('');
          npcs.forEach(npc => {
            const title = npc.title ? ` (${npc.title})` : '';
            const faction = npc.faction ? ` [${npc.faction}]` : '';
            addTerminalLine(`- ${npc.name}${title}${faction}`);
          });
          addTerminalLine('');
          addTerminalLine('Use "TALK [name]" to start a conversation.');
        }
      } catch (error) {
        addTerminalLine('');
        addTerminalLine('Unable to see who is here right now.', 'error');
      }
    } else if (['north', 'south', 'east', 'west', 'up', 'down'].includes(action)) {
      await handleMovement(action);
    } else if (action === 'examine' && target) {
      await handleExamine(target);
    } else if (action === 'talk' && target) {
      // Enhanced TALK command - handle both "TALK person" and "TALK person topic"
      // Need to be smarter about parsing: could be "TALK Zara", "TALK Zara Ali", or "TALK Zara Ali ACADEMY"
      
      // First, get all NPCs in current location to match names properly
      const npcs = await gameStateManager.getNPCsInCurrentLocation();
      let personName = '';
      let topic = '';
      
      // Try to find the longest matching NPC name from the beginning of target
      const targetParts = target.split(' ');
      let bestMatch: any = null;
      let matchLength = 0;
      
      // Try matching 1, 2, 3+ words as potential NPC names
      for (let i = 1; i <= targetParts.length && i <= 3; i++) {
        const candidateName = targetParts.slice(0, i).join(' ');
        const npc = npcs.find(n => 
          n.name.toLowerCase().includes(candidateName.toLowerCase()) ||
          candidateName.toLowerCase().includes(n.name.toLowerCase().split(' ')[0]) ||
          n.name.toLowerCase() === candidateName.toLowerCase()
        );
        
        if (npc && i > matchLength) {
          bestMatch = npc;
          matchLength = i;
          personName = candidateName;
        }
      }
      
      // Extract the person name and topic based on the best match
      if (bestMatch) {
        // We found a matching NPC - use the matched portion as person name
        personName = targetParts.slice(0, matchLength).join(' ');
        
        // If there are remaining parts after the matched name, they form the topic
        if (matchLength < targetParts.length) {
          topic = targetParts.slice(matchLength).join(' ').toLowerCase().replace(/\s+/g, '_');
        } else {
          topic = '';
        }
      } else {
        // Fallback: no NPC match found, use first word as person name
        personName = targetParts[0];
        topic = targetParts.slice(1).join(' ').toLowerCase().replace(/\s+/g, '_');
      }
      
      // Debug logging
      console.log('TALK Command Debug:', {
        originalTarget: target,
        targetParts: targetParts,
        bestMatchName: bestMatch?.name,
        matchLength: matchLength,
        extractedPersonName: personName,
        extractedTopic: topic,
        hasTopicToHandle: !!topic
      });
      
      if (topic) {
        console.log('Calling handleTalkTopic with:', personName, topic);
        await handleTalkTopic(personName, topic);
      } else {
        console.log('Calling handleTalk with:', personName);
        await handleTalk(personName);
      }
    } else if (action === 'inventory') {
      handleInventory();
    } else if (action === 'status') {
      handleStatus();
    } else if (action === 'grades') {
      await handleGrades();
    } else if (action === 'transcript') {
      await handleTranscript();
    } else if (action === 'schedule') {
      await handleSchedule();
    } else if (action === 'gpa') {
      await handleGPA();
    } else if (action === 'read') {
      await handleRead(target);
    } else if (action === 'chapter') {
      await handleChapter(target);
    } else if (action === 'lecture') {
      await handleLecture(target);
    } else if (action === 'attend') {
      await handleAttend(target);
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
      n.name.toLowerCase().includes(target.toLowerCase()) || 
      n.title?.toLowerCase().includes(target.toLowerCase()) ||
      target.toLowerCase().includes(n.name.toLowerCase().split(' ')[0]) // Match first name
    );
    
    if (npc) {
      addTerminalLine('');
      const dialogue = npc.dialogue as any;
      const greeting = dialogue.greeting || 'Hello there.';
      addTerminalLine(`${npc.name}: "${greeting}"`);
      
      // Show available conversation topics if they exist
      if (dialogue.topics && Object.keys(dialogue.topics).length > 0) {
        addTerminalLine('');
        addTerminalLine(`You can ask ${npc.name.split(' ')[0]} about:`, 'system');
        Object.keys(dialogue.topics).forEach(topic => {
          const topicName = topic.replace(/_/g, ' ').toUpperCase();
          addTerminalLine(`- ${topicName} (say "TALK ${npc.name.split(' ')[0]} ${topicName}")`);
        });
      }
      
      // Show faction-based reputation effect
      if (gameState && npc.faction) {
        const playerFaction = gameState.character.faction;
        if (playerFaction === npc.faction) {
          addTerminalLine('');
          addTerminalLine(`${npc.name.split(' ')[0]} regards you warmly as a fellow ${npc.faction}.`, 'system');
        } else if (playerFaction && npc.faction) {
          addTerminalLine('');
          addTerminalLine(`${npc.name.split(' ')[0]} seems cautious - different factions often have complex relationships.`, 'system');
        }
      }
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

  const handleGrades = async () => {
    if (!gameState) return;
    
    try {
      const response = await fetch(`/api/enrollments/character/${gameState.character.id}`);
      if (!response.ok) {
        addTerminalLine('');
        addTerminalLine('Failed to fetch grades.', 'error');
        return;
      }
      
      const enrollments = await response.json();
      
      addTerminalLine('');
      addTerminalLine('CURRENT GRADES:');
      addTerminalLine('===============');
      
      if (enrollments.length === 0) {
        addTerminalLine('You are not currently enrolled in any courses.');
        addTerminalLine('Visit the library or academic hall to enroll in GED preparation courses.');
      } else {
        const activeEnrollments = enrollments.filter((e: any) => e.status === 'enrolled');
        
        if (activeEnrollments.length === 0) {
          addTerminalLine('You have no active enrollments.');
        } else {
          for (const enrollment of activeEnrollments) {
            const courseResponse = await fetch(`/api/courses/${enrollment.courseId}`);
            const course = await courseResponse.json();
            
            const grade = enrollment.currentGrade || 0;
            const gradeDisplay = grade > 0 ? `${grade.toFixed(1)}%` : 'No assignments submitted';
            
            addTerminalLine(`${course.name}: ${gradeDisplay}`);
          }
        }
      }
      addTerminalLine('');
      addTerminalLine('Type TRANSCRIPT to see completed courses or GPA to see overall standing.');
    } catch (error) {
      console.error('Error fetching grades:', error);
      addTerminalLine('');
      addTerminalLine('Error fetching grades. Please try again.', 'error');
    }
  };

  const handleTranscript = async () => {
    if (!gameState) return;
    
    try {
      const response = await fetch(`/api/enrollments/character/${gameState.character.id}`);
      if (!response.ok) {
        addTerminalLine('');
        addTerminalLine('Failed to fetch transcript.', 'error');
        return;
      }
      
      const enrollments = await response.json();
      
      addTerminalLine('');
      addTerminalLine('OFFICIAL ACADEMIC TRANSCRIPT');
      addTerminalLine('============================');
      addTerminalLine(`Student: ${gameState.character.name}`);
      addTerminalLine(`Student ID: ${gameState.character.id.substring(0, 8).toUpperCase()}`);
      addTerminalLine('');
      
      const completedEnrollments = enrollments.filter((e: any) => e.status === 'completed');
      
      if (completedEnrollments.length === 0) {
        addTerminalLine('No completed courses yet.');
        addTerminalLine('');
        addTerminalLine('Type GRADES to see current enrollments.');
      } else {
        addTerminalLine('COMPLETED COURSES:');
        addTerminalLine('');
        
        for (const enrollment of completedEnrollments) {
          const courseResponse = await fetch(`/api/courses/${enrollment.courseId}`);
          const course = await courseResponse.json();
          
          addTerminalLine(`${course.name} (${course.id})`);
          addTerminalLine(`  Grade: ${enrollment.finalGrade} | Credits: ${course.credits}`);
          addTerminalLine(`  Completed: ${new Date(enrollment.completedAt).toLocaleDateString()}`);
          addTerminalLine('');
        }
      }
    } catch (error) {
      console.error('Error fetching transcript:', error);
      addTerminalLine('');
      addTerminalLine('Error fetching transcript. Please try again.', 'error');
    }
  };

  const handleSchedule = async () => {
    if (!gameState) return;
    
    try {
      const response = await fetch(`/api/enrollments/character/${gameState.character.id}`);
      if (!response.ok) {
        addTerminalLine('');
        addTerminalLine('Failed to fetch schedule.', 'error');
        return;
      }
      
      const enrollments = await response.json();
      const activeEnrollments = enrollments.filter((e: any) => e.status === 'enrolled');
      
      addTerminalLine('');
      addTerminalLine('CLASS SCHEDULE');
      addTerminalLine('==============');
      addTerminalLine(`Semester: ${activeEnrollments[0]?.semester || 'Fall 2025'}`);
      addTerminalLine('');
      
      if (activeEnrollments.length === 0) {
        addTerminalLine('You are not currently enrolled in any courses.');
        addTerminalLine('Visit the library to browse available GED preparation courses.');
      } else {
        for (const enrollment of activeEnrollments) {
          const courseResponse = await fetch(`/api/courses/${enrollment.courseId}`);
          const course = await courseResponse.json();
          const schedule = course.schedule as any;
          
          addTerminalLine(`${course.name} (${course.id})`);
          addTerminalLine(`  ${schedule.days.join(', ')} | ${schedule.time}`);
          addTerminalLine(`  Location: ${schedule.room}`);
          addTerminalLine('');
        }
      }
    } catch (error) {
      console.error('Error fetching schedule:', error);
      addTerminalLine('');
      addTerminalLine('Error fetching schedule. Please try again.', 'error');
    }
  };

  const handleGPA = async () => {
    if (!gameState) return;
    
    try {
      const progressResponse = await fetch(`/api/academic-progress/${gameState.character.id}`);
      if (!progressResponse.ok) {
        addTerminalLine('');
        addTerminalLine('Failed to fetch GPA information.', 'error');
        return;
      }
      
      const progress = await progressResponse.json();
      
      // Calculate GPA
      const calculateResponse = await fetch(`/api/academic-progress/${gameState.character.id}/calculate`, {
        method: 'POST'
      });
      
      if (!calculateResponse.ok) {
        addTerminalLine('');
        addTerminalLine('Failed to calculate GPA.', 'error');
        return;
      }
      
      const updatedProgress = await calculateResponse.json();
      
      const gpa = (updatedProgress.cumulativeGPA / 100).toFixed(2);
      const standing = updatedProgress.academicStanding;
      
      addTerminalLine('');
      addTerminalLine('GPA & ACADEMIC STANDING');
      addTerminalLine('=======================');
      addTerminalLine(`Student: ${gameState.character.name}`);
      addTerminalLine(`Cumulative GPA: ${gpa}`);
      addTerminalLine(`Academic Standing: ${standing.toUpperCase()}`);
      addTerminalLine(`Total Credits: ${updatedProgress.totalCredits}`);
      addTerminalLine('');
      
      if (standing === 'honors') {
        addTerminalLine('Congratulations! You are on the Honor Roll!');
      } else if (standing === 'probation' || standing === 'warning') {
        addTerminalLine('Warning: Your GPA is below good standing. Work on improving your grades.');
      } else {
        addTerminalLine('Keep up the good work!');
      }
      
      addTerminalLine('');
      addTerminalLine('Type GRADES to see current course grades.');
    } catch (error) {
      console.error('Error fetching GPA:', error);
      addTerminalLine('');
      addTerminalLine('Error fetching GPA. Please try again.', 'error');
    }
  };

  const handleRead = async (target: string) => {
    if (!gameState) return;
    
    if (!target) {
      addTerminalLine('');
      addTerminalLine('What would you like to read? Try READ [textbook name].', 'error');
      return;
    }
    
    try {
      // Try to find the textbook by matching the target with course names
      const coursesResponse = await fetch('/api/courses');
      if (!coursesResponse.ok) {
        addTerminalLine('');
        addTerminalLine('Failed to access course catalog.', 'error');
        return;
      }
      
      const courses = await coursesResponse.json();
      const matchingCourse = courses.find((c: any) => 
        c.name.toLowerCase().includes(target.toLowerCase()) ||
        c.id.toLowerCase() === target.toLowerCase()
      );
      
      if (!matchingCourse) {
        addTerminalLine('');
        addTerminalLine(`You don't have a textbook about "${target}".`, 'error');
        addTerminalLine('Type SCHEDULE to see your enrolled courses.');
        return;
      }
      
      // Fetch comprehensive textbook
      const textbookResponse = await fetch(`/api/courses/${matchingCourse.id}/textbook`);
      if (!textbookResponse.ok) {
        // Fallback to basic course info
        addTerminalLine('');
        addTerminalLine(`Reading: ${matchingCourse.name} Textbook`);
        addTerminalLine('='.repeat(matchingCourse.name.length + 18));
        addTerminalLine('');
        addTerminalLine(matchingCourse.description);
        return;
      }
      
      const textbook = await textbookResponse.json();
      
      addTerminalLine('');
      addTerminalLine(`📚 ${textbook.courseName} Textbook`);
      addTerminalLine('='.repeat(textbook.courseName.length + 4));
      addTerminalLine('');
      addTerminalLine(`Authors: ${textbook.authors.join(', ')}`);
      addTerminalLine(`Edition: ${textbook.edition}`);
      addTerminalLine(`Department: ${textbook.department}`);
      addTerminalLine('');
      addTerminalLine('TABLE OF CONTENTS:');
      addTerminalLine('');
      textbook.chapters.forEach((chapter: any) => {
        addTerminalLine(`Chapter ${chapter.number}: ${chapter.title}`);
        addTerminalLine(`  ${chapter.summary}`);
      });
      addTerminalLine('');
      addTerminalLine('COMMANDS:');
      addTerminalLine(`  CHAPTER "${textbook.courseName}" <number>  - Read a specific chapter`);
      addTerminalLine(`  LECTURE "${textbook.courseName}" <week>    - View lecture notes`);
      addTerminalLine('');
      if (textbook.glossary && textbook.glossary.length > 0) {
        addTerminalLine('KEY TERMS:');
        textbook.glossary.slice(0, 5).forEach((term: any) => {
          addTerminalLine(`  ${term.term}: ${term.definition}`);
        });
        if (textbook.glossary.length > 5) {
          addTerminalLine(`  ... and ${textbook.glossary.length - 5} more terms`);
        }
        addTerminalLine('');
      }
    } catch (error) {
      console.error('Error reading textbook:', error);
      addTerminalLine('');
      addTerminalLine('Error reading textbook. Please try again.', 'error');
    }
  };

  const handleAttend = async (target: string) => {
    if (!gameState) return;
    
    if (!target) {
      addTerminalLine('');
      addTerminalLine('Which class would you like to attend? Try ATTEND [course name].', 'error');
      addTerminalLine('Type SCHEDULE to see your enrolled courses.');
      return;
    }
    
    try {
      // Get character's enrollments
      const enrollmentsResponse = await fetch(`/api/enrollments/character/${gameState.character.id}`);
      if (!enrollmentsResponse.ok) {
        addTerminalLine('');
        addTerminalLine('Failed to fetch enrollments.', 'error');
        return;
      }
      
      const enrollments = await enrollmentsResponse.json();
      const activeEnrollments = enrollments.filter((e: any) => e.status === 'enrolled');
      
      if (activeEnrollments.length === 0) {
        addTerminalLine('');
        addTerminalLine('You are not enrolled in any courses.', 'error');
        addTerminalLine('Visit the library to enroll in GED preparation courses.');
        return;
      }
      
      // Find matching enrollment
      let matchingEnrollment = null;
      for (const enrollment of activeEnrollments) {
        const courseResponse = await fetch(`/api/courses/${enrollment.courseId}`);
        const course = await courseResponse.json();
        
        if (course.name.toLowerCase().includes(target.toLowerCase()) ||
            course.id.toLowerCase() === target.toLowerCase()) {
          matchingEnrollment = { enrollment, course };
          break;
        }
      }
      
      if (!matchingEnrollment) {
        addTerminalLine('');
        addTerminalLine(`You are not enrolled in "${target}".`, 'error');
        addTerminalLine('Type SCHEDULE to see your enrolled courses.');
        return;
      }
      
      const { enrollment, course } = matchingEnrollment;
      
      // Mark attendance (energy validation and deduction is atomic on server)
      const attendResponse = await fetch(`/api/enrollments/${enrollment.id}/attend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ characterId: gameState.character.id }),
      });
      
      if (!attendResponse.ok) {
        const error = await attendResponse.json();
        addTerminalLine('');
        
        if (error.error === 'Insufficient energy') {
          addTerminalLine('You are too tired to attend class.', 'error');
          addTerminalLine(`Attending class requires ${error.required} energy. You have ${error.available}.`);
        } else {
          addTerminalLine(error.error || 'Failed to mark attendance.', 'error');
        }
        return;
      }
      
      const result = await attendResponse.json();
      const schedule = course.schedule as any;
      
      addTerminalLine('');
      addTerminalLine(`You attend ${course.name}.`);
      addTerminalLine(`Location: ${schedule.room}`);
      addTerminalLine(`Time: ${schedule.time}`);
      addTerminalLine('');
      addTerminalLine('You participate in class discussions and take notes.');
      addTerminalLine(`Energy: -${result.energyCost} (${gameState.character.energy} → ${result.character.energy})`);
      addTerminalLine('');
      addTerminalLine('Attendance has been recorded. Keep attending to maintain good standing!');
      
      // Update game state with new energy value from server
      const updatedState = await gameStateManager.getGameState(gameState.character.id);
      if (updatedState) {
        setGameState(updatedState);
      }
    } catch (error) {
      console.error('Error attending class:', error);
      addTerminalLine('');
      addTerminalLine('Error attending class. Please try again.', 'error');
    }
  };

  const handleChapter = async (courseNameAndNumber: string) => {
    if (!gameState) return;
    
    if (!courseNameAndNumber) {
      addTerminalLine('');
      addTerminalLine('Usage: CHAPTER "[course name]" <number>', 'error');
      addTerminalLine('Example: CHAPTER "Basic Math Skills" 1');
      return;
    }
    
    try {
      // Parse course name and chapter number
      const parts = courseNameAndNumber.match(/"([^"]+)"\s+(\d+)|(.+)\s+(\d+)/);
      if (!parts) {
        addTerminalLine('');
        addTerminalLine('Usage: CHAPTER "[course name]" <number>', 'error');
        return;
      }
      
      const courseName = parts[1] || parts[3];
      const chapterNum = parseInt(parts[2] || parts[4]);
      
      // Find matching course
      const coursesResponse = await fetch('/api/courses');
      const courses = await coursesResponse.json();
      const matchingCourse = courses.find((c: any) => 
        c.name.toLowerCase().includes(courseName.toLowerCase())
      );
      
      if (!matchingCourse) {
        addTerminalLine('');
        addTerminalLine(`Course "${courseName}" not found.`, 'error');
        return;
      }
      
      // Fetch textbook
      const textbookResponse = await fetch(`/api/courses/${matchingCourse.id}/textbook`);
      if (!textbookResponse.ok) {
        addTerminalLine('');
        addTerminalLine('Textbook not available.', 'error');
        return;
      }
      
      const textbook = await textbookResponse.json();
      const chapter = textbook.chapters.find((ch: any) => ch.number === chapterNum);
      
      if (!chapter) {
        addTerminalLine('');
        addTerminalLine(`Chapter ${chapterNum} not found in this textbook.`, 'error');
        addTerminalLine(`Available chapters: 1-${textbook.chapters.length}`);
        return;
      }
      
      // Display chapter content
      addTerminalLine('');
      addTerminalLine(`📖 ${textbook.courseName}`);
      addTerminalLine(`Chapter ${chapter.number}: ${chapter.title}`);
      addTerminalLine('='.repeat(chapter.title.length + 12));
      addTerminalLine('');
      addTerminalLine('CHAPTER SUMMARY:');
      addTerminalLine(chapter.summary);
      addTerminalLine('');
      
      // Display sections
      chapter.sections.forEach((section: any, idx: number) => {
        addTerminalLine(`SECTION ${idx + 1}: ${section.title}`);
        addTerminalLine('');
        addTerminalLine(section.content);
        addTerminalLine('');
        
        if (section.keyPoints && section.keyPoints.length > 0) {
          addTerminalLine('Key Points:');
          section.keyPoints.forEach((point: string) => {
            addTerminalLine(`  • ${point}`);
          });
          addTerminalLine('');
        }
        
        if (section.examples && section.examples.length > 0) {
          addTerminalLine('Examples:');
          section.examples.forEach((example: string) => {
            addTerminalLine(`  ${example}`);
          });
          addTerminalLine('');
        }
      });
      
      // Display practice problems if available
      if (chapter.practiceProblems && chapter.practiceProblems.length > 0) {
        addTerminalLine('PRACTICE PROBLEMS:');
        chapter.practiceProblems.forEach((problem: string, idx: number) => {
          addTerminalLine(`  ${idx + 1}. ${problem}`);
        });
        addTerminalLine('');
      }
      
      // Display review questions if available
      if (chapter.reviewQuestions && chapter.reviewQuestions.length > 0) {
        addTerminalLine('REVIEW QUESTIONS:');
        chapter.reviewQuestions.forEach((question: string) => {
          addTerminalLine(`  • ${question}`);
        });
        addTerminalLine('');
      }
      
      // Update reading progress
      await fetch(`/api/reading-progress/${gameState.character.id}/${textbook.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chaptersRead: [chapterNum],
          lecturesAttended: [],
        }),
      });
      
    } catch (error) {
      console.error('Error reading chapter:', error);
      addTerminalLine('');
      addTerminalLine('Error reading chapter. Please try again.', 'error');
    }
  };

  const handleLecture = async (courseNameAndWeek: string) => {
    if (!gameState) return;
    
    if (!courseNameAndWeek) {
      addTerminalLine('');
      addTerminalLine('Usage: LECTURE "[course name]" <week>', 'error');
      addTerminalLine('Example: LECTURE "Basic Math Skills" 1');
      return;
    }
    
    try {
      // Parse course name and week number
      const parts = courseNameAndWeek.match(/"([^"]+)"\s+(\d+)|(.+)\s+(\d+)/);
      if (!parts) {
        addTerminalLine('');
        addTerminalLine('Usage: LECTURE "[course name]" <week>', 'error');
        return;
      }
      
      const courseName = parts[1] || parts[3];
      const week = parseInt(parts[2] || parts[4]);
      
      // Find matching course
      const coursesResponse = await fetch('/api/courses');
      const courses = await coursesResponse.json();
      const matchingCourse = courses.find((c: any) => 
        c.name.toLowerCase().includes(courseName.toLowerCase())
      );
      
      if (!matchingCourse) {
        addTerminalLine('');
        addTerminalLine(`Course "${courseName}" not found.`, 'error');
        return;
      }
      
      // Fetch lecture
      const lectureResponse = await fetch(`/api/courses/${matchingCourse.id}/lectures/${week}`);
      if (!lectureResponse.ok) {
        addTerminalLine('');
        addTerminalLine(`Lecture for week ${week} not found.`, 'error');
        addTerminalLine('Available weeks: 1-12');
        return;
      }
      
      const lecture = await lectureResponse.json();
      
      // Display lecture content
      addTerminalLine('');
      addTerminalLine(`🎓 ${matchingCourse.name}`);
      addTerminalLine(lecture.title);
      addTerminalLine('='.repeat(lecture.title.length));
      addTerminalLine('');
      addTerminalLine(`Duration: ${lecture.duration}`);
      addTerminalLine(`Topic: ${lecture.topic}`);
      addTerminalLine('');
      
      addTerminalLine('LEARNING OBJECTIVES:');
      lecture.objectives.forEach((obj: string) => {
        addTerminalLine(`  • ${obj}`);
      });
      addTerminalLine('');
      
      addTerminalLine('LECTURE CONTENT:');
      addTerminalLine('');
      const contentLines = lecture.content.split('\n\n');
      contentLines.forEach((line: string) => {
        addTerminalLine(line);
        addTerminalLine('');
      });
      
      if (lecture.keyTerms && lecture.keyTerms.length > 0) {
        addTerminalLine('KEY TERMS:');
        lecture.keyTerms.forEach((term: any) => {
          addTerminalLine(`  ${term.term}: ${term.definition}`);
        });
        addTerminalLine('');
      }
      
      if (lecture.examples && lecture.examples.length > 0) {
        addTerminalLine('EXAMPLES:');
        lecture.examples.forEach((example: string) => {
          addTerminalLine(`  ${example}`);
        });
        addTerminalLine('');
      }
      
      if (lecture.homework) {
        addTerminalLine('HOMEWORK:');
        addTerminalLine(`  ${lecture.homework}`);
        addTerminalLine('');
      }
      
      // Update reading progress
      const textbookId = `textbook-${matchingCourse.id}`;
      await fetch(`/api/reading-progress/${gameState.character.id}/${textbookId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chaptersRead: [],
          lecturesAttended: [lecture.id],
        }),
      });
      
    } catch (error) {
      console.error('Error viewing lecture:', error);
      addTerminalLine('');
      addTerminalLine('Error viewing lecture. Please try again.', 'error');
    }
  };
  
  const handleTalkTopic = async (personName: string, topic: string) => {
    const npcs = await gameStateManager.getNPCsInCurrentLocation();
    const npc = npcs.find(n => 
      n.name.toLowerCase().includes(personName.toLowerCase()) ||
      personName.toLowerCase().includes(n.name.toLowerCase().split(' ')[0]) ||
      n.name.toLowerCase() === personName.toLowerCase()
    );
    
    if (!npc) {
      addTerminalLine('');
      addTerminalLine(`You don't see anyone named ${personName} here.`, 'error');
      return;
    }
    
    const dialogue = npc.dialogue as any;
    const topics = dialogue.topics || {};
    
    // Enhanced topic matching - try multiple strategies
    let matchedTopic = null;
    let topicResponse = null;
    
    // 1. Direct match (exactly as stored)
    if (topics[topic]) {
      matchedTopic = topic;
      topicResponse = topics[topic];
    }
    // 2. Try without underscores (convert "academy_secrets" to "academysecrets")
    else if (topics[topic.replace(/_/g, '')]) {
      matchedTopic = topic.replace(/_/g, '');
      topicResponse = topics[matchedTopic];
    }
    // 3. Try the reverse - look for topics that match when converted to underscores
    else {
      const matchingTopicKey = Object.keys(topics).find(t => {
        const normalizedTopic = t.toLowerCase().replace(/\s+/g, '_');
        const userTopic = topic.toLowerCase().replace(/\s+/g, '_');
        return normalizedTopic === userTopic;
      });
      
      if (matchingTopicKey) {
        matchedTopic = matchingTopicKey;
        topicResponse = topics[matchingTopicKey];
      }
    }
    
    if (matchedTopic && topicResponse) {
      addTerminalLine('');
      addTerminalLine(`${npc.name}: "${topicResponse}"`);
      
      // Update reputation based on conversation
      if (gameState) {
        await updateConversationReputation(npc, matchedTopic);
      }
    } else {
      addTerminalLine('');
      const availableTopics = Object.keys(topics).map(t => t.replace(/_/g, ' ').toUpperCase()).join(', ');
      if (availableTopics) {
        addTerminalLine(`${npc.name}: "I don't know much about that. You could ask me about: ${availableTopics}"`);
        // Debug info for development
        console.log('Topic not found:', {
          searchedTopic: topic,
          availableTopics: Object.keys(topics),
          npcName: npc.name
        });
      } else {
        addTerminalLine(`${npc.name}: "I don't have much to say about that right now."`);
      }
    }
  };
  
  const updateConversationReputation = async (npc: any, topic: string) => {
    if (!gameState) return;
    
    // Small reputation gains for meaningful conversations
    let reputationGain = 1;
    
    // Bonus reputation for faction members
    if (npc.faction === gameState.character.faction) {
      reputationGain += 1;
    }
    
    // Special topics give different reputation
    if (topic.includes('academy') || topic.includes('secret')) {
      reputationGain += 1; // Mysterious reputation
    }
    
    // Update character reputation (this would normally call the API)
    // For now, just show a message
    if (reputationGain > 1) {
      addTerminalLine('');
      addTerminalLine(`Your conversation with ${npc.name.split(' ')[0]} has strengthened your reputation.`, 'system');
    }
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
      commandHistory={commandHistory}
    />
  );
}