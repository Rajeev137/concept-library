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
let mockClient: { from: ReturnType<typeof vi.fn> };

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => mockClient),
}));

import type { Session, Concept, Topic } from "@/types";

const SESSION: Session = {
  user_id: "00000000-0000-0000-0000-000000000099",
  email: "a@b.com",
  access_token: "tok",
  expires_at: new Date().toISOString(),
};

const TOPIC: Topic = {
  id: "00000000-0000-0000-0000-000000000001",
  user_id: "00000000-0000-0000-0000-000000000099",
  name: "React",
  concept_count: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const COMPARISON = {
  id: "00000000-0000-0000-0000-000000000010",
  concept_id: "00000000-0000-0000-0000-000000000002",
  alternative: "Vue",
  difference: "Different reactivity model",
  position: 0,
};

const CONCEPT: Concept = {
  id: "00000000-0000-0000-0000-000000000002",
  user_id: "00000000-0000-0000-0000-000000000099",
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
  topic_id: TOPIC.id as string | null,
  title: "useEffect",
  what_it_does: "Runs side effects after render",
  comparisons: [{ alternative: "Vue", difference: "Different reactivity model", position: 0 }],
  when_it_breaks: "Infinite loop if deps wrong",
  explain_in_30s: "A hook for side effects",
  where_i_used_it: "Data fetching in ProfilePage",
  tags: ["hooks"],
  image: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockFrom = vi.fn();
  mockClient = { from: mockFrom };
});

// ─────────────────────────────────────────────────────────────────
describe("listConcepts", () => {
  it("returns all concepts for session user with comparisons joined", async () => {
    const chain = makeQueryChain({ data: [CONCEPT], error: null });
    mockFrom.mockReturnValue(chain);

    const { listConcepts } = await import("@/lib/repos/concepts");
    const result = await listConcepts(SESSION);

    expect(mockFrom).toHaveBeenCalledWith("concepts");
    expect(chain.eq).toHaveBeenCalledWith("user_id", SESSION.user_id);
    expect(result).toEqual([CONCEPT]);
  });

  it("applies ilike filter for q param", async () => {
    const chain = makeQueryChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);

    const { listConcepts } = await import("@/lib/repos/concepts");
    await listConcepts(SESSION, { q: "effect" });

    expect(chain.ilike).toHaveBeenCalledWith("title", "%effect%");
  });

  it("applies contains filter for tag param", async () => {
    const chain = makeQueryChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);

    const { listConcepts } = await import("@/lib/repos/concepts");
    await listConcepts(SESSION, { tag: "hooks" });

    expect(chain.contains).toHaveBeenCalledWith("tags", ["hooks"]);
  });

  it("applies topic_id filter", async () => {
    const chain = makeQueryChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);

    const { listConcepts } = await import("@/lib/repos/concepts");
    await listConcepts(SESSION, { topic_id: "topic-1" });

    expect(chain.eq).toHaveBeenCalledWith("topic_id", "topic-1");
  });

  it("combines q, tag, and topic_id filters (AND)", async () => {
    const chain = makeQueryChain({ data: [], error: null });
    mockFrom.mockReturnValue(chain);

    const { listConcepts } = await import("@/lib/repos/concepts");
    await listConcepts(SESSION, { q: "use", tag: "hooks", topic_id: "topic-1" });

    expect(chain.ilike).toHaveBeenCalledWith("title", "%use%");
    expect(chain.contains).toHaveBeenCalledWith("tags", ["hooks"]);
    expect(chain.eq).toHaveBeenCalledWith("topic_id", "topic-1");
    expect(chain.eq).toHaveBeenCalledWith("user_id", SESSION.user_id);
  });

  it("throws UPSTREAM_UNAVAILABLE on DB error", async () => {
    mockFrom.mockReturnValue(makeQueryChain({ data: null, error: { message: "fail" } }));

    const { listConcepts } = await import("@/lib/repos/concepts");
    await expect(listConcepts(SESSION)).rejects.toMatchObject({ code: "UPSTREAM_UNAVAILABLE" });
  });
});

describe("getConcept", () => {
  it("returns concept with comparisons when found for session user", async () => {
    const chain = makeQueryChain({ data: CONCEPT, error: null });
    mockFrom.mockReturnValue(chain);

    const { getConcept } = await import("@/lib/repos/concepts");
    const result = await getConcept(SESSION, CONCEPT.id);

    expect(chain.eq).toHaveBeenCalledWith("id", CONCEPT.id);
    expect(chain.eq).toHaveBeenCalledWith("user_id", SESSION.user_id);
    expect(result).toEqual(CONCEPT);
  });

  it("returns null when concept belongs to another user", async () => {
    const chain = makeQueryChain({ data: null, error: null });
    mockFrom.mockReturnValue(chain);

    const { getConcept } = await import("@/lib/repos/concepts");
    const result = await getConcept(SESSION, "other-concept");
    expect(result).toBeNull();
  });

  it("throws UPSTREAM_UNAVAILABLE on DB error", async () => {
    mockFrom.mockReturnValue(makeQueryChain({ data: null, error: { message: "down" } }));

    const { getConcept } = await import("@/lib/repos/concepts");
    await expect(getConcept(SESSION, "c1")).rejects.toMatchObject({ code: "UPSTREAM_UNAVAILABLE" });
  });
});

