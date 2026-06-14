"use client";

// Displayed when Supabase is unreachable (API returns 503).
// Shown as a top-of-page banner; does not block interaction.
// Preserves any in-progress form drafts in localStorage (handled by ConceptForm's auto-save).
// TODO: listen for 503 responses from fetch via a global error handler or SWR onError callback.
// TODO: auto-dismiss when a subsequent request succeeds.
export default function OfflineBanner() {
  // TODO: const [offline, setOffline] = useOfflineDetector()
  // if (!offline) return null
  return (
    <div role="alert" aria-live="polite">
      {/* TODO: "Service temporarily unavailable — your draft has been saved locally." */}
    </div>
  );
}
