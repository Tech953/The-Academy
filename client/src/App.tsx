import { useState } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CrtThemeProvider } from "@/contexts/CrtThemeContext";
import { I18nProvider } from "@/contexts/I18nContext";
import { NotificationsProvider } from "@/contexts/NotificationsContext";
import { GameStateProvider } from "@/contexts/GameStateContext";
import RetroBootScreen from "@/components/RetroBootScreen";
import NeoCrtDesktopShell from "@/components/desktop/NeoCrtDesktopShell";

function App() {
  const [bootComplete, setBootComplete] = useState(false);

  return (
    <CrtThemeProvider>
      <I18nProvider>
        <NotificationsProvider>
          <GameStateProvider>
            <QueryClientProvider client={queryClient}>
              <TooltipProvider>
                {!bootComplete ? (
                  <RetroBootScreen onBootComplete={() => setBootComplete(true)} skipEnabled={true} />
                ) : (
                  <>
                    <Toaster />
                    <NeoCrtDesktopShell />
                  </>
                )}
              </TooltipProvider>
            </QueryClientProvider>
          </GameStateProvider>
        </NotificationsProvider>
      </I18nProvider>
    </CrtThemeProvider>
  );
}

export default App;
