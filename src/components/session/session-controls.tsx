"use client";

import { SessionToggle } from "./session-toggle";

export function SessionControls() {
  return (
    <div className="flex items-center gap-2">
      <SessionToggle />
    </div>
  );
}
