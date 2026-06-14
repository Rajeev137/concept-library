import { NextRequest, NextResponse } from "next/server";
import type { ApiResult, Session } from "@/types";
import { apiHandler, ApiRouteError } from "@/lib/errors";
import { checkRateLimit, getClientIp, RATE_LIMIT_RULES } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validators/auth";
import { createClient } from "@/lib/supabase/server";

// POST /api/auth/login
// Body: { email, password }
// Response: ApiResult<{ session: Session }>
// Rate limit: 5 / 15 min per IP, then 1 / min (RATE_LIMIT_RULES.login)
// Minimum response time: 250ms to prevent timing-based email enumeration
// On any auth failure, return generic error — never distinguish wrong-email vs wrong-password
// Sets HttpOnly, Secure, SameSite=Lax session cookie via @supabase/ssr
export const POST = apiHandler(async (request: NextRequest) => {
  // TODO: start 250ms minimum-response timer

  // TODO: check rate limit with RATE_LIMIT_RULES.login; throw 429 + Retry-After if exceeded

  // TODO: parse and validate body with loginSchema; throw 422 on failure

  // TODO: call supabase.auth.signInWithPassword({ email, password })
  // TODO: on error (any), wait for 250ms floor then return ApiRouteError("AUTH_FAILED", "Invalid credentials.", 401)
  // — same message whether email is unknown or password is wrong
  // TODO: if session.user.email_confirmed_at is null, throw ApiRouteError("EMAIL_NOT_CONFIRMED", ..., 401)

  // TODO: map supabase session to our Session type
  // TODO: return NextResponse.json({ ok: true, data: { session } })
  return NextResponse.json({ ok: true, data: null });
});
