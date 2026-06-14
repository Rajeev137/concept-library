import { NextRequest, NextResponse } from "next/server";
import type { ApiResult, Topic } from "@/types";
import { apiHandler, ApiRouteError } from "@/lib/errors";
import { getSession, requireUser } from "@/lib/supabase/server";
import { listTopics, createTopic, findTopicByName } from "@/lib/repos/topics";
import { topicInputSchema } from "@/lib/validators/topic";

export const GET = apiHandler(async () => {
  const session = await getSession();
  requireUser(session);
  const topics = await listTopics(session);
  return NextResponse.json<ApiResult<Topic[]>>({ ok: true, data: topics });
});

type TopicConflictResponse = {
  ok: false;
  error: { code: "CONFLICT"; message: string };
  data: Topic;
};

export const POST = apiHandler(
  async (request: NextRequest): Promise<NextResponse<ApiResult<Topic> | TopicConflictResponse>> => {
    const session = await getSession();
    requireUser(session);

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

    const existing = await findTopicByName(session, parsed.data.name);
    if (existing) {
      // 409: return existing topic so the client can select it instead of creating a duplicate.
      return NextResponse.json<TopicConflictResponse>(
        { ok: false, error: { code: "CONFLICT", message: `Topic "${existing.name}" already exists` }, data: existing },
        { status: 409 }
      );
    }

    const topic = await createTopic(session, parsed.data);
    return NextResponse.json<ApiResult<Topic>>({ ok: true, data: topic }, { status: 201 });
  }
);
