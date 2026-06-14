"use client";

import type { Concept, Topic, UUID } from "@/types";

interface TopicRowProps {
  topic: Topic;
  expanded: boolean;
  concepts: Concept[] | undefined;
  onToggle: (id: UUID) => void;
  onConceptClick: (topicId: UUID, conceptId: UUID) => void;
  activeConceptId?: UUID;
  collapsed?: boolean;
}

export default function TopicRow({
  topic,
  expanded,
  concepts,
  onToggle,
  onConceptClick,
  activeConceptId,
  collapsed = false,
}: TopicRowProps) {
  return (
    <li
      role="treeitem"
      aria-expanded={collapsed ? undefined : expanded}
      aria-selected={false}
      className="select-none"
    >
      <button
        type="button"
        onClick={() => onToggle(topic.id)}
        className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md text-left
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
