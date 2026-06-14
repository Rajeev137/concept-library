import { NextRequest, NextResponse } from "next/server";
import type { ApiResult, Concept } from "@/types";
import { apiHandler } from "@/lib/errors";
import { getSession, requireUser } from "@/lib/supabase/server";
import { listConceptsByTopic } from "@/lib/repos/topics";

type Params = { params: Promise<{ id: string }> };

export const GET = apiHandler(async (request: NextRequest, { params }: Params) => {
  const session = await getSession();
  requireUser(session);
  const { id } = await params;

  const concepts = await listConceptsByTopic(session, id);
  return NextResponse.json<ApiResult<Concept[]>>({ ok: true, data: concepts });
});
