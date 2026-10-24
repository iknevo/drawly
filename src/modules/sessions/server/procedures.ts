import { TRPCError } from "@trpc/server";
import { startOfDay, subDays } from "date-fns";
import type { Types } from "mongoose";

import { PomodoroCycle } from "@/lib/models/pomodoro-cycle";
import { Session, type SessionDoc } from "@/lib/models/session";
import { buildSortSpec, escapeRegExp } from "@/lib/search";

import { resolveEffectiveStatus } from "@/modules/sessions/lib/status";

type SessionFilter = {
  ownerId: string;
  name?: { $regex: string; $options: string };
  type?: "timer" | "pomodoro";
  status?: "completed" | { $ne: "completed" };
};

import {
  completeSessionSchema,
  createSessionSchema,
  listSessionsSchema,
  recordCycleSchema,
  sessionIdSchema,
  updateSessionSchema,
} from "@/modules/sessions/validation";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";

type SessionRecord = {
  _id: Types.ObjectId;
  type: "timer" | "pomodoro";
  name: string;
  targetSeconds: number;
  elapsedSeconds: number;
  status: "idle" | "running" | "paused" | "completed";
  currentCycle?: number;
  currentPhase?: "work" | "shortBreak" | "longBreak";
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date | null;
  completedAt?: Date | null;
};

type SessionRecordWithConfig = SessionRecord & {
  pomodoroConfig?: {
    work?: number;
    shortBreak?: number;
    longBreak?: number;
    cycles?: number;
  };
};

function mapSession(session: SessionRecord) {
  return {
    id: String(session._id),
    type: session.type,
    name: session.name,
    targetSeconds: session.targetSeconds,
    elapsedSeconds: session.elapsedSeconds,
    status: resolveEffectiveStatus(session.status, session.updatedAt),
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    startedAt: session.startedAt ?? null,
    completedAt: session.completedAt ?? null,
  };
}

function mapSessionDetail(session: SessionRecordWithConfig) {
  return {
    ...mapSession(session),
    currentCycle: session.currentCycle ?? 1,
    currentPhase: session.currentPhase ?? "work",
    pomodoroConfig: {
      work: session.pomodoroConfig?.work ?? 1500,
      shortBreak: session.pomodoroConfig?.shortBreak ?? 300,
      longBreak: session.pomodoroConfig?.longBreak ?? 900,
      cycles: session.pomodoroConfig?.cycles ?? 4,
    },
  };
}

