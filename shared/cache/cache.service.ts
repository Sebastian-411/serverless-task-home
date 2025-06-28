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
  
  // Ultra-performance configuration
  private maxSize = parseInt(process.env.CACHE_MAX_SIZE || '2000'); // Increased cache size
  private defaultTTL = parseInt(process.env.CACHE_DEFAULT_TTL || '180000'); // 3 minutes for faster updates
  private hotDataTTL = 60000; // 1 minute for frequently accessed data
  private warmDataTTL = 300000; // 5 minutes for less frequent data
  private coldDataTTL = 600000; // 10 minutes for rarely accessed data
  
  private stats: CacheStats = { hits: 0, misses: 0, evictions: 0, size: 0 };
  private cleanupInterval: NodeJS.Timer | null = null;

  /**
   * Singleton pattern for global cache access - O(1)
   */
  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
      CacheService.instance.startAutomaticCleanup();
    }
    return CacheService.instance;
  }

  /**
   * Start automatic cache cleanup for optimal performance
   */
  private startAutomaticCleanup(): void {
    // Clean expired entries every 30 seconds
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 30000);
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

  /**
   * Cache hot data (frequently accessed) - shorter TTL for freshness
   */
  setHot(key: string, data: any): void {
    this.set(key, data, this.hotDataTTL);
  }

  /**
   * Cache warm data (moderately accessed) - standard TTL
   */
  setWarm(key: string, data: any): void {
    this.set(key, data, this.warmDataTTL);
  }

  /**
   * Cache cold data (rarely accessed but expensive to compute) - longer TTL
   */
  setCold(key: string, data: any): void {
    this.set(key, data, this.coldDataTTL);
  }

  /**
   * Batch cache invalidation for related data
   */
  invalidateRelated(patterns: string[]): number {
    let totalInvalidated = 0;
    patterns.forEach(pattern => {
      totalInvalidated += this.invalidatePattern(pattern);
    });
    return totalInvalidated;
  }

  /**
   * High-performance batch get operation
   */
  getMany<T>(keys: string[]): Map<string, T> {
    const results = new Map<string, T>();
    keys.forEach(key => {
      const value = this.get<T>(key);
      if (value !== null) {
        results.set(key, value);
      }
    });
    return results;
  }

  /**
   * Prefetch related data to improve performance
   */
  async prefetch<T>(
    key: string,
    factory: () => Promise<T>,
    ttlMs?: number
  ): Promise<void> {
    // Only prefetch if not already cached
    if (this.get(key) === null) {
      try {
        const data = await factory();
        this.set(key, data, ttlMs);
      } catch (error) {
        // Silently fail prefetch to not break main operations
        console.warn(`Prefetch failed for key ${key}:`, error);
      }
    }
  }
}

// Export singleton instance
export const Cache = CacheService.getInstance();

// Ultra-fast cache key generators for sub-100ms queries
export const CacheKeys = {
  // User cache keys - Hot data
  user: (id: string) => `user:${id}`,
  userByEmail: (email: string) => `user:email:${email}`,
  userList: (role?: string) => `users:list${role ? `:${role}` : ''}`,
  userRole: (id: string) => `user:role:${id}`,
  userCount: (role?: string) => `users:count${role ? `:${role}` : ''}`,
  
  // Task cache keys - Critical for performance
  task: (id: string) => `task:${id}`,
  tasksList: (userId?: string, assignedTo?: string, status?: string) => 
    `tasks:list:${userId || 'all'}:${assignedTo || 'none'}:${status || 'all'}`,
  userTasks: (userId: string) => `tasks:user:${userId}`,
  assignedTasks: (userId: string) => `tasks:assigned:${userId}`,
  tasksByStatus: (status: string) => `tasks:status:${status}`,
  tasksByPriority: (priority: string) => `tasks:priority:${priority}`,
  tasksCount: (userId?: string, status?: string) => 
    `tasks:count:${userId || 'all'}:${status || 'all'}`,
  
  // Aggregated data cache keys
  dashboardData: (userId: string) => `dashboard:${userId}`,
  userStats: (userId: string) => `stats:user:${userId}`,
  systemStats: () => `stats:system`,
  
  // Authentication cache keys
  authSession: (token: string) => `auth:session:${token}`,
  authUser: (userId: string) => `auth:user:${userId}`,
  
  // Computed cache keys for expensive operations
  complexQuery: (hash: string) => `complex:${hash}`,
  aggregateData: (type: string, params: string) => `aggregate:${type}:${params}`
}; 