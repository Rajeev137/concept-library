import { NextRequest, NextResponse } from "next/server";
import type { ApiResult, Concept } from "@/types";
import { apiHandler } from "@/lib/errors";
import { getSession, requireUser } from "@/lib/supabase/server";
import { listConcepts, createConcept } from "@/lib/repos/concepts";
import { conceptInputSchema } from "@/lib/validators/concept";

// GET /api/concepts
// Auth required. Returns all Concept[] for the session user.
// For filtered search, clients should use GET /api/concepts/search?q=&tag=&topic=
export const GET = apiHandler(async (_request: NextRequest) => {
  // TODO: const session = await getSession(); requireUser(session)
  // TODO: const concepts = await listConcepts(session)
  // TODO: return NextResponse.json({ ok: true, data: concepts })
  return NextResponse.json({ ok: true, data: [] });
});

// POST /api/concepts
// Auth required. Body: ConceptInput
// If input.topic_id is null and topic_name_new is set, creates the topic first.
// Validates input; throws 422 on failure.
// Throws 409 if title already exists under the same topic for this user.
export const POST = apiHandler(async (request: NextRequest) => {
  // TODO: const session = await getSession(); requireUser(session)
  // TODO: parse and validate body with conceptInputSchema; throw 422 on failure
  // TODO: const concept = await createConcept(session, body)
  // TODO: return NextResponse.json({ ok: true, data: concept }, { status: 201 })
  return NextResponse.json({ ok: true, data: null }, { status: 201 });
});
