import { describe, it, expect } from "vitest";
import { validateTopic, topicInputSchema } from "@/lib/validators/topic";
import { TOPIC_POLICY } from "@/types";

describe("validateTopic", () => {
  it("accepts a valid name", () => {
    const result = validateTopic({ name: "Kubernetes" });
    expect(result.ok).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("accepts a name that is exactly the max length", () => {
    const result = validateTopic({ name: "a".repeat(TOPIC_POLICY.NAME_MAX_LEN) });
    expect(result.ok).toBe(true);
  });

  it("accepts 'N.A.' as a valid name", () => {
    const result = validateTopic({ name: "N.A." });
    expect(result.ok).toBe(true);
  });

  it("rejects an empty name", () => {
    const result = validateTopic({ name: "" });
    expect(result.ok).toBe(false);
    expect(result.errors[0].field).toBe("name");
  });

  it("rejects a whitespace-only name", () => {
    const result = validateTopic({ name: "   " });
    expect(result.ok).toBe(false);
    expect(result.errors[0].field).toBe("name");
  });

  it("rejects a name longer than 80 characters", () => {
    const result = validateTopic({ name: "a".repeat(TOPIC_POLICY.NAME_MAX_LEN + 1) });
    expect(result.ok).toBe(false);
    expect(result.errors[0].field).toBe("name");
  });

  it("rejects unknown keys via .strict()", () => {
    const result = topicInputSchema.safeParse({ name: "Valid", user_id: "injected" });
    expect(result.success).toBe(false);
  });

  it("returns field 'name' in error when name is missing", () => {
    const result = topicInputSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("name");
    }
  });
});
