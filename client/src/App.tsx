import { useState } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import RetroBootScreen from "@/components/RetroBootScreen";
import DesktopShell from "@/components/desktop/DesktopShell";

function App() {
  // Boot screen at app level - shown on every fresh page load
  const [bootComplete, setBootComplete] = useState(false);

  // Show boot screen before anything else
  if (!bootComplete) {
    return <RetroBootScreen onBootComplete={() => setBootComplete(true)} skipEnabled={true} />;
  }

  // After boot, show the Y2K desktop environment
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <DesktopShell />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
