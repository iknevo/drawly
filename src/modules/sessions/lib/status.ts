export const STALE_RUNNING_MS = 2 * 60 * 1000;

export type SessionDisplayStatus = "idle" | "running" | "paused" | "completed";

export const STATUS_META: Record<
  SessionDisplayStatus,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  idle: { label: "Idle", variant: "outline" },
  running: { label: "Running", variant: "default" },
  paused: { label: "Paused", variant: "secondary" },
  completed: { label: "Completed", variant: "outline" },
};

/**
 * A running session only stays "running" while the client keeps heartbeating.
 * Anything older than the stale window is shown as paused so abandoned
 * sessions can be resumed from history instead of looking live forever.
 */
export function resolveEffectiveStatus(
  status: SessionDisplayStatus,
  updatedAt: Date | string | number,
  now = Date.now()
): SessionDisplayStatus {
  if (status !== "running") return status;
  const updated = new Date(updatedAt).getTime();
  if (Number.isNaN(updated)) return status;
  return now - updated > STALE_RUNNING_MS ? "paused" : status;
}
