"use client";

import { BoardCard, BoardCardSkeleton } from "../components/board-card";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { GhostIcon, PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { ErrorState } from "@/components/error-state";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { toast } from "@/components/ui/toast";

import { useTRPC } from "@/trpc/client";

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

  const createBoard = useMutation(
    trpc.boards.create.mutationOptions({
      onSuccess: async ({ id }) => {
        router.push(`/board/${id}`);
        await queryClient.invalidateQueries(trpc.boards.list.queryOptions());
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
            <BoardCard key={board.id} data={board} />
          ))}
        </div>
      )}
    </div>
  );
}
