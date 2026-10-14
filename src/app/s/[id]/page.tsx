import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { cache } from "react";

import { auth } from "@/lib/auth";
import { SharedBoardView } from "@/modules/boards/ui/views/shared-board-view";
import { caller } from "@/trpc/server";

const getShared = cache(async (id: string) => {
  try {
    return await caller.boards.getShared({ id });
  } catch {
    return null;
  }
});

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const board = await getShared(id);

  if (!board) {
    return { title: "Board not available" };
  }

  return {
    title: board.title,
    description: "A board shared on Drawly.",
    robots: { index: false, follow: false },
  };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const board = await getShared(id);

  if (!board) {
    notFound();
  }

  const session = await auth.api.getSession({ headers: await headers() });

  return <SharedBoardView title={board.title} snapshot={board.snapshot} signedIn={!!session} />;
}
