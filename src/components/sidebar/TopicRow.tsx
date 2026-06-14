"use client";

import type { Topic, Concept, UUID } from "@/types";

interface TopicRowProps {
  topic: Topic;
  expanded: boolean;
  onToggle: (id: UUID) => void;
  onConceptClick: (topicId: UUID, conceptId: UUID) => void;
}

// Renders a single topic row in the sidebar with its concept count and expandable list.
// When expanded, fetches and shows concept titles under this topic.
// TODO: on expand, call GET /api/topics/:id/concepts if concepts for this topic are not
//       already cached; display concept titles sorted by title.
// TODO: highlight the currently active concept (from URL params).
// TODO: topic count badge from topic.concept_count (denormalized, no extra fetch needed).
export default function TopicRow({ topic, expanded, onToggle, onConceptClick }: TopicRowProps) {
  // TODO: const { data: concepts } = useSWR<Concept[]>(expanded ? `/api/topics/${topic.id}/concepts` : null, fetcher)
  return (
    <div role="treeitem" aria-expanded={expanded}>
      {/* TODO: topic name + count badge + expand arrow */}
      {/* TODO: if expanded, render concept list */}
    </div>
  );
}
