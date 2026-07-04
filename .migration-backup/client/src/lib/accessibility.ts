export interface AccessibilityProfile {
  id: string;
  name: string;
  fontSize: number;
  highContrast: boolean;
  reducedMotion: boolean;
  screenReader: boolean;
  dyslexiaFont: boolean;
  colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  audioCues: boolean;
  lineSpacing: number;
  cursorSize: 'normal' | 'large' | 'xlarge';
}

export const ACCESSIBILITY_PROFILES: Record<string, AccessibilityProfile> = {
  default: {
    id: 'default',
    name: 'Standard',
    fontSize: 16,
    highContrast: false,
    reducedMotion: false,
    screenReader: false,
    dyslexiaFont: false,
    colorBlindMode: 'none',
    audioCues: true,
    lineSpacing: 1.5,
    cursorSize: 'normal'
  },
  lowVision: {
    id: 'lowVision',
    name: 'Low Vision',
    fontSize: 22,
    highContrast: true,
    reducedMotion: true,
    screenReader: false,
    dyslexiaFont: false,
    colorBlindMode: 'none',
    audioCues: true,
    lineSpacing: 1.8,
    cursorSize: 'xlarge'
  },
  screenReader: {
    id: 'screenReader',
    name: 'Screen Reader Optimized',
    fontSize: 18,
    highContrast: true,
    reducedMotion: true,
    screenReader: true,
    dyslexiaFont: false,
    colorBlindMode: 'none',
    audioCues: false,
    lineSpacing: 1.6,
    cursorSize: 'normal'
  },
  neurodivergent: {
    id: 'neurodivergent',
    name: 'Focus / Neurodivergent',
    fontSize: 18,
    highContrast: false,
    reducedMotion: true,
    screenReader: false,
    dyslexiaFont: false,
    colorBlindMode: 'none',
    audioCues: false,
    lineSpacing: 1.7,
    cursorSize: 'normal'
  },
  dyslexia: {
    id: 'dyslexia',
    name: 'Dyslexia-Friendly',
    fontSize: 18,
    highContrast: false,
    reducedMotion: true,
    screenReader: false,
    dyslexiaFont: true,
    colorBlindMode: 'none',
    audioCues: true,
    lineSpacing: 2.0,
    cursorSize: 'normal'
  },
  colorBlindProtanopia: {
    id: 'colorBlindProtanopia',
    name: 'Protanopia (Red-Blind)',
    fontSize: 16,
    highContrast: false,
    reducedMotion: false,
    screenReader: false,
    dyslexiaFont: false,
    colorBlindMode: 'protanopia',
    audioCues: true,
    lineSpacing: 1.5,
    cursorSize: 'normal'
  },
  colorBlindDeuteranopia: {
    id: 'colorBlindDeuteranopia',
    name: 'Deuteranopia (Green-Blind)',
    fontSize: 16,
    highContrast: false,
    reducedMotion: false,
    screenReader: false,
    dyslexiaFont: false,
    colorBlindMode: 'deuteranopia',
    audioCues: true,
    lineSpacing: 1.5,
    cursorSize: 'normal'
  }
};

export class AccessibilityManager {
  private currentProfile: AccessibilityProfile;
  private customSettings: Partial<AccessibilityProfile>;

