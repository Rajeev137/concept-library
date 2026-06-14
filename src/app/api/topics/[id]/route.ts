import { NextRequest, NextResponse } from "next/server";
import type { ApiResult, Topic } from "@/types";
import { apiHandler, ApiRouteError } from "@/lib/errors";
import { getSession, requireUser } from "@/lib/supabase/server";
import { getTopic, renameTopic, removeTopic } from "@/lib/repos/topics";
import { topicInputSchema } from "@/lib/validators/topic";

type Params = { params: Promise<{ id: string }> };

// PUT /api/topics/:id
// Auth required. Body: TopicInput
// Renames the topic. 404 if not found for this user. 409 if new name already exists.
export const PUT = apiHandler(async (request: NextRequest, { params }: Params) => {
  // TODO: const session = await getSession(); requireUser(session)
  // TODO: const { id } = await params
  // TODO: parse and validate body with topicInputSchema; throw 422 on failure
  // TODO: const topic = await renameTopic(session, id, body.name)
  // TODO: return NextResponse.json({ ok: true, data: topic })
  return NextResponse.json({ ok: true, data: null });
});

// DELETE /api/topics/:id
// Auth required.
// 409 if topic has concepts under it (with count in message). Never cascades.
// 404 if not found for this user.
export const DELETE = apiHandler(async (request: NextRequest, { params }: Params) => {
  // TODO: const session = await getSession(); requireUser(session)
  // TODO: const { id } = await params
  // TODO: const result = await removeTopic(session, id)
  // TODO: return NextResponse.json({ ok: true, data: result })
  return NextResponse.json({ ok: true, data: { ok: true } });
});
