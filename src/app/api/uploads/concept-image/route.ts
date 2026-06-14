import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { ApiResult, UploadResponse } from "@/types";
import { IMAGE_POLICY } from "@/types";
import { apiHandler, ApiRouteError } from "@/lib/errors";
import { getSession, requireUser } from "@/lib/supabase/server";
import { uploadConceptImage, deleteConceptImage } from "@/lib/upload";

export const POST = apiHandler(async (request: NextRequest) => {
  const session = await getSession();
  requireUser(session);

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const concept_id = formData.get("concept_id") as string | null;

  if (!file || !concept_id) {
    throw new ApiRouteError("VALIDATION", "file and concept_id are required", 422);
  }

  if (!(IMAGE_POLICY.ALLOWED_MIME as readonly string[]).includes(file.type)) {
    throw new ApiRouteError("UNSUPPORTED_MEDIA_TYPE", "File type not allowed.", 415);
  }

  const result = await uploadConceptImage(session, concept_id, file, file.name, file.type);
  return NextResponse.json<ApiResult<UploadResponse>>({ ok: true, data: result }, { status: 201 });
});

export const DELETE = apiHandler(async (request: NextRequest) => {
  const session = await getSession();
  requireUser(session);

  const body = await request.json().catch(() => null);
  const parsed = z.object({ path: z.string().min(1) }).strict().safeParse(body);
  if (!parsed.success) {
    throw new ApiRouteError(
      "VALIDATION",
      "Validation failed",
      422,
      parsed.error.issues.map((i) => ({ field: i.path.join("."), message: i.message }))
    );
  }

  const result = await deleteConceptImage(session, parsed.data.path);
  return NextResponse.json<ApiResult<{ ok: true }>>({ ok: true, data: result });
});
