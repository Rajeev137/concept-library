import type { Session, UploadResponse } from "@/types";
import { IMAGE_POLICY } from "@/types";
import { createServiceClient } from "@/lib/supabase/server";
import { ApiRouteError } from "@/lib/errors";

const MAGIC_BYTES: { mime: string; bytes: number[]; offset?: number }[] = [
  { mime: "image/png",  bytes: [0x89, 0x50, 0x4e, 0x47] },
  { mime: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
  { mime: "image/gif",  bytes: [0x47, 0x49, 0x46] },
  // WebP: "RIFF" at 0, "WEBP" at 8
  { mime: "image/webp", bytes: [0x52, 0x49, 0x46, 0x46], offset: 0 },
];

function sniffMime(buf: Uint8Array): string | null {
  for (const { mime, bytes, offset = 0 } of MAGIC_BYTES) {
    if (bytes.every((b, i) => buf[offset + i] === b)) {
      // Extra check for WebP: bytes 8-11 must be "WEBP"
      if (mime === "image/webp") {
        const webp = [0x57, 0x45, 0x42, 0x50];
        if (!webp.every((b, i) => buf[8 + i] === b)) continue;
      }
      return mime;
    }
  }
  return null;
}

export function sanitizeFilename(raw: string): string {
  const noSeps = raw.replace(/[/\\]/g, "");
  const normalized = noSeps.normalize("NFC");
  if (normalized.length <= IMAGE_POLICY.MAX_FILENAME_CHARS) return normalized;
  // Preserve extension when truncating
  const dot = normalized.lastIndexOf(".");
  if (dot === -1) return normalized.slice(0, IMAGE_POLICY.MAX_FILENAME_CHARS);
  const ext = normalized.slice(dot);
  const base = normalized.slice(0, IMAGE_POLICY.MAX_FILENAME_CHARS - ext.length);
  return base + ext;
}

export async function uploadConceptImage(
  session: Session,
  conceptId: string,
  file: Blob,
  filename: string,
  mimeType: string
): Promise<UploadResponse> {
  if (!(IMAGE_POLICY.ALLOWED_MIME as readonly string[]).includes(mimeType)) {
    throw new ApiRouteError("UNSUPPORTED_MEDIA_TYPE", "File type not allowed.", 415);
  }

  const buf = new Uint8Array(await file.arrayBuffer());
  const sniffed = sniffMime(buf);
  if (!sniffed || sniffed !== mimeType) {
    throw new ApiRouteError("UNSUPPORTED_MEDIA_TYPE", "File content does not match declared type.", 415);
  }

  const sanitized = sanitizeFilename(filename);
  const path = `${session.user_id}/${conceptId}/${sanitized}`;

  const supabase = createServiceClient();
  const { error } = await supabase.storage
    .from("concept-images")
    .upload(path, file, { contentType: mimeType, upsert: false });

  if (error) {
    throw new ApiRouteError("UPSTREAM_UNAVAILABLE", "Storage upload failed — please retry.", 502);
  }

  const { data: signedData, error: signedError } = await supabase.storage
    .from("concept-images")
    .createSignedUrl(path, 31536000);
  if (signedError || !signedData) {
    throw new ApiRouteError("UPSTREAM_UNAVAILABLE", "Could not generate image URL.", 502);
  }
  return { url: signedData.signedUrl, path };
}

export async function deleteConceptImage(
  session: Session,
  path: string
): Promise<{ ok: true }> {
  const [ownerId] = path.split("/");
  if (ownerId !== session.user_id) {
    throw new ApiRouteError("NOT_FOUND", "Not found.", 404);
  }

  const supabase = createServiceClient();
  const { error } = await supabase.storage
    .from("concept-images")
    .remove([path]);

  if (error) {
    throw new ApiRouteError("UPSTREAM_UNAVAILABLE", "Storage delete failed — please retry.", 502);
  }

  return { ok: true };
}
