import { NextRequest, NextResponse } from "next/server";
import type { ApiResult } from "@/types";
import { apiHandler, ApiRouteError } from "@/lib/errors";
import { checkRateLimit, getClientIp, RATE_LIMIT_RULES } from "@/lib/rate-limit";
import { passwordResetRequestSchema } from "@/lib/validators/auth";
import { createClient } from "@/lib/supabase/server";

// POST /api/auth/password-reset/request
// Body: { email }
// Response: ApiResult<{ ok: true }> — ALWAYS 200, even if email not found (prevents enumeration)
// Rate limit: 3 / hour per IP (RATE_LIMIT_RULES.password_reset)
// Minimum response time: 250ms
// Sends reset email via supabase.auth.resetPasswordForEmail()
export const POST = apiHandler(async (request: NextRequest) => {
  // TODO: start 250ms minimum-response timer

  // TODO: check rate limit with RATE_LIMIT_RULES.password_reset; throw 429 if exceeded

  // TODO: parse and validate body with passwordResetRequestSchema; throw 422 on failure

  // TODO: call supabase.auth.resetPasswordForEmail(body.email, { redirectTo: "..." })
  // — fire and forget; never reveal whether the email exists or not
  // On Supabase error: log server-side, silently swallow (still return { ok: true })

  // TODO: await minimum 250ms floor

  // TODO: return NextResponse.json({ ok: true, data: { ok: true } })
  return NextResponse.json({ ok: true, data: { ok: true } });
});
