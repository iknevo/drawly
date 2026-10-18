"use client";

import { cn } from "cn";

import { PHASE_LABEL, type ResolvedPomodoro } from "@/modules/sessions/lib/pomodoro";
import { formatClock } from "@/modules/sessions/lib/time";

type SessionClockProps = {
  mode: "timer" | "pomodoro";
  status: "idle" | "running" | "paused";
  elapsed: number;
  pomodoro: ResolvedPomodoro | null;
  cyclesTotal: number;
};

const STATUS_LABEL = {
  idle: "Ready",
  running: "Running",
  paused: "Paused",
} as const;

function StatusLine({ status }: { status: "idle" | "running" | "paused" }) {
  return (
    <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
      <span
        className={cn(
          "size-1.5 rounded-full",
          status === "running" && "bg-emerald-500",
          status === "paused" && "bg-amber-500",
          status === "idle" && "bg-muted-foreground/40"
        )}
      />
      {STATUS_LABEL[status]}
    </span>
  );
}

function CycleDots({ cycle, total }: { cycle: number; total: number }) {
  return (
    <span className="flex items-center gap-1" aria-label={`Cycle ${cycle} of ${total}`}>
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          className={cn(
            "size-1.5 rounded-full",
            index < cycle ? "bg-primary" : "bg-muted-foreground/30"
          )}
        />
      ))}
    </span>
  );
}

export function SessionClock({ mode, status, elapsed, pomodoro, cyclesTotal }: SessionClockProps) {
  if (mode === "pomodoro" && pomodoro) {
    const waitingForNext = status === "paused" && !pomodoro.done && pomodoro.phaseElapsed === 0;
    return (
      <div className="flex flex-col items-center gap-2 py-4">
        <div className="text-muted-foreground flex items-center gap-2 text-xs font-medium tracking-wider uppercase">
          <span>{pomodoro.done ? "All cycles complete" : PHASE_LABEL[pomodoro.phase]}</span>
          {!pomodoro.done && (
            <>
              <span className="text-muted-foreground/50">•</span>
              <CycleDots cycle={pomodoro.cycle} total={cyclesTotal} />
              <span className="text-muted-foreground/50">•</span>
              <span>
                Cycle {pomodoro.cycle}/{cyclesTotal}
              </span>
            </>
          )}
        </div>
        <div className="font-mono text-6xl font-light tabular-nums md:text-7xl">
          {formatClock(pomodoro.timeRemaining)}
        </div>
        <div className="flex items-center gap-3">
          {waitingForNext ? (
            <span className="text-muted-foreground text-xs">
              Ready for next phase &middot; press start
            </span>
          ) : (
            <StatusLine status={status} />
          )}
          <span className="text-muted-foreground text-xs">Session time {formatClock(elapsed)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2 py-4">
      <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
        Session time
      </span>
      <div className="font-mono text-6xl font-light tabular-nums md:text-7xl">
        {formatClock(elapsed)}
      </div>
      <StatusLine status={status} />
    </div>
  );
}
