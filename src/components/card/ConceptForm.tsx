"use client";

import type { Concept, ConceptInput, ComparisonInput, UUID, DraftConcept } from "@/types";

interface ConceptFormProps {
  /** If provided, the form is in edit mode pre-filled with this concept. */
  initial?: Concept;
  /** Default topic to pre-select in the topic combobox. */
  defaultTopicId?: UUID;
  onSuccess: (concept: Concept) => void;
  onCancel: () => void;
}

// Create / edit concept form. All fields required (whitespace-only rejected; "N.A." accepted).
// Topic field: combobox — search existing topics or type a new name to create on submit.
// Comparisons: repeatable section with at least one row; rows are reorderable.
// Image: collapsible section (collapsed by default); drag-drop or click-to-upload;
//   shows thumbnail + remove button after upload.
// Draft auto-save: every 1s write to localStorage "draft:concept:{topic_id|new}".
// On form re-open: restore draft if topic_id matches.
// On successful submit: clear draft from localStorage.
//
// TODO: initialize form state from props.initial (edit mode) or from draft in localStorage (create mode).
// TODO: auto-save to localStorage every 1s using useEffect + setInterval.
// TODO: topic combobox: on type, call GET /api/concepts/search?q= or GET /api/topics; show matching topics.
//       On select existing topic, set topic_id. On type new name, set topic_id=null + topic_name_new.
// TODO: comparisons section: useState for ComparisonInput[]; add/remove/reorder rows.
// TODO: image upload: on file select, call POST /api/uploads/concept-image; store returned { url, path }.
// TODO: on submit, call POST /api/concepts (create) or PUT /api/concepts/:id (edit).
// TODO: on 422, highlight offending fields from response.error.fields.
// TODO: on 409, show "A card with this title already exists in this topic."
// TODO: on success, call props.onSuccess(concept) and clear draft from localStorage.
export default function ConceptForm({ initial, defaultTopicId, onSuccess, onCancel }: ConceptFormProps) {
  // TODO: form state with all ConceptInput fields
  // TODO: comparisons state: ComparisonInput[]
  // TODO: image state: ConceptImage | null
  // TODO: draft auto-save effect
  return (
    <form>
      {/* TODO: topic combobox */}
      {/* TODO: title input */}
      {/* TODO: what_it_does textarea */}
      {/* TODO: comparisons repeatable section */}
      {/* TODO: when_it_breaks textarea */}
      {/* TODO: explain_in_30s textarea */}
      {/* TODO: where_i_used_it textarea */}
      {/* TODO: tags input (comma-separated or tag chips) */}
      {/* TODO: image collapsible section */}
      {/* TODO: submit + cancel buttons */}
    </form>
  );
}
