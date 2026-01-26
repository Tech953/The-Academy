import { useState } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CrtThemeProvider } from "@/contexts/CrtThemeContext";
import RetroBootScreen from "@/components/RetroBootScreen";
import NeoCrtDesktopShell from "@/components/desktop/NeoCrtDesktopShell";

function App() {
  const [bootComplete, setBootComplete] = useState(false);

  return (
    <CrtThemeProvider>
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
    </CrtThemeProvider>
  );
}

export default App;
