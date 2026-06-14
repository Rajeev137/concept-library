"use client";

import type { Concept, UUID } from "@/types";

interface ConceptListProps {
  topicId: UUID;
  activeConceptId?: UUID;
}

// List of concept card summaries for a given topic.
// Fetches from GET /api/topics/:id/concepts.
// Clicking a card updates the URL to ?topic=:id&concept=:conceptId.
// TODO: fetch from GET /api/topics/:topicId/concepts; show skeleton while loading.
// TODO: if list is empty, show empty state with "Add your first card" prompt.
// TODO: scroll position persisted in sessionStorage under "scroll:topic:{topicId}".
export default function ConceptList({ topicId, activeConceptId }: ConceptListProps) {
  // TODO: const { data: concepts } = useSWR<Concept[]>(`/api/topics/${topicId}/concepts`, fetcher)
  return (
    <section aria-label="Concepts">
      {/* TODO: map concepts to <ConceptCard> summary items */}
      {/* TODO: highlight activeConceptId */}
    </section>
  );
}
