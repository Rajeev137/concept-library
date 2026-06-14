import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@/app/globals.css";

// TODO: Set theme class on <html> based on server-rendered cookie or default "system".
// The ThemeProvider client component will then sync to localStorage on mount.

export const metadata: Metadata = {
  title: "Concept Library",
  description: "Personal interview-prep concept card library",
};

// Root layout — wraps every page. Provides ThemeProvider for dark/light/system toggle.
export default function RootLayout({ children }: { children: ReactNode }) {
  // TODO: wrap children in <ThemeProvider> so theme class is applied to <html>
  return (
    <html lang="en">
      <body>
        {/* TODO: <ThemeProvider> */}
        {children}
        {/* TODO: </ThemeProvider> */}
      </body>
    </html>
  );
}
