import GameSidebar from '../GameSidebar';

export default function GameSidebarExample() {
  return (
    <GameSidebar 
      onSave={() => console.log('Save game triggered')}
      onLoad={() => console.log('Load game triggered')}
      onSettings={() => console.log('Settings triggered')}
      gameStats={{
        location: "Professor Blackwood's Office",
        timeOfDay: "Afternoon",
        day: 3,
        unreadMessages: 2
      }}
    />
  );
}