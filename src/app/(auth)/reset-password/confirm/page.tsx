"use client";

// Password reset confirmation page (/reset-password/confirm?token=...).
// Reads token from URL search params (Supabase appends it after clicking the email link).
// Shows new-password form; on submit calls POST /api/auth/password-reset/confirm.
// On success: redirect to /login with a "Password updated. Please sign in." banner.
// On AUTH_FAILED: show generic "Invalid or expired reset link."
// On WEAK_PASSWORD: show per-field error under new_password.
export default function ResetPasswordConfirmPage() {
  // TODO: const searchParams = useSearchParams(); const token = searchParams.get("token")
  // TODO: if (!token) show "Invalid link" and link back to /reset-password
  // TODO: implement form state
  // TODO: call POST /api/auth/password-reset/confirm with { token, new_password }
  // TODO: on success, router.push("/login?passwordReset=true")
  return (
    <div>
      {/* TODO: <PasswordResetConfirmForm /> */}
      <p>TODO: Password reset confirm form</p>
    </div>
  );
}
