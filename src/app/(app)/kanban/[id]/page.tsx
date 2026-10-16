import { cache } from "react";

import { auth } from "@/lib/auth";

import { KanbanBoardView } from "@/modules/kanban/ui/views/kanban-board-view";
import { HydrateClient, caller, prefetch, trpc } from "@/trpc/server";

export const dynamic = "force-dynamic";

const getBoard = cache(async (id: string) => {
  try {
    return await caller.kanban.get({ id });
  } catch {
    return null;
  }
});

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const board = await getBoard(id);

  return {
    title: board ? board.title : "Kanban board",
    robots: { index: false, follow: false },
  };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  await auth.protect({ role: "user", redirectTo: `/kanban/${id}` });

  prefetch(trpc.kanban.get.queryOptions({ id }));

  return (
    <HydrateClient>
      <KanbanBoardView boardId={id} />
    </HydrateClient>
  );
}
