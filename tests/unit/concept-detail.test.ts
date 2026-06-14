import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ getAll: () => [], set: vi.fn() })),
}));

// ---------------------------------------------------------------------------
// Supabase client mock
// ---------------------------------------------------------------------------

function makeQueryChain(result: unknown) {
  const terminal = vi.fn().mockResolvedValue(result);
  const chain: Record<string, unknown> & PromiseLike<unknown> = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    single: terminal,
    maybeSingle: terminal,
    then: (
      resolve?: ((v: unknown) => unknown) | null,
      reject?: ((e: unknown) => unknown) | null
    ) => Promise.resolve(result).then(resolve, reject ?? undefined),
  };
  return chain;
}

let mockFrom: ReturnType<typeof vi.fn>;
let mockClient: { from: ReturnType<typeof vi.fn> };

let mockGetSession: ReturnType<typeof vi.fn>;

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => mockClient),
  getSession: (...args: unknown[]) => mockGetSession(...args),
  requireUser: (s: unknown) => {
    if (!s) {
      const err = new Error("Authentication required");
      (err as NodeJS.ErrnoException).code = "UNAUTHENTICATED";
      Object.assign(err, { httpStatus: 401, name: "UnauthenticatedError" });
      throw err;
    }
  },
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

import { NextRequest } from "next/server";
import type { Session, Concept, ConceptInput } from "@/types";

const SESSION: Session = {
  user_id: "aaaaaaaa-0000-0000-0000-000000000001",
  email: "test@example.com",
  access_token: "tok",
  expires_at: new Date().toISOString(),
};

const OTHER_USER_ID = "bbbbbbbb-0000-0000-0000-000000000002";

const CONCEPT_ID = "cccccccc-0000-0000-0000-000000000001";
const TOPIC_ID = "a0000000-0000-0000-0000-000000000001";

