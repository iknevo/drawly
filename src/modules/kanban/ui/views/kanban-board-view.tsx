"use client";

import { CardDetailDialog } from "../components/card-detail-dialog";
import { KanbanCardShell } from "../components/kanban-card";
import { KanbanColumn } from "../components/kanban-column";
import {
  crossColumnMove,
  finalizeDrop,
  findCardById,
  findCardLocation,
  sameArrangement,
  toIdColumns,
} from "../lib/dnd";
import {
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "cn";
import { ArrowLeftIcon, MoreHorizontalIcon, SearchIcon, Trash2Icon, XIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { HeaderActions } from "@/components/header-actions";
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

import type { kanbanCard, kanbanColumn } from "@/modules/kanban/types/types";
import { useTRPC } from "@/trpc/client";

const REAL_ID = /^[a-f0-9]{24}$/i;

export function KanbanBoardView({ boardId }: { boardId: string }) {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();

  const board = useQuery(trpc.kanban.get.queryOptions({ id: boardId }));
  const boardKey = trpc.kanban.get.queryKey({ id: boardId });

  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeWidth, setActiveWidth] = useState<number | null>(null);
  const [openCardId, setOpenCardId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const dragSnapshot = useRef<kanbanColumn[] | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const readColumns = (): kanbanColumn[] => queryClient.getQueryData(boardKey)?.columns ?? [];

  const query = search.trim().toLowerCase();
  const searching = query.length > 0;

  const renameBoard = useMutation(
    trpc.kanban.rename.mutationOptions({
      onMutate: async (variables) => {
        await queryClient.cancelQueries({ queryKey: boardKey });
        const previous = queryClient.getQueryData(boardKey);
        queryClient.setQueryData(boardKey, (current) =>
          current ? { ...current, title: variables.title } : current
        );
        return { previous };
      },
      onError: (error, _variables, context) => {
        if (context?.previous) queryClient.setQueryData(boardKey, context.previous);
        toast.add({ type: "error", description: error.message });
      },
      onSettled: async () => {
        await queryClient.invalidateQueries(trpc.kanban.list.queryFilter());
      },
    })
  );

  const removeBoard = useMutation(
    trpc.kanban.remove.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpc.kanban.list.queryFilter());
        router.push("/kanban");
      },
      onError: (error) => toast.add({ type: "error", description: error.message }),
    })
  );

  const createCard = useMutation(
    trpc.kanban.createCard.mutationOptions({
      onMutate: async (variables) => {
        await queryClient.cancelQueries({ queryKey: boardKey });
        const previous = queryClient.getQueryData(boardKey);
        const tempId = `temp-${crypto.randomUUID()}`;
        const tempCard: kanbanCard = {
          id: tempId,
          title: variables.title ?? "New card",
          description: variables.description ?? "",
          dueDate: variables.dueDate ?? null,
        };
        queryClient.setQueryData(boardKey, (current) =>
          current
            ? {
                ...current,
                columns: current.columns.map((column) => {
                  if (column.id !== variables.columnId) return column;

                  const index = variables.index;
                  const cards =
                    index !== undefined && index >= 0 && index <= column.cards.length
                      ? [...column.cards.slice(0, index), tempCard, ...column.cards.slice(index)]
                      : [...column.cards, tempCard];

                  return { ...column, cards };
                }),
              }
            : current
        );
        return { previous, tempId };
      },
      onSuccess: ({ card }, _variables, context) => {
        queryClient.setQueryData(boardKey, (current) => {
          if (!current) return current;
          return {
            ...current,
            columns: current.columns.map((column) => ({
              ...column,
              cards: column.cards.map((item) => (item.id === context?.tempId ? card : item)),
            })),
          };
        });
        setOpenCardId((current) => (current === context?.tempId ? card.id : current));
      },
      onError: (error, _variables, context) => {
        if (context?.previous) queryClient.setQueryData(boardKey, context.previous);
        setOpenCardId((current) => (current === context?.tempId ? null : current));
        toast.add({ type: "error", description: error.message });
      },
      onSettled: async () => {
        await queryClient.invalidateQueries(trpc.kanban.list.queryFilter());
      },
    })
  );

  const updateCard = useMutation(
    trpc.kanban.updateCard.mutationOptions({
      onMutate: async (variables) => {
        await queryClient.cancelQueries({ queryKey: boardKey });
        const previous = queryClient.getQueryData(boardKey);
        queryClient.setQueryData(boardKey, (current) =>
          current
            ? {
                ...current,
                columns: current.columns.map((column) => ({
                  ...column,
                  cards: column.cards.map((item) =>
                    item.id === variables.cardId
                      ? {
                          ...item,
                          ...(variables.title !== undefined ? { title: variables.title } : {}),
                          ...(variables.description !== undefined
                            ? { description: variables.description }
                            : {}),
                          ...(variables.dueDate !== undefined
                            ? { dueDate: variables.dueDate }
                            : {}),
                        }
                      : item
                  ),
                })),
              }
            : current
        );
        return { previous };
      },
      onError: (error, _variables, context) => {
        if (context?.previous) queryClient.setQueryData(boardKey, context.previous);
        toast.add({ type: "error", description: error.message });
      },
      onSettled: async () => {
        await queryClient.invalidateQueries(trpc.kanban.list.queryFilter());
      },
    })
  );

  const deleteCard = useMutation(
    trpc.kanban.deleteCard.mutationOptions({
      onMutate: async (variables) => {
        await queryClient.cancelQueries({ queryKey: boardKey });
        const previous = queryClient.getQueryData(boardKey);
        const location = findCardLocation(readColumns(), variables.cardId);
        queryClient.setQueryData(boardKey, (current) =>
          current
            ? {
                ...current,
                columns: current.columns.map((column) => ({
                  ...column,
                  cards: column.cards.filter((item) => item.id !== variables.cardId),
                })),
              }
            : current
        );
        return { previous, location };
      },
      onSuccess: (_data, _variables, context) => {
        const location = context?.location;
        if (!location) return;

        let toastId = "";
        toastId = toast.add({
          type: "success",
          description: "Card deleted",
          actionProps: {
            children: "Undo",
            onClick: () => {
              toast.close(toastId);
              createCard.mutate({
                id: boardId,
                columnId: location.columnId,
                title: location.card.title,
                description: location.card.description,
                dueDate: location.card.dueDate,
                index: location.index,
              });
            },
          },
        });
      },
      onError: (error, _variables, context) => {
        if (context?.previous) queryClient.setQueryData(boardKey, context.previous);
        toast.add({ type: "error", description: error.message });
      },
      onSettled: async () => {
        await queryClient.invalidateQueries(trpc.kanban.list.queryFilter());
      },
    })
  );

  const reorderCards = useMutation(
    trpc.kanban.reorderCards.mutationOptions({
      onMutate: async (variables) => {
        await queryClient.cancelQueries({ queryKey: boardKey });
        const previous = queryClient.getQueryData(boardKey);
        queryClient.setQueryData(boardKey, (current) => {
          if (!current) return current;
          const byId = new Map(
            current.columns.flatMap((column) => column.cards).map((card) => [card.id, card])
          );
          return {
            ...current,
            columns: current.columns.map((column) => {
              const incoming = variables.columns.find((item) => item.columnId === column.id);
              if (!incoming) return column;
              return {
                ...column,
                cards: incoming.cardIds
                  .map((cardId) => byId.get(cardId))
                  .filter((card): card is kanbanCard => Boolean(card)),
              };
            }),
          };
        });
        return { previous };
      },
      onSuccess: ({ columns }) => {
        queryClient.setQueryData(boardKey, (current) =>
          current ? { ...current, columns } : current
        );
      },
      onError: (error) => {
        toast.add({ type: "error", description: error.message });
        void queryClient.invalidateQueries({ queryKey: boardKey });
      },
      onSettled: async () => {
        await queryClient.invalidateQueries(trpc.kanban.list.queryFilter());
      },
    })
  );

  function restoreSnapshot(snapshot: kanbanColumn[] | null) {
    dragSnapshot.current = null;
    if (snapshot) {
      queryClient.setQueryData(boardKey, (current) =>
        current ? { ...current, columns: snapshot } : current
      );
    }
  }

  function handleDragStart(event: DragStartEvent) {
    if (searching) return;
    const id = String(event.active.id);
    const node = document.querySelector<HTMLElement>(`[data-card-id="${id}"]`);
    setActiveWidth(node ? node.getBoundingClientRect().width : null);
    dragSnapshot.current = readColumns();
    setActiveId(id);
  }

  function handleDragOver(event: DragOverEvent) {
    if (searching) return;
    const { active, over } = event;
    if (!over) return;
    const activeCardId = String(active.id);
    const overId = String(over.id);
    if (activeCardId === overId) return;

    queryClient.setQueryData(boardKey, (current) => {
      if (!current) return current;
      const next = crossColumnMove(current.columns, activeCardId, overId);
      return next === current.columns ? current : { ...current, columns: next };
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    if (searching) {
      setActiveId(null);
      setActiveWidth(null);
      dragSnapshot.current = null;
      return;
    }

    const { active, over } = event;
    setActiveId(null);
    setActiveWidth(null);

    const snapshot = dragSnapshot.current;
    dragSnapshot.current = null;

    if (!over) {
      restoreSnapshot(snapshot);
      return;
    }

    const activeCardId = String(active.id);
    const overId = String(over.id);
    const current = readColumns();
    const next = finalizeDrop(crossColumnMove(current, activeCardId, overId), activeCardId, overId);

    if (snapshot ? sameArrangement(next, snapshot) : next === current) return;

    queryClient.setQueryData(boardKey, (value) => (value ? { ...value, columns: next } : value));

    reorderCards.mutate({
      id: boardId,
      columns: toIdColumns(next).map((column) => ({
        columnId: column.columnId,
        cardIds: column.cardIds.filter((cardId) => REAL_ID.test(cardId)),
      })),
    });
  }

  function handleDragCancel() {
    const snapshot = dragSnapshot.current;
    setActiveId(null);
    setActiveWidth(null);
    restoreSnapshot(snapshot);
  }

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

  if (board.isPending) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <span className="border-muted border-t-foreground size-6 animate-spin rounded-full border-2" />
      </div>
    );
  }

  if (board.isError) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground text-sm">{board.error.message}</p>
        <Link href="/kanban" className={buttonVariants({ variant: "outline" })}>
          Back to kanban
        </Link>
      </div>
    );
  }

  const data = board.data;
  const columns = data.columns;
  const activeCard = activeId ? findCardById(columns, activeId) : null;
  const openCard = openCardId ? findCardById(columns, openCardId) : null;

  const displayColumns = searching
    ? columns.map((column) => ({
        ...column,
        cards: column.cards.filter(
          (card) =>
            card.title.toLowerCase().includes(query) ||
            card.description.toLowerCase().includes(query)
        ),
      }))
    : columns;
  const visibleCards = displayColumns.reduce((total, column) => total + column.cards.length, 0);
  const totalCards = columns.reduce((total, column) => total + column.cards.length, 0);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <HeaderActions slot="title">
        <Link
          href="/kanban"
          className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
          aria-label="Back to kanban"
        >
          <ArrowLeftIcon />
        </Link>

        {editing ? (
          <div className="flex min-w-0 items-center">
            <Label htmlFor="kanban-title" className="sr-only">
              Board title
            </Label>
            <Input
              id="kanban-title"
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
      </HeaderActions>

      <HeaderActions slot="actions">
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
      </HeaderActions>

      <div className="flex items-center gap-3 border-b px-3 py-2">
        <div className="relative w-full max-w-xs">
          <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search cards…"
            aria-label="Search cards"
            className="pl-8"
          />
          {search.length > 0 ? (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2"
            >
              <XIcon className="size-4" />
            </button>
          ) : null}
        </div>
        {searching ? (
          <span className="text-muted-foreground text-xs">
            {visibleCards} of {totalCards} {totalCards === 1 ? "card" : "cards"}
          </span>
        ) : null}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div
          className={cn("flex min-h-0 flex-1 overflow-x-auto p-4", activeId && "cursor-grabbing")}
        >
          <div className="mx-auto flex w-full max-w-6xl items-stretch gap-4">
            {displayColumns.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                creating={createCard.isPending}
                disabled={searching}
                searching={searching}
                onOpenCard={(card) => setOpenCardId(card.id)}
                onCreateCard={(columnId, title) =>
                  createCard.mutate({ id: boardId, columnId, title })
                }
              />
            ))}
          </div>
        </div>

        <DragOverlay>
          {activeCard ? (
            <div style={{ width: activeWidth ?? undefined }}>
              <KanbanCardShell card={activeCard} className="shadow-lg" />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <CardDetailDialog
        key={openCardId ?? "none"}
        card={openCard}
        open={openCardId !== null}
        saving={updateCard.isPending}
        onOpenChange={(open) => {
          if (!open) setOpenCardId(null);
        }}
        onSave={(card) =>
          updateCard.mutateAsync({
            id: boardId,
            cardId: card.id,
            title: card.title,
            description: card.description,
            dueDate: card.dueDate,
          })
        }
        onDelete={(cardId) => deleteCard.mutate({ id: boardId, cardId })}
      />

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
              onClick={() => removeBoard.mutate({ id: boardId })}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
