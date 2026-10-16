import { parseAsInteger, parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";

import { createDocListParams } from "@/modules/docs/lib/list-params";

const docListParams = createDocListParams({
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
});

export function useDocListParams() {
  return useQueryStates(docListParams, { shallow: true });
}
