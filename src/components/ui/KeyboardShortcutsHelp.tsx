"use client";

import { useEffect } from "react";

interface KeyboardShortcutsHelpProps {
  onClose: () => void;
}

const SHORTCUTS: { key: string; action: string }[] = [
  { key: "N", action: "New concept card" },
  { key: "E", action: "Edit current card" },
  { key: "Delete", action: "Delete current card" },
  { key: "Esc", action: "Close form or drawer" },
  { key: "/", action: "Focus search" },
  { key: "?", action: "Show this help" },
];

export default function KeyboardShortcutsHelp({ onClose }: KeyboardShortcutsHelpProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="kb-help-title"
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      <div
        className="absolute inset-0 bg-black/30"
        aria-hidden="true"
        onClick={onClose}
      />
      <div className="relative z-10 bg-[var(--bg-primary)] rounded-lg shadow-xl p-6 max-w-sm w-full mx-4 border border-[var(--border-default)]">
        <h2
          id="kb-help-title"
          className="text-base font-semibold text-[var(--text-primary)] mb-4"
        >
          Keyboard shortcuts
        </h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border-default)]">
              <th className="text-left pb-2 pr-6 font-medium text-[var(--text-muted)] w-1/3">
                Key
              </th>
              <th className="text-left pb-2 font-medium text-[var(--text-muted)]">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {SHORTCUTS.map(({ key, action }) => (
              <tr
                key={key}
                className="border-b border-[var(--border-subtle)] last:border-0"
              >
                <td className="py-2 pr-6">
                  <kbd className="inline-flex items-center justify-center px-1.5 py-0.5 rounded border border-[var(--border-default)] bg-[var(--bg-tertiary)] text-xs font-mono text-[var(--text-secondary)]">
                    {key}
                  </kbd>
                </td>
                <td className="py-2 text-[var(--text-secondary)]">{action}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full text-sm font-medium px-3 py-1.5 rounded-md border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}
