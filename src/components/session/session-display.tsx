"use client";

import { cn } from "@/lib/utils";


export function SessionDisplay() {
  return (
    <div className={cn("text-right", "hidden lg:block")}>
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Session time</span>
      <div className="text-4xl font-mono font-light tabular-nums">00:00</div>
    </div>
  );
}
