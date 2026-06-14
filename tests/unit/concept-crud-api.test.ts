import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock next/headers ─────────────────────────────────────────────
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ getAll: () => [], set: vi.fn() })),
}));

// ── Chainable query mock ─────────────────────────────────────────
function makeQueryChain(result: unknown) {
  const terminal = vi.fn().mockResolvedValue(result);
  const chain: Record<string, unknown> & PromiseLike<unknown> = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    contains: vi.fn().mockReturnThis(),
    single: terminal,
    maybeSingle: terminal,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    then: (resolve?: ((v: unknown) => any) | null, reject?: ((e: unknown) => any) | null) =>
      Promise.resolve(result).then(resolve, reject ?? undefined),
  };
  return chain;
}

let mockFrom: ReturnType<typeof vi.fn>;
let mockGetSession: ReturnType<typeof vi.fn>;

vi.mock("@/lib/supabase/server", async () => {
  const { ApiRouteError } = await import("@/lib/errors");
  return {
    createClient: vi.fn(async () => ({ from: (...args: unknown[]) => mockFrom(...args) })),
    getSession: (...args: unknown[]) => mockGetSession(...args),
    requireUser: vi.fn((s: unknown) => {
      if (!s) throw new ApiRouteError("UNAUTHENTICATED", "Authentication required", 401);
    }),
  };
});

import type { Session, Concept } from "@/types";
import { NextRequest } from "next/server";

const SESSION: Session = {
  user_id: "00000000-0000-0000-0000-000000000099",
  email: "a@b.com",
  access_token: "tok",
  expires_at: new Date().toISOString(),
};

const OTHER_USER_ID = "00000000-0000-0000-0000-000000000088";

const COMPARISON = {
  id: "00000000-0000-0000-0000-000000000010",
  concept_id: "00000000-0000-0000-0000-000000000002",
  alternative: "Vue",
  difference: "Different reactivity model",
  position: 0,
};

