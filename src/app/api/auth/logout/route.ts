import { NextRequest, NextResponse } from "next/server";
import type { ApiResult } from "@/types";
import { apiHandler } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";

// POST /api/auth/logout
// Body: {} (empty)
// Response: ApiResult<{ ok: true }>
// No rate limit. No auth required (idempotent — logging out an already-logged-out user is OK).
// Must clear Supabase session cookies via supabase.auth.signOut().
export const POST = apiHandler(async (_request: NextRequest) => {
  // TODO: const supabase = await createClient()
  // TODO: await supabase.auth.signOut()  — clears HttpOnly session cookies
  // TODO: return NextResponse.json({ ok: true, data: { ok: true } })
  return NextResponse.json({ ok: true, data: { ok: true } });
});
