import { parseAsInteger, parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";

import { createKanbanListParams } from "@/modules/kanban/lib/list-params";

const kanbanListParams = createKanbanListParams({
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
});

export function useKanbanListParams() {
  return useQueryStates(kanbanListParams, { shallow: true });
}
