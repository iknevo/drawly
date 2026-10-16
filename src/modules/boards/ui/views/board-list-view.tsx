"use client";

import { type BoardSort } from "../../lib/list-params";
import { pageHref } from "../../lib/pagination";
import {
  TEMPLATE_CATEGORIES,
  TEMPLATE_DESCRIPTIONS,
  TEMPLATE_LABELS,
  type TemplateId,
} from "../../lib/templates";
import { BoardCard, BoardCardSkeleton } from "../components/board-card";
import { useBoardListParams } from "../hooks/use-board-list-params";
import {
  keepPreviousData,
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { cn } from "cn";
import {
  CalendarDaysIcon,
  Columns3Icon,
  GhostIcon,
  Grid2x2Icon,
  LayoutGridIcon,
  LayoutTemplateIcon,
  ListChecksIcon,
  type LucideIcon,
  MilestoneIcon,
  NetworkIcon,
  NotebookTextIcon,
  PlusIcon,
  Repeat2Icon,
  SearchIcon,
  SquarePenIcon,
  WaypointsIcon,
  WorkflowIcon,
  XIcon,
} from "lucide-react";
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
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
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

import { useTRPC } from "@/trpc/client";

const TEMPLATE_ICONS: Record<TemplateId, LucideIcon> = {
  checklist: ListChecksIcon,
  kanban: Columns3Icon,
  weekly: CalendarDaysIcon,
  roadmap: MilestoneIcon,
  retro: Repeat2Icon,
  eisenhower: Grid2x2Icon,
  swot: LayoutGridIcon,
  mindmap: NetworkIcon,
  flowchart: WorkflowIcon,
  bubblemap: WaypointsIcon,
  cornell: NotebookTextIcon,
  wireframe: LayoutTemplateIcon,
};

function NewBoardMenu({
  size,
  disabled,
  onCreate,
  align = "start",
}: {
  size?: "sm" | "default" | "lg";
  disabled: boolean;
  onCreate: (template?: TemplateId) => void;
  align?: "start" | "center" | "end";
}) {
  return (
    <NavigationMenu align={align} className="flex-none">
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger
            disabled={disabled}
            render={<Button size={size} variant="outline" disabled={disabled} />}
          >
            <PlusIcon />
            New board
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="w-140 p-3">
              <NavigationMenuLink
                closeOnClick
                render={
                  <button type="button" onClick={() => onCreate()} className="w-full gap-2.5" />
                }
              >
                <SquarePenIcon />
                <span className="flex flex-col items-start gap-0.5">
                  <span className="font-medium">Blank board</span>
                  <span className="text-muted-foreground text-xs">Start from an empty canvas</span>
                </span>
              </NavigationMenuLink>

              {TEMPLATE_CATEGORIES.map((category) => (
                <section key={category.id}>
                  <div className="text-muted-foreground px-2 pt-3 pb-1 text-xs font-medium">
                    {category.label}
                  </div>
                  <div className="grid grid-cols-2 gap-0.5">
                    {category.templates.map((id) => {
                      const Icon = TEMPLATE_ICONS[id];
                      return (
                        <NavigationMenuLink
                          key={id}
                          closeOnClick
                          render={
                            <button
                              type="button"
                              onClick={() => onCreate(id)}
                              className="gap-2.5"
                            />
                          }
                        >
                          <Icon />
                          <span className="flex flex-col items-start gap-0.5">
                            <span className="font-medium">{TEMPLATE_LABELS[id]}</span>
                            <span className="text-muted-foreground text-xs">
                              {TEMPLATE_DESCRIPTIONS[id]}
                            </span>
                          </span>
                        </NavigationMenuLink>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}

function BoardsToolbar() {
  const [{ size, q, sort }, setParams] = useBoardListParams();

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
            void setParams({ sort: value as BoardSort, page: 1 });
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

function BoardsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <BoardCardSkeleton key={index} />
      ))}
    </div>
  );
}

export function BoardListView() {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const createBoard = useMutation(
    trpc.boards.create.mutationOptions({
      onSuccess: async ({ id }) => {
        router.push(`/board/${id}`);
        await queryClient.invalidateQueries(trpc.boards.list.queryFilter());
      },
      onError: (error) => toast.add({ type: "error", description: error.message }),
    })
  );

  const handleCreate = (template?: TemplateId) => {
    createBoard.mutate(template ? { template } : {});
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-6 lg:p-10">
      <HeaderActions slot="actions">
        <NewBoardMenu
          size="sm"
          align="end"
          disabled={createBoard.isPending}
          onCreate={handleCreate}
        />
      </HeaderActions>

      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-medium">Your boards</h1>
          <p className="text-muted-foreground text-sm">Sketch ideas on an infinite canvas.</p>
        </div>
      </header>

      <BoardsToolbar />

      <Suspense fallback={<BoardsGridSkeleton />}>
        <ErrorBoundary
          fallbackRender={({ resetErrorBoundary }) => <ErrorState onRetry={resetErrorBoundary} />}
        >
          <BoardsContent onCreate={handleCreate} creating={createBoard.isPending} />
        </ErrorBoundary>
      </Suspense>
    </div>
  );
}

function BoardsContent({
  onCreate,
  creating,
}: {
  onCreate: (template?: TemplateId) => void;
  creating: boolean;
}) {
  const trpc = useTRPC();

  const [{ page, size, q, sort }, setParams] = useBoardListParams();
  const pageSize = Number(size);

  const { data } = useSuspenseQuery(
    trpc.boards.list.queryOptions(
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
            <GhostIcon className="size-10" />
          </EmptyMedia>
          <EmptyTitle>No boards yet</EmptyTitle>
          <EmptyDescription>Create your first board to start drawing.</EmptyDescription>
        </EmptyHeader>
        <NewBoardMenu disabled={creating} onCreate={onCreate} />
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
          <BoardCard key={board.id} data={board} />
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
