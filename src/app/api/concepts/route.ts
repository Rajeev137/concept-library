import { NextRequest, NextResponse } from "next/server";
import type { ApiResult, Concept } from "@/types";
import { apiHandler, ApiRouteError } from "@/lib/errors";
import { getSession, requireUser } from "@/lib/supabase/server";
import { listConcepts, createConcept } from "@/lib/repos/concepts";
import { conceptInputSchema } from "@/lib/validators/concept";

export const GET = apiHandler(async (request: NextRequest) => {
  const session = await getSession();
  requireUser(session);

  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q") ?? undefined;
  const tag = searchParams.get("tag") ?? undefined;
  const topic_id = searchParams.get("topic_id") ?? undefined;

  const concepts = await listConcepts(session, { q, tag, topic_id });
  return NextResponse.json<ApiResult<Concept[]>>({ ok: true, data: concepts });
});

export const POST = apiHandler(async (request: NextRequest) => {
  const session = await getSession();
  requireUser(session);

  const body = await request.json().catch(() => null);
  const parsed = conceptInputSchema.safeParse(body);
  if (!parsed.success) {
    throw new ApiRouteError(
      "VALIDATION",
      "Validation failed",
      422,
      parsed.error.issues.map((i) => ({ field: i.path.join("."), message: i.message }))
    );
  }

  const concept = await createConcept(session, parsed.data);
  return NextResponse.json<ApiResult<Concept>>({ ok: true, data: concept }, { status: 201 });
});
