"use client";

import { formatDueDate, fromIso, toIso } from "../lib/due-date";
import { CalendarDaysIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";

import type { kanbanCard } from "@/modules/kanban/types/types";

type CardDetailDialogProps = {
  card: kanbanCard | null;
  open: boolean;
  saving?: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (card: {
    id: string;
    title: string;
    description: string;
    dueDate: string | null;
  }) => Promise<unknown>;
  onDelete: (cardId: string) => void;
};

export function CardDetailDialog({
  card,
  open,
  saving,
  onOpenChange,
  onSave,
  onDelete,
}: CardDetailDialogProps) {
  const [title, setTitle] = useState(card?.title ?? "");
  const [description, setDescription] = useState(card?.description ?? "");
  const [dueDate, setDueDate] = useState<string | null>(card?.dueDate ?? null);

  const dirty =
    Boolean(card) &&
    (title !== card?.title ||
      description !== card?.description ||
      dueDate !== (card?.dueDate ?? null));

  async function save() {
    if (!card || !title.trim()) return;

    try {
      await onSave({ id: card.id, title: title.trim(), description, dueDate });
      onOpenChange(false);
    } catch {
      // The mutation's onError already rolls back and shows a toast.
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit card</DialogTitle>
          <DialogDescription>
            Update the card title and description. Changes save automatically.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="card-title"
              className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Title
            </label>
            <Input
              id="card-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void save();
                }
              }}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="card-description"
              className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Description
            </label>
            <Textarea
              id="card-description"
              value={description}
              rows={6}
              placeholder="Add more detail (optional)"
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-sm leading-none font-medium">Due date</span>
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger
                  render={
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="justify-start font-normal"
                    />
                  }
                >
                  <CalendarDaysIcon className="size-4" />
                  {dueDate ? formatDueDate(dueDate) : "No due date"}
                </PopoverTrigger>
                <PopoverContent align="start" className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dueDate ? fromIso(dueDate) : undefined}
                    onSelect={(date) => setDueDate(date ? toIso(date) : null)}
                    autoFocus
                  />
                </PopoverContent>
              </Popover>
              {dueDate ? (
                <Button type="button" variant="ghost" size="sm" onClick={() => setDueDate(null)}>
                  Clear
                </Button>
              ) : null}
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:justify-between">
          {card ? (
            <Button
              type="button"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={() => {
                onDelete(card.id);
                onOpenChange(false);
              }}
            >
              <Trash2Icon className="size-4" />
              Delete
            </Button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button
              type="button"
              onClick={() => void save()}
              disabled={saving || !title.trim() || !dirty}
            >
              Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
