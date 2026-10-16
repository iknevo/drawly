import { differenceInCalendarDays, format } from "date-fns";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_DATETIME = /^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d$/;

export function isIsoDate(value: string): boolean {
  return ISO_DATE.test(value) || ISO_DATETIME.test(value);
}

export function splitIso(value: string): { date: string | null; time: string | null } {
  if (!isIsoDate(value)) return { date: null, time: null };
  const [date, time] = value.split("T");

  return { date, time: time ?? null };
}

export function toIso(date: Date, time?: string | null): string {
  const datePart = format(date, "yyyy-MM-dd");

  return time ? `${datePart}T${time}` : datePart;
}

export function fromIso(value: string): Date | undefined {
  const { date, time } = splitIso(value);
  if (!date) return undefined;
  const [year, month, day] = date.split("-").map(Number);
  const [hours, minutes] = time ? time.split(":").map(Number) : [0, 0];

  return new Date(year, month - 1, day, hours, minutes);
}

export function formatDueDate(value: string): string {
  const date = fromIso(value);
  if (!date) return value;

  return splitIso(value).time ? format(date, "MMM d, h:mm a") : format(date, "MMM d");
}

export type DueState = "overdue" | "today" | "upcoming";

export function getDueState(value: string, now = new Date()): DueState {
  const date = fromIso(value);
  if (!date) return "upcoming";

  if (splitIso(value).time && date.getTime() < now.getTime()) return "overdue";

  const days = differenceInCalendarDays(date, now);
  if (days < 0) return "overdue";
  if (days === 0) return "today";

  return "upcoming";
}

const DUE_STYLES: Record<DueState, string> = {
  overdue: "bg-destructive/10 text-destructive ring-destructive/20",
  today: "bg-amber-500/15 text-amber-700 ring-amber-500/30 dark:text-amber-400",
  upcoming: "bg-muted text-muted-foreground ring-foreground/10",
};

export function getDueStyle(value: string): string {
  return DUE_STYLES[getDueState(value)];
}
