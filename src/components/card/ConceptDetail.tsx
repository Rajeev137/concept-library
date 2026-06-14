"use client";

import type { Concept, UUID } from "@/types";

interface ConceptDetailProps {
  conceptId: UUID;
}

// Read-only render of a concept card. Fetches from GET /api/concepts/:id.
// Shows all fields: title, what_it_does, comparisons table, when_it_breaks,
// explain_in_30s, where_i_used_it, tags, and (if present) image at full size.
// Edit button: opens ConceptForm with this concept's data pre-filled.
// Delete button: calls DELETE /api/concepts/:id; on success, navigates back to topic list.
// All user text rendered as plain text (never innerHTML / dangerouslySetInnerHTML).
// TODO: fetch concept from GET /api/concepts/:id; show loading skeleton while fetching.
// TODO: on 401, redirect to /login?returnUrl=current.
// TODO: on 404, show "Card not found" with link back to topic.
export default function ConceptDetail({ conceptId }: ConceptDetailProps) {
  // TODO: const { data: concept, error } = useSWR<Concept>(`/api/concepts/${conceptId}`, fetcher)
  return (
    <article>
      {/* TODO: render concept fields */}
      {/* TODO: comparisons as a two-column table (alternative | difference) */}
      {/* TODO: tags as pill chips */}
      {/* TODO: image section (full size) if concept.image !== null */}
      {/* TODO: edit + delete buttons */}
    </article>
  );
}