describe("createConcept", () => {
  it("inserts concept and comparisons then returns full concept", async () => {
    const insertedConcept = { ...CONCEPT, comparisons: [] };
    mockFrom
      .mockReturnValueOnce(makeQueryChain({ data: insertedConcept, error: null })) // insert concept
      .mockReturnValueOnce(makeQueryChain({ error: null }))                        // insert comparisons
      .mockReturnValueOnce(makeQueryChain({ data: CONCEPT, error: null }));        // fetch full

    const { createConcept } = await import("@/lib/repos/concepts");
    const result = await createConcept(SESSION, CONCEPT_INPUT);
    expect(result).toEqual(CONCEPT);
  });

  it("sets user_id from session, never from input", async () => {
    const insertedConcept = { ...CONCEPT, comparisons: [] };
    mockFrom
      .mockReturnValueOnce(makeQueryChain({ data: insertedConcept, error: null }))
      .mockReturnValueOnce(makeQueryChain({ error: null }))
      .mockReturnValueOnce(makeQueryChain({ data: CONCEPT, error: null }));

    const { createConcept } = await import("@/lib/repos/concepts");
    await createConcept(SESSION, CONCEPT_INPUT);

    const insertChain = mockFrom.mock.results[0].value;
    expect(insertChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: SESSION.user_id })
    );
  });

  it("creates new topic when topic_id is null and topic_name_new provided", async () => {
    const inputWithNew = { ...CONCEPT_INPUT, topic_id: null, topic_name_new: "New Topic" };
    const insertedConcept = { ...CONCEPT, comparisons: [] };

    mockFrom
      // findTopicByName in createConcept (check conflict before calling createTopic)
      .mockReturnValueOnce(makeQueryChain({ data: null, error: null }))
      // findTopicByName inside createTopic (duplicate check)
      .mockReturnValueOnce(makeQueryChain({ data: null, error: null }))
      // createTopic insert
      .mockReturnValueOnce(makeQueryChain({ data: TOPIC, error: null }))
      // insert concept
      .mockReturnValueOnce(makeQueryChain({ data: insertedConcept, error: null }))
      // insert comparisons
      .mockReturnValueOnce(makeQueryChain({ error: null }))
      // fetch full concept
      .mockReturnValueOnce(makeQueryChain({ data: CONCEPT, error: null }));

    const { createConcept } = await import("@/lib/repos/concepts");
    const result = await createConcept(SESSION, inputWithNew);
    expect(result).toEqual(CONCEPT);
  });

  it("throws CONFLICT (409) when topic_name_new already exists", async () => {
    const inputWithNew = { ...CONCEPT_INPUT, topic_id: null, topic_name_new: "React" };
    // findTopicByName returns existing topic
    mockFrom.mockReturnValue(makeQueryChain({ data: TOPIC, error: null }));

    const { createConcept } = await import("@/lib/repos/concepts");
    await expect(createConcept(SESSION, inputWithNew)).rejects.toMatchObject({
      code: "CONFLICT",
      status: 409,
    });
  });

  it("throws CONFLICT (409) on duplicate title within topic", async () => {
    mockFrom.mockReturnValue(
      makeQueryChain({ data: null, error: { message: "dup", code: "23505" } })
    );

    const { createConcept } = await import("@/lib/repos/concepts");
    await expect(createConcept(SESSION, CONCEPT_INPUT)).rejects.toMatchObject({
      code: "CONFLICT",
      status: 409,
    });
  });

  it("throws VALIDATION (422) when title is empty", async () => {
    const { createConcept } = await import("@/lib/repos/concepts");
    await expect(
      createConcept(SESSION, { ...CONCEPT_INPUT, title: "" })
    ).rejects.toMatchObject({ code: "VALIDATION", status: 422 });
  });

  it("throws VALIDATION (422) when comparisons array is empty", async () => {
    const { createConcept } = await import("@/lib/repos/concepts");
    await expect(
      createConcept(SESSION, { ...CONCEPT_INPUT, comparisons: [] })
    ).rejects.toMatchObject({ code: "VALIDATION", status: 422 });
  });

  it("throws VALIDATION (422) when neither topic_id nor topic_name_new provided", async () => {
    const { createConcept } = await import("@/lib/repos/concepts");
    const bad = { ...CONCEPT_INPUT, topic_id: null, topic_name_new: undefined };
    await expect(createConcept(SESSION, bad)).rejects.toMatchObject({
      code: "VALIDATION",
      status: 422,
    });
  });
});

describe("updateConcept", () => {
  it("updates fields, replaces comparisons, returns full concept", async () => {
    const existingRow = { id: CONCEPT.id };
    mockFrom
      .mockReturnValueOnce(makeQueryChain({ data: existingRow, error: null })) // find existing
      .mockReturnValueOnce(makeQueryChain({ error: null }))                    // update concept
      .mockReturnValueOnce(makeQueryChain({ error: null }))                    // delete comparisons
      .mockReturnValueOnce(makeQueryChain({ error: null }))                    // insert comparisons
      .mockReturnValueOnce(makeQueryChain({ data: CONCEPT, error: null }));    // fetch full

    const { updateConcept } = await import("@/lib/repos/concepts");
    const result = await updateConcept(SESSION, CONCEPT.id, CONCEPT_INPUT);
    expect(result).toEqual(CONCEPT);
  });

  it("throws NOT_FOUND (404) when concept does not belong to session user", async () => {
    mockFrom.mockReturnValue(makeQueryChain({ data: null, error: null }));

    const { updateConcept } = await import("@/lib/repos/concepts");
    await expect(updateConcept(SESSION, "bad-id", CONCEPT_INPUT)).rejects.toMatchObject({
      code: "NOT_FOUND",
      status: 404,
    });
  });

  it("throws VALIDATION (422) for invalid input", async () => {
    const { updateConcept } = await import("@/lib/repos/concepts");
    await expect(
      updateConcept(SESSION, CONCEPT.id, { ...CONCEPT_INPUT, title: "" })
    ).rejects.toMatchObject({ code: "VALIDATION", status: 422 });
  });

  it("throws CONFLICT (409) when updated title conflicts with another concept", async () => {
    const existingRow = { id: CONCEPT.id };
    mockFrom
      .mockReturnValueOnce(makeQueryChain({ data: existingRow, error: null }))
      .mockReturnValueOnce(makeQueryChain({ error: { message: "dup", code: "23505" } }));

    const { updateConcept } = await import("@/lib/repos/concepts");
    await expect(updateConcept(SESSION, CONCEPT.id, CONCEPT_INPUT)).rejects.toMatchObject({
      code: "CONFLICT",
      status: 409,
    });
  });

  it("deletes old comparisons before inserting new ones (replace, not append)", async () => {
    const existingRow = { id: CONCEPT.id };
    const deleteCmpChain = makeQueryChain({ error: null });
    const insertCmpChain = makeQueryChain({ error: null });

    mockFrom
      .mockReturnValueOnce(makeQueryChain({ data: existingRow, error: null }))
      .mockReturnValueOnce(makeQueryChain({ error: null }))
      .mockReturnValueOnce(deleteCmpChain)
      .mockReturnValueOnce(insertCmpChain)
      .mockReturnValueOnce(makeQueryChain({ data: CONCEPT, error: null }));

    const { updateConcept } = await import("@/lib/repos/concepts");
    await updateConcept(SESSION, CONCEPT.id, CONCEPT_INPUT);

    expect(deleteCmpChain.delete).toHaveBeenCalled();
    expect(deleteCmpChain.eq).toHaveBeenCalledWith("concept_id", CONCEPT.id);
    expect(insertCmpChain.insert).toHaveBeenCalled();
  });
});

describe("removeConcept", () => {
  it("deletes concept and returns { ok: true }", async () => {
    mockFrom
      .mockReturnValueOnce(makeQueryChain({ data: { id: CONCEPT.id }, error: null })) // find
      .mockReturnValueOnce(makeQueryChain({ error: null }));                           // delete

    const { removeConcept } = await import("@/lib/repos/concepts");
    const result = await removeConcept(SESSION, CONCEPT.id);
    expect(result).toEqual({ ok: true });
  });

  it("throws NOT_FOUND (404) when concept does not belong to session user", async () => {
    mockFrom.mockReturnValue(makeQueryChain({ data: null, error: null }));

    const { removeConcept } = await import("@/lib/repos/concepts");
    await expect(removeConcept(SESSION, "bad-id")).rejects.toMatchObject({
      code: "NOT_FOUND",
      status: 404,
    });
  });

  it("scopes delete to session user_id (defense in depth)", async () => {
    const deleteChain = makeQueryChain({ error: null });
    mockFrom
      .mockReturnValueOnce(makeQueryChain({ data: { id: CONCEPT.id }, error: null }))
      .mockReturnValueOnce(deleteChain);

    const { removeConcept } = await import("@/lib/repos/concepts");
    await removeConcept(SESSION, CONCEPT.id);

    expect(deleteChain.eq).toHaveBeenCalledWith("user_id", SESSION.user_id);
  });

  it("throws UPSTREAM_UNAVAILABLE on DB error during delete", async () => {
    mockFrom
      .mockReturnValueOnce(makeQueryChain({ data: { id: CONCEPT.id }, error: null }))
      .mockReturnValueOnce(makeQueryChain({ error: { message: "fail" } }));

    const { removeConcept } = await import("@/lib/repos/concepts");
    await expect(removeConcept(SESSION, CONCEPT.id)).rejects.toMatchObject({
      code: "UPSTREAM_UNAVAILABLE",
    });
  });
});
