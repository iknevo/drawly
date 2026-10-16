type KanbanStatusStyle = {
  dot: string;
  badge: string;
};

const STATUS_STYLES: Record<string, KanbanStatusStyle> = {
  todo: {
    dot: "bg-muted-foreground/50",
    badge: "bg-muted text-muted-foreground ring-foreground/10",
  },
  "in-progress": {
    dot: "bg-amber-500",
    badge: "bg-amber-500/15 text-amber-700 ring-amber-500/30 dark:text-amber-400",
  },
  done: {
    dot: "bg-emerald-500",
    badge: "bg-emerald-500/15 text-emerald-700 ring-emerald-500/30 dark:text-emerald-400",
  },
};

const FALLBACK: KanbanStatusStyle = STATUS_STYLES.todo;

export function getColumnStatusStyle(columnId: string): KanbanStatusStyle {
  return STATUS_STYLES[columnId] ?? FALLBACK;
}
