import GameLayout from '../GameLayout';
import { GameMessage } from '../NarrativeDisplay';
import { GameChoice } from '../ChoicePanel';
import { Character } from '../CharacterSheet';

export default function GameLayoutExample() {
  // Mock data for complete game state demonstration
  const mockCharacter: Character = {
    name: "Alex Chen",
    background: "Transfer Student from Unknown Origins", 
    stats: {
      intellect: 75,
      charisma: 60,
      intuition: 85,
      resilience: 50
    },
    reputation: {
      faculty: 45,
      students: 30,
      mysterious: 15
    },
    currentClass: "Introduction to Metaphysical Studies",
    energy: 65,
    maxEnergy: 100
  };

  const mockMessages: GameMessage[] = [
    {
      id: '1',
      type: 'narrative',
      content: 'Welcome to "The Academy", an esteemed private school located in the far reaches of Toronto, Canada. You are the "new kid", a freshman who just arrived from places unknown, to a place even more unknown.\n\nPrepare for a mysterious new environment to explore and live in, where every step you take is an imprint, every word you speak ripples out into its halls, and every corner promises a trip into the void of space itself.',
      timestamp: new Date()
    },
    {
      id: '2',
      type: 'system',
      content: '> You stand in the grand entrance hall. Ancient portraits line the walls, their eyes following your movement.'
    },
    {
      id: '3',
      type: 'dialogue',
      content: '"Ah, the new student. Welcome to The Academy. I am Professor Blackwood, your guide through the mysteries that await. Your dormitory assignment is ready, but first... tell me, what draws you to seek knowledge in the shadows?"',
      character: 'Professor Blackwood'
    }
  ];

  const mockChoices: GameChoice[] = [
    {
      id: 'knowledge',
      text: 'I seek forbidden knowledge',
      description: 'Express your desire to learn the hidden truths of the universe',
      consequence: 'neutral'
    },
    {
      id: 'power',
      text: 'I want to gain power',
      description: 'Admit your ambitions for influence and control',
      consequence: 'negative'
    },
    {
      id: 'mystery',
      text: 'The mystery called to me',
      description: 'Reveal that something supernatural drew you here',
      consequence: 'positive'
    },
    {
      id: 'escape',
      text: 'I am running from something',
      description: 'Hint at a dark past that forced you to seek refuge',
      consequence: 'neutral'
    }
  ];

  return (
    <GameLayout
      character={mockCharacter}
      messages={mockMessages}
      choices={mockChoices}
      onCommand={(cmd) => console.log('Command:', cmd)}
      onChoice={(id) => console.log('Choice:', id)}
      onSave={() => console.log('Save game')}
      onLoad={() => console.log('Load game')}
      onSettings={() => console.log('Settings')}
      gameInProgress={true}
    />
  );
}