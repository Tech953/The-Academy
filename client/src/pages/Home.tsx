import { useState } from 'react';
import TerminalInterface from '@/components/TerminalInterface';
import TextCharacterCreation from '@/components/TextCharacterCreation';
import { Character } from '@/components/CharacterSheet';

export default function Home() {
  const [character, setCharacter] = useState<Character | null>(null);
  const [gameStarted, setGameStarted] = useState(false);

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

  interface TerminalLine {
    id: string;
    text: string;
    type: 'output' | 'command' | 'system' | 'error';
  }

  // Terminal-style game state
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([
    { id: '1', text: 'THE ACADEMY', type: 'system' },
    { id: '2', text: '', type: 'output' },
    { id: '3', text: `Welcome to "The Academy", ${character.name}.`, type: 'output' },
    { id: '4', text: `You are a ${character.race} ${character.class} aligned with the ${character.faction} faction.`, type: 'output' },
    { id: '5', text: '', type: 'output' },
    { id: '6', text: 'This esteemed private school houses exactly 144 students in the far', type: 'output' },
    { id: '7', text: 'reaches of Toronto, Canada. As a freshman arriving from places unknown', type: 'output' },
    { id: '8', text: 'to a place even more unknown, you must navigate the mysteries that await.', type: 'output' },
    { id: '9', text: '', type: 'output' },
    { id: '10', text: 'The Academy\'s mascot, the Polar Bear, watches over students as they', type: 'output' },
    { id: '11', text: 'explore halls where every step leaves an imprint, every word ripples', type: 'output' },
    { id: '12', text: 'through ancient corridors, and every corner promises a journey into', type: 'output' },
    { id: '13', text: 'the void itself.', type: 'output' },
    { id: '14', text: '', type: 'output' },
    { id: '15', text: `Your ${character.subClass} specialization will serve you well in the`, type: 'output' },
    { id: '16', text: 'trials ahead. Not even your dormitory can protect you from the', type: 'output' },
    { id: '17', text: 'darkness that dwells within these walls.', type: 'output' },
    { id: '18', text: '', type: 'output' },
    { id: '19', text: 'MAIN LOBBY', type: 'system' },
    { id: '20', text: 'You are standing in the main lobby of The Academy. Ancient portraits', type: 'output' },
    { id: '21', text: 'line the walls, their eyes following your movement. A receptionist', type: 'output' },
    { id: '22', text: 'desk sits empty, and hallways branch off toward the Cafeteria,', type: 'output' },
    { id: '23', text: `Library (Larcen), and mysterious upper floors. The ${character.faction}`, type: 'output' },
    { id: '24', text: 'insignia glows faintly on your student badge.', type: 'output' },
    { id: '25', text: '', type: 'output' },
    { id: '26', text: 'Exits: NORTH (Cafeteria), EAST (Library), UP (Stairs), EXAMINE (Portraits)', type: 'system' },
    { id: '27', text: 'Type HELP for available commands.', type: 'system' },
  ]);

  const [currentLocation, setCurrentLocation] = useState('Main Lobby');

  const addTerminalLine = (text: string, type: TerminalLine['type'] = 'output') => {
    const newLine: TerminalLine = {
      id: Date.now().toString() + Math.random(),
      text,
      type
    };
    setTerminalLines(prev => [...prev, newLine]);
  };

  const handleCommand = (command: string) => {
    const cmd = command.toLowerCase().trim();
    
    // Add command to terminal
    addTerminalLine(`> ${command}`, 'command');

    // Process commands like classic text adventures
    if (cmd === 'help') {
      addTerminalLine('');
      addTerminalLine('Available commands:');
      addTerminalLine('LOOK - Examine your surroundings');
      addTerminalLine('GO [direction] - Move in a direction (NORTH, SOUTH, EAST, WEST, UP, DOWN)');
      addTerminalLine('EXAMINE [object] - Look at something closely');
      addTerminalLine('INVENTORY - Check your belongings');
      addTerminalLine('STATUS - View character information');
      addTerminalLine('SAVE - Save your progress');
      addTerminalLine('LOAD - Load saved game');
    } else if (cmd === 'look') {
      addTerminalLine('');
      addTerminalLine('MAIN LOBBY');
      addTerminalLine('You are standing in the main lobby of The Academy. Ancient portraits');
      addTerminalLine('line the walls, their eyes seeming to track your every movement. A');
      addTerminalLine('receptionist desk sits eerily empty. Hallways branch off in multiple');
      addTerminalLine('directions, leading deeper into the mysterious institution.');
      addTerminalLine('');
      addTerminalLine('Exits: NORTH (Cafeteria), EAST (Library), UP (Stairs)');
    } else if (cmd === 'examine portraits' || cmd === 'examine portrait') {
      addTerminalLine('');
      addTerminalLine('You step closer to examine the portraits. The painted figures seem');
      addTerminalLine('ancient, wearing academic robes from centuries past. Their eyes');
      addTerminalLine('definitely follow you as you move. One portrait\'s nameplate reads');
      addTerminalLine('"Professor Blackwood - Founder." You notice the paint seems to shift');
      addTerminalLine('slightly when you\'re not looking directly at it.');
    } else if (cmd === 'north' || cmd === 'go north' || cmd === 'cafeteria') {
      setCurrentLocation('Cafeteria');
      addTerminalLine('');
      addTerminalLine('CAFETERIA');
      addTerminalLine('You enter the Academy\'s cafeteria. Long wooden tables fill the space,');
      addTerminalLine('and students from various factions sit in distinct groups. The food');
      addTerminalLine('line serves mysterious dishes that seem to shimmer with otherworldly');
      addTerminalLine('energy. You notice other students watching you curiously.');
      addTerminalLine('');
      addTerminalLine('Exits: SOUTH (Main Lobby)');
    } else if (cmd === 'east' || cmd === 'go east' || cmd === 'library') {
      setCurrentLocation('Library (Larcen)');
      addTerminalLine('');
      addTerminalLine('LIBRARY (LARCEN)');
      addTerminalLine('You enter the vast library known as Larcen. Towering bookshelves');
      addTerminalLine('stretch impossibly high, filled with ancient tomes and forbidden');
      addTerminalLine('knowledge. Strange whispers echo from the darker sections. A sign');
      addTerminalLine('warns: "Some knowledge is not meant for freshmen."');
      addTerminalLine('');
      addTerminalLine('Exits: WEST (Main Lobby), DEEP (Restricted Section)');
    } else if (cmd === 'up' || cmd === 'go up' || cmd === 'stairs') {
      addTerminalLine('');
      addTerminalLine('As you approach the stairs, a mysterious force prevents you from');
      addTerminalLine('ascending. A spectral voice whispers: "Only those who have proven');
      addTerminalLine('themselves may access the upper floors." You feel a chill run down');
      addTerminalLine('your spine.');
    } else if (cmd === 'status') {
      addTerminalLine('');
      addTerminalLine('CHARACTER STATUS:');
      addTerminalLine(`Name: ${character.name}`);
      addTerminalLine(`Race: ${character.race}`);
      addTerminalLine(`Class: ${character.class} (${character.subClass})`);
      addTerminalLine(`Faction: ${character.faction}`);
      addTerminalLine(`Location: ${currentLocation}`);
      addTerminalLine(`Health: ${character.energy}/${character.maxEnergy}`);
    } else if (cmd === 'inventory') {
      addTerminalLine('');
      addTerminalLine('INVENTORY:');
      addTerminalLine('- Student ID badge (glowing with faction insignia)');
      addTerminalLine('- Academy handbook (pages seem to change when not being read)');
      addTerminalLine('- Dormitory key (room assignment: pending)');
    } else if (cmd === 'save') {
      addTerminalLine('');
      addTerminalLine('Game saved successfully.', 'system');
    } else if (cmd === 'load') {
      addTerminalLine('');
      addTerminalLine('No saved games found.', 'error');
    } else {
      addTerminalLine('');
      addTerminalLine(`I don't understand "${command}". Type HELP for available commands.`, 'error');
    }
  };

  const statusLine = `${character.name} | ${character.race} ${character.class} | Location: ${currentLocation} | Health: ${character.energy}/${character.maxEnergy}`;

  return (
    <TerminalInterface
      lines={terminalLines}
      onCommand={handleCommand}
      prompt=">"
      statusLine={statusLine}
    />
  );
}