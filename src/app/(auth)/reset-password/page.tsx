"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      await fetch("/api/auth/password-reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } finally {
      // Always show the same message — never reveal whether the email exists
      setDone(true);
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <>
        <h1 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
          Check your email
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          If that email exists, we sent a reset link. Check your inbox.
        </p>
        <Link
          href="/login"
          className="mt-6 block text-sm text-[var(--text-muted)] hover:underline"
        >
          Back to sign in
        </Link>
      </>
    );
  }

  return (
    <>
      <h1 className="text-lg font-semibold text-[var(--text-primary)] mb-6">
        Reset password
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-sm text-[var(--text-muted)]">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded border border-[var(--border-default)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--text-secondary)] outline-none focus:ring-2 focus:ring-[var(--bg-accent)]"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-[var(--bg-accent)] px-4 py-2 text-sm font-medium text-[var(--text-on-accent)] hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? "Sending…" : "Send reset link"}
        </button>
      </form>

      <div className="mt-6 text-sm text-[var(--text-muted)]">
        <Link href="/login" className="hover:underline">
          Back to sign in
        </Link>
      </div>
    </>
  );
}
