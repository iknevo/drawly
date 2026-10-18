import { boardsRouter } from "../../modules/boards/server/procedures";
import { docsRouter } from "../../modules/docs/server/procedures";
import { kanbanRouter } from "../../modules/kanban/server/procedures";
import { sessionsRouter } from "../../modules/sessions/server/procedures";
import { createTRPCRouter } from "../init";

export const appRouter = createTRPCRouter({
  boards: boardsRouter,
  docs: docsRouter,
  kanban: kanbanRouter,
  sessions: sessionsRouter,
});

export type AppRouter = typeof appRouter;
