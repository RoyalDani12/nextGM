import { Redis } from 'ioredis'
import { env } from '../../config/env.js'

let lastErrorLoggedAt = 0;

const retryStrategy = (times: number) => {
    const now = Date.now();
    if (now - lastErrorLoggedAt > 20000) {
      lastErrorLoggedAt = now;
      console.warn(`[Redis Notice] Cannot connect to Redis at ${env.REDIS_URL}. Retrying in background... (Start Redis locally to enable queues & caching)`);
    }
    return Math.min(times * 1000, 5000);
};

// API/cache commands must fail quickly when Redis is unavailable.
export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 1,
  connectTimeout: 3000,
  commandTimeout: 3000,
  enableOfflineQueue: false,
  retryStrategy,
});

// BullMQ workers need a connection that can wait for Redis and issue blocking commands.
export const queueRedis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  connectTimeout: 3000,
  retryStrategy,
});

redis.on("connect", () => {
  console.log("✓ Redis connected successfully");
});

const logRedisError = (err: any) => {
  const now = Date.now();
  if (now - lastErrorLoggedAt > 20000) {
    lastErrorLoggedAt = now;
    console.warn(`[Redis Notice] ${err.code || 'Error'}: Could not connect to Redis at ${env.REDIS_URL}. The server will continue running with DB fallback.`);
  }
};

redis.on("error", logRedisError);
queueRedis.on("error", logRedisError);
