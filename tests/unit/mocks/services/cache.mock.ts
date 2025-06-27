/**
 * Mock for Cache Service
 * Provides comprehensive mocking for all cache operations
 */

// In-memory store for testing
const mockCacheStore = new Map<string, { value: any; expiry?: number }>();

export const createMockCacheService = () => {
  const mockCache = {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    clear: jest.fn(),
    getOrSet: jest.fn(),
    invalidatePattern: jest.fn(),
    exists: jest.fn(),
    ttl: jest.fn(),
    keys: jest.fn()
  };

  // Implement realistic cache behavior
  mockCache.get.mockImplementation((key: string) => {
    const item = mockCacheStore.get(key);
    if (!item) return null;
    
    if (item.expiry && item.expiry < Date.now()) {
      mockCacheStore.delete(key);
      return null;
    }
    
    return item.value;
  });

  mockCache.set.mockImplementation((key: string, value: any, ttl?: number) => {
    const expiry = ttl ? Date.now() + ttl : undefined;
    mockCacheStore.set(key, { value, expiry });
    return true;
  });

  mockCache.delete.mockImplementation((key: string) => {
    return mockCacheStore.delete(key);
  });

  mockCache.clear.mockImplementation(() => {
    mockCacheStore.clear();
    return true;
  });

  mockCache.getOrSet.mockImplementation(async (key: string, factory: () => Promise<any>, ttl?: number) => {
    let value = mockCache.get(key);
    
    if (value === null) {
      value = await factory();
      mockCache.set(key, value, ttl);
    }
    
    return value;
  });

  mockCache.invalidatePattern.mockImplementation((pattern: string) => {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    const keysToDelete = Array.from(mockCacheStore.keys()).filter(key => regex.test(key));
    
    keysToDelete.forEach(key => mockCacheStore.delete(key));
    return keysToDelete.length;
  });

  mockCache.exists.mockImplementation((key: string) => {
    const item = mockCacheStore.get(key);
    if (!item) return false;
    
    if (item.expiry && item.expiry < Date.now()) {
      mockCacheStore.delete(key);
      return false;
    }
    
    return true;
  });

  mockCache.ttl.mockImplementation((key: string) => {
    const item = mockCacheStore.get(key);
    if (!item || !item.expiry) return -1;
    
    const remaining = item.expiry - Date.now();
    return remaining > 0 ? remaining : -1;
  });

  mockCache.keys.mockImplementation((pattern?: string) => {
    const allKeys = Array.from(mockCacheStore.keys());
    
    if (!pattern) return allKeys;
    
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return allKeys.filter(key => regex.test(key));
  });

  return mockCache;
};

export const mockCacheService = createMockCacheService();

// Mock CacheKeys utility
export const mockCacheKeys = {
  user: (id: string) => `user:${id}`,
  userByEmail: (email: string) => `user:email:${email}`,
  userList: (page = 1, limit = 10) => `users:list:${page}:${limit}`,
  task: (id: string) => `task:${id}`,
  tasksByUser: (userId: string) => `tasks:user:${userId}`,
  taskList: (filters?: any) => `tasks:list:${JSON.stringify(filters || {})}`
};

// Mock the actual Cache module
jest.mock('../../../shared/cache/cache.service', () => ({
  Cache: mockCacheService,
  CacheKeys: mockCacheKeys
})); 