import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';

export interface GameMessage {
  id: string;
  type: 'narrative' | 'system' | 'dialogue' | 'action';
  content: string;
  character?: string;
  timestamp?: Date;
}

interface NarrativeDisplayProps {
  messages: GameMessage[];
  className?: string;
}

export default function NarrativeDisplay({ messages, className = "" }: NarrativeDisplayProps) {
  const getMessageStyle = (type: GameMessage['type']) => {
    switch (type) {
      case 'narrative':
        return 'text-foreground leading-relaxed';
      case 'system':
        return 'text-accent font-mono text-sm italic';
      case 'dialogue':
        return 'text-primary font-medium';
      case 'action':
        return 'text-muted-foreground italic';
      default:
        return 'text-foreground';
    }
  };

  return (
    <Card className={`h-full ${className}`} data-testid="narrative-display">
      <ScrollArea className="h-full p-6">
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className="group">
              {message.character && (
                <div className="text-xs text-muted-foreground font-mono mb-1">
                  {message.character}
                </div>
              )}
              <div className={`${getMessageStyle(message.type)} whitespace-pre-wrap`}>
                {message.content}
              </div>
            </div>
          ))}
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground italic">
              Your story begins here...
            </div>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}