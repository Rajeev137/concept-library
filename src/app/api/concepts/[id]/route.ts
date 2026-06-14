import { NextRequest, NextResponse } from "next/server";
import type { ApiResult, Concept } from "@/types";
import { apiHandler, ApiRouteError } from "@/lib/errors";
import { getSession, requireUser } from "@/lib/supabase/server";
import { getConcept, updateConcept, removeConcept } from "@/lib/repos/concepts";
import { conceptInputSchema } from "@/lib/validators/concept";

type Params = { params: Promise<{ id: string }> };

// GET /api/concepts/:id
// Auth required. Returns the concept with comparisons, scoped to session user.
// 404 if not found or belongs to another user (never 403 — existence leak prevention).
export const GET = apiHandler(async (request: NextRequest, { params }: Params) => {
  // TODO: const session = await getSession(); requireUser(session)
  // TODO: const { id } = await params
  // TODO: const concept = await getConcept(session, id)
  // TODO: if (!concept) throw new ApiRouteError("NOT_FOUND", "Not found", 404)
  // TODO: return NextResponse.json({ ok: true, data: concept })
  return NextResponse.json({ ok: true, data: null });
});

// PUT /api/concepts/:id
// Auth required. Body: ConceptInput
// Full replace of mutable fields. Replaces comparisons array entirely.
// 404 if not found for this user. 409 on title conflict within same topic.
export const PUT = apiHandler(async (request: NextRequest, { params }: Params) => {
  // TODO: const session = await getSession(); requireUser(session)
  // TODO: const { id } = await params
  // TODO: parse and validate body with conceptInputSchema; throw 422 on failure
  // TODO: const concept = await updateConcept(session, id, body)
  // TODO: return NextResponse.json({ ok: true, data: concept })
  return NextResponse.json({ ok: true, data: null });
});

// DELETE /api/concepts/:id
// Auth required. Deletes concept and its comparisons (via DB cascade or manual).
// 404 if not found for this user.
export const DELETE = apiHandler(async (request: NextRequest, { params }: Params) => {
  // TODO: const session = await getSession(); requireUser(session)
  // TODO: const { id } = await params
  // TODO: const result = await removeConcept(session, id)
  // TODO: return NextResponse.json({ ok: true, data: result })
  return NextResponse.json({ ok: true, data: { ok: true } });
});
