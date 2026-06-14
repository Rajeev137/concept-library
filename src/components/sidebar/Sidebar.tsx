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

export default function Sidebar({ collapsed, onCollapsedChange, isMobileDrawer, onClose }: SidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeConceptId = searchParams.get("concept") ?? undefined;

  const { session } = useSession();

  const { topics, loading } = useTopics();

  const [expandedTopicIds, setExpandedTopicIds] = useLocalStorage<UUID[]>("ui:expanded-topics", []);
  const [conceptsCache, setConceptsCache] = useState<Record<UUID, Concept[]>>({});
  const loadingTopics = useRef<Set<UUID>>(new Set());

  const [searchQuery, setSearchQuery] = useState("");

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

  const q = searchQuery.trim().toLowerCase();

  const filteredTopics = topics.filter((topic) => {
    if (!q) return true;
    if (topic.name.toLowerCase().includes(q)) return true;
    const concepts = conceptsCache[topic.id];
    if (concepts) return concepts.some((c) => c.title.toLowerCase().includes(q));
    return false;
  });

  const filteredConceptsFor = useCallback((topicId: UUID): Concept[] | undefined => {
    const concepts = conceptsCache[topicId];
    if (!concepts) return undefined;
    if (!q) return concepts;
    return concepts.filter((c) => c.title.toLowerCase().includes(q));
  }, [conceptsCache, q]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Header: collapse toggle + search */}
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
            placeholder="Search topics & concepts…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search topics and concepts"
            className="w-full text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-1.5 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      )}

      {/* Topic list */}
      <nav aria-label="Topics" className="flex-1 overflow-y-auto py-2 px-1">
        {loading ? (
          <div className="px-3 py-4 text-sm text-gray-400 dark:text-gray-500">Loading…</div>
        ) : filteredTopics.length === 0 ? (
          <div className="px-3 py-4 text-sm text-gray-400 dark:text-gray-500">
            {q ? "No results" : "No topics yet"}
          </div>
        ) : (
          <ul role="tree" aria-label="Topic tree" className="space-y-0.5">
            {filteredTopics.map((topic) => (
              <TopicRow
                key={topic.id}
                topic={topic}
                expanded={expandedTopicIds.includes(topic.id)}
                concepts={filteredConceptsFor(topic.id)}
                onToggle={handleToggle}
                onConceptClick={handleConceptClick}
                activeConceptId={activeConceptId}
                collapsed={collapsed}
              />
            ))}
          </ul>
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
    </div>
  );

  if (isMobileDrawer) {
    return (
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 z-30 bg-black/40"
          aria-hidden="true"
          onClick={onClose}
        />
        <aside
          aria-label="Topics"
          className="fixed inset-y-0 left-0 z-40 w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 shadow-xl"
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
