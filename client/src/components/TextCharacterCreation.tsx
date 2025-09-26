import { useState } from 'react';
import TerminalInterface from './TerminalInterface';

interface TextCharacterCreationProps {
  onComplete: (character: any) => void;
}

interface TerminalLine {
  id: string;
  text: string;
  type: 'output' | 'command' | 'system' | 'error';
}

export default function TextCharacterCreation({ onComplete }: TextCharacterCreationProps) {
  const [lines, setLines] = useState<TerminalLine[]>([
    { id: '1', text: 'THE ACADEMY - CHARACTER CREATION', type: 'system' },
    { id: '2', text: '', type: 'output' },
    { id: '3', text: 'Welcome to The Academy, an esteemed private school in the far reaches of', type: 'output' },
    { id: '4', text: 'Toronto, Canada. You are about to create your character for this mysterious', type: 'output' },
    { id: '5', text: 'adventure where 144 students call this dark institution home.', type: 'output' },
    { id: '6', text: '', type: 'output' },
    { id: '7', text: 'Please enter your character name:', type: 'output' },
  ]);

  const [step, setStep] = useState('name');
  const [character, setCharacter] = useState({
    name: '',
    race: '',
    class: '',
    subClass: '',
    faction: ''
  });

  const addLine = (text: string, type: TerminalLine['type'] = 'output') => {
    const newLine: TerminalLine = {
      id: Date.now().toString() + Math.random(),
      text,
      type
    };
    setLines(prev => [...prev, newLine]);
  };

  const races = ['Human', 'Elf', 'Spirit', 'Mer-Person', 'Orc', 'Furret', 'Cartoon'];
  const classes = ['Bard', 'Samurai', 'Warlock', 'Ranger', 'Alchemist', 'Executioner'];
  const subClasses = ['Berserker', 'Assassin', 'Paladin', 'Demon', 'Angel', 'Beast Hunter', 'Lich', 'Lunar Guardian', 'Light Worker'];
  const factions = ['Archivist', 'Raider', 'Outcast', 'AI', 'Magi'];

  const handleCommand = (command: string) => {
    // Add the command to terminal
    addLine(`> ${command}`, 'command');

    switch (step) {
      case 'name':
        if (command.trim()) {
          setCharacter(prev => ({ ...prev, name: command.trim() }));
          addLine('');
          addLine(`Welcome, ${command.trim()}.`);
          addLine('');
          addLine('Choose your race by typing the number:');
          races.forEach((race, index) => {
            addLine(`${index + 1}. ${race}`);
          });
          setStep('race');
        } else {
          addLine('Please enter a valid name.', 'error');
        }
        break;

      case 'race':
        const raceIndex = parseInt(command) - 1;
        if (raceIndex >= 0 && raceIndex < races.length) {
          const selectedRace = races[raceIndex];
          setCharacter(prev => ({ ...prev, race: selectedRace }));
          addLine('');
          addLine(`You have chosen: ${selectedRace}`);
          addLine('');
          addLine('Choose your class by typing the number:');
          classes.forEach((cls, index) => {
            addLine(`${index + 1}. ${cls}`);
          });
          setStep('class');
        } else {
          addLine('Invalid selection. Please choose a number from the list.', 'error');
        }
        break;

      case 'class':
        const classIndex = parseInt(command) - 1;
        if (classIndex >= 0 && classIndex < classes.length) {
          const selectedClass = classes[classIndex];
          setCharacter(prev => ({ ...prev, class: selectedClass }));
          addLine('');
          addLine(`You have chosen: ${selectedClass}`);
          addLine('');
          addLine('Choose your specialization by typing the number:');
          subClasses.forEach((subCls, index) => {
            addLine(`${index + 1}. ${subCls}`);
          });
          setStep('subclass');
        } else {
          addLine('Invalid selection. Please choose a number from the list.', 'error');
        }
        break;

      case 'subclass':
        const subClassIndex = parseInt(command) - 1;
        if (subClassIndex >= 0 && subClassIndex < subClasses.length) {
          const selectedSubClass = subClasses[subClassIndex];
          setCharacter(prev => ({ ...prev, subClass: selectedSubClass }));
          addLine('');
          addLine(`You have chosen: ${selectedSubClass}`);
          addLine('');
          addLine('Choose your faction by typing the number:');
          addLine('1. Archivist - Keepers of knowledge and ancient secrets');
          addLine('2. Raider - Bold explorers seeking power and adventure');
          addLine('3. Outcast - Independent spirits who forge their own path');
          addLine('4. AI - Technology-minded students embracing digital evolution');
          addLine('5. Magi - Masters of mystical arts and supernatural forces');
          setStep('faction');
        } else {
          addLine('Invalid selection. Please choose a number from the list.', 'error');
        }
        break;

      case 'faction':
        const factionIndex = parseInt(command) - 1;
        if (factionIndex >= 0 && factionIndex < factions.length) {
          const selectedFaction = factions[factionIndex];
          const finalCharacter = {
            ...character,
            faction: selectedFaction,
            background: `${character.race} ${character.class}`,
            stats: {
              perception: 50,
              intelligence: 50,
              charisma: 50,
              dexterity: 50,
              strength: 50,
              health: 100,
              endurance: 50
            },
            reputation: {
              faculty: 50,
              students: 50,
              mysterious: 10
            },
            energy: 100,
            maxEnergy: 100,
            currentClass: 'Orientation'
          };
          
          addLine('');
          addLine(`You have joined the ${selectedFaction} faction.`);
          addLine('');
          addLine('CHARACTER SUMMARY:');
          addLine(`Name: ${finalCharacter.name}`);
          addLine(`Race: ${finalCharacter.race}`);
          addLine(`Class: ${finalCharacter.class}`);
          addLine(`Specialization: ${finalCharacter.subClass}`);
          addLine(`Faction: ${finalCharacter.faction}`);
          addLine('');
          addLine('Type START to begin your adventure at The Academy...');
          setStep('confirm');
          setCharacter(finalCharacter);
        } else {
          addLine('Invalid selection. Please choose a number from the list.', 'error');
        }
        break;

      case 'confirm':
        if (command.toLowerCase() === 'start') {
          onComplete(character);
        } else {
          addLine('Type START to begin your adventure.', 'system');
        }
        break;
    }
  };

  return (
    <TerminalInterface
      lines={lines}
      onCommand={handleCommand}
      prompt=">"
      statusLine="THE ACADEMY - Character Creation System"
    />
  );
}