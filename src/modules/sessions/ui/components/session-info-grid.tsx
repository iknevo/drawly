"use client";

import { Card } from "@/components/ui/card";

import { formatAbsolute, formatDuration, formatRelative } from "@/modules/sessions/lib/time";

type SessionInfoGridProps = {
  createdAt: Date | string;
  startedAt: Date | string | null;
  completedAt: Date | string | null;
  elapsedSeconds: number;
  targetSeconds: number;
};

export function SessionInfoGrid({
  createdAt,
  startedAt,
  completedAt,
  elapsedSeconds,
  targetSeconds,
}: SessionInfoGridProps) {
  const entries: { label: string; value: string; hint?: string }[] = [
    {
      label: "Created",
      value: formatAbsolute(createdAt),
      hint: formatRelative(createdAt),
    },
    ...(startedAt
      ? [
          {
            label: "Started",
            value: formatAbsolute(startedAt),
            hint: formatRelative(startedAt),
          },
        ]
      : []),
    ...(completedAt
      ? [
          {
            label: "Completed",
            value: formatAbsolute(completedAt),
            hint: formatRelative(completedAt),
          },
        ]
      : []),
    { label: "Elapsed", value: formatDuration(elapsedSeconds) },
    ...(targetSeconds > 0
      ? [{ label: "Target", value: formatDuration(targetSeconds) }]
      : []),
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {entries.map((entry) => (
        <Card key={entry.label} size="sm" className="gap-1 px-3">
          <span className="text-muted-foreground text-xs">{entry.label}</span>
          <span className="truncate text-sm font-medium tabular-nums" title={entry.value}>
            {entry.value}
          </span>
          {entry.hint && <span className="text-muted-foreground text-[0.65rem]">{entry.hint}</span>}
        </Card>
      ))}
    </div>
  );
}
