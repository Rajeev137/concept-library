import type { Session, Topic, TopicInput, Concept, UUID } from "@/types";

// All methods use the anon-key Supabase server client (RLS enforces user_id scoping).
// Never pass user_id from the client; always read from session.user_id.
// Import createClient from @/lib/supabase/server.

// TODO: List all topics for the session user, ordered by name ASC.
// Equivalent to: SELECT * FROM topics WHERE user_id = session.user_id ORDER BY name ASC
export async function listTopics(session: Session): Promise<Topic[]> {
  // TODO: const supabase = await createClient()
  // TODO: const { data, error } = await supabase.from("topics").select("*").eq("user_id", session.user_id).order("name")
  // TODO: if (error) throw mapSupabaseError(error)
  // TODO: return data
  return [];
}

// TODO: Get a single topic by id scoped to session.user_id. Return null if not found.
// Uses WHERE id = ? AND user_id = ? — never id alone (per contract invariants).
export async function getTopic(session: Session, id: UUID): Promise<Topic | null> {
  // TODO: const supabase = await createClient()
  // TODO: const { data, error } = await supabase.from("topics").select("*").eq("id", id).eq("user_id", session.user_id).maybeSingle()
  // TODO: if (error) throw mapSupabaseError(error)
  // TODO: return data
  return null;
}

// TODO: Find a topic by name (case-insensitive) for the session user.
// Used to detect duplicates (409) before creating, and to return the existing topic.
export async function findTopicByName(session: Session, name: string): Promise<Topic | null> {
  // TODO: const supabase = await createClient()
  // TODO: const { data, error } = await supabase.from("topics").select("*").eq("user_id", session.user_id).ilike("name", name).maybeSingle()
  // TODO: if (error) throw mapSupabaseError(error)
  // TODO: return data
  return null;
}

// TODO: Create a new topic. Before inserting, call findTopicByName to detect case-insensitive
// duplicates — throw ApiRouteError("CONFLICT", ..., 409) with the existing topic if found.
// Validate input via validateTopic; throw ApiRouteError("VALIDATION", ..., 422) on failure.
// Set user_id from session, never from input.
export async function createTopic(session: Session, input: TopicInput): Promise<Topic> {
  // TODO: validate input
  // TODO: check for existing topic by name (case-insensitive), throw 409 with existing topic
  // TODO: const supabase = await createClient()
  // TODO: const { data, error } = await supabase.from("topics").insert({ name: input.name.trim(), user_id: session.user_id }).select().single()
  // TODO: if (error) throw mapSupabaseError(error)
  // TODO: return data
  throw new Error("TODO");
}

// TODO: Rename a topic. Validate input; check for name collision; update WHERE id AND user_id.
// Return the updated topic; throw 404 if not found (RLS returns 0 rows).
export async function renameTopic(session: Session, id: UUID, name: string): Promise<Topic> {
  // TODO: validate name
  // TODO: check for existing topic with same name (case-insensitive), throw 409
  // TODO: const supabase = await createClient()
  // TODO: const { data, error } = await supabase.from("topics").update({ name: name.trim() }).eq("id", id).eq("user_id", session.user_id).select().maybeSingle()
  // TODO: if (!data) throw ApiRouteError("NOT_FOUND", ..., 404)
  throw new Error("TODO");
}

// TODO: Delete a topic. First count concepts under it — if count > 0, throw
// ApiRouteError("CONFLICT", `Topic has ${count} concept(s); reassign or delete them first`, 409).
// Then delete WHERE id AND user_id.
export async function removeTopic(session: Session, id: UUID): Promise<{ ok: true }> {
  // TODO: const supabase = await createClient()
  // TODO: const { count, error: cErr } = await supabase.from("concepts").select("*", { count: "exact", head: true }).eq("topic_id", id).eq("user_id", session.user_id)
  // TODO: if (count && count > 0) throw ApiRouteError("CONFLICT", `Topic has ${count} concept(s); reassign or delete them first`, 409)
  // TODO: const { error } = await supabase.from("topics").delete().eq("id", id).eq("user_id", session.user_id)
  // TODO: if (error) throw mapSupabaseError(error)
  return { ok: true };
}

// TODO: List all concepts under a specific topic, scoped to session user.
// Both topic_id and user_id must match — never topic_id alone.
export async function listConceptsByTopic(session: Session, topicId: UUID): Promise<Concept[]> {
  // TODO: const supabase = await createClient()
  // TODO: const { data, error } = await supabase.from("concepts").select("*, comparisons(*)").eq("topic_id", topicId).eq("user_id", session.user_id).order("title")
  // TODO: if (error) throw mapSupabaseError(error)
  // TODO: return data
  return [];
}
