"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Concept } from "@/types";
import { useConceptEventRefresh } from "@/hooks/useEventRefresh";

interface ConceptListProps {
  topicId?: string;
  activeConceptId?: string;
  onConceptClick: (id: string) => void;
}

function SkeletonRow() {
  return (
    <div className="h-9 mx-2 my-0.5 rounded-md bg-[var(--bg-tertiary)] animate-pulse" />
  );
}

export default function ConceptList({ topicId, activeConceptId, onConceptClick }: ConceptListProps) {
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const scrollRef = useRef<HTMLUListElement>(null);
  const storageKey = `scroll:topic:${topicId ?? "all"}`;

  const load = useCallback(() => {
    const url = topicId ? `/api/topics/${topicId}/concepts` : "/api/concepts";
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(url)
      .then((res) => {
        if (res.status === 401) throw Object.assign(new Error("Unauthenticated"), { status: 401 });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((body) => {
        if (!cancelled) setConcepts(body.data as Concept[]);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [topicId]);

  useEffect(() => load(), [load]);

  useConceptEventRefresh(load);

  useEffect(() => {
    if (!loading && scrollRef.current) {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) scrollRef.current.scrollTop = parseInt(saved, 10);
    }
  }, [loading, storageKey]);

  const handleScroll = useCallback(() => {
    if (scrollRef.current) {
      sessionStorage.setItem(storageKey, String(scrollRef.current.scrollTop));
    }
  }, [storageKey]);

  if (loading) {
    return (
      <section aria-label="Concepts" aria-busy="true" className="py-1">
        {[1, 2, 3].map((i) => <SkeletonRow key={i} />)}
      </section>
    );
  }

  if (error) {
    return (
      <section aria-label="Concepts" className="px-3 py-4 text-sm text-[var(--danger)]">
        Failed to load concepts.
      </section>
    );
  }

  if (concepts.length === 0) {
    return (
      <section aria-label="Concepts" className="px-3 py-6 text-center">
        <p className="text-sm text-[var(--text-muted)]">No concepts yet</p>
      </section>
    );
  }

  return (
    <section aria-label="Concepts">
      <ul
        ref={scrollRef}
        onScroll={handleScroll}
        className="overflow-y-auto max-h-[calc(100vh-12rem)] space-y-0.5 py-1"
      >
        {concepts.map((concept) => {
          const isActive = concept.id === activeConceptId;
          return (
            <li key={concept.id}>
              <button
                type="button"
                onClick={() => onConceptClick(concept.id)}
                aria-current={isActive ? "true" : undefined}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors truncate ${
                  isActive
                    ? "bg-[var(--bg-tertiary)] text-[var(--text-primary)] font-medium border-l-2 border-[var(--bg-accent)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
                }`}
              >
                {concept.title}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
