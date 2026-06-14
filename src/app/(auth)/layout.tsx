import type { ReactNode } from "react";

// Auth route group layout — renders login/register/reset pages without the app shell.
// TODO: If a valid session already exists (via getSession()), redirect to / (app home).
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main>
      {/* TODO: centered card container for auth forms */}
      {children}
    </main>
  );
}
