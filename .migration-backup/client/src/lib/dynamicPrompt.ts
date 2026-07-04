import { virtualFS } from './virtualFilesystem';

export type ResonanceState = 'stable' | 'elevated' | 'alert' | 'critical';

export interface PromptConfig {
  username: string;
  hostname: string;
  resonanceState: ResonanceState;
  showPath: boolean;
}

const RESONANCE_COLORS: Record<ResonanceState, string> = {
  stable: '#00ff66',
  elevated: '#ffff00',
  alert: '#ff8800',
  critical: '#ff0044',
};

const RESONANCE_LABELS: Record<ResonanceState, string> = {
  stable: 'STABLE',
  elevated: 'ELEVATED',
  alert: 'ALERT',
  critical: 'CRITICAL',
};

const RESONANCE_GLITCHES: Record<ResonanceState, string[]> = {
  stable: [],
  elevated: ['~', '`'],
  alert: ['!', '?', '#'],
  critical: ['!', '!', '?', '@', '#', '$', '%', '^', '&', '*'],
};

export function getPromptColor(state: ResonanceState): string {
  return RESONANCE_COLORS[state];
}

export function getResonanceLabel(state: ResonanceState): string {
  return RESONANCE_LABELS[state];
}

export function applyGlitchEffect(text: string, state: ResonanceState): string {
  if (state === 'stable') return text;
  
  const glitchChars = RESONANCE_GLITCHES[state];
  if (glitchChars.length === 0) return text;
  
  const glitchProbability = state === 'critical' ? 0.15 : state === 'alert' ? 0.08 : 0.03;
  
  return text.split('').map(char => {
    if (Math.random() < glitchProbability && char !== ' ') {
      return glitchChars[Math.floor(Math.random() * glitchChars.length)];
    }
    return char;
  }).join('');
}

export function buildPrompt(config: PromptConfig): { text: string; color: string; resonanceColor: string } {
  const { username, hostname, resonanceState, showPath } = config;
  
  const path = showPath ? virtualFS.getPromptPath() : '';
  const resonanceLabel = getResonanceLabel(resonanceState);
  const color = getPromptColor(resonanceState);
  
  let promptText: string;
  
  if (resonanceState === 'critical') {
    promptText = `[RES: ${resonanceLabel}] ${username}@${hostname}:${path}$ `;
  } else if (resonanceState === 'alert') {
    promptText = `[RES: ${resonanceLabel}] ${username}@${hostname}:${path}$ `;
  } else if (resonanceState === 'elevated') {
    promptText = `[${resonanceLabel}] ${username}@${hostname}:${path}$ `;
  } else {
    promptText = `${username}@${hostname}:${path}$ `;
  }
  
  if (resonanceState !== 'stable') {
    promptText = applyGlitchEffect(promptText, resonanceState);
  }
  
  return {
    text: promptText,
    color,
    resonanceColor: color,
  };
}

export function getDefaultPromptConfig(): PromptConfig {
  return {
    username: 'student',
    hostname: 'academy',
    resonanceState: 'stable',
    showPath: true,
  };
}

export class PromptManager {
  private config: PromptConfig;
  private listeners: Set<(prompt: ReturnType<typeof buildPrompt>) => void> = new Set();

  constructor() {
    this.config = getDefaultPromptConfig();
  }

  setResonanceState(state: ResonanceState): void {
    this.config.resonanceState = state;
    this.notifyListeners();
  }

  getResonanceState(): ResonanceState {
    return this.config.resonanceState;
  }

  setUsername(username: string): void {
    this.config.username = username;
    this.notifyListeners();
  }

  setShowPath(show: boolean): void {
    this.config.showPath = show;
    this.notifyListeners();
  }

  getPrompt(): ReturnType<typeof buildPrompt> {
    return buildPrompt(this.config);
  }

  subscribe(callback: (prompt: ReturnType<typeof buildPrompt>) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(): void {
    const prompt = this.getPrompt();
    this.listeners.forEach(cb => cb(prompt));
  }

  refreshPath(): void {
    this.notifyListeners();
  }
}

export const promptManager = new PromptManager();
