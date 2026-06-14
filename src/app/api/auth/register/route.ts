import { NextRequest, NextResponse } from "next/server";
import type { ApiResult, Session } from "@/types";
import { authHandler, ApiRouteError } from "@/lib/errors";
import { checkRateLimit, getClientIp, RATE_LIMIT_RULES } from "@/lib/rate-limit";
import { registerSchema, checkPasswordPolicy } from "@/lib/validators/auth";
import { createClient } from "@/lib/supabase/server";

const GENERIC_ERROR = "Registration failed. Please try again.";

export const POST = authHandler(async (request: NextRequest) => {
  const ip = getClientIp(request);
  const rl = await checkRateLimit(RATE_LIMIT_RULES.register, ip);
  if (!rl.allowed) {
    throw new ApiRouteError("RATE_LIMITED", "Too many registration attempts. Try again later.", 429);
  }

  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    throw new ApiRouteError(
      "VALIDATION",
      "Invalid request.",
      422,
      parsed.error.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }))
    );
  }

  const policy = checkPasswordPolicy(parsed.data.password);
  if (!policy.ok) {
    throw new ApiRouteError("AUTH_FAILED", GENERIC_ERROR, 400);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error || !data.session) {
    // Never distinguish "email already registered" from other errors
    throw new ApiRouteError("AUTH_FAILED", GENERIC_ERROR, 400);
  }

  const session: Session = {
    user_id: data.session.user.id,
    email: data.session.user.email!,
    access_token: data.session.access_token,
    expires_at: new Date(data.session.expires_at! * 1000).toISOString(),
  };

  return NextResponse.json<ApiResult<{ session: Session }>>(
    { ok: true, data: { session } },
    { status: 201 }
  );
});
