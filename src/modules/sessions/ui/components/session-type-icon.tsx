"use client";

import { TimerIcon, WatchIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type SessionTypeIconProps = {
  type: "timer" | "pomodoro";
  className?: string;
  iconClassName?: string;
};

export function SessionTypeIcon({ type, className, iconClassName }: SessionTypeIconProps) {
  const Icon = type === "pomodoro" ? WatchIcon : TimerIcon;

  return (
    <span
      className={cn(
        "bg-muted/60 flex size-8 shrink-0 items-center justify-center rounded-md",
        className
      )}
    >
      <Icon className={cn("text-muted-foreground size-4", iconClassName)} />
    </span>
  );
}
