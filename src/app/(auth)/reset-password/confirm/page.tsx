"use client";

import { useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { ApiResult } from "@/types";

export default function ResetPasswordConfirmPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();

  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!token) {
    return (
      <>
        <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
          Invalid link
        </h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          This reset link is missing a token.
        </p>
        <Link
          href="/reset-password"
          className="mt-6 block text-sm text-neutral-500 dark:text-neutral-400 hover:underline"
        >
          Request a new reset link
        </Link>
      </>
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/password-reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: newPassword }),
      });

      const json: ApiResult<{ ok: true }> = await res.json();

      if (!json.ok) {
        setError(json.error.message);
        return;
      }

      router.push("/login?passwordReset=true");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-6">
        Set new password
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="new-password" className="text-sm text-neutral-600 dark:text-neutral-400">
            New password
          </label>
          <input
            id="new-password"
            type="password"
            autoComplete="new-password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-neutral-400"
          />
          <p className="text-xs text-neutral-400 dark:text-neutral-500">
            At least 12 characters.
          </p>
        </div>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-neutral-900 dark:bg-neutral-100 px-4 py-2 text-sm font-medium text-white dark:text-neutral-900 hover:bg-neutral-700 dark:hover:bg-neutral-300 disabled:opacity-50"
        >
          {submitting ? "Updating…" : "Update password"}
        </button>
      </form>
    </>
  );
}
