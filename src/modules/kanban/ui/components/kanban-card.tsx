"use client";

import { formatDueDate, getDueStyle } from "../lib/due-date";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "cn";
import { CalendarDaysIcon, GripVerticalIcon } from "lucide-react";

import type { kanbanCard } from "@/modules/kanban/types/types";

type KanbanCardProps = {
  card: kanbanCard;
  onOpen: (card: kanbanCard) => void;
};

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
        "bg-card text-card-foreground ring-foreground/10 flex items-start gap-1 rounded-lg p-2 text-sm shadow-xs ring-1",
        dragging && "opacity-50",
        className
      )}
    >
      <button
        type="button"
        className="text-muted-foreground/60 hover:text-foreground focus-visible:ring-ring mt-0.5 -ml-0.5 shrink-0 touch-none rounded p-0.5 focus-visible:ring-2 focus-visible:outline-none active:cursor-grabbing"
        aria-label={`Drag "${card.title}"`}
        {...dragHandleProps}
      >
        <GripVerticalIcon className="size-4" />
      </button>
      <button
        type="button"
        className="focus-visible:ring-ring min-w-0 flex-1 rounded text-left focus-visible:ring-2 focus-visible:outline-none"
        onClick={() => onOpen?.(card)}
      >
        <p className="font-medium wrap-break-word">{card.title}</p>
        {card.description ? (
          <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs wrap-break-word">
            {card.description}
          </p>
        ) : null}
      </button>
      {card.dueDate ? (
        <span
          className={cn(
            "mt-0.5 inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-xs ring-1",
            getDueStyle(card.dueDate)
          )}
        >
          <CalendarDaysIcon className="size-3" />
          {formatDueDate(card.dueDate)}
        </span>
      ) : null}
    </div>
  );
}

export function KanbanCard({ card, onOpen }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} data-card-id={card.id}>
      {isDragging ? (
        <div className="ring-foreground/10 ring-dashed min-h-10 rounded-lg bg-transparent ring-1" />
      ) : (
        <KanbanCardShell
          card={card}
          onOpen={onOpen}
          dragHandleProps={{ ...attributes, ...listeners }}
        />
      )}
    </div>
  );
}
