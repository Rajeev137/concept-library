export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import type { ApiResult, Session } from "@/types";
import { authHandler, ApiRouteError } from "@/lib/errors";
import { checkRateLimit, getClientIp, RATE_LIMIT_RULES } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validators/auth";
import { createClient } from "@/lib/supabase/server";

const GENERIC_ERROR = "Invalid credentials.";

export const POST = authHandler(async (request: NextRequest) => {
  const ip = getClientIp(request);
  const rl = await checkRateLimit(RATE_LIMIT_RULES.login, ip);
  if (!rl.allowed) {
    throw new ApiRouteError("RATE_LIMITED", "Too many login attempts. Try again later.", 429);
  }

  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
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

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error || !data.session) {
    throw new ApiRouteError("AUTH_FAILED", GENERIC_ERROR, 401);
  }

  if (!data.session.user.email_confirmed_at) {
    throw new ApiRouteError(
      "AUTH_FAILED",
      "Please confirm your email before logging in.",
      401
    );
  }

  const session: Session = {
    user_id: data.session.user.id,
    email: data.session.user.email!,
    access_token: data.session.access_token,
    expires_at: new Date(data.session.expires_at! * 1000).toISOString(),
  };

  return NextResponse.json<ApiResult<{ session: Session }>>({ ok: true, data: { session } });
});
