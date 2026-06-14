import { NextRequest, NextResponse } from "next/server";
import type { ApiResult } from "@/types";
import { apiHandler } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";

export const POST = apiHandler(async (_request: NextRequest) => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.json<ApiResult<{ ok: true }>>({ ok: true, data: { ok: true } });
});
