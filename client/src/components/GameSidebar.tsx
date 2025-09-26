import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Save, Upload, Settings, BookOpen, Users, MapPin, Clock } from 'lucide-react';

interface GameSidebarProps {
  onSave: () => void;
  onLoad: () => void;
  onSettings: () => void;
  gameStats?: {
    location: string;
    timeOfDay: string;
    day: number;
    unreadMessages: number;
  };
}

export default function GameSidebar({ 
  onSave, 
  onLoad, 
  onSettings,
  gameStats = {
    location: "Main Hall",
    timeOfDay: "Morning",
    day: 1,
    unreadMessages: 0
  }
}: GameSidebarProps) {
  return (
    <div className="space-y-4 h-full overflow-auto p-4" data-testid="game-sidebar">
      {/* Game Controls */}
      <Card className="bg-card/50 border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-mono text-accent">Game Menu</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button 
            data-testid="button-save-game"
            onClick={onSave}
            variant="outline" 
            size="sm" 
            className="w-full justify-start gap-2 font-mono"
          >
            <Save className="h-3 w-3" />
            Save Game
          </Button>
          <Button 
            data-testid="button-load-game"
            onClick={onLoad}
            variant="outline" 
            size="sm" 
            className="w-full justify-start gap-2 font-mono"
          >
            <Upload className="h-3 w-3" />
            Load Game
          </Button>
          <Button 
            data-testid="button-settings"
            onClick={onSettings}
            variant="outline" 
            size="sm" 
            className="w-full justify-start gap-2 font-mono"
          >
            <Settings className="h-3 w-3" />
            Settings
          </Button>
        </CardContent>
      </Card>

      {/* Game Status */}
      <Card className="bg-card/50 border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-mono text-accent">Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <MapPin className="h-3 w-3 text-primary" />
              <span className="text-muted-foreground">Location:</span>
              <span data-testid="text-location">{gameStats.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3 text-primary" />
              <span className="text-muted-foreground">Time:</span>
              <span data-testid="text-time">{gameStats.timeOfDay}</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-3 w-3 text-primary" />
              <span className="text-muted-foreground">Day:</span>
              <span data-testid="text-day">{gameStats.day}</span>
            </div>
          </div>
          
          <Separator className="bg-primary/20" />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs">
              <Users className="h-3 w-3 text-accent" />
              <span>Messages</span>
            </div>
            {gameStats.unreadMessages > 0 && (
              <Badge variant="destructive" className="text-xs h-5">
                {gameStats.unreadMessages}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-card/50 border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-mono text-accent">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full justify-start gap-2 font-mono text-xs"
            data-testid="button-check-schedule"
          >
            <BookOpen className="h-3 w-3" />
            Check Class Schedule
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full justify-start gap-2 font-mono text-xs"
            data-testid="button-view-map"
          >
            <MapPin className="h-3 w-3" />
            View Academy Map
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full justify-start gap-2 font-mono text-xs"
            data-testid="button-social-network"
          >
            <Users className="h-3 w-3" />
            Social Network
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}