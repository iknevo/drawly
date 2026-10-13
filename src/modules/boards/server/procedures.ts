import { TRPCError } from "@trpc/server";

import { Board } from "@/lib/models/board";

import {
  boardIdSchema,
  createBoardSchema,
  renameBoardSchema,
  saveBoardSchema,
} from "@/modules/boards/validation";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";

export const boardsRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    const boards = await Board.find({ ownerId: ctx.session.user.id })
      .sort({ updatedAt: -1 })
      .select("title thumbnail updatedAt")
      .lean();

    return boards.map((board) => ({
      id: board._id.toString(),
      title: board.title,
      thumbnail: board.thumbnail ?? null,
      updatedAt: board.updatedAt,
    }));
  }),

  create: protectedProcedure.input(createBoardSchema).mutation(async ({ ctx, input }) => {
    const board = await Board.create({
      ownerId: ctx.session.user.id,
      title: input.title,
    });

    return { id: board._id.toString() };
  }),

  get: protectedProcedure.input(boardIdSchema).query(async ({ ctx, input }) => {
    const board = await Board.findOne({
      _id: input.id,
      ownerId: ctx.session.user.id,
    }).lean();

    if (!board) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Board not found" });
    }

    return {
      id: board._id.toString(),
      title: board.title,
      snapshot: board.snapshot,
      thumbnail: board.thumbnail ?? null,
    };
  }),

  save: protectedProcedure.input(saveBoardSchema).mutation(async ({ ctx, input }) => {
    const board = await Board.findOneAndUpdate(
      { _id: input.id, ownerId: ctx.session.user.id },
      {
        $set: {
          snapshot: input.snapshot,
          ...(input.thumbnail !== undefined ? { thumbnail: input.thumbnail } : {}),
        },
      },
      { new: true }
    ).lean();

    if (!board) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Board not found" });
    }

    return { id: board._id.toString() };
  }),

  rename: protectedProcedure.input(renameBoardSchema).mutation(async ({ ctx, input }) => {
    const board = await Board.findOneAndUpdate(
      { _id: input.id, ownerId: ctx.session.user.id },
      { $set: { title: input.title } },
      { new: true }
    ).lean();

    if (!board) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Board not found" });
    }

    return { id: board._id.toString(), title: board.title };
  }),

  remove: protectedProcedure.input(boardIdSchema).mutation(async ({ ctx, input }) => {
    const board = await Board.findOneAndDelete({
      _id: input.id,
      ownerId: ctx.session.user.id,
    }).lean();

    if (!board) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Board not found" });
    }

    return { id: board._id.toString() };
  }),
});
