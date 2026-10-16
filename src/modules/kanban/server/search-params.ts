import { createLoader, parseAsInteger, parseAsString, parseAsStringLiteral } from "nuqs/server";

import { createKanbanListParams } from "@/modules/kanban/lib/list-params";

export const kanbanListParams = createKanbanListParams({
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
});

export const loadKanbanListParams = createLoader(kanbanListParams);
