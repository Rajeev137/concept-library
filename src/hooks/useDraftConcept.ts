"use client";

import type { DraftConcept, ConceptInput, UUID } from "@/types";
import { useLocalStorage } from "./useLocalStorage";

// Auto-saves partial ConceptInput to localStorage under "draft:concept:{topicKey}".
// topicKey is the topic_id UUID or "new" when no topic is selected yet.
// Auto-save fires every 1s via useEffect + setInterval.
// Returns { draft, updateDraft, clearDraft }.
//
// TODO: build localStorage key from topicKey: `draft:concept:${topicKey}`
// TODO: useLocalStorage to read/write the DraftConcept value
// TODO: updateDraft: merge partial updates and write updated_at = new Date().toISOString()
// TODO: auto-save effect: setInterval 1000ms; clears on unmount
// TODO: clearDraft: remove the key from localStorage (called on successful form submit)
export function useDraftConcept(topicKey: UUID | "new") {
  const key = `draft:concept:${topicKey}`;
  const [draft, setDraft] = useLocalStorage<DraftConcept | null>(key, null);

  // TODO: implement updateDraft(partial: Partial<ConceptInput>): void
  function updateDraft(partial: Partial<ConceptInput>): void {
    // TODO: setDraft(prev => ({ ...(prev ?? { topic_id: null, partial: {} }), partial: { ...prev?.partial, ...partial }, updated_at: new Date().toISOString() }))
  }

  // TODO: implement clearDraft(): void
  function clearDraft(): void {
    // TODO: localStorage.removeItem(key); setDraft(null)
  }

  return { draft, updateDraft, clearDraft };
}
