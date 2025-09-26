import { useState } from 'react';
import GameLayout from '@/components/GameLayout';
import CharacterCreation from '@/components/CharacterCreation';
import { GameMessage } from '@/components/NarrativeDisplay';
import { GameChoice } from '@/components/ChoicePanel';
import { Character } from '@/components/CharacterSheet';

export default function Home() {
  const [character, setCharacter] = useState<Character | null>(null);
  const [gameStarted, setGameStarted] = useState(false);

  // If character hasn't been created yet, show character creation
  if (!character || !gameStarted) {
    return (
      <CharacterCreation 
        onComplete={(newCharacter) => {
          setCharacter(newCharacter);
          setGameStarted(true);
        }}
      />
    );
  }

  // Game state - todo: replace with actual game engine
  const [messages, setMessages] = useState<GameMessage[]>([
    {
      id: '1',
      type: 'narrative', 
      content: `Welcome to "The Academy", ${character.name}. You are a ${character.race} ${character.class} who has aligned with the ${character.faction} faction.

This esteemed private school houses exactly 144 students in the far reaches of Toronto, Canada. As a freshman arriving from places unknown to a place even more unknown, you must navigate the mysteries that await.

The Academy's mascot, the Polar Bear, watches over students as they explore halls where every step leaves an imprint, every word ripples through ancient corridors, and every corner promises a journey into the void itself.

Your ${character.subClass} specialization will serve you well in the trials ahead. Not even your dormitory can protect you from the darkness that dwells within these walls.`,
      timestamp: new Date()
    },
    {
      id: '2',
      type: 'system',
      content: `> You stand in the Main Lobby of The Academy. Ancient portraits line the walls, their eyes following your movement. A receptionist desk sits empty, and hallways branch off toward the Cafeteria, Library (Larcen), and mysterious upper floors. The ${character.faction} insignia glows faintly on your student badge.`
    }
  ]);

  const [choices, setChoices] = useState<GameChoice[]>([
    {
      id: 'explore_cafeteria',
      text: 'Head to the Cafeteria',
      description: 'Join other students for orientation meal - safe but predictable',
      consequence: 'positive'
    },
    {
      id: 'visit_library',
      text: 'Explore the Library (Larcen)',
      description: 'Seek forbidden knowledge among ancient tomes',
      consequence: 'neutral'
    },
    {
      id: 'investigate_portraits',
      text: 'Examine the moving portraits',
      description: 'The eyes seem to track your movement - what secrets do they hold?',
      consequence: 'negative'
    },
    {
      id: 'check_faction',
      text: `Connect with ${character.faction} members`,
      description: `Look for other students aligned with the ${character.faction} faction`,
      consequence: 'positive'
    }
  ]);

  const [gameInProgress, setGameInProgress] = useState(true);

  // todo: implement actual game logic
  const handleCommand = (command: string) => {
    console.log('Processing command:', command);
    
    // Mock response - todo: replace with game engine
    const newMessage: GameMessage = {
      id: Date.now().toString(),
      type: 'action',
      content: `> ${command}`,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newMessage]);

    // Mock game response
    setTimeout(() => {
      const response: GameMessage = {
        id: (Date.now() + 1).toString(),
        type: 'narrative',
        content: 'The Academy seems to respond to your action with an eerie silence. The shadows shift slightly, as if watching your every move.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, response]);
    }, 1000);
  };

  // todo: implement choice consequences and branching narrative
  const handleChoice = (choiceId: string) => {
    console.log('Processing choice:', choiceId);
    
    const choice = choices.find(c => c.id === choiceId);
    if (!choice) return;

    // Add choice to narrative
    const choiceMessage: GameMessage = {
      id: Date.now().toString(),
      type: 'action',
      content: `> ${choice.text}`,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, choiceMessage]);

    // Mock consequence - todo: implement real game logic
    setTimeout(() => {
      let response = '';
      let newChoices: GameChoice[] = [];

      switch (choiceId) {
        case 'enter':
          response = 'You step through the gates and onto the Academy grounds. The massive doors of the main building loom before you, carved with symbols that seem to writhe in your peripheral vision. A figure in dark robes approaches from the shadows.';
          newChoices = [
            {
              id: 'greet',
              text: 'Greet the robed figure',
              description: 'Introduce yourself politely',
              consequence: 'positive'
            },
            {
              id: 'avoid',
              text: 'Try to avoid the figure',
              description: 'Duck behind a pillar and hope they pass by',
              consequence: 'neutral'
            }
          ];
          break;
        case 'hesitate':
          response = 'Your hesitation proves wise. As you stand at the threshold, you notice strange symbols carved into the gate posts, pulsing with a faint, otherworldly light. The Academy\'s secrets are deeper than they first appeared.';
          newChoices = [
            {
              id: 'study_symbols',
              text: 'Study the symbols closely',
              description: 'Try to decipher their meaning',
              consequence: 'positive'
            },
            {
              id: 'enter_prepared',
              text: 'Enter with newfound caution',
              description: 'Proceed, but stay alert for danger',
              consequence: 'neutral'
            }
          ];
          break;
        case 'investigate':
          response = 'Your careful examination reveals hidden mechanisms within the gate. Ancient runes glow softly when touched, and you hear whispers in languages you don\'t recognize. This place is far more than a simple school.';
          newChoices = [
            {
              id: 'touch_runes',
              text: 'Touch the glowing runes',
              description: 'Risk activating whatever magic lies within',
              consequence: 'negative'
            },
            {
              id: 'listen',
              text: 'Listen to the whispers',
              description: 'Try to understand what the voices are saying',
              consequence: 'positive'
            }
          ];
          break;
      }

      const responseMessage: GameMessage = {
        id: (Date.now() + 1).toString(),
        type: 'narrative',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, responseMessage]);
      setChoices(newChoices);
    }, 1500);
  };

  // todo: implement actual save/load functionality
  const handleSave = () => {
    console.log('Saving game state...');
    // Mock save notification
    const saveMessage: GameMessage = {
      id: Date.now().toString(),
      type: 'system',
      content: '> Game saved successfully.',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, saveMessage]);
  };

  const handleLoad = () => {
    console.log('Loading game state...');
    // Mock load notification
    const loadMessage: GameMessage = {
      id: Date.now().toString(),
      type: 'system',
      content: '> No saved games found. Starting new adventure...',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, loadMessage]);
  };

  const handleSettings = () => {
    console.log('Opening settings...');
    setGameInProgress(!gameInProgress);
    
    const settingsMessage: GameMessage = {
      id: Date.now().toString(),
      type: 'system',
      content: `> Game ${gameInProgress ? 'paused' : 'resumed'}.`,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, settingsMessage]);
  };

  return (
    <GameLayout
      character={character}
      messages={messages}
      choices={choices}
      onCommand={handleCommand}
      onChoice={handleChoice}
      onSave={handleSave}
      onLoad={handleLoad}
      onSettings={handleSettings}
      gameInProgress={gameInProgress}
    />
  );
}