import { parseAsInteger, parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";

import { createSessionListParams } from "@/modules/sessions/lib/list-params";

const sessionListParams = createSessionListParams({
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
});

export function useSessionListParams() {
  return useQueryStates(sessionListParams, { shallow: true });
}
