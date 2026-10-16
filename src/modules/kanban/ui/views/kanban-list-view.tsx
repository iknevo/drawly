"use client";

import { KanbanBoardCard, KanbanBoardCardSkeleton } from "../components/kanban-board-card";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { KanbanIcon, PlusIcon, SearchIcon, XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toast";

import type { KANBAN_SORT_VALUES } from "@/modules/kanban/validation";
import { useTRPC } from "@/trpc/client";

type KanbanSort = (typeof KANBAN_SORT_VALUES)[number];

export function KanbanListView() {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<KanbanSort>("updated");

  useEffect(() => {
    if (search === query) return;
    const timer = setTimeout(() => setQuery(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search, query]);

  const boards = useQuery(
    trpc.kanban.list.queryOptions({ q: query, sort }, { placeholderData: keepPreviousData })
  );

  const createBoard = useMutation(
    trpc.kanban.create.mutationOptions({
      onSuccess: async ({ id }) => {
        await queryClient.invalidateQueries(trpc.kanban.list.queryFilter());
        router.push(`/kanban/${id}`);
      },
      onError: (error) => toast.add({ type: "error", description: error.message }),
    })
  );

  const items = boards.data?.items ?? [];
  const total = boards.data?.total ?? 0;
  const searching = query.length > 0;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-6 lg:p-10">
      <HeaderActions slot="actions">
        <Button
          size="sm"
          variant="outline"
          disabled={createBoard.isPending}
          onClick={() => createBoard.mutate({})}
        >
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
              onClick={() => {
                setSearch("");
                setQuery("");
              }}
              aria-label="Clear search"
              className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2"
            >
              <XIcon className="size-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm">Sort</span>
          <Select value={sort} onValueChange={(value) => setSort(value as KanbanSort)}>
            <SelectTrigger size="sm" aria-label="Sort boards">
              <SelectValue />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false} align="end">
              <SelectItem value="updated">Last edited</SelectItem>
              <SelectItem value="created">Recently created</SelectItem>
              <SelectItem value="title">Title (A–Z)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {boards.isPending ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <KanbanBoardCardSkeleton key={index} />
          ))}
        </div>
      ) : boards.isError ? (
        <div className="flex flex-col items-center gap-4 py-20">
          <p className="text-muted-foreground text-sm">{boards.error.message}</p>
          <Button variant="outline" onClick={() => boards.refetch()}>
            Try again
          </Button>
        </div>
      ) : total === 0 && !searching ? (
        <Empty className="py-20">
          <EmptyHeader>
            <EmptyMedia>
              <KanbanIcon className="size-10" />
            </EmptyMedia>
            <EmptyTitle>No boards yet</EmptyTitle>
            <EmptyDescription>Create your first kanban board to get started.</EmptyDescription>
          </EmptyHeader>
          <Button disabled={createBoard.isPending} onClick={() => createBoard.mutate({})}>
            <PlusIcon />
            New board
          </Button>
        </Empty>
      ) : total === 0 ? (
        <Empty className="py-20">
          <EmptyHeader>
            <EmptyMedia>
              <SearchIcon className="size-10" />
            </EmptyMedia>
            <EmptyTitle>No boards match &ldquo;{query}&rdquo;</EmptyTitle>
            <EmptyDescription>Try a different search term.</EmptyDescription>
          </EmptyHeader>
          <Button
            variant="outline"
            onClick={() => {
              setSearch("");
              setQuery("");
            }}
          >
            Clear search
          </Button>
        </Empty>
      ) : (
        <>
          <p className="text-muted-foreground text-sm">
            {total} {total === 1 ? "board" : "boards"}
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((board) => (
              <KanbanBoardCard key={board.id} data={board} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
