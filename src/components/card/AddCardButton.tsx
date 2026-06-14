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
      <button
        type="button"
        aria-label="Add card"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 left-6 z-40 flex items-center gap-2 px-4 py-3 rounded-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-medium shadow-lg hover:bg-gray-700 dark:hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 dark:focus:ring-gray-100 transition-colors"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M8 3v10M3 8h10"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        Add card
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Add concept"
          className="fixed inset-0 z-50 flex items-start justify-center"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
            onClick={handleCancel}
            aria-hidden="true"
          />

          {/* Modal panel */}
          <div className="relative z-10 mt-8 mb-8 w-full max-w-2xl max-h-[calc(100vh-4rem)] overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xl p-6">
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
