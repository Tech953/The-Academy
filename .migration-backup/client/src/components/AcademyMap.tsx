import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Users, BookOpen, Zap } from 'lucide-react';

interface Location {
  id: string;
  name: string;
  description: string;
  type: 'classroom' | 'common' | 'special' | 'restricted';
  occupants?: number;
  accessible: boolean;
}

interface AcademyMapProps {
  currentLocation: string;
  onLocationSelect: (locationId: string) => void;
  className?: string;
}

export default function AcademyMap({ currentLocation, onLocationSelect, className = "" }: AcademyMapProps) {
  // Academy locations based on the provided document
  const locations: Location[] = [
    { id: 'lobby', name: 'Main Lobby', description: 'Grand entrance hall with moving portraits', type: 'common', occupants: 12, accessible: true },
    { id: 'cafeteria', name: 'Cafeteria', description: 'Central dining area with mysterious food options', type: 'common', occupants: 45, accessible: true },
    { id: 'library', name: 'Library (Larcen)', description: 'Ancient tomes and forbidden knowledge', type: 'common', occupants: 8, accessible: true },
    { id: 'computer_hall', name: 'Computer Hall', description: 'Technology classroom with AI presence', type: 'classroom', occupants: 15, accessible: true },
    { id: 'chemistry_a', name: 'Chemistry Lab A', description: 'Advanced alchemy for grades 11-12', type: 'classroom', occupants: 6, accessible: true },
    { id: 'chemistry_b', name: 'Chemistry Lab B', description: 'Basic potions for grades 9-10', type: 'classroom', occupants: 8, accessible: true },
    { id: 'gymnasium', name: 'Gymnasium (Rixik)', description: 'Physical training and mysterious competitions', type: 'common', occupants: 20, accessible: true },
    { id: 'headmaster', name: "Head Master's Office", description: 'The source of The Academy\'s deepest secrets', type: 'restricted', occupants: 1, accessible: false },
    { id: 'unmarked_bathroom', name: 'Unmarked Restroom', description: 'Strange energies emanate from within', type: 'special', occupants: 0, accessible: true },
    { id: 'teachers_lounge', name: 'Teachers Lounge', description: 'Faculty gathering place - students not allowed', type: 'restricted', occupants: 5, accessible: false },
    { id: 'guidance', name: 'Guidance Counselor', description: 'Where students seek answers about their path', type: 'special', occupants: 2, accessible: true },
    { id: 'art_exhibit', name: 'Art Exhibit Hall', description: 'Paintings that watch and whisper', type: 'common', occupants: 3, accessible: true }
  ];

  const getLocationIcon = (type: Location['type']) => {
    switch (type) {
      case 'classroom': return <BookOpen className="h-3 w-3" />;
      case 'common': return <Users className="h-3 w-3" />;
      case 'special': return <Zap className="h-3 w-3" />;
      case 'restricted': return <MapPin className="h-3 w-3 text-destructive" />;
      default: return <MapPin className="h-3 w-3" />;
    }
  };

  const getLocationColor = (type: Location['type'], accessible: boolean) => {
    if (!accessible) return 'border-destructive/50 bg-destructive/10';
    switch (type) {
      case 'classroom': return 'border-primary/50 bg-primary/10';
      case 'common': return 'border-accent/50 bg-accent/10';
      case 'special': return 'border-secondary/50 bg-secondary/10';
      default: return 'border-border bg-card';
    }
  };

  return (
    <Card className={`bg-card/80 border-primary/20 ${className}`} data-testid="academy-map">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-mono">
          <MapPin className="h-4 w-4 text-primary" />
          Academy Map
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-xs text-muted-foreground">
          Current Location: <span className="text-accent font-mono">{currentLocation}</span>
        </div>
        
        <div className="grid gap-2 max-h-80 overflow-y-auto">
          {locations.map((location) => (
            <Card 
              key={location.id}
              className={`cursor-pointer transition-all hover-elevate ${
                getLocationColor(location.type, location.accessible)
              } ${currentLocation === location.name ? 'ring-2 ring-primary' : ''}`}
              onClick={() => location.accessible && onLocationSelect(location.id)}
              data-testid={`location-${location.id}`}
            >
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getLocationIcon(location.type)}
                      <span className="text-xs font-mono font-medium truncate">
                        {location.name}
                      </span>
                      {currentLocation === location.name && (
                        <Badge variant="default" className="text-xs">Current</Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground leading-relaxed">
                      {location.description}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-1">
                    {!location.accessible && (
                      <Badge variant="destructive" className="text-xs">Locked</Badge>
                    )}
                    {location.occupants !== undefined && location.occupants > 0 && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        <span>{location.occupants}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="pt-2 border-t border-primary/20">
          <div className="flex flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-1">
              <BookOpen className="h-3 w-3 text-primary" />
              <span>Classroom</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3 text-accent" />
              <span>Common</span>
            </div>
            <div className="flex items-center gap-1">
              <Zap className="h-3 w-3 text-secondary" />
              <span>Special</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3 text-destructive" />
              <span>Restricted</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}