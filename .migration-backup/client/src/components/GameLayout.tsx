import { useState } from 'react';
import NarrativeDisplay, { GameMessage } from './NarrativeDisplay';
import GameTerminal from './GameTerminal';
import ChoicePanel, { GameChoice } from './ChoicePanel';
import CharacterSheet, { Character } from './CharacterSheet';
import GameSidebar from './GameSidebar';

interface GameLayoutProps {
  character: Character;
  messages: GameMessage[];
  choices: GameChoice[];
  onCommand: (command: string) => void;
  onChoice: (choiceId: string) => void;
  onSave: () => void;
  onLoad: () => void;
  onSettings: () => void;
  gameInProgress?: boolean;
}

export default function GameLayout({
  character,
  messages,
  choices,
  onCommand,
  onChoice,
  onSave,
  onLoad,
  onSettings,
  gameInProgress = true
}: GameLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="h-screen flex bg-background text-foreground" data-testid="game-layout">
      {/* Left Sidebar - Character & Game Controls */}
      <div className={`${sidebarCollapsed ? 'w-0' : 'w-80'} transition-all duration-200 border-r border-primary/20 bg-card/30`}>
        <div className="h-full flex flex-col">
          <div className="flex-shrink-0 p-4">
            <CharacterSheet character={character} />
          </div>
          <div className="flex-1 overflow-hidden">
            <GameSidebar 
              onSave={onSave}
              onLoad={onLoad}
              onSettings={onSettings}
            />
          </div>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 flex flex-col">
        {/* Game Header */}
        <div className="border-b border-primary/20 bg-card/50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-mono text-primary">The Academy</h1>
              <p className="text-xs text-muted-foreground">Interactive RPG Adventure</p>
            </div>
            <button 
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              data-testid="button-toggle-sidebar"
            >
              {sidebarCollapsed ? '→ Show Panel' : '← Hide Panel'}
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex gap-4 p-4">
          {/* Narrative Display */}
          <div className="flex-1">
            <NarrativeDisplay messages={messages} />
          </div>

          {/* Choice Panel */}
          {choices.length > 0 && (
            <div className="w-80">
              <ChoicePanel 
                choices={choices}
                onChoice={onChoice}
                disabled={!gameInProgress}
              />
            </div>
          )}
        </div>

        {/* Command Terminal */}
        <GameTerminal 
          onCommand={onCommand}
          disabled={!gameInProgress}
          placeholder={gameInProgress ? "Type your command..." : "Game paused"}
        />
      </div>
    </div>
  );
}