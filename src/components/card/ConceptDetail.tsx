"use client";

import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Concept, UUID } from "@/types";
import ConceptForm from "./ConceptForm";

interface ConceptDetailProps {
  conceptId: UUID;
  onEdit: () => void;
  onDelete: () => void;
  onTagClick?: (tag: string) => void;
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
  return <div className={`rounded bg-gray-100 dark:bg-gray-800 animate-pulse ${className ?? ""}`} />;
}

function LoadingSkeleton() {
  return (
    <div className="p-6 space-y-5 max-w-2xl" aria-busy="true" aria-label="Loading concept">
      <SkeletonBlock className="h-7 w-2/3" />
      <SkeletonBlock className="h-4 w-full" />
      <SkeletonBlock className="h-4 w-5/6" />
      <SkeletonBlock className="h-20 w-full" />
      <SkeletonBlock className="h-4 w-3/4" />
      <SkeletonBlock className="h-16 w-full" />
    </div>
  );
}

interface DeleteDialogProps {
  onConfirm: () => void;
  onCancel: () => void;
  deleting: boolean;
}

function DeleteDialog({ onConfirm, onCancel, deleting }: DeleteDialogProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      <div className="absolute inset-0 bg-black/30" onClick={onCancel} aria-hidden="true" />
      <div className="relative z-10 bg-white dark:bg-gray-900 rounded-lg shadow-xl p-6 max-w-sm w-full mx-4 border border-gray-200 dark:border-gray-700">
        <h2 id="delete-dialog-title" className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Delete this concept?
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">
          This cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="px-3 py-1.5 text-sm rounded-md bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ConceptDetail({ conceptId, onEdit, onDelete, onTagClick }: ConceptDetailProps) {
  const router = useRouter();

  const [concept, setConcept] = useState<Concept | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<(Error & { status?: number }) | null>(null);
  const [editing, setEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [imageExpanded, setImageExpanded] = useState(true);

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

  const handleDeleteConfirm = async () => {
    if (!concept) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/concepts/${concept.id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setDeleteError((body as { error?: { message?: string } })?.error?.message ?? "Failed to delete. Please try again.");
        setDeleting(false);
        return;
      }
      setShowDeleteDialog(false);
      onDelete();
    } catch {
      setDeleteError("Network error. Please try again.");
      setDeleting(false);
    }
  };

  if (loading) return <LoadingSkeleton />;

  if (error?.status === 404 || error?.message === "Not found") {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500 dark:text-gray-400 text-sm">Concept not found</p>
      </div>
    );
  }

  if (error || !concept) {
    return (
      <div className="p-6 text-sm text-red-600 dark:text-red-400">
        Failed to load concept.
      </div>
    );
  }

  if (editing) {
    return (
      <ConceptForm
        concept={concept}
        onSuccess={(updated) => {
          setConcept(updated);
          setEditing(false);
          onEdit();
        }}
        onCancel={() => setEditing(false)}
      />
    );
  }

  const sortedComparisons = concept.comparisons.slice().sort((a, b) => a.position - b.position);

  return (
    <>
      {showDeleteDialog && (
        <DeleteDialog
          onConfirm={handleDeleteConfirm}
          onCancel={() => { if (!deleting) setShowDeleteDialog(false); }}
          deleting={deleting}
        />
      )}

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
              onClick={() => setShowDeleteDialog(true)}
              className="px-3 py-1.5 text-sm rounded-md border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
            >
              Delete
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
        {sortedComparisons.length > 0 && (
          <section aria-labelledby="comparisons-label">
            <h2 id="comparisons-label" className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
              Comparisons
            </h2>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-1.5 pr-4 font-medium text-gray-600 dark:text-gray-400 w-1/3">
                    Alternative
                  </th>
                  <th className="text-left py-1.5 font-medium text-gray-600 dark:text-gray-400">
                    Difference
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedComparisons.map((c) => (
                  <tr key={c.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                    <td className="py-2 pr-4 font-medium text-gray-900 dark:text-gray-100 align-top">
                      {c.alternative}
                    </td>
                    <td className="py-2 text-gray-700 dark:text-gray-300 align-top">
                      {c.difference}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
          <blockquote className="border-l-4 border-blue-400 dark:border-blue-600 bg-blue-50 dark:bg-blue-950/40 pl-4 pr-3 py-3 rounded-r-md text-sm text-gray-800 dark:text-gray-200 italic whitespace-pre-wrap">
            {concept.explain_in_30s}
          </blockquote>
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
                <li key={tag}>
                  <button
                    type="button"
                    onClick={() => onTagClick?.(tag)}
                    className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-xs text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    {tag}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Image */}
        {concept.image && (
          <section aria-labelledby="image-label">
            <button
              type="button"
              id="image-label"
              onClick={() => setImageExpanded((v) => !v)}
              aria-expanded={imageExpanded}
              className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors mb-2"
            >
              <span
                className={`inline-block transition-transform ${imageExpanded ? "rotate-90" : ""}`}
                aria-hidden="true"
              >
                ▶
              </span>
              Diagram
            </button>
            {imageExpanded && (
              <div className="relative w-full aspect-video">
                <Image
                  src={concept.image.url}
                  alt={`Diagram for ${concept.title}`}
                  fill
                  className="rounded-md border border-gray-200 dark:border-gray-700 object-contain"
                />
              </div>
            )}
          </section>
        )}
      </article>
    </>
  );
}