export const sessionsRouter = createTRPCRouter({
  list: protectedProcedure.input(listSessionsSchema).query(async ({ ctx, input }) => {
    const { page, pageSize, q, sort, type, status } = input;

    const filter: SessionFilter = {
      ownerId: ctx.session.user.id,
    };

    if (q) {
      filter.name = { $regex: escapeRegExp(q), $options: "i" };
    }

    if (type !== "all") {
      filter.type = type;
    }

    if (status === "completed") {
      filter.status = "completed";
    } else if (status === "ongoing") {
      filter.status = { $ne: "completed" };
    }

    const [sessions, total] = await Promise.all([
      Session.find(filter)
        .select(
          "type name targetSeconds elapsedSeconds status createdAt updatedAt startedAt completedAt"
        )
        .sort(buildSortSpec(sort))
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      Session.countDocuments(filter),
    ]);

    return {
      items: sessions.map(mapSession),
      total,
      page,
      pageSize,
    };
  }),

  stats: protectedProcedure.query(async ({ ctx }) => {
    const ownerId = ctx.session.user.id;
    const today = startOfDay(new Date());
    const windowStart = subDays(today, 6);

    const matchTotal = { $match: { ownerId } };
    const matchWindow = { $match: { ownerId, createdAt: { $gte: windowStart } } };
    const groupTotals = {
      $group: {
        _id: null,
        count: { $sum: 1 },
        seconds: { $sum: "$elapsedSeconds" },
        completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
      },
    };
    const groupDaily = {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        seconds: { $sum: "$elapsedSeconds" },
      },
    };

    const [totalResult, daily] = await Promise.all([
      Session.aggregate([matchTotal, groupTotals]),
      Session.aggregate([matchWindow, groupDaily]),
    ]);

    const totals = totalResult[0];
    const secondsByDay = new Map<string, number>(
      daily.map((entry: { _id: string; seconds: number }) => [entry._id, entry.seconds])
    );

    const week = Array.from({ length: 7 }, (_, index) => {
      const date = subDays(today, 6 - index);
      const key = date.toISOString().slice(0, 10);
      return { date: key, seconds: secondsByDay.get(key) ?? 0 };
    });

    const todayKey = today.toISOString().slice(0, 10);

    return {
      totalSessions: totals?.count ?? 0,
      completedSessions: totals?.completed ?? 0,
      completionRate: totals && totals.count > 0 ? totals.completed / totals.count : 0,
      totalSeconds: totals?.seconds ?? 0,
      todaySeconds: secondsByDay.get(todayKey) ?? 0,
      week,
    };
  }),

  create: protectedProcedure.input(createSessionSchema).mutation(async ({ ctx, input }) => {
    const now = new Date();
    const session = await Session.create({
      ownerId: ctx.session.user.id,
      type: input.type,
      name: input.name,
      targetSeconds: input.targetSeconds,
      status: "running",
      startedAt: now,
      ...(input.type === "pomodoro"
        ? {
            pomodoroConfig: {
              work: input.pomodoroConfig?.work ?? 1500,
              shortBreak: input.pomodoroConfig?.shortBreak ?? 300,
              longBreak: input.pomodoroConfig?.longBreak ?? 900,
              cycles: input.pomodoroConfig?.cycles ?? 4,
            },
          }
        : {}),
    });

    return { id: session._id.toString() };
  }),

  get: protectedProcedure.input(sessionIdSchema).query(async ({ ctx, input }) => {
    const session = await Session.findOne({
      _id: input.id,
      ownerId: ctx.session.user.id,
    }).lean<SessionRecordWithConfig>();

    if (!session) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });
    }

    const cycles = await PomodoroCycle.find({
      sessionId: session._id,
      ownerId: ctx.session.user.id,
    })
      .sort({ completedAt: 1 })
      .lean();

    return {
      ...mapSessionDetail(session),
      cycles: cycles.map((cycle) => ({
        id: cycle._id.toString(),
        cycleIndex: cycle.cycleIndex,
        phase: cycle.phase,
        durationSeconds: cycle.durationSeconds,
        completedAt: cycle.completedAt,
      })),
    };
  }),

  update: protectedProcedure.input(updateSessionSchema).mutation(async ({ ctx, input }) => {
    const { id, ...data } = input;

    const session = await Session.findOneAndUpdate(
      { _id: id, ownerId: ctx.session.user.id },
      { $set: data },
      { returnDocument: "after", runValidators: true }
    ).lean();

    if (!session) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });
    }

    return { id: session._id.toString() };
  }),

  complete: protectedProcedure.input(completeSessionSchema).mutation(async ({ ctx, input }) => {
    const session = await Session.findOneAndUpdate(
      { _id: input.id, ownerId: ctx.session.user.id, status: { $ne: "completed" } },
      {
        $set: {
          status: "completed",
          elapsedSeconds: input.elapsedSeconds,
          completedAt: new Date(),
        },
      },
      { returnDocument: "after", runValidators: true }
    ).lean();

    if (!session) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });
    }

    return { id: session._id.toString() };
  }),

  recordCycle: protectedProcedure.input(recordCycleSchema).mutation(async ({ ctx, input }) => {
    const session = await Session.findOne({
      _id: input.id,
      ownerId: ctx.session.user.id,
      type: "pomodoro",
    }).lean();

    if (!session) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });
    }

    await Promise.all([
      PomodoroCycle.create({
        sessionId: session._id,
        ownerId: ctx.session.user.id,
        cycleIndex: input.cycleIndex,
        phase: input.phase,
        durationSeconds: input.durationSeconds,
        completedAt: new Date(),
      }),
      Session.updateOne(
        { _id: session._id },
        { $set: { currentCycle: input.cycleIndex, currentPhase: input.phase } }
      ),
    ]);

    return { id: input.id };
  }),

  remove: protectedProcedure.input(sessionIdSchema).mutation(async ({ ctx, input }) => {
    const session = await Session.findOneAndDelete({
      _id: input.id,
      ownerId: ctx.session.user.id,
    }).lean();

    if (!session) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" });
    }

    await PomodoroCycle.deleteMany({ sessionId: input.id, ownerId: ctx.session.user.id });

    return { id: input.id };
  }),
});
