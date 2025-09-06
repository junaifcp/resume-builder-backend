// src/lib/redis.client.ts
import Redis from "ioredis";

const host = process.env.REDIS_HOST || "127.0.0.1";
const port = Number(process.env.REDIS_PORT || 6379);
const password = process.env.REDIS_PASSWORD || undefined;

export const redisClient = new Redis({
  host,
  port,
  password: password || undefined,
  // Optional: keepalive and retry strategy
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
});

redisClient.on("error", (err) => {
  console.error("Redis error:", err);
});

export async function redisGet(key: string): Promise<string | null> {
  return redisClient.get(key);
}

export async function redisSet(
  key: string,
  value: string,
  ttlSeconds?: number
) {
  if (ttlSeconds && ttlSeconds > 0) {
    await redisClient.set(key, value, "EX", ttlSeconds);
  } else {
    await redisClient.set(key, value);
  }
}
