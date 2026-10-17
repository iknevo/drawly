"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { KanbanCardShell } from "./kanban-card-shell";
import type { kanbanCard } from "@/modules/kanban/types/types";

type KanbanCardProps = {
  card: kanbanCard;
  onOpen: (card: kanbanCard) => void;
};

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
