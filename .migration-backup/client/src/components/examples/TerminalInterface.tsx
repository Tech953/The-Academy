import TerminalInterface from '../TerminalInterface';

export default function TerminalInterfaceExample() {
  const mockLines = [
    { id: '1', text: 'Welcome to The Academy', type: 'output' as const },
    { id: '2', text: 'Type HELP for available commands', type: 'system' as const },
    { id: '3', text: '> look', type: 'command' as const },
    { id: '4', text: 'You are standing in the main lobby of The Academy. Dark portraits line the walls.', type: 'output' as const },
  ];

  return (
    <TerminalInterface 
      lines={mockLines}
      onCommand={(cmd) => console.log('Command:', cmd)}
      statusLine="The Academy | Location: Main Lobby | Health: 100/100"
    />
  );
}