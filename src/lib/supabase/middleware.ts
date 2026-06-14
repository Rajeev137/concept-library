import { createServerClient } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";

// TODO: Create a Supabase client inside Next.js middleware that can read and refresh
// session cookies on each request. Must call supabase.auth.getUser() to trigger
// the token refresh cycle, then forward updated Set-Cookie headers on the response.
// This is the mechanism that keeps sessions alive across navigations (30-day sliding window).
export function createMiddlewareClient(request: NextRequest, response: NextResponse) {
  // TODO: return createServerClient(
  //   process.env.NEXT_PUBLIC_SUPABASE_URL!,
  //   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  //   { cookies: { getAll() { ... }, setAll() { ... } } }
  // )
}
