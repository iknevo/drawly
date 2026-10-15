import { createLoader, parseAsInteger, parseAsString, parseAsStringLiteral } from "nuqs/server";

import { createBoardListParams } from "@/modules/boards/lib/list-params";

export const boardListParams = createBoardListParams({
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
});

export const loadBoardListParams = createLoader(boardListParams);
