"use client";

import { useEffect } from "react";

export interface KeyboardShortcutsConfig {
  onNewCard?: () => void;
  onEditCard?: () => void;
  onDeleteCard?: () => void;
  onClose?: () => void;
  onFocusSearch?: () => void;
  onShowHelp?: () => void;
}

const INPUT_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

function isEditable(el: Element | null): boolean {
  if (!el) return false;
  if (INPUT_TAGS.has(el.tagName)) return true;
  return (el as HTMLElement).isContentEditable;
}

export function useKeyboardShortcuts(config: KeyboardShortcutsConfig): void {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (isEditable(document.activeElement)) return;

      switch (e.key) {
        case "n":
          config.onNewCard?.();
          break;
        case "e":
          config.onEditCard?.();
          break;
        case "Delete":
        case "Backspace":
          config.onDeleteCard?.();
          break;
        case "Escape":
          config.onClose?.();
          break;
        case "/":
          e.preventDefault();
          config.onFocusSearch?.();
          break;
        case "?":
          config.onShowHelp?.();
          break;
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [config]);
}
