"use client";

import type { boardsListItem } from "../../types/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import {
  CopyIcon,
  GlobeIcon,
  LayoutGridIcon,
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react";
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

import { useTRPC } from "@/trpc/client";

export function BoardCardSkeleton() {
  return (
    <Card size="sm" className="gap-3">
      <div className="bg-muted/40 mx-3 aspect-4/3 animate-pulse rounded-lg" />
      <div className="flex items-start justify-between gap-2 px-3">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="bg-muted h-4 w-2/3 animate-pulse rounded" />
          <div className="bg-muted h-3 w-1/2 animate-pulse rounded" />
        </div>
      </div>
    </Card>
  );
}

interface BoardCardProps {
  data: boardsListItem;
}

export function BoardCard({ data }: BoardCardProps) {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [renameTarget, setRenameTarget] = useState<{ id: string; title: string } | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const renameBoard = useMutation(
    trpc.boards.rename.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpc.boards.list.queryFilter());
        setRenameTarget(null);
      },
      onError: (error) => toast.add({ type: "error", description: error.message }),
    })
  );

  const removeBoard = useMutation(
    trpc.boards.remove.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpc.boards.list.queryFilter());
        setDeleteOpen(false);
      },
      onError: (error) => toast.add({ type: "error", description: error.message }),
    })
  );

  const duplicateBoard = useMutation(
    trpc.boards.duplicate.mutationOptions({
      onSuccess: async ({ id }) => {
        await queryClient.invalidateQueries(trpc.boards.list.queryFilter());
        router.push(`/board/${id}`);
      },
      onError: (error) => toast.add({ type: "error", description: error.message }),
    })
  );

  const onDelete = (id: string) => removeBoard.mutate({ id });

  return (
    <>
      <Card size="sm" className="gap-3">
        <Link
          href={`/board/${data.id}`}
          className="bg-muted/40 ring-foreground/5 relative mx-3 flex aspect-4/3 items-center justify-center overflow-hidden rounded-lg ring-1"
        >
          {data.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.thumbnail}
              alt={`${data.title} preview`}
              className="h-full w-full object-contain"
            />
          ) : (
            <LayoutGridIcon className="text-muted-foreground/40 size-8" />
          )}
        </Link>
        <div className="flex items-start justify-between gap-2 px-3">
          <div className="min-w-0">
            <Link href={`/board/${data.id}`} className="flex items-center gap-1.5">
              <span className="truncate font-medium">{data.title}</span>
              {data.isPublic && (
                <GlobeIcon
                  className="text-muted-foreground size-3.5 shrink-0"
                  aria-label="Public board"
                />
              )}
            </Link>
            <p className="text-muted-foreground text-xs">
              Edited {formatDistanceToNow(new Date(data.updatedAt), { addSuffix: true })}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon-sm" aria-label="Board actions" />}
            >
              <MoreHorizontalIcon />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  setRenameTarget({ id: data.id, title: data.title });
                }}
              >
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
            <DialogDescription>Give your board a new name.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="board-name">Name</Label>
            <Input
              id="board-name"
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
              onClick={() => onDelete(data.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
