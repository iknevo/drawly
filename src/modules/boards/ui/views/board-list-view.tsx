"use client";

import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import {
  GhostIcon,
  LayoutGridIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { ErrorState } from "@/components/error-state";
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
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";

import { useTRPC } from "@/trpc/client";

function BoardCardSkeleton() {
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

function BoardsListSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-6 lg:p-10">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <BoardCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}

export function BoardListView() {
  return (
    <Suspense fallback={<BoardsListSkeleton />}>
      <ErrorBoundary
        fallbackRender={({ resetErrorBoundary }) => <ErrorState onRetry={resetErrorBoundary} />}
      >
        <BoardListViewSuspense />
      </ErrorBoundary>
    </Suspense>
  );
}

function BoardListViewSuspense() {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: boards } = useSuspenseQuery(trpc.boards.list.queryOptions());

  const [renameTarget, setRenameTarget] = useState<{ id: string; title: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  const createBoard = useMutation(
    trpc.boards.create.mutationOptions({
      onSuccess: async ({ id }) => {
        router.push(`/board/${id}`);
        await queryClient.invalidateQueries(trpc.boards.list.queryOptions());
      },
      onError: (error) => toast.add({ type: "error", description: error.message }),
    })
  );

  const renameBoard = useMutation(
    trpc.boards.rename.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpc.boards.list.queryOptions());
        setRenameTarget(null);
      },
      onError: (error) => toast.add({ type: "error", description: error.message }),
    })
  );

  const removeBoard = useMutation(
    trpc.boards.remove.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpc.boards.list.queryOptions());
        setDeleteTarget(null);
      },
      onError: (error) => toast.add({ type: "error", description: error.message }),
    })
  );

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-6 lg:p-10">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-medium">Your boards</h1>
          <p className="text-muted-foreground text-sm">Sketch ideas on an infinite canvas.</p>
        </div>
        <Button size="lg" disabled={createBoard.isPending} onClick={() => createBoard.mutate({})}>
          <PlusIcon />
          New board
        </Button>
      </header>

      {boards.length === 0 ? (
        <Empty className="py-20">
          <EmptyHeader>
            <EmptyMedia>
              <GhostIcon className="size-10" />
            </EmptyMedia>
            <EmptyTitle>No boards yet</EmptyTitle>
            <EmptyDescription>Create your first board to start drawing.</EmptyDescription>
          </EmptyHeader>
          <Button onClick={() => createBoard.mutate({})}>
            <PlusIcon />
            New board
          </Button>
        </Empty>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {boards.map((board) => (
            <Card key={board.id} size="sm" className="gap-3">
              <Link
                href={`/board/${board.id}`}
                className="bg-muted/40 ring-foreground/5 relative mx-3 flex aspect-4/3 items-center justify-center overflow-hidden rounded-lg ring-1"
              >
                {board.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={board.thumbnail}
                    alt={`${board.title} preview`}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <LayoutGridIcon className="text-muted-foreground/40 size-8" />
                )}
              </Link>
              <div className="flex items-start justify-between gap-2 px-3">
                <div className="min-w-0">
                  <Link href={`/board/${board.id}`} className="block truncate font-medium">
                    {board.title}
                  </Link>
                  <p className="text-muted-foreground text-xs">
                    Edited {formatDistanceToNow(new Date(board.updatedAt), { addSuffix: true })}
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
                        setRenameTarget({ id: board.id, title: board.title });
                      }}
                    >
                      <PencilIcon />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => {
                        setDeleteTarget({ id: board.id, title: board.title });
                      }}
                    >
                      <Trash2Icon />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </Card>
          ))}
        </div>
      )}

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
          <Input
            value={renameTarget?.title ?? ""}
            autoFocus
            onChange={(event) => {
              setRenameTarget((prev) => (prev ? { ...prev, title: event.target.value } : prev));
            }}
          />
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

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete board?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{deleteTarget?.title}&rdquo; will be permanently deleted. This cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={removeBoard.isPending}
              onClick={() => {
                if (deleteTarget) removeBoard.mutate({ id: deleteTarget.id });
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
