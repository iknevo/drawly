import { parseAsInteger, parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";

import { createBoardListParams } from "@/modules/boards/lib/list-params";

const boardListParams = createBoardListParams({
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
});

export function useBoardListParams() {
  return useQueryStates(boardListParams, { shallow: true });
}
