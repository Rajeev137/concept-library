"use client";

import { useEffect } from "react";
import type { UUID } from "@/types";
import type { ConceptSavedDetail, ConceptDeletedDetail } from "@/lib/events";

interface UseEventRefreshOptions {
  onConceptSaved: (topicId: UUID) => void;
  onConceptDeleted: (topicId: UUID) => void;
}

export function useEventRefresh({ onConceptSaved, onConceptDeleted }: UseEventRefreshOptions) {
  useEffect(() => {
    function handleSaved(e: Event) {
      const { topic_id } = (e as CustomEvent<ConceptSavedDetail>).detail;
      onConceptSaved(topic_id);
    }
    function handleDeleted(e: Event) {
      const { topic_id } = (e as CustomEvent<ConceptDeletedDetail>).detail;
      onConceptDeleted(topic_id);
    }
    window.addEventListener("concept:saved", handleSaved);
    window.addEventListener("concept:deleted", handleDeleted);
    return () => {
      window.removeEventListener("concept:saved", handleSaved);
      window.removeEventListener("concept:deleted", handleDeleted);
    };
  }, [onConceptSaved, onConceptDeleted]);
}
