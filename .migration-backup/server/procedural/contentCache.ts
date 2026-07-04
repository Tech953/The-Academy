/**
 * Content Cache for Procedural Generation
 * Memoizes expensive procedural content to reduce memory usage and improve performance
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  accessCount: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
}

class ContentCache {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private maxEntries: number;
  private maxAgeMs: number;
  private stats: CacheStats = { hits: 0, misses: 0, evictions: 0 };

  constructor(maxEntries: number = 100, maxAgeMs: number = 30 * 60 * 1000) {
    this.maxEntries = maxEntries;
    this.maxAgeMs = maxAgeMs;
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    if (Date.now() - entry.timestamp > this.maxAgeMs) {
      this.cache.delete(key);
      this.stats.evictions++;
      this.stats.misses++;
      return null;
    }

    entry.accessCount++;
    this.stats.hits++;
    return entry.data as T;
  }

  set<T>(key: string, data: T): void {
    if (this.cache.size >= this.maxEntries) {
      this.evictLeastUsed();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      accessCount: 1
    });
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (Date.now() - entry.timestamp > this.maxAgeMs) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0, evictions: 0 };
  }

  private evictLeastUsed(): void {
    let leastUsedKey: string | null = null;
    let leastAccessCount = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.accessCount < leastAccessCount) {
        leastAccessCount = entry.accessCount;
        leastUsedKey = key;
      }
    }

    if (leastUsedKey) {
      this.cache.delete(leastUsedKey);
      this.stats.evictions++;
    }
  }

  getStats(): CacheStats & { size: number; maxSize: number } {
    return {
      ...this.stats,
      size: this.cache.size,
      maxSize: this.maxEntries
    };
  }

  getOrCreate<T>(key: string, factory: () => T): T {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const data = factory();
    this.set(key, data);
    return data;
  }
}

export const textbookCache = new ContentCache(50, 60 * 60 * 1000);
export const lectureCache = new ContentCache(100, 60 * 60 * 1000);
export const locationCache = new ContentCache(200, 30 * 60 * 1000);
export const npcCache = new ContentCache(150, 30 * 60 * 1000);

export function memoize<T extends (...args: unknown[]) => unknown>(
  fn: T,
  cache: ContentCache,
  keyGenerator?: (...args: Parameters<T>) => string
): T {
  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = keyGenerator 
      ? keyGenerator(...args) 
      : JSON.stringify(args);
    
    return cache.getOrCreate(key, () => fn(...args)) as ReturnType<T>;
  }) as T;
}

export function getCacheStats() {
  return {
    textbooks: textbookCache.getStats(),
    lectures: lectureCache.getStats(),
    locations: locationCache.getStats(),
    npcs: npcCache.getStats()
  };
}

export function clearAllCaches() {
  textbookCache.clear();
  lectureCache.clear();
  locationCache.clear();
  npcCache.clear();
}
