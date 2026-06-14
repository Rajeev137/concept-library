import type { Session, Concept, ConceptInput, UUID } from "@/types";

// All methods scoped to session.user_id via RLS + explicit WHERE user_id = ?
// Import createClient from @/lib/supabase/server.

// TODO: List concepts for the session user. Supports optional filter opts:
// - q: full-text search on title (ilike %q%)
// - tag: array contains filter on tags column
// - topic_id: filter by topic UUID
// All filters are AND-combined. Returns concept rows joined with comparisons[].
export async function listConcepts(
  session: Session,
  opts?: { q?: string; tag?: string; topic_id?: UUID }
): Promise<Concept[]> {
  // TODO: const supabase = await createClient()
  // TODO: let query = supabase.from("concepts").select("*, comparisons(*)").eq("user_id", session.user_id)
  // TODO: if (opts?.q) query = query.ilike("title", `%${opts.q}%`)
  // TODO: if (opts?.tag) query = query.contains("tags", [opts.tag])
  // TODO: if (opts?.topic_id) query = query.eq("topic_id", opts.topic_id)
  // TODO: const { data, error } = await query.order("updated_at", { ascending: false })
  // TODO: if (error) throw mapSupabaseError(error)
  // TODO: return data
  return [];
}

// TODO: Get a single concept by id scoped to session.user_id. Return null if not found.
// Joins comparisons ordered by position ASC.
export async function getConcept(session: Session, id: UUID): Promise<Concept | null> {
  // TODO: const supabase = await createClient()
  // TODO: const { data, error } = await supabase.from("concepts").select("*, comparisons(*order(position))").eq("id", id).eq("user_id", session.user_id).maybeSingle()
  // TODO: if (error) throw mapSupabaseError(error)
  // TODO: return data
  return null;
}

// TODO: Create a concept. Validate input via validateConcept; throw 422 on failure.
// If input.topic_id is null and topic_name_new is provided, call createTopic first to
// get the new topic's id. Validate that the resolved topic belongs to the session user.
// Insert concept row (user_id from session), then upsert comparisons rows.
// Throw 409 if title already exists under the same topic for this user.
export async function createConcept(session: Session, input: ConceptInput): Promise<Concept> {
  // TODO: validate input via validateConcept; throw ApiRouteError("VALIDATION", ..., 422) on failure
  // TODO: resolve topic_id: if null, call createTopic(session, { name: input.topic_name_new! })
  // TODO: const supabase = await createClient()
  // TODO: insert into concepts, capture new id
  // TODO: insert comparisons rows referencing new concept id
  // TODO: return the assembled Concept with comparisons
  throw new Error("TODO");
}

// TODO: Update a concept. Validate input. Verify the concept exists for this user (404 if not).
// Update concept row WHERE id AND user_id. Replace comparisons: delete old rows, insert new.
// Throw 409 if new title conflicts with another concept in the same topic.
export async function updateConcept(
  session: Session,
  id: UUID,
  input: ConceptInput
): Promise<Concept> {
  // TODO: validate input via validateConcept; throw 422 on failure
  // TODO: verify concept exists for user; throw 404 if not
  // TODO: const supabase = await createClient()
  // TODO: update concept columns WHERE id AND user_id
  // TODO: delete old comparisons WHERE concept_id, insert new comparisons
  // TODO: return updated Concept with comparisons
  throw new Error("TODO");
}

// TODO: Delete a concept and its comparisons. Use cascade delete in DB schema, or
// manually delete comparisons then concept. Scoped to session.user_id.
// Return { ok: true }; throw 404 if not found.
export async function removeConcept(session: Session, id: UUID): Promise<{ ok: true }> {
  // TODO: const supabase = await createClient()
  // TODO: const { error } = await supabase.from("concepts").delete().eq("id", id).eq("user_id", session.user_id)
  // TODO: if (error) throw mapSupabaseError(error)
  return { ok: true };
}
