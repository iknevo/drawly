import { type SearchParams } from "nuqs/server";

import { auth } from "@/lib/auth";

import { loadKanbanListParams } from "@/modules/kanban/server/search-params";
import { KanbanListView } from "@/modules/kanban/ui/views/kanban-list-view";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Kanban",
  description: "Plan and track work across to-do, in-progress, and done.",
};

export default async function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await auth.protect({ role: "user", redirectTo: "/kanban" });

  const { page, size, q, sort } = loadKanbanListParams(await searchParams);

  prefetch(trpc.kanban.list.queryOptions({ page, pageSize: Number(size), q, sort }));

  return (
    <HydrateClient>
      <KanbanListView />
    </HydrateClient>
  );
}
