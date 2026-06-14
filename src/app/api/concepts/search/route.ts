import { NextRequest, NextResponse } from "next/server";
import type { ApiResult, Concept } from "@/types";
import { apiHandler } from "@/lib/errors";
import { getSession, requireUser } from "@/lib/supabase/server";
import { listConcepts } from "@/lib/repos/concepts";

// GET /api/concepts/search?q=&tag=&topic=
// Auth required. All params optional and AND-combined:
// - q: title contains (case-insensitive)
// - tag: tags array contains this value
// - topic: topic_id UUID filter
// Returns Concept[] matching all supplied filters for the session user.
export const GET = apiHandler(async (request: NextRequest) => {
  // TODO: const session = await getSession(); requireUser(session)
  // TODO: const { searchParams } = new URL(request.url)
  // TODO: const q = searchParams.get("q") ?? undefined
  // TODO: const tag = searchParams.get("tag") ?? undefined
  // TODO: const topic_id = searchParams.get("topic") ?? undefined
  // TODO: const concepts = await listConcepts(session, { q, tag, topic_id })
  // TODO: return NextResponse.json({ ok: true, data: concepts })
  return NextResponse.json({ ok: true, data: [] });
});
