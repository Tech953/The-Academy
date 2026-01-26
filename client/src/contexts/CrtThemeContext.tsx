import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type CrtMode = 'dawn' | 'day' | 'night';

interface CrtThemeColors {
  primary: string;
  primaryDim: string;
  primaryGlow: string;
  background: string;
  scanlineOpacity: number;
}

const CRT_THEMES: Record<CrtMode, CrtThemeColors> = {
  dawn: {
    primary: '#88ffcc',
    primaryDim: '#44aa88',
    primaryGlow: 'rgba(136, 255, 204, 0.4)',
    background: '#050808',
    scanlineOpacity: 0.03,
  },
  day: {
    primary: '#00ff00',
    primaryDim: '#00aa00',
    primaryGlow: 'rgba(0, 255, 0, 0.4)',
    background: '#000000',
    scanlineOpacity: 0.05,
  },
  night: {
    primary: '#00cc88',
    primaryDim: '#008855',
    primaryGlow: 'rgba(0, 204, 136, 0.4)',
    background: '#020505',
    scanlineOpacity: 0.08,
  },
};

const CRT_MODE_LABELS: Record<CrtMode, string> = {
  dawn: 'Dawn',
  day: 'School Day',
  night: 'Night Study',
};

interface CrtThemeContextType {
  mode: CrtMode;
  setMode: (mode: CrtMode) => void;
  colors: CrtThemeColors;
  modeLabel: string;
  accentColors: {
    green: string;
    cyan: string;
    amber: string;
    purple: string;
    pink: string;
    red: string;
  };
}

const CrtThemeContext = createContext<CrtThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'academy-crt-mode';

export function CrtThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<CrtMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && (saved === 'dawn' || saved === 'day' || saved === 'night')) {
        return saved as CrtMode;
      }
    }
    return 'day';
  });

  const setMode = (newMode: CrtMode) => {
    setModeState(newMode);
    localStorage.setItem(STORAGE_KEY, newMode);
  };

  const colors = CRT_THEMES[mode];
  const modeLabel = CRT_MODE_LABELS[mode];

  const accentColors = {
    green: colors.primary,
    cyan: mode === 'dawn' ? '#66ffff' : mode === 'night' ? '#00aaaa' : '#00ffff',
    amber: mode === 'dawn' ? '#ffcc66' : mode === 'night' ? '#cc8800' : '#ffaa00',
    purple: mode === 'dawn' ? '#dd99ff' : mode === 'night' ? '#9944cc' : '#cc66ff',
    pink: mode === 'dawn' ? '#ffaacc' : mode === 'night' ? '#cc4488' : '#ff66cc',
    red: mode === 'dawn' ? '#ff8899' : mode === 'night' ? '#cc2244' : '#ff3366',
  };

  useEffect(() => {
    document.documentElement.style.setProperty('--crt-primary', colors.primary);
    document.documentElement.style.setProperty('--crt-primary-dim', colors.primaryDim);
    document.documentElement.style.setProperty('--crt-primary-glow', colors.primaryGlow);
    document.documentElement.style.setProperty('--crt-background', colors.background);
    document.documentElement.style.setProperty('--crt-scanline-opacity', String(colors.scanlineOpacity));
  }, [colors]);

  return (
    <CrtThemeContext.Provider value={{ mode, setMode, colors, modeLabel, accentColors }}>
      {children}
    </CrtThemeContext.Provider>
  );
}

export function useCrtTheme() {
  const context = useContext(CrtThemeContext);
  if (!context) {
    throw new Error('useCrtTheme must be used within a CrtThemeProvider');
  }
  return context;
}

export { CRT_THEMES, CRT_MODE_LABELS };
