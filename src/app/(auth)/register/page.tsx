"use client";

import type { RegisterRequest } from "@/types";

// Register page. Renders the registration form.
// On success: show "Check your email to confirm your account" — do NOT auto-login.
// On WEAK_PASSWORD: show per-field validation message under the password field.
// On AUTH_FAILED (duplicate email or Supabase error): show generic "Registration failed."
// (Never reveal whether an email is already registered.)
export default function RegisterPage() {
  // TODO: implement form state
  // TODO: call POST /api/auth/register on submit
  // TODO: on success, show confirmation message (not a redirect)
  return (
    <div>
      {/* TODO: <RegisterForm /> */}
      <p>TODO: Register form</p>
    </div>
  );
}
