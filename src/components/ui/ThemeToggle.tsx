"use client";

import type { UiPrefs } from "@/types";

// Theme toggle button: cycles light → dark → system.
// Reads and writes localStorage "ui:theme". Updates data-theme on <html> immediately.
// Rendered in the sidebar footer or top bar.
// TODO: call useTheme() from ThemeProvider context to get and set theme.
// TODO: icon changes per current theme (sun / moon / monitor).
export default function ThemeToggle() {
  // TODO: const { theme, setTheme } = useTheme()
  return (
    <button aria-label="Toggle theme">
      {/* TODO: icon based on current theme */}
    </button>
  );
}
