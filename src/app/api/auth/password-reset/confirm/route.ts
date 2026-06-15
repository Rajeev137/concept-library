export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import type { ApiResult } from "@/types";
import { apiHandler, ApiRouteError } from "@/lib/errors";
import { passwordResetConfirmSchema, checkPasswordPolicy } from "@/lib/validators/auth";
import { createClient } from "@/lib/supabase/server";

const GENERIC_TOKEN_ERROR = "Invalid or expired reset link.";

export const POST = apiHandler(async (request: NextRequest) => {
  const body = await request.json().catch(() => null);
  const parsed = passwordResetConfirmSchema.safeParse(body);
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

  const policy = checkPasswordPolicy(parsed.data.new_password);
  if (!policy.ok) {
    throw new ApiRouteError("VALIDATION", "Password does not meet requirements.", 422, policy.errors);
  }

  const supabase = await createClient();

  // Exchange the OTP token for a session so we can call updateUser
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(parsed.data.token);
  if (exchangeError) {
    throw new ApiRouteError("AUTH_FAILED", GENERIC_TOKEN_ERROR, 400);
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: parsed.data.new_password,
  });
  if (updateError) {
    throw new ApiRouteError("AUTH_FAILED", GENERIC_TOKEN_ERROR, 400);
  }

  return NextResponse.json<ApiResult<{ ok: true }>>({ ok: true, data: { ok: true } });
});
