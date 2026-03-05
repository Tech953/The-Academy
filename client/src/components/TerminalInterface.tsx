import { useState, useEffect, useRef, useTransition, startTransition, useCallback, useMemo } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import CommandPalette from './CommandPalette';

const DIR_ABBREV: Record<string, string> = {
  NORTH: 'N', SOUTH: 'S', EAST: 'E', WEST: 'W',
  NORTHEAST: 'NE', NORTHWEST: 'NW', SOUTHEAST: 'SE', SOUTHWEST: 'SW',
  UP: 'UP', DOWN: 'DN', ENTER: 'ENT',
};

function abbrevDir(d: string): string {
  return DIR_ABBREV[d.toUpperCase()] ?? d.slice(0, 4);
}

interface TerminalLine {
  id: string;
  text: string;
  type: 'output' | 'command' | 'system' | 'error';
}

interface TerminalInterfaceProps {
  lines: TerminalLine[];
  onCommand: (command: string) => void;
  prompt?: string;
  statusLine?: string;
  enableCrtEffect?: boolean;
  commandHistory?: string[];
}

export default function TerminalInterface({ 
  lines, 
  onCommand, 
  prompt = ">", 
  statusLine = "",
  enableCrtEffect = true,
  commandHistory = []
}: TerminalInterfaceProps) {
  const [currentCommand, setCurrentCommand] = useState('');
  const [isPending, startTransition] = useTransition();
  const [userHasScrolled, setUserHasScrolled] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [savedInput, setSavedInput] = useState('');
  const [quickBarOpen, setQuickBarOpen] = useState(true);
  const [exitCommands, setExitCommands] = useState<string[]>([]);
  const [examineTargets, setExamineTargets] = useState<string[]>([]);
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollAnimationRef = useRef<number | null>(null);
  const lastScrollTopRef = useRef(0);
  const isAutoScrollingRef = useRef(false);

  // Parse recent terminal lines for exits and examinable objects
  useEffect(() => {
    const recent = lines.slice(-40).reverse();
    let foundExits = false;
    let foundExamine = false;
    for (const line of recent) {
      if (!foundExits && line.text.startsWith('Exits:')) {
        const exits = line.text.replace('Exits:', '').split(',').map(e => e.trim()).filter(Boolean);
        setExitCommands(exits);
        foundExits = true;
      }
      if (!foundExamine && line.text.startsWith('You can examine:')) {
        const targets = line.text.replace('You can examine:', '').split(',').map(e => e.trim()).filter(Boolean);
        setExamineTargets(targets);
        foundExamine = true;
      }
      if (foundExits && foundExamine) break;
    }
  }, [lines]);

  const fireQuickCommand = useCallback((cmd: string) => {
    setHistoryIndex(-1);
    setSavedInput('');
    startTransition(() => {
      onCommand(cmd);
      setCurrentCommand('');
    });
    inputRef.current?.focus();
  }, [onCommand]);

  // Jump to bottom of terminal
  const jumpToBottom = useCallback(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
      setUserHasScrolled(false);
    }
  }, []);

  // Toggle command palette visibility
  const toggleCommandPalette = useCallback(() => {
    setShowCommandPalette(prev => !prev);
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC to close command palette
      if (e.key === 'Escape' && showCommandPalette) {
        setShowCommandPalette(false);
        inputRef.current?.focus();
      }
      // Ctrl+K or Cmd+K to toggle command palette
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        toggleCommandPalette();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showCommandPalette, toggleCommandPalette]);

  // Check if user is near the bottom of the scroll
  const isNearBottom = (container: HTMLElement): boolean => {
    const threshold = 150; // pixels from bottom
    const position = container.scrollTop + container.clientHeight;
    const bottom = container.scrollHeight;
    return bottom - position < threshold;
  };

  // Auto-scroll to bottom when new lines are added
  useEffect(() => {
    if (!terminalRef.current) return;

    const scrollContainer = terminalRef.current;
    
    // Cancel any ongoing scroll animation
    if (scrollAnimationRef.current) {
      cancelAnimationFrame(scrollAnimationRef.current);
      scrollAnimationRef.current = null;
    }

    // Only auto-scroll if:
    // 1. User hasn't manually scrolled up, OR
    // 2. User is near the bottom (within threshold)
    const shouldAutoScroll = !userHasScrolled || isNearBottom(scrollContainer);
    
    if (shouldAutoScroll) {
      // Small delay to allow manual scrolling to take effect
      const scrollTimer = setTimeout(() => {
        isAutoScrollingRef.current = true;
        
        const scrollToBottom = () => {
          if (!scrollContainer) return;
          
          const targetScrollTop = scrollContainer.scrollHeight - scrollContainer.clientHeight;
          const currentScrollTop = scrollContainer.scrollTop;
          const distance = targetScrollTop - currentScrollTop;
          
          // If close enough, snap to bottom
          if (Math.abs(distance) < 2) {
            scrollContainer.scrollTop = targetScrollTop;
            lastScrollTopRef.current = targetScrollTop;
            scrollAnimationRef.current = null;
            isAutoScrollingRef.current = false;
            return;
          }
          
          // Smooth scroll
          const newScrollTop = currentScrollTop + (distance * 0.3);
          scrollContainer.scrollTop = newScrollTop;
          lastScrollTopRef.current = newScrollTop;
          scrollAnimationRef.current = requestAnimationFrame(scrollToBottom);
        };
        
        scrollAnimationRef.current = requestAnimationFrame(scrollToBottom);
      }, 50); // 50ms delay

      return () => {
        clearTimeout(scrollTimer);
        if (scrollAnimationRef.current) {
          cancelAnimationFrame(scrollAnimationRef.current);
          scrollAnimationRef.current = null;
          isAutoScrollingRef.current = false;
        }
      };
    }

    // Cleanup function to cancel animation on unmount
    return () => {
      if (scrollAnimationRef.current) {
        cancelAnimationFrame(scrollAnimationRef.current);
        scrollAnimationRef.current = null;
      }
    };
  }, [lines, userHasScrolled]);

  // Detect user scrolling and interaction
  useEffect(() => {
    const scrollContainer = terminalRef.current;
    if (!scrollContainer) return;

    const cancelAutoScroll = () => {
      if (scrollAnimationRef.current) {
        cancelAnimationFrame(scrollAnimationRef.current);
        scrollAnimationRef.current = null;
      }
      // Always reset the flag when canceling
      isAutoScrollingRef.current = false;
    };

    // Detect user interaction starting (before scroll events)
    const handleInteractionStart = () => {
      cancelAutoScroll();
      // Mark that user is manually scrolling
      // handleScroll will determine if they're near bottom
      setUserHasScrolled(true);
    };

    const handleScroll = () => {
      // Don't interfere with auto-scroll
      if (isAutoScrollingRef.current) {
        return;
      }
      
      // Cancel any ongoing auto-scroll (user is scrolling)
      cancelAutoScroll();
      
      // Check if user is near bottom
      if (isNearBottom(scrollContainer)) {
        setUserHasScrolled(false);
      } else {
        setUserHasScrolled(true);
      }
      
      lastScrollTopRef.current = scrollContainer.scrollTop;
    };

    // Listen for user interaction starts
    scrollContainer.addEventListener('mousedown', handleInteractionStart);
    scrollContainer.addEventListener('touchstart', handleInteractionStart, { passive: true });
    scrollContainer.addEventListener('wheel', handleInteractionStart, { passive: true });
    
    // Listen for scroll events
    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      scrollContainer.removeEventListener('mousedown', handleInteractionStart);
      scrollContainer.removeEventListener('touchstart', handleInteractionStart);
      scrollContainer.removeEventListener('wheel', handleInteractionStart);
      scrollContainer.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Keep input focused for seamless typing experience (scoped to terminal container only)
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const focusInput = () => {
      // Don't steal focus when command palette is open
      if (showCommandPalette) return;
      
      if (inputRef.current && document.activeElement !== inputRef.current) {
        inputRef.current.focus();
      }
    };

    const container = containerRef.current;
    if (!container) return;

    // Focus only when clicking within the terminal container (not palette or floating controls)
    const handleClick = (e: MouseEvent) => {
      // Check if click is within the terminal container
      if (container.contains(e.target as Node)) {
        focusInput();
      }
    };
    
    container.addEventListener('click', handleClick);
    
    // Initial focus (only if palette is closed)
    if (!showCommandPalette) {
      focusInput();
    }

    return () => container.removeEventListener('click', handleClick);
  }, [showCommandPalette]);

  // Handle arrow key navigation for command history
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (commandHistory.length === 0) return;

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      
      // Save current input if starting to navigate
      if (historyIndex === -1) {
        setSavedInput(currentCommand);
      }
      
      // Move up in history (towards older commands)
      const newIndex = Math.min(historyIndex + 1, commandHistory.length - 1);
      setHistoryIndex(newIndex);
      setCurrentCommand(commandHistory[commandHistory.length - 1 - newIndex]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      
      if (historyIndex > 0) {
        // Move down in history (towards newer commands)
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCurrentCommand(commandHistory[commandHistory.length - 1 - newIndex]);
      } else if (historyIndex === 0) {
        // Back to current input
        setHistoryIndex(-1);
        setCurrentCommand(savedInput);
      }
    }
  }, [commandHistory, historyIndex, currentCommand, savedInput]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentCommand.trim()) {
      // Reset history navigation
      setHistoryIndex(-1);
      setSavedInput('');
      // Use transition for responsive state updates
      startTransition(() => {
        onCommand(currentCommand.trim());
        setCurrentCommand('');
      });
    }
  };

  const getLineColor = (type: TerminalLine['type']) => {
    switch (type) {
      case 'command':
        return ''; // Will use inline style for yellow
      case 'system':
        return ''; // Will use inline style for cyan
      case 'error':
        return ''; // Will use inline style for red
      case 'output':
      default:
        return ''; // Will use inline style for green
    }
  };

  const getLineStyle = (type: TerminalLine['type']) => {
    switch (type) {
      case 'command':
        return { color: 'hsl(var(--accent))' }; // Yellow for commands
      case 'system':
        return { color: 'hsl(180, 100%, 70%)' }; // Cyan for system
      case 'error':
        return { color: 'hsl(var(--destructive))' }; // Red for errors
      case 'output':
      default:
        return { color: 'hsl(var(--terminal-glow))' }; // Green for output
    }
  };

  return (
    <div className="relative h-screen">
      {/* Command Palette */}
      <CommandPalette
        onCommand={onCommand}
        commandHistory={commandHistory}
        onJumpToBottom={jumpToBottom}
        isVisible={showCommandPalette}
        onToggleVisibility={toggleCommandPalette}
      />

      {/* Terminal Container */}
      <div 
        ref={containerRef}
        className={`h-full bg-background text-foreground font-mono text-base flex flex-col terminal-container ${enableCrtEffect ? 'crt-effect' : ''} ${showCommandPalette ? 'pr-72' : ''}`}
        data-testid="terminal-interface"
        style={{ 
          background: 'hsl(var(--terminal-bg))',
          color: 'hsl(var(--terminal-glow))',
          transition: 'padding-right 0.2s ease'
        }}
        role="main"
        aria-label="Game terminal"
      >
        {/* Status Line */}
        {statusLine && (
          <div 
            className="border-b px-3 py-1 terminal-text"
            style={{ 
              borderColor: 'hsl(var(--terminal-glow))',
              background: 'hsl(var(--terminal-bg))'
            }}
          >
            {statusLine}
          </div>
        )}

        {/* Terminal Output */}
        <div className="relative flex-1">
          <div 
            ref={terminalRef}
            className="absolute inset-0 overflow-y-auto p-3 space-y-0 smooth-scroll"
            style={{ 
              lineHeight: '1.4',
              scrollbarWidth: 'thin',
              scrollbarColor: 'hsl(var(--terminal-glow)) transparent'
            }}
            role="log"
            aria-label="Game output"
            aria-live="polite"
          >
            {lines.map((line, index) => (
              <div 
                key={line.id} 
                className={`${getLineColor(line.type)} whitespace-pre-wrap break-words terminal-text`}
                style={{ 
                  ...getLineStyle(line.type),
                  opacity: isPending && index >= lines.length - 1 ? 0.7 : 1,
                  transition: 'opacity 0.1s ease'
                }}
              >
                {line.text}
              </div>
            ))}
          </div>
          
          {/* Scroll to bottom indicator - shown when user has scrolled up */}
          {userHasScrolled && (
            <button
              onClick={jumpToBottom}
              className="absolute bottom-3 left-1/2 transform -translate-x-1/2 px-3 py-1 rounded-full flex items-center gap-1 text-xs font-mono transition-all duration-200 hover:scale-105"
              style={{
                background: 'hsl(var(--terminal-bg))',
                border: '1px solid hsl(var(--terminal-glow))',
                color: 'hsl(var(--terminal-glow))',
                boxShadow: '0 2px 8px rgba(0, 255, 0, 0.2)'
              }}
              data-testid="button-scroll-to-bottom"
              aria-label="Scroll to latest output"
            >
              <ChevronDown className="h-3 w-3" />
              <span>New content</span>
            </button>
          )}
        </div>

        {/* Quick Command Bar */}
        <div
          style={{
            borderTop: '1px solid hsl(var(--terminal-glow) / 0.2)',
            background: 'hsl(var(--terminal-bg))',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '2px 10px',
              cursor: 'pointer',
            }}
            onClick={() => setQuickBarOpen(o => !o)}
          >
            <span style={{ fontSize: 8, color: 'hsl(var(--terminal-glow) / 0.4)', letterSpacing: 1, fontFamily: 'monospace' }}>
              QUICK COMMANDS
            </span>
            <span style={{ color: 'hsl(var(--terminal-glow) / 0.4)', display: 'flex', alignItems: 'center' }}>
              {quickBarOpen ? <ChevronDown size={10} /> : <ChevronUp size={10} />}
            </span>
          </div>
          {quickBarOpen && (
            <div style={{ padding: '0 8px 6px', display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
              {/* Utility commands */}
              {['LOOK', 'STATUS', 'INVENTORY', 'LIST', 'HELP', 'SAVE', 'TIME', 'NOTES'].map(cmd => (
                <button
                  key={cmd}
                  onClick={() => fireQuickCommand(cmd)}
                  style={{
                    background: 'hsl(var(--terminal-glow) / 0.06)',
                    border: '1px solid hsl(var(--terminal-glow) / 0.3)',
                    color: 'hsl(var(--terminal-glow) / 0.75)',
                    fontFamily: 'monospace',
                    fontSize: 9,
                    padding: '1px 7px',
                    cursor: 'pointer',
                    letterSpacing: 0.5,
                  }}
                >
                  {cmd}
                </button>
              ))}
              {/* Exits */}
              {exitCommands.length > 0 && (
                <>
                  <span style={{ color: 'hsl(var(--terminal-glow) / 0.25)', fontSize: 9, margin: '0 2px' }}>|</span>
                  <span style={{ fontSize: 8, color: 'hsl(180, 100%, 70% / 0.5)', fontFamily: 'monospace', letterSpacing: 0.5 }}>GO:</span>
                  {exitCommands.map(exit => (
                    <button
                      key={exit}
                      onClick={() => fireQuickCommand(exit)}
                      title={exit}
                      style={{
                        background: 'hsl(180, 100%, 70% / 0.07)',
                        border: '1px solid hsl(180, 100%, 70% / 0.35)',
                        color: 'hsl(180, 100%, 70% / 0.8)',
                        fontFamily: 'monospace',
                        fontSize: 9,
                        padding: '1px 6px',
                        cursor: 'pointer',
                        letterSpacing: 0.5,
                      }}
                    >
                      {abbrevDir(exit)}
                    </button>
                  ))}
                </>
              )}
              {/* Examine targets */}
              {examineTargets.length > 0 && (
                <>
                  <span style={{ color: 'hsl(var(--terminal-glow) / 0.25)', fontSize: 9, margin: '0 2px' }}>|</span>
                  <span style={{ fontSize: 8, color: 'hsl(var(--accent) / 0.5)', fontFamily: 'monospace', letterSpacing: 0.5 }}>X:</span>
                  {examineTargets.map(target => (
                    <button
                      key={target}
                      onClick={() => fireQuickCommand(`examine ${target}`)}
                      title={`examine ${target}`}
                      style={{
                        background: 'hsl(var(--accent) / 0.07)',
                        border: '1px solid hsl(var(--accent) / 0.3)',
                        color: 'hsl(var(--accent) / 0.75)',
                        fontFamily: 'monospace',
                        fontSize: 9,
                        padding: '1px 6px',
                        cursor: 'pointer',
                        letterSpacing: 0.5,
                        maxWidth: 80,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {target.length > 10 ? target.slice(0, 9) + '…' : target}
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        {/* Command Input */}
        <div 
          className="border-t px-3 py-2"
          style={{ borderColor: 'hsl(var(--terminal-glow))' }}
        >
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <span className="terminal-text" style={{ color: 'hsl(var(--terminal-glow))' }}>
              {prompt}
            </span>
            <input
              ref={inputRef}
              data-testid="terminal-input"
              type="text"
              value={currentCommand}
              onChange={(e) => setCurrentCommand(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent border-none outline-none font-mono text-base terminal-text"
              style={{ 
                color: 'hsl(var(--accent))',
                caretColor: 'hsl(var(--accent))'
              }}
              autoComplete="off"
              spellCheck={false}
              disabled={isPending}
              aria-label="Enter command"
              aria-describedby="history-hint"
            />
            <span className="terminal-cursor">█</span>
            <span id="history-hint" className="sr-only">
              Press up and down arrow keys to navigate command history
            </span>
          </form>
        </div>
      </div>
    </div>
  );
}