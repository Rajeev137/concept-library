import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getSession } from "@/lib/supabase/server";
import AppShell from "@/components/layout/AppShell";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await getSession();

  if (!session) {
    const headerStore = await headers();
    const pathname = headerStore.get("x-pathname") ?? "/";
    redirect(`/login?returnUrl=${encodeURIComponent(pathname)}`);
  }

  return <AppShell>{children}</AppShell>;
}
