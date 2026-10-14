import { inferRouterOutputs } from "@trpc/server";

import type { AppRouter } from "@/trpc/routers/_app";

export type boardsListOutput = inferRouterOutputs<AppRouter>["boards"]["list"];
export type boardGetOutput = inferRouterOutputs<AppRouter>["boards"]["get"];
