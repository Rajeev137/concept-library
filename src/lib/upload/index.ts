import type { Session, UploadResponse } from "@/types";
import { IMAGE_POLICY } from "@/types";

// TODO: Import and use createServiceClient from @/lib/supabase/server for storage operations.
// The service-role key is required because Storage RLS allows uploads but the
// path must be server-validated before the write to prevent path traversal.

// TODO: Sanitize a filename per contract: strip path separators (/ \), normalize unicode
// (NFC), truncate to IMAGE_POLICY.MAX_FILENAME_CHARS. Return the sanitized name.
export function sanitizeFilename(raw: string): string {
  // TODO: return raw.replace(/[/\\]/g, "").normalize("NFC").slice(0, IMAGE_POLICY.MAX_FILENAME_CHARS)
  return raw;
}

// TODO: Upload an image to Supabase Storage bucket "concept-images" under the path
// "{session.user_id}/{concept_id}/{sanitized_filename}". Validate MIME against
// IMAGE_POLICY.ALLOWED_MIME before uploading; throw ApiRouteError(415) on bad type.
// Return { url, path } where url is the public CDN URL from getPublicUrl().
export async function uploadConceptImage(
  session: Session,
  conceptId: string,
  file: Blob,
  filename: string,
  mimeType: string
): Promise<UploadResponse> {
  // TODO: if (!IMAGE_POLICY.ALLOWED_MIME.includes(mimeType as any)) throw new ApiRouteError("UNSUPPORTED_MEDIA_TYPE", ..., 415)
  // TODO: const sanitized = sanitizeFilename(filename)
  // TODO: const path = `${session.user_id}/${conceptId}/${sanitized}`
  // TODO: const supabase = createServiceClient()
  // TODO: const { error } = await supabase.storage.from("concept-images").upload(path, file, { contentType: mimeType, upsert: false })
  // TODO: if (error) throw new ApiRouteError("UPSTREAM_UNAVAILABLE", "Storage upload failed — please retry", 502)
  // TODO: const { data } = supabase.storage.from("concept-images").getPublicUrl(path)
  // TODO: return { url: data.publicUrl, path }
  return { url: "", path: "" };
}

// TODO: Delete an image from Supabase Storage by path. Validate that the path's first
// segment matches session.user_id to prevent cross-user deletion before calling remove().
// Throw ApiRouteError(403→404) if path does not belong to the session user.
export async function deleteConceptImage(
  session: Session,
  path: string
): Promise<{ ok: true }> {
  // TODO: const [ownerId] = path.split("/")
  // TODO: if (ownerId !== session.user_id) throw new ApiRouteError("NOT_FOUND", "Not found", 404)
  // TODO: const supabase = createServiceClient()
  // TODO: const { error } = await supabase.storage.from("concept-images").remove([path])
  // TODO: if (error) throw new ApiRouteError("UPSTREAM_UNAVAILABLE", "Storage delete failed — please retry", 502)
  return { ok: true };
}
