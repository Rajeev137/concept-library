import { z } from "zod";
import type { ConceptInput, ValidationResult } from "@/types";

const conceptImageSchema = z
  .object({
    url: z.string().url(),
    path: z.string().min(1),
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
    uploaded_at: z.string().min(1),
  })
  .strict();

const comparisonInputSchema = z
  .object({
    alternative: z.string().trim().min(1, "Required"),
    difference: z.string().trim().min(1, "Required"),
    position: z.number().int().min(0),
  })
  .strict();

export const conceptInputSchema = z
  .object({
    topic_id: z.string().uuid().nullable(),
    topic_name_new: z.string().trim().min(1).optional(),
    title: z.string().trim().min(1, "Required"),
    what_it_does: z.string().trim().min(1, "Required"),
    comparisons: z
      .array(comparisonInputSchema)
      .min(1, "At least one comparison required"),
    when_it_breaks: z.string().trim().min(1, "Required"),
    explain_in_30s: z.string().trim().min(1, "Required"),
    where_i_used_it: z.string().trim().min(1, "Required"),
    tags: z.array(z.string().trim().min(1)),
    image: conceptImageSchema.nullable(),
  })
  .strict()
  .refine((data) => data.topic_id !== null || !!data.topic_name_new, {
    message: "Either topic_id or topic_name_new is required",
    path: ["topic_id"],
  });

export function validateConcept(input: ConceptInput): ValidationResult {
  const result = conceptInputSchema.safeParse(input);
  if (result.success) return { ok: true, errors: [] };
  return {
    ok: false,
    errors: result.error.issues.map((issue) => ({
      field: issue.path
        .map((seg, i) =>
          typeof seg === "number"
            ? `[${seg}]`
            : i === 0
            ? seg
            : `.${seg}`
        )
        .join(""),
      message: issue.message,
    })),
  };
}
