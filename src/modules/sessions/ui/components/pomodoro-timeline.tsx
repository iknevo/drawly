"use client";

import { cn } from "cn";

import { PHASE_LABEL, buildSegments, type PomodoroConfig } from "@/modules/sessions/lib/pomodoro";
import { formatDuration } from "@/modules/sessions/lib/time";

type PomodoroTimelineProps = {
  config: PomodoroConfig;
  completedCount: number;
};

export function PomodoroTimeline({ config, completedCount }: PomodoroTimelineProps) {
  const segments = buildSegments(config);

  return (
    <div className="flex flex-col gap-2">
      <div
        className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full"
        role="img"
        aria-label={`${completedCount} of ${segments.length} phases completed`}
      >
        {segments.map((segment, index) => {
          const completed = index < completedCount;
          const isWork = segment.phase === "work";

          return (
            <span
              key={`${segment.cycle}-${segment.phase}`}
              className={cn(
                "h-full transition-colors",
                completed
                  ? isWork
                    ? "bg-primary"
                    : "bg-foreground/25"
                  : "bg-muted"
              )}
              style={{ flexGrow: segment.duration, flexBasis: 0 }}
              title={`Cycle ${segment.cycle} · ${PHASE_LABEL[segment.phase]} · ${formatDuration(segment.duration)}`}
            />
          );
        })}
      </div>

      <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="bg-primary size-2 rounded-full" />
          Work
        </span>
        <span className="flex items-center gap-1.5">
          <span className="bg-foreground/25 size-2 rounded-full" />
          Break
        </span>
        <span className="flex items-center gap-1.5">
          <span className="bg-muted size-2 rounded-full" />
          Upcoming
        </span>
      </div>
    </div>
  );
}
