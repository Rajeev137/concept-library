"use client";

import type { LoginRequest } from "@/types";

// Login page. Renders the login form.
// On success: redirect to / (or ?returnUrl= if present in query string).
// On AUTH_FAILED: show generic "Invalid credentials" — never distinguish email vs password.
// On EMAIL_NOT_CONFIRMED: show "Please confirm your email before logging in."
// On RATE_LIMITED: show "Too many attempts. Try again after {Retry-After}."
// TODO: read returnUrl from searchParams and pass it to the redirect after login.
export default function LoginPage() {
  // TODO: implement form state with React controlled inputs or useFormState
  // TODO: call POST /api/auth/login on submit
  // TODO: on success, router.push(returnUrl ?? "/")
  return (
    <div>
      {/* TODO: <LoginForm /> */}
      <p>TODO: Login form</p>
    </div>
  );
}
