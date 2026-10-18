"use client";

import { TimerIcon, WatchIcon } from "lucide-react";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type ModeSwitchProps = {
  mode: "timer" | "pomodoro";
  onModeChange: (mode: "timer" | "pomodoro") => void;
};

export function ModeSwitch({ mode, onModeChange }: ModeSwitchProps) {
  return (
    <ToggleGroup
      value={[mode]}
      onValueChange={(value) => {
        const next = value[0];
        if (next === "timer" || next === "pomodoro") onModeChange(next);
      }}
      className="w-56"
    >
      <ToggleGroupItem value="timer" className="flex items-center gap-2">
        <TimerIcon className="size-4" />
        Timer
      </ToggleGroupItem>
      <ToggleGroupItem value="pomodoro" className="flex items-center gap-2">
        <WatchIcon className="size-4" />
        Pomodoro
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
