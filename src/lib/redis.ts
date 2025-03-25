"use server";
import Redis from 'ioredis';

// Initialize Redis client with connection details from environment variables
const getRedisClient = () => {
  // Default configuration (local development)
  const config = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    username: process.env.REDIS_USERNAME || '',
    password: process.env.REDIS_PASSWORD || '',
    db: parseInt(process.env.REDIS_DB || '0'),
    enableReadyCheck: true,
    maxRetriesPerRequest: 3,
    connectTimeout: 10000,
    disconnectTimeout: 2000,
    retryStrategy: (times: number) => {
      // Exponential backoff with max 10-second delay
      return Math.min(times * 100, 10000);
    }
  };

  // If REDIS_URL is provided, use that instead
  if (process.env.REDIS_URL) {
    return new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      connectTimeout: 10000,
      disconnectTimeout: 2000
    });
  }

  return new Redis(config);
};

let redisClient: Redis | null = null;
let isRedisReady = false;
let connectionAttemptInProgress = false;

export async function getRedis(): Promise<Redis> {
  if (redisClient && isRedisReady) {
    return redisClient;
  }
  
  // If we're already attempting to connect, wait for that to finish
  if (connectionAttemptInProgress) {
    await new Promise<void>(resolve => {
      const checkInterval = setInterval(() => {
        if (!connectionAttemptInProgress) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    });
    return redisClient!;
  }

  // If we need to create a new client
  if (!redisClient) {
    connectionAttemptInProgress = true;
    try {
      redisClient = getRedisClient();
      
      // Handle connection events
      redisClient.on('error', (err: Error) => {
        console.error('Redis connection error:', err);
        isRedisReady = false;
      });
      
      redisClient.on('connect', () => {
        console.info('Redis connected successfully');
      });
      
      redisClient.on('ready', () => {
        isRedisReady = true;
        connectionAttemptInProgress = false;
        console.info('Redis is ready to accept commands');
      });
      
      redisClient.on('reconnecting', () => {
        console.info('Redis reconnecting...');
        isRedisReady = false;
      });
      
      redisClient.on('end', () => {
        console.info('Redis connection closed');
        isRedisReady = false;
        redisClient = null; 
      });
      
      // Wait for ready event before returning
      if (!isRedisReady) {
        await new Promise<void>((resolve) => {
          if (redisClient!.status === 'ready') {
            isRedisReady = true;
            connectionAttemptInProgress = false;
            resolve();
          } else {
            redisClient!.once('ready', () => {
              isRedisReady = true;
              connectionAttemptInProgress = false;
              resolve();
            });
            
            // Add timeout to prevent hanging if connection fails
            setTimeout(() => {
              if (connectionAttemptInProgress) {
                connectionAttemptInProgress = false;
                console.error('Redis connection timeout');
                resolve(); // Resolve anyway to prevent hanging
              }
            }, 15000); // 15 second timeout
          }
        });
      }
    } catch (err) {
      connectionAttemptInProgress = false;
      console.error('Error creating Redis client:', err);
      throw err;
    }
  }
  
  return redisClient;
}


export async function closeRedisConnection() {
  if (redisClient) {
    try {
      await redisClient.quit();
    } catch (err) {
      console.error('Error closing Redis connection:', err);
      redisClient.disconnect();
    } finally {
      redisClient = null;
      isRedisReady = false;
      connectionAttemptInProgress = false;
    }
  }
} 