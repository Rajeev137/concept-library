import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock next/headers ─────────────────────────────────────────────
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ getAll: () => [], set: vi.fn() })),
}));

// ── Build a chainable Supabase query mock ─────────────────────────
function makeChain(resolveWith: () => Promise<unknown>) {
  const chain: Record<string, unknown> = {};
  const methods = [
    "from", "select", "insert", "update", "delete",
    "eq", "ilike", "order", "single", "maybeSingle",
  ];
  for (const m of methods) {
    chain[m] = vi.fn(() => chain);
  }
  // terminal calls resolve the promise
  (chain.single as ReturnType<typeof vi.fn>).mockImplementation(resolveWith);
  (chain.maybeSingle as ReturnType<typeof vi.fn>).mockImplementation(resolveWith);
  return chain;
}

// The mock Supabase client — rebuilt per test in beforeEach
let mockFrom: ReturnType<typeof vi.fn>;
let mockClient: { from: ReturnType<typeof vi.fn> };

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => mockClient),
}));

import type { Session, Topic, Concept } from "@/types";

const SESSION: Session = {
  user_id: "user-1",
  email: "a@b.com",
  access_token: "tok",
  expires_at: new Date().toISOString(),
};

const TOPIC: Topic = {
  id: "topic-1",
  user_id: "user-1",
  name: "React",
  concept_count: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

function makeQueryChain(result: unknown) {
  // order() is used as a non-terminal in list queries; the chain itself must be
  // thenable so that `await query` (without .single/.maybeSingle) resolves too.
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
    // Makes the chain itself awaitable (for queries that don't call .single/.maybeSingle)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    then: (resolve?: ((v: unknown) => any) | null, reject?: ((e: unknown) => any) | null) =>
      Promise.resolve(result).then(resolve, reject ?? undefined),
  };
  return chain;
}

beforeEach(() => {
  vi.clearAllMocks();
  // default: mockFrom returns a chain that resolves to empty/null
  mockFrom = vi.fn();
  mockClient = { from: mockFrom };
});

// ─────────────────────────────────────────────────────────────────
describe("listTopics", () => {
  it("returns topics ordered by name for the session user", async () => {
    const chain = makeQueryChain({ data: [TOPIC], error: null });
    mockFrom.mockReturnValue(chain);

    const { listTopics } = await import("@/lib/repos/topics");
    const result = await listTopics(SESSION);

    expect(mockFrom).toHaveBeenCalledWith("topics");
    expect(chain.eq).toHaveBeenCalledWith("user_id", SESSION.user_id);
    expect(chain.order).toHaveBeenCalledWith("name");
    expect(result).toEqual([TOPIC]);
  });

  it("throws UPSTREAM_UNAVAILABLE when Supabase returns an error", async () => {
    const chain = makeQueryChain({ data: null, error: { message: "DB error" } });
    mockFrom.mockReturnValue(chain);

    const { listTopics } = await import("@/lib/repos/topics");
    await expect(listTopics(SESSION)).rejects.toMatchObject({ code: "UPSTREAM_UNAVAILABLE" });
  });
});

describe("getTopic", () => {
  it("returns a topic when found for the session user", async () => {
    const chain = makeQueryChain({ data: TOPIC, error: null });
    mockFrom.mockReturnValue(chain);

    const { getTopic } = await import("@/lib/repos/topics");
    const result = await getTopic(SESSION, TOPIC.id);

    expect(chain.eq).toHaveBeenCalledWith("id", TOPIC.id);
    expect(chain.eq).toHaveBeenCalledWith("user_id", SESSION.user_id);
    expect(result).toEqual(TOPIC);
  });

  it("returns null when topic belongs to another user (RLS + explicit filter)", async () => {
    const chain = makeQueryChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    const { getTopic } = await import("@/lib/repos/topics");
    const result = await getTopic(SESSION, "other-topic");
    expect(result).toBeNull();
  });

  it("throws UPSTREAM_UNAVAILABLE on DB error", async () => {
    const chain = makeQueryChain({ data: null, error: { message: "fail" } });
    mockFrom.mockReturnValue(chain);

    const { getTopic } = await import("@/lib/repos/topics");
    await expect(getTopic(SESSION, "t1")).rejects.toMatchObject({ code: "UPSTREAM_UNAVAILABLE" });
  });
});

