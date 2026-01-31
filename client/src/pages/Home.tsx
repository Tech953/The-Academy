import { useState, useEffect, useCallback } from 'react';
import TerminalInterface from '@/components/TerminalInterface';
import AcademyGameLayout from '@/components/AcademyGameLayout';
import TextCharacterCreation from '@/components/TextCharacterCreation';
import Tutorial from '@/components/Tutorial';
import { Character } from '@/components/CharacterSheet';
import { gameStateManager, GameState, TerminalLine, IntentEnum } from '@/lib/gameState';
import { Location, NPC, GameStats, GameReputation, LegacyGameStats } from '@shared/schema';
import { mapLegacyStats, FullCharacterStats, DEFAULT_STATS } from '@shared/stats';
import { accessibilityManager, ACCESSIBILITY_PROFILES } from '@/lib/accessibility';
import { i18nManager } from '@/lib/i18n';
import { glossaryManager } from '@/lib/glossary';
import { localizedContentManager } from '@/lib/localizedContent';
import { useGameState } from '@/contexts/GameStateContext';
import {
  CONFLUENCE_NODES,
  initializeConfluenceState,
  advanceNode,
  calculatePlayerStats,
  calculateContradictionMap,
  determineDepartureVector,
  getDepartureVectorById,
  generateGraduationNarrative,
  ConfluenceState,
  PlayerStats,
  ContradictionMap,
  DepartureVector as ConfluenceDepartureVector
} from '@/lib/confluenceHall';

