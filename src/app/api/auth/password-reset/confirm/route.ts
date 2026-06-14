import { NextRequest, NextResponse } from "next/server";
import type { ApiResult } from "@/types";
import { apiHandler, ApiRouteError } from "@/lib/errors";
import { passwordResetConfirmSchema, checkPasswordPolicy } from "@/lib/validators/auth";
import { createClient } from "@/lib/supabase/server";

// POST /api/auth/password-reset/confirm
// Body: { token, new_password }
// Response: ApiResult<{ ok: true }>
// Token is single-use, <= 30 min lifetime (enforced by Supabase).
// new_password must pass password policy (>= 12 chars, not in common list).
// Generic error on invalid/expired token — no token-vs-password distinction.
export const POST = apiHandler(async (request: NextRequest) => {
  // TODO: parse and validate body with passwordResetConfirmSchema; throw 422 on failure

  // TODO: check password policy via checkPasswordPolicy(body.new_password); throw 400 on failure

  // TODO: exchange the token for a session using supabase.auth.exchangeCodeForSession(body.token)
  // (or verifyOtp depending on Supabase flow used — pick one consistent with request/confirm pair)
  // On error: return generic ApiRouteError("AUTH_FAILED", "Invalid or expired reset link.", 400)

  // TODO: update password using supabase.auth.updateUser({ password: body.new_password })

  // TODO: invalidate the token (Supabase handles single-use automatically)

  // TODO: return NextResponse.json({ ok: true, data: { ok: true } })
  return NextResponse.json({ ok: true, data: { ok: true } });
});
