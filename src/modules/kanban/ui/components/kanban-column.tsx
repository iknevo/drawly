"use client";

import { getColumnStatusStyle } from "../lib/status";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { cn } from "cn";
import { PlusIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

import { KanbanCard } from "./kanban-card";
import type { kanbanCard, kanbanColumn } from "@/modules/kanban/types/types";

type KanbanColumnProps = {
  column: kanbanColumn;
  creating?: boolean;
  onOpenCard: (card: kanbanCard) => void;
  onCreateCard: (columnId: string, title: string) => void;
};

export function KanbanColumn({ column, creating, onOpenCard, onCreateCard }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const [composing, setComposing] = useState(false);
  const [title, setTitle] = useState("");
  const status = getColumnStatusStyle(column.id);

  function submit() {
    const trimmed = title.trim();
    if (!trimmed) return;
    onCreateCard(column.id, trimmed);
    setTitle("");
    setComposing(false);
  }

  return (
    <section className="bg-muted/40 flex min-w-72 flex-1 flex-col rounded-xl">
      <header className="flex items-center justify-between gap-2 px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <span aria-hidden className={cn("size-2 shrink-0 rounded-full", status.dot)} />
          <h2 className="truncate text-sm font-medium">{column.title}</h2>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-xs tabular-nums ring-1",
            status.badge
          )}
        >
          {column.cards.length}
        </span>
      </header>
      <SortableContext
        items={column.cards.map((card) => card.id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          ref={setNodeRef}
          className={cn(
            "flex min-h-24 flex-1 flex-col gap-2 overflow-y-auto px-2 py-1 transition-colors",
            isOver && "bg-accent/50 rounded-lg"
          )}
        >
          {column.cards.map((card) => (
            <KanbanCard key={card.id} card={card} onOpen={onOpenCard} />
          ))}
          {column.cards.length === 0 && !composing ? (
            <p className="text-muted-foreground/70 px-2 py-6 text-center text-xs">
              Drop cards here
            </p>
          ) : null}
        </div>
      </SortableContext>
      <div className="p-2 pt-0">
        {composing ? (
          <div className="flex flex-col gap-2">
            <textarea
              autoFocus
              value={title}
              rows={2}
              placeholder="Card title"
              onChange={(event) => setTitle(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  submit();
                }

                if (event.key === "Escape") {
                  setComposing(false);
                  setTitle("");
                }
              }}
              className="border-input bg-background focus-visible:ring-ring min-h-16 w-full resize-none rounded-lg border p-2 text-sm shadow-xs focus-visible:ring-2 focus-visible:outline-none"
            />
            <div className="flex items-center gap-2">
              <Button type="button" size="sm" onClick={submit} disabled={creating || !title.trim()}>
                Add card
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setComposing(false);
                  setTitle("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground w-full justify-start"
            onClick={() => setComposing(true)}
          >
            <PlusIcon className="size-4" />
            Add card
          </Button>
        )}
      </div>
    </section>
  );
}
