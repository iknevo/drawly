"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const HOURS = Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, "0"));
const MINUTES = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, "0"));
const MERIDIEMS = ["AM", "PM"] as const;

type Meridiem = (typeof MERIDIEMS)[number];

function parseTime(value: string | null) {
  if (!value) return null;
  const [hour24, minute] = value.split(":").map(Number);
  if (Number.isNaN(hour24) || Number.isNaN(minute)) return null;

  return {
    hour: String(hour24 % 12 || 12).padStart(2, "0"),
    minute: String(minute).padStart(2, "0"),
    meridiem: (hour24 >= 12 ? "PM" : "AM") as Meridiem,
  };
}

function buildTime(hour: string, minute: string, meridiem: Meridiem): string {
  const hour24 = (Number(hour) % 12) + (meridiem === "PM" ? 12 : 0);

  return `${String(hour24).padStart(2, "0")}:${minute}`;
}

type TimePickerProps = {
  value: string | null;
  onValueChange: (value: string) => void;
  disabled?: boolean;
};

export function TimePicker({ value, onValueChange, disabled }: TimePickerProps) {
  const parts = parseTime(value);
  const hour = parts?.hour ?? "12";
  const minute = parts?.minute ?? "00";
  const meridiem = parts?.meridiem ?? "AM";

  return (
    <div className="flex items-center gap-1">
      <Select
        value={parts ? parts.hour : null}
        onValueChange={(next) => onValueChange(buildTime(String(next), minute, meridiem))}
        disabled={disabled}
      >
        <SelectTrigger size="sm" aria-label="Hour" className="tabular-nums">
          <SelectValue placeholder="HH" />
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false}>
          {HOURS.map((item) => (
            <SelectItem key={item} value={item}>
              {item}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={parts ? parts.minute : null}
        onValueChange={(next) => onValueChange(buildTime(hour, String(next), meridiem))}
        disabled={disabled}
      >
        <SelectTrigger size="sm" aria-label="Minute" className="tabular-nums">
          <SelectValue placeholder="MM" />
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false}>
          {MINUTES.map((item) => (
            <SelectItem key={item} value={item}>
              {item}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={parts ? parts.meridiem : null}
        onValueChange={(next) => onValueChange(buildTime(hour, minute, next as Meridiem))}
        disabled={disabled}
      >
        <SelectTrigger size="sm" aria-label="AM or PM">
          <SelectValue placeholder="--" />
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false}>
          {MERIDIEMS.map((item) => (
            <SelectItem key={item} value={item}>
              {item}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
