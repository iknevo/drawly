"use client";

import type { sessionsListItem } from "../../types/types";
import { formatDistanceToNow } from "date-fns";
import { CheckIcon, TimerIcon, WatchIcon } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

import { formatDuration } from "@/modules/sessions/lib/time";

const STATUS_BADGE: Record<
  sessionsListItem["status"],
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  idle: { label: "Idle", variant: "outline" },
  running: { label: "Running", variant: "default" },
  paused: { label: "Paused", variant: "secondary" },
  completed: { label: "Completed", variant: "outline" },
};

export function SessionCardSkeleton() {
  return (
    <Card size="sm" className="gap-3 px-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="bg-muted h-4 w-2/3 animate-pulse rounded" />
          <div className="bg-muted h-3 w-1/2 animate-pulse rounded" />
        </div>
        <div className="bg-muted h-5 w-20 animate-pulse rounded" />
      </div>
      <div className="bg-muted h-3 w-1/3 animate-pulse rounded" />
    </Card>
  );
}

interface SessionCardProps {
  data: sessionsListItem;
}

export function SessionCard({ data }: SessionCardProps) {
  const badge = STATUS_BADGE[data.status];
  const isPomodoro = data.type === "pomodoro";

  return (
    <Card size="sm" className="gap-3 px-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="bg-muted/60 flex size-8 shrink-0 items-center justify-center rounded-md">
            {isPomodoro ? (
              <WatchIcon className="text-muted-foreground size-4" />
            ) : (
              <TimerIcon className="text-muted-foreground size-4" />
            )}
          </span>
          <Link
            href={`/sessions/${data.id}`}
            className="truncate font-medium hover:underline"
            title={data.name}
          >
            {data.name}
          </Link>
          {data.status === "completed" && (
            <CheckIcon className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          )}
        </div>
        <Badge variant={badge.variant}>{badge.label}</Badge>
      </div>
      <div className="text-muted-foreground flex items-center justify-between text-xs">
        <span className="capitalize">{isPomodoro ? "Pomodoro" : "Timer"}</span>
        <span className="text-foreground font-medium tabular-nums">
          {formatDuration(data.elapsedSeconds)}
        </span>
      </div>
      <p className="text-muted-foreground text-xs">
        Created {formatDistanceToNow(new Date(data.createdAt), { addSuffix: true })}
        {data.targetSeconds > 0 && ` • Target ${formatDuration(data.targetSeconds)}`}
      </p>
    </Card>
  );
}
