import NarrativeDisplay, { GameMessage } from '../NarrativeDisplay';

export default function NarrativeDisplayExample() {
  // Mock data for demonstration
  const mockMessages: GameMessage[] = [
    {
      id: '1',
      type: 'narrative',
      content: 'Welcome to "The Academy", an esteemed private school located in the far reaches of Toronto, Canada. You are the "new kid", a freshman who just arrived from places unknown, to a place even more unknown.',
      timestamp: new Date()
    },
    {
      id: '2',
      type: 'system',
      content: '> You enter the main hallway. The shadows seem to dance in the corners of your vision.'
    },
    {
      id: '3',
      type: 'dialogue',
      content: '"Welcome to The Academy, freshman. I am Professor Blackwood. Your journey into the unknown begins now..."',
      character: 'Professor Blackwood'
    },
    {
      id: '4',
      type: 'action',
      content: 'The professor gestures toward a long, dimly lit corridor lined with portraits whose eyes seem to follow your every movement.'
    }
  ];

  return <NarrativeDisplay messages={mockMessages} />;
}