/**
 * Generic TTL-based in-memory cache.
 */
interface CacheItem<T> {
  data: T;
  expiry: number;
}

export class MemoryCache<T> {
  private cache: Map<string, CacheItem<T>> = new Map();

  /**
   * Get item from cache if it exists and hasn't expired.
   */
  get(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  /**
   * Set item in cache with TTL in seconds.
   */
  set(key: string, data: T, ttlSeconds: number): void {
    const expiry = Date.now() + (ttlSeconds * 1000);
    this.cache.set(key, { data, expiry });
  }

  /**
   * Delete specific key.
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all expired items.
   */
  clearExpired(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear everything.
   */
  clear(): void {
    this.cache.clear();
  }
}

// Export a singleton instance for common use or allow instantiation
export const sharedCache = new MemoryCache<any>();