function makeConcept(overrides: Partial<Concept> = {}): Concept {
  return {
    id: CONCEPT_ID,
    user_id: SESSION.user_id,
    topic_id: TOPIC_ID,
    title: "useEffect",
    what_it_does: "Runs side effects after render",
    comparisons: [
      {
        id: "d0000000-0000-0000-0000-000000000001",
        concept_id: CONCEPT_ID,
        alternative: "useLayoutEffect",
        difference: "Fires synchronously after DOM mutations",
        position: 0,
      },
    ],
    when_it_breaks: "Missing dependency array causes infinite loop",
    explain_in_30s: "Hook that runs a callback after every render or when deps change",
    where_i_used_it: "ProfilePage to fetch user data on mount",
    tags: ["hooks", "react"],
    image: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

const VALID_INPUT: ConceptInput = {
  topic_id: TOPIC_ID,
  title: "useCallback",
  what_it_does: "Memoizes a callback",
  comparisons: [{ alternative: "useMemo", difference: "Memoizes a value, not a function", position: 0 }],
  when_it_breaks: "Stale closure if deps are wrong",
  explain_in_30s: "Returns same function reference unless deps change",
  where_i_used_it: "SearchBar to avoid child re-renders",
  tags: ["hooks", "performance"],
  image: null,
};

function makeRequest(method: string, body?: unknown): NextRequest {
  return new NextRequest(`http://localhost/api/concepts/${CONCEPT_ID}`, {
    method,
    headers: { "content-type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

function makeParams(id: string = CONCEPT_ID) {
  return { params: Promise.resolve({ id }) };
}

// ---------------------------------------------------------------------------
// Helpers to read JSON from NextResponse
// ---------------------------------------------------------------------------

async function json(res: Response) {
  return res.json();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  mockFrom = vi.fn();
  mockClient = { from: mockFrom };
  mockGetSession = vi.fn().mockResolvedValue(SESSION);
});

describe("GET /api/concepts/:id", () => {
  it("returns full concept with comparisons for own concept", async () => {
    const concept = makeConcept();
    mockFrom.mockReturnValue(makeQueryChain({ data: concept, error: null }));

    const { GET } = await import("@/app/api/concepts/[id]/route");
    const res = await GET(makeRequest("GET"), makeParams());
    const body = await json(res);

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      id: CONCEPT_ID,
      title: "useEffect",
      what_it_does: "Runs side effects after render",
      when_it_breaks: "Missing dependency array causes infinite loop",
      explain_in_30s: "Hook that runs a callback after every render or when deps change",
      where_i_used_it: "ProfilePage to fetch user data on mount",
      tags: ["hooks", "react"],
      image: null,
    });
    expect(Array.isArray(body.data.comparisons)).toBe(true);
    expect(body.data.comparisons).toHaveLength(1);
    expect(body.data.comparisons[0]).toMatchObject({
      alternative: "useLayoutEffect",
      difference: "Fires synchronously after DOM mutations",
      position: 0,
    });
  });

  it("returns 404 for nonexistent concept id (not 403)", async () => {
    mockFrom.mockReturnValue(makeQueryChain({ data: null, error: null }));

    const { GET } = await import("@/app/api/concepts/[id]/route");
    const res = await GET(makeRequest("GET"), makeParams("nonexistent-id"));
    const body = await json(res);

    expect(res.status).toBe(404);
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("NOT_FOUND");
  });

  it("returns 404 (not 403) when concept belongs to another user — RLS denial is not-found", async () => {
    // DB returns null because the user_id filter excludes the other user's row
    mockFrom.mockReturnValue(makeQueryChain({ data: null, error: null }));

    const { GET } = await import("@/app/api/concepts/[id]/route");
    const res = await GET(makeRequest("GET"), makeParams());
    const body = await json(res);

    expect(res.status).toBe(404);
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("NOT_FOUND");
    // Never reveal that the resource exists for another user
    expect(body.error.code).not.toBe("FORBIDDEN");
    expect(body.error.code).not.toBe("UNAUTHORIZED");
  });

  it("detail response includes all required Concept fields", async () => {
    const image = {
      url: "https://cdn.example.com/img.png",
      path: `${SESSION.user_id}/${CONCEPT_ID}/img.png`,
      width: 800,
      height: 600,
      uploaded_at: new Date().toISOString(),
    };
    const concept = makeConcept({ image });
    mockFrom.mockReturnValue(makeQueryChain({ data: concept, error: null }));

    const { GET } = await import("@/app/api/concepts/[id]/route");
    const res = await GET(makeRequest("GET"), makeParams());
    const body = await json(res);

    expect(res.status).toBe(200);
    const d = body.data;
    // All required Concept fields present
    expect(d).toHaveProperty("id");
    expect(d).toHaveProperty("user_id");
    expect(d).toHaveProperty("topic_id");
    expect(d).toHaveProperty("title");
    expect(d).toHaveProperty("what_it_does");
    expect(d).toHaveProperty("comparisons");
    expect(d).toHaveProperty("when_it_breaks");
    expect(d).toHaveProperty("explain_in_30s");
    expect(d).toHaveProperty("where_i_used_it");
    expect(d).toHaveProperty("tags");
    expect(d).toHaveProperty("image");
    expect(d).toHaveProperty("created_at");
    expect(d).toHaveProperty("updated_at");
    // image is an object when present
    expect(d.image).toMatchObject({ url: image.url, path: image.path });
  });

  it("image field is null when no image is attached", async () => {
    mockFrom.mockReturnValue(makeQueryChain({ data: makeConcept({ image: null }), error: null }));

    const { GET } = await import("@/app/api/concepts/[id]/route");
    const res = await GET(makeRequest("GET"), makeParams());
    const body = await json(res);

    expect(res.status).toBe(200);
    expect(body.data.image).toBeNull();
  });
});

describe("DELETE /api/concepts/:id", () => {
  it("returns { ok: true } when deleting own concept", async () => {
    // First call: existence check (maybeSingle) → returns existing row
    // Second call: delete (awaited chain) → returns { error: null }
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount += 1;
      if (callCount === 1) {
        return makeQueryChain({ data: { id: CONCEPT_ID }, error: null });
      }
      // delete chain — resolves directly
      return makeQueryChain({ data: null, error: null });
    });

    const { DELETE } = await import("@/app/api/concepts/[id]/route");
    const res = await DELETE(makeRequest("DELETE"), makeParams());
    const body = await json(res);

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({ ok: true });
  });

  it("returns 404 when deleting another user's concept", async () => {
    // Existence check returns null — the row is invisible to this user
    mockFrom.mockReturnValue(makeQueryChain({ data: null, error: null }));

    const { DELETE } = await import("@/app/api/concepts/[id]/route");
    const res = await DELETE(makeRequest("DELETE"), makeParams());
    const body = await json(res);

    expect(res.status).toBe(404);
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("NOT_FOUND");
  });
});

describe("PUT /api/concepts/:id", () => {
  it("updates and returns full concept when input is valid", async () => {
    const updated = makeConcept({ title: VALID_INPUT.title, tags: VALID_INPUT.tags });
    let callCount = 0;
    mockFrom.mockImplementation(() => {
      callCount += 1;
      if (callCount === 1) {
        // existence check (maybeSingle)
        return makeQueryChain({ data: { id: CONCEPT_ID }, error: null });
      }
      if (callCount === 2) {
        // UPDATE concepts
        return makeQueryChain({ data: null, error: null });
      }
      if (callCount === 3) {
        // DELETE comparisons
        return makeQueryChain({ data: null, error: null });
      }
      if (callCount === 4) {
        // INSERT new comparisons
        return makeQueryChain({ data: null, error: null });
      }
      // fetchConceptWithComparisons (maybeSingle)
      return makeQueryChain({ data: updated, error: null });
    });

    const { PUT } = await import("@/app/api/concepts/[id]/route");
    const res = await PUT(makeRequest("PUT", VALID_INPUT), makeParams());
    const body = await json(res);

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      id: CONCEPT_ID,
      title: VALID_INPUT.title,
    });
    expect(Array.isArray(body.data.comparisons)).toBe(true);
  });

  it("returns 422 with VALIDATION code when required fields are missing", async () => {
    const { PUT } = await import("@/app/api/concepts/[id]/route");
    const res = await PUT(makeRequest("PUT", { title: "" }), makeParams());
    const body = await json(res);

    expect(res.status).toBe(422);
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("VALIDATION");
    expect(Array.isArray(body.error.fields)).toBe(true);
  });

  it("returns 404 when updating another user's concept", async () => {
    // existence check returns null — invisible to the current user
    mockFrom.mockReturnValue(makeQueryChain({ data: null, error: null }));

    const { PUT } = await import("@/app/api/concepts/[id]/route");
    const res = await PUT(makeRequest("PUT", VALID_INPUT), makeParams());
    const body = await json(res);

    expect(res.status).toBe(404);
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("NOT_FOUND");
  });
});
