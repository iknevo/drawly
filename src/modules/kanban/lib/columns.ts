export function defaultKanbanColumns() {
  return [
    { id: "todo", title: "To do", cards: [] },
    { id: "in-progress", title: "In progress", cards: [] },
    { id: "done", title: "Done", cards: [] },
  ];
}
