import { useState, useEffect, useRef, useTransition, startTransition } from 'react';

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
}

export default function TerminalInterface({ 
  lines, 
  onCommand, 
  prompt = ">", 
  statusLine = "",
  enableCrtEffect = true
}: TerminalInterfaceProps) {
  const [currentCommand, setCurrentCommand] = useState('');
  const [isPending, startTransition] = useTransition();
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Smooth auto-scroll to bottom when new lines are added
  useEffect(() => {
    if (terminalRef.current) {
      const scrollContainer = terminalRef.current;
      const targetScrollTop = scrollContainer.scrollHeight - scrollContainer.clientHeight;
      
      // Use requestAnimationFrame for smooth 60fps scrolling
      const smoothScroll = () => {
        const currentScrollTop = scrollContainer.scrollTop;
        const distance = targetScrollTop - currentScrollTop;
        
        if (Math.abs(distance) > 1) {
          scrollContainer.scrollTop = currentScrollTop + (distance * 0.15);
          requestAnimationFrame(smoothScroll);
        } else {
          scrollContainer.scrollTop = targetScrollTop;
        }
      };
      
      requestAnimationFrame(smoothScroll);
    }
  }, [lines]);

  // Keep input focused for seamless typing experience
  useEffect(() => {
    const focusInput = () => {
      if (inputRef.current && document.activeElement !== inputRef.current) {
        inputRef.current.focus();
      }
    };

    // Focus on click anywhere in terminal
    const handleClick = () => focusInput();
    document.addEventListener('click', handleClick);
    
    // Initial focus
    focusInput();

    return () => document.removeEventListener('click', handleClick);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentCommand.trim()) {
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
    <div 
      className={`h-screen bg-background text-foreground font-mono text-base flex flex-col terminal-container ${enableCrtEffect ? 'crt-effect' : ''}`}
      data-testid="terminal-interface"
      style={{ 
        background: 'hsl(var(--terminal-bg))',
        color: 'hsl(var(--terminal-glow))'
      }}
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
      <div 
        ref={terminalRef}
        className="flex-1 overflow-y-auto p-3 space-y-0 smooth-scroll"
        style={{ 
          lineHeight: '1.4',
          scrollbarWidth: 'thin',
          scrollbarColor: 'hsl(var(--terminal-glow)) transparent'
        }}
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
            className="flex-1 bg-transparent border-none outline-none font-mono text-base terminal-text"
            style={{ 
              color: 'hsl(var(--accent))',
              caretColor: 'hsl(var(--accent))'
            }}
            autoComplete="off"
            spellCheck={false}
            disabled={isPending}
          />
          <span className="terminal-cursor">█</span>
        </form>
      </div>
    </div>
  );
}