import { describe, it, expect } from "vitest";
import { validateConcept, conceptInputSchema } from "@/lib/validators/concept";
import type { ConceptInput } from "@/types";

const VALID_UUID = "00000000-0000-0000-0000-000000000001";

const validInput: ConceptInput = {
  topic_id: VALID_UUID,
  title: "React Hooks",
  what_it_does: "Lets functional components use state and lifecycle",
  comparisons: [
    { alternative: "Class components", difference: "Hooks avoid this binding", position: 0 },
  ],
  when_it_breaks: "When called conditionally",
  explain_in_30s: "Functions that let you hook into React state from function components",
  where_i_used_it: "Dashboard refactor at Acme Corp",
  tags: ["react", "frontend"],
  image: null,
};

describe("validateConcept — valid inputs", () => {
  it("accepts a fully valid ConceptInput with topic_id", () => {
    expect(validateConcept(validInput)).toEqual({ ok: true, errors: [] });
  });

  it("accepts topic_name_new when topic_id is null", () => {
    const result = validateConcept({ ...validInput, topic_id: null, topic_name_new: "New Topic" });
    expect(result.ok).toBe(true);
  });

  it("accepts 'N.A.' for required string fields", () => {
    const result = validateConcept({ ...validInput, where_i_used_it: "N.A." });
    expect(result.ok).toBe(true);
  });

  it("accepts multiple comparison rows", () => {
    const result = validateConcept({
      ...validInput,
      comparisons: [
        { alternative: "A", difference: "B", position: 0 },
        { alternative: "C", difference: "D", position: 1 },
      ],
    });
    expect(result.ok).toBe(true);
  });

  it("accepts an empty tags array", () => {
    const result = validateConcept({ ...validInput, tags: [] });
    expect(result.ok).toBe(true);
  });

  it("accepts a valid image object", () => {
    const result = validateConcept({
      ...validInput,
      image: {
        url: "https://example.supabase.co/storage/img.png",
        path: `${VALID_UUID}/concept-1/img.png`,
        uploaded_at: new Date().toISOString(),
      },
    });
    expect(result.ok).toBe(true);
  });
});

describe("validateConcept — required string fields", () => {
  const requiredStrings: Array<keyof Pick<ConceptInput, "title" | "what_it_does" | "when_it_breaks" | "explain_in_30s" | "where_i_used_it">> = [
    "title",
    "what_it_does",
    "when_it_breaks",
    "explain_in_30s",
    "where_i_used_it",
  ];

  for (const field of requiredStrings) {
    it(`rejects empty string for ${field}`, () => {
      const result = validateConcept({ ...validInput, [field]: "" });
      expect(result.ok).toBe(false);
      expect(result.errors.some((e) => e.field === field)).toBe(true);
    });

    it(`rejects whitespace-only value for ${field}`, () => {
      const result = validateConcept({ ...validInput, [field]: "   " });
      expect(result.ok).toBe(false);
      expect(result.errors.some((e) => e.field === field)).toBe(true);
    });
  }
});

describe("validateConcept — comparisons", () => {
  it("rejects empty comparisons array", () => {
    const result = validateConcept({ ...validInput, comparisons: [] });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.field === "comparisons")).toBe(true);
  });

  it("rejects comparison with empty alternative", () => {
    const result = validateConcept({
      ...validInput,
      comparisons: [{ alternative: "", difference: "some diff", position: 0 }],
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.field.includes("alternative"))).toBe(true);
  });

  it("rejects comparison with whitespace-only difference", () => {
    const result = validateConcept({
      ...validInput,
      comparisons: [{ alternative: "Alt", difference: "  ", position: 0 }],
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.field.includes("difference"))).toBe(true);
  });

  it("uses dotted path for nested comparison errors (e.g. comparisons[0].alternative)", () => {
    const result = validateConcept({
      ...validInput,
      comparisons: [{ alternative: "", difference: "D", position: 0 }],
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.field === "comparisons[0].alternative")).toBe(true);
  });
});

describe("validateConcept — topic requirement", () => {
  it("rejects when both topic_id is null and topic_name_new is absent", () => {
    const result = validateConcept({ ...validInput, topic_id: null });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.field === "topic_id")).toBe(true);
  });

  it("rejects when topic_id is null and topic_name_new is empty string", () => {
    const input = { ...validInput, topic_id: null, topic_name_new: "" };
    const result = validateConcept(input as ConceptInput);
    expect(result.ok).toBe(false);
  });

  it("rejects a non-UUID string for topic_id", () => {
    const result = validateConcept({ ...validInput, topic_id: "not-a-uuid" });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.field === "topic_id")).toBe(true);
  });
});

describe("validateConcept — .strict() rejects unknown keys", () => {
  it("rejects user_id in body", () => {
    const result = conceptInputSchema.safeParse({ ...validInput, user_id: "injected-id" });
    expect(result.success).toBe(false);
  });

  it("rejects arbitrary unknown keys", () => {
    const result = conceptInputSchema.safeParse({ ...validInput, extra_field: "bad" });
    expect(result.success).toBe(false);
  });
});
