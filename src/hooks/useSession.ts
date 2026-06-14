"use client";

import type { Session } from "@/types";
import { createClient } from "@/lib/supabase/client";

// Client-side hook to read the current Supabase session.
// Subscribes to onAuthStateChange to react to login/logout/refresh events.
// On 401 API responses, the middleware redirect handles server-side; this hook
// allows client components to read the current user without a server round-trip.
//
// TODO: useState<Session | null>(null)
// TODO: useEffect: call supabase.auth.getSession() on mount; subscribe to onAuthStateChange.
// TODO: map Supabase session to our Session type (same mapping as server.ts).
// TODO: unsubscribe from onAuthStateChange on unmount.
export function useSession(): Session | null {
  // TODO: const [session, setSession] = useState<Session | null>(null)
  // TODO: useEffect(() => { ... }, [])
  // TODO: return session
  return null;
}
