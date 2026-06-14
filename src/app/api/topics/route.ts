import { NextRequest, NextResponse } from "next/server";
import type { ApiResult, Topic } from "@/types";
import { apiHandler, ApiRouteError } from "@/lib/errors";
import { getSession, requireUser } from "@/lib/supabase/server";
import { listTopics, createTopic } from "@/lib/repos/topics";
import { topicInputSchema } from "@/lib/validators/topic";

// GET /api/topics
// Auth required. Returns Topic[] for the session user, ordered by name ASC.
// Used to populate the sidebar topic list with concept counts.
export const GET = apiHandler(async (_request: NextRequest) => {
  // TODO: const session = await getSession(); requireUser(session)
  // TODO: const topics = await listTopics(session)
  // TODO: return NextResponse.json({ ok: true, data: topics })
  return NextResponse.json({ ok: true, data: [] });
});

// POST /api/topics
// Auth required. Body: TopicInput
// Creates a new topic for the session user.
// 409 if a topic with the same name (case-insensitive) already exists — return existing topic.
// Validates input via topicInputSchema.
export const POST = apiHandler(async (request: NextRequest) => {
  // TODO: const session = await getSession(); requireUser(session)
  // TODO: parse and validate body with topicInputSchema; throw 422 on failure
  // TODO: const topic = await createTopic(session, body)  — throws 409 with existing topic on duplicate
  // TODO: return NextResponse.json({ ok: true, data: topic }, { status: 201 })
  return NextResponse.json({ ok: true, data: null }, { status: 201 });
});
