export const KANBAN_COLUMN_IDS = ["todo", "in-progress", "done"] as const;

export type KanbanColumnId = (typeof KANBAN_COLUMN_IDS)[number];

export function defaultKanbanColumns() {
  return [
    { id: "todo", title: "To do", cards: [] },
    { id: "in-progress", title: "In progress", cards: [] },
    { id: "done", title: "Done", cards: [] },
  ];
}
