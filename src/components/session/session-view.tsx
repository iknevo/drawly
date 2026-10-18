"use client";

import { SessionToggle } from "./session-toggle";
import { SessionDisplay } from "./session-display";
import { ModeSwitch } from "./mode-switch";
import { TimerView } from "./timer-view";
import { PomodoroView } from "./pomodoro-view";
import { SessionControls } from "./session-controls";

export function SessionView() {
  return (
    <div className="flex flex-col gap-6 rounded-xl border border-border p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <ModeSwitch />
        </div>
        <div className="ml-auto flex items-center gap-3">
          <SessionControls />
        </div>
      </div>

      <div className="flex items-center justify-center gap-6">
        <SessionDisplay />
        <SessionToggle />
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <TimerView />
        <PomodoroView />
      </div>
    </div>
  );
}
