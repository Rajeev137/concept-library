import { NextRequest, NextResponse } from "next/server";
import type { ApiResult } from "@/types";
import { authHandler, ApiRouteError } from "@/lib/errors";
import { checkRateLimit, getClientIp, RATE_LIMIT_RULES } from "@/lib/rate-limit";
import { passwordResetRequestSchema } from "@/lib/validators/auth";
import { createClient } from "@/lib/supabase/server";

export const POST = authHandler(async (request: NextRequest) => {
  const ip = getClientIp(request);
  const rl = await checkRateLimit(RATE_LIMIT_RULES.password_reset, ip);
  if (!rl.allowed) {
    throw new ApiRouteError("RATE_LIMITED", "Too many reset attempts. Try again later.", 429);
  }

  const body = await request.json().catch(() => null);
  const parsed = passwordResetRequestSchema.safeParse(body);
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
  // Fire-and-forget: never reveal whether the email exists or not
  await supabase.auth
    .resetPasswordForEmail(parsed.data.email)
    .catch((err) => console.error("[password-reset/request] Supabase error:", err));

  return NextResponse.json<ApiResult<{ ok: true }>>({ ok: true, data: { ok: true } });
});
