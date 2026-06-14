import { NextRequest, NextResponse } from "next/server";
import type { ApiResult, Concept } from "@/types";
import { apiHandler } from "@/lib/errors";
import { getSession, requireUser } from "@/lib/supabase/server";
import { listConcepts } from "@/lib/repos/concepts";

export const GET = apiHandler(async (request: NextRequest) => {
  const session = await getSession();
  requireUser(session);

  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q") ?? undefined;
  const tag = searchParams.get("tag") ?? undefined;
  const topic_id = searchParams.get("topic") ?? undefined;

  const concepts = await listConcepts(session, { q, tag, topic_id });
  return NextResponse.json<ApiResult<Concept[]>>({ ok: true, data: concepts });
});
