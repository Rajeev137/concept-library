import type { ConceptInput } from "@/types";

// Mirror of REQUIRED_STRINGS from interfaces.ts — used in Zod schema construction.
export const REQUIRED_CONCEPT_STRINGS: (keyof ConceptInput)[] = [
  "title",
  "what_it_does",
  "when_it_breaks",
  "explain_in_30s",
  "where_i_used_it",
];
