"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";

import { soundEngine } from "@/lib/sound/engine";
import { resolveClickSound } from "@/lib/sound/resolve-click";
import type { SoundName } from "@/lib/sound/types";

const STORAGE_KEY = "drawly:sound-muted";

const INTERACTIVE_SELECTOR = [
  "button",
  "a[href]",
  "summary",
  '[role="button"]',
  '[role="menuitem"]',
  '[role="menuitemcheckbox"]',
  '[role="menuitemradio"]',
  '[role="tab"]',
  '[role="option"]',
  '[role="switch"]',
].join(", ");

const MENU_SURFACE_SELECTOR =
  '[role="menu"], [role="menubar"], [role="listbox"], [data-slot="navigation-menu-content"]';

const HOVER_THROTTLE_MS = 45;

const listeners = new Set<() => void>();
let muted = false;
let hydrated = false;

function ensureHydrated() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    muted = window.localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    muted = false;
  }
  soundEngine.setMuted(muted);
}

function subscribeMuted(listener: () => void) {
  ensureHydrated();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getMutedSnapshot() {
  return muted;
}

function getMutedServerSnapshot() {
  return false;
}

function setMuted(next: boolean) {
  muted = next;
  soundEngine.setMuted(next);
  if (next) soundEngine.stopAlarm();
  try {
    window.localStorage.setItem(STORAGE_KEY, String(next));
  } catch {
    // ignore storage failures (private mode, quota, etc.)
  }
  for (const listener of listeners) listener();
}

type SoundContextValue = {
  play: (name: SoundName) => void;
  stopAlarm: () => void;
  muted: boolean;
  setMuted: (muted: boolean) => void;
  toggleMuted: () => void;
};

const SoundContext = createContext<SoundContextValue | null>(null);

export function useSound(): SoundContextValue {
  const context = useContext(SoundContext);
  if (!context) {
    throw new Error("useSound must be used within a SoundProvider");
  }
  return context;
}

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const isMuted = useSyncExternalStore(subscribeMuted, getMutedSnapshot, getMutedServerSnapshot);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (event.button !== 0 || !event.isPrimary) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const interactive = target.closest(INTERACTIVE_SELECTOR);
      if (!interactive) return;
      if (interactive.matches(":disabled, [aria-disabled='true']")) return;
      const name = resolveClickSound(interactive);
      if (name) void soundEngine.play(name);
    };

    let lastHovered: Element | null = null;
    let lastHoverAt = 0;

    const playMenuHover = (target: EventTarget | null) => {
      if (!soundEngine.isReady()) return;
      if (!(target instanceof Element)) return;
      const interactive = target.closest(INTERACTIVE_SELECTOR);
      if (!interactive) {
        lastHovered = null;
        return;
      }
      if (interactive === lastHovered) return;
      lastHovered = interactive;
      if (!interactive.closest(MENU_SURFACE_SELECTOR) && !interactive.matches("[data-sound-hover]"))
        return;
      if (interactive.matches(":disabled, [aria-disabled='true']")) return;
      const now = performance.now();
      if (now - lastHoverAt < HOVER_THROTTLE_MS) return;
      lastHoverAt = now;
      void soundEngine.play("hover");
    };

    const handlePointerOver = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" && event.pointerType !== "pen") return;
      playMenuHover(event.target);
    };

    const handleFocusIn = (event: FocusEvent) => {
      playMenuHover(event.target);
    };

    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("pointerover", handlePointerOver, true);
    document.addEventListener("focusin", handleFocusIn, true);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("pointerover", handlePointerOver, true);
      document.removeEventListener("focusin", handleFocusIn, true);
    };
  }, []);

  const play = useCallback((name: SoundName) => {
    void soundEngine.play(name);
  }, []);

  const stopAlarm = useCallback(() => {
    soundEngine.stopAlarm();
  }, []);

  const value = useMemo<SoundContextValue>(
    () => ({
      play,
      stopAlarm,
      muted: isMuted,
      setMuted,
      toggleMuted: () => setMuted(!getMutedSnapshot()),
    }),
    [play, stopAlarm, isMuted]
  );

  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>;
}
