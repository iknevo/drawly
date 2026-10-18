import { type SearchParams } from "nuqs/server";

import { auth } from "@/lib/auth";

import { loadBoardListParams } from "@/modules/boards/server/search-params";
import { BoardListView } from "@/modules/boards/ui/views/board-list-view";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Boards",
  description: "Create, organize, and revisit your drawing boards.",
};

export default async function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await auth.protect({ role: "user", redirectTo: "/boards" });

  const { page, size, q, sort } = loadBoardListParams(await searchParams);

  prefetch(trpc.boards.list.queryOptions({ page, pageSize: Number(size), q, sort }));

  return (
    <HydrateClient>
      <BoardListView />
    </HydrateClient>
  );
}