interface HomeProps {
  onExit?: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export default function Home({ onExit, isFullscreen = false, onToggleFullscreen }: HomeProps) {
  // Boot screen is now handled at App.tsx level
  const [character, setCharacter] = useState<Character | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([]);
  const [loading, setLoading] = useState(false);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [showTutorial, setShowTutorial] = useState(false);
  const [confluenceState, setConfluenceState] = useState<ConfluenceState | null>(null);
  const [inGraduationCeremony, setInGraduationCeremony] = useState(false);
  const [confluencePlayerStats, setConfluencePlayerStats] = useState<PlayerStats | null>(null);
  const [confluenceContradictions, setConfluenceContradictions] = useState<ContradictionMap | null>(null);
  const [confluenceDepartureVector, setConfluenceDepartureVector] = useState<ConfluenceDepartureVector | null>(null);
  
  const { addMessage, addEmail, updateCharacter, addExperience } = useGameState();

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
    
    // Show corridor mutations/atmosphere if applicable
    const corridorDescriptions = gameStateManager.getCorridorDescription();
    if (corridorDescriptions.length > 0) {
      addTerminalLine('');
      corridorDescriptions.forEach(desc => {
        addTerminalLine(desc, 'system');
      });
    }
    
    // Show active mythic flags affecting the environment
    const mythicFlags = gameStateManager.getActiveMythicFlags();
    if (mythicFlags.length > 0) {
      addTerminalLine('');
      addTerminalLine('[Something feels different here...]', 'system');
    }
    
    // Show misread count subtly if significant
    const misreadCount = gameStateManager.getMisreadCount();
    if (misreadCount >= 5) {
      addTerminalLine('');
      addTerminalLine(`[The Academy seems to be watching you more closely... (${misreadCount} misunderstandings)]`, 'system');
    }
    
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

  // If character hasn't been created yet, show character creation
  if (!character || !gameStarted) {
    return (
      <div style={{ 
        position: isFullscreen ? 'fixed' : 'relative', 
        width: isFullscreen ? '100vw' : '100%', 
        height: isFullscreen ? '100vh' : '100%',
        top: isFullscreen ? 0 : undefined,
        left: isFullscreen ? 0 : undefined,
        zIndex: isFullscreen ? 9999 : undefined,
        background: '#000'
      }}>
        <TextCharacterCreation 
          onComplete={(newCharacter) => {
            setCharacter(newCharacter);
            setGameStarted(true);
          }}
        />
        {onToggleFullscreen && (
          <button
            onClick={onToggleFullscreen}
            data-testid="button-fullscreen-toggle"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              zIndex: 9999,
              background: 'rgba(0, 255, 0, 0.1)',
              border: '1px solid rgba(0, 255, 0, 0.3)',
              borderRadius: '4px',
              padding: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0.7,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00ff00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {isFullscreen ? (
                <>
                  <polyline points="4 14 10 14 10 20" />
                  <polyline points="20 10 14 10 14 4" />
                  <line x1="14" y1="10" x2="21" y2="3" />
                  <line x1="3" y1="21" x2="10" y2="14" />
                </>
              ) : (
                <>
                  <polyline points="15 3 21 3 21 9" />
                  <polyline points="9 21 3 21 3 15" />
                  <line x1="21" y1="3" x2="14" y2="10" />
                  <line x1="3" y1="21" x2="10" y2="14" />
                </>
              )}
            </svg>
          </button>
        )}
      </div>
    );
  }

  // Show loading state while initializing
  if (loading || !gameState) {
    return (
      <div 
        className="bg-background text-foreground font-mono flex items-center justify-center" 
        style={{ 
          position: isFullscreen ? 'fixed' : 'relative',
          width: isFullscreen ? '100vw' : '100%',
          height: isFullscreen ? '100vh' : '100%',
          top: isFullscreen ? 0 : undefined,
          left: isFullscreen ? 0 : undefined,
          zIndex: isFullscreen ? 9999 : undefined,
        }}
      >
        <div className="text-center">
          <div className="text-2xl mb-4">THE ACADEMY</div>
          <div>Initializing game world...</div>
        </div>
        {onToggleFullscreen && (
          <button
            onClick={onToggleFullscreen}
            data-testid="button-fullscreen-toggle"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              zIndex: 9999,
              background: 'rgba(0, 255, 0, 0.1)',
              border: '1px solid rgba(0, 255, 0, 0.3)',
              borderRadius: '4px',
              padding: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0.7,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00ff00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {isFullscreen ? (
                <>
                  <polyline points="4 14 10 14 10 20" />
                  <polyline points="20 10 14 10 14 4" />
                  <line x1="14" y1="10" x2="21" y2="3" />
                  <line x1="3" y1="21" x2="10" y2="14" />
                </>
              ) : (
                <>
                  <polyline points="15 3 21 3 21 9" />
                  <polyline points="9 21 3 21 3 15" />
                  <line x1="21" y1="3" x2="14" y2="10" />
                  <line x1="3" y1="21" x2="10" y2="14" />
                </>
              )}
            </svg>
          </button>
        )}
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
    // Commands that should skip NLP and use traditional parsing directly
    const skipNlpCommands = [
      'help', '?', 'look', 'l', 'inventory', 'i', 'inv', 'status', 'st', 'stat', 'stats',
      'save', 'load', 'time', 'score', 'clear', 'quit', 'exit', 'q', 'tutorial', 'guide',
      'grades', 'transcript', 'schedule', 'gpa', 'read', 'attend', 'chapter', 'lecture',
      'note', 'notes', 'notebook', 'study', 'progress'
    ];
    
    const firstWord = command.toLowerCase().trim().split(/\s+/)[0];
    if (skipNlpCommands.includes(firstWord)) {
      return parseCommandTraditional(command);
    }
    
    // Try NLP processing for more natural input
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
      'who': 'list', 'people': 'list', 'characters': 'list',
      'guide': 'tutorial', 'howto': 'tutorial', 'instructions': 'tutorial'
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
    
    // Intercept commands during Confluence Hall graduation ceremony
    if (inGraduationCeremony && confluenceState) {
      addTerminalLine(`> ${command}`, 'command');
      handleConfluenceStep(command);
      return;
    }
    
    // Track command in history (limit to last 50 commands)
    setCommandHistory(prev => [...prev.slice(-49), command.toUpperCase()]);
    
    const { action, target, originalAction, nlpUsed, confidence, reasoning } = await parseCommandWithNLP(command);
    
    // Additional safety check in case parsing fails
    if (!action) {
      addTerminalLine(`> ${command}`, 'command');
      addTerminalLine('');
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
        addTerminalLine('ENROLL - View available courses');
        addTerminalLine('ENROLL [course] - Enroll in a course');
        addTerminalLine('GRADUATION - Check GED progress and graduate');
        addTerminalLine('');
        addTerminalLine('== Research Notebook ==');
        addTerminalLine('NOTES - List all research notes');
        addTerminalLine('NOTE [#] - View a specific note');
        addTerminalLine('NOTE NEW [title] - Create a new note');
        addTerminalLine('NOTE SEARCH [q] - Search your notes');
        addTerminalLine('NOTEBOOK - View notebook statistics');
        addTerminalLine('STUDY - Get study recommendations');
        addTerminalLine('PROGRESS - View academic progress');
        addTerminalLine('');
        addTerminalLine('== Game ==');
        addTerminalLine('TUTORIAL - Open the detailed game tutorial');
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
    } else if (action === 'note' || action === 'notes') {
      handleNotes(target);
    } else if (action === 'notebook') {
      handleNotebook();
    } else if (action === 'study') {
      handleStudyRecommendations();
    } else if (action === 'progress') {
      handleProgress();
    } else if (action === 'enroll') {
      handleEnroll(target);
    } else if (action === 'courses') {
      handleCourses();
    } else if (action === 'assignments' || action === 'homework') {
      handleAssignments();
    } else if (action === 'textbook') {
      handleTextbook(target);
    } else if (action === 'graduation' || action === 'graduate' || action === 'ged') {
      handleGraduation(target);
    } else if (action === 'quit' || action === 'exit') {
      handleQuit();
    } else if (action === 'clear') {
      setTerminalLines([]);
      addTerminalLine('Terminal cleared.', 'system');
    } else if (action === 'tutorial' || action === 'guide') {
      addTerminalLine('');
      addTerminalLine('Opening tutorial...', 'system');
      setShowTutorial(true);
    } else if (action === 'accessibility' || action === 'a11y') {
      handleAccessibility(target);
    } else if (action === 'lang' || action === 'language') {
      handleLanguage(target);
    } else if (action === 'glossary' || action === 'define') {
      handleGlossary(target);
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
      
      // Map target to an object archetype for the resolver
      const archetypeMapping: Record<string, string> = {
        'portraits': 'MYSTERIOUS_SYMBOL',
        'door': 'LOCKED_DOOR',
        'locked_door': 'LOCKED_DOOR',
        'artifact': 'SACRED_ARTIFACT',
        'symbol': 'MYSTERIOUS_SYMBOL',
        'fireplace': 'MYSTERIOUS_SYMBOL',
        'chandelier': 'MYSTERIOUS_SYMBOL'
      };
      
      const archetypeId = archetypeMapping[target];
      
      // Use the interaction resolver for mapped objects
      if (archetypeId) {
        const outcome = gameStateManager.processInteraction('Examine' as IntentEnum, archetypeId);
        
        if (outcome) {
          // Show resolver message if there was a misread
          if (outcome.wasMisread) {
            addTerminalLine(outcome.message, 'system');
            addTerminalLine('');
          }
        }
      }
      
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
      
      // Determine NPC archetype based on faction/role
      let archetypeId = 'STUDENT_NPC';
      if (npc.faction === 'faculty' || npc.title?.toLowerCase().includes('professor') || 
          npc.title?.toLowerCase().includes('dean') || npc.title?.toLowerCase().includes('instructor')) {
        archetypeId = 'FACULTY_NPC';
      }
      
      // Use the interaction resolver to process the talk interaction
      const outcome = gameStateManager.processInteraction('Talk' as IntentEnum, archetypeId);
      
      // Show misread effects if the NPC misinterpreted the player's approach
      if (outcome && outcome.wasMisread) {
        addTerminalLine(outcome.message, 'system');
        addTerminalLine('');
      }
      
      const dialogue = npc.dialogue as any;
      const greeting = dialogue.greeting || 'Hello there.';
      
      // Modify greeting based on interaction outcome
      if (outcome && !outcome.success && outcome.wasMisread) {
        addTerminalLine(`${npc.name}: *eyes you suspiciously* "${greeting}"`);
      } else {
        addTerminalLine(`${npc.name}: "${greeting}"`);
      }
      
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
      
      // Show mythic flag effects if relevant
      if (gameStateManager.isMythicFlagActive('WatchersEye') && archetypeId === 'FACULTY_NPC') {
        addTerminalLine('');
        addTerminalLine('[You sense this faculty member already knows things about you...]', 'system');
      }
      
      // Sometimes NPCs will follow up with a message after conversation (15% chance)
      const shouldSendFollowUp = Math.random() < 0.15;
      if (shouldSendFollowUp) {
        const followUpMessages: Record<string, string[]> = {
          'FACULTY_NPC': [
            `I've been thinking about our conversation. Please review the assigned readings when you get a chance.`,
            `Good to meet you. Remember, my office hours are always open if you have questions.`,
            `It was nice talking with you. I see potential in you - don't waste it.`,
          ],
          'STUDENT_NPC': [
            `Hey! Nice talking to you earlier. We should hang out more.`,
            `Thanks for the chat! This place can be weird but at least we're in it together.`,
            `Good running into you. Let me know if you want to study together sometime!`,
          ],
        };
        const pool = followUpMessages[archetypeId] || followUpMessages['STUDENT_NPC'];
        const followUpContent = pool[Math.floor(Math.random() * pool.length)];
        
        setTimeout(() => {
          addMessage({
            from: npc.name,
            fromTitle: npc.title || (archetypeId === 'FACULTY_NPC' ? 'Faculty' : 'Student'),
            content: followUpContent,
          });
        }, 5000 + Math.random() * 10000);
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
    
    const rawStats = gameState.character.stats as Record<string, number>;
    const rep = gameState.character.reputation as GameReputation;
    
    // Check if using new stat system or legacy - convert if needed
    const hasNewStats = 'quickness' in rawStats || 'mathLogic' in rawStats || 'faith' in rawStats;
    const fullStats: FullCharacterStats = hasNewStats 
      ? { ...DEFAULT_STATS, ...rawStats } as FullCharacterStats
      : { ...DEFAULT_STATS, ...mapLegacyStats(rawStats as unknown as LegacyGameStats) };
    
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
    addTerminalLine('Physical:');
    addTerminalLine(`  Quickness: ${fullStats.quickness}, Endurance: ${fullStats.endurance}, Agility: ${fullStats.agility}`);
    addTerminalLine(`  Speed: ${fullStats.speed}, Strength: ${fullStats.strength}`);
    addTerminalLine('Mental:');
    addTerminalLine(`  Math-Logic: ${fullStats.mathLogic}, Linguistic: ${fullStats.linguistic}`);
    addTerminalLine(`  Presence: ${fullStats.presence}, Fortitude: ${fullStats.fortitude}, Creative: ${fullStats.musicCreative}`);
    addTerminalLine('Spiritual:');
    addTerminalLine(`  Faith: ${fullStats.faith}, Karma: ${fullStats.karma}, Luck: ${fullStats.luck}`);
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
    
    // Calculate total stats using proper conversion
    const rawStats = gameState.character.stats as Record<string, number>;
    const hasNewStats = 'quickness' in rawStats || 'mathLogic' in rawStats || 'faith' in rawStats;
    const fullStats: FullCharacterStats = hasNewStats 
      ? { ...DEFAULT_STATS, ...rawStats } as FullCharacterStats
      : { ...DEFAULT_STATS, ...mapLegacyStats(rawStats as unknown as LegacyGameStats) };
    
    const physicalTotal = fullStats.quickness + fullStats.endurance + fullStats.agility + fullStats.speed + fullStats.strength;
    const mentalTotal = fullStats.mathLogic + fullStats.linguistic + fullStats.presence + fullStats.fortitude + fullStats.musicCreative;
    const spiritualTotal = fullStats.faith + fullStats.karma + fullStats.luck + fullStats.chi + fullStats.resonance + fullStats.nagual + fullStats.ashe;
    const totalStats = physicalTotal + mentalTotal + spiritualTotal;
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
          if (schedule?.days && Array.isArray(schedule.days)) {
            addTerminalLine(`  ${schedule.days.join(', ')} | ${schedule.time || 'TBD'}`);
            addTerminalLine(`  Location: ${schedule.room || 'TBA'}`);
          } else {
            addTerminalLine(`  Schedule: To be announced`);
          }
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

  // Research Notebook Command Handlers
  const handleNotes = (target: string) => {
    addTerminalLine('');
    
    if (!target) {
      // List all notes
      const notes = gameStateManager.getAllNotes();
      if (notes.length === 0) {
        addTerminalLine('RESEARCH NOTEBOOK');
        addTerminalLine('=================');
        addTerminalLine('');
        addTerminalLine('Your research notebook is empty.');
        addTerminalLine('');
        addTerminalLine('Commands:');
        addTerminalLine('  NOTE NEW [title] - Create a new note');
        addTerminalLine('  NOTE [id]        - View a specific note');
        addTerminalLine('  NOTE SEARCH [query] - Search notes');
        return;
      }
      
      addTerminalLine('RESEARCH NOTES');
      addTerminalLine('==============');
      addTerminalLine('');
      
      // Get bookmarks from the notebook
      const notebook = gameStateManager.getResearchNotebook();
      const bookmarkedIds = notebook?.bookmarks || [];
      
      notes.forEach((note, index) => {
        const readStatus = note.isRead ? ' ' : '*';
        const isBookmarked = bookmarkedIds.includes(note.id);
        const bookmarkStatus = isBookmarked ? '[B]' : '   ';
        const tags = note.tags.length > 0 ? ` [${note.tags.join(', ')}]` : '';
        const shortId = note.id.slice(0, 6);
        addTerminalLine(`${readStatus} ${bookmarkStatus} ${index + 1}. [${shortId}] ${note.title}${tags}`);
      });
      
      addTerminalLine('');
      addTerminalLine('* = unread, [B] = bookmarked');
      addTerminalLine('');
      addTerminalLine('Type NOTE [number or id] to view a note.');
      return;
    }
    
    // Parse subcommands
    const parts = target.split(' ');
    const subCmd = parts[0].toLowerCase();
    
    if (subCmd === 'new' || subCmd === 'create') {
      const title = parts.slice(1).join(' ') || 'Untitled Note';
      const note = gameStateManager.createResearchNote(
        title,
        'Enter your notes here...',
        [],
        []
      );
      if (note) {
        addTerminalLine(`Created new note: "${title}"`);
        addTerminalLine(`Note ID: ${note.id}`);
        addTerminalLine('');
        addTerminalLine('Edit your note in the Research Notebook desktop app.');
      } else {
        addTerminalLine('Failed to create note.', 'error');
      }
      return;
    }
    
    if (subCmd === 'search') {
      const query = parts.slice(1).join(' ');
      if (!query) {
        addTerminalLine('Usage: NOTE SEARCH [query]', 'error');
        return;
      }
      
      const results = gameStateManager.searchResearchNotes(query);
      if (results.length === 0) {
        addTerminalLine(`No notes found matching "${query}".`);
        return;
      }
      
      addTerminalLine(`SEARCH RESULTS FOR "${query.toUpperCase()}"`);
      addTerminalLine('='.repeat(25 + query.length));
      addTerminalLine('');
      
      results.forEach((note, index) => {
        const preview = note.content.substring(0, 60) + (note.content.length > 60 ? '...' : '');
        addTerminalLine(`${index + 1}. ${note.title}`);
        addTerminalLine(`   ${preview}`);
        addTerminalLine('');
      });
      return;
    }
    
    if (subCmd === 'tag') {
      const tag = parts.slice(1).join(' ');
      if (!tag) {
        addTerminalLine('Usage: NOTE TAG [tag name]', 'error');
        return;
      }
      
      const results = gameStateManager.getNotesByTag(tag);
      if (results.length === 0) {
        addTerminalLine(`No notes found with tag "${tag}".`);
        return;
      }
      
      addTerminalLine(`NOTES TAGGED: ${tag.toUpperCase()}`);
      addTerminalLine('='.repeat(14 + tag.length));
      addTerminalLine('');
      
      results.forEach((note, index) => {
        addTerminalLine(`${index + 1}. ${note.title}`);
      });
      return;
    }
    
    if (subCmd === 'delete') {
      const noteNum = parseInt(parts[1]) - 1;
      const notes = gameStateManager.getAllNotes();
      
      if (isNaN(noteNum) || noteNum < 0 || noteNum >= notes.length) {
        addTerminalLine('Invalid note number.', 'error');
        return;
      }
      
      const note = notes[noteNum];
      gameStateManager.deleteResearchNote(note.id);
      addTerminalLine(`Deleted note: "${note.title}"`);
      return;
    }
    
    if (subCmd === 'bookmark') {
      const noteNum = parseInt(parts[1]) - 1;
      const notes = gameStateManager.getAllNotes();
      
      if (isNaN(noteNum) || noteNum < 0 || noteNum >= notes.length) {
        addTerminalLine('Invalid note number.', 'error');
        return;
      }
      
      const note = notes[noteNum];
      // Check current bookmark status from notebook.bookmarks
      const notebook = gameStateManager.getResearchNotebook();
      const wasBookmarked = notebook?.bookmarks?.includes(note.id) || false;
      
      gameStateManager.toggleNoteBookmark(note.id);
      const newStatus = wasBookmarked ? 'unbookmarked' : 'bookmarked';
      addTerminalLine(`Note "${note.title}" ${newStatus}.`);
      return;
    }
    
    // Try to view a specific note by number or ID
    const noteNum = parseInt(target) - 1;
    const notes = gameStateManager.getAllNotes();
    
    // Try by index first
    if (!isNaN(noteNum) && noteNum >= 0 && noteNum < notes.length) {
      const note = notes[noteNum];
      gameStateManager.markNoteRead(note.id);
      
      const display = gameStateManager.formatNote(note.id);
      display.split('\n').forEach(line => addTerminalLine(line));
      return;
    }
    
    // Try to find by ID (partial match)
    const noteById = notes.find(n => n.id.startsWith(target) || n.id === target);
    if (noteById) {
      gameStateManager.markNoteRead(noteById.id);
      
      const display = gameStateManager.formatNote(noteById.id);
      display.split('\n').forEach(line => addTerminalLine(line));
      return;
    }
    
    addTerminalLine(`Unknown note command: ${target}`, 'error');
    addTerminalLine('');
    addTerminalLine('Commands:');
    addTerminalLine('  NOTES            - List all notes');
    addTerminalLine('  NOTE [number]    - View a note');
    addTerminalLine('  NOTE NEW [title] - Create a note');
    addTerminalLine('  NOTE SEARCH [q]  - Search notes');
    addTerminalLine('  NOTE TAG [tag]   - Filter by tag');
    addTerminalLine('  NOTE DELETE [n]  - Delete a note');
    addTerminalLine('  NOTE BOOKMARK [n] - Toggle bookmark');
  };

  const handleNotebook = () => {
    addTerminalLine('');
    const stats = gameStateManager.getNotebookStats();
    stats.split('\n').forEach(line => addTerminalLine(line));
    addTerminalLine('');
    addTerminalLine('Type NOTES to view all notes, or STUDY for recommendations.');
  };

  const handleStudyRecommendations = () => {
    addTerminalLine('');
    addTerminalLine('STUDY RECOMMENDATIONS');
    addTerminalLine('=====================');
    addTerminalLine('');
    
    const recommendations = gameStateManager.getStudyRecommendations([]);
    
    if (recommendations.length === 0) {
      addTerminalLine('No specific recommendations at this time.');
      addTerminalLine('');
      addTerminalLine('Tips:');
      addTerminalLine('  - Create notes while reading textbooks');
      addTerminalLine('  - Tag notes by subject for organization');
      addTerminalLine('  - Review unread notes regularly');
      return;
    }
    
    recommendations.slice(0, 5).forEach((rec, index) => {
      addTerminalLine(`${index + 1}. ${rec.resourceName}`);
      addTerminalLine(`   ${rec.reason}`);
      if (rec.unreadNotesCount && rec.unreadNotesCount > 0) {
        addTerminalLine(`   ${rec.unreadNotesCount} unread notes`);
      }
      addTerminalLine('');
    });
    
    addTerminalLine('Type PROGRESS to see your overall academic progress.');
  };

  const handleProgress = () => {
    addTerminalLine('');
    addTerminalLine('ACADEMIC PROGRESS');
    addTerminalLine('=================');
    addTerminalLine('');
    
    const progress = gameStateManager.getStudentProgress();
    
    addTerminalLine(`Notes Created: ${progress.totalNotesCreated}`);
    addTerminalLine(`Notes Reviewed: ${progress.totalNotesRead}`);
    addTerminalLine(`Chapters Completed: ${progress.chaptersCompleted}`);
    addTerminalLine(`Assignments Done: ${progress.assignmentsCompleted}`);
    addTerminalLine(`Lectures Attended: ${progress.lecturesAttended}`);
    addTerminalLine('');
    addTerminalLine(`Overall Progress: ${Math.round(progress.overallProgress * 100)}%`);
    addTerminalLine(`Study Streak: ${progress.studyStreak} days`);
    
    const subjects = Object.keys(progress.subjectProgress);
    if (subjects.length > 0) {
      addTerminalLine('');
      addTerminalLine('SUBJECT PROGRESS');
      addTerminalLine('----------------');
      subjects.forEach(subject => {
        const pct = Math.round(progress.subjectProgress[subject] * 100);
        const bar = '='.repeat(Math.floor(pct / 5)) + ' '.repeat(20 - Math.floor(pct / 5));
        addTerminalLine(`${subject}: [${bar}] ${pct}%`);
      });
    }
    
    addTerminalLine('');
    addTerminalLine('Type STUDY for personalized study recommendations.');
  };

  const handleEnroll = async (target?: string) => {
    if (!gameState) return;
    
    addTerminalLine('');
    
    try {
      const coursesResponse = await fetch('/api/courses');
      if (!coursesResponse.ok) {
        addTerminalLine('Failed to access course catalog.', 'error');
        return;
      }
      
      const courses = await coursesResponse.json();
      
      if (!target || target === 'list') {
        addTerminalLine('AVAILABLE GED PREPARATION COURSES');
        addTerminalLine('==================================');
        addTerminalLine('');
        
        const areas = ['Language Arts', 'Mathematics', 'Science', 'Social Studies'];
        areas.forEach(area => {
          const areaCourses = courses.filter((c: any) => c.gedArea === area);
          if (areaCourses.length > 0) {
            addTerminalLine(`${area}:`);
            areaCourses.forEach((c: any, idx: number) => {
              addTerminalLine(`  ${idx + 1}. ${c.name} (${c.credits} credits)`);
            });
            addTerminalLine('');
          }
        });
        
        addTerminalLine('To enroll, type ENROLL [course name]');
        addTerminalLine('Example: ENROLL Algebra');
        return;
      }
      
      const matchingCourse = courses.find((c: any) => 
        c.name.toLowerCase().includes(target.toLowerCase()) ||
        c.id.toLowerCase() === target.toLowerCase()
      );
      
      if (!matchingCourse) {
        addTerminalLine(`Course "${target}" not found.`, 'error');
        addTerminalLine('Type ENROLL to see available courses.');
        return;
      }
      
      const enrollResponse = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterId: gameState.character.id,
          courseId: matchingCourse.id,
          semester: 'Fall 2024',
          status: 'enrolled'
        })
      });
      
      if (!enrollResponse.ok) {
        const error = await enrollResponse.json();
        if (error.error?.includes('Already enrolled')) {
          addTerminalLine(`You are already enrolled in ${matchingCourse.name}.`, 'system');
        } else {
          addTerminalLine(`Failed to enroll: ${error.error}`, 'error');
        }
        return;
      }
      
      addTerminalLine(`Successfully enrolled in ${matchingCourse.name}!`, 'system');
      addTerminalLine('');
      addTerminalLine(`Course: ${matchingCourse.name}`);
      addTerminalLine(`Credits: ${matchingCourse.credits}`);
      addTerminalLine(`GED Area: ${matchingCourse.gedArea}`);
      addTerminalLine('');
      addTerminalLine('Type SCHEDULE to view your class schedule.');
      addTerminalLine('Type READ [course] to access your textbook.');
      
    } catch (error) {
      addTerminalLine('Failed to access enrollment system.', 'error');
    }
  };

  const handleCourses = async () => {
    addTerminalLine('');
    
    try {
      const coursesResponse = await fetch('/api/courses');
      if (!coursesResponse.ok) {
        addTerminalLine('Failed to access course catalog.', 'error');
        return;
      }
      
      const courses = await coursesResponse.json();
      
      addTerminalLine('GED PREPARATION COURSE CATALOG');
      addTerminalLine('==============================');
      addTerminalLine('');
      
      const areas = ['Language Arts', 'Mathematics', 'Science', 'Social Studies'];
      areas.forEach(area => {
        const areaCourses = courses.filter((c: any) => c.gedArea === area);
        if (areaCourses.length > 0) {
          addTerminalLine(`${area}:`);
          areaCourses.forEach((c: any) => {
            addTerminalLine(`  - ${c.name}: ${c.description?.slice(0, 60) || 'No description'}...`);
          });
          addTerminalLine('');
        }
      });
      
      addTerminalLine('Type ENROLL [course name] to enroll in a course.');
      
    } catch (error) {
      addTerminalLine('Failed to load course catalog.', 'error');
    }
  };

  const handleAssignments = async () => {
    if (!gameState) return;
    
    addTerminalLine('');
    addTerminalLine('YOUR ASSIGNMENTS');
    addTerminalLine('================');
    addTerminalLine('');
    
    try {
      const enrollmentsResponse = await fetch(`/api/enrollments/character/${gameState.character.id}`);
      if (!enrollmentsResponse.ok) {
        addTerminalLine('You are not enrolled in any courses.', 'system');
        addTerminalLine('Type ENROLL to see available courses.');
        return;
      }
      
      const enrollments = await enrollmentsResponse.json();
      
      if (enrollments.length === 0) {
        addTerminalLine('You are not enrolled in any courses.', 'system');
        addTerminalLine('Type ENROLL to see available courses.');
        return;
      }
      
      let hasAssignments = false;
      
      for (const enrollment of enrollments) {
        const assignmentsResponse = await fetch(`/api/courses/${enrollment.courseId}/assignments`);
        if (assignmentsResponse.ok) {
          const assignments = await assignmentsResponse.json();
          if (assignments.length > 0) {
            hasAssignments = true;
            addTerminalLine(`${enrollment.courseId.toUpperCase()}:`);
            assignments.slice(0, 3).forEach((a: any) => {
              const completed = enrollment.assignmentGrades?.[a.id] !== undefined;
              const status = completed ? '[DONE]' : '[TODO]';
              addTerminalLine(`  ${status} ${a.title} (${a.type})`);
            });
            addTerminalLine('');
          }
        }
      }
      
      if (!hasAssignments) {
        addTerminalLine('No pending assignments found.', 'system');
      }
      
      addTerminalLine('Use the Assignments Portal app for full assignment management.');
      
    } catch (error) {
      addTerminalLine('Failed to load assignments.', 'error');
    }
  };

  const handleTextbook = async (target?: string) => {
    if (!gameState) return;
    
    if (!target) {
      addTerminalLine('');
      addTerminalLine('Which textbook would you like to read?', 'error');
      addTerminalLine('Type TEXTBOOK [course name] to read a textbook.');
      addTerminalLine('Type SCHEDULE to see your enrolled courses.');
      return;
    }
    
    await handleRead(target);
  };

  const handleGraduation = (target?: string) => {
    if (!gameState) return;
    
    addTerminalLine('');
    addTerminalLine('GED PREPARATION PROGRESS');
    addTerminalLine('========================');
    addTerminalLine('');
    
    const academyProgress = gameStateManager.getAcademyProgress();
    const gedDomains = [
      { id: 'MATH', name: 'Mathematical Reasoning', icon: '=' },
      { id: 'LANG', name: 'Language Arts', icon: '~' },
      { id: 'SCI', name: 'Science', icon: '*' },
      { id: 'SOC', name: 'Social Studies', icon: '#' }
    ];
    
    let totalMastered = 0;
    let totalRequired = gedDomains.length * 3;
    
    gedDomains.forEach(domain => {
      const domainSkills = academyProgress.stableSkills?.filter((s: string) => s.startsWith(domain.id)) || [];
      const count = domainSkills.length;
      totalMastered += Math.min(count, 3);
      const bar = domain.icon.repeat(count) + '.'.repeat(Math.max(0, 3 - count));
      const status = count >= 3 ? 'READY' : `${count}/3`;
      addTerminalLine(`${domain.name}: [${bar}] ${status}`);
    });
    
    addTerminalLine('');
    addTerminalLine(`Skills Mastered: ${academyProgress.skillsMastered || 0} / 40`);
    addTerminalLine(`Skills Emerging: ${academyProgress.skillsEmerging || 0}`);
    addTerminalLine(`Overall Confidence: ${academyProgress.overallConfidence || 'unknown'}`);
    addTerminalLine('');
    
    const gedReady = academyProgress.gedReadiness;
    const culmination = gameStateManager.checkGedCulmination();
    
    if (gedReady) {
      addTerminalLine('STATUS: GED READY', 'system');
      addTerminalLine('');
      addTerminalLine('You have demonstrated mastery across all GED domains!');
      addTerminalLine('');
      
      if (target?.toLowerCase() === 'ceremony' || target?.toLowerCase() === 'now') {
        // Begin the Confluence Hall journey
        beginConfluenceHall();
      } else {
        addTerminalLine('Type GRADUATION CEREMONY to begin your journey through Confluence Hall.');
        addTerminalLine('');
        addTerminalLine('The Hall awaits. Eight nodes stand between you and departure.');
      }
    } else {
      addTerminalLine('STATUS: NOT YET READY', 'error');
      addTerminalLine('');
      addTerminalLine('Requirements for GED:');
      addTerminalLine('- Master 3+ skills in Mathematical Reasoning (MATH)');
      addTerminalLine('- Master 3+ skills in Language Arts (LANG)');
      addTerminalLine('- Master 3+ skills in Science (SCI)');
      addTerminalLine('- Master 3+ skills in Social Studies (SOC)');
      addTerminalLine('');
      addTerminalLine('Attend classes 5 times each to master their skills.');
      addTerminalLine('Type ENROLL to see available courses.');
    }
  };

  // Confluence Hall - Begin the graduation journey
  const beginConfluenceHall = () => {
    if (!gameState) return;
    
    // Check if already graduated
    if (gameStateManager.getGameFlag('confluence_completed', false)) {
      addTerminalLine('');
      addTerminalLine('You have already completed Confluence Hall.', 'system');
      addTerminalLine('Your departure vector has been determined.');
      addTerminalLine('');
      const existingVectorId = gameStateManager.getGameFlag('departure_vector', null);
      if (existingVectorId) {
        const existingVector = getDepartureVectorById(existingVectorId);
        if (existingVector) {
          addTerminalLine(`Departure Vector: ${existingVector.name}`);
          addTerminalLine(`"${existingVector.exitDescription}"`);
        }
      }
      addTerminalLine('');
      addTerminalLine('Type TRANSCRIPT to view your academic record.');
      return;
    }
    
    // Calculate player stats for the journey
    const stats = gameState.character.stats as GameStats;
    const playerStats = calculatePlayerStats({
      mathLogic: stats.mathLogic,
      linguistic: stats.linguistic,
      presence: stats.presence,
      faith: stats.faith,
      fortitude: stats.fortitude
    });
    
    // Calculate contradiction map
    const misreadsCollapsed = gameStateManager.getMisreadsCollapsed();
    const contradictionsEmbraced = gameStateManager.hasEmbracedContradictions();
    const factionAffinities = gameStateManager.getFactionAffinities();
    const contradictions = calculateContradictionMap(misreadsCollapsed, contradictionsEmbraced, factionAffinities);
    
    // Determine departure vector
    const departureVector = determineDepartureVector(playerStats, contradictions);
    
    // Initialize the confluence state
    const newState = initializeConfluenceState();
    setConfluenceState(newState);
    setInGraduationCeremony(true);
    
    // Store data in React state for the journey
    setConfluencePlayerStats(playerStats);
    setConfluenceContradictions(contradictions);
    setConfluenceDepartureVector(departureVector);
    
    // Display opening
    addTerminalLine('');
    addTerminalLine('============================================');
    addTerminalLine('       ENTERING CONFLUENCE HALL');
    addTerminalLine('============================================');
    addTerminalLine('');
    
    // Generate and display narrative intro
    const narrativeLines = generateGraduationNarrative(playerStats, contradictions, departureVector);
    narrativeLines.forEach(line => addTerminalLine(line));
    
    // Display first node
    displayConfluenceNode(newState, playerStats, contradictions);
  };

  // Display current Confluence Hall node
  const displayConfluenceNode = (state: ConfluenceState, playerStats: PlayerStats, contradictions: ContradictionMap) => {
    const currentNode = CONFLUENCE_NODES.find(n => n.id === state.currentNode);
    if (!currentNode) return;
    
    addTerminalLine('');
    addTerminalLine(`--- ${currentNode.name.toUpperCase()} ---`);
    addTerminalLine('');
    addTerminalLine(currentNode.description);
    addTerminalLine('');
    
    // Show ambient effects
    if (currentNode.ambientEffects.length > 0) {
      addTerminalLine(`[${currentNode.ambientEffects.join(' | ')}]`, 'system');
    }
    
    // Show light and harmonic state
    addTerminalLine(`Light: ${currentNode.lightState} | Harmony: ${currentNode.harmonicState}`, 'system');
    addTerminalLine('');
    
    // Show triggers if any
    if (currentNode.triggers.length > 0) {
      addTerminalLine(`Triggers: ${currentNode.triggers.join(', ')}`, 'system');
    }
    
    // Show available branches
    if (currentNode.optionalBranches.length > 0) {
      addTerminalLine('');
      addTerminalLine('Optional paths shimmer before you:');
      currentNode.optionalBranches.forEach(branch => {
        addTerminalLine(`  - ${branch.name}: ${branch.description}`);
      });
    }
    
    addTerminalLine('');
    
    // Check if this is the final node
    if (!currentNode.nextNode) {
      completeConfluenceHall();
    } else {
      addTerminalLine('Type CONTINUE to proceed, or BRANCH [name] to take an optional path.');
    }
  };

  // Handle stepping through Confluence Hall
  const handleConfluenceStep = (command: string) => {
    if (!confluenceState || !gameState || !confluencePlayerStats || !confluenceContradictions) return;
    
    const playerStats = confluencePlayerStats;
    const contradictions = confluenceContradictions;
    
    const cmd = command.toLowerCase().trim();
    
    if (cmd === 'continue' || cmd === 'next' || cmd === 'forward' || cmd === 'proceed') {
      // Advance to next node
      const { newState, node, branchTaken } = advanceNode(confluenceState, playerStats, contradictions);
      setConfluenceState(newState);
      
      if (branchTaken) {
        addTerminalLine('');
        addTerminalLine(`You take the ${branchTaken.name}...`, 'system');
        addTerminalLine(branchTaken.description);
      }
      
      displayConfluenceNode(newState, playerStats, contradictions);
    } else if (cmd.startsWith('branch ')) {
      // Take a specific optional branch
      const branchName = cmd.replace('branch ', '').trim();
      const currentNode = CONFLUENCE_NODES.find(n => n.id === confluenceState.currentNode);
      
      if (currentNode) {
        const branch = currentNode.optionalBranches.find(b => 
          b.name.toLowerCase().includes(branchName) || 
          b.id.toLowerCase().includes(branchName)
        );
        
        if (branch) {
          const { newState, node, branchTaken } = advanceNode(confluenceState, playerStats, contradictions, branch.id);
          setConfluenceState(newState);
          
          addTerminalLine('');
          addTerminalLine(`You take the ${branch.name}...`, 'system');
          addTerminalLine(branch.description);
          
          displayConfluenceNode(newState, playerStats, contradictions);
        } else {
          addTerminalLine('That path is not available here.', 'error');
        }
      }
    } else if (cmd === 'look' || cmd === 'status') {
      // Re-display current node
      displayConfluenceNode(confluenceState, playerStats, contradictions);
    } else if (cmd === 'exit' || cmd === 'leave') {
      addTerminalLine('');
      addTerminalLine('You cannot leave Confluence Hall once entered.', 'error');
      addTerminalLine('The only way is forward. Type CONTINUE to proceed.');
    } else {
      addTerminalLine('');
      addTerminalLine('In Confluence Hall, you can:', 'system');
      addTerminalLine('  CONTINUE - Proceed to the next node');
      addTerminalLine('  BRANCH [name] - Take an optional path');
      addTerminalLine('  LOOK - Examine your current surroundings');
    }
  };

  // Complete the Confluence Hall journey
  const completeConfluenceHall = () => {
    if (!gameState || !confluenceState) return;
    
    const departureVector = confluenceDepartureVector;
    
    addTerminalLine('');
    addTerminalLine('============================================');
    addTerminalLine('       DEPARTURE ARCH - FINAL THRESHOLD');
    addTerminalLine('============================================');
    addTerminalLine('');
    
    if (departureVector) {
      addTerminalLine(`Your Departure Vector: ${departureVector.name}`);
      addTerminalLine(`"${departureVector.condition}"`);
      addTerminalLine('');
      addTerminalLine(departureVector.exitDescription);
      addTerminalLine('');
      addTerminalLine(`A voice echoes: "${departureVector.npcConfirmation}"`);
    }
    
    addTerminalLine('');
    addTerminalLine('============================================');
    addTerminalLine('  CONGRATULATIONS ON YOUR GED ACHIEVEMENT!');
    addTerminalLine('============================================');
    addTerminalLine('');
    
    // Show journey summary
    addTerminalLine('--- Journey Summary ---');
    addTerminalLine(`Nodes traversed: ${confluenceState.visitedNodes.length + 1}`);
    addTerminalLine(`Branches taken: ${confluenceState.branchesTaken.length || 'None'}`);
    addTerminalLine(`Trigger Intensity - Harmonic: ${confluenceState.triggerIntensity.harmonic}, Dissonant: ${confluenceState.triggerIntensity.dissonant}, Visual: ${confluenceState.triggerIntensity.visual}`);
    addTerminalLine('');
    
    addTerminalLine('You have successfully completed The Academy.');
    addTerminalLine('Your transcript and portfolio are now available.');
    addTerminalLine('');
    addTerminalLine('Type TRANSCRIPT to view your academic record.');
    addTerminalLine('Type PORTFOLIO to view your learning portfolio.');
    
    // Mark graduation complete
    gameStateManager.setGameFlag('graduated', true);
    gameStateManager.setGameFlag('departure_vector', departureVector?.id || 'graduate');
    gameStateManager.setGameFlag('confluence_completed', true);
    
    // Exit graduation mode
    setInGraduationCeremony(false);
    setConfluenceState(null);
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
      
      const labels = localizedContentManager.getTextbookLabels();
      
      addTerminalLine('');
      addTerminalLine(`${textbook.courseName} Textbook`);
      addTerminalLine('='.repeat(textbook.courseName.length + 10));
      addTerminalLine('');
      addTerminalLine(`${labels.authors}: ${textbook.authors.join(', ')}`);
      addTerminalLine(`${labels.edition}: ${textbook.edition}`);
      addTerminalLine(`${labels.department}: ${localizedContentManager.getSubjectName(textbook.department)}`);
      addTerminalLine('');
      addTerminalLine(`${labels.toc}:`);
      addTerminalLine('');
      textbook.chapters.forEach((chapter: any) => {
        addTerminalLine(`${labels.chapter} ${chapter.number}: ${chapter.title}`);
        addTerminalLine(`  ${chapter.summary}`);
      });
      addTerminalLine('');
      addTerminalLine(`${labels.commands}:`);
      addTerminalLine(`  CHAPTER "${textbook.courseName}" <number>  - ${labels.readChapter}`);
      addTerminalLine(`  LECTURE "${textbook.courseName}" <week>    - ${labels.viewLecture}`);
      addTerminalLine('');
      if (textbook.glossary && textbook.glossary.length > 0) {
        addTerminalLine(`${labels.keyTerms}:`);
        textbook.glossary.slice(0, 5).forEach((term: any) => {
          addTerminalLine(`  ${term.term}: ${term.definition}`);
        });
        if (textbook.glossary.length > 5) {
          addTerminalLine(`  ... ${textbook.glossary.length - 5} ${labels.moreTerms}`);
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
      const updatedState = await gameStateManager.getGameState();
      if (updatedState) {
        setGameState(updatedState);
      }
      
      // Add XP for attending class
      addExperience(10);
      
      // Track skill progress based on GED area
      const gedAreaToSkillPrefix: Record<string, string> = {
        'Mathematics': 'MATH',
        'Language Arts': 'LANG',
        'Science': 'SCI',
        'Social Studies': 'SOC'
      };
      const skillPrefix = gedAreaToSkillPrefix[course.gedArea];
      if (skillPrefix) {
        // Track attendance counts client-side in game flags
        const skillId = `${skillPrefix}_${course.id.replace(/-/g, '_')}`;
        const attendanceKey = `attendance_${course.id}`;
        const currentCount = gameStateManager.getGameFlag(attendanceKey, 0);
        const newCount = currentCount + 1;
        gameStateManager.setGameFlag(attendanceKey, newCount);
        
        if (newCount >= 5) {
          // After 5 attendances, skill becomes stable/mastered
          gameStateManager.addStableSkill(skillId);
          addTerminalLine(`Skill Mastered: ${skillId}`, 'system');
        } else if (newCount >= 2) {
          // After 2 attendances, skill is emerging
          gameStateManager.addEmergingSkill(skillId);
          addTerminalLine(`Skill Progress: ${skillId} (${newCount}/5 to mastery)`, 'system');
        } else {
          addTerminalLine(`Starting to learn: ${skillId}`, 'system');
        }
      }
      
      // Sometimes the instructor sends a follow-up email after class (25% chance)
      if (Math.random() < 0.25) {
        const emailTemplates = [
          {
            subject: `${course.name} - Today's Lecture Notes`,
            body: `Dear Student,\n\nThank you for attending class today. I've posted the lecture notes and additional resources on the course portal.\n\nRemember to review the material before our next session.\n\nBest regards,\nYour Instructor`,
          },
          {
            subject: `Homework Reminder: ${course.name}`,
            body: `Hello,\n\nI wanted to remind you about the upcoming assignment for ${course.name}. Please check the Assignments Portal for details and deadlines.\n\nKeep up the good work!\n\nYour Instructor`,
          },
          {
            subject: `${course.name} - Great Participation Today`,
            body: `I noticed your engagement in today's class. Keep asking those thoughtful questions - curiosity is the key to learning.\n\nSee you next class!\n\nYour Instructor`,
          },
        ];
        const template = emailTemplates[Math.floor(Math.random() * emailTemplates.length)];
        
        setTimeout(() => {
          addEmail({
            from: `${course.name} Instructor`,
            subject: template.subject,
            body: template.body,
            category: 'academic',
          });
        }, 3000 + Math.random() * 5000);
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
      
      const lbls = localizedContentManager.getChapterLabels();
      
      // Display chapter content
      addTerminalLine('');
      addTerminalLine(`${textbook.courseName}`);
      addTerminalLine(`${lbls.chapter} ${chapter.number}: ${chapter.title}`);
      addTerminalLine('='.repeat(chapter.title.length + 12));
      addTerminalLine('');
      addTerminalLine(`${lbls.summary}:`);
      addTerminalLine(chapter.summary);
      addTerminalLine('');
      
      // Display sections
      chapter.sections.forEach((section: any, idx: number) => {
        addTerminalLine(`${lbls.section} ${idx + 1}: ${section.title}`);
        addTerminalLine('');
        addTerminalLine(section.content);
        addTerminalLine('');
        
        if (section.keyPoints && section.keyPoints.length > 0) {
          addTerminalLine(`${lbls.keyPoints}:`);
          section.keyPoints.forEach((point: string) => {
            addTerminalLine(`  • ${point}`);
          });
          addTerminalLine('');
        }
        
        if (section.examples && section.examples.length > 0) {
          addTerminalLine(`${lbls.examples}:`);
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
      const lLabels = localizedContentManager.getLectureLabels();
      
      // Display lecture content
      addTerminalLine('');
      addTerminalLine(`${matchingCourse.name}`);
      addTerminalLine(lecture.title);
      addTerminalLine('='.repeat(lecture.title.length));
      addTerminalLine('');
      addTerminalLine(`${lLabels.duration}: ${lecture.duration}`);
      addTerminalLine(`${lLabels.topic}: ${lecture.topic}`);
      addTerminalLine('');
      
      addTerminalLine(`${lLabels.objectives}:`);
      lecture.objectives.forEach((obj: string) => {
        addTerminalLine(`  • ${obj}`);
      });
      addTerminalLine('');
      
      addTerminalLine(`${lLabels.content}:`);
      addTerminalLine('');
      const contentLines = lecture.content.split('\n\n');
      contentLines.forEach((line: string) => {
        addTerminalLine(line);
        addTerminalLine('');
      });
      
      if (lecture.keyTerms && lecture.keyTerms.length > 0) {
        addTerminalLine(`${lLabels.keyTerms}:`);
        lecture.keyTerms.forEach((term: any) => {
          addTerminalLine(`  ${term.term}: ${term.definition}`);
        });
        addTerminalLine('');
      }
      
      if (lecture.examples && lecture.examples.length > 0) {
        addTerminalLine(`${lLabels.examples}:`);
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

  const handleAccessibility = (target: string) => {
    addTerminalLine('');
    
    if (!target || target === 'list') {
      accessibilityManager.formatForTerminal().forEach(line => addTerminalLine(line));
      return;
    }
    
    const parts = target.toLowerCase().split(' ');
    
    if (parts[0] === 'set' && parts.length >= 3) {
      const key = parts[1];
      const value = parts.slice(2).join(' ');
      
      if (key === 'fontsize') {
        const size = parseInt(value, 10);
        if (!isNaN(size) && size >= 10 && size <= 32) {
          accessibilityManager.setCustomSetting('fontSize', size);
          addTerminalLine(`Font size set to ${size}px`, 'system');
        } else {
          addTerminalLine('Invalid font size. Use a value between 10 and 32.', 'error');
        }
      } else if (key === 'highcontrast') {
        accessibilityManager.setCustomSetting('highContrast', value === 'on' || value === 'true');
        addTerminalLine(`High contrast ${value === 'on' || value === 'true' ? 'enabled' : 'disabled'}`, 'system');
      } else if (key === 'reducedmotion') {
        accessibilityManager.setCustomSetting('reducedMotion', value === 'on' || value === 'true');
        addTerminalLine(`Reduced motion ${value === 'on' || value === 'true' ? 'enabled' : 'disabled'}`, 'system');
      } else if (key === 'dyslexiafont') {
        accessibilityManager.setCustomSetting('dyslexiaFont', value === 'on' || value === 'true');
        addTerminalLine(`Dyslexia font ${value === 'on' || value === 'true' ? 'enabled' : 'disabled'}`, 'system');
      } else {
        addTerminalLine(`Unknown setting: ${key}`, 'error');
      }
      return;
    }
    
    const profileId = parts[0];
    if (ACCESSIBILITY_PROFILES[profileId]) {
      accessibilityManager.applyProfile(profileId);
      addTerminalLine(`Accessibility profile applied: ${ACCESSIBILITY_PROFILES[profileId].name}`, 'system');
    } else {
      addTerminalLine(`Unknown profile: ${profileId}. Type ACCESSIBILITY LIST to see available profiles.`, 'error');
    }
  };

  const handleLanguage = (target: string) => {
    addTerminalLine('');
    
    if (!target || target === 'list') {
      i18nManager.formatForTerminal().forEach(line => addTerminalLine(line));
      return;
    }
    
    const code = target.toLowerCase();
    if (i18nManager.setLanguage(code)) {
      glossaryManager.setLanguage(code);
      addTerminalLine(`Language changed to: ${i18nManager.getCurrentLanguage().nativeName}`, 'system');
    } else {
      addTerminalLine(`Language not available: ${code}. Type LANG LIST to see available languages.`, 'error');
    }
  };

  const handleGlossary = (target: string) => {
    addTerminalLine('');
    
    if (!target) {
      glossaryManager.formatForTerminal().forEach(line => addTerminalLine(line));
      return;
    }
    
    const parts = target.toLowerCase().split(' ');
    
    if (parts[0] === 'search' && parts.length > 1) {
      const query = parts.slice(1).join(' ');
      const results = glossaryManager.searchTerms(query);
      if (results.length === 0) {
        addTerminalLine(`No terms found matching "${query}"`, 'error');
      } else {
        addTerminalLine(`Found ${results.length} term(s):`);
        results.forEach(entry => {
          addTerminalLine(`  ${entry.term} (${entry.subject})`);
        });
      }
      return;
    }
    
    const subjects = ['math', 'science', 'language', 'social'];
    if (subjects.includes(parts[0])) {
      const entries = glossaryManager.getSubjectGlossary(parts[0]);
      if (entries.length === 0) {
        addTerminalLine(`No glossary entries for subject: ${parts[0]}`, 'error');
      } else {
        addTerminalLine(`Glossary terms for ${parts[0].toUpperCase()}:`);
        entries.forEach(entry => {
          addTerminalLine(`  ${entry.term}: ${entry.definition.substring(0, 60)}...`);
        });
      }
      return;
    }
    
    const entry = glossaryManager.getEntry(parts[0]);
    if (entry) {
      glossaryManager.formatEntryForTerminal(entry).forEach(line => addTerminalLine(line));
    } else {
      addTerminalLine(`Term not found: "${parts[0]}". Try GLOSSARY SEARCH <query>`, 'error');
    }
  };

  const statusLine = `${gameState.character.name} | ${gameState.character.race} ${gameState.character.class} | Location: ${gameState.currentLocation.name} | Energy: ${gameState.character.energy}/${gameState.character.maxEnergy}`;

  const gameCharacter: Character = {
    name: gameState.character.name,
    background: gameState.character.background || '',
    race: gameState.character.race,
    class: gameState.character.class,
    subClass: gameState.character.subClass || undefined,
    faction: gameState.character.faction,
    characterSummary: gameState.character.characterSummary || undefined,
    physicalTraits: gameState.character.physicalTraits as Record<string, string>,
    stats: gameState.character.stats as any,
    reputation: {
      faculty: (gameState.character.reputation as any)?.faculty || 50,
      students: (gameState.character.reputation as any)?.students || 50,
      mysterious: (gameState.character.reputation as any)?.mysterious || 10
    },
    energy: gameState.character.energy || 100,
    maxEnergy: gameState.character.maxEnergy || 100,
    perks: gameState.character.perks as any
  };

  return (
    <>
      <AcademyGameLayout
        character={gameCharacter}
        terminalLines={terminalLines}
        onCommand={handleCommand}
        commandHistory={commandHistory}
        statusLine={statusLine}
        onExit={onExit}
        isFullscreen={isFullscreen}
        onToggleFullscreen={onToggleFullscreen}
      />
      {showTutorial && (
        <Tutorial 
          onClose={() => setShowTutorial(false)}
          characterName={gameState.character.name}
        />
      )}
    </>
  );
}