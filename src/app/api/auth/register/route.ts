import { NextRequest, NextResponse } from "next/server";
import type { ApiResult, Session } from "@/types";
import { apiHandler, ApiRouteError } from "@/lib/errors";
import { checkRateLimit, getClientIp, RATE_LIMIT_RULES } from "@/lib/rate-limit";
import { registerSchema, checkPasswordPolicy } from "@/lib/validators/auth";
import { createClient } from "@/lib/supabase/server";

// POST /api/auth/register
// Body: { email, password }
// Response: ApiResult<{ session: Session }>
// Rate limit: 3 / hour per IP (RATE_LIMIT_RULES.register)
// Password: >= 12 chars, not in common-passwords denylist
// Email confirmation required before first login
// Response must be uniform on error (no "email already registered" distinction)
// Minimum response time: 250ms to prevent timing attacks / email enumeration
export const POST = apiHandler(async (request: NextRequest) => {
  // TODO: enforce minimum response time of 250ms (start timer at top, sleep remainder before returning)

  // TODO: check rate limit — throw ApiRouteError("RATE_LIMITED", ..., 429) with Retry-After if exceeded
  const ip = getClientIp(request);
  // const rl = await checkRateLimit(RATE_LIMIT_RULES.register, ip)
  // if (!rl.allowed) throw new ApiRouteError("RATE_LIMITED", "Too many registration attempts. Try again later.", 429)

  // TODO: parse and validate body with registerSchema.strict().safeParse(await request.json())
  // throw ApiRouteError("VALIDATION", ..., 422) on schema failure

  // TODO: check password policy via checkPasswordPolicy(body.password)
  // throw ApiRouteError("AUTH_FAILED", "Password does not meet requirements.", 400) on failure

  // TODO: call supabase.auth.signUp({ email, password, options: { emailRedirectTo: ... } })
  // TODO: on Supabase error, return generic ApiRouteError("AUTH_FAILED", "Registration failed.", 400)
  // — NEVER distinguish "email already exists" from other errors

  // TODO: return NextResponse.json({ ok: true, data: { session } }, { status: 201 })
  return NextResponse.json({ ok: true, data: null }, { status: 201 });
});
