import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import type { RateLimitRule, RateLimitResult } from "@/types";

export const RATE_LIMIT_RULES = {
  login: { key: "login" as const, window_seconds: 900, max_hits: 5 },
  register: { key: "register" as const, window_seconds: 3600, max_hits: 3 },
  password_reset: { key: "password_reset" as const, window_seconds: 3600, max_hits: 3 },
} satisfies Record<string, RateLimitRule>;

function isRedisConfigured(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

function makeRatelimiter(rule: RateLimitRule): Ratelimit {
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(rule.max_hits, `${rule.window_seconds} s`),
    prefix: "rl",
  });
}

export async function checkRateLimit(
  rule: RateLimitRule,
  identifier: string
): Promise<RateLimitResult> {
  if (!isRedisConfigured()) {
    return { allowed: true, remaining: rule.max_hits, reset_at: new Date().toISOString() };
  }

  try {
    const ratelimiter = makeRatelimiter(rule);
    const { success, remaining, reset } = await ratelimiter.limit(`${rule.key}:${identifier}`);
    return {
      allowed: success,
      remaining,
      reset_at: new Date(reset).toISOString(),
    };
  } catch (err) {
    console.error("[rate-limit] Redis error — allowing request:", err);
    return { allowed: true, remaining: rule.max_hits, reset_at: new Date().toISOString() };
  }
}

export function getClientIp(request: Request): string {
  const raw = request.headers.get("x-forwarded-for");
  const ip = raw?.split(",")[0]?.trim();
  return ip || "unknown";
}
