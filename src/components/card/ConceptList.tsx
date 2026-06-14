"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Concept, UUID } from "@/types";

interface ConceptListProps {
  topicId: UUID;
  activeConceptId?: UUID;
  onConceptClick: (conceptId: UUID) => void;
}

async function fetchConcepts(topicId: UUID): Promise<Concept[]> {
  const res = await fetch(`/api/topics/${topicId}/concepts`);
  if (res.status === 401) throw Object.assign(new Error("Unauthenticated"), { status: 401 });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const body = await res.json();
  return body.data as Concept[];
}

function SkeletonRow() {
  return (
    <div className="h-9 mx-2 my-0.5 rounded-md bg-gray-100 dark:bg-gray-800 animate-pulse" />
  );
}

export default function ConceptList({ topicId, activeConceptId, onConceptClick }: ConceptListProps) {
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const scrollRef = useRef<HTMLUListElement>(null);
  const storageKey = `scroll:topic:${topicId}`;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchConcepts(topicId)
      .then((data) => {
        if (!cancelled) setConcepts(data);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [topicId]);

  // Restore scroll position after load
  useEffect(() => {
    if (!loading && scrollRef.current) {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) scrollRef.current.scrollTop = parseInt(saved, 10);
    }
  }, [loading, storageKey]);

  // Persist scroll position on scroll
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
      <section aria-label="Concepts" className="px-3 py-4 text-sm text-red-600 dark:text-red-400">
        Failed to load concepts.
      </section>
    );
  }

  if (concepts.length === 0) {
    return (
      <section aria-label="Concepts" className="px-3 py-6 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">No cards yet.</p>
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
                    ? "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-medium"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
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
