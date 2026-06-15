import type { Session, Concept, ConceptInput, UUID } from "@/types";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { ApiRouteError } from "@/lib/errors";
import { validateConcept } from "@/lib/validators/concept";
import { findTopicByName, createTopic } from "@/lib/repos/topics";

function mapSupabaseError(error: { message: string; code?: string }): ApiRouteError {
  if (error.code === "PGRST116") {
    return new ApiRouteError("NOT_FOUND", "Resource not found", 404);
  }
  if (error.code === "23505") {
    return new ApiRouteError("CONFLICT", "A concept with this title already exists in the topic", 409);
  }
  return new ApiRouteError("UPSTREAM_UNAVAILABLE", error.message, 503);
}

async function fetchConceptWithComparisons(
  supabase: Awaited<ReturnType<typeof createClient>>,
  id: UUID,
  userId: UUID
): Promise<Concept | null> {
  const { data, error } = await supabase
    .from("concepts")
    .select("*, comparisons(*)")
    .eq("id", id)
    .eq("user_id", userId)
    .order("position", { referencedTable: "comparisons", ascending: true })
    .maybeSingle();
  if (error) throw mapSupabaseError(error);
  return data;
}

export async function listConcepts(
  session: Session,
  opts?: { q?: string; tag?: string; topic_id?: UUID }
): Promise<Concept[]> {
  const supabase = await createClient();
  let query = supabase
    .from("concepts")
    .select("*, comparisons(*)")
    .eq("user_id", session.user_id);
  if (opts?.q) query = query.ilike("title", `%${opts.q}%`);
  if (opts?.tag) query = query.contains("tags", [opts.tag]);
  if (opts?.topic_id) query = query.eq("topic_id", opts.topic_id);
  const { data, error } = await query.order("updated_at", { ascending: false });
  if (error) throw mapSupabaseError(error);
  return data;
}

export async function getConcept(session: Session, id: UUID): Promise<Concept | null> {
  const supabase = await createClient();
  return fetchConceptWithComparisons(supabase, id, session.user_id);
}

export async function createConcept(session: Session, input: ConceptInput): Promise<Concept> {
  const validation = validateConcept(input);
  if (!validation.ok) {
    throw new ApiRouteError("VALIDATION", "Validation failed", 422, validation.errors);
  }

  let topicId = input.topic_id;

  if (topicId === null && input.topic_name_new) {
    const existing = await findTopicByName(session, input.topic_name_new);
    if (existing) {
      throw new ApiRouteError(
        "CONFLICT",
        `Topic "${existing.name}" already exists`,
        409
      );
    }
    const newTopic = await createTopic(session, { name: input.topic_name_new });
    topicId = newTopic.id;
  }

  const supabase = await createClient();
  const { data: concept, error: conceptError } = await supabase
    .from("concepts")
    .insert({
      user_id: session.user_id,
      topic_id: topicId,
      title: input.title,
      what_it_does: input.what_it_does,
      when_it_breaks: input.when_it_breaks,
      explain_in_30s: input.explain_in_30s,
      where_i_used_it: input.where_i_used_it,
      tags: input.tags,
      image: input.image,
    })
    .select()
    .single();
  if (conceptError) throw mapSupabaseError(conceptError);

  // Move draft image to the final path now that we have the real concept_id
  let finalImage = input.image ?? null;
  if (input.image && input.image.path.includes(`/${session.user_id}/draft/`)) {
    const draftPath = input.image.path;
    const filename = draftPath.split("/").pop()!;
    const finalPath = `${session.user_id}/${concept.id}/${filename}`;

    const storage = createServiceClient().storage.from("concept-images");
    const { error: copyError } = await storage.copy(draftPath, finalPath);
    if (!copyError) {
      await storage.remove([draftPath]);
      const { data: publicData } = storage.getPublicUrl(finalPath);
      finalImage = { ...input.image, path: finalPath, url: publicData.publicUrl };
      await supabase
        .from("concepts")
        .update({ image: finalImage })
        .eq("id", concept.id)
        .eq("user_id", session.user_id);
    }
  }

  if (input.comparisons.length > 0) {
    const rows = input.comparisons.map((c) => ({
      concept_id: concept.id,
      alternative: c.alternative,
      difference: c.difference,
      position: c.position,
    }));
    const { error: cmpError } = await supabase.from("comparisons").insert(rows);
    if (cmpError) throw mapSupabaseError(cmpError);
  }

  const full = await fetchConceptWithComparisons(supabase, concept.id, session.user_id);
  if (!full) throw new ApiRouteError("INTERNAL", "Failed to fetch created concept", 500);
  return full;
}

export async function updateConcept(
  session: Session,
  id: UUID,
  input: ConceptInput
): Promise<Concept> {
  const validation = validateConcept(input);
  if (!validation.ok) {
    throw new ApiRouteError("VALIDATION", "Validation failed", 422, validation.errors);
  }

  const supabase = await createClient();

  const { data: existing, error: findError } = await supabase
    .from("concepts")
    .select("id")
    .eq("id", id)
    .eq("user_id", session.user_id)
    .maybeSingle();
  if (findError) throw mapSupabaseError(findError);
  if (!existing) throw new ApiRouteError("NOT_FOUND", "Concept not found", 404);

  const { error: updateError } = await supabase
    .from("concepts")
    .update({
      topic_id: input.topic_id,
      title: input.title,
      what_it_does: input.what_it_does,
      when_it_breaks: input.when_it_breaks,
      explain_in_30s: input.explain_in_30s,
      where_i_used_it: input.where_i_used_it,
      tags: input.tags,
      image: input.image,
    })
    .eq("id", id)
    .eq("user_id", session.user_id);
  if (updateError) throw mapSupabaseError(updateError);

  const { error: deleteError } = await supabase
    .from("comparisons")
    .delete()
    .eq("concept_id", id);
  if (deleteError) throw mapSupabaseError(deleteError);

  if (input.comparisons.length > 0) {
    const rows = input.comparisons.map((c) => ({
      concept_id: id,
      alternative: c.alternative,
      difference: c.difference,
      position: c.position,
    }));
    const { error: cmpError } = await supabase.from("comparisons").insert(rows);
    if (cmpError) throw mapSupabaseError(cmpError);
  }

  const full = await fetchConceptWithComparisons(supabase, id, session.user_id);
  if (!full) throw new ApiRouteError("INTERNAL", "Failed to fetch updated concept", 500);
  return full;
}

export async function removeConcept(session: Session, id: UUID): Promise<{ ok: true }> {
  const supabase = await createClient();

  const { data: existing, error: findError } = await supabase
    .from("concepts")
    .select("id")
    .eq("id", id)
    .eq("user_id", session.user_id)
    .maybeSingle();
  if (findError) throw mapSupabaseError(findError);
  if (!existing) throw new ApiRouteError("NOT_FOUND", "Concept not found", 404);

  const { error } = await supabase
    .from("concepts")
    .delete()
    .eq("id", id)
    .eq("user_id", session.user_id);
  if (error) throw mapSupabaseError(error);
  return { ok: true };
}
