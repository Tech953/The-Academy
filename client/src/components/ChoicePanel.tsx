import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface GameChoice {
  id: string;
  text: string;
  description?: string;
  disabled?: boolean;
  consequence?: 'positive' | 'negative' | 'neutral';
}

interface ChoicePanelProps {
  choices: GameChoice[];
  onChoice: (choiceId: string) => void;
  title?: string;
  disabled?: boolean;
}

export default function ChoicePanel({ choices, onChoice, title = "Choose your path", disabled = false }: ChoicePanelProps) {
  const getChoiceVariant = (consequence: GameChoice['consequence']) => {
    switch (consequence) {
      case 'positive':
        return 'default';
      case 'negative':
        return 'destructive';
      case 'neutral':
      default:
        return 'outline';
    }
  };

  if (choices.length === 0) return null;

  return (
    <Card className="bg-card/50 border-primary/20" data-testid="choice-panel">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-mono text-accent">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {choices.map((choice, index) => (
          <Button
            key={choice.id}
            data-testid={`button-choice-${choice.id}`}
            variant={getChoiceVariant(choice.consequence)}
            className="w-full justify-start text-left h-auto p-3 font-mono text-sm"
            disabled={disabled || choice.disabled}
            onClick={() => onChoice(choice.id)}
          >
            <div className="flex flex-col items-start gap-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{index + 1}.</span>
                <span>{choice.text}</span>
              </div>
              {choice.description && (
                <span className="text-xs text-muted-foreground leading-relaxed">
                  {choice.description}
                </span>
              )}
            </div>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}