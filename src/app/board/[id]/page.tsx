import { auth } from "@/lib/auth";

import { BoardView } from "@/modules/boards/ui/views/board-view";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  await auth.protect({ role: "user", redirectTo: `/board/${id}` });

  return <BoardView boardId={id} />;
}
