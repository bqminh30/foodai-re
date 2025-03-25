import { getRedis } from '@/lib/redis';
import { MD5 } from 'crypto-js';

// Namespace prefix for different cache types
export const NAMESPACE = {
  WEATHER: 'w:',
  FOOD_RECOMMENDATIONS: 'fr:',
  FOOD_DETAILS: 'fd:',
  GEOLOCATION: 'geo:',
};

/**
 * Generates a short cache key using MD5 hash
 * @param namespace - Type of data being cached
 * @param keyParts - Key components to hash
 * @returns A shortened, namespaced cache key
 */
export function generateCacheKey(namespace: string, keyParts: (string | number | boolean | null | undefined)[]): string {
  // Filter out undefined and null values
  const validParts = keyParts.filter(part => part !== null && part !== undefined);
  
  // If no valid parts, return a default key
  if (validParts.length === 0) {
    return `${namespace}default`;
  }
  
  // Convert all parts to strings and join them
  const joinedKey = validParts.map(part => String(part)).join(':');
  
  // Generate MD5 hash of the joined key
  const hash = MD5(joinedKey).toString();
  
  // Return namespace + hash
  return `${namespace}${hash}`;
}

/**
 * Sets a value in the cache with optional expiration
 * @param key - Cache key
 * @param value - Value to cache (will be JSON stringified)
 * @param expirySeconds - TTL in seconds (optional)
 */
export async function setCache<T>(key: string, value: T, expirySeconds?: number): Promise<void> {
  try {
    const redis = await getRedis();
    const serialized = JSON.stringify(value);
    
    if (expirySeconds) {
      await redis.set(key, serialized, 'EX', expirySeconds);
    } else {
      await redis.set(key, serialized);
    }
  } catch (error) {
    console.error(`Cache set error for key ${key}:`, error);
  }
}

/**
 * Gets a value from the cache
 * @param key - Cache key
 * @returns Cached value or null if not found
 */
export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const redis = await getRedis();
    const data = await redis.get(key);
    
    if (!data) {
      return null;
    }
    
    return JSON.parse(data) as T;
  } catch (error) {
    console.error(`Cache get error for key ${key}:`, error);
    return null;
  }
}

/**
 * Removes a value from the cache
 * @param key - Cache key
 */
export async function deleteCache(key: string): Promise<void> {
  try {
    const redis = await getRedis();
    await redis.del(key);
  } catch (error) {
    console.error(`Cache delete error for key ${key}:`, error);
  }
}

/**
 * Invalidates all keys in a specific namespace
 * @param namespace - Namespace prefix to clear
 */
export async function invalidateNamespace(namespace: string): Promise<void> {
  try {
    const redis = await getRedis();
    const keys = await redis.keys(`${namespace}*`);
    
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error(`Error invalidating namespace ${namespace}:`, error);
  }
}

/**
 * Wrapper function to get cached data or fetch it if not available
 * @param key - Cache key
 * @param fetchFn - Function to call if cache miss
 * @param expirySeconds - TTL in seconds
 */
export async function getCachedOrFetch<T>(
  key: string, 
  fetchFn: () => Promise<T>, 
  expirySeconds: number = 3600
): Promise<T> {
  // Try to get from cache first
  const cached = await getCache<T>(key);
  
  // If found in cache, return it
  if (cached !== null) {
    return cached;
  }
  
  // Otherwise, fetch fresh data
  const data = await fetchFn();
  
  // Store in cache for next time
  await setCache(key, data, expirySeconds);
  
  return data;
} 