import { useState, useEffect, useCallback } from 'react';

interface CommandSuggestion {
  command: string;
  description: string;
  category: 'navigation' | 'action' | 'system' | 'education' | 'accessibility';
}

const COMMAND_DATABASE: CommandSuggestion[] = [
  { command: 'HELP', description: 'Show available commands', category: 'system' },
  { command: 'LOOK', description: 'Examine your surroundings', category: 'navigation' },
  { command: 'TALK', description: 'Speak with nearby NPCs', category: 'action' },
  { command: 'GO', description: 'Move to a location', category: 'navigation' },
  { command: 'INVENTORY', description: 'View your items', category: 'action' },
  { command: 'STATS', description: 'View character statistics', category: 'action' },
  { command: 'MAP', description: 'Display area map', category: 'navigation' },
  { command: 'COURSES', description: 'View available courses', category: 'education' },
  { command: 'TEXTBOOK', description: 'Open course textbook', category: 'education' },
  { command: 'CHAPTER', description: 'Read textbook chapter', category: 'education' },
  { command: 'LECTURE', description: 'View lecture notes', category: 'education' },
  { command: 'GRADES', description: 'Check your grades', category: 'education' },
  { command: 'TRANSCRIPT', description: 'View academic transcript', category: 'education' },
  { command: 'SCHEDULE', description: 'View class schedule', category: 'education' },
  { command: 'QUIZ', description: 'Take a practice quiz', category: 'education' },
  { command: 'GLOSSARY', description: 'Look up educational terms', category: 'education' },
  { command: 'ACCESSIBILITY', description: 'Manage accessibility settings', category: 'accessibility' },
  { command: 'LANG', description: 'Change interface language', category: 'accessibility' },
  { command: 'CLEAR', description: 'Clear terminal screen', category: 'system' },
  { command: 'SAVE', description: 'Save game progress', category: 'system' },
  { command: 'LOAD', description: 'Load saved game', category: 'system' },
  { command: 'REST', description: 'Rest to recover energy', category: 'action' },
  { command: 'USE', description: 'Use an item', category: 'action' },
  { command: 'EXAMINE', description: 'Examine an object closely', category: 'navigation' },
  { command: 'RESEARCH', description: 'Open research notebook', category: 'education' },
];

const CATEGORY_COLORS: Record<CommandSuggestion['category'], string> = {
  navigation: '#00ffff',
  action: '#00ff00',
  system: '#ffaa00',
  education: '#cc66ff',
  accessibility: '#ff66cc',
};

interface CommandAutocompleteProps {
  input: string;
  onSelect: (command: string) => void;
  visible: boolean;
  position: { x: number; y: number };
  selectedIndex: number;
  onNavigate: (direction: 'up' | 'down') => void;
}

export function getCommandSuggestions(input: string): CommandSuggestion[] {
  if (!input || input.length < 2) return [];
  
  const normalizedInput = input.toUpperCase().trim();
  
  return COMMAND_DATABASE.filter(cmd => 
    cmd.command.startsWith(normalizedInput)
  ).slice(0, 6);
}

export function CommandAutocomplete({ 
  input, 
  onSelect, 
  visible, 
  position,
  selectedIndex,
}: CommandAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<CommandSuggestion[]>([]);

  useEffect(() => {
    setSuggestions(getCommandSuggestions(input));
  }, [input]);

  if (!visible || suggestions.length === 0) return null;

  return (
    <div 
      className="command-autocomplete"
      style={{
        position: 'absolute',
        left: position.x,
        bottom: position.y,
        minWidth: '280px',
        maxWidth: '400px',
        zIndex: 10000,
      }}
    >
      {suggestions.map((suggestion, index) => (
        <div
          key={suggestion.command}
          className={`command-autocomplete-item ${index === selectedIndex ? 'selected' : ''}`}
          onClick={() => onSelect(suggestion.command)}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            borderLeftColor: index === selectedIndex ? CATEGORY_COLORS[suggestion.category] : 'transparent',
          }}
        >
          <span style={{ 
            color: CATEGORY_COLORS[suggestion.category],
            fontWeight: 'bold',
            fontFamily: 'monospace',
            fontSize: '12px',
          }}>
            {suggestion.command}
          </span>
          <span style={{ 
            color: '#666',
            fontSize: '10px',
            textAlign: 'right',
            flex: 1,
          }}>
            {suggestion.description}
          </span>
        </div>
      ))}
      <div style={{
        padding: '6px 12px',
        borderTop: '1px solid rgba(0, 255, 0, 0.1)',
        fontSize: '9px',
        color: '#444',
        display: 'flex',
        justifyContent: 'space-between',
      }}>
        <span>↑↓ navigate</span>
        <span>Tab/Enter select</span>
        <span>Esc close</span>
      </div>
    </div>
  );
}

export function useCommandAutocomplete() {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [currentInput, setCurrentInput] = useState('');

  const show = useCallback((input: string) => {
    setCurrentInput(input);
    const suggestions = getCommandSuggestions(input);
    if (suggestions.length > 0) {
      setIsVisible(true);
      setSelectedIndex(0);
    } else {
      setIsVisible(false);
    }
  }, []);

  const hide = useCallback(() => {
    setIsVisible(false);
    setSelectedIndex(0);
  }, []);

  const navigate = useCallback((direction: 'up' | 'down') => {
    const suggestions = getCommandSuggestions(currentInput);
    if (direction === 'up') {
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else {
      setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
    }
  }, [currentInput]);

  const getSelectedCommand = useCallback(() => {
    const suggestions = getCommandSuggestions(currentInput);
    return suggestions[selectedIndex]?.command || '';
  }, [currentInput, selectedIndex]);

  return {
    isVisible,
    selectedIndex,
    show,
    hide,
    navigate,
    getSelectedCommand,
  };
}
