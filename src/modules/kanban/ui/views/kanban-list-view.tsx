"use client";

import { KanbanBoardCard, KanbanBoardCardSkeleton } from "../components/kanban-board-card";
import { KanbanToolbar } from "../components/kanban-toolbar";
import {
  keepPreviousData,
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { KanbanIcon, PlusIcon, SearchIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Suspense, useEffect } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { getPageItems, getTotalPages } from "@/lib/pagination";
import { cn } from "@/lib/utils";

import { ErrorState } from "@/components/error-state";
import { SectionHeader } from "@/components/section-header";
import { useSound } from "@/components/sound-provider";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { toast } from "@/components/ui/toast";

import { pageHref } from "@/modules/kanban/lib/pagination";
import { useKanbanListParams } from "@/modules/kanban/ui/hooks/use-kanban-list-params";
import { useTRPC } from "@/trpc/client";

function KanbanListViewSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <KanbanBoardCardSkeleton key={index} />
      ))}
    </div>
  );
}

export function KanbanListView() {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { play } = useSound();

  const createBoard = useMutation(
    trpc.kanban.create.mutationOptions({
      onSuccess: async ({ id }) => {
        play("add");
        router.push(`/kanban/${id}`);
        await queryClient.invalidateQueries(trpc.kanban.list.queryFilter());
      },
      onError: (error) => toast.add({ type: "error", description: error.message }),
    })
  );

  const handleCreate = () => {
    createBoard.mutate({});
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-6 lg:p-10">
      <SectionHeader title="Kanban" description="Plan work across to-do, in-progress, and done.">
        <Button size="sm" variant="default" disabled={createBoard.isPending} onClick={handleCreate}>
          <PlusIcon />
          New board
        </Button>
      </SectionHeader>

      <KanbanToolbar />

      <Suspense fallback={<KanbanListViewSkeleton />}>
        <ErrorBoundary
          fallbackRender={({ resetErrorBoundary }) => <ErrorState onRetry={resetErrorBoundary} />}
        >
          <KanbanListViewSuspense onCreate={handleCreate} creating={createBoard.isPending} />
        </ErrorBoundary>
      </Suspense>
    </div>
  );
}

function KanbanListViewSuspense({
  onCreate,
  creating,
}: {
  onCreate: () => void;
  creating: boolean;
}) {
  const trpc = useTRPC();

  const [{ page, size, q, sort }, setParams] = useKanbanListParams();
  const pageSize = Number(size);

  const { data } = useSuspenseQuery(
    trpc.kanban.list.queryOptions(
      { page, pageSize, q, sort },
      { placeholderData: keepPreviousData }
    )
  );

  const { items, total } = data;
  const totalPages = getTotalPages(total, pageSize);
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);
  const searching = q.trim().length > 0;
  const filters = { q, sort };

  useEffect(() => {
    if (total > 0 && page > totalPages) {
      void setParams({ page: totalPages }, { history: "replace" });
    }
  }, [page, total, totalPages, setParams]);

  const goToPage = (next: number) => {
    void setParams({ page: next });
  };

  const clearSearch = () => {
    void setParams({ q: "", page: 1 });
  };

  if (total === 0 && !searching) {
    return (
      <Empty className="py-20">
        <EmptyHeader>
          <EmptyMedia>
            <KanbanIcon className="size-10" />
          </EmptyMedia>
          <EmptyTitle>No boards yet</EmptyTitle>
          <EmptyDescription>Create your first kanban board to get started.</EmptyDescription>
        </EmptyHeader>
        <Button disabled={creating} onClick={onCreate}>
          <PlusIcon />
          New board
        </Button>
      </Empty>
    );
  }

  if (total === 0) {
    return (
      <Empty className="py-20">
        <EmptyHeader>
          <EmptyMedia>
            <SearchIcon className="size-10" />
          </EmptyMedia>
          <EmptyTitle>No boards match &ldquo;{q}&rdquo;</EmptyTitle>
          <EmptyDescription>Try a different search term.</EmptyDescription>
        </EmptyHeader>
        <Button variant="outline" onClick={clearSearch}>
          Clear search
        </Button>
      </Empty>
    );
  }

  return (
    <>
      <p className="text-muted-foreground text-sm">
        Showing {rangeStart}&ndash;{rangeEnd} of {total} {total === 1 ? "board" : "boards"}
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((board) => (
          <KanbanBoardCard key={board.id} data={board} />
        ))}
      </div>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href={pageHref(page - 1, size, filters)}
                aria-disabled={page <= 1}
                className={cn(page <= 1 && "pointer-events-none opacity-50")}
                onClick={(event) => {
                  event.preventDefault();
                  if (page > 1) goToPage(page - 1);
                }}
              />
            </PaginationItem>

            {getPageItems(page, totalPages).map((item, index) =>
              typeof item === "number" ? (
                <PaginationItem key={item}>
                  <PaginationLink
                    href={pageHref(item, size, filters)}
                    isActive={item === page}
                    onClick={(event) => {
                      event.preventDefault();
                      goToPage(item);
                    }}
                  >
                    {item}
                  </PaginationLink>
                </PaginationItem>
              ) : (
                <PaginationItem key={`${item}-${index}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              )
            )}

            <PaginationItem>
              <PaginationNext
                href={pageHref(page + 1, size, filters)}
                aria-disabled={page >= totalPages}
                className={cn(page >= totalPages && "pointer-events-none opacity-50")}
                onClick={(event) => {
                  event.preventDefault();
                  if (page < totalPages) goToPage(page + 1);
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </>
  );
}
