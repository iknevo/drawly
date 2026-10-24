"use client";

import { useQuery } from "@tanstack/react-query";

import { Card } from "@/components/ui/card";

import { formatDuration } from "@/modules/sessions/lib/time";
import { SessionActivityChart } from "@/modules/sessions/ui/components/session-activity-chart";
import { useTRPC } from "@/trpc/client";

export function SessionStats() {
  const trpc = useTRPC();

  const stats = useQuery(trpc.sessions.stats.queryOptions());

  if (stats.isPending) {
    return (
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} size="sm" className="gap-2 px-3">
              <div className="bg-muted h-3 w-16 animate-pulse rounded" />
              <div className="bg-muted h-6 w-24 animate-pulse rounded" />
            </Card>
          ))}
        </div>
        <Card size="sm" className="gap-3 px-3">
          <div className="bg-muted h-4 w-24 animate-pulse rounded" />
          <div className="bg-muted h-32 w-full animate-pulse rounded" />
        </Card>
      </div>
    );
  }

  if (stats.isError || stats.data.totalSessions === 0) return null;

  const { totalSessions, totalSeconds, todaySeconds, completionRate, week } = stats.data;

  const entries: { label: string; value: string }[] = [
    { label: "Total time", value: formatDuration(totalSeconds) },
    { label: "Sessions", value: String(totalSessions) },
    { label: "Today", value: formatDuration(todaySeconds) },
    { label: "Completion", value: `${Math.round(completionRate * 100)}%` },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {entries.map((entry) => (
          <Card key={entry.label} size="sm" className="gap-1 px-3">
            <span className="text-muted-foreground text-xs">{entry.label}</span>
            <span className="text-xl font-medium tabular-nums">{entry.value}</span>
          </Card>
        ))}
      </div>
      <SessionActivityChart week={week} />
    </div>
  );
}
