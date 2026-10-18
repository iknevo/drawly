"use client";

import { SlidersHorizontalIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";

import type { PomodoroConfig } from "@/modules/sessions/lib/pomodoro";
import { DurationInput } from "@/modules/sessions/ui/components/duration-input";
import { PomodoroConfigEditor } from "@/modules/sessions/ui/components/pomodoro-config-editor";
import type { SessionMode } from "@/modules/sessions/ui/hooks/use-session-timer";

type SessionSettingsProps = {
  mode: SessionMode;
  targetSeconds: number;
  onTargetChange: (seconds: number) => void;
  targetDisabled: boolean;
  config: PomodoroConfig;
  onConfigChange: (config: PomodoroConfig) => void;
  onConfigCommit: (config: PomodoroConfig) => void;
};

export function SessionSettings({
  mode,
  targetSeconds,
  onTargetChange,
  targetDisabled,
  config,
  onConfigChange,
  onConfigCommit,
}: SessionSettingsProps) {
  const isPomodoro = mode === "pomodoro";

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="outline" size="icon" aria-label="Session settings">
            <SlidersHorizontalIcon />
          </Button>
        }
      />
      <PopoverContent align="start" className="w-80">
        <PopoverHeader>
          <PopoverTitle>{isPomodoro ? "Pomodoro settings" : "Timer settings"}</PopoverTitle>
          <PopoverDescription>
            {isPomodoro
              ? "Applies to the current and next phases."
              : "Set a target for this session. 0:00 is a stopwatch."}
          </PopoverDescription>
        </PopoverHeader>
        {isPomodoro ? (
          <PomodoroConfigEditor
            config={config}
            onChange={onConfigChange}
            onCommit={onConfigCommit}
          />
        ) : (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="session-target" className="text-muted-foreground text-xs">
              Target
            </Label>
            <DurationInput
              id="session-target"
              value={targetSeconds}
              disabled={targetDisabled}
              onChange={onTargetChange}
            />
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
