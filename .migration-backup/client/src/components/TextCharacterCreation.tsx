import { useState, useEffect } from 'react';
import TerminalInterface from './TerminalInterface';
import { useI18n } from '../contexts/I18nContext';

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
  const { t, language } = useI18n();
  
  const [lines, setLines] = useState<TerminalLine[]>([]);

  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [step, setStep] = useState('name');

  // Race/class/subclass/faction keys for internal storage and translation lookup
  const raceKeys = ['human', 'elf', 'spirit', 'merperson', 'orc', 'furret', 'cartoon'];
  const classKeys = ['bard', 'samurai', 'warlock', 'ranger', 'alchemist', 'executioner'];
  const subClassKeys = ['berserker', 'assassin', 'paladin', 'demon', 'angel', 'beasthunter', 'lich', 'lunarguardian', 'lightworker'];
  const factionKeys = ['archivist', 'raider', 'outcast', 'ai', 'magi'];

  // Translation helper for game options
  const getRaceLabel = (key: string) => t(`game.race.${key}`);
  const getClassLabel = (key: string) => t(`game.class.${key}`);
  const getSubClassLabel = (key: string) => t(`game.subclass.${key}`);

  // Initialize lines on mount and when language changes (but only at name step)
  useEffect(() => {
    if (step === 'name' && lines.length === 0) {
      setLines([
        { id: '1', text: t('game.charCreate.title'), type: 'system' },
        { id: '2', text: '', type: 'output' },
        { id: '3', text: t('game.charCreate.welcome1'), type: 'output' },
        { id: '4', text: t('game.charCreate.welcome2'), type: 'output' },
        { id: '5', text: t('game.charCreate.welcome3'), type: 'output' },
        { id: '6', text: '', type: 'output' },
        { id: '7', text: t('game.charCreate.enterName'), type: 'output' },
      ]);
    }
  }, [t, language, step, lines.length]);

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

  // Internal IDs (English) for storage
  const races = ['Human', 'Elf', 'Spirit', 'Mer-Person', 'Orc', 'Furret', 'Cartoon'];
  const classes = ['Bard', 'Samurai', 'Warlock', 'Ranger', 'Alchemist', 'Executioner'];
  const subClasses = ['Berserker', 'Assassin', 'Paladin', 'Demon', 'Angel', 'Beast Hunter', 'Lich', 'Lunar Guardian', 'Light Worker'];
  const factions = ['Archivist', 'Raider', 'Outcast', 'AI', 'Magi'];

  const generatePhysicalQuestions = async (summary: string) => {
    setIsGeneratingQuestions(true);
    addLine('');
    addLine(t('game.charCreate.generatingQuestions'), 'system');
    
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
      addLine(t('game.charCreate.definingTraits'), 'system');
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
      addLine(t('game.charCreate.typeNumber'));
      
      setStep('physical-traits');
    } catch (error) {
      console.error('Error generating questions:', error);
      addLine('');
      addLine(t('game.charCreate.couldNotGenerate'), 'error');
      // Skip to race selection
      addLine('');
      addLine(t('game.charCreate.chooseRace'));
      raceKeys.forEach((key, index) => {
        addLine(`${index + 1}. ${getRaceLabel(key)}`);
      });
      setStep('race');
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const handleCommand = async (command: string) => {
    // Track command in history (normalized to uppercase for consistency with main game)
    if (command.trim()) {
      setCommandHistory(prev => [...prev.slice(-49), command.toUpperCase()]);
    }
    
    // Add the command to terminal
    addLine(`> ${command}`, 'command');

    switch (step) {
      case 'name':
        if (command.trim()) {
          setCharacter(prev => ({ ...prev, name: command.trim() }));
          addLine('');
          addLine(t('game.charCreate.welcomePlayer').replace('{name}', command.trim()));
          addLine('');
          addLine(t('game.charCreate.tellAbout'));
          addLine(t('game.charCreate.whoAreThey'));
          addLine('');
          addLine(t('game.charCreate.writeSummary'));
          setStep('summary');
        } else {
          addLine(t('game.charCreate.pleaseEnterName'), 'error');
        }
        break;

      case 'summary':
        if (command.trim().length >= 20) {
          setCharacter(prev => ({ ...prev, characterSummary: command.trim() }));
          addLine('');
          addLine(t('game.charCreate.summaryRecorded'));
          
          // Generate AI questions based on the summary
          await generatePhysicalQuestions(command.trim());
        } else {
          addLine(t('game.charCreate.pleaseWrite20'), 'error');
        }
        break;

      case 'physical-traits':
        if (isGeneratingQuestions) {
          addLine(t('game.charCreate.pleaseWait'), 'system');
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
          addLine(t('game.charCreate.recorded').replace('{answer}', answer));
          
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
            addLine(t('game.charCreate.typeNumber'));
          } else {
            // All questions answered, move to race selection
            addLine('');
            addLine(t('game.charCreate.traitsRecorded'));
            addLine('');
            addLine(t('game.charCreate.nowChooseRace'));
            raceKeys.forEach((key, index) => {
              addLine(`${index + 1}. ${getRaceLabel(key)}`);
            });
            setStep('race');
          }
        } else {
          addLine(t('game.charCreate.provideAnswer'), 'error');
        }
        break;

      case 'race':
        const raceIndex = parseInt(command) - 1;
        if (raceIndex >= 0 && raceIndex < raceKeys.length) {
          const selectedRaceKey = raceKeys[raceIndex];
          const selectedRace = races[raceIndex]; // Store English ID
          setCharacter(prev => ({ ...prev, race: selectedRace }));
          addLine('');
          addLine(t('game.charCreate.youHaveChosen').replace('{choice}', getRaceLabel(selectedRaceKey)));
          addLine('');
          addLine(t('game.charCreate.chooseClass'));
          classKeys.forEach((key, index) => {
            addLine(`${index + 1}. ${getClassLabel(key)}`);
          });
          setStep('class');
        } else {
          addLine(t('game.charCreate.invalidSelection'), 'error');
        }
        break;

      case 'class':
        const classIndex = parseInt(command) - 1;
        if (classIndex >= 0 && classIndex < classKeys.length) {
          const selectedClassKey = classKeys[classIndex];
          const selectedClass = classes[classIndex]; // Store English ID
          setCharacter(prev => ({ ...prev, class: selectedClass }));
          addLine('');
          addLine(t('game.charCreate.youHaveChosen').replace('{choice}', getClassLabel(selectedClassKey)));
          addLine('');
          addLine(t('game.charCreate.chooseSpec'));
          subClassKeys.forEach((key, index) => {
            addLine(`${index + 1}. ${getSubClassLabel(key)}`);
          });
          setStep('subclass');
        } else {
          addLine(t('game.charCreate.invalidSelection'), 'error');
        }
        break;

      case 'subclass':
        const subClassIndex = parseInt(command) - 1;
        if (subClassIndex >= 0 && subClassIndex < subClassKeys.length) {
          const selectedSubClassKey = subClassKeys[subClassIndex];
          const selectedSubClass = subClasses[subClassIndex]; // Store English ID
          setCharacter(prev => ({ ...prev, subClass: selectedSubClass }));
          addLine('');
          addLine(t('game.charCreate.youHaveChosen').replace('{choice}', getSubClassLabel(selectedSubClassKey)));
          addLine('');
          addLine(t('game.charCreate.chooseFaction'));
          factionKeys.forEach((key, index) => {
            addLine(`${index + 1}. ${t(`game.faction.${key}`)}`);
          });
          setStep('faction');
        } else {
          addLine(t('game.charCreate.invalidSelection'), 'error');
        }
        break;

      case 'faction':
        const factionIndex = parseInt(command) - 1;
        if (factionIndex >= 0 && factionIndex < factionKeys.length) {
          const selectedFactionKey = factionKeys[factionIndex];
          const selectedFaction = factions[factionIndex]; // Store English ID
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
          
          // Get translated labels for display
          const raceKeyIdx = races.indexOf(character.race);
          const classKeyIdx = classes.indexOf(character.class);
          const subClassKeyIdx = subClasses.indexOf(character.subClass);
          
          const displayRace = raceKeyIdx >= 0 ? getRaceLabel(raceKeys[raceKeyIdx]) : character.race;
          const displayClass = classKeyIdx >= 0 ? getClassLabel(classKeys[classKeyIdx]) : character.class;
          const displaySubClass = subClassKeyIdx >= 0 ? getSubClassLabel(subClassKeys[subClassKeyIdx]) : character.subClass;
          const displayFaction = t(`game.factionName.${selectedFactionKey}`);
          
          addLine('');
          addLine(t('game.charCreate.joinedFaction').replace('{faction}', displayFaction));
          addLine('');
          addLine(t('game.charCreate.characterSummary'));
          addLine(t('game.charCreate.name').replace('{name}', finalCharacter.name));
          addLine(t('game.charCreate.background').replace('{background}', finalCharacter.characterSummary));
          
          // Show physical traits if any were recorded
          const physicalTraitsEntries = Object.entries(finalCharacter.physicalTraits);
          if (physicalTraitsEntries.length > 0) {
            addLine('');
            addLine(t('game.charCreate.physicalTraits'));
            physicalTraitsEntries.forEach(([category, value]) => {
              addLine(`  ${category}: ${value}`);
            });
          }
          
          addLine('');
          addLine(t('game.charCreate.race').replace('{race}', displayRace));
          addLine(t('game.charCreate.class').replace('{class}', displayClass));
          addLine(t('game.charCreate.specialization').replace('{spec}', displaySubClass));
          addLine(t('game.charCreate.faction').replace('{faction}', displayFaction));
          addLine('');
          addLine(t('game.charCreate.typeStart'));
          setStep('confirm');
          setCharacter(finalCharacter);
        } else {
          addLine(t('game.charCreate.invalidSelection'), 'error');
        }
        break;

      case 'confirm':
        if (command.toLowerCase() === 'start') {
          onComplete(character);
        } else {
          addLine(t('game.charCreate.typeStartShort'), 'system');
        }
        break;
    }
  };

  return (
    <TerminalInterface
      lines={lines}
      onCommand={handleCommand}
      prompt=">"
      statusLine={t('game.charCreate.statusLine')}
      commandHistory={commandHistory}
    />
  );
}
