"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Concept, UUID } from "@/types";
import ConceptForm from "./ConceptForm";

interface ConceptDetailProps {
  conceptId: UUID;
}

async function fetchConcept(conceptId: UUID): Promise<Concept> {
  const res = await fetch(`/api/concepts/${conceptId}`);
  if (res.status === 401) throw Object.assign(new Error("Unauthenticated"), { status: 401 });
  if (res.status === 404) throw Object.assign(new Error("Not found"), { status: 404 });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const body = await res.json();
  return body.data as Concept;
}

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`rounded bg-gray-100 dark:bg-gray-800 animate-pulse ${className}`} />;
}

function LoadingSkeleton() {
  return (
    <div className="p-6 space-y-5 max-w-2xl">
      <SkeletonBlock className="h-7 w-2/3" />
      <SkeletonBlock className="h-4 w-full" />
      <SkeletonBlock className="h-4 w-5/6" />
      <SkeletonBlock className="h-20 w-full" />
    </div>
  );
}

export default function ConceptDetail({ conceptId }: ConceptDetailProps) {
  const router = useRouter();

  const [concept, setConcept] = useState<Concept | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchConcept(conceptId)
      .then(setConcept)
      .catch((err: Error & { status?: number }) => {
        if (err.status === 401) {
          router.push(`/login?returnUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`);
        } else {
          setError(err);
        }
      })
      .finally(() => setLoading(false));
  }, [conceptId, router]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    if (!concept) return;
    const confirmed = window.confirm(`Delete "${concept.title}"? This cannot be undone.`);
    if (!confirmed) return;

    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/concepts/${concept.id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setDeleteError(body?.error?.message ?? "Failed to delete. Please try again.");
        return;
      }
      // Navigate back to topic, removing concept param
      const url = new URL(window.location.href);
      url.searchParams.delete("concept");
      router.push(url.pathname + url.search);
    } catch {
      setDeleteError("Network error. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <LoadingSkeleton />;

  if (error?.message === "Not found" || (error as (Error & { status?: number }) | null)?.status === 404) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500 dark:text-gray-400 text-sm">Card not found.</p>
        <button
          type="button"
          onClick={() => {
            const url = new URL(window.location.href);
            url.searchParams.delete("concept");
            router.push(url.pathname + url.search);
          }}
          className="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          Back to topic
        </button>
      </div>
    );
  }

  if (error || !concept) {
    return (
      <div className="p-6 text-sm text-red-600 dark:text-red-400">
        Failed to load card.
      </div>
    );
  }

  if (editing) {
    return (
      <ConceptForm
        initial={concept}
        onSuccess={(updated) => {
          setConcept(updated);
          setEditing(false);
        }}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <article className="p-6 max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 leading-snug">
          {concept.title}
        </h1>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="px-3 py-1.5 text-sm rounded-md border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition-colors disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>

      {deleteError && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {deleteError}
        </p>
      )}

      {/* What it does */}
      <section aria-labelledby="what-it-does-label">
        <h2 id="what-it-does-label" className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
          What it does
        </h2>
        <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{concept.what_it_does}</p>
      </section>

      {/* Comparisons */}
      {concept.comparisons.length > 0 && (
        <section aria-labelledby="comparisons-label">
          <h2 id="comparisons-label" className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
            Comparisons
          </h2>
          <ul className="space-y-3">
            {concept.comparisons
              .slice()
              .sort((a, b) => a.position - b.position)
              .map((c) => (
                <li key={c.id} className="rounded-md border border-gray-200 dark:border-gray-700 p-3 text-sm">
                  <span className="font-medium text-gray-900 dark:text-gray-100">{c.alternative}</span>
                  <span className="mx-2 text-gray-400">—</span>
                  <span className="text-gray-700 dark:text-gray-300">{c.difference}</span>
                </li>
              ))}
          </ul>
        </section>
      )}

      {/* When it breaks */}
      <section aria-labelledby="when-it-breaks-label">
        <h2 id="when-it-breaks-label" className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
          When it breaks
        </h2>
        <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{concept.when_it_breaks}</p>
      </section>

      {/* Explain in 30s */}
      <section aria-labelledby="explain-label">
        <h2 id="explain-label" className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
          Explain in 30s
        </h2>
        <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{concept.explain_in_30s}</p>
      </section>

      {/* Where I used it */}
      <section aria-labelledby="where-used-label">
        <h2 id="where-used-label" className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
          Where I used it
        </h2>
        <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{concept.where_i_used_it}</p>
      </section>

      {/* Tags */}
      {concept.tags.length > 0 && (
        <section aria-labelledby="tags-label">
          <h2 id="tags-label" className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
            Tags
          </h2>
          <ul aria-label="Tags" className="flex flex-wrap gap-1.5">
            {concept.tags.map((tag) => (
              <li
                key={tag}
                className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-xs text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
              >
                {tag}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Image */}
      {concept.image && (
        <section aria-labelledby="image-label">
          <h2 id="image-label" className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
            Diagram
          </h2>
          <img
            src={concept.image.url}
            alt={`Diagram for ${concept.title}`}
            width={concept.image.width}
            height={concept.image.height}
            className="w-full rounded-md border border-gray-200 dark:border-gray-700 object-contain"
          />
        </section>
      )}
    </article>
  );
}
