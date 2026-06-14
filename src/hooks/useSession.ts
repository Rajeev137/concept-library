"use client";

import { useState, useEffect } from "react";
import type { Session } from "@/types";
import { createClient } from "@/lib/supabase/client";
import type { Session as SupabaseSession } from "@supabase/supabase-js";

function toSession(s: SupabaseSession): Session {
  return {
    user_id: s.user.id,
    email: s.user.email ?? "",
    access_token: s.access_token,
    expires_at: s.expires_at ? new Date(s.expires_at * 1000).toISOString() : new Date().toISOString(),
  };
}

export interface UseSessionResult {
  session: Session | null;
  loading: boolean;
  error: Error | null;
}

export function useSession(): UseSessionResult {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data, error: err }) => {
      if (err) {
        setError(new Error(err.message));
      } else {
        setSession(data.session ? toSession(data.session) : null);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s ? toSession(s) : null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { session, loading, error };
}
