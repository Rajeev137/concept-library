export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import type { ApiResult, Concept } from "@/types";
import { apiHandler, ApiRouteError } from "@/lib/errors";
import { getSession, requireUser } from "@/lib/supabase/server";
import { getConcept, updateConcept, removeConcept } from "@/lib/repos/concepts";
import { conceptInputSchema } from "@/lib/validators/concept";

type Params = { params: Promise<{ id: string }> };

export const GET = apiHandler(async (request: NextRequest, { params }: Params) => {
  const session = await getSession();
  requireUser(session);

  const { id } = await params;
  const concept = await getConcept(session, id);
  if (!concept) throw new ApiRouteError("NOT_FOUND", "Concept not found", 404);

  return NextResponse.json<ApiResult<Concept>>({ ok: true, data: concept });
});

export const PUT = apiHandler(async (request: NextRequest, { params }: Params) => {
  const session = await getSession();
  requireUser(session);

  const { id } = await params;
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

  const concept = await updateConcept(session, id, parsed.data);
  return NextResponse.json<ApiResult<Concept>>({ ok: true, data: concept });
});

export const DELETE = apiHandler(async (request: NextRequest, { params }: Params) => {
  const session = await getSession();
  requireUser(session);

  const { id } = await params;
  const result = await removeConcept(session, id);
  return NextResponse.json<ApiResult<{ ok: true }>>({ ok: true, data: result });
});
