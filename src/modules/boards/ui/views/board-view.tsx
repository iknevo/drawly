"use client";

import {
  QuickdrawCanvas,
  type QuickdrawCanvasHandle,
  type SaveStatus,
} from "../components/quickdraw-canvas";
import { ShareMenu } from "../components/share-menu";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";

import { useTRPC } from "@/trpc/client";

const STATUS_LABELS: Record<Exclude<SaveStatus, "conflict">, string> = {
  saved: "Saved",
  dirty: "Unsaved changes",
  saving: "Saving…",
  error: "Couldn't save — retrying",
  offline: "Offline — changes pending",
};

function SaveStatusLabel({ status }: { status: SaveStatus }) {
  if (status === "conflict") {
    return <span className="text-destructive text-xs">Changed in another tab</span>;
  }

  const emphasize = status === "error" || status === "offline";

  return (
    <span
      className={
        emphasize
          ? "text-destructive flex items-center gap-1.5 text-xs"
          : "text-muted-foreground flex items-center gap-1.5 text-xs"
      }
    >
      {status === "saving" && (
        <span className="border-muted border-t-foreground size-3 animate-spin rounded-full border-[1.5px]" />
      )}
      {STATUS_LABELS[status]}
    </span>
  );
}

export function BoardView({ boardId }: { boardId: string }) {
  const trpc = useTRPC();
  const board = useQuery(trpc.boards.get.queryOptions({ id: boardId }));
  const [status, setStatus] = useState<SaveStatus>("saved");
  const canvasRef = useRef<QuickdrawCanvasHandle>(null);

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
          className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
          aria-label="Back to boards"
        >
          <ArrowLeftIcon />
        </Link>
        <h1 className="truncate text-sm font-medium">{data.title}</h1>
        <div className="ml-auto flex items-center gap-3">
          {status === "conflict" && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => void canvasRef.current?.reloadRemote()}
              >
                Reload
              </Button>
              <Button
                size="sm"
                variant="default"
                onClick={() => void canvasRef.current?.overwrite()}
              >
                Overwrite
              </Button>
            </div>
          )}
          <SaveStatusLabel status={status} />
          <ShareMenu boardId={data.id} isPublic={data.isPublic} />
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
    </div>
  );
}
