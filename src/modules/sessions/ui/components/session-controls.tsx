"use client";

import { CheckIcon, PauseIcon, PlayIcon, RotateCcwIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

type SessionControlsProps = {
  status: "idle" | "running" | "paused";
  done?: boolean;
  onToggle: () => void;
  onReset: () => void;
  onComplete: () => void;
  isPending: boolean;
};

export function SessionControls({
  status,
  done = false,
  onToggle,
  onReset,
  onComplete,
  isPending,
}: SessionControlsProps) {
  const isRunning = status === "running";

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={onToggle}
        disabled={isPending || done}
        aria-label={isRunning ? "Pause session" : "Start session"}
        className="size-12 rounded-full"
      >
        {isRunning ? <PauseIcon className="size-5" /> : <PlayIcon className="size-5" />}
      </Button>
      <Button
        onClick={onComplete}
        disabled={status === "idle" || isPending}
        variant="outline"
        size="icon"
        aria-label="Complete session"
      >
        <CheckIcon />
      </Button>
      <Button
        onClick={onReset}
        disabled={status === "idle" || isPending}
        variant="outline"
        size="icon"
        aria-label="Reset session"
      >
        <RotateCcwIcon />
      </Button>
    </div>
  );
}
