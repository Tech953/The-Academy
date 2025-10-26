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
  const [userHasScrolled, setUserHasScrolled] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollAnimationRef = useRef<number | null>(null);
  const lastScrollTopRef = useRef(0);
  const isAutoScrollingRef = useRef(false);

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