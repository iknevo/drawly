"use client";

import { useState } from "react";
import { TimerIcon, WatchIcon } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export function ModeSwitch() {
  const [mode, setMode] = useState<"timer" | "pomodoro">("timer");

  return (
    <ToggleGroup
      value={[mode]}
      onValueChange={(value) => setMode(value[0] as "timer" | "pomodoro")}
      className="w-48"
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
