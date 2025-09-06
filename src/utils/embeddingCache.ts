// src/utils/embeddingCache.ts
import { redisGet, redisSet } from "../lib/redis.client";
import { dynamoGetItem, dynamoPutItem } from "../lib/dynamo.client";

const DYNAMO_TABLE =
  process.env.DYNAMO_EMBED_TABLE ||
  process.env.DYNAMO_EMBED_TABLE ||
  process.env.DYNAMO_EMBED_TABLE ||
  process.env.DYNAMO_EMBED_TABLE ||
  process.env.DYNAMO_EMBED_TABLE ||
  process.env.DYNAMO_EMBED_TABLE ||
  process.env.DYNAMO_EMBED_TABLE ||
  process.env.DYNAMO_EMBED_TABLE;
const TABLE =
  process.env.DYNAMO_EMBED_TABLE ||
  process.env.DYNAMO_EMBED_TABLE ||
  process.env.DYNAMO_EMBED_TABLE ||
  "resume-embedding-cache";
const REDIS_TTL = Number(process.env.EMBEDDING_CACHE_TTL_SECONDS || 2592000);

export async function getCachedEmbedding(
  key: string
): Promise<number[] | null> {
  // 1) Redis
  try {
    const r = await redisGet(key);
    if (r) {
      // stored as JSON string
      const arr = JSON.parse(r);
      if (Array.isArray(arr)) return arr;
    }
  } catch (e) {
    console.warn("Redis get failed:", e);
  }

  // 2) DynamoDB
  try {
    const item = await dynamoGetItem(TABLE, key);
    if (item && item.embedding) {
      // item.embedding stored as JSON string
      const arr =
        typeof item.embedding === "string"
          ? JSON.parse(item.embedding)
          : item.embedding;
      // populate Redis for faster future reads (best-effort)
      try {
        await redisSet(key, JSON.stringify(arr), REDIS_TTL);
      } catch (e) {
        /* ignore */
      }
      return arr;
    }
  } catch (e) {
    console.warn("DynamoDB get failed:", e);
  }

  return null;
}

export async function cacheEmbedding(
  key: string,
  embedding: number[],
  ttlSeconds?: number
) {
  const ttl = ttlSeconds ?? REDIS_TTL;
  // 1) Redis
  try {
    await redisSet(key, JSON.stringify(embedding), ttl);
  } catch (e) {
    console.warn("Redis set failed:", e);
  }

  // 2) DynamoDB (durable)
  try {
    const expiresAt = Math.floor(Date.now() / 1000) + ttl; // unix seconds
    const item = {
      id: key,
      embedding: JSON.stringify(embedding),
      expiresAt,
      updatedAt: Date.now(),
    };
    await dynamoPutItem(TABLE, item);
  } catch (e) {
    console.warn("DynamoDB put failed:", e);
  }
}
