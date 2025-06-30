import {
  initialize,
  get,
  set,
  remove,
  clear,
  exists,
  getOrSet,
  invalidatePattern,
  Keys
} from '../../../../../../core/common/config/cache/cache.service';

describe('Cache Service', () => {
  beforeEach(() => {
    // Clear cache before each test
    clear();
  });

  describe('initialize', () => {
    it('should initialize cache with config', () => {
      // Arrange
      const config = {
        host: 'localhost',
        port: 6379,
        password: 'password',
        db: 0,
        ttl: 3600
      };

      // Act
      expect(() => initialize(config)).not.toThrow();
    });
  });

  describe('set and get', () => {
    it('should set and get string value', async () => {
      // Arrange
      const key = 'test-key';
      const value = 'test-value';

      // Act
      await set(key, value);
      const result = await get<string>(key);

      // Assert
      expect(result).toBe(value);
    });

    it('should set and get object value', async () => {
      // Arrange
      const key = 'test-object';
      const value = { name: 'test', age: 25 };

      // Act
      await set(key, value);
      const result = await get<typeof value>(key);

      // Assert
      expect(result).toEqual(value);
    });

    it('should set and get array value', async () => {
      // Arrange
      const key = 'test-array';
      const value = [1, 2, 3, 'test'];

      // Act
      await set(key, value);
      const result = await get<typeof value>(key);

      // Assert
      expect(result).toEqual(value);
    });

    it('should return null for non-existent key', async () => {
      // Act
      const result = await get<string>('non-existent');

      // Assert
      expect(result).toBeNull();
    });

    it('should use custom TTL', async () => {
      // Arrange
      const key = 'test-ttl';
      const value = 'test-value';
      const customTTL = 1; // 1 second

      // Act
      await set(key, value, customTTL);

      // Assert - should exist immediately
      expect(await get(key)).toBe(value);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Assert - should be expired
      expect(await get(key)).toBeNull();
    });
  });

  describe('remove', () => {
    it('should remove existing key', async () => {
      // Arrange
      const key = 'test-remove';
      await set(key, 'value');

      // Act
      await remove(key);

      // Assert
      expect(await get(key)).toBeNull();
    });

    it('should not throw when removing non-existent key', async () => {
      // Act & Assert
      expect(async () => await remove('non-existent')).not.toThrow();
    });
  });

  describe('clear', () => {
    it('should clear all cache entries', async () => {
      // Arrange
      await set('key1', 'value1');
      await set('key2', 'value2');

      // Act
      await clear();

      // Assert
      expect(await get('key1')).toBeNull();
      expect(await get('key2')).toBeNull();
    });
  });

  describe('exists', () => {
    it('should return true for existing key', async () => {
      // Arrange
      const key = 'test-exists';
      await set(key, 'value');

      // Act
      const result = await exists(key);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for non-existent key', async () => {
      // Act
      const result = await exists('non-existent');

      // Assert
      expect(result).toBe(false);
    });

    it('should return false for expired key', async () => {
      // Arrange
      const key = 'test-expired';
      await set(key, 'value', 0.1); // 100ms TTL

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));

      // Act
      const result = await exists(key);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('getOrSet', () => {
    it('should return cached value when exists', async () => {
      // Arrange
      const key = 'test-get-or-set';
      const cachedValue = 'cached-value';
      await set(key, cachedValue);

      let factoryCalled = false;
      const factory = jest.fn().mockImplementation(() => {
        factoryCalled = true;
        return Promise.resolve('new-value');
      });

      // Act
      const result = await getOrSet(key, factory);

      // Assert
      expect(result).toBe(cachedValue);
      expect(factoryCalled).toBe(false);
    });

    it('should call factory and cache result when not exists', async () => {
      // Arrange
      const key = 'test-get-or-set-new';
      const newValue = 'new-value';
      const factory = jest.fn().mockResolvedValue(newValue);

      // Act
      const result = await getOrSet(key, factory);

      // Assert
      expect(result).toBe(newValue);
      expect(factory).toHaveBeenCalledTimes(1);
      expect(await get(key)).toBe(newValue);
    });

    it('should use custom TTL for new entries', async () => {
      // Arrange
      const key = 'test-get-or-set-ttl';
      const customTTL = 0.1; // 100ms
      const factory = jest.fn().mockResolvedValue('value');

      // Act
      await getOrSet(key, factory, customTTL);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));

      // Assert
      expect(await get(key)).toBeNull();
    });

    it('should handle factory errors', async () => {
      // Arrange
      const key = 'test-get-or-set-error';
      const factory = jest.fn().mockRejectedValue(new Error('Factory error'));

      // Act & Assert
      await expect(getOrSet(key, factory)).rejects.toThrow('Factory error');
    });
  });

  describe('invalidatePattern', () => {
    it('should remove keys matching pattern', async () => {
      // Arrange
      await set('user:123', 'value1');
      await set('user:456', 'value2');
      await set('post:123', 'value3');
      await set('comment:123', 'value4');

      // Act
      await invalidatePattern('user:');

      // Assert
      expect(await get('user:123')).toBeNull();
      expect(await get('user:456')).toBeNull();
      expect(await get('post:123')).toBe('value3');
      expect(await get('comment:123')).toBe('value4');
    });

    it('should handle non-matching patterns', async () => {
      // Arrange
      await set('user:123', 'value1');

      // Act
      await invalidatePattern('nonexistent:');

      // Assert
      expect(await get('user:123')).toBe('value1');
    });

    it('should handle empty pattern', async () => {
      // Arrange
      await set('user:123', 'value1');

      // Act
      await invalidatePattern('');

      // Assert
      expect(await get('user:123')).toBe('value1');
    });
  });

  describe('Keys utility', () => {
    it('should generate user key', () => {
      // Act
      const key = Keys.user('123');

      // Assert
      expect(key).toBe('user:123');
    });

    it('should generate users list key', () => {
      // Act
      const key = Keys.users();

      // Assert
      expect(key).toBe('users:list');
    });

    it('should generate user by email key', () => {
      // Act
      const key = Keys.userByEmail('test@example.com');

      // Assert
      expect(key).toBe('user:email:test@example.com');
    });

    it('should generate user count key', () => {
      // Act
      const key = Keys.userCount();

      // Assert
      expect(key).toBe('users:count');
    });

    it('should generate user stats key', () => {
      // Act
      const key = Keys.userStats();

      // Assert
      expect(key).toBe('users:stats');
    });

    it('should generate aggregate data key', () => {
      // Act
      const key = Keys.aggregateData('users', 'by-role');

      // Assert
      expect(key).toBe('aggregate:users:by-role');
    });
  });

  describe('edge cases', () => {
    it('should handle null values', async () => {
      // Arrange
      const key = 'test-null';
      const value = null;

      // Act
      await set(key, value);
      const result = await get(key);

      // Assert
      expect(result).toBeNull();
    });

    it('should handle undefined values', async () => {
      // Arrange
      const key = 'test-undefined';
      const value = undefined;

      // Act
      await set(key, value);
      const result = await get(key);

      // Assert
      expect(result).toBeUndefined();
    });

    it('should handle complex nested objects', async () => {
      // Arrange
      const key = 'test-complex';
      const value = {
        user: {
          id: '123',
          profile: {
            name: 'Test',
            preferences: {
              theme: 'dark',
              notifications: true
            }
          }
        }
      };

      // Act
      await set(key, value);
      const result = await get(key);

      // Assert
      expect(result).toEqual(value);
    });

    it('should handle arrays with objects', async () => {
      // Arrange
      const key = 'test-array-objects';
      const value = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' }
      ];

      // Act
      await set(key, value);
      const result = await get(key);

      // Assert
      expect(result).toEqual(value);
    });

    it('should handle concurrent access', async () => {
      // Arrange
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(set(`key${i}`, `value${i}`));
      }

      // Act
      await Promise.all(promises);

      // Assert
      for (let i = 0; i < 10; i++) {
        expect(await get(`key${i}`)).toBe(`value${i}`);
      }
    });

    it('should handle concurrent reads', async () => {
      // Arrange
      const key = 'test-concurrent-reads';
      const value = 'test-value';
      await set(key, value);

      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(get(key));
      }

      // Act
      const results = await Promise.all(promises);

      // Assert
      results.forEach(result => {
        expect(result).toBe(value);
      });
    });
  });
}); 