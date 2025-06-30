export interface CacheConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  ttl?: number;
}

export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();
const defaultTTL = 3600; // 1 hour in seconds

export function initialize(_config: CacheConfig): void {
  // TODO: Initialize Redis connection
}

export async function get<T>(key: string): Promise<T | null> {
  const entry = cache.get(key);
  
  if (!entry) {
    return null;
  }

  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }

  return entry.value as T;
}

export async function set<T>(key: string, value: T, ttl: number = defaultTTL): Promise<void> {
  const expiresAt = Date.now() + (ttl * 1000);
  cache.set(key, { value, expiresAt });
}

export async function remove(key: string): Promise<void> {
  cache.delete(key);
}

export async function clear(): Promise<void> {
  cache.clear();
}

export async function exists(key: string): Promise<boolean> {
  const entry = cache.get(key);
  if (!entry) {
    return false;
  }
  
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return false;
  }
  
  return true;
}

export async function getOrSet<T>(
  key: string, 
  factory: () => Promise<T>, 
  ttl: number = defaultTTL
): Promise<T> {
  const cached = await get<T>(key);
  if (cached !== null) {
    return cached;
  }

  const value = await factory();
  await set(key, value, ttl);
  return value;
}

export async function invalidatePattern(pattern: string): Promise<void> {
  if (!pattern) {
    return; // Don't invalidate anything if pattern is empty
  }
  const keys = Array.from(cache.keys()).filter(key => key.includes(pattern));
  keys.forEach(key => cache.delete(key));
}

// Cache keys for common entities
export const Keys = {
  user: (id: string) => `user:${id}`,
  users: () => 'users:list',
  userByEmail: (email: string) => `user:email:${email}`,
  userCount: () => 'users:count',
  userStats: () => 'users:stats',
  aggregateData: (type: string, params: string) => `aggregate:${type}:${params}`
}; 