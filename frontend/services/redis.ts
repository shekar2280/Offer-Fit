import { getMidnightISTResetMs } from "@/config/constants";

const memoryCache = new Map<string, { value: unknown; expiresAt: number }>();
const rateLimitMemory = new Map<string, { count: number; windowStart: number }>();

export async function getCache(key: string): Promise<unknown> {
  const cached = memoryCache.get(key);
  if (!cached) return null;
  
  if (Date.now() > cached.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return cached.value;
}

export async function setCache(key: string, value: unknown, ttlSeconds: number = 86400): Promise<void> {
  memoryCache.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

export async function checkRateLimit(
  key: string,
  limit: number,
): Promise<{ success: boolean; remaining: number; resetMs: number }> {
  const now = Date.now();
  const resetMs = getMidnightISTResetMs();
  const windowStart = now + resetMs - 86400000;

  const entry = rateLimitMemory.get(key);
  const isNewWindow = !entry || entry.windowStart < windowStart;
  const count = isNewWindow ? 0 : entry.count;

  if (count >= limit) {
    return { success: false, remaining: 0, resetMs };
  }

  rateLimitMemory.set(key, { count: count + 1, windowStart: isNewWindow ? now : entry!.windowStart });

  return { success: true, remaining: limit - (count + 1), resetMs };
}