  constructor() {
    this.currentProfile = ACCESSIBILITY_PROFILES.default;
    this.customSettings = {};
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('academy-accessibility');
      if (stored) {
        const data = JSON.parse(stored);
        if (data.profileId && ACCESSIBILITY_PROFILES[data.profileId]) {
          this.currentProfile = ACCESSIBILITY_PROFILES[data.profileId];
        }
        if (data.customSettings) {
          this.customSettings = data.customSettings;
        }
      }
    } catch (e) {
      console.warn('Failed to load accessibility settings:', e);
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem('academy-accessibility', JSON.stringify({
        profileId: this.currentProfile.id,
        customSettings: this.customSettings
      }));
    } catch (e) {
      console.warn('Failed to save accessibility settings:', e);
    }
  }

  applyProfile(profileId: string): boolean {
    const profile = ACCESSIBILITY_PROFILES[profileId];
    if (!profile) return false;
    
    this.currentProfile = profile;
    this.customSettings = {};
    this.applyToDOM();
    this.saveToStorage();
    return true;
  }

  setCustomSetting<K extends keyof AccessibilityProfile>(
    key: K, 
    value: AccessibilityProfile[K]
  ): void {
    this.customSettings[key] = value;
    this.applyToDOM();
    this.saveToStorage();
  }

  getEffectiveSettings(): AccessibilityProfile {
    return { ...this.currentProfile, ...this.customSettings };
  }

  getCurrentProfileId(): string {
    return this.currentProfile.id;
  }

  getCurrentProfile(): AccessibilityProfile {
    return this.currentProfile;
  }

  listProfiles(): AccessibilityProfile[] {
    return Object.values(ACCESSIBILITY_PROFILES);
  }

  applyToDOM(): void {
    const settings = this.getEffectiveSettings();
    const root = document.documentElement;
    const body = document.body;

    root.style.setProperty('--a11y-font-size', `${settings.fontSize}px`);
    root.style.setProperty('--a11y-line-spacing', `${settings.lineSpacing}`);

    body.classList.toggle('high-contrast', settings.highContrast);
    body.classList.toggle('reduced-motion', settings.reducedMotion);
    body.classList.toggle('dyslexia-font', settings.dyslexiaFont);
    body.classList.toggle('screen-reader-mode', settings.screenReader);
    body.classList.toggle('cursor-large', settings.cursorSize === 'large');
    body.classList.toggle('cursor-xlarge', settings.cursorSize === 'xlarge');
    
    body.classList.remove('colorblind-protanopia', 'colorblind-deuteranopia', 'colorblind-tritanopia');
    if (settings.colorBlindMode !== 'none') {
      body.classList.add(`colorblind-${settings.colorBlindMode}`);
    }
  }

  formatForTerminal(): string[] {
    const settings = this.getEffectiveSettings();
    return [
      '╔════════════════════════════════════════╗',
      '║      ACCESSIBILITY SETTINGS            ║',
      '╠════════════════════════════════════════╣',
      `║ Profile: ${settings.name.padEnd(29)}║`,
      `║ Font Size: ${settings.fontSize}px${' '.repeat(25 - settings.fontSize.toString().length)}║`,
      `║ Line Spacing: ${settings.lineSpacing}x${' '.repeat(22 - settings.lineSpacing.toString().length)}║`,
      `║ High Contrast: ${settings.highContrast ? 'ON' : 'OFF'}${' '.repeat(settings.highContrast ? 22 : 21)}║`,
      `║ Reduced Motion: ${settings.reducedMotion ? 'ON' : 'OFF'}${' '.repeat(settings.reducedMotion ? 21 : 20)}║`,
      `║ Dyslexia Font: ${settings.dyslexiaFont ? 'ON' : 'OFF'}${' '.repeat(settings.dyslexiaFont ? 22 : 21)}║`,
      `║ Screen Reader: ${settings.screenReader ? 'ON' : 'OFF'}${' '.repeat(settings.screenReader ? 22 : 21)}║`,
      `║ Color Blind Mode: ${settings.colorBlindMode.padEnd(20)}║`,
      `║ Audio Cues: ${settings.audioCues ? 'ON' : 'OFF'}${' '.repeat(settings.audioCues ? 25 : 24)}║`,
      '╚════════════════════════════════════════╝',
      '',
      'Commands:',
      '  ACCESSIBILITY <profile>  - Apply a preset profile',
      '  ACCESSIBILITY LIST       - Show available profiles',
      '  ACCESSIBILITY SET <key> <value> - Set individual option'
    ];
  }
}

export const accessibilityManager = new AccessibilityManager();
