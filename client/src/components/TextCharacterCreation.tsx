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

interface PhysicalQuestion {
  question: string;
  category: string;
  suggestedAnswers?: string[];
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
    faction: '',
    characterSummary: '',
    physicalTraits: {} as Record<string, string>
  });

  const [physicalQuestions, setPhysicalQuestions] = useState<PhysicalQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);

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

  const generatePhysicalQuestions = async (summary: string) => {
    setIsGeneratingQuestions(true);
    addLine('');
    addLine('Generating personalized questions based on your character...', 'system');
    
    try {
      const response = await fetch('/api/character-creation/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ characterSummary: summary }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate questions');
      }

      const data = await response.json();
      setPhysicalQuestions(data.questions);
      setCurrentQuestionIndex(0);
      
      addLine('');
      addLine('Now let\'s define your character\'s physical traits...', 'system');
      addLine('');
      
      // Show first question
      const firstQ = data.questions[0];
      addLine(firstQ.question);
      if (firstQ.suggestedAnswers) {
        firstQ.suggestedAnswers.forEach((answer: string, idx: number) => {
          addLine(`${idx + 1}. ${answer}`);
        });
      }
      addLine('');
      addLine('(You can type a number or write your own answer)');
      
      setStep('physical-traits');
    } catch (error) {
      console.error('Error generating questions:', error);
      addLine('');
      addLine('Could not generate custom questions. Continuing with basic setup...', 'error');
      // Skip to race selection
      addLine('');
      addLine('Choose your race by typing the number:');
      races.forEach((race, index) => {
        addLine(`${index + 1}. ${race}`);
      });
      setStep('race');
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const handleCommand = async (command: string) => {
    // Add the command to terminal
    addLine(`> ${command}`, 'command');

    switch (step) {
      case 'name':
        if (command.trim()) {
          setCharacter(prev => ({ ...prev, name: command.trim() }));
          addLine('');
          addLine(`Welcome, ${command.trim()}.`);
          addLine('');
          addLine('Before we continue, tell us about your character in your own words.');
          addLine('Who are they? What\'s their background? What brought them to The Academy?');
          addLine('');
          addLine('Write a brief summary (at least 20 characters):');
          setStep('summary');
        } else {
          addLine('Please enter a valid name.', 'error');
        }
        break;

      case 'summary':
        if (command.trim().length >= 20) {
          setCharacter(prev => ({ ...prev, characterSummary: command.trim() }));
          addLine('');
          addLine('Excellent! Your character summary has been recorded.');
          
          // Generate AI questions based on the summary
          await generatePhysicalQuestions(command.trim());
        } else {
          addLine('Please write at least 20 characters to describe your character.', 'error');
        }
        break;

      case 'physical-traits':
        if (isGeneratingQuestions) {
          addLine('Please wait while questions are being generated...', 'system');
          break;
        }

        const currentQ = physicalQuestions[currentQuestionIndex];
        let answer = command.trim();
        
        // Check if they entered a number (selecting from suggested answers)
        if (currentQ.suggestedAnswers) {
          const answerIndex = parseInt(command) - 1;
          if (answerIndex >= 0 && answerIndex < currentQ.suggestedAnswers.length) {
            answer = currentQ.suggestedAnswers[answerIndex];
          }
        }
        
        if (answer) {
          // Store the answer
          setCharacter(prev => ({
            ...prev,
            physicalTraits: {
              ...prev.physicalTraits,
              [currentQ.category]: answer
            }
          }));
          
          addLine('');
          addLine(`Recorded: ${answer}`);
          
          // Move to next question or continue to race selection
          if (currentQuestionIndex < physicalQuestions.length - 1) {
            const nextQ = physicalQuestions[currentQuestionIndex + 1];
            setCurrentQuestionIndex(currentQuestionIndex + 1);
            
            addLine('');
            addLine(nextQ.question);
            if (nextQ.suggestedAnswers) {
              nextQ.suggestedAnswers.forEach((ans, idx) => {
                addLine(`${idx + 1}. ${ans}`);
              });
            }
            addLine('');
            addLine('(You can type a number or write your own answer)');
          } else {
            // All questions answered, move to race selection
            addLine('');
            addLine('Great! Your physical characteristics have been recorded.');
            addLine('');
            addLine('Now choose your race by typing the number:');
            races.forEach((race, index) => {
              addLine(`${index + 1}. ${race}`);
            });
            setStep('race');
          }
        } else {
          addLine('Please provide an answer.', 'error');
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
          addLine(`Background: ${finalCharacter.characterSummary}`);
          
          // Show physical traits if any were recorded
          const physicalTraitsEntries = Object.entries(finalCharacter.physicalTraits);
          if (physicalTraitsEntries.length > 0) {
            addLine('');
            addLine('Physical Traits:');
            physicalTraitsEntries.forEach(([category, value]) => {
              addLine(`  ${category}: ${value}`);
            });
          }
          
          addLine('');
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
