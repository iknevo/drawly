import { TRPCError } from "@trpc/server";

import { Session } from "@/lib/models/session";
import { PomodoroCycle } from "@/lib/models/pomodoro-cycle";

import {
  completeSessionSchema,
  createSessionSchema,
  listSessionsSchema,
  sessionIdSchema,
  updateSessionSchema,
} from "@/modules/sessions/validation";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";

export const sessionsRouter = createTRPCRouter({
  list: protectedProcedure.input(listSessionsSchema).query(async ({ ctx, input }) => {
    const { page, pageSize, q, sort } = input;

    const filter: { userId: string; name?: { $regex: string; $options: string } } = {
      userId: ctx.session.user.id,
    };

    if (q) {
      filter.name = { $regex: q, $options: "i" };
    }

    const sortSpec: Record<string, 1 | -1> =
      sort === "created" ? { createdAt: -1 } : { updatedAt: -1 };

    const [sessions, total] = await Promise.all([
      Session.find(filter)
        .sort(sortSpec)
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      Session.countDocuments(filter),
    ]);

    return {
      items: sessions.map((session) => ({
        id: session._id.toString(),
        type: session.type,
        name: session.name,
        targetSeconds: session.targetSeconds,
        elapsedSeconds: session.elapsedSeconds,
        status: session.status,
        currentCycle: session.currentCycle,
        currentPhase: session.currentPhase,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      })),
      total,
      page,
      pageSize,
    };
  }),

  create: protectedProcedure.input(createSessionSchema).mutation(async ({ ctx, input }) => {
    const session = await Session.create({
      userId: ctx.session.user.id,
      type: input.type,
      name: input.name,
      targetSeconds: input.targetSeconds,
      ...(input.pomodoroConfig ? { pomodoroConfig: input.pomodoroConfig } : {}),
    });

    return { id: session._id.toString() };
  }),

  get: protectedProcedure.input(sessionIdSchema).query(async ({ ctx, input }) => {
    const session = await Session.findOne({
      _id: input.id,
      userId: ctx.session.user.id,
    }).lean();

    if (!session) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });
    }

    return {
      id: session._id.toString(),
      type: session.type,
      name: session.name,
      targetSeconds: session.targetSeconds,
      elapsedSeconds: session.elapsedSeconds,
      status: session.status,
      pomodoroConfig: session.pomodoroConfig,
      currentCycle: session.currentCycle,
      currentPhase: session.currentPhase,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    };
  }),

  update: protectedProcedure.input(updateSessionSchema).mutation(async ({ ctx, input }) => {
    const { id, ...data } = input;

    const session = await Session.findOneAndUpdate(
      { _id: id, userId: ctx.session.user.id },
      { $set: data },
      { returnDocument: "after" },
    ).lean();

    if (!session) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });
    }

    return { id: session._id.toString() };
  }),

  complete: protectedProcedure.input(completeSessionSchema).mutation(async ({ ctx, input }) => {
    const session = await Session.findOneAndUpdate(
      { _id: input.id, userId: ctx.session.user.id },
      { $set: { status: "completed" } },
      { returnDocument: "after" },
    ).lean();

    if (!session) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });
    }

    return { id: session._id.toString() };
  }),

  remove: protectedProcedure.input(sessionIdSchema).mutation(async ({ ctx, input }) => {
    const session = await Session.findOneAndDelete({
      _id: input.id,
      userId: ctx.session.user.id,
    }).lean();

    if (!session) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });
    }

    await PomodoroCycle.deleteMany({ sessionId: input.id });

    return { id: input.id };
  }),
});
