"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ConceptList from "@/components/card/ConceptList";
import ConceptDetail from "@/components/card/ConceptDetail";
import ConceptForm from "@/components/card/ConceptForm";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import KeyboardShortcutsHelp from "@/components/ui/KeyboardShortcutsHelp";

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

  const [showHelp, setShowHelp] = useState(false);

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

  useKeyboardShortcuts({
    onNewCard: handleAddCard,
    onEditCard: () => {
      if (conceptId) {
        const btn = document.querySelector<HTMLButtonElement>("article button:first-of-type");
        btn?.click();
      }
    },
    onDeleteCard: () => {
      if (conceptId) {
        const buttons = document.querySelectorAll<HTMLButtonElement>("article button");
        const deleteBtn = Array.from(buttons).find((b) => b.textContent?.trim() === "Delete");
        deleteBtn?.click();
      }
    },
    onClose: () => {
      if (panel === "create") {
        setPanel(conceptId ? "detail" : "list");
        setMobilePanel(conceptId ? "detail" : "list");
      } else if (panel === "detail" && conceptId) {
        const params = new URLSearchParams(searchParams.toString());
        params.delete("concept");
        router.push(`/?${params.toString()}`);
      }
    },
    onFocusSearch: () => {
      const input = document.querySelector<HTMLInputElement>('[aria-label="Search concepts"]');
      input?.focus();
    },
    onShowHelp: () => setShowHelp(true),
  });

  const listPanel = (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border-default)] flex-shrink-0">
        <h2 className="text-sm font-semibold text-[var(--text-secondary)]">
          {topicId ? "Topic concepts" : "All concepts"}
        </h2>
        <button
          type="button"
          onClick={handleAddCard}
          className="text-xs font-medium px-2.5 py-1 rounded-md bg-[var(--bg-accent)] text-[var(--text-on-accent)] hover:opacity-90 transition-colors"
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
        <p className="text-[var(--text-muted)] text-sm">
          Select a concept to view it, or add a new card.
        </p>
        <button
          type="button"
          onClick={handleAddCard}
          className="mt-4 text-sm font-medium px-4 py-2 rounded-md bg-[var(--bg-accent)] text-[var(--text-on-accent)] hover:opacity-90 transition-colors"
        >
          + Add card
        </button>
      </div>
    );
  })();

  return (
    <>
      {showHelp && <KeyboardShortcutsHelp onClose={() => setShowHelp(false)} />}

      {/* Desktop: master-detail side by side (lg+) */}
      <div className="hidden lg:flex h-full">
        {/* List: left third */}
        <div className="w-1/3 border-r border-[var(--border-default)] h-full overflow-hidden flex-shrink-0">
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
