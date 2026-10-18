"use client";

import { cn } from "cn";
import { type KeyboardEvent, useState } from "react";

import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";

import { numberInputClassName } from "@/modules/sessions/lib/input";
import type { PomodoroConfig } from "@/modules/sessions/lib/pomodoro";

type PomodoroConfigEditorProps = {
  config: PomodoroConfig;
  onChange: (config: PomodoroConfig) => void;
  onCommit: (config: PomodoroConfig) => void;
};

type FieldValues = {
  work: string;
  shortBreak: string;
  longBreak: string;
  cycles: string;
};

function toValues(config: PomodoroConfig): FieldValues {
  return {
    work: String(Math.round(config.work / 60)),
    shortBreak: String(Math.round(config.shortBreak / 60)),
    longBreak: String(Math.round(config.longBreak / 60)),
    cycles: String(config.cycles),
  };
}

function parseMinutes(value: string, fallback: number): number {
  const parsed = Number(value);
  if (value.trim() === "" || !Number.isFinite(parsed)) return fallback;
  return Math.min(240, Math.max(1, Math.floor(parsed)));
}

function parseCycles(value: string, fallback: number): number {
  const parsed = Number(value);
  if (value.trim() === "" || !Number.isFinite(parsed)) return fallback;
  return Math.min(12, Math.max(1, Math.floor(parsed)));
}

function toConfig(values: FieldValues, fallback: PomodoroConfig): PomodoroConfig {
  return {
    work: parseMinutes(values.work, Math.round(fallback.work / 60)) * 60,
    shortBreak: parseMinutes(values.shortBreak, Math.round(fallback.shortBreak / 60)) * 60,
    longBreak: parseMinutes(values.longBreak, Math.round(fallback.longBreak / 60)) * 60,
    cycles: parseCycles(values.cycles, fallback.cycles),
  };
}

export function PomodoroConfigEditor({ config, onChange, onCommit }: PomodoroConfigEditorProps) {
  const [values, setValues] = useState<FieldValues>(() => toValues(config));

  const update = (field: keyof FieldValues, value: string) => {
    const nextValues = { ...values, [field]: value };
    setValues(nextValues);
    onChange(toConfig(nextValues, config));
  };

  const commit = () => {
    const next = toConfig(values, config);
    setValues(toValues(next));
    onCommit(next);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      commit();
    }
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="pomodoro-work" className="text-muted-foreground text-xs">
          Work
        </Label>
        <InputGroup>
          <InputGroupInput
            id="pomodoro-work"
            type="number"
            inputMode="numeric"
            min={1}
            max={240}
            value={values.work}
            className={cn("text-right", numberInputClassName)}
            onChange={(event) => update("work", event.target.value)}
            onBlur={commit}
            onKeyDown={onKeyDown}
          />
          <InputGroupAddon align="inline-end">min</InputGroupAddon>
        </InputGroup>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="pomodoro-short" className="text-muted-foreground text-xs">
          Short break
        </Label>
        <InputGroup>
          <InputGroupInput
            id="pomodoro-short"
            type="number"
            inputMode="numeric"
            min={1}
            max={240}
            value={values.shortBreak}
            className={cn("text-right", numberInputClassName)}
            onChange={(event) => update("shortBreak", event.target.value)}
            onBlur={commit}
            onKeyDown={onKeyDown}
          />
          <InputGroupAddon align="inline-end">min</InputGroupAddon>
        </InputGroup>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="pomodoro-long" className="text-muted-foreground text-xs">
          Long break
        </Label>
        <InputGroup>
          <InputGroupInput
            id="pomodoro-long"
            type="number"
            inputMode="numeric"
            min={1}
            max={240}
            value={values.longBreak}
            className={cn("text-right", numberInputClassName)}
            onChange={(event) => update("longBreak", event.target.value)}
            onBlur={commit}
            onKeyDown={onKeyDown}
          />
          <InputGroupAddon align="inline-end">min</InputGroupAddon>
        </InputGroup>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="pomodoro-cycles" className="text-muted-foreground text-xs">
          Cycles
        </Label>
        <Input
          id="pomodoro-cycles"
          type="number"
          inputMode="numeric"
          min={1}
          max={12}
          value={values.cycles}
          className={cn("text-right", numberInputClassName)}
          onChange={(event) => update("cycles", event.target.value)}
          onBlur={commit}
          onKeyDown={onKeyDown}
        />
      </div>
    </div>
  );
}
