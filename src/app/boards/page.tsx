import { auth } from "@/lib/auth";

import { BoardListView } from "@/modules/boards/ui/views/board-list-view";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Boards",
};

export default async function Page() {
  await auth.protect({ role: "user" });

  prefetch(trpc.boards.list.queryOptions());

  return (
    <HydrateClient>
      <BoardListView />
    </HydrateClient>
  );
}
