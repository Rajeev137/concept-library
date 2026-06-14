import { NextRequest, NextResponse } from "next/server";
import type { ApiResult, UploadResponse } from "@/types";
import { IMAGE_POLICY } from "@/types";
import { apiHandler, ApiRouteError } from "@/lib/errors";
import { getSession, requireUser } from "@/lib/supabase/server";
import { uploadConceptImage, deleteConceptImage } from "@/lib/upload";

// POST /api/uploads/concept-image
// Auth required. Body: multipart/form-data with fields:
//   - file: the image blob
//   - concept_id: UUID or "draft"
// MIME type validated against IMAGE_POLICY.ALLOWED_MIME; throw 415 on mismatch.
// Filename sanitized server-side before storage (strip separators, normalize unicode, max 80 chars).
// Storage path: "{session.user_id}/{concept_id}/{sanitized_filename}"
// Response: ApiResult<UploadResponse> where url is the public CDN URL.
// Files >= 4.5MB (Vercel body limit): use direct-to-Supabase signed URL flow instead.
export const POST = apiHandler(async (request: NextRequest) => {
  // TODO: const session = await getSession(); requireUser(session)

  // TODO: const formData = await request.formData()
  // TODO: const file = formData.get("file") as File | null
  // TODO: const concept_id = formData.get("concept_id") as string | null
  // TODO: if (!file || !concept_id) throw new ApiRouteError("VALIDATION", "file and concept_id are required", 422)

  // TODO: validate file.type against IMAGE_POLICY.ALLOWED_MIME; throw ApiRouteError("UNSUPPORTED_MEDIA_TYPE", ..., 415)

  // TODO: const result = await uploadConceptImage(session, concept_id, file, file.name, file.type)
  // TODO: return NextResponse.json({ ok: true, data: result }, { status: 201 })
  return NextResponse.json({ ok: true, data: null }, { status: 201 });
});

// DELETE /api/uploads/concept-image
// Auth required. Body: { path: string }
// Validates that path's first segment matches session.user_id (prevents cross-user deletion).
// Returns { ok: true } on success.
export const DELETE = apiHandler(async (request: NextRequest) => {
  // TODO: const session = await getSession(); requireUser(session)

  // TODO: const body = await request.json()
  // TODO: const { path } = z.object({ path: z.string().min(1) }).strict().parse(body)

  // TODO: const result = await deleteConceptImage(session, path)
  // TODO: return NextResponse.json({ ok: true, data: result })
  return NextResponse.json({ ok: true, data: { ok: true } });
});
