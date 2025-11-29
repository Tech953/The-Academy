import { useState } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/Home";
import PerkDemo from "@/pages/PerkDemo";
import NotFound from "@/pages/not-found";
import RetroBootScreen from "@/components/RetroBootScreen";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/perks" component={PerkDemo} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Boot screen at app level - shown on every fresh page load
  const [bootComplete, setBootComplete] = useState(false);

  // Show boot screen before anything else
  if (!bootComplete) {
    return <RetroBootScreen onBootComplete={() => setBootComplete(true)} skipEnabled={true} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
