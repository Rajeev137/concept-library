"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ConceptList from "@/components/card/ConceptList";
import ConceptDetail from "@/components/card/ConceptDetail";
import ConceptForm from "@/components/card/ConceptForm";

type Panel = "list" | "detail" | "create";

export default function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const topicId = searchParams.get("topic") ?? undefined;
  const conceptId = searchParams.get("concept") ?? undefined;

  // Which panel to show on mobile (list takes precedence when no concept is selected)
  const [mobilePanel, setMobilePanel] = useState<"list" | "detail">(
    conceptId ? "detail" : "list"
  );

  // Track editing / creating state separately from URL
  const [panel, setPanel] = useState<Panel>(() => {
    if (conceptId) return "detail";
    return "list";
  });

  // Key to force ConceptList to re-fetch after mutations
  const [listKey, setListKey] = useState(0);

  // Sync panel when URL changes (e.g. browser back/forward)
  useEffect(() => {
    if (conceptId) {
      setPanel("detail");
      setMobilePanel("detail");
    } else {
      setPanel("list");
      setMobilePanel("list");
    }
  }, [conceptId]);

  const refreshList = useCallback(() => setListKey((k) => k + 1), []);

  const handleConceptClick = useCallback(
    (id: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("concept", id);
      router.push(`/?${params.toString()}`);
      setPanel("detail");
      setMobilePanel("detail");
    },
    [router, searchParams]
  );

  const handleTagClick = useCallback(
    (tag: string) => {
      router.push(`/?tag=${encodeURIComponent(tag)}`);
    },
    [router]
  );

  const handleDelete = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("concept");
    router.push(`/?${params.toString()}`);
    refreshList();
  }, [router, searchParams, refreshList]);

  const handleEditSuccess = useCallback(() => {
    refreshList();
  }, [refreshList]);

  const handleCreateSuccess = useCallback(
    (concept: { id: string; topic_id: string }) => {
      const params = new URLSearchParams();
      if (concept.topic_id) params.set("topic", concept.topic_id);
      params.set("concept", concept.id);
      router.push(`/?${params.toString()}`);
      refreshList();
    },
    [router, refreshList]
  );

  const handleAddCard = useCallback(() => {
    setPanel("create");
    setMobilePanel("detail");
  }, []);

  const listPanel = (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {topicId ? "Topic concepts" : "All concepts"}
        </h2>
        <button
          type="button"
          onClick={handleAddCard}
          className="text-xs font-medium px-2.5 py-1 rounded-md bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-300 transition-colors"
        >
          + Add card
        </button>
      </div>
      <div className="flex-1 overflow-hidden">
        <ConceptList
          key={listKey}
          topicId={topicId}
          activeConceptId={conceptId}
          onConceptClick={handleConceptClick}
        />
      </div>
    </div>
  );

  const detailPanel = (() => {
    if (panel === "create") {
      return (
        <div className="p-4 overflow-y-auto h-full">
          <ConceptForm
            defaultTopicId={topicId}
            onSuccess={handleCreateSuccess}
            onCancel={() => {
              setPanel(conceptId ? "detail" : "list");
              setMobilePanel(conceptId ? "detail" : "list");
            }}
          />
        </div>
      );
    }

    if (conceptId) {
      return (
        <div className="overflow-y-auto h-full">
          <ConceptDetail
            conceptId={conceptId}
            onEdit={handleEditSuccess}
            onDelete={handleDelete}
            onTagClick={handleTagClick}
          />
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6">
        <p className="text-gray-400 dark:text-gray-500 text-sm">
          Select a concept to view it, or add a new card.
        </p>
        <button
          type="button"
          onClick={handleAddCard}
          className="mt-4 text-sm font-medium px-4 py-2 rounded-md bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-300 transition-colors"
        >
          + Add card
        </button>
      </div>
    );
  })();

  return (
    <>
      {/* Desktop: master-detail side by side (lg+) */}
      <div className="hidden lg:flex h-full">
        {/* List: left third */}
        <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 h-full overflow-hidden flex-shrink-0">
          {listPanel}
        </div>
        {/* Detail: right two-thirds */}
        <div className="flex-1 h-full overflow-hidden">
          {detailPanel}
        </div>
      </div>

      {/* Mobile: show list OR detail */}
      <div className="lg:hidden h-full">
        {mobilePanel === "list" ? listPanel : detailPanel}
      </div>
    </>
  );
}
