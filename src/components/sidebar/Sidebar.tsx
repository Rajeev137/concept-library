"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Topic, Concept, UUID } from "@/types";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useSession } from "@/hooks/useSession";
import TopicRow from "./TopicRow";
import ThemeToggle from "@/components/ui/ThemeToggle";

interface SidebarProps {
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  isMobileDrawer?: boolean;
  onClose?: () => void;
}

interface SearchResult {
  concept: Concept;
  topicName: string;
}

interface Toast {
  id: number;
  message: string;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const body = await res.json();
  return body.data as T;
}

function useTopics() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const reload = useCallback(() => {
    setLoading(true);
    fetchJson<Topic[]>("/api/topics")
      .then(setTopics)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { topics, loading, error, reload };
}

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-200 dark:bg-yellow-800 text-inherit rounded-sm">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

let toastCounter = 0;

export default function Sidebar({ collapsed, onCollapsedChange, isMobileDrawer, onClose }: SidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeConceptId = searchParams.get("concept") ?? undefined;

  const { session } = useSession();

  const { topics, loading, reload: reloadTopics } = useTopics();

  const [expandedTopicIds, setExpandedTopicIds] = useLocalStorage<UUID[]>("ui:expanded-topics", []);
  const [conceptsCache, setConceptsCache] = useState<Record<UUID, Concept[]>>({});
  const loadingTopics = useRef<Set<UUID>>(new Set());

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Topic context menu state
  const [openMenuTopicId, setOpenMenuTopicId] = useState<UUID | null>(null);
  const [renamingTopicId, setRenamingTopicId] = useState<UUID | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteConfirmTopicId, setDeleteConfirmTopicId] = useState<UUID | null>(null);
  const [deleteInProgress, setDeleteInProgress] = useState(false);
  const [renameInProgress, setRenameInProgress] = useState(false);

  // Toast state
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string) => {
    const id = ++toastCounter;
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  // Debounce search input
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery]);

  // Fetch search results when debounced query changes
  useEffect(() => {
    if (!debouncedQuery) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    const topicMap = new Map(topics.map((t) => [t.id, t.name]));
    fetchJson<Concept[]>(`/api/concepts/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then((concepts) => {
        setSearchResults(
          concepts.map((c) => ({
            concept: c,
            topicName: topicMap.get(c.topic_id) ?? "",
          }))
        );
      })
      .catch(() => setSearchResults([]))
      .finally(() => setSearchLoading(false));
  }, [debouncedQuery, topics]);

  const loadConceptsForTopic = useCallback((topicId: UUID) => {
    if (conceptsCache[topicId] !== undefined) return;
    if (loadingTopics.current.has(topicId)) return;
    loadingTopics.current.add(topicId);
    fetchJson<Concept[]>(`/api/topics/${topicId}/concepts`)
      .then((concepts) => {
        setConceptsCache((prev) => ({ ...prev, [topicId]: concepts }));
      })
      .catch(() => {
        setConceptsCache((prev) => ({ ...prev, [topicId]: [] }));
      })
      .finally(() => {
        loadingTopics.current.delete(topicId);
      });
  }, [conceptsCache]);

  const handleToggle = useCallback((topicId: UUID) => {
    setExpandedTopicIds((prev) => {
      if (prev.includes(topicId)) {
        return prev.filter((id) => id !== topicId);
      }
      loadConceptsForTopic(topicId);
      return [...prev, topicId];
    });
  }, [setExpandedTopicIds, loadConceptsForTopic]);

  useEffect(() => {
    expandedTopicIds.forEach((id) => loadConceptsForTopic(id));
  // intentionally run only when expandedTopicIds changes, not loadConceptsForTopic
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expandedTopicIds]);

  const handleConceptClick = useCallback((topicId: UUID, conceptId: UUID) => {
    router.push(`?topic=${topicId}&concept=${conceptId}`);
    if (isMobileDrawer && onClose) onClose();
  }, [router, isMobileDrawer, onClose]);

  const handleSearchResultClick = useCallback((concept: Concept) => {
    handleConceptClick(concept.topic_id, concept.id);
  }, [handleConceptClick]);

  // Close menu when clicking outside
  useEffect(() => {
    if (!openMenuTopicId) return;
    const handler = () => setOpenMenuTopicId(null);
    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, [openMenuTopicId]);

  const handleMenuOpen = useCallback((e: React.MouseEvent, topicId: UUID) => {
    e.stopPropagation();
    setOpenMenuTopicId((prev) => (prev === topicId ? null : topicId));
  }, []);

  const handleRenameStart = useCallback((topic: Topic) => {
    setOpenMenuTopicId(null);
    setRenamingTopicId(topic.id);
    setRenameValue(topic.name);
  }, []);

  const handleRenameConfirm = useCallback(async (topicId: UUID) => {
    const trimmed = renameValue.trim();
    if (!trimmed) {
      setRenamingTopicId(null);
      return;
    }
    setRenameInProgress(true);
    try {
      const res = await fetch(`/api/topics/${topicId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (res.ok) {
        reloadTopics();
      } else {
        const body = await res.json().catch(() => ({}));
        showToast(body?.error?.message ?? "Rename failed");
      }
    } catch {
      showToast("Rename failed");
    } finally {
      setRenameInProgress(false);
      setRenamingTopicId(null);
    }
  }, [renameValue, reloadTopics, showToast]);

  const handleRenameKeyDown = useCallback((e: React.KeyboardEvent, topicId: UUID) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleRenameConfirm(topicId);
    } else if (e.key === "Escape") {
      setRenamingTopicId(null);
    }
  }, [handleRenameConfirm]);

  const handleDeleteStart = useCallback((topicId: UUID) => {
    setOpenMenuTopicId(null);
    setDeleteConfirmTopicId(topicId);
  }, []);

  const handleDeleteConfirm = useCallback(async (topicId: UUID) => {
    setDeleteInProgress(true);
    try {
      const res = await fetch(`/api/topics/${topicId}`, { method: "DELETE" });
      if (res.ok) {
        setDeleteConfirmTopicId(null);
        reloadTopics();
      } else if (res.status === 409) {
        setDeleteConfirmTopicId(null);
        showToast("Remove all concepts first");
      } else {
        const body = await res.json().catch(() => ({}));
        showToast(body?.error?.message ?? "Delete failed");
      }
    } catch {
      showToast("Delete failed");
    } finally {
      setDeleteInProgress(false);
    }
  }, [reloadTopics, showToast]);

  useEffect(() => {
    if (!isMobileDrawer) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onClose) onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isMobileDrawer, onClose]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const deleteConfirmTopic = topics.find((t) => t.id === deleteConfirmTopicId);

  const isSearchActive = debouncedQuery.length > 0;

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-3 border-b border-gray-200 dark:border-gray-700">
        {!collapsed && (
          <span className="flex-1 text-sm font-semibold text-gray-700 dark:text-gray-300 truncate">
            Topics
          </span>
        )}
        <button
          type="button"
          onClick={() => onCollapsedChange(!collapsed)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200 transition-colors flex-shrink-0"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className={`transition-transform ${collapsed ? "rotate-180" : ""}`}
          >
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </div>

      {/* Search */}
      {!collapsed && (
        <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
          <input
            type="search"
            placeholder="Search concepts…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search concepts"
            className="w-full text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-1.5 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      )}

      {/* Topic list / Search results */}
      <nav aria-label="Topics" className="flex-1 overflow-y-auto py-2 px-1">
        {!collapsed && isSearchActive ? (
          // Search results view
          searchLoading ? (
            <div className="px-3 py-4 text-sm text-gray-400 dark:text-gray-500">Searching…</div>
          ) : searchResults.length === 0 ? (
            <div className="px-3 py-4 text-sm text-gray-400 dark:text-gray-500">No results</div>
          ) : (
            <ul className="space-y-0.5">
              {searchResults.map(({ concept, topicName }) => (
                <li key={concept.id}>
                  <button
                    type="button"
                    onClick={() => handleSearchResultClick(concept)}
                    className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors
                      ${
                        concept.id === activeConceptId
                          ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                  >
                    <div className="font-medium truncate">
                      {highlightMatch(concept.title, debouncedQuery)}
                    </div>
                    {topicName && (
                      <div className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">
                        {topicName}
                      </div>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )
        ) : (
          // Normal topic tree view
          loading ? (
            <div className="px-3 py-4 text-sm text-gray-400 dark:text-gray-500">Loading…</div>
          ) : topics.length === 0 ? (
            <div className="px-3 py-4 text-sm text-gray-400 dark:text-gray-500">No topics yet</div>
          ) : (
            <ul role="tree" aria-label="Topic tree" className="space-y-0.5">
              {topics.map((topic) => (
                <TopicRow
                  key={topic.id}
                  topic={topic}
                  expanded={expandedTopicIds.includes(topic.id)}
                  concepts={conceptsCache[topic.id]}
                  onToggle={handleToggle}
                  onConceptClick={handleConceptClick}
                  activeConceptId={activeConceptId}
                  collapsed={collapsed}
                  isRenaming={renamingTopicId === topic.id}
                  renameValue={renamingTopicId === topic.id ? renameValue : ""}
                  renameInProgress={renameInProgress}
                  onRenameChange={setRenameValue}
                  onRenameKeyDown={(e) => handleRenameKeyDown(e, topic.id)}
                  onRenameBlur={() => handleRenameConfirm(topic.id)}
                  menuOpen={openMenuTopicId === topic.id}
                  onMenuOpen={(e) => handleMenuOpen(e, topic.id)}
                  onRenameStart={() => handleRenameStart(topic)}
                  onDeleteStart={() => handleDeleteStart(topic.id)}
                />
              ))}
            </ul>
          )
        )}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-200 dark:border-gray-700 px-3 py-2 flex items-center gap-2">
        <ThemeToggle />
        {!collapsed && session && (
          <>
            <span className="flex-1 text-xs text-gray-500 dark:text-gray-400 truncate">
              {session.email}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors flex-shrink-0"
              aria-label="Log out"
            >
              Log out
            </button>
          </>
        )}
      </div>

      {/* Delete confirmation dialog */}
      {deleteConfirmTopicId && deleteConfirmTopic && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
        >
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-6 w-80 max-w-[90vw]">
            <h2 id="delete-dialog-title" className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Delete topic?
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              It has {deleteConfirmTopic.concept_count} concept{deleteConfirmTopic.concept_count !== 1 ? "s" : ""}.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmTopicId(null)}
                disabled={deleteInProgress}
                className="px-3 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteConfirm(deleteConfirmTopicId)}
                disabled={deleteInProgress}
                className="px-3 py-1.5 text-sm rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleteInProgress ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toasts */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            aria-live="polite"
            className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm px-4 py-2 rounded-md shadow-lg pointer-events-auto"
          >
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );

  if (isMobileDrawer) {
    return (
      <>
        <div
          className="fixed inset-0 z-30 bg-black/40"
          aria-hidden="true"
          onClick={onClose}
        />
        <aside
          aria-label="Topics"
          className="fixed inset-y-0 left-0 z-40 w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 shadow-xl translate-x-0 transition-transform duration-200 ease-out"
        >
          {sidebarContent}
        </aside>
      </>
    );
  }

  return (
    <aside
      aria-label="Topics"
      className={`flex-shrink-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-all duration-200 ${
        collapsed ? "w-14" : "w-64"
      }`}
    >
      {sidebarContent}
    </aside>
  );
}
