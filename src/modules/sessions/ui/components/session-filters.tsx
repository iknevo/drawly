"use client";

import { cn } from "cn";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

import type { SessionStatusFilter, SessionTypeFilter } from "../../lib/list-params";
import { useSessionListParams } from "../hooks/use-session-list-params";

const TYPE_OPTIONS: { value: SessionTypeFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "timer", label: "Timer" },
  { value: "pomodoro", label: "Pomodoro" },
];

const STATUS_OPTIONS: { value: SessionStatusFilter; label: string }[] = [
  { value: "all", label: "Any status" },
  { value: "ongoing", label: "Ongoing" },
  { value: "completed", label: "Completed" },
];

export function SessionFilters({ className }: { className?: string }) {
  const [{ type, status }, setParams] = useSessionListParams();

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <ToggleGroup
        value={[type]}
        onValueChange={(value) => {
          const next = value[0];
          if (!next) return;
          void setParams({ type: next as SessionTypeFilter, page: 1 });
        }}
        size="sm"
        variant="outline"
      >
        {TYPE_OPTIONS.map((option) => (
          <ToggleGroupItem key={option.value} value={option.value}>
            {option.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <span className="bg-border hidden h-4 w-px sm:block" aria-hidden="true" />

      <ToggleGroup
        value={[status]}
        onValueChange={(value) => {
          const next = value[0];
          if (!next) return;
          void setParams({ status: next as SessionStatusFilter, page: 1 });
        }}
        size="sm"
        variant="outline"
      >
        {STATUS_OPTIONS.map((option) => (
          <ToggleGroupItem key={option.value} value={option.value}>
            {option.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}
