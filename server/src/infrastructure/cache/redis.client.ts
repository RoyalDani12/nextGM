import { Redis } from 'ioredis'
import { env } from '../../config/env.js'

let lastErrorLoggedAt = 0;

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  retryStrategy(times) {
    const now = Date.now();
    if (now - lastErrorLoggedAt > 20000) {
      lastErrorLoggedAt = now;
      console.warn(`[Redis Notice] Cannot connect to Redis at ${env.REDIS_URL}. Retrying in background... (Start Redis locally to enable queues & caching)`);
    }
    return Math.min(times * 1000, 5000);
  },
});

redis.on("connect", () => {
  console.log("✓ Redis connected successfully");
});

redis.on("error", (err: any) => {
  const now = Date.now();
  if (now - lastErrorLoggedAt > 20000) {
    lastErrorLoggedAt = now;
    console.warn(`[Redis Notice] ${err.code || 'Error'}: Could not connect to Redis at ${env.REDIS_URL}. The server will continue running with DB fallback.`);
  }
});
