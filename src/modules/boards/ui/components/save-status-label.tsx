"use client";

import type { SaveStatus } from "./quickdraw-canvas";

const STATUS_LABELS: Record<SaveStatus, string> = {
  saved: "Saved",
  dirty: "Unsaved changes",
  saving: "Saving…",
  error: "Couldn't save — retrying",
  offline: "Offline — changes pending",
};

export function SaveStatusLabel({ status }: { status: SaveStatus }) {
  const emphasize = status === "error" || status === "offline";

  return (
    <span
      className={
        emphasize
          ? "text-destructive flex items-center gap-1.5 text-xs"
          : "text-muted-foreground flex items-center gap-1.5 text-xs"
      }
    >
      {status === "saving" && (
        <span className="border-muted border-t-foreground size-3 animate-spin rounded-full border-[1.5px]" />
      )}
      {STATUS_LABELS[status]}
    </span>
  );
}
