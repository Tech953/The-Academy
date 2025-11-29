import { useState, useCallback, useRef, useEffect } from 'react';
import { ChevronDown, ChevronRight, Compass, GraduationCap, Users, Settings, Mic, MicOff, ArrowDown, History, X, Menu, Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSpeechRecognition } from '@/hooks/use-speech-recognition';

interface CommandCategory {
  id: string;
  name: string;
  icon: typeof Compass;
  commands: CommandItem[];
}

interface CommandItem {
  command: string;
  description: string;
  shortcut?: string;
}

interface CommandPaletteProps {
  onCommand: (command: string) => void;
  commandHistory: string[];
  onJumpToBottom: () => void;
  isVisible: boolean;
  onToggleVisibility: () => void;
}

const commandCategories: CommandCategory[] = [
  {
    id: 'movement',
    name: 'Movement',
    icon: Compass,
    commands: [
      { command: 'NORTH', description: 'Move north', shortcut: 'N' },
      { command: 'SOUTH', description: 'Move south', shortcut: 'S' },
      { command: 'EAST', description: 'Move east', shortcut: 'E' },
      { command: 'WEST', description: 'Move west', shortcut: 'W' },
      { command: 'UP', description: 'Go up stairs/elevator' },
      { command: 'DOWN', description: 'Go down stairs/elevator' },
      { command: 'LOOK', description: 'Examine surroundings', shortcut: 'L' },
    ]
  },
  {
    id: 'academic',
    name: 'Academic',
    icon: GraduationCap,
    commands: [
      { command: 'GRADES', description: 'View current grades' },
      { command: 'TRANSCRIPT', description: 'View academic transcript' },
      { command: 'SCHEDULE', description: 'View class schedule' },
      { command: 'GPA', description: 'Check your GPA' },
      { command: 'ATTEND', description: 'Attend a class' },
      { command: 'READ', description: 'Read a textbook' },
      { command: 'LECTURE', description: 'View lecture notes' },
      { command: 'CHAPTER', description: 'Read textbook chapter' },
    ]
  },
  {
    id: 'social',
    name: 'Social',
    icon: Users,
    commands: [
      { command: 'LIST', description: 'List people here' },
      { command: 'TALK', description: 'Talk to someone' },
      { command: 'REPUTATION', description: 'Check your reputation' },
      { command: 'EXAMINE', description: 'Examine a person/object' },
    ]
  },
  {
    id: 'system',
    name: 'System',
    icon: Settings,
    commands: [
      { command: 'STATUS', description: 'View character status' },
      { command: 'INVENTORY', description: 'Check your inventory', shortcut: 'I' },
      { command: 'HELP', description: 'Show all commands', shortcut: 'H' },
      { command: 'SAVE', description: 'Save game progress' },
      { command: 'LOAD', description: 'Load saved game' },
      { command: 'CLEAR', description: 'Clear terminal screen' },
    ]
  }
];