const CONCEPT: Concept = {
  id: "00000000-0000-0000-0000-000000000002",
  user_id: SESSION.user_id,
  topic_id: "00000000-0000-0000-0000-000000000001",
  title: "useEffect",
  what_it_does: "Runs side effects after render",
  comparisons: [COMPARISON],
  when_it_breaks: "Infinite loop if deps wrong",
  explain_in_30s: "A hook for side effects",
  where_i_used_it: "Data fetching in ProfilePage",
  tags: ["hooks", "react"],
  image: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const CONCEPT_INPUT = {
  topic_id: CONCEPT.topic_id,
  title: "useEffect",
  what_it_does: "Runs side effects after render",
  comparisons: [{ alternative: "Vue", difference: "Different reactivity model", position: 0 }],
  when_it_breaks: "Infinite loop if deps wrong",
  explain_in_30s: "A hook for side effects",
  where_i_used_it: "Data fetching in ProfilePage",
  tags: ["hooks", "react"],
  image: null,
};

function makeRequest(method: string, url: string, body?: unknown): NextRequest {
  const init: Record<string, unknown> = { method };
  if (body !== undefined) {
    init.body = JSON.stringify(body);
    init.headers = { "content-type": "application/json" };
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new NextRequest(url, init as any);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockFrom = vi.fn();
  mockGetSession = vi.fn().mockResolvedValue(SESSION);
});

// ─────────────────────────────────────────────────────────────────
describe("GET /api/concepts/[id]", () => {
  it("returns 404 for nonexistent concept id", async () => {
    mockFrom.mockReturnValue(makeQueryChain({ data: null, error: null }));

    const { GET } = await import("@/app/api/concepts/[id]/route");
    const req = makeRequest("GET", "http://localhost/api/concepts/nonexistent");
    const res = await GET(req, { params: Promise.resolve({ id: "nonexistent" }) });
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe("NOT_FOUND");
  });

  it("returns 404 for another user's concept (not 403 — existence leak prevention)", async () => {
    // RLS makes wrong-user look like not-found: maybeSingle returns null
    mockFrom.mockReturnValue(makeQueryChain({ data: null, error: null }));

    const otherUserSession: Session = { ...SESSION, user_id: OTHER_USER_ID };
    mockGetSession.mockResolvedValue(otherUserSession);

    const { GET } = await import("@/app/api/concepts/[id]/route");
    const req = makeRequest("GET", `http://localhost/api/concepts/${CONCEPT.id}`);
    const res = await GET(req, { params: Promise.resolve({ id: CONCEPT.id }) });
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe("NOT_FOUND");
    // Must not be 403 — that would leak existence to the wrong user
    expect(res.status).not.toBe(403);
  });

  it("returns concept with comparisons joined on success", async () => {
    mockFrom.mockReturnValue(makeQueryChain({ data: CONCEPT, error: null }));

    const { GET } = await import("@/app/api/concepts/[id]/route");
    const req = makeRequest("GET", `http://localhost/api/concepts/${CONCEPT.id}`);
    const res = await GET(req, { params: Promise.resolve({ id: CONCEPT.id }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.data).toMatchObject({ id: CONCEPT.id, comparisons: [COMPARISON] });
  });
});

// ─────────────────────────────────────────────────────────────────
describe("PUT /api/concepts/[id]", () => {
  it("updates fields and comparisons, returns updated concept", async () => {
    const existingRow = { id: CONCEPT.id };
    const updatedConcept = { ...CONCEPT, title: "useEffect updated" };
    mockFrom
      .mockReturnValueOnce(makeQueryChain({ data: existingRow, error: null })) // find existing
      .mockReturnValueOnce(makeQueryChain({ error: null }))                    // update concept
      .mockReturnValueOnce(makeQueryChain({ error: null }))                    // delete comparisons
      .mockReturnValueOnce(makeQueryChain({ error: null }))                    // insert comparisons
      .mockReturnValueOnce(makeQueryChain({ data: updatedConcept, error: null })); // fetch full

    const { PUT } = await import("@/app/api/concepts/[id]/route");
    const req = makeRequest("PUT", `http://localhost/api/concepts/${CONCEPT.id}`, {
      ...CONCEPT_INPUT,
      title: "useEffect updated",
    });
    const res = await PUT(req, { params: Promise.resolve({ id: CONCEPT.id }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.data.title).toBe("useEffect updated");
  });

  it("returns 422 on invalid body", async () => {
    const { PUT } = await import("@/app/api/concepts/[id]/route");
    const req = makeRequest("PUT", `http://localhost/api/concepts/${CONCEPT.id}`, {
      ...CONCEPT_INPUT,
      title: "",
    });
    const res = await PUT(req, { params: Promise.resolve({ id: CONCEPT.id }) });
    const json = await res.json();

    expect(res.status).toBe(422);
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe("VALIDATION");
  });

  it("returns 409 on duplicate title under same topic", async () => {
    const existingRow = { id: CONCEPT.id };
    mockFrom
      .mockReturnValueOnce(makeQueryChain({ data: existingRow, error: null }))
      .mockReturnValueOnce(makeQueryChain({ error: { message: "dup", code: "23505" } }));

    const { PUT } = await import("@/app/api/concepts/[id]/route");
    const req = makeRequest("PUT", `http://localhost/api/concepts/${CONCEPT.id}`, CONCEPT_INPUT);
    const res = await PUT(req, { params: Promise.resolve({ id: CONCEPT.id }) });
    const json = await res.json();

    expect(res.status).toBe(409);
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe("CONFLICT");
  });

  it("returns 404 when concept does not belong to session user", async () => {
    mockFrom.mockReturnValue(makeQueryChain({ data: null, error: null }));

    const { PUT } = await import("@/app/api/concepts/[id]/route");
    const req = makeRequest("PUT", `http://localhost/api/concepts/bad-id`, CONCEPT_INPUT);
    const res = await PUT(req, { params: Promise.resolve({ id: "bad-id" }) });
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.error.code).toBe("NOT_FOUND");
  });
});

// ─────────────────────────────────────────────────────────────────
describe("DELETE /api/concepts/[id]", () => {
  it("removes concept and returns { ok: true }", async () => {
    mockFrom
      .mockReturnValueOnce(makeQueryChain({ data: { id: CONCEPT.id }, error: null })) // find
      .mockReturnValueOnce(makeQueryChain({ error: null }));                           // delete

    const { DELETE } = await import("@/app/api/concepts/[id]/route");
    const req = makeRequest("DELETE", `http://localhost/api/concepts/${CONCEPT.id}`);
    const res = await DELETE(req, { params: Promise.resolve({ id: CONCEPT.id }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.data).toEqual({ ok: true });
  });

  it("returns 404 when concept does not exist or belongs to another user", async () => {
    mockFrom.mockReturnValue(makeQueryChain({ data: null, error: null }));

    const { DELETE } = await import("@/app/api/concepts/[id]/route");
    const req = makeRequest("DELETE", "http://localhost/api/concepts/nonexistent");
    const res = await DELETE(req, { params: Promise.resolve({ id: "nonexistent" }) });
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.error.code).toBe("NOT_FOUND");
  });
});

// ─────────────────────────────────────────────────────────────────
describe("GET /api/concepts/search", () => {
  it("search by q filters concepts by title substring", async () => {
    const matchingConcept = { ...CONCEPT, title: "useEffect deep dive" };
    const chain = makeQueryChain({ data: [matchingConcept], error: null });
    mockFrom.mockReturnValue(chain);

    const { GET } = await import("@/app/api/concepts/search/route");
    const req = makeRequest("GET", "http://localhost/api/concepts/search?q=useEffect");
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(chain.ilike).toHaveBeenCalledWith("title", "%useEffect%");
  });

  it("search by tag filters by exact tag match", async () => {
    const chain = makeQueryChain({ data: [CONCEPT], error: null });
    mockFrom.mockReturnValue(chain);

    const { GET } = await import("@/app/api/concepts/search/route");
    const req = makeRequest("GET", "http://localhost/api/concepts/search?tag=hooks");
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(chain.contains).toHaveBeenCalledWith("tags", ["hooks"]);
  });

  it("search by topic scopes results to topic_id", async () => {
    const chain = makeQueryChain({ data: [CONCEPT], error: null });
    mockFrom.mockReturnValue(chain);

    const { GET } = await import("@/app/api/concepts/search/route");
    const req = makeRequest("GET", `http://localhost/api/concepts/search?topic=${CONCEPT.topic_id}`);
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(chain.eq).toHaveBeenCalledWith("topic_id", CONCEPT.topic_id);
  });

  it("search with no params returns all concepts for session user", async () => {
    const chain = makeQueryChain({ data: [CONCEPT], error: null });
    mockFrom.mockReturnValue(chain);

    const { GET } = await import("@/app/api/concepts/search/route");
    const req = makeRequest("GET", "http://localhost/api/concepts/search");
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toHaveLength(1);
    expect(chain.eq).toHaveBeenCalledWith("user_id", SESSION.user_id);
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetSession.mockResolvedValue(null);

    const { GET } = await import("@/app/api/concepts/search/route");
    const req = makeRequest("GET", "http://localhost/api/concepts/search?q=foo");
    const res = await GET(req);

    expect(res.status).toBe(401);
  });
});
