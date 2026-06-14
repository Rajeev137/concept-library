"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type {
  Concept,
  ConceptInput,
  ComparisonInput,
  ConceptImage,
  Topic,
  UUID,
  DraftConcept,
  ApiResult,
} from "@/types";
import { useDraftConcept } from "@/hooks/useDraftConcept";
import { validateConcept } from "@/lib/validators/concept";
import TagInput from "@/components/ui/TagInput";

interface ConceptFormProps {
  concept?: Concept;
  defaultTopicId?: UUID;
  onSuccess: (concept: Concept) => void;
  onCancel: () => void;
}

interface FormState {
  topic_id: UUID | null;
  topic_name_new: string;
  title: string;
  what_it_does: string;
  when_it_breaks: string;
  explain_in_30s: string;
  where_i_used_it: string;
  tags: string[];
}

const EMPTY_COMPARISON: ComparisonInput = { alternative: "", difference: "", position: 0 };

function toComparisonInputs(concept: Concept): ComparisonInput[] {
  if (!concept.comparisons.length) return [{ ...EMPTY_COMPARISON }];
  return concept.comparisons
    .slice()
    .sort((a, b) => a.position - b.position)
    .map(({ alternative, difference, position }) => ({ alternative, difference, position }));
}

export default function ConceptForm({ concept, defaultTopicId, onSuccess, onCancel }: ConceptFormProps) {
  const draftKey: UUID | "new" = defaultTopicId ?? "new";
  const { draft, save: saveDraft, clear: clearDraft } = useDraftConcept(draftKey);

  const [form, setForm] = useState<FormState>(() => {
    if (concept) {
      return {
        topic_id: concept.topic_id,
        topic_name_new: "",
        title: concept.title,
        what_it_does: concept.what_it_does,
        when_it_breaks: concept.when_it_breaks,
        explain_in_30s: concept.explain_in_30s,
        where_i_used_it: concept.where_i_used_it,
        tags: concept.tags,
      };
    }
    if (draft?.partial) {
      const p = draft.partial;
      return {
        topic_id: draft.topic_id ?? defaultTopicId ?? null,
        topic_name_new: draft.topic_name_new ?? "",
        title: p.title ?? "",
        what_it_does: p.what_it_does ?? "",
        when_it_breaks: p.when_it_breaks ?? "",
        explain_in_30s: p.explain_in_30s ?? "",
        where_i_used_it: p.where_i_used_it ?? "",
        tags: p.tags ?? [],
      };
    }
    return {
      topic_id: defaultTopicId ?? null,
      topic_name_new: "",
      title: "",
      what_it_does: "",
      when_it_breaks: "",
      explain_in_30s: "",
      where_i_used_it: "",
      tags: [],
    };
  });

  const [comparisons, setComparisons] = useState<ComparisonInput[]>(() => {
    if (concept) return toComparisonInputs(concept);
    if (draft?.partial?.comparisons?.length) return draft.partial.comparisons;
    return [{ ...EMPTY_COMPARISON }];
  });

  const [image, setImage] = useState<ConceptImage | null>(() => {
    if (concept) return concept.image;
    return draft?.partial?.image ?? null;
  });

  const [imageExpanded, setImageExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [topics, setTopics] = useState<Topic[]>([]);
  const [topicQuery, setTopicQuery] = useState("");
  const [topicDropdownOpen, setTopicDropdownOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [offlineRetry, setOfflineRetry] = useState(false);
  const pendingInputRef = useRef<ConceptInput | null>(null);

  const topicInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load topic label for initial/draft topic_id
  useEffect(() => {
    if (!form.topic_id && !form.topic_name_new) return;
    if (form.topic_name_new) {
      setTopicQuery(form.topic_name_new);
      return;
    }
    // Will be resolved when topics load
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch topics for combobox
  useEffect(() => {
    fetch("/api/topics")
      .then((r) => r.json() as Promise<ApiResult<Topic[]>>)
      .then((res) => {
        if (res.ok) {
          setTopics(res.data);
          // Resolve label for existing topic_id
          if (form.topic_id) {
            const match = res.data.find((t) => t.id === form.topic_id);
            if (match) {
              setTopicQuery(match.name);
            }
          }
        }
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-save draft every 1s
  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleDraftSave = useCallback(() => {
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    draftTimerRef.current = setTimeout(() => {
      const next: DraftConcept = {
        topic_id: form.topic_id,
        topic_name_new: form.topic_name_new || undefined,
        partial: {
          title: form.title,
          what_it_does: form.what_it_does,
          comparisons,
          when_it_breaks: form.when_it_breaks,
          explain_in_30s: form.explain_in_30s,
          where_i_used_it: form.where_i_used_it,
          tags: form.tags,
          image,
        },
        updated_at: new Date().toISOString(),
      };
      saveDraft(next);
    }, 1000);
  }, [form, comparisons, image, saveDraft]);

  useEffect(() => {
    if (!concept) scheduleDraftSave();
    return () => {
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    };
  }, [form, comparisons, image]); // eslint-disable-line react-hooks/exhaustive-deps

  // When browser comes back online after a failed submit, swap the error for the retry toast
  useEffect(() => {
    if (!offlineRetry) return;
    function handleOnline() {
      setSubmitError(null);
      // offlineRetry stays true so the "Back online — tap to retry" toast renders
    }
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [offlineRetry]);

  // Topic combobox helpers
  const filteredTopics = topics.filter((t) =>
    t.name.toLowerCase().includes(topicQuery.toLowerCase())
  );
  const showNewTopicOption =
    topicQuery.trim().length > 0 &&
    !topics.some((t) => t.name.toLowerCase() === topicQuery.trim().toLowerCase());

  function handleTopicInput(value: string) {
    setTopicQuery(value);
    setTopicDropdownOpen(true);
    // If user clears input, clear selection
    if (!value.trim()) {
      setForm((f) => ({ ...f, topic_id: null, topic_name_new: "" }));
    } else {
      // Treat as new name until user picks from list
      setForm((f) => ({ ...f, topic_id: null, topic_name_new: value.trim() }));
    }
    setFieldErrors((e) => ({ ...e, topic_id: "" }));
  }

  function selectExistingTopic(topic: Topic) {
    setForm((f) => ({ ...f, topic_id: topic.id, topic_name_new: "" }));
    setTopicQuery(topic.name);
    setTopicDropdownOpen(false);
    setFieldErrors((e) => ({ ...e, topic_id: "" }));
  }

  function selectNewTopic(name: string) {
    setForm((f) => ({ ...f, topic_id: null, topic_name_new: name.trim() }));
    setTopicQuery(name.trim());
    setTopicDropdownOpen(false);
    setFieldErrors((e) => ({ ...e, topic_id: "" }));
  }

  // Comparison helpers
  function addComparison() {
    setComparisons((prev) => [
      ...prev,
      { alternative: "", difference: "", position: prev.length },
    ]);
  }

  function removeComparison(index: number) {
    if (comparisons.length <= 1) return;
    setComparisons((prev) =>
      prev.filter((_, i) => i !== index).map((c, i) => ({ ...c, position: i }))
    );
  }

  function moveComparison(index: number, dir: -1 | 1) {
    const next = [...comparisons];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setComparisons(next.map((c, i) => ({ ...c, position: i })));
  }

  function updateComparison(index: number, field: "alternative" | "difference", value: string) {
    setComparisons((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c))
    );
    setFieldErrors((e) => ({ ...e, [`comparisons[${index}].${field}`]: "" }));
  }

  // Image upload
  async function handleFileUpload(file: File) {
    setUploading(true);
    setUploadError(null);
    setUploadProgress(null);

    const LARGE_FILE_THRESHOLD = 4 * 1024 * 1024;

    if (file.size > LARGE_FILE_THRESHOLD) {
      try {
        const signRes = await fetch("/api/uploads/concept-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "create-signed-url",
            concept_id: concept?.id ?? "draft",
            filename: file.name,
            mime_type: file.type,
          }),
        });
        const signData = (await signRes.json()) as ApiResult<{ signed_url: string; path: string; url: string }>;
        if (!signData.ok) {
          setUploadError(signData.error.message);
          return;
        }

        const { signed_url, path, url } = signData.data;

        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("PUT", signed_url);
          xhr.setRequestHeader("Content-Type", file.type);
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100));
          };
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) resolve();
            else reject(new Error(`Upload failed with status ${xhr.status}`));
          };
          xhr.onerror = () => reject(new Error("Network error during upload"));
          xhr.send(file);
        });

        setImage({ url, path, uploaded_at: new Date().toISOString() });
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : "Upload failed. Please try again.");
      } finally {
        setUploading(false);
        setUploadProgress(null);
      }
      return;
    }

    const body = new FormData();
    body.append("file", file);
    body.append("concept_id", concept?.id ?? "draft");
    try {
      const res = await fetch("/api/uploads/concept-image", { method: "POST", body });
      const data = (await res.json()) as ApiResult<{ url: string; path: string }>;
      if (!data.ok) {
        setUploadError(data.error.message);
        return;
      }
      setImage({ url: data.data.url, path: data.data.path, uploaded_at: new Date().toISOString() });
    } catch {
      setUploadError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  }

  function removeImage() {
    setImage(null);
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // Submit
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    setOfflineRetry(false);

    const input: ConceptInput = {
      topic_id: form.topic_id,
      topic_name_new: form.topic_name_new || undefined,
      title: form.title,
      what_it_does: form.what_it_does,
      comparisons: comparisons.map((c, i) => ({ ...c, position: i })),
      when_it_breaks: form.when_it_breaks,
      explain_in_30s: form.explain_in_30s,
      where_i_used_it: form.where_i_used_it,
      tags: form.tags,
      image,
    };

    const validation = validateConcept(input);
    if (!validation.ok) {
      const errs: Record<string, string> = {};
      for (const e of validation.errors) errs[e.field] = e.message;
      setFieldErrors(errs);
      return;
    }

    setSubmitting(true);
    try {
      const url = concept ? `/api/concepts/${concept.id}` : "/api/concepts";
      const method = concept ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (res.status === 503) {
        pendingInputRef.current = input;
        setOfflineRetry(true);
        setSubmitError("You appear to be offline. Your draft is saved locally.");
        return;
      }
      const data = (await res.json()) as ApiResult<Concept>;
      if (!data.ok) {
        if (res.status === 422 && data.error.fields) {
          const errs: Record<string, string> = {};
          for (const fe of data.error.fields) errs[fe.field] = fe.message;
          setFieldErrors(errs);
        } else if (res.status === 409) {
          setSubmitError("A card with this title already exists in this topic.");
        } else {
          setSubmitError(data.error.message);
        }
        return;
      }
      clearDraft();
      onSuccess(data.data);
    } catch {
      pendingInputRef.current = input;
      setOfflineRetry(true);
      setSubmitError("You appear to be offline. Your draft is saved locally.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRetry() {
    if (!pendingInputRef.current) return;
    setSubmitError(null);
    setOfflineRetry(false);
    setSubmitting(true);
    try {
      const url = concept ? `/api/concepts/${concept.id}` : "/api/concepts";
      const method = concept ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pendingInputRef.current),
      });
      if (res.status === 503) {
        setOfflineRetry(true);
        setSubmitError("You appear to be offline. Your draft is saved locally.");
        return;
      }
      const data = (await res.json()) as ApiResult<Concept>;
      if (!data.ok) {
        setSubmitError(data.error.message);
        return;
      }
      pendingInputRef.current = null;
      clearDraft();
      onSuccess(data.data);
    } catch {
      setOfflineRetry(true);
      setSubmitError("You appear to be offline. Your draft is saved locally.");
    } finally {
      setSubmitting(false);
    }
  }

  function fieldClass(name: string) {
    const base =
      "w-full rounded-md border px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 transition-colors";
    return fieldErrors[name]
      ? `${base} border-red-400 dark:border-red-500 focus:ring-red-300 dark:focus:ring-red-700`
      : `${base} border-gray-300 dark:border-gray-600 focus:ring-blue-300 dark:focus:ring-blue-700`;
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5 max-w-2xl w-full mx-auto px-1">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        {concept ? "Edit Concept" : "New Concept"}
      </h2>

      {/* Topic combobox */}
      <div className="relative flex flex-col gap-1">
        <label htmlFor="topic-input" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Topic <span className="text-red-500">*</span>
        </label>
        <input
          id="topic-input"
          ref={topicInputRef}
          type="text"
          autoComplete="off"
          placeholder="Search or create a topic…"
          value={topicQuery}
          onChange={(e) => handleTopicInput(e.target.value)}
          onFocus={() => setTopicDropdownOpen(true)}
          onBlur={() => setTimeout(() => setTopicDropdownOpen(false), 150)}
          className={fieldClass("topic_id")}
        />
        {topicDropdownOpen && (filteredTopics.length > 0 || showNewTopicOption) && (
          <ul
            role="listbox"
            className="absolute top-full left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg"
          >
            {filteredTopics.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={form.topic_id === t.id}
                  onMouseDown={() => selectExistingTopic(t)}
                  className="w-full text-left px-3 py-2 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  {t.name}
                  <span className="ml-2 text-xs text-gray-400">{t.concept_count}</span>
                </button>
              </li>
            ))}
            {showNewTopicOption && (
              <li>
                <button
                  type="button"
                  role="option"
                  aria-selected={false}
                  onMouseDown={() => selectNewTopic(topicQuery)}
                  className="w-full text-left px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  Create &ldquo;{topicQuery.trim()}&rdquo;
                </button>
              </li>
            )}
          </ul>
        )}
        {fieldErrors["topic_id"] && (
          <p className="text-xs text-red-500">{fieldErrors["topic_id"]}</p>
        )}
      </div>

      {/* Title */}
      <div className="flex flex-col gap-1">
        <label htmlFor="title" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          type="text"
          value={form.title}
          onChange={(e) => {
            setForm((f) => ({ ...f, title: e.target.value }));
            setFieldErrors((err) => ({ ...err, title: "" }));
          }}
          className={fieldClass("title")}
          placeholder="e.g. React useCallback"
        />
        {fieldErrors["title"] && (
          <p className="text-xs text-red-500">{fieldErrors["title"]}</p>
        )}
      </div>

      {/* What it does */}
      <div className="flex flex-col gap-1">
        <label htmlFor="what_it_does" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          What it does <span className="text-red-500">*</span>
        </label>
        <textarea
          id="what_it_does"
          rows={3}
          value={form.what_it_does}
          onChange={(e) => {
            setForm((f) => ({ ...f, what_it_does: e.target.value }));
            setFieldErrors((err) => ({ ...err, what_it_does: "" }));
          }}
          className={fieldClass("what_it_does")}
          placeholder="Describe what this concept does…"
        />
        {fieldErrors["what_it_does"] && (
          <p className="text-xs text-red-500">{fieldErrors["what_it_does"]}</p>
        )}
      </div>

      {/* Comparisons */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Comparisons <span className="text-red-500">*</span>
          </span>
          <button
            type="button"
            onClick={addComparison}
            className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            + Add comparison
          </button>
        </div>
        {fieldErrors["comparisons"] && (
          <p className="text-xs text-red-500">{fieldErrors["comparisons"]}</p>
        )}
        {comparisons.map((c, i) => (
          <div
            key={i}
            className="flex flex-col gap-2 rounded-lg border border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-800/50"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Comparison {i + 1}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label="Move up"
                  disabled={i === 0}
                  onClick={() => moveComparison(i, -1)}
                  className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <path d="M6 9V3M3 6l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <button
                  type="button"
                  aria-label="Move down"
                  disabled={i === comparisons.length - 1}
                  onClick={() => moveComparison(i, 1)}
                  className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <path d="M6 3v6M3 6l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <button
                  type="button"
                  aria-label="Remove comparison"
                  disabled={comparisons.length <= 1}
                  onClick={() => removeComparison(i)}
                  className="p-1 rounded text-gray-400 hover:text-red-500 dark:hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 dark:text-gray-400">Alternative</label>
              <input
                type="text"
                value={c.alternative}
                onChange={(e) => updateComparison(i, "alternative", e.target.value)}
                placeholder="e.g. useMemo"
                className={fieldClass(`comparisons[${i}].alternative`)}
              />
              {fieldErrors[`comparisons[${i}].alternative`] && (
                <p className="text-xs text-red-500">{fieldErrors[`comparisons[${i}].alternative`]}</p>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 dark:text-gray-400">Difference</label>
              <textarea
                rows={2}
                value={c.difference}
                onChange={(e) => updateComparison(i, "difference", e.target.value)}
                placeholder="How is this different?"
                className={fieldClass(`comparisons[${i}].difference`)}
              />
              {fieldErrors[`comparisons[${i}].difference`] && (
                <p className="text-xs text-red-500">{fieldErrors[`comparisons[${i}].difference`]}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* When it breaks */}
      <div className="flex flex-col gap-1">
        <label htmlFor="when_it_breaks" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          When it breaks <span className="text-red-500">*</span>
        </label>
        <textarea
          id="when_it_breaks"
          rows={3}
          value={form.when_it_breaks}
          onChange={(e) => {
            setForm((f) => ({ ...f, when_it_breaks: e.target.value }));
            setFieldErrors((err) => ({ ...err, when_it_breaks: "" }));
          }}
          className={fieldClass("when_it_breaks")}
          placeholder="Describe edge cases or failure modes…"
        />
        {fieldErrors["when_it_breaks"] && (
          <p className="text-xs text-red-500">{fieldErrors["when_it_breaks"]}</p>
        )}
      </div>

      {/* Explain in 30s */}
      <div className="flex flex-col gap-1">
        <label htmlFor="explain_in_30s" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Explain in 30 seconds <span className="text-red-500">*</span>
        </label>
        <textarea
          id="explain_in_30s"
          rows={3}
          value={form.explain_in_30s}
          onChange={(e) => {
            setForm((f) => ({ ...f, explain_in_30s: e.target.value }));
            setFieldErrors((err) => ({ ...err, explain_in_30s: "" }));
          }}
          className={fieldClass("explain_in_30s")}
          placeholder="Your elevator-pitch explanation…"
        />
        {fieldErrors["explain_in_30s"] && (
          <p className="text-xs text-red-500">{fieldErrors["explain_in_30s"]}</p>
        )}
      </div>

      {/* Where I used it */}
      <div className="flex flex-col gap-1">
        <label htmlFor="where_i_used_it" className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Where I used it <span className="text-red-500">*</span>
        </label>
        <textarea
          id="where_i_used_it"
          rows={3}
          value={form.where_i_used_it}
          onChange={(e) => {
            setForm((f) => ({ ...f, where_i_used_it: e.target.value }));
            setFieldErrors((err) => ({ ...err, where_i_used_it: "" }));
          }}
          className={fieldClass("where_i_used_it")}
          placeholder="Project or context where you applied this…"
        />
        {fieldErrors["where_i_used_it"] && (
          <p className="text-xs text-red-500">{fieldErrors["where_i_used_it"]}</p>
        )}
      </div>

      {/* Tags */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Tags
        </label>
        <TagInput
          value={form.tags}
          onChange={(tags) => setForm((f) => ({ ...f, tags }))}
          placeholder="Add a tag…"
        />
      </div>

      {/* Image — collapsible */}
      <div className="flex flex-col gap-2 rounded-lg border border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={() => setImageExpanded((v) => !v)}
          className="flex items-center justify-between w-full px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors rounded-lg"
        >
          <span>Image (optional)</span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
            className={`transition-transform ${imageExpanded ? "rotate-180" : ""}`}
          >
            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        {imageExpanded && (
          <div className="px-3 pb-3 flex flex-col gap-3">
            {image ? (
              <div className="flex items-start gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.url}
                  alt="Uploaded concept image"
                  className="h-24 w-auto rounded-md border border-gray-200 dark:border-gray-700 object-cover"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors"
                >
                  Remove
                </button>
              </div>
            ) : (
              <>
                <div
                  role="button"
                  tabIndex={0}
                  aria-label="Upload image"
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
                  className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed py-8 cursor-pointer transition-colors ${
                    isDragging
                      ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                  }`}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="text-gray-400">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {uploading ? "Uploading…" : "Drag and drop or click to upload"}
                  </span>
                  <span className="text-xs text-gray-400">PNG, JPEG, WebP, GIF</span>
                </div>
                {uploading && uploadProgress !== null && (
                  <div className="flex flex-col gap-1">
                    <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-500 transition-all duration-150"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 text-right">{uploadProgress}%</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="sr-only"
                  onChange={handleFileChange}
                  tabIndex={-1}
                />
                {uploadError && <p className="text-xs text-red-500">{uploadError}</p>}
              </>
            )}
          </div>
        )}
      </div>

      {/* Submit error / offline notice */}
      {submitError && (
        <div className="rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-3 py-2 flex items-center justify-between gap-3">
          <p className="text-sm text-red-500">{submitError}</p>
          {offlineRetry && (
            <button
              type="button"
              onClick={handleRetry}
              className="shrink-0 text-xs font-medium text-red-600 dark:text-red-400 underline underline-offset-2 hover:text-red-800 dark:hover:text-red-200 transition-colors"
            >
              Retry
            </button>
          )}
        </div>
      )}

      {/* Back-online retry toast */}
      {offlineRetry && !submitError && (
        <div
          role="alert"
          aria-live="polite"
          className="rounded-md border border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20 px-3 py-2 flex items-center justify-between gap-3"
        >
          <p className="text-sm text-yellow-800 dark:text-yellow-300">
            Back online — tap to retry
          </p>
          <button
            type="button"
            onClick={handleRetry}
            className="shrink-0 text-xs font-medium text-yellow-800 dark:text-yellow-300 underline underline-offset-2 hover:text-yellow-900 dark:hover:text-yellow-100 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 text-sm font-medium rounded-md bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? "Saving…" : concept ? "Save changes" : "Add concept"}
        </button>
      </div>
    </form>
  );
}
