import { z } from "zod";
import type { ConceptInput, ValidationResult } from "@/types";
import { REQUIRED_CONCEPT_STRINGS } from "./constants";

// TODO: Define a Zod schema for ComparisonInput (.strict(), all fields required,
// strings non-empty after trim, position >= 0 integer).
export const comparisonInputSchema = z.object({
  // TODO: alternative: z.string().trim().min(1, "Required"),
  // TODO: difference: z.string().trim().min(1, "Required"),
  // TODO: position: z.number().int().min(0),
}).strict();

// TODO: Define a Zod schema for ConceptInput (.strict()).
// Rules from contract: all REQUIRED_STRINGS non-empty after trim ("N.A." valid),
// topic_id is UUID or null, topic_name_new optional string,
// comparisons array min length 1, tags string[], image nullable object.
export const conceptInputSchema = z.object({
  // TODO: topic_id: z.string().uuid().nullable(),
  // TODO: topic_name_new: z.string().trim().min(1).optional(),
  // TODO: title: z.string().trim().min(1, "Required"),
  // TODO: what_it_does: z.string().trim().min(1, "Required"),
  // TODO: comparisons: z.array(comparisonInputSchema).min(1, "At least one comparison required"),
  // TODO: when_it_breaks: z.string().trim().min(1, "Required"),
  // TODO: explain_in_30s: z.string().trim().min(1, "Required"),
  // TODO: where_i_used_it: z.string().trim().min(1, "Required"),
  // TODO: tags: z.array(z.string().trim().min(1)),
  // TODO: image: conceptImageSchema.nullable(),
  // TODO: .refine(data => data.topic_id !== null || !!data.topic_name_new, { ... })
}).strict();

// TODO: Run conceptInputSchema.safeParse on input; map ZodError issues to FieldError[]
// with dotted paths (e.g. "comparisons[0].difference"); return { ok, errors }.
export function validateConcept(input: ConceptInput): ValidationResult {
  // TODO: const result = conceptInputSchema.safeParse(input)
  // TODO: if (result.success) return { ok: true, errors: [] }
  // TODO: return { ok: false, errors: result.error.issues.map(issue => ({ field: issue.path.join("."), message: issue.message })) }
  return { ok: true, errors: [] };
}
