import ChoicePanel, { GameChoice } from '../ChoicePanel';

export default function ChoicePanelExample() {
  // Mock choices for demonstration
  const mockChoices: GameChoice[] = [
    {
      id: 'explore',
      text: 'Explore the mysterious corridor',
      description: 'The dimly lit hallway beckons with unknown secrets',
      consequence: 'neutral'
    },
    {
      id: 'approach',
      text: 'Approach Professor Blackwood',
      description: 'Ask about your class schedule and dormitory assignment',
      consequence: 'positive'
    },
    {
      id: 'investigate',
      text: 'Investigate the moving portraits',
      description: 'Something supernatural seems to be at work here',
      consequence: 'negative'
    }
  ];

  return (
    <ChoicePanel 
      choices={mockChoices}
      onChoice={(id) => console.log('Choice selected:', id)}
      title="What would you like to do?"
    />
  );
}