/**
 * High-Performance In-Memory Cache Service for Serverless
 * - O(1) get/set operations using Map
 * - TTL (Time To Live) support
 * - LRU eviction for memory management
 * - Optimized for frequently accessed data
 */

interface CacheEntry {
  data: any;
  expiresAt: number;
  accessCount: number;
  lastAccessed: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
}

export class CacheService {
  private static instance: CacheService;
  private cache = new Map<string, CacheEntry>();
  private maxSize = parseInt(process.env.CACHE_MAX_SIZE || '1000'); // Configurable max cache entries
  private defaultTTL = parseInt(process.env.CACHE_DEFAULT_TTL || '300000'); // Configurable 5 minutes default TTL
  private stats: CacheStats = { hits: 0, misses: 0, evictions: 0, size: 0 };

  /**
   * Singleton pattern for global cache access - O(1)
   */
  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  /**
   * Ultra-fast cache get - O(1)
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      this.stats.size--;
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.stats.hits++;
    
    return entry.data as T;
  }

  /**
   * High-performance cache set - O(1) amortized
   */
  set(key: string, data: any, ttlMs?: number): void {
    const ttl = ttlMs || this.defaultTTL;
    const entry: CacheEntry = {
      data,
      expiresAt: Date.now() + ttl,
      accessCount: 0,
      lastAccessed: Date.now()
    };

    // Evict if cache is full
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLeastRecentlyUsed();
    }

    this.cache.set(key, entry);
    if (!this.cache.has(key)) {
      this.stats.size++;
    }
  }

  /**
   * Fast cache deletion - O(1)
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.size--;
    }
    return deleted;
  }

  /**
   * Pattern-based cache invalidation - O(n) where n = cache size
   */
  invalidatePattern(pattern: string): number {
    const regex = new RegExp(pattern);
    let invalidated = 0;
    
    for (const [key] of this.cache) {
      if (regex.test(key)) {
        this.cache.delete(key);
        invalidated++;
        this.stats.size--;
      }
    }
    
    return invalidated;
  }

  /**
   * LRU eviction strategy - O(n) but only when cache is full
   */
  private evictLeastRecentlyUsed(): void {
    let oldestKey = '';
    let oldestTime = Date.now();
    
    for (const [key, entry] of this.cache) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.stats.evictions++;
      this.stats.size--;
    }
  }

  /**
   * Cache cleanup - Remove expired entries - O(n)
   */
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, entry] of this.cache) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        cleaned++;
        this.stats.size--;
      }
    }
    
    return cleaned;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0, evictions: 0, size: 0 };
  }

  /**
   * Get or set pattern for common cache operations
   */
  async getOrSet<T>(
    key: string, 
    factory: () => Promise<T>, 
    ttlMs?: number
  ): Promise<T> {
    // Try to get from cache first
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Generate data and cache it
    const data = await factory();
    this.set(key, data, ttlMs);
    return data;
  }
}

// Export singleton instance
export const Cache = CacheService.getInstance();

// Cache key generators for consistent naming
export const CacheKeys = {
  user: (id: string) => `user:${id}`,
  userByEmail: (email: string) => `user:email:${email}`,
  userList: (role?: string) => `users:list${role ? `:${role}` : ''}`,
  userRole: (id: string) => `user:role:${id}`,
  userCount: (role?: string) => `users:count${role ? `:${role}` : ''}`
}; 