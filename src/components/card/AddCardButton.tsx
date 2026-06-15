"use client";

import { useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import ConceptForm from "@/components/card/ConceptForm";
import type { Concept, UUID } from "@/types";

export default function AddCardButton() {
  const searchParams = useSearchParams();
  const topicParam = searchParams.get("topic");
  const topicId: UUID | undefined = topicParam ?? undefined;

  const [open, setOpen] = useState(false);

  const handleSuccess = useCallback((concept: Concept) => {
    setOpen(false);
    // Dispatch a custom event so the concept list can refresh without prop-drilling
    window.dispatchEvent(new CustomEvent("concept:created", { detail: concept }));
  }, []);

  const handleCancel = useCallback(() => setOpen(false), []);

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50 group">
        <button
          type="button"
          aria-label="New concept"
          onClick={() => setOpen(true)}
          className="flex items-center justify-center w-14 h-14 rounded-full bg-[var(--bg-accent)] text-[var(--text-on-accent)] shadow-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--bg-accent)] transition-colors"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M8 3v10M3 8h10"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap rounded bg-[var(--bg-accent)] px-2 py-1 text-xs text-[var(--text-on-accent)] opacity-0 group-hover:opacity-100 transition-opacity">
          New concept
        </span>
      </div>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Add concept"
          className="fixed inset-0 z-50 flex items-start justify-center"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={handleCancel}
            aria-hidden="true"
          />

          {/* Modal panel */}
          <div className="relative z-10 mt-8 mb-8 w-full max-w-2xl max-h-[calc(100vh-4rem)] overflow-y-auto rounded-xl border border-[var(--border-default)] bg-[var(--bg-primary)] shadow-xl p-6">
            <ConceptForm
              defaultTopicId={topicId}
              onSuccess={handleSuccess}
              onCancel={handleCancel}
            />
          </div>
        </div>
      )}
    </>
  );
}
