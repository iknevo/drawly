import { inferRouterOutputs } from "@trpc/server";

import type { AppRouter } from "@/trpc/routers/_app";

export type docsListOutput = inferRouterOutputs<AppRouter>["docs"]["list"];
export type docsListItem = docsListOutput["items"][number];
export type docGetOutput = inferRouterOutputs<AppRouter>["docs"]["get"];
