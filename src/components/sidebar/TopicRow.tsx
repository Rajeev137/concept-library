"use client";

import { useRef, useEffect } from "react";
import type { Concept, Topic, UUID } from "@/types";

interface TopicRowProps {
  topic: Topic;
  expanded: boolean;
  concepts: Concept[] | undefined;
  onToggle: (id: UUID) => void;
  onConceptClick: (topicId: UUID, conceptId: UUID) => void;
  activeConceptId?: UUID;
  collapsed?: boolean;
  // Context menu
  menuOpen?: boolean;
  onMenuOpen?: (e: React.MouseEvent) => void;
  onRenameStart?: () => void;
  onDeleteStart?: () => void;
  // Inline rename
  isRenaming?: boolean;
  renameValue?: string;
  renameInProgress?: boolean;
  onRenameChange?: (value: string) => void;
  onRenameKeyDown?: (e: React.KeyboardEvent) => void;
  onRenameBlur?: () => void;
}

export default function TopicRow({
  topic,
  expanded,
  concepts,
  onToggle,
  onConceptClick,
  activeConceptId,
  collapsed = false,
  menuOpen = false,
  onMenuOpen,
  onRenameStart,
  onDeleteStart,
  isRenaming = false,
  renameValue = "",
  renameInProgress = false,
  onRenameChange,
  onRenameKeyDown,
  onRenameBlur,
}: TopicRowProps) {
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isRenaming && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [isRenaming]);

  return (
    <li
      role="treeitem"
      aria-expanded={collapsed ? undefined : expanded}
      aria-selected={false}
      className="select-none"
    >
      <div className="group relative flex items-center">
        {isRenaming && !collapsed ? (
          // Inline rename input
          <div className="flex-1 flex items-center gap-1 px-3 py-1.5">
            {/* Chevron placeholder */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className={`flex-shrink-0 text-gray-400 transition-transform ${expanded ? "rotate-90" : ""}`}
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
            {/* Folder icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="flex-shrink-0 text-gray-400 dark:text-gray-500"
            >
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
            <input
              ref={renameInputRef}
              type="text"
              value={renameValue}
              onChange={(e) => onRenameChange?.(e.target.value)}
              onKeyDown={onRenameKeyDown}
              onBlur={onRenameBlur}
              disabled={renameInProgress}
              aria-label={`Rename topic ${topic.name}`}
              className="flex-1 min-w-0 text-sm bg-white dark:bg-gray-900 border border-blue-500 rounded px-1.5 py-0.5 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onToggle(topic.id)}
            className={`flex-1 flex items-center gap-2 px-3 py-2 text-sm rounded-md text-left
              hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors
              ${expanded && !collapsed ? "text-gray-900 dark:text-gray-100" : "text-gray-700 dark:text-gray-300"}`}
            title={collapsed ? topic.name : undefined}
            aria-label={collapsed ? topic.name : undefined}
          >
            {!collapsed && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className={`flex-shrink-0 transition-transform ${expanded ? "rotate-90" : ""}`}
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            )}

            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="flex-shrink-0 text-gray-400 dark:text-gray-500"
            >
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>

            {!collapsed && (
              <>
                <span className="flex-1 truncate font-medium">{topic.name}</span>
                <span
                  className="ml-auto flex-shrink-0 text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full px-1.5 py-0.5 min-w-[1.25rem] text-center"
                  aria-label={`${topic.concept_count} concepts`}
                >
                  {topic.concept_count}
                </span>
              </>
            )}
          </button>
        )}

        {/* Ellipsis menu button — only in expanded sidebar, not during rename */}
        {!collapsed && !isRenaming && onMenuOpen && (
          <div className="relative flex-shrink-0 pr-1">
            <button
              type="button"
              onClick={onMenuOpen}
              aria-label={`Options for ${topic.name}`}
              aria-haspopup="true"
              aria-expanded={menuOpen}
              className="opacity-0 group-hover:opacity-100 focus:opacity-100 rounded p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <circle cx="5" cy="12" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="19" cy="12" r="2" />
              </svg>
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 top-full mt-1 z-20 w-32 rounded-md shadow-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 py-1"
                role="menu"
                aria-label={`Options for ${topic.name}`}
                data-topic-menu="true"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => onRenameStart?.()}
                  className="w-full text-left px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Rename
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => onDeleteStart?.()}
                  className="w-full text-left px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {!collapsed && expanded && (
        <ul role="group" className="mt-0.5 mb-1">
          {concepts === undefined ? (
            <li className="px-9 py-1.5 text-xs text-gray-400 dark:text-gray-500">
              Loading…
            </li>
          ) : concepts.length === 0 ? (
            <li className="px-9 py-1.5 text-xs text-gray-400 dark:text-gray-500">
              No concepts yet
            </li>
          ) : (
            concepts.map((concept) => (
              <li key={concept.id} role="treeitem" aria-selected={concept.id === activeConceptId}>
                <button
                  type="button"
                  onClick={() => onConceptClick(topic.id, concept.id)}
                  className={`w-full text-left px-9 py-1.5 text-sm rounded-md truncate transition-colors
                    ${
                      concept.id === activeConceptId
                        ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
                    }`}
                >
                  {concept.title}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </li>
  );
}
