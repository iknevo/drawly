import { boardsRouter } from "../../modules/boards/server/procedures";
import { kanbanRouter } from "../../modules/kanban/server/procedures";
import { createTRPCRouter } from "../init";

export const appRouter = createTRPCRouter({
  boards: boardsRouter,
  kanban: kanbanRouter,
});

export type AppRouter = typeof appRouter;
