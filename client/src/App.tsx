import { useState } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import RetroBootScreen from "@/components/RetroBootScreen";
import NeoCrtDesktopShell from "@/components/desktop/NeoCrtDesktopShell";

function App() {
  const [bootComplete, setBootComplete] = useState(false);

  if (!bootComplete) {
    return <RetroBootScreen onBootComplete={() => setBootComplete(true)} skipEnabled={true} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <NeoCrtDesktopShell />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
