import { DEFAULT_PAGE_SIZE, PAGE_SIZE_VALUES } from "@/lib/pagination";

export const SORT_VALUES = ["updated", "created"] as const;

export type SessionSort = (typeof SORT_VALUES)[number];

export const DEFAULT_SORT: SessionSort = "updated";

export const TYPE_FILTER_VALUES = ["all", "timer", "pomodoro"] as const;

export type SessionTypeFilter = (typeof TYPE_FILTER_VALUES)[number];

export const STATUS_FILTER_VALUES = ["all", "ongoing", "completed"] as const;

export type SessionStatusFilter = (typeof STATUS_FILTER_VALUES)[number];

type ParserBuilders = Pick<
  typeof import("nuqs/server"),
  "parseAsInteger" | "parseAsString" | "parseAsStringLiteral"
>;

export function createSessionListParams(parsers: ParserBuilders) {
  return {
    page: parsers.parseAsInteger.withDefault(1).withOptions({ clearOnDefault: true }),
    size: parsers
      .parseAsStringLiteral(PAGE_SIZE_VALUES)
      .withDefault(DEFAULT_PAGE_SIZE)
      .withOptions({ clearOnDefault: true }),
    q: parsers.parseAsString.withDefault("").withOptions({ clearOnDefault: true }),
    sort: parsers
      .parseAsStringLiteral(SORT_VALUES)
      .withDefault(DEFAULT_SORT)
      .withOptions({ clearOnDefault: true }),
    type: parsers
      .parseAsStringLiteral(TYPE_FILTER_VALUES)
      .withDefault("all")
      .withOptions({ clearOnDefault: true }),
    status: parsers
      .parseAsStringLiteral(STATUS_FILTER_VALUES)
      .withDefault("all")
      .withOptions({ clearOnDefault: true }),
  };
}
