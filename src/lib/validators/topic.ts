import { z } from "zod";
import type { TopicInput, ValidationResult } from "@/types";
import { TOPIC_POLICY } from "@/types";

// TODO: Define a Zod schema for TopicInput (.strict()).
// name: non-empty after trim, max TOPIC_POLICY.NAME_MAX_LEN characters.
export const topicInputSchema = z.object({
  // TODO: name: z.string().trim().min(1, "Required").max(TOPIC_POLICY.NAME_MAX_LEN),
}).strict();

// TODO: Run topicInputSchema.safeParse on input; map ZodError issues to FieldError[];
// return { ok, errors }.
export function validateTopic(input: TopicInput): ValidationResult {
  // TODO: const result = topicInputSchema.safeParse(input)
  // TODO: if (result.success) return { ok: true, errors: [] }
  // TODO: return { ok: false, errors: result.error.issues.map(...) }
  return { ok: true, errors: [] };
}
