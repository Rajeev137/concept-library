import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Session } from "@/types";

// TODO: Create and return a Supabase server client that reads/writes HttpOnly cookies
// via next/headers cookies(). Used in Server Components and API route handlers.
// Uses NEXT_PUBLIC_SUPABASE_ANON_KEY — RLS enforces per-user access.
export async function createClient() {
  // TODO: const cookieStore = await cookies()
  // TODO: return createServerClient(
  //   process.env.NEXT_PUBLIC_SUPABASE_URL!,
  //   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  //   { cookies: { getAll() { ... }, setAll() { ... } } }
  // )
}

// TODO: Create and return a Supabase server client using SUPABASE_SERVICE_ROLE_KEY.
// Used ONLY inside app/api/** route handlers that need to bypass RLS (e.g., for
// server-side admin queries). NEVER import this in components, hooks, or middleware.
export function createServiceClient() {
  // TODO: return createServerClient(
  //   process.env.NEXT_PUBLIC_SUPABASE_URL!,
  //   process.env.SUPABASE_SERVICE_ROLE_KEY!,
  //   { cookies: { getAll: () => [], setAll: () => {} } }
  // )
}

// TODO: Read the current Supabase session from cookies and map it to our Session type.
// Returns null if no valid session. Supabase SSR handles access-token refresh transparently.
export async function getSession(): Promise<Session | null> {
  // TODO: const supabase = await createClient()
  // TODO: const { data: { session } } = await supabase.auth.getSession()
  // TODO: if (!session) return null
  // TODO: return { user_id: session.user.id, email: session.user.email!, access_token: session.access_token, expires_at: new Date(session.expires_at! * 1000).toISOString() }
  return null;
}

// TODO: Assert that session is non-null. Throw a 401 ApiError if it is null.
// Use this at the top of every authenticated API route handler.
export function requireUser(s: Session | null): asserts s is Session {
  // TODO: if (!s) throw new ApiRouteError("UNAUTHENTICATED", "Authentication required", 401)
}
