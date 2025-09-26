import { useState } from 'react';
import GameLayout from '@/components/GameLayout';
import { GameMessage } from '@/components/NarrativeDisplay';
import { GameChoice } from '@/components/ChoicePanel';
import { Character } from '@/components/CharacterSheet';

export default function Home() {
  // Mock character state - todo: replace with real game state management
  const [character] = useState<Character>({
    name: "New Student",
    background: "Mysterious Transfer Student",
    stats: {
      intellect: 50,
      charisma: 50,
      intuition: 50,
      resilience: 50
    },
    reputation: {
      faculty: 50,
      students: 50,
      mysterious: 0
    },
    energy: 100,
    maxEnergy: 100
  });

  // Game state - todo: replace with actual game engine
  const [messages, setMessages] = useState<GameMessage[]>([
    {
      id: '1',
      type: 'narrative',
      content: `Welcome to "The Academy", an esteemed private school located in the far reaches of Toronto, Canada. You are the "new kid", a freshman who just arrived from places unknown, to a place even more unknown.

Prepare for a mysterious new environment to explore and live in, where every step you take is an imprint, every word you speak ripples out into its halls, and every corner promises a trip into the void of space itself.

Align yourself, arm your body and mind, and prepare for the future. Not even your dorm room can protect you from the darkness, after all.`,
      timestamp: new Date()
    },
    {
      id: '2',
      type: 'system',
      content: '> You stand before the imposing gates of The Academy. Dark stone walls stretch upward, disappearing into the mist above. The iron gates creak open as you approach...'
    }
  ]);

  const [choices, setChoices] = useState<GameChoice[]>([
    {
      id: 'enter',
      text: 'Enter The Academy',
      description: 'Step through the gates and begin your mysterious journey',
      consequence: 'neutral'
    },
    {
      id: 'hesitate',
      text: 'Hesitate at the threshold',
      description: 'Something feels wrong about this place... maybe you should wait',
      consequence: 'neutral'
    },
    {
      id: 'investigate',
      text: 'Examine the gates more closely',
      description: 'Look for clues about what lies within before proceeding',
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