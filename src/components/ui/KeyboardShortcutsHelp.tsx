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
      <div className="relative z-10 bg-white dark:bg-gray-900 rounded-lg shadow-xl p-6 max-w-sm w-full mx-4 border border-gray-200 dark:border-gray-700">
        <h2
          id="kb-help-title"
          className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4"
        >
          Keyboard shortcuts
        </h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left pb-2 pr-6 font-medium text-gray-500 dark:text-gray-400 w-1/3">
                Key
              </th>
              <th className="text-left pb-2 font-medium text-gray-500 dark:text-gray-400">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {SHORTCUTS.map(({ key, action }) => (
              <tr
                key={key}
                className="border-b border-gray-100 dark:border-gray-800 last:border-0"
              >
                <td className="py-2 pr-6">
                  <kbd className="inline-flex items-center justify-center px-1.5 py-0.5 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-xs font-mono text-gray-700 dark:text-gray-300">
                    {key}
                  </kbd>
                </td>
                <td className="py-2 text-gray-700 dark:text-gray-300">{action}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full text-sm font-medium px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}
