"use client";

import { formatDueDate, getDueStyle } from "../lib/due-date";
import { cn } from "cn";
import { CalendarDaysIcon, GripVerticalIcon } from "lucide-react";

import type { kanbanCard } from "@/modules/kanban/types/types";

export function KanbanCardShell({
  card,
  onOpen,
  dragging,
  className,
  dragHandleProps,
}: {
  card: kanbanCard;
  onOpen?: (card: kanbanCard) => void;
  dragging?: boolean;
  className?: string;
  dragHandleProps?: React.ComponentProps<"button">;
}) {
  return (
    <div
      className={cn(
        "bg-card text-card-foreground ring-foreground/10 flex items-center gap-1 rounded-lg p-2 text-sm shadow-xs ring-1",
        dragging && "opacity-50",
        className
      )}
    >
      <button
        type="button"
        className="text-muted-foreground/60 hover:text-foreground focus-visible:ring-ring -ml-0.5 shrink-0 touch-none rounded p-0.5 focus-visible:ring-2 focus-visible:outline-none active:cursor-grabbing"
        aria-label={`Drag "${card.title}"`}
        {...dragHandleProps}
      >
        <GripVerticalIcon className="size-4" />
      </button>
      <button
        type="button"
        className="focus-visible:ring-ring flex min-w-0 flex-1 items-center gap-2 rounded text-left focus-visible:ring-2 focus-visible:outline-none"
        onClick={() => onOpen?.(card)}
      >
        <div className="min-w-0 flex-1">
          <p className="font-medium wrap-break-word">{card.title}</p>
          {card.description ? (
            <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs wrap-break-word">
              {card.description}
            </p>
          ) : null}
        </div>
        {card.dueDate ? (
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-xs ring-1",
              getDueStyle(card.dueDate)
            )}
          >
            <CalendarDaysIcon className="size-3" />
            {formatDueDate(card.dueDate)}
          </span>
        ) : null}
      </button>
    </div>
  );
}
