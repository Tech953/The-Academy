import GameTerminal from '../GameTerminal';

export default function GameTerminalExample() {
  return (
    <GameTerminal 
      onCommand={(cmd) => console.log('Command submitted:', cmd)}
      placeholder="Enter your next move..."
    />
  );
}