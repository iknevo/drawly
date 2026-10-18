"use client";

import { getColumnStatusStyle } from "../lib/status";
import { KanbanIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import type { kanbanListItem } from "@/modules/kanban/types/types";

export function KanbanBoardThumbnail({ columns }: { columns: kanbanListItem["columns"] }) {
  if (columns.length === 0) {
    return <KanbanIcon className="text-muted-foreground/40 size-8" />;
  }

  return (
    <div className="flex h-full w-full items-stretch gap-1.5">
      {columns.map((column) => {
        const status = getColumnStatusStyle(column.id);

        return (
          <div
            key={column.id}
            className="bg-background/50 flex min-w-0 flex-1 flex-col gap-1 rounded-md p-1.5"
          >
            <div className="flex items-center gap-1">
              <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full", status.dot)} />
              <span className="text-muted-foreground truncate text-[10px] leading-none font-medium">
                {column.title}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              {Array.from({ length: Math.min(column.cardCount, 3) }).map((_, index) => (
                <span
                  key={index}
                  className="bg-muted-foreground/15 block h-1.5 w-full rounded-full"
                />
              ))}
              {column.cardCount > 3 ? (
                <span className="text-muted-foreground/70 text-[10px] leading-none tabular-nums">
                  +{column.cardCount - 3}
                </span>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
