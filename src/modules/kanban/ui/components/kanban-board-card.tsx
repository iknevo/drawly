"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { CopyIcon, MoreHorizontalIcon, PencilIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import { useSound } from "@/components/sound-provider";

import { KanbanBoardThumbnail } from "./kanban-board-thumbnail";
import type { kanbanListItem } from "@/modules/kanban/types/types";
import { useTRPC } from "@/trpc/client";

export function KanbanBoardCardSkeleton() {
  return (
    <Card size="sm" className="gap-3">
      <div className="bg-muted/40 mx-3 aspect-4/3 animate-pulse rounded-lg" />
      <div className="space-y-2 px-3">
        <div className="bg-muted h-4 w-2/3 animate-pulse rounded" />
        <div className="bg-muted h-3 w-1/2 animate-pulse rounded" />
      </div>
    </Card>
  );
}

export function KanbanBoardCard({ data }: { data: kanbanListItem }) {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { play } = useSound();

  const [renameTarget, setRenameTarget] = useState<{ id: string; title: string } | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const renameBoard = useMutation(
    trpc.kanban.rename.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpc.kanban.list.queryFilter());
        setRenameTarget(null);
      },
      onError: (error) => toast.add({ type: "error", description: error.message }),
    })
  );

  const removeBoard = useMutation(
    trpc.kanban.remove.mutationOptions({
      onSuccess: async () => {
        play("delete");
        await queryClient.invalidateQueries(trpc.kanban.list.queryFilter());
        setDeleteOpen(false);
      },
      onError: (error) => toast.add({ type: "error", description: error.message }),
    })
  );

  const duplicateBoard = useMutation(
    trpc.kanban.duplicate.mutationOptions({
      onSuccess: async ({ id }) => {
        await queryClient.invalidateQueries(trpc.kanban.list.queryFilter());
        router.push(`/kanban/${id}`);
      },
      onError: (error) => toast.add({ type: "error", description: error.message }),
    })
  );

  return (
    <>
      <Card size="sm" className="gap-3">
        <Link
          href={`/kanban/${data.id}`}
          className="bg-muted/40 ring-foreground/5 mx-3 flex aspect-4/3 items-stretch gap-1.5 overflow-hidden rounded-lg p-2 ring-1"
        >
          <KanbanBoardThumbnail columns={data.columns} />
        </Link>
        <div className="flex items-start justify-between gap-2 px-3">
          <div className="min-w-0">
            <Link href={`/kanban/${data.id}`} className="truncate font-medium">
              {data.title}
            </Link>
            <p className="text-muted-foreground text-xs">
              {data.cardCount} {data.cardCount === 1 ? "card" : "cards"} · edited{" "}
              {formatDistanceToNow(new Date(data.updatedAt), { addSuffix: true })}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon-sm" aria-label="Board actions" />}
            >
              <MoreHorizontalIcon />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setRenameTarget({ id: data.id, title: data.title })}>
                <PencilIcon />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={duplicateBoard.isPending}
                onClick={() => duplicateBoard.mutate({ id: data.id })}
              >
                <CopyIcon />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
                <Trash2Icon />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </Card>

      <Dialog
        open={renameTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRenameTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename board</DialogTitle>
            <DialogDescription>Give your kanban board a new name.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="kanban-name">Name</Label>
            <Input
              id="kanban-name"
              value={renameTarget?.title ?? ""}
              autoFocus
              maxLength={120}
              onChange={(event) => {
                setRenameTarget((prev) => (prev ? { ...prev, title: event.target.value } : prev));
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && renameTarget?.title.trim() && !renameBoard.isPending) {
                  event.preventDefault();
                  renameBoard.mutate({ id: renameTarget.id, title: renameTarget.title.trim() });
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameTarget(null)}>
              Cancel
            </Button>
            <Button
              disabled={renameBoard.isPending || !renameTarget?.title.trim()}
              onClick={() => {
                if (renameTarget) {
                  renameBoard.mutate({ id: renameTarget.id, title: renameTarget.title.trim() });
                }
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete board?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{data.title}&rdquo; will be permanently deleted. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={removeBoard.isPending}
              onClick={() => removeBoard.mutate({ id: data.id })}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
