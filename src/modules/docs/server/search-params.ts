import { createLoader, parseAsInteger, parseAsString, parseAsStringLiteral } from "nuqs/server";

import { createDocListParams } from "@/modules/docs/lib/list-params";

export const docListParams = createDocListParams({
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
});

export const loadDocListParams = createLoader(docListParams);
