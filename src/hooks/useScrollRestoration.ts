import { useEffect, useRef } from "react";

export function useScrollRestoration(key: string): void {
  const storageKey = `scroll:${key}`;
  const keyRef = useRef(key);
  const storageKeyRef = useRef(storageKey);

  useEffect(() => {
    storageKeyRef.current = `scroll:${key}`;
    keyRef.current = key;
  });

  // Restore scroll position on mount or key change
  useEffect(() => {
    if (typeof window === "undefined") return;

    const saved = sessionStorage.getItem(`scroll:${key}`);
    if (saved !== null) {
      const y = Number(saved);
      if (!isNaN(y)) {
        requestAnimationFrame(() => {
          window.scrollTo(0, y);
        });
      }
    }

    let timer: ReturnType<typeof setTimeout> | null = null;

    const onScroll = () => {
      if (timer !== null) clearTimeout(timer);
      timer = setTimeout(() => {
        sessionStorage.setItem(`scroll:${key}`, String(window.scrollY));
      }, 200);
    };

    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      // Save on unmount or key change
      if (timer !== null) clearTimeout(timer);
      sessionStorage.setItem(`scroll:${key}`, String(window.scrollY));
      window.removeEventListener("scroll", onScroll);
    };
  }, [key]); // re-runs when key changes — saves old position, restores new one
}
