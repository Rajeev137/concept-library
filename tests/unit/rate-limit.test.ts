import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock @upstash/ratelimit and @upstash/redis before importing the module under test.
const mockLimit = vi.fn();

vi.mock("@upstash/ratelimit", () => {
  const Ratelimit = vi.fn().mockImplementation(() => ({ limit: mockLimit }));
  // Static method on the class itself
  (Ratelimit as unknown as { slidingWindow: ReturnType<typeof vi.fn> }).slidingWindow = vi.fn().mockReturnValue("sliding-window-config");
  return { Ratelimit };
});

vi.mock("@upstash/redis", () => ({
  Redis: vi.fn().mockImplementation(() => ({})),
}));

import { checkRateLimit, getClientIp, RATE_LIMIT_RULES } from "@/lib/rate-limit/index";

const NOW = new Date("2026-01-01T00:00:00.000Z").getTime();
const RESET_MS = NOW + 900_000;

beforeEach(() => {
  vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://fake.upstash.io");
  vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "fake-token");
  mockLimit.mockResolvedValue({ success: true, remaining: 4, reset: RESET_MS });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

// ─── RATE_LIMIT_RULES ────────────────────────────────────────────────────────

describe("RATE_LIMIT_RULES", () => {
  it("login allows 5 hits per 15-minute window", () => {
    expect(RATE_LIMIT_RULES.login.max_hits).toBe(5);
    expect(RATE_LIMIT_RULES.login.window_seconds).toBe(900);
    expect(RATE_LIMIT_RULES.login.key).toBe("login");
  });

  it("register allows 3 hits per hour", () => {
    expect(RATE_LIMIT_RULES.register.max_hits).toBe(3);
    expect(RATE_LIMIT_RULES.register.window_seconds).toBe(3600);
    expect(RATE_LIMIT_RULES.register.key).toBe("register");
  });

  it("password_reset allows 3 hits per hour", () => {
    expect(RATE_LIMIT_RULES.password_reset.max_hits).toBe(3);
    expect(RATE_LIMIT_RULES.password_reset.window_seconds).toBe(3600);
    expect(RATE_LIMIT_RULES.password_reset.key).toBe("password_reset");
  });
});

// ─── checkRateLimit — dev-mode fallback ─────────────────────────────────────

describe("checkRateLimit — dev-mode fallback (no Redis config)", () => {
  beforeEach(() => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
  });

  it("allows all requests when Redis is not configured", async () => {
    const result = await checkRateLimit(RATE_LIMIT_RULES.login, "127.0.0.1");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(RATE_LIMIT_RULES.login.max_hits);
  });

  it("does not call the Redis client when unconfigured", async () => {
    await checkRateLimit(RATE_LIMIT_RULES.register, "127.0.0.1");
    expect(mockLimit).not.toHaveBeenCalled();
  });
});

// ─── checkRateLimit — allowed ────────────────────────────────────────────────

describe("checkRateLimit — allowed", () => {
  it("returns allowed=true and correct remaining when under limit", async () => {
    mockLimit.mockResolvedValue({ success: true, remaining: 3, reset: RESET_MS });
    const result = await checkRateLimit(RATE_LIMIT_RULES.login, "1.2.3.4");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(3);
    expect(result.reset_at).toBe(new Date(RESET_MS).toISOString());
  });

  it("calls limit() with key composed of rule.key and identifier", async () => {
    await checkRateLimit(RATE_LIMIT_RULES.login, "1.2.3.4");
    expect(mockLimit).toHaveBeenCalledWith("login:1.2.3.4");
  });

  it("calls limit() with correct composite key for register", async () => {
    await checkRateLimit(RATE_LIMIT_RULES.register, "5.6.7.8");
    expect(mockLimit).toHaveBeenCalledWith("register:5.6.7.8");
  });

  it("calls limit() with correct composite key for password_reset", async () => {
    await checkRateLimit(RATE_LIMIT_RULES.password_reset, "9.0.1.2");
    expect(mockLimit).toHaveBeenCalledWith("password_reset:9.0.1.2");
  });
});

// ─── checkRateLimit — denied ─────────────────────────────────────────────────

describe("checkRateLimit — rate-limit hit", () => {
  it("returns allowed=false when Redis signals limit exceeded", async () => {
    mockLimit.mockResolvedValue({ success: false, remaining: 0, reset: RESET_MS });
    const result = await checkRateLimit(RATE_LIMIT_RULES.login, "1.2.3.4");
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("reset_at is a valid ISO 8601 string", async () => {
    mockLimit.mockResolvedValue({ success: false, remaining: 0, reset: RESET_MS });
    const result = await checkRateLimit(RATE_LIMIT_RULES.login, "1.2.3.4");
    expect(() => new Date(result.reset_at)).not.toThrow();
    expect(result.reset_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});

// ─── checkRateLimit — Redis failure fallback ─────────────────────────────────

describe("checkRateLimit — Redis failure (fail-open)", () => {
  it("allows request when Redis throws", async () => {
    mockLimit.mockRejectedValue(new Error("Redis connection refused"));
    const result = await checkRateLimit(RATE_LIMIT_RULES.login, "1.2.3.4");
    expect(result.allowed).toBe(true);
  });

  it("returns max_hits as remaining when Redis throws", async () => {
    mockLimit.mockRejectedValue(new Error("timeout"));
    const result = await checkRateLimit(RATE_LIMIT_RULES.register, "1.2.3.4");
    expect(result.remaining).toBe(RATE_LIMIT_RULES.register.max_hits);
  });
});

// ─── getClientIp ─────────────────────────────────────────────────────────────

describe("getClientIp", () => {
  it("returns first IP from X-Forwarded-For header", () => {
    const req = new Request("https://example.com", {
      headers: { "x-forwarded-for": "203.0.113.1, 10.0.0.1, 172.16.0.1" },
    });
    expect(getClientIp(req)).toBe("203.0.113.1");
  });

  it("trims whitespace from the extracted IP", () => {
    const req = new Request("https://example.com", {
      headers: { "x-forwarded-for": "  203.0.113.1  , 10.0.0.1" },
    });
    expect(getClientIp(req)).toBe("203.0.113.1");
  });

  it("returns single IP when X-Forwarded-For has no comma", () => {
    const req = new Request("https://example.com", {
      headers: { "x-forwarded-for": "203.0.113.5" },
    });
    expect(getClientIp(req)).toBe("203.0.113.5");
  });

  it("falls back to 'unknown' when X-Forwarded-For header is absent", () => {
    const req = new Request("https://example.com");
    expect(getClientIp(req)).toBe("unknown");
  });

  it("falls back to 'unknown' when X-Forwarded-For header is empty", () => {
    const req = new Request("https://example.com", {
      headers: { "x-forwarded-for": "" },
    });
    expect(getClientIp(req)).toBe("unknown");
  });
});
