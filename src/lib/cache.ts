/**
 * Ultra-Fast High-Performance In-Memory Cache Layer
 * Provides sub-millisecond response caching for public endpoints and server components
 * with instant tag-based invalidation on write/mutations.
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  tags: string[];
}

class FastMemoryCache {
  private cache = new Map<string, CacheEntry<any>>();

  /**
   * Get an item from memory cache.
   * Returns undefined if missing or expired.
   */
  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.data as T;
  }

  /**
   * Store an item in memory cache with TTL in seconds and optional tags.
   */
  set<T>(key: string, data: T, ttlSeconds: number = 60, tags: string[] = []): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000,
      tags,
    });
  }

  /**
   * Invalidate a single key or all keys associated with one or more tags.
   */
  invalidateTag(tag: string | string[]): void {
    const targetTags = Array.isArray(tag) ? tag : [tag];
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.some(t => targetTags.includes(t))) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
  }
}

// Global singleton across hot-reloads
declare global {
  var __fastMemoryCache: FastMemoryCache | undefined;
}

const memoryCache = global.__fastMemoryCache ?? new FastMemoryCache();
if (process.env.NODE_ENV !== 'production') {
  global.__fastMemoryCache = memoryCache;
}

export default memoryCache;
