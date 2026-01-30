import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type UiMode = 'legacy' | 'student';

interface UiModeContextType {
  mode: UiMode;
  setMode: (mode: UiMode) => void;
  isLegacyMode: boolean;
  isStudentMode: boolean;
}

const UiModeContext = createContext<UiModeContextType | undefined>(undefined);

const STORAGE_KEY = 'academy-ui-mode';

export function UiModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<UiMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'legacy' || saved === 'student') {
        return saved as UiMode;
      }
    }
    return 'student';
  });

  const setMode = (newMode: UiMode) => {
    setModeState(newMode);
    localStorage.setItem(STORAGE_KEY, newMode);
  };

  useEffect(() => {
    document.body.classList.remove('ui-legacy', 'ui-student');
    document.body.classList.add(`ui-${mode}`);
  }, [mode]);

  return (
    <UiModeContext.Provider value={{ 
      mode, 
      setMode, 
      isLegacyMode: mode === 'legacy',
      isStudentMode: mode === 'student' 
    }}>
      {children}
    </UiModeContext.Provider>
  );
}

export function useUiMode() {
  const context = useContext(UiModeContext);
  if (!context) {
    throw new Error('useUiMode must be used within a UiModeProvider');
  }
  return context;
}
