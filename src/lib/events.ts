import type { UUID } from "@/types";

export interface ConceptSavedDetail {
  concept_id: UUID;
  topic_id: UUID;
}

export interface ConceptDeletedDetail {
  concept_id: UUID;
  topic_id: UUID;
}

export function emitConceptSaved(detail: ConceptSavedDetail) {
  window.dispatchEvent(new CustomEvent("concept:saved", { detail }));
}

export function emitConceptDeleted(detail: ConceptDeletedDetail) {
  window.dispatchEvent(new CustomEvent("concept:deleted", { detail }));
}
