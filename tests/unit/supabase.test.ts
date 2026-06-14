import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock @supabase/ssr ────────────────────────────────────────────
const mockSupabaseClient = {
  auth: {
    getSession: vi.fn(),
    getUser: vi.fn(),
  },
};

vi.mock("@supabase/ssr", () => ({
  createBrowserClient: vi.fn(() => mockSupabaseClient),
  createServerClient: vi.fn(() => mockSupabaseClient),
}));

// ── Mock next/headers (not available in vitest/node) ─────────────
const mockCookieStore = {
  getAll: vi.fn<[], { name: string; value: string }[]>(() => []),
  set: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => mockCookieStore),
}));

import { createBrowserClient, createServerClient } from "@supabase/ssr";

// ── client.ts ─────────────────────────────────────────────────────
describe("createClient (browser)", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("calls createBrowserClient with public env vars", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";

    const { createClient } = await import("@/lib/supabase/client");
    createClient();

    expect(createBrowserClient).toHaveBeenCalledWith(
      "https://test.supabase.co",
      "anon-key"
    );
  });

  it("returns the supabase client instance", async () => {
    const { createClient } = await import("@/lib/supabase/client");
    const client = createClient();
    expect(client).toBe(mockSupabaseClient);
  });
});

// ── server.ts ─────────────────────────────────────────────────────
describe("createClient (server)", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("calls createServerClient with anon key and cookie adapter", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";

    const { createClient } = await import("@/lib/supabase/server");
    await createClient();

    expect(createServerClient).toHaveBeenCalledWith(
      "https://test.supabase.co",
      "anon-key",
      expect.objectContaining({ cookies: expect.any(Object) })
    );
  });

  it("cookie adapter getAll delegates to cookieStore.getAll", async () => {
    mockCookieStore.getAll.mockReturnValue([{ name: "sb-token", value: "x" }]);

    const { createClient } = await import("@/lib/supabase/server");
    await createClient();

    const [, , options] = (createServerClient as ReturnType<typeof vi.fn>).mock
      .calls.at(-1)!;
    const result = options.cookies.getAll();
    expect(result).toEqual([{ name: "sb-token", value: "x" }]);
  });

  it("cookie adapter setAll writes to cookieStore", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    await createClient();

    const [, , options] = (createServerClient as ReturnType<typeof vi.fn>).mock
      .calls.at(-1)!;
    options.cookies.setAll([{ name: "sb-token", value: "y", options: {} }]);
    expect(mockCookieStore.set).toHaveBeenCalledWith("sb-token", "y", {});
  });
});

describe("createServiceClient", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("calls createServerClient with service-role key", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";

    const { createServiceClient } = await import("@/lib/supabase/server");
    createServiceClient();

    expect(createServerClient).toHaveBeenCalledWith(
      "https://test.supabase.co",
      "service-role-key",
      expect.objectContaining({ cookies: expect.any(Object) })
    );
  });

  it("service client cookie adapter always returns empty array", async () => {
    const { createServiceClient } = await import("@/lib/supabase/server");
    createServiceClient();

    const [, , options] = (createServerClient as ReturnType<typeof vi.fn>).mock
      .calls.at(-1)!;
    expect(options.cookies.getAll()).toEqual([]);
  });
});

describe("getSession", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("returns null when no active session", async () => {
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: null },
    });

    const { getSession } = await import("@/lib/supabase/server");
    const result = await getSession();
    expect(result).toBeNull();
  });

  it("maps Supabase session to our Session type", async () => {
    const expiresAt = Math.floor(Date.now() / 1000) + 3600;
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: {
        session: {
          user: { id: "user-uuid", email: "test@example.com" },
          access_token: "tok-abc",
          expires_at: expiresAt,
        },
      },
    });

    const { getSession } = await import("@/lib/supabase/server");
    const session = await getSession();

    expect(session).toEqual({
      user_id: "user-uuid",
      email: "test@example.com",
      access_token: "tok-abc",
      expires_at: new Date(expiresAt * 1000).toISOString(),
    });
  });
});

describe("requireUser", () => {
  it("does not throw when session is valid", async () => {
    const { requireUser } = await import("@/lib/supabase/server");
    const session = {
      user_id: "u1",
      email: "a@b.com",
      access_token: "tok",
      expires_at: new Date().toISOString(),
    };
    expect(() => requireUser(session)).not.toThrow();
  });

  it("throws with code UNAUTHENTICATED and httpStatus 401 when session is null", async () => {
    const { requireUser } = await import("@/lib/supabase/server");
    expect(() => requireUser(null)).toThrowError(
      expect.objectContaining({ code: "UNAUTHENTICATED", httpStatus: 401 })
    );
  });
});

// ── middleware.ts ─────────────────────────────────────────────────
describe("createMiddlewareClient", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("calls createServerClient with anon key", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";

    const { createMiddlewareClient } = await import("@/lib/supabase/middleware");

    const mockRequest = {
      cookies: { getAll: vi.fn(() => [{ name: "sb", value: "v" }]), set: vi.fn() },
    };
    const mockResponse = { cookies: { set: vi.fn() } };

    createMiddlewareClient(mockRequest as any, mockResponse as any);

    expect(createServerClient).toHaveBeenCalledWith(
      "https://test.supabase.co",
      "anon-key",
      expect.objectContaining({ cookies: expect.any(Object) })
    );
  });

  it("cookie adapter getAll reads from request cookies", async () => {
    const { createMiddlewareClient } = await import("@/lib/supabase/middleware");

    const mockRequest = {
      cookies: { getAll: vi.fn(() => [{ name: "sb", value: "v" }]), set: vi.fn() },
    };
    const mockResponse = { cookies: { set: vi.fn() } };

    createMiddlewareClient(mockRequest as any, mockResponse as any);

    const [, , options] = (createServerClient as ReturnType<typeof vi.fn>).mock
      .calls.at(-1)!;
    expect(options.cookies.getAll()).toEqual([{ name: "sb", value: "v" }]);
  });

  it("cookie adapter setAll writes to both request and response cookies", async () => {
    const { createMiddlewareClient } = await import("@/lib/supabase/middleware");

    const mockRequest = {
      cookies: { getAll: vi.fn<[], { name: string; value: string }[]>(() => []), set: vi.fn() },
    };
    const mockResponse = { cookies: { set: vi.fn() } };

    createMiddlewareClient(mockRequest as any, mockResponse as any);

    const [, , options] = (createServerClient as ReturnType<typeof vi.fn>).mock
      .calls.at(-1)!;
    options.cookies.setAll([{ name: "sb", value: "tok", options: { httpOnly: true } }]);

    expect(mockRequest.cookies.set).toHaveBeenCalledWith("sb", "tok");
    expect(mockResponse.cookies.set).toHaveBeenCalledWith("sb", "tok", { httpOnly: true });
  });
});