describe("findTopicByName", () => {
  it("uses ilike for case-insensitive name lookup", async () => {
    const chain = makeQueryChain({ data: TOPIC, error: null });
    mockFrom.mockReturnValue(chain);

    const { findTopicByName } = await import("@/lib/repos/topics");
    const result = await findTopicByName(SESSION, "react");

    expect(chain.ilike).toHaveBeenCalledWith("name", "react");
    expect(chain.eq).toHaveBeenCalledWith("user_id", SESSION.user_id);
    expect(result).toEqual(TOPIC);
  });

  it("returns null when no match", async () => {
    const chain = makeQueryChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    const { findTopicByName } = await import("@/lib/repos/topics");
    expect(await findTopicByName(SESSION, "unknown")).toBeNull();
  });
});

describe("createTopic", () => {
  it("inserts and returns topic when name is unique", async () => {
    // first call: findTopicByName → null (no duplicate)
    // second call: insert → TOPIC
    mockFrom
      .mockReturnValueOnce(makeQueryChain({ data: null, error: null }))   // findByName
      .mockReturnValueOnce(makeQueryChain({ data: TOPIC, error: null })); // insert

    const { createTopic } = await import("@/lib/repos/topics");
    const result = await createTopic(SESSION, { name: "React" });
    expect(result).toEqual(TOPIC);
  });

  it("throws CONFLICT (409) when name already exists (case-insensitive)", async () => {
    mockFrom.mockReturnValue(makeQueryChain({ data: TOPIC, error: null }));

    const { createTopic } = await import("@/lib/repos/topics");
    await expect(createTopic(SESSION, { name: "react" })).rejects.toMatchObject({
      code: "CONFLICT",
      status: 409,
    });
  });

  it("throws VALIDATION (422) when name is empty", async () => {
    const { createTopic } = await import("@/lib/repos/topics");
    await expect(createTopic(SESSION, { name: "" })).rejects.toMatchObject({
      code: "VALIDATION",
      status: 422,
    });
  });

  it("throws VALIDATION (422) when name is whitespace-only", async () => {
    const { createTopic } = await import("@/lib/repos/topics");
    await expect(createTopic(SESSION, { name: "   " })).rejects.toMatchObject({
      code: "VALIDATION",
      status: 422,
    });
  });

  it("sets user_id from session, never from input", async () => {
    mockFrom
      .mockReturnValueOnce(makeQueryChain({ data: null, error: null }))
      .mockReturnValueOnce(makeQueryChain({ data: TOPIC, error: null }));

    const { createTopic } = await import("@/lib/repos/topics");
    await createTopic(SESSION, { name: "React" });

    // The second mockFrom call is the insert; check it did not pass user_id from outside
    const insertChain = mockFrom.mock.results[1].value;
    expect(insertChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: SESSION.user_id })
    );
  });
});

