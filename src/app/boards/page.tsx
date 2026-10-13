import { auth } from "@/lib/auth";

import { BoardListView } from "@/modules/boards/ui/views/board-list-view";

export const metadata = {
  title: "Boards",
};

export default async function Page() {
  await auth.protect({ role: "user" });

  return <BoardListView />;
}
