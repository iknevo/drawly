import { auth } from "@/lib/auth";

import { BoardView } from "@/modules/boards/ui/views/board-view";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  await auth.protect({ role: "user" });

  const { id } = await params;

  return <BoardView boardId={id} />;
}
