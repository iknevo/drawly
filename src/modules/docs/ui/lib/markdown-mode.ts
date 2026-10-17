import { useSyncExternalStore } from "react";

const MARKDOWN_STORAGE_KEY = "drawly.docs.markdown-mode";

let current = false;
let initialized = false;
const listeners = new Set<() => void>();

function init() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  try {
    current = window.localStorage.getItem(MARKDOWN_STORAGE_KEY) === "true";
  } catch {
    current = false;
  }
}

function subscribe(listener: () => void) {
  init();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  init();
  return current;
}

function getServerSnapshot() {
  return false;
}

export function setMarkdownMode(enabled: boolean) {
  init();
  current = enabled;
  try {
    window.localStorage.setItem(MARKDOWN_STORAGE_KEY, String(enabled));
  } catch {
    // storage unavailable (private mode, quota) — keep the in-memory value
  }
  for (const listener of listeners) listener();
}

export function useMarkdownMode() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
