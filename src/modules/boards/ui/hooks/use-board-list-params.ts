import { parseAsInteger, parseAsStringLiteral, useQueryStates } from "nuqs";

import { DEFAULT_PAGE_SIZE, PAGE_SIZE_VALUES } from "@/modules/boards/lib/pagination";

const boardListParams = {
  page: parseAsInteger.withDefault(1).withOptions({ clearOnDefault: true }),
  size: parseAsStringLiteral(PAGE_SIZE_VALUES)
    .withDefault(DEFAULT_PAGE_SIZE)
    .withOptions({ clearOnDefault: true }),
};

export function useBoardListParams() {
  return useQueryStates(boardListParams, { shallow: true });
}
