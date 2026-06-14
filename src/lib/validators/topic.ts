import { z } from "zod";
import type { TopicInput, ValidationResult } from "@/types";
import { TOPIC_POLICY } from "@/types";

export const topicInputSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Required")
      .max(TOPIC_POLICY.NAME_MAX_LEN, `Name must be at most ${TOPIC_POLICY.NAME_MAX_LEN} characters`),
  })
  .strict();

export function validateTopic(input: TopicInput): ValidationResult {
  const result = topicInputSchema.safeParse(input);
  if (result.success) return { ok: true, errors: [] };
  return {
    ok: false,
    errors: result.error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    })),
  };
}
