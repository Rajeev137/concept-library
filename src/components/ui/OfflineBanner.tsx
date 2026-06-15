"use client";

import { useState, useEffect } from "react";

function hasDraftInStorage(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return Object.keys(localStorage).some((k) => k.startsWith("draft:concept:"));
  } catch {
    return false;
  }
}

export default function OfflineBanner() {
  const [offline, setOffline] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);

  useEffect(() => {
    const isOffline = !navigator.onLine;
    setOffline(isOffline);
    if (isOffline) setHasDraft(hasDraftInStorage());

    const onOnline = () => {
      setOffline(false);
      setHasDraft(false);
    };
    const onOffline = () => {
      setOffline(true);
      setHasDraft(hasDraftInStorage());
    };
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className="fixed top-0 inset-x-0 z-50 bg-[var(--bg-accent)] text-[var(--text-on-accent)] text-sm text-center py-2 px-4"
    >
      You are offline — changes will be saved locally
      {hasDraft && (
        <span className="ml-1">· Unsaved changes are preserved</span>
      )}
    </div>
  );
}
