"use client";

import type { ReactNode } from "react";
import type { UiPrefs } from "@/types";

interface ThemeProviderProps {
  children: ReactNode;
}

// Reads theme preference from localStorage "ui:theme"; falls back to system preference
// via matchMedia("(prefers-color-scheme: dark)"). Sets data-theme="dark|light" on <html>.
// TODO: on mount, read localStorage "ui:theme"; if "system", check prefers-color-scheme.
// TODO: apply data-theme attribute to document.documentElement.
// TODO: expose a context so any component can call useTheme() to read/toggle theme.
// TODO: listen to window matchMedia "change" event to react to system preference changes.
export default function ThemeProvider({ children }: ThemeProviderProps) {
  // TODO: useState for theme; useEffect to read localStorage and apply to <html>
  return <>{children}</>;
}

// TODO: export useTheme() hook that returns { theme, setTheme } from ThemeContext
