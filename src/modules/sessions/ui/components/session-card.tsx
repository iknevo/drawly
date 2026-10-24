"use client";

import type { sessionsListItem } from "../../types/types";
import { CheckIcon } from "lucide-react";
import Link from "next/link";

import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

import { formatDuration, formatRelative } from "@/modules/sessions/lib/time";
import { SessionCardMenu } from "@/modules/sessions/ui/components/session-card-menu";
import { SessionStatusBadge } from "@/modules/sessions/ui/components/session-status-badge";
import { SessionTypeIcon } from "@/modules/sessions/ui/components/session-type-icon";

export function SessionCardSkeleton() {
  return (
    <Card size="sm" className="gap-3 px-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="bg-muted size-8 shrink-0 animate-pulse rounded-md" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="bg-muted h-4 w-2/3 animate-pulse rounded" />
            <div className="bg-muted h-3 w-1/3 animate-pulse rounded" />
          </div>
        </div>
        <div className="bg-muted h-5 w-20 animate-pulse rounded" />
      </div>
      <div className="bg-muted h-1 w-full animate-pulse rounded" />
      <div className="bg-muted h-3 w-1/2 animate-pulse rounded" />
    </Card>
  );
}

interface SessionCardProps {
  data: sessionsListItem;
}

export function SessionCard({ data }: SessionCardProps) {
  const isPomodoro = data.type === "pomodoro";
  const hasTarget = data.targetSeconds > 0;
  const progress = hasTarget
    ? Math.min(100, Math.round((data.elapsedSeconds / data.targetSeconds) * 100))
    : 0;
  const context = data.completedAt
    ? `Completed ${formatRelative(data.completedAt)}`
    : data.startedAt
      ? `Started ${formatRelative(data.startedAt)}`
      : `Created ${formatRelative(data.createdAt)}`;

  return (
    <Card size="sm" className="relative gap-3 px-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <SessionTypeIcon type={data.type} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <Link
                href={`/sessions/${data.id}`}
                className="truncate font-medium after:absolute after:inset-0 after:content-[''] hover:underline"
                title={data.name}
              >
                {data.name}
              </Link>
              {data.status === "completed" && (
                <CheckIcon className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              )}
            </div>
            <span className="text-muted-foreground text-xs">
              {isPomodoro ? "Pomodoro" : "Timer"}
            </span>
          </div>
        </div>
        <div className="relative z-10 flex shrink-0 items-center gap-1">
          <SessionStatusBadge status={data.status} />
          <SessionCardMenu data={data} />
        </div>
      </div>

      {hasTarget && <Progress value={progress} aria-label={`${progress}% of target`} />}

      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          Elapsed{" "}
          <span className="text-foreground font-medium tabular-nums">
            {formatDuration(data.elapsedSeconds)}
          </span>
        </span>
        {hasTarget && (
          <span className="text-muted-foreground">
            Target{" "}
            <span className="text-foreground font-medium tabular-nums">
              {formatDuration(data.targetSeconds)}
            </span>
          </span>
        )}
      </div>

      <p className="text-muted-foreground text-xs">{context}</p>
    </Card>
  );
}
