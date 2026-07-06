import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';

interface GameTerminalProps {
  onCommand: (command: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function GameTerminal({ onCommand, disabled = false, placeholder = "Type your command..." }: GameTerminalProps) {
  const [command, setCommand] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (command.trim() && !disabled) {
      onCommand(command.trim());
      setCommand('');
    }
  };

  return (
    <div className="border-t border-primary/20 bg-card p-4" data-testid="game-terminal">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          data-testid="input-command"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="font-mono text-sm bg-background border-primary/30 focus:border-primary text-foreground placeholder:text-muted-foreground"
          autoComplete="off"
        />
        <Button 
          data-testid="button-submit-command"
          type="submit" 
          size="icon" 
          variant="outline"
          disabled={disabled || !command.trim()}
          className="border-primary/30 hover:border-primary"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}