import { useState, useEffect, useRef } from 'react';

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
}

export default function TerminalInterface({ 
  lines, 
  onCommand, 
  prompt = ">", 
  statusLine = ""
}: TerminalInterfaceProps) {
  const [currentCommand, setCurrentCommand] = useState('');
  const terminalRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new lines are added
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [lines]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentCommand.trim()) {
      onCommand(currentCommand.trim());
      setCurrentCommand('');
    }
  };

  const getLineColor = (type: TerminalLine['type']) => {
    switch (type) {
      case 'command':
        return 'text-accent'; // Yellow for commands
      case 'system':
        return 'text-muted-foreground'; // Gray for system
      case 'error':
        return 'text-destructive'; // Red for errors
      case 'output':
      default:
        return 'text-foreground'; // Green for output
    }
  };

  return (
    <div className="h-screen bg-background text-foreground font-mono text-base flex flex-col" data-testid="terminal-interface">
      {/* Status Line */}
      {statusLine && (
        <div className="border-b border-foreground px-2 py-1 bg-background">
          {statusLine}
        </div>
      )}

      {/* Terminal Output */}
      <div 
        ref={terminalRef}
        className="flex-1 overflow-y-auto p-2 space-y-0"
        style={{ lineHeight: '1.2' }}
      >
        {lines.map((line) => (
          <div key={line.id} className={`${getLineColor(line.type)} whitespace-pre-wrap break-words`}>
            {line.text}
          </div>
        ))}
      </div>

      {/* Command Input */}
      <div className="border-t border-foreground p-2">
        <form onSubmit={handleSubmit} className="flex items-center gap-1">
          <span className="text-foreground">{prompt}</span>
          <input
            data-testid="terminal-input"
            type="text"
            value={currentCommand}
            onChange={(e) => setCurrentCommand(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-foreground font-mono text-base"
            autoFocus
            autoComplete="off"
            spellCheck={false}
          />
        </form>
      </div>
    </div>
  );
}