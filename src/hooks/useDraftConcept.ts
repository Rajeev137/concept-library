"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DraftConcept, UUID } from "@/types";

function storageKey(topicId: UUID | "new"): string {
  return `draft:concept:${topicId}`;
}

function readDraft(topicId: UUID | "new"): DraftConcept | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(storageKey(topicId));
    return raw ? (JSON.parse(raw) as DraftConcept) : null;
  } catch {
    return null;
  }
}

export function useDraftConcept(topicId: UUID | "new"): {
  draft: DraftConcept | null;
  save: (draft: DraftConcept) => void;
  clear: () => void;
} {
  const [draft, setDraft] = useState<DraftConcept | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setDraft(readDraft(topicId));
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, [topicId]);

  const save = useCallback(
    (next: DraftConcept) => {
      setDraft(next);
      if (timerRef.current !== null) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        if (typeof window !== "undefined") {
          localStorage.setItem(storageKey(topicId), JSON.stringify(next));
        }
        timerRef.current = null;
      }, 1000);
    },
    [topicId],
  );

  const clear = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setDraft(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(storageKey(topicId));
    }
  }, [topicId]);

  return { draft, save, clear };
}
