"use client";

import type { ReactNode } from "react";
import type { UiPrefs } from "@/types";

interface AppShellProps {
  children: ReactNode;
}

// Top-level app layout: collapsible left sidebar + right main panel.
// Sidebar becomes an overlay drawer on narrow viewports (mobile-usable per contract).
// Persists collapsed/expanded state to localStorage under "ui:sidebar".
// TODO: read initial sidebar state from localStorage "ui:sidebar" on mount.
// TODO: apply class to <div> that switches layout between sidebar+panel and drawer+panel.
export default function AppShell({ children }: AppShellProps) {
  // TODO: const [sidebarCollapsed, setSidebarCollapsed] = useLocalStorage<boolean>("ui:sidebar", false)
  // TODO: const isMobile = useMediaQuery("(max-width: 768px)")
  return (
    <div>
      {/* TODO: <Sidebar collapsed={sidebarCollapsed} onToggle={setSidebarCollapsed} isMobileDrawer={isMobile} /> */}
      <main>
        {children}
      </main>
    </div>
  );
}
