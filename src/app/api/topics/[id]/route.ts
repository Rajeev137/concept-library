export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import type { ApiResult, Topic } from "@/types";
import { apiHandler, ApiRouteError } from "@/lib/errors";
import { getSession, requireUser } from "@/lib/supabase/server";
import { renameTopic, removeTopic } from "@/lib/repos/topics";
import { topicInputSchema } from "@/lib/validators/topic";

type Params = { params: Promise<{ id: string }> };

export const PUT = apiHandler(async (request: NextRequest, { params }: Params) => {
  const session = await getSession();
  requireUser(session);
  const { id } = await params;

  const body = await request.json().catch(() => null);
  const parsed = topicInputSchema.safeParse(body);
  if (!parsed.success) {
    throw new ApiRouteError(
      "VALIDATION",
      "Validation failed",
      422,
      parsed.error.issues.map((i) => ({ field: i.path.join("."), message: i.message }))
    );
  }

  const topic = await renameTopic(session, id, parsed.data.name);
  return NextResponse.json<ApiResult<Topic>>({ ok: true, data: topic });
});

export const DELETE = apiHandler(async (request: NextRequest, { params }: Params) => {
  const session = await getSession();
  requireUser(session);
  const { id } = await params;

  const result = await removeTopic(session, id);
  return NextResponse.json<ApiResult<{ ok: true }>>({ ok: true, data: result });
});
