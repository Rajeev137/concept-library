import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/supabase/server";

// App route group layout — wraps all authenticated pages with the full shell
// (collapsible sidebar + main panel). Redirects to /login if no valid session.
export default async function AppLayout({ children }: { children: ReactNode }) {
  // TODO: const session = await getSession()
  // TODO: if (!session) redirect("/login?returnUrl=" + encodeURIComponent(request.nextUrl.pathname))

  return (
    <div>
      {/* TODO: <AppShell> which renders <Sidebar> + <main>{children}</main> */}
      {/* TODO: <AddCardButton /> floating action button, bottom-left of viewport */}
      {children}
    </div>
  );
}
