"use client";

import { useState, useEffect, type ReactNode } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import Sidebar from "@/components/sidebar/Sidebar";
import OfflineBanner from "@/components/ui/OfflineBanner";
import AddCardButton from "@/components/card/AddCardButton";

interface AppShellProps {
  children: ReactNode;
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return isMobile;
}

export default function AppShell({ children }: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useLocalStorage<boolean>("ui:sidebar", false);
  const isMobile = useIsMobile();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-secondary)]">
      <OfflineBanner />

      {isMobile ? (
        <>
          {drawerOpen && (
            <Sidebar
              collapsed={false}
              onCollapsedChange={() => {}}
              isMobileDrawer
              onClose={() => setDrawerOpen(false)}
            />
          )}
        </>
      ) : (
        <Sidebar
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
        />
      )}

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {isMobile && (
          <header className="flex items-center h-12 px-4 border-b border-[var(--border-default)] bg-[var(--bg-primary)] flex-shrink-0">
            <button
              type="button"
              aria-label="Open sidebar"
              onClick={() => setDrawerOpen(true)}
              className="rounded-md p-2 text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <span className="ml-3 text-sm font-semibold text-[var(--text-secondary)]">
              Concept Library
            </span>
          </header>
        )}

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      <AddCardButton />
    </div>
  );
}
