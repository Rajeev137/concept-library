import { NextRequest, NextResponse } from "next/server";
import type { ApiResult, Concept } from "@/types";
import { apiHandler } from "@/lib/errors";
import { getSession, requireUser } from "@/lib/supabase/server";
import { listConceptsByTopic } from "@/lib/repos/topics";

type Params = { params: Promise<{ id: string }> };

// GET /api/topics/:id/concepts
// Auth required. Returns Concept[] under the given topic, scoped to session user.
// Both topic_id and user_id must match — never topic_id alone.
// 404 if topic not found for this user (RLS returns empty, treated as 404).
export const GET = apiHandler(async (request: NextRequest, { params }: Params) => {
  // TODO: const session = await getSession(); requireUser(session)
  // TODO: const { id } = await params
  // TODO: const concepts = await listConceptsByTopic(session, id)
  // TODO: return NextResponse.json({ ok: true, data: concepts })
  return NextResponse.json({ ok: true, data: [] });
});
