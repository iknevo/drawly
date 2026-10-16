import { arrayMove } from "@dnd-kit/sortable";

import type { kanbanCard, kanbanColumn } from "@/modules/kanban/types/types";

export function findCardById(columns: kanbanColumn[], cardId: string): kanbanCard | null {
  for (const column of columns) {
    const card = column.cards.find((item) => item.id === cardId);
    if (card) return card;
  }
  return null;
}

export function findCardLocation(
  columns: kanbanColumn[],
  cardId: string
): { columnId: string; index: number; card: kanbanCard } | null {
  for (const column of columns) {
    const index = column.cards.findIndex((item) => item.id === cardId);
    if (index !== -1) {
      return { columnId: column.id, index, card: column.cards[index] };
    }
  }
  return null;
}

export function toIdColumns(columns: kanbanColumn[]) {
  return columns.map((column) => ({
    columnId: column.id,
    cardIds: column.cards.map((card) => card.id),
  }));
}

export function cloneColumns(columns: kanbanColumn[]): kanbanColumn[] {
  return columns.map((column) => ({ ...column, cards: [...column.cards] }));
}

export function crossColumnMove(
  columns: kanbanColumn[],
  activeId: string,
  overId: string
): kanbanColumn[] {
  const fromColumnIndex = columns.findIndex((column) =>
    column.cards.some((card) => card.id === activeId)
  );
  if (fromColumnIndex === -1) return columns;

  let toColumnIndex = columns.findIndex((column) => column.id === overId);
  let toCardIndex = -1;

  if (toColumnIndex === -1) {
    toColumnIndex = columns.findIndex((column) => column.cards.some((card) => card.id === overId));
    if (toColumnIndex === -1) return columns;
    toCardIndex = columns[toColumnIndex].cards.findIndex((card) => card.id === overId);
  }

  if (fromColumnIndex === toColumnIndex) return columns;

  const next = cloneColumns(columns);
  const fromCardIndex = next[fromColumnIndex].cards.findIndex((card) => card.id === activeId);
  const [moved] = next[fromColumnIndex].cards.splice(fromCardIndex, 1);
  const insertAt = toCardIndex === -1 ? next[toColumnIndex].cards.length : toCardIndex;
  next[toColumnIndex].cards.splice(insertAt, 0, moved);

  return next;
}

export function finalizeDrop(
  columns: kanbanColumn[],
  activeId: string,
  overId: string
): kanbanColumn[] {
  const activeColumnIndex = columns.findIndex((column) =>
    column.cards.some((card) => card.id === activeId)
  );
  if (activeColumnIndex === -1) return columns;

  const activeCardIndex = columns[activeColumnIndex].cards.findIndex(
    (card) => card.id === activeId
  );

  const overColumnIndex = columns.findIndex((column) => column.id === overId);
  if (overColumnIndex !== -1) {
    if (overColumnIndex !== activeColumnIndex) return columns;

    const lastIndex = columns[activeColumnIndex].cards.length - 1;
    if (activeCardIndex === lastIndex) return columns;

    const next = cloneColumns(columns);
    const [moved] = next[activeColumnIndex].cards.splice(activeCardIndex, 1);
    next[activeColumnIndex].cards.push(moved);
    return next;
  }

  const overCardColumnIndex = columns.findIndex((column) =>
    column.cards.some((card) => card.id === overId)
  );

  if (overCardColumnIndex !== activeColumnIndex) return columns;

  const newIndex = columns[activeColumnIndex].cards.findIndex((card) => card.id === overId);
  if (activeCardIndex === newIndex) return columns;

  const next = cloneColumns(columns);
  next[activeColumnIndex].cards = arrayMove(
    next[activeColumnIndex].cards,
    activeCardIndex,
    newIndex
  );
  return next;
}

export function sameArrangement(a: kanbanColumn[], b: kanbanColumn[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;

  return a.every((column, index) => {
    const other = b[index];
    if (!other || column.id !== other.id || column.cards.length !== other.cards.length) {
      return false;
    }

    return column.cards.every((card, cardIndex) => card.id === other.cards[cardIndex].id);
  });
}
