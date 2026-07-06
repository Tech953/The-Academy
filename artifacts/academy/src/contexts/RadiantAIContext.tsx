import { createContext, useContext, ReactNode, useEffect, useRef } from 'react';
import { useRadiantAI, UseRadiantAI } from '@/hooks/useRadiantAI';
import { gameStateManager } from '@/lib/gameState';

const RadiantAIContext = createContext<UseRadiantAI | null>(null);

interface RadiantAIProviderProps {
  children: ReactNode;
}

export function RadiantAIProvider({ children }: RadiantAIProviderProps) {
  const radiantAI = useRadiantAI();
  const tickIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const savedState = gameStateManager.getState()?.radiantAIState;
    if (savedState && radiantAI.initialized) {
      radiantAI.loadState(savedState);
    }
  }, [radiantAI.initialized]);

  useEffect(() => {
    tickIntervalRef.current = setInterval(() => {
      const gameState = gameStateManager.getState();
      if (gameState) {
        const gameHour = getGameHour();
        const playerLocation = gameState.currentLocation?.id || null;
        radiantAI.tick(gameHour, playerLocation);
      }
    }, 30000);

    return () => {
      if (tickIntervalRef.current) {
        clearInterval(tickIntervalRef.current);
      }
    };
  }, [radiantAI.tick]);

  useEffect(() => {
    if (radiantAI.initialized) {
      const saveInterval = setInterval(() => {
        const serialized = radiantAI.saveState();
        gameStateManager.setRadiantAIState(serialized);
      }, 60000);

      return () => clearInterval(saveInterval);
    }
  }, [radiantAI.initialized, radiantAI.saveState]);

  return (
    <RadiantAIContext.Provider value={radiantAI}>
      {children}
    </RadiantAIContext.Provider>
  );
}

export function useRadiantAIContext(): UseRadiantAI {
  const context = useContext(RadiantAIContext);
  if (!context) {
    throw new Error('useRadiantAIContext must be used within a RadiantAIProvider');
  }
  return context;
}

function getGameHour(): number {
  const now = new Date();
  return now.getHours();
}
