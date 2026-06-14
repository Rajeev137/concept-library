import type { Metadata } from "next";
import type { ReactNode } from "react";
import ThemeProvider from "@/components/layout/ThemeProvider";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Concept Library",
  description: "Personal interview-prep concept card library",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