describe("renameTopic", () => {
  it("updates and returns topic when new name is unique", async () => {
    const renamed = { ...TOPIC, name: "Vue" };
    mockFrom
      .mockReturnValueOnce(makeQueryChain({ data: null, error: null }))    // findByName
      .mockReturnValueOnce(makeQueryChain({ data: renamed, error: null })); // update

    const { renameTopic } = await import("@/lib/repos/topics");
    const result = await renameTopic(SESSION, TOPIC.id, "Vue");
    expect(result.name).toBe("Vue");
  });

  it("throws CONFLICT (409) when another topic has the same name", async () => {
    const other = { ...TOPIC, id: "topic-2", name: "Vue" };
    mockFrom.mockReturnValue(makeQueryChain({ data: other, error: null }));

    const { renameTopic } = await import("@/lib/repos/topics");
    await expect(renameTopic(SESSION, TOPIC.id, "Vue")).rejects.toMatchObject({
      code: "CONFLICT",
      status: 409,
    });
  });

  it("allows rename to the same name (same id collision is not a conflict)", async () => {
    // findByName returns the SAME topic (id matches) → not a conflict
    const sameName = { ...TOPIC, name: "React" };
    mockFrom
      .mockReturnValueOnce(makeQueryChain({ data: sameName, error: null }))
      .mockReturnValueOnce(makeQueryChain({ data: sameName, error: null }));

    const { renameTopic } = await import("@/lib/repos/topics");
    const result = await renameTopic(SESSION, TOPIC.id, "React");
    expect(result.name).toBe("React");
  });

  it("throws NOT_FOUND (404) when topic does not belong to user", async () => {
    mockFrom
      .mockReturnValueOnce(makeQueryChain({ data: null, error: null }))  // findByName
      .mockReturnValueOnce(makeQueryChain({ data: null, error: null })); // update returns nothing

    const { renameTopic } = await import("@/lib/repos/topics");
    await expect(renameTopic(SESSION, "bad-id", "Renamed")).rejects.toMatchObject({
      code: "NOT_FOUND",
      status: 404,
    });
  });

  it("throws VALIDATION (422) for empty name", async () => {
    const { renameTopic } = await import("@/lib/repos/topics");
    await expect(renameTopic(SESSION, TOPIC.id, "")).rejects.toMatchObject({
      code: "VALIDATION",
      status: 422,
    });
  });
});

describe("removeTopic", () => {
  it("deletes topic and returns { ok: true } when no concepts exist", async () => {
    mockFrom
      .mockReturnValueOnce(makeQueryChain({ count: 0, error: null }))   // concept count
      .mockReturnValueOnce(makeQueryChain({ error: null }));             // delete

    const { removeTopic } = await import("@/lib/repos/topics");
    const result = await removeTopic(SESSION, TOPIC.id);
    expect(result).toEqual({ ok: true });
  });

  it("throws CONFLICT (409) with concept count when topic has concepts", async () => {
    mockFrom.mockReturnValue(makeQueryChain({ count: 3, error: null }));

    const { removeTopic } = await import("@/lib/repos/topics");
    await expect(removeTopic(SESSION, TOPIC.id)).rejects.toMatchObject({
      code: "CONFLICT",
      status: 409,
      message: expect.stringContaining("3"),
    });
  });

  it("counts concepts scoped to user_id (defense in depth)", async () => {
    const chain = makeQueryChain({ count: 0, error: null });
    mockFrom
      .mockReturnValueOnce(chain)
      .mockReturnValueOnce(makeQueryChain({ error: null }));

    const { removeTopic } = await import("@/lib/repos/topics");
    await removeTopic(SESSION, TOPIC.id);

    expect(chain.eq).toHaveBeenCalledWith("user_id", SESSION.user_id);
  });

  it("throws UPSTREAM_UNAVAILABLE on DB error during count", async () => {
    mockFrom.mockReturnValue(makeQueryChain({ count: null, error: { message: "fail" } }));

    const { removeTopic } = await import("@/lib/repos/topics");
    await expect(removeTopic(SESSION, TOPIC.id)).rejects.toMatchObject({
      code: "UPSTREAM_UNAVAILABLE",
    });
  });
});

describe("listConceptsByTopic", () => {
  it("returns concepts under topic scoped to user_id", async () => {
    const concepts: Concept[] = [];
    const chain = makeQueryChain({ data: concepts, error: null });
    mockFrom.mockReturnValue(chain);

    const { listConceptsByTopic } = await import("@/lib/repos/topics");
    const result = await listConceptsByTopic(SESSION, TOPIC.id);

    expect(chain.eq).toHaveBeenCalledWith("topic_id", TOPIC.id);
    expect(chain.eq).toHaveBeenCalledWith("user_id", SESSION.user_id);
    expect(result).toEqual(concepts);
  });

  it("throws UPSTREAM_UNAVAILABLE on DB error", async () => {
    mockFrom.mockReturnValue(makeQueryChain({ data: null, error: { message: "down" } }));

    const { listConceptsByTopic } = await import("@/lib/repos/topics");
    await expect(listConceptsByTopic(SESSION, TOPIC.id)).rejects.toMatchObject({
      code: "UPSTREAM_UNAVAILABLE",
    });
  });
});
