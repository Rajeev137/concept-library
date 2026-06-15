"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import type { ApiResult, Session } from "@/types";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const json: ApiResult<{ session: Session }> = await res.json();

      if (!json.ok) {
        setError(json.error.message);
        return;
      }

      setDone(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
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
          We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.
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
        Create account
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

        <div className="flex flex-col gap-1">
          <label htmlFor="password" className="text-sm text-[var(--text-muted)]">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded border border-[var(--border-default)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--text-secondary)] outline-none focus:ring-2 focus:ring-[var(--bg-accent)]"
          />
          <p className="text-xs text-[var(--text-muted)]">
            At least 12 characters.
          </p>
        </div>

        {error && (
          <p className="text-sm text-[var(--danger)]">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-[var(--bg-accent)] px-4 py-2 text-sm font-medium text-[var(--text-on-accent)] hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? "Creating account…" : "Create account"}
        </button>
      </form>

      <div className="mt-6 text-sm text-[var(--text-muted)]">
        <Link href="/login" className="hover:underline">
          Already have an account? Sign in
        </Link>
      </div>
    </>
  );
}
