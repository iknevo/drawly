import { inferRouterOutputs } from "@trpc/server";

import type { AppRouter } from "@/trpc/routers/_app";

export type sessionsListOutput = inferRouterOutputs<AppRouter>["sessions"]["list"];
export type sessionsListItem = sessionsListOutput["items"][number];
export type sessionGetOutput = inferRouterOutputs<AppRouter>["sessions"]["get"];
export type sessionStatsOutput = inferRouterOutputs<AppRouter>["sessions"]["stats"];
