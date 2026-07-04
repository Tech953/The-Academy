export type PerformanceTier = 'low' | 'mid' | 'high';

export interface PerformanceSettings {
  tier: PerformanceTier;
  animations: boolean;
  scanlines: boolean;
  glowEffects: boolean;
  audioEnabled: boolean;
  particleEffects: boolean;
  smoothScrolling: boolean;
  windowShadows: boolean;
  ambientObjects: boolean;
}

const TIER_SETTINGS: Record<PerformanceTier, PerformanceSettings> = {
  low: {
    tier: 'low',
    animations: false,
    scanlines: false,
    glowEffects: false,
    audioEnabled: false,
    particleEffects: false,
    smoothScrolling: false,
    windowShadows: false,
    ambientObjects: false
  },
  mid: {
    tier: 'mid',
    animations: true,
    scanlines: true,
    glowEffects: false,
    audioEnabled: true,
    particleEffects: false,
    smoothScrolling: true,
    windowShadows: true,
    ambientObjects: true
  },
  high: {
    tier: 'high',
    animations: true,
    scanlines: true,
    glowEffects: true,
    audioEnabled: true,
    particleEffects: true,
    smoothScrolling: true,
    windowShadows: true,
    ambientObjects: true
  }
};

interface PerformanceMetrics {
  fps: number;
  memory: number;
  hardwareConcurrency: number;
  devicePixelRatio: number;
  connectionType?: string;
}

class PerformanceTierManager {
  private currentTier: PerformanceTier;
  private manualOverride: PerformanceTier | null = null;
  private metrics: PerformanceMetrics;
  private listeners: Set<(settings: PerformanceSettings) => void> = new Set();
  private fpsHistory: number[] = [];
  private monitoringInterval: number | null = null;

  constructor() {
    this.metrics = this.detectHardwareCapabilities();
    this.currentTier = this.calculateTier();
    this.loadSavedPreference();
  }

  private detectHardwareCapabilities(): PerformanceMetrics {
    const metrics: PerformanceMetrics = {
      fps: 60,
      memory: 4096,
      hardwareConcurrency: navigator.hardwareConcurrency || 2,
      devicePixelRatio: window.devicePixelRatio || 1
    };

    if ('deviceMemory' in navigator) {
      metrics.memory = (navigator as any).deviceMemory * 1024;
    }

    if ('connection' in navigator) {
      const conn = (navigator as any).connection;
      if (conn) {
        metrics.connectionType = conn.effectiveType;
      }
    }

    return metrics;
  }

  private calculateTier(): PerformanceTier {
    const { hardwareConcurrency, memory, devicePixelRatio } = this.metrics;

    let score = 0;

    if (hardwareConcurrency >= 8) score += 3;
    else if (hardwareConcurrency >= 4) score += 2;
    else score += 1;

    if (memory >= 8192) score += 3;
    else if (memory >= 4096) score += 2;
    else score += 1;

    if (devicePixelRatio <= 1) score += 1;
    else if (devicePixelRatio <= 2) score += 2;
    else score += 1;

    if (this.fpsHistory.length > 0) {
      const avgFps = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
      if (avgFps >= 55) score += 2;
      else if (avgFps >= 30) score += 1;
      else score -= 1;
    }

    if (score >= 8) return 'high';
    if (score >= 5) return 'mid';
    return 'low';
  }

  private loadSavedPreference(): void {
    const saved = localStorage.getItem('academy-performance-tier');
    if (saved && ['low', 'mid', 'high'].includes(saved)) {
      this.manualOverride = saved as PerformanceTier;
    }
  }

  getTier(): PerformanceTier {
    return this.manualOverride || this.currentTier;
  }

  getSettings(): PerformanceSettings {
    return TIER_SETTINGS[this.getTier()];
  }

  setTier(tier: PerformanceTier | 'auto'): void {
    if (tier === 'auto') {
      this.manualOverride = null;
      localStorage.removeItem('academy-performance-tier');
    } else {
      this.manualOverride = tier;
      localStorage.setItem('academy-performance-tier', tier);
    }
    this.notifyListeners();
  }

  getAutoDetectedTier(): PerformanceTier {
    return this.currentTier;
  }

  isManualOverride(): boolean {
    return this.manualOverride !== null;
  }

  startMonitoring(): void {
    if (this.monitoringInterval) return;

    let lastTime = performance.now();
    let frameCount = 0;

    const measureFps = () => {
      frameCount++;
      const now = performance.now();
      
      if (now - lastTime >= 1000) {
        const fps = frameCount;
        this.fpsHistory.push(fps);
        
        if (this.fpsHistory.length > 10) {
          this.fpsHistory.shift();
        }
        
        const avgFps = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
        
        if (!this.manualOverride) {
          const newTier = this.calculateTier();
          if (newTier !== this.currentTier) {
            this.currentTier = newTier;
            this.notifyListeners();
            console.log(`[PERF] Auto-adjusted to ${newTier} tier (avg FPS: ${avgFps.toFixed(1)})`);
          }
        }
        
        frameCount = 0;
        lastTime = now;
      }
      
      requestAnimationFrame(measureFps);
    };

    requestAnimationFrame(measureFps);
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  subscribe(callback: (settings: PerformanceSettings) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(): void {
    const settings = this.getSettings();
    this.listeners.forEach(cb => cb(settings));
    
    window.dispatchEvent(new CustomEvent('performance-tier-change', {
      detail: settings
    }));
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  getTierInfo(): { tier: PerformanceTier; auto: PerformanceTier; isOverride: boolean; metrics: PerformanceMetrics } {
    return {
      tier: this.getTier(),
      auto: this.currentTier,
      isOverride: this.manualOverride !== null,
      metrics: this.getMetrics()
    };
  }
}

export const performanceManager = new PerformanceTierManager();

export function getPerformanceClass(): string {
  const tier = performanceManager.getTier();
  return `perf-tier-${tier}`;
}

export function shouldEnableFeature(feature: keyof Omit<PerformanceSettings, 'tier'>): boolean {
  return performanceManager.getSettings()[feature];
}
