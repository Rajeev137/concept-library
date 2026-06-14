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
        <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
          Check your email
        </h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          If that email exists, we sent a reset link. Check your inbox.
        </p>
        <Link
          href="/login"
          className="mt-6 block text-sm text-neutral-500 dark:text-neutral-400 hover:underline"
        >
          Back to sign in
        </Link>
      </>
    );
  }

  return (
    <>
      <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-6">
        Reset password
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-sm text-neutral-600 dark:text-neutral-400">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-neutral-400"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-neutral-900 dark:bg-neutral-100 px-4 py-2 text-sm font-medium text-white dark:text-neutral-900 hover:bg-neutral-700 dark:hover:bg-neutral-300 disabled:opacity-50"
        >
          {submitting ? "Sending…" : "Send reset link"}
        </button>
      </form>

      <div className="mt-6 text-sm text-neutral-500 dark:text-neutral-400">
        <Link href="/login" className="hover:underline">
          Back to sign in
        </Link>
      </div>
    </>
  );
}
