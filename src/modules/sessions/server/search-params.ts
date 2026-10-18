import { createLoader, parseAsInteger, parseAsString, parseAsStringLiteral } from "nuqs/server";

import { createSessionListParams } from "@/modules/sessions/lib/list-params";

export const sessionListParams = createSessionListParams({
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
});

export const loadSessionListParams = createLoader(sessionListParams);
