import type { Session, Topic, TopicInput, Concept, UUID } from "@/types";
import { createClient } from "@/lib/supabase/server";
import { ApiRouteError } from "@/lib/errors";
import { validateTopic } from "@/lib/validators/topic";

function mapSupabaseError(error: { message: string; code?: string }): ApiRouteError {
  if (error.code === "PGRST116") {
    return new ApiRouteError("NOT_FOUND", "Resource not found", 404);
  }
  return new ApiRouteError("UPSTREAM_UNAVAILABLE", error.message, 503);
}

export async function listTopics(session: Session): Promise<Topic[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("topics")
    .select("*")
    .eq("user_id", session.user_id)
    .order("name");
  if (error) throw mapSupabaseError(error);
  return data;
}

export async function getTopic(session: Session, id: UUID): Promise<Topic | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("topics")
    .select("*")
    .eq("id", id)
    .eq("user_id", session.user_id)
    .maybeSingle();
  if (error) throw mapSupabaseError(error);
  return data;
}

export async function findTopicByName(session: Session, name: string): Promise<Topic | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("topics")
    .select("*")
    .eq("user_id", session.user_id)
    .ilike("name", name)
    .maybeSingle();
  if (error) throw mapSupabaseError(error);
  return data;
}

export async function createTopic(session: Session, input: TopicInput): Promise<Topic> {
  const validation = validateTopic(input);
  if (!validation.ok) {
    throw new ApiRouteError("VALIDATION", "Validation failed", 422, validation.errors);
  }

  const existing = await findTopicByName(session, input.name.trim());
  if (existing) {
    throw new ApiRouteError(
      "CONFLICT",
      `Topic "${existing.name}" already exists`,
      409
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("topics")
    .insert({ name: input.name.trim(), user_id: session.user_id })
    .select()
    .single();
  if (error) throw mapSupabaseError(error);
  return data;
}

export async function renameTopic(session: Session, id: UUID, name: string): Promise<Topic> {
  const validation = validateTopic({ name });
  if (!validation.ok) {
    throw new ApiRouteError("VALIDATION", "Validation failed", 422, validation.errors);
  }

  const existing = await findTopicByName(session, name.trim());
  if (existing && existing.id !== id) {
    throw new ApiRouteError(
      "CONFLICT",
      `Topic "${existing.name}" already exists`,
      409
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("topics")
    .update({ name: name.trim() })
    .eq("id", id)
    .eq("user_id", session.user_id)
    .select()
    .maybeSingle();
  if (error) throw mapSupabaseError(error);
  if (!data) throw new ApiRouteError("NOT_FOUND", "Topic not found", 404);
  return data;
}

export async function removeTopic(session: Session, id: UUID): Promise<{ ok: true }> {
  const supabase = await createClient();
  const { count, error: countError } = await supabase
    .from("concepts")
    .select("*", { count: "exact", head: true })
    .eq("topic_id", id)
    .eq("user_id", session.user_id);
  if (countError) throw mapSupabaseError(countError);
  if (count && count > 0) {
    throw new ApiRouteError(
      "CONFLICT",
      `Topic has ${count} concept(s); reassign or delete them first`,
      409
    );
  }

  const { error } = await supabase
    .from("topics")
    .delete()
    .eq("id", id)
    .eq("user_id", session.user_id);
  if (error) throw mapSupabaseError(error);
  return { ok: true };
}

export async function listConceptsByTopic(session: Session, topicId: UUID): Promise<Concept[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("concepts")
    .select("*, comparisons(*)")
    .eq("topic_id", topicId)
    .eq("user_id", session.user_id)
    .order("title");
  if (error) throw mapSupabaseError(error);
  return data;
}
