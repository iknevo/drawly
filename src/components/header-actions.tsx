"use client";

import { type ReactNode, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

type HeaderSlot = "title" | "actions";

function subscribe() {
  return () => {};
}

export function HeaderActions({
  slot = "actions",
  children,
}: {
  slot?: HeaderSlot;
  children: ReactNode;
}) {
  const host = useSyncExternalStore(
    subscribe,
    () => document.getElementById(`app-header-${slot}`),
    () => null
  );

  if (!host) return null;

  return createPortal(children, host);
}
