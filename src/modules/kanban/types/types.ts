import { inferRouterOutputs } from "@trpc/server";

import type { AppRouter } from "@/trpc/routers/_app";

export type kanbanListOutput = inferRouterOutputs<AppRouter>["kanban"]["list"];
export type kanbanListItem = kanbanListOutput["items"][number];
export type kanbanGetOutput = inferRouterOutputs<AppRouter>["kanban"]["get"];
export type kanbanColumn = kanbanGetOutput["columns"][number];
export type kanbanCard = kanbanColumn["cards"][number];
