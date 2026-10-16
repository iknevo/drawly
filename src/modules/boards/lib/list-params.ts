import { DEFAULT_PAGE_SIZE, PAGE_SIZE_VALUES } from "@/lib/pagination";

export const SORT_VALUES = ["updated", "created", "title"] as const;

export type BoardSort = (typeof SORT_VALUES)[number];

export const DEFAULT_SORT: BoardSort = "updated";

type ParserBuilders = Pick<
  typeof import("nuqs/server"),
  "parseAsInteger" | "parseAsString" | "parseAsStringLiteral"
>;

export function createBoardListParams(parsers: ParserBuilders) {
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
  };
}
