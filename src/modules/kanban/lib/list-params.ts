import { DEFAULT_PAGE_SIZE, PAGE_SIZE_VALUES } from "@/modules/kanban/lib/pagination";

export const KANBAN_SORT_VALUES = ["updated", "created", "title"] as const;

export type KanbanSort = (typeof KANBAN_SORT_VALUES)[number];

export const DEFAULT_SORT: KanbanSort = "updated";

type ParserBuilders = Pick<
  typeof import("nuqs/server"),
  "parseAsInteger" | "parseAsString" | "parseAsStringLiteral"
>;

export function createKanbanListParams(parsers: ParserBuilders) {
  return {
    page: parsers.parseAsInteger.withDefault(1).withOptions({ clearOnDefault: true }),
    size: parsers
      .parseAsStringLiteral(PAGE_SIZE_VALUES)
      .withDefault(DEFAULT_PAGE_SIZE)
      .withOptions({ clearOnDefault: true }),
    q: parsers.parseAsString.withDefault("").withOptions({ clearOnDefault: true }),
    sort: parsers
      .parseAsStringLiteral(KANBAN_SORT_VALUES)
      .withDefault(DEFAULT_SORT)
      .withOptions({ clearOnDefault: true }),
  };
}
