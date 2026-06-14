"use client";

import { useState, useEffect, useCallback } from "react";

// Reads and writes a value to localStorage, syncing with useState.
// On SSR (no window), returns the defaultValue without reading storage.
// TODO: on mount (useEffect), read the stored value and update state.
// TODO: on setValue, write to localStorage and update state.
// TODO: handle JSON.parse errors (corrupt data) by falling back to defaultValue.
export function useLocalStorage<T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  // TODO: const [state, setState] = useState<T>(defaultValue)
  // TODO: useEffect(() => { try { const stored = localStorage.getItem(key); if (stored) setState(JSON.parse(stored)) } catch {} }, [key])
  // TODO: const setValue = useCallback((value: ...) => { ... localStorage.setItem(key, JSON.stringify(next)) ... }, [key])
  const [state, setState] = useState<T>(defaultValue);
  return [state, setState as (value: T | ((prev: T) => T)) => void];
}
