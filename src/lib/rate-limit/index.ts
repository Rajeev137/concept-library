import type { RateLimitRule, RateLimitResult } from "@/types";

// TODO: Initialize Upstash Redis client using UPSTASH_REDIS_REST_URL and
// UPSTASH_REDIS_REST_TOKEN env vars. Import from @upstash/redis.
// This module is server-only; never import in browser bundles.

// Rate limit rules per contract (auth endpoints only):
// - login:          5 hits / 15 min sliding window, then 1 / min
// - register:       3 hits / 1 hour sliding window
// - password_reset: 3 hits / 1 hour sliding window
export const RATE_LIMIT_RULES = {
  login: { key: "login" as const, window_seconds: 900, max_hits: 5 },
  register: { key: "register" as const, window_seconds: 3600, max_hits: 3 },
  password_reset: { key: "password_reset" as const, window_seconds: 3600, max_hits: 3 },
} satisfies Record<string, RateLimitRule>;

// TODO: Implement sliding-window rate limiting using Upstash Redis.
// key format: "rl:{rule.key}:{identifier}" where identifier is the client IP.
// Use ZADD + ZREMRANGEBYSCORE + ZCOUNT for sliding-window semantics, or use
// @upstash/ratelimit SlidingWindow wrapper.
// Returns RateLimitResult; never throws — treat Redis failure as "allowed" with a log.
export async function checkRateLimit(
  rule: RateLimitRule,
  identifier: string
): Promise<RateLimitResult> {
  // TODO: const ratelimit = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(rule.max_hits, `${rule.window_seconds}s`) })
  // TODO: const { success, remaining, reset } = await ratelimit.limit(`${rule.key}:${identifier}`)
  // TODO: return { allowed: success, remaining, reset_at: new Date(reset).toISOString() }
  return { allowed: true, remaining: rule.max_hits, reset_at: new Date().toISOString() };
}

// TODO: Extract the real client IP from the request, preferring X-Forwarded-For
// (first hop) when behind Vercel's edge. Fall back to "unknown" if unavailable.
export function getClientIp(request: Request): string {
  // TODO: return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
  return "unknown";
}
