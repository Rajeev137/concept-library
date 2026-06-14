import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ getAll: () => [], set: vi.fn() })),
}));

function makeQueryChain(result: unknown) {
  const terminal = vi.fn().mockResolvedValue(result);
  const chain: Record<string, unknown> & PromiseLike<unknown> = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    contains: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: terminal,
    maybeSingle: terminal,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    then: (resolve?: ((v: unknown) => any) | null, reject?: ((e: unknown) => any) | null) =>
      Promise.resolve(result).then(resolve, reject ?? undefined),
  };
  return chain;
}

let mockFrom: ReturnType<typeof vi.fn>;
let mockClient: { from: ReturnType<typeof vi.fn> };

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => mockClient),
}));

import type { Session, Concept } from "@/types";

const SESSION: Session = {
  user_id: "aaaaaaaa-0000-0000-0000-000000000001",
  email: "test@example.com",
  access_token: "tok",
  expires_at: new Date().toISOString(),
};

function makeConcept(overrides: Partial<Concept> = {}): Concept {
  return {
    id: "cccccccc-0000-0000-0000-000000000001",
    user_id: SESSION.user_id,
    topic_id: "tttttttt-0000-0000-0000-000000000001",
    title: "useEffect",
    what_it_does: "Runs side effects",
    comparisons: [],
    when_it_breaks: "Missing deps",
    explain_in_30s: "Hook for side effects",
    where_i_used_it: "ProfilePage",
    tags: ["hooks", "react"],
    image: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockFrom = vi.fn();
  mockClient = { from: mockFrom };
});

describe("listConcepts — search filters", () => {
  it("q param filters concepts by title substring (case-insensitive ilike)", async () => {
    const chain = makeQueryChain({ data: [makeConcept()], error: null });
    mockFrom.mockReturnValue(chain);

    const { listConcepts } = await import("@/lib/repos/concepts");
    const result = await listConcepts(SESSION, { q: "effect" });

    expect(chain.ilike).toHaveBeenCalledWith("title", "%effect%");
    expect(result).toHaveLength(1);
  });

  it("tag param filters by exact tag match in the tags array", async () => {
    const chain = makeQueryChain({ data: [makeConcept()], error: null });
    mockFrom.mockReturnValue(chain);

    const { listConcepts } = await import("@/lib/repos/concepts");
    const result = await listConcepts(SESSION, { tag: "hooks" });

    expect(chain.contains).toHaveBeenCalledWith("tags", ["hooks"]);
    expect(result).toHaveLength(1);
  });

  it("topic param scopes results to that topic_id only", async () => {
    const topicId = "tttttttt-0000-0000-0000-000000000001";
    const chain = makeQueryChain({ data: [makeConcept({ topic_id: topicId })], error: null });
    mockFrom.mockReturnValue(chain);

    const { listConcepts } = await import("@/lib/repos/concepts");
    const result = await listConcepts(SESSION, { topic_id: topicId });

    expect(chain.eq).toHaveBeenCalledWith("topic_id", topicId);
    expect(result).toHaveLength(1);
  });

  it("all queries include user_id filter from session", async () => {
    const chain = makeQueryChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);

    const { listConcepts } = await import("@/lib/repos/concepts");
    await listConcepts(SESSION, { q: "test" });

    expect(chain.eq).toHaveBeenCalledWith("user_id", SESSION.user_id);
  });

  it("empty q/tag/topic_id returns all user concepts without extra filters", async () => {
    const concepts = [makeConcept(), makeConcept({ id: "cccccccc-0000-0000-0000-000000000002", title: "useState" })];
    const chain = makeQueryChain({ data: concepts, error: null });
    mockFrom.mockReturnValue(chain);

    const { listConcepts } = await import("@/lib/repos/concepts");
    const result = await listConcepts(SESSION);

    expect(chain.ilike).not.toHaveBeenCalled();
    expect(chain.contains).not.toHaveBeenCalled();
    expect(chain.eq).toHaveBeenCalledWith("user_id", SESSION.user_id);
    expect(chain.eq).toHaveBeenCalledTimes(1);
    expect(result).toHaveLength(2);
  });

  it("combining q + tag applies both filters (intersection)", async () => {
    const chain = makeQueryChain({ data: [makeConcept()], error: null });
    mockFrom.mockReturnValue(chain);

    const { listConcepts } = await import("@/lib/repos/concepts");
    const result = await listConcepts(SESSION, { q: "effect", tag: "hooks" });

    expect(chain.ilike).toHaveBeenCalledWith("title", "%effect%");
    expect(chain.contains).toHaveBeenCalledWith("tags", ["hooks"]);
    expect(chain.eq).toHaveBeenCalledWith("user_id", SESSION.user_id);
    expect(result).toHaveLength(1);
  });
});
