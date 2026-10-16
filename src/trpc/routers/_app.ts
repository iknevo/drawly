import { boardsRouter } from "../../modules/boards/server/procedures";
import { docsRouter } from "../../modules/docs/server/procedures";
import { kanbanRouter } from "../../modules/kanban/server/procedures";
import { createTRPCRouter } from "../init";

export const appRouter = createTRPCRouter({
  boards: boardsRouter,
  docs: docsRouter,
  kanban: kanbanRouter,
});

export type AppRouter = typeof appRouter;
