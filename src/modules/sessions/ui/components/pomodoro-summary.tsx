"use client";

import { Card } from "@/components/ui/card";

import type { PomodoroConfig } from "@/modules/sessions/lib/pomodoro";
import { formatDuration } from "@/modules/sessions/lib/time";
import type { sessionGetOutput } from "@/modules/sessions/types/types";

type PomodoroSummaryProps = {
  config: PomodoroConfig;
  cycles: sessionGetOutput["cycles"];
};

export function PomodoroSummary({ config, cycles }: PomodoroSummaryProps) {
  const completedWork = cycles.filter((cycle) => cycle.phase === "work").length;
  const actualWork = cycles
    .filter((cycle) => cycle.phase === "work")
    .reduce((sum, cycle) => sum + cycle.durationSeconds, 0);
  const actualBreaks = cycles
    .filter((cycle) => cycle.phase !== "work")
    .reduce((sum, cycle) => sum + cycle.durationSeconds, 0);
  const plannedSeconds =
    config.work * config.cycles +
    config.shortBreak * Math.max(0, config.cycles - 1) +
    config.longBreak;

  const entries = [
    { label: "Cycles", value: `${completedWork}/${config.cycles}` },
    { label: "Focus time", value: formatDuration(actualWork) },
    { label: "Break time", value: formatDuration(actualBreaks) },
    { label: "Planned", value: formatDuration(plannedSeconds) },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {entries.map((entry) => (
        <Card key={entry.label} size="sm" className="gap-1 px-3">
          <span className="text-muted-foreground text-xs">{entry.label}</span>
          <span className="text-sm font-medium tabular-nums">{entry.value}</span>
        </Card>
      ))}
    </div>
  );
}
