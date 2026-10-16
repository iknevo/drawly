import { differenceInCalendarDays, format } from "date-fns";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value: string): boolean {
  return ISO_DATE.test(value);
}

export function toIso(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function fromIso(value: string): Date | undefined {
  if (!isIsoDate(value)) return undefined;
  const [year, month, day] = value.split("-").map(Number);

  return new Date(year, month - 1, day);
}

export function formatDueDate(value: string): string {
  const date = fromIso(value);

  return date ? format(date, "MMM d") : value;
}

export type DueState = "overdue" | "today" | "upcoming";

export function getDueState(value: string, now = new Date()): DueState {
  const date = fromIso(value);
  if (!date) return "upcoming";

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
