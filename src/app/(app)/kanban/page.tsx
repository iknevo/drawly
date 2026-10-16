import { auth } from "@/lib/auth";

import { KanbanListView } from "@/modules/kanban/ui/views/kanban-list-view";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Kanban",
};

export default async function Page() {
  await auth.protect({ role: "user", redirectTo: "/kanban" });

  prefetch(trpc.kanban.list.queryOptions({ q: "", sort: "updated" }));

  return (
    <HydrateClient>
      <KanbanListView />
    </HydrateClient>
  );
}
