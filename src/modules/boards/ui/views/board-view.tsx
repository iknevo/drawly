"use client";

import { QuickdrawCanvas } from "../components/quickdraw-canvas";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

import { useTRPC } from "@/trpc/client";

export function BoardView({ boardId }: { boardId: string }) {
  const trpc = useTRPC();
  const board = useQuery(trpc.boards.get.queryOptions({ id: boardId }));

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
      </header>
      <div className="min-h-0 flex-1">
        <QuickdrawCanvas boardId={data.id} snapshot={data.snapshot} />
      </div>
    </div>
  );
}
