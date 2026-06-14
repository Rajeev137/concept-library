import { createServerClient, type CookieMethodsServer } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Session } from "@/types";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component where cookies are read-only;
            // middleware handles the actual refresh.
          }
        },
      } satisfies CookieMethodsServer,
    }
  );
}

// Used ONLY in app/api/** route handlers. Never import in components or middleware.
export function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      } satisfies CookieMethodsServer,
    }
  );
}

export async function getSession(): Promise<Session | null> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return null;
  return {
    user_id: session.user.id,
    email: session.user.email!,
    access_token: session.access_token,
    expires_at: new Date(session.expires_at! * 1000).toISOString(),
  };
}

class UnauthenticatedError extends Error {
  readonly code = "UNAUTHENTICATED";
  readonly httpStatus = 401;
  constructor() {
    super("Authentication required");
    this.name = "UnauthenticatedError";
  }
}

export function requireUser(s: Session | null): asserts s is Session {
  if (!s) throw new UnauthenticatedError();
}
