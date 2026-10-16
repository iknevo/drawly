"use client";

import { KanbanBoardCard, KanbanBoardCardSkeleton } from "../components/kanban-board-card";
import {
  keepPreviousData,
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { cn } from "cn";
import { KanbanIcon, PlusIcon, SearchIcon, XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { PAGE_SIZE_VALUES, type PageSize, getPageItems, getTotalPages } from "@/lib/pagination";

import { ErrorState } from "@/components/error-state";
import { HeaderActions } from "@/components/header-actions";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toast";

import type { KanbanSort } from "@/modules/kanban/lib/list-params";
import { pageHref } from "@/modules/kanban/lib/pagination";
import { useKanbanListParams } from "@/modules/kanban/ui/hooks/use-kanban-list-params";
import { useTRPC } from "@/trpc/client";

function KanbanToolbar() {
  const [{ size, q, sort }, setParams] = useKanbanListParams();

  const [search, setSearch] = useState(q);
  const [syncedQ, setSyncedQ] = useState(q);

  if (q !== syncedQ) {
    setSyncedQ(q);
    setSearch(q);
  }

  useEffect(() => {
    if (search === q) return;
    const timer = setTimeout(() => {
      void setParams({ q: search.trim(), page: 1 });
    }, 300);
    return () => clearTimeout(timer);
  }, [search, q, setParams]);

  const clearSearch = () => {
    setSearch("");
    void setParams({ q: "", page: 1 });
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="relative w-full max-w-xs">
        <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search boards…"
          aria-label="Search boards"
          className="pl-8"
        />
        {search.length > 0 && (
          <button
            type="button"
            onClick={clearSearch}
            aria-label="Clear search"
            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2"
          >
            <XIcon className="size-4" />
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground text-sm">Sort</span>
        <Select
          value={sort}
          onValueChange={(value) => {
            void setParams({ sort: value as KanbanSort, page: 1 });
          }}
        >
          <SelectTrigger size="sm" aria-label="Sort boards">
            <SelectValue />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false} align="end">
            <SelectItem value="updated">Last edited</SelectItem>
            <SelectItem value="created">Recently created</SelectItem>
            <SelectItem value="title">Title (A–Z)</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-muted-foreground text-sm">Per page</span>
        <Select
          value={size}
          onValueChange={(value) => {
            void setParams({ size: value as PageSize, page: 1 });
          }}
        >
          <SelectTrigger size="sm" aria-label="Boards per page">
            <SelectValue />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false} align="end">
            {PAGE_SIZE_VALUES.map((value) => (
              <SelectItem key={value} value={value}>
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function KanbanGridSkeleton() {
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

  const createBoard = useMutation(
    trpc.kanban.create.mutationOptions({
      onSuccess: async ({ id }) => {
        await queryClient.invalidateQueries(trpc.kanban.list.queryFilter());
        router.push(`/kanban/${id}`);
      },
      onError: (error) => toast.add({ type: "error", description: error.message }),
    })
  );

  const handleCreate = () => {
    createBoard.mutate({});
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-6 lg:p-10">
      <HeaderActions slot="actions">
        <Button size="sm" variant="outline" disabled={createBoard.isPending} onClick={handleCreate}>
          <PlusIcon />
          New board
        </Button>
      </HeaderActions>

      <header>
        <h1 className="text-3xl font-medium">Kanban</h1>
        <p className="text-muted-foreground text-sm">
          Plan work across to-do, in-progress, and done.
        </p>
      </header>

      <KanbanToolbar />

      <Suspense fallback={<KanbanGridSkeleton />}>
        <ErrorBoundary
          fallbackRender={({ resetErrorBoundary }) => <ErrorState onRetry={resetErrorBoundary} />}
        >
          <KanbanListContent onCreate={handleCreate} creating={createBoard.isPending} />
        </ErrorBoundary>
      </Suspense>
    </div>
  );
}

function KanbanListContent({ onCreate, creating }: { onCreate: () => void; creating: boolean }) {
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
