import { cache } from "react";

import { auth } from "@/lib/auth";

import { BoardView } from "@/modules/boards/ui/views/board-view";
import { caller } from "@/trpc/server";

const getBoard = cache(async (id: string) => {
  try {
    return await caller.boards.get({ id });
  } catch {
    return null;
  }
});

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const board = await getBoard(id);

  return {
    title: board ? board.title : "Board",
    robots: { index: false, follow: false },
  };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  await auth.protect({ role: "user", redirectTo: `/board/${id}` });

  return <BoardView boardId={id} />;
}
