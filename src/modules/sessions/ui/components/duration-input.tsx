"use client";

import { cn } from "cn";
import { type KeyboardEvent, useState } from "react";

import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";

import { numberInputClassName } from "@/modules/sessions/lib/input";

const MAX_SECONDS = 86400;
const MAX_MINUTES = 1440;

type DurationInputProps = {
  id?: string;
  value: number;
  onChange: (seconds: number) => void;
  disabled?: boolean;
};

function toParts(value: number): { minutes: string; seconds: string } {
  const safe = Math.max(0, Math.min(MAX_SECONDS, Math.floor(value)));
  return {
    minutes: String(Math.floor(safe / 60)),
    seconds: String(safe % 60),
  };
}

function parsePart(raw: string, fallback: number, max: number): number {
  const parsed = Number(raw);
  if (raw.trim() === "" || !Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(0, Math.floor(parsed)));
}

export function DurationInput({ id, value, onChange, disabled }: DurationInputProps) {
  const [parts, setParts] = useState(() => toParts(value));
  const [synced, setSynced] = useState(value);

  if (synced !== value) {
    setSynced(value);
    setParts(toParts(value));
  }

  const commit = () => {
    const minutes = parsePart(parts.minutes, Math.floor(value / 60), MAX_MINUTES);
    const seconds = parsePart(parts.seconds, value % 60, 59);
    const total = Math.min(MAX_SECONDS, minutes * 60 + seconds);
    setSynced(total);
    setParts(toParts(total));
    if (total !== value) onChange(total);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      commit();
    }
  };

  return (
    <div className="flex items-center gap-2">
      <InputGroup className="w-24">
        <InputGroupInput
          id={id}
          type="number"
          inputMode="numeric"
          min={0}
          max={MAX_MINUTES}
          value={parts.minutes}
          disabled={disabled}
          className={cn("text-right", numberInputClassName)}
          onChange={(event) => setParts((prev) => ({ ...prev, minutes: event.target.value }))}
          onBlur={commit}
          onKeyDown={onKeyDown}
        />
        <InputGroupAddon align="inline-end">min</InputGroupAddon>
      </InputGroup>
      <InputGroup className="w-20">
        <InputGroupInput
          type="number"
          inputMode="numeric"
          min={0}
          max={59}
          value={parts.seconds}
          disabled={disabled}
          className={cn("text-right", numberInputClassName)}
          onChange={(event) => setParts((prev) => ({ ...prev, seconds: event.target.value }))}
          onBlur={commit}
          onKeyDown={onKeyDown}
        />
        <InputGroupAddon align="inline-end">sec</InputGroupAddon>
      </InputGroup>
    </div>
  );
}
