"use client";

import {
  QuickdrawCanvas,
  type QuickdrawCanvasHandle,
  type SaveStatus,
} from "../components/quickdraw-canvas";
import { SaveStatusLabel } from "../components/save-status-label";
import { ShareMenu } from "../components/share-menu";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeftIcon, MoreHorizontalIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

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
import { Button, buttonVariants } from "@/components/ui/button";
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

export function BoardView({ boardId }: { boardId: string }) {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();
  const board = useQuery(trpc.boards.get.queryOptions({ id: boardId }));
  const [status, setStatus] = useState<SaveStatus>("saved");
  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const canvasRef = useRef<QuickdrawCanvasHandle>(null);

  const boardKey = trpc.boards.get.queryKey({ id: boardId });

  const renameBoard = useMutation(
    trpc.boards.rename.mutationOptions({
      onMutate: async (variables) => {
        await queryClient.cancelQueries({ queryKey: boardKey });
        const previous = queryClient.getQueryData(boardKey);
        queryClient.setQueryData(boardKey, (current) =>
          current ? { ...current, title: variables.title } : current
        );
        return { previous };
      },
      onError: (error, _variables, context) => {
        if (context?.previous) {
          queryClient.setQueryData(boardKey, context.previous);
        }
        toast.add({ type: "error", description: error.message });
      },
      onSettled: async () => {
        await queryClient.invalidateQueries(trpc.boards.list.queryFilter());
      },
    })
  );

  const removeBoard = useMutation(
    trpc.boards.remove.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpc.boards.list.queryFilter());
        router.push("/boards");
      },
      onError: (error) => toast.add({ type: "error", description: error.message }),
    })
  );

  const startEditing = (title: string) => {
    setDraftTitle(title);
    setEditing(true);
  };

  const commitRename = () => {
    if (!editing) return;
    const next = draftTitle.trim();
    setEditing(false);
    if (!next || next === board.data?.title) return;
    renameBoard.mutate({ id: boardId, title: next });
  };

  const leaveBoard = (event: React.MouseEvent) => {
    if (removeBoard.isPending) return;
    event.preventDefault();
    void canvasRef.current?.flush().finally(() => router.push("/boards"));
  };

  if (board.isPending) {
    return (
      <div className="flex h-svh items-center justify-center">
        <span className="border-muted border-t-foreground size-6 animate-spin rounded-full border-2" />
      </div>
    );
  }

  if (board.isError) {
    return (
      <div className="flex h-svh flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground text-sm">{board.error.message}</p>
        <Link href="/boards" className={buttonVariants({ variant: "outline" })}>
          Back to boards
        </Link>
      </div>
    );
  }

  const data = board.data;

  return (
    <div className="flex h-svh flex-col">
      <header className="flex items-center gap-3 border-b px-3 py-2">
        <Link
          href="/boards"
          onClick={leaveBoard}
          className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
          aria-label="Back to boards"
        >
          <ArrowLeftIcon />
        </Link>

        {editing ? (
          <div className="flex min-w-0 items-center">
            <Label htmlFor="board-title" className="sr-only">
              Board title
            </Label>
            <Input
              id="board-title"
              value={draftTitle}
              autoFocus
              maxLength={120}
              onChange={(event) => setDraftTitle(event.target.value)}
              onBlur={commitRename}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  commitRename();
                } else if (event.key === "Escape") {
                  event.preventDefault();
                  setEditing(false);
                }
              }}
              className="h-7 max-w-xs text-sm font-medium"
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => startEditing(data.title)}
            className="hover:bg-muted min-w-0 truncate rounded px-1.5 py-0.5 text-left text-sm font-medium"
            aria-label="Rename board"
          >
            {data.title}
          </button>
        )}

        <div className="ml-auto flex items-center gap-3">
          <SaveStatusLabel status={status} />
          <ShareMenu boardId={data.id} isPublic={data.isPublic} />
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon-sm" aria-label="Board actions" />}
            >
              <MoreHorizontalIcon />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
                <Trash2Icon />
                Delete board
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="min-h-0 flex-1">
        <QuickdrawCanvas
          ref={canvasRef}
          boardId={data.id}
          snapshot={data.snapshot}
          rev={data.rev}
          title={data.title}
          thumbnail={data.thumbnail}
          onStatus={setStatus}
        />
      </div>

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
              onClick={() => {
                void canvasRef.current?.flush().finally(() => removeBoard.mutate({ id: boardId }));
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