export default function CommandPalette({ 
  onCommand, 
  commandHistory, 
  onJumpToBottom,
  isVisible,
  onToggleVisibility
}: CommandPaletteProps) {
  const [openCategories, setOpenCategories] = useState<string[]>(['movement']);
  const [showHistory, setShowHistory] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const commandButtonsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const paletteRef = useRef<HTMLDivElement>(null);

  // Speech recognition integration
  const handleVoiceCommand = useCallback((transcript: string) => {
    if (transcript.trim()) {
      onCommand(transcript.toUpperCase());
    }
  }, [onCommand]);

  const {
    isListening,
    isSupported,
    interimTranscript,
    error: speechError,
    toggleListening,
  } = useSpeechRecognition(undefined, handleVoiceCommand);

  // Build flat list of all visible commands for keyboard navigation
  const getVisibleCommands = useCallback(() => {
    const commands: { command: string; categoryId: string }[] = [];
    commandCategories.forEach(category => {
      if (openCategories.includes(category.id)) {
        category.commands.forEach(cmd => {
          commands.push({ command: cmd.command, categoryId: category.id });
        });
      }
    });
    return commands;
  }, [openCategories]);

  // Keyboard navigation handler
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isVisible) return;

    const visibleCommands = getVisibleCommands();
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => {
          const next = Math.min(prev + 1, visibleCommands.length - 1);
          return next;
        });
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        if (focusedIndex >= 0 && focusedIndex < visibleCommands.length) {
          e.preventDefault();
          onCommand(visibleCommands[focusedIndex].command);
        }
        break;
      case 'Home':
        e.preventDefault();
        setFocusedIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setFocusedIndex(visibleCommands.length - 1);
        break;
    }
  }, [isVisible, getVisibleCommands, focusedIndex, onCommand]);

  // Focus management
  useEffect(() => {
    if (focusedIndex >= 0 && commandButtonsRef.current[focusedIndex]) {
      commandButtonsRef.current[focusedIndex]?.focus();
    }
  }, [focusedIndex]);

  // Add keyboard listener when palette is visible
  useEffect(() => {
    if (isVisible) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isVisible, handleKeyDown]);

  // Reset focus when palette opens
  useEffect(() => {
    if (isVisible) {
      setFocusedIndex(-1);
      commandButtonsRef.current = [];
    }
  }, [isVisible]);

  const toggleCategory = (categoryId: string) => {
    setOpenCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
    // Reset focus when categories change
    setFocusedIndex(-1);
  };

  const handleCommandClick = (command: string) => {
    onCommand(command);
  };

  const handleHistoryClick = (command: string) => {
    onCommand(command);
    setShowHistory(false);
  };

  // Track button refs for focus management
  let buttonIndex = 0;
  const registerButtonRef = (el: HTMLButtonElement | null) => {
    if (el) {
      commandButtonsRef.current[buttonIndex] = el;
      buttonIndex++;
    }
  };

  // Floating toggle button when palette is hidden
  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {/* Voice button - show with fallback message if not supported */}
        <Button
          size="icon"
          variant="outline"
          onClick={isSupported ? toggleListening : undefined}
          className={`rounded-full shadow-lg ${isListening ? 'bg-red-500/20 border-red-500' : ''} ${!isSupported ? 'opacity-50' : ''}`}
          style={{ 
            borderColor: isListening ? 'hsl(0, 100%, 50%)' : 'hsl(var(--terminal-glow))',
            color: 'hsl(var(--terminal-glow))'
          }}
          data-testid="button-voice-toggle"
          aria-label={
            !isSupported 
              ? 'Voice input not available - use keyboard or command palette' 
              : isListening 
                ? 'Stop listening' 
                : 'Start voice input'
          }
          title={!isSupported ? 'Voice not supported - use keyboard' : undefined}
        >
          {isListening ? <MicOff className="h-5 w-5" /> : isSupported ? <Mic className="h-5 w-5" /> : <Keyboard className="h-5 w-5" />}
        </Button>
        
        {/* Menu toggle button */}
        <Button
          size="icon"
          variant="outline"
          onClick={onToggleVisibility}
          className="rounded-full shadow-lg"
          style={{ 
            borderColor: 'hsl(var(--terminal-glow))',
            color: 'hsl(var(--terminal-glow))'
          }}
          data-testid="button-command-palette-toggle"
          aria-label="Open command menu (Ctrl+K)"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Voice feedback */}
        {isListening && interimTranscript && (
          <div 
            className="fixed bottom-20 right-4 px-3 py-2 rounded-lg text-sm max-w-xs"
            style={{ 
              background: 'hsl(var(--terminal-bg))',
              border: '1px solid hsl(var(--terminal-glow))',
              color: 'hsl(var(--terminal-glow))'
            }}
          >
            <span className="opacity-70">Hearing: </span>
            {interimTranscript}
          </div>
        )}

        {/* Fallback message when voice not supported */}
        {!isSupported && (
          <div 
            className="fixed bottom-20 right-4 px-3 py-2 rounded-lg text-xs max-w-[200px]"
            style={{ 
              background: 'hsl(var(--terminal-bg))',
              border: '1px solid hsl(var(--terminal-glow))',
              color: 'hsl(var(--terminal-glow))',
              opacity: 0.8
            }}
            role="status"
            aria-live="polite"
          >
            Voice input unavailable. Use keyboard commands or click the menu button.
          </div>
        )}
      </div>
    );
  }

  // Reset button index for this render
  buttonIndex = 0;
  
  return (
    <div 
      ref={paletteRef}
      className="fixed right-0 top-0 h-full w-72 z-50 flex flex-col shadow-xl"
      style={{ 
        background: 'hsl(var(--terminal-bg))',
        borderLeft: '1px solid hsl(var(--terminal-glow))'
      }}
      role="navigation"
      aria-label="Command palette - use arrow keys to navigate, Enter to select"
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between px-3 py-2 border-b"
        style={{ borderColor: 'hsl(var(--terminal-glow))' }}
      >
        <span 
          className="font-mono text-sm font-bold"
          style={{ color: 'hsl(var(--terminal-glow))' }}
        >
          COMMANDS
        </span>
        <div className="flex items-center gap-1">
          {/* Voice toggle */}
          {isSupported && (
            <Button
              size="icon"
              variant="ghost"
              onClick={toggleListening}
              className={`h-8 w-8 ${isListening ? 'bg-red-500/20' : ''}`}
              style={{ color: isListening ? 'hsl(0, 100%, 50%)' : 'hsl(var(--terminal-glow))' }}
              data-testid="button-voice-toggle-panel"
              aria-label={isListening ? 'Stop listening' : 'Start voice input'}
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
          )}
          
          {/* Jump to bottom */}
          <Button
            size="icon"
            variant="ghost"
            onClick={onJumpToBottom}
            className="h-8 w-8"
            style={{ color: 'hsl(var(--terminal-glow))' }}
            data-testid="button-jump-to-bottom"
            aria-label="Jump to latest output"
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
          
          {/* History toggle */}
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setShowHistory(!showHistory)}
            className={`h-8 w-8 ${showHistory ? 'bg-accent/20' : ''}`}
            style={{ color: 'hsl(var(--terminal-glow))' }}
            data-testid="button-history-toggle"
            aria-label={showHistory ? 'Hide command history' : 'Show command history'}
          >
            <History className="h-4 w-4" />
          </Button>
          
          {/* Close button */}
          <Button
            size="icon"
            variant="ghost"
            onClick={onToggleVisibility}
            className="h-8 w-8"
            style={{ color: 'hsl(var(--terminal-glow))' }}
            data-testid="button-close-palette"
            aria-label="Close command menu"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Voice feedback */}
      {isListening && (
        <div 
          className="px-3 py-2 border-b flex items-center gap-2"
          style={{ 
            borderColor: 'hsl(var(--terminal-glow))',
            background: 'hsl(0, 100%, 50%, 0.1)'
          }}
        >
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span 
            className="text-xs font-mono"
            style={{ color: 'hsl(var(--terminal-glow))' }}
          >
            {interimTranscript || 'Listening...'}
          </span>
        </div>
      )}

      {/* Speech error */}
      {speechError && (
        <div 
          className="px-3 py-2 border-b text-xs"
          style={{ 
            borderColor: 'hsl(var(--terminal-glow))',
            color: 'hsl(var(--destructive))'
          }}
        >
          {speechError}
        </div>
      )}

      {/* Command History (collapsible section) */}
      {showHistory && commandHistory.length > 0 && (
        <div 
          className="border-b"
          style={{ borderColor: 'hsl(var(--terminal-glow))' }}
        >
          <div 
            className="px-3 py-1.5 text-xs font-mono font-bold"
            style={{ color: 'hsl(180, 100%, 70%)' }}
          >
            RECENT COMMANDS
          </div>
          <ScrollArea className="max-h-32">
            <div className="px-2 pb-2">
              {commandHistory.slice(-10).reverse().map((cmd, index) => (
                <button
                  key={index}
                  onClick={() => handleHistoryClick(cmd)}
                  className="w-full text-left px-2 py-1 text-xs font-mono rounded hover-elevate"
                  style={{ color: 'hsl(var(--accent))' }}
                  data-testid={`history-item-${index}`}
                >
                  {cmd}
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Command Categories */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {commandCategories.map((category) => {
            const Icon = category.icon;
            const isOpen = openCategories.includes(category.id);
            
            return (
              <Collapsible 
                key={category.id}
                open={isOpen}
                onOpenChange={() => toggleCategory(category.id)}
                className="mb-1"
              >
                <CollapsibleTrigger asChild>
                  <button
                    className="w-full flex items-center justify-between px-2 py-1.5 rounded font-mono text-sm hover-elevate"
                    style={{ color: 'hsl(var(--terminal-glow))' }}
                    data-testid={`category-${category.id}`}
                    aria-expanded={isOpen}
                  >
                    <span className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {category.name}
                    </span>
                    {isOpen ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <div className="pl-6 pr-2 py-1 space-y-0.5" role="menu">
                    {category.commands.map((cmd, cmdIndex) => {
                      const currentButtonIndex = buttonIndex++;
                      return (
                        <button
                          key={cmd.command}
                          ref={(el) => { commandButtonsRef.current[currentButtonIndex] = el; }}
                          onClick={() => handleCommandClick(cmd.command)}
                          onFocus={() => setFocusedIndex(currentButtonIndex)}
                          className={`w-full flex items-center justify-between px-2 py-1 rounded text-xs font-mono hover-elevate group ${focusedIndex === currentButtonIndex ? 'ring-1 ring-offset-0' : ''}`}
                          style={{ 
                            color: 'hsl(var(--terminal-glow))',
                            ringColor: 'hsl(var(--terminal-glow))'
                          }}
                          data-testid={`command-${cmd.command.toLowerCase()}`}
                          aria-label={`Execute ${cmd.command}: ${cmd.description}`}
                          role="menuitem"
                          tabIndex={focusedIndex === currentButtonIndex ? 0 : -1}
                        >
                          <span className="flex flex-col items-start">
                            <span style={{ color: 'hsl(var(--accent))' }}>{cmd.command}</span>
                            <span className="opacity-60 text-[10px]">{cmd.description}</span>
                          </span>
                          {cmd.shortcut && (
                            <span 
                              className="opacity-40 text-[10px] px-1 rounded"
                              style={{ background: 'hsl(var(--terminal-glow), 0.1)' }}
                            >
                              {cmd.shortcut}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      </ScrollArea>

      {/* Footer with keyboard hints */}
      <div 
        className="px-3 py-2 border-t text-[10px] font-mono opacity-60"
        style={{ 
          borderColor: 'hsl(var(--terminal-glow))',
          color: 'hsl(var(--terminal-glow))'
        }}
        role="contentinfo"
        aria-label="Keyboard navigation hints"
      >
        <div className="flex flex-col gap-1">
          <div className="flex justify-between">
            <span>↑↓ Navigate</span>
            <span>Enter Select</span>
          </div>
          <div className="flex justify-between">
            <span>Ctrl+K Toggle</span>
            <span>ESC Close</span>
          </div>
        </div>
      </div>
    </div>
  );
}
