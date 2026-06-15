export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { ApiResult, UploadResponse } from "@/types";
import { IMAGE_POLICY } from "@/types";
import { apiHandler, ApiRouteError } from "@/lib/errors";
import { getSession, requireUser, createServiceClient } from "@/lib/supabase/server";
import { uploadConceptImage, deleteConceptImage, sanitizeFilename } from "@/lib/upload";

const SignedUrlSchema = z.object({
  action: z.literal("create-signed-url"),
  concept_id: z.string().min(1),
  filename: z.string().min(1),
  mime_type: z.string().min(1),
}).strict();

export const POST = apiHandler(async (request: NextRequest) => {
  const session = await getSession();
  requireUser(session);

  const contentType = request.headers.get("content-type") ?? "";

  if (!contentType.includes("multipart/form-data")) {
    const body = await request.json().catch(() => null);
    const parsed = SignedUrlSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiRouteError(
        "VALIDATION",
        "Validation failed",
        422,
        parsed.error.issues.map((i) => ({ field: i.path.join("."), message: i.message }))
      );
    }

    const { concept_id, filename, mime_type } = parsed.data;

    if (!(IMAGE_POLICY.ALLOWED_MIME as readonly string[]).includes(mime_type)) {
      throw new ApiRouteError("UNSUPPORTED_MEDIA_TYPE", "File type not allowed.", 415);
    }

    const sanitized = sanitizeFilename(filename);
    const path = `${session.user_id}/${concept_id}/${sanitized}`;

    const supabase = createServiceClient();
    const { data, error } = await supabase.storage
      .from("concept-images")
      .createSignedUploadUrl(path);

    if (error || !data) {
      throw new ApiRouteError("UPSTREAM_UNAVAILABLE", "Could not create signed URL — please retry.", 502);
    }

    const { data: readUrlData, error: readUrlError } = await supabase.storage
      .from("concept-images")
      .createSignedUrl(path, 31536000);
    if (readUrlError || !readUrlData) {
      throw new ApiRouteError("UPSTREAM_UNAVAILABLE", "Could not generate image URL.", 502);
    }
    return NextResponse.json<ApiResult<{ signed_url: string; path: string; url: string }>>(
      { ok: true, data: { signed_url: data.signedUrl, path, url: readUrlData.signedUrl } },
      { status: 201 }
    );
  }

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
