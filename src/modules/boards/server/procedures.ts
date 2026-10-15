import { TRPCError } from "@trpc/server";

import { Board } from "@/lib/models/board";

import { TEMPLATE_LABELS } from "@/modules/boards/lib/templates";
import { TEMPLATE_SNAPSHOTS } from "@/modules/boards/server/templates";
import {
  boardIdSchema,
  createBoardSchema,
  listBoardsSchema,
  renameBoardSchema,
  saveBoardSchema,
  setBoardPublicSchema,
  setThumbnailSchema,
} from "@/modules/boards/validation";
import { baseProcedure, createTRPCRouter, protectedProcedure } from "@/trpc/init";

export const boardsRouter = createTRPCRouter({
  list: protectedProcedure.input(listBoardsSchema).query(async ({ ctx, input }) => {
    const { page, pageSize } = input;

    const [boards, total] = await Promise.all([
      Board.find({ ownerId: ctx.session.user.id })
        .sort({ updatedAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .select("title thumbnail updatedAt")
        .lean(),
      Board.countDocuments({ ownerId: ctx.session.user.id }),
    ]);

    return {
      items: boards.map((board) => ({
        id: board._id.toString(),
        title: board.title,
        thumbnail: board.thumbnail ?? null,
        updatedAt: board.updatedAt,
      })),
      total,
      page,
      pageSize,
    };
  }),

  create: protectedProcedure.input(createBoardSchema).mutation(async ({ ctx, input }) => {
    const template = input.template ? TEMPLATE_SNAPSHOTS[input.template] : undefined;
    const title = input.title ?? (input.template ? TEMPLATE_LABELS[input.template] : undefined);

    const board = await Board.create({
      ownerId: ctx.session.user.id,
      ...(title ? { title } : {}),
      ...(template ? { snapshot: template } : {}),
    });

    return { id: board._id.toString() };
  }),

  clone: protectedProcedure.input(boardIdSchema).mutation(async ({ ctx, input }) => {
    const source = await Board.findOne({ _id: input.id, isPublic: true }).lean();

    if (!source) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Board not found" });
    }

    const board = await Board.create({
      ownerId: ctx.session.user.id,
      title: source.title,
      snapshot: source.snapshot,
      thumbnail: source.thumbnail ?? null,
      isPublic: false,
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
      rev: board.updatedAt.toISOString(),
      isPublic: board.isPublic ?? false,
    };
  }),

  save: protectedProcedure.input(saveBoardSchema).mutation(async ({ ctx, input }) => {
    const board = await Board.findOneAndUpdate(
      {
        _id: input.id,
        ownerId: ctx.session.user.id,
        ...(input.force ? {} : { updatedAt: new Date(input.rev) }),
      },
      {
        $set: {
          snapshot: input.snapshot,
        },
      },
      { returnDocument: "after" }
    ).lean();

    if (!board) {
      const exists = await Board.exists({ _id: input.id, ownerId: ctx.session.user.id });

      if (!exists) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Board not found" });
      }

      throw new TRPCError({
        code: "CONFLICT",
        message: "This board was changed somewhere else",
      });
    }

    return { id: board._id.toString(), rev: board.updatedAt.toISOString() };
  }),

  rename: protectedProcedure.input(renameBoardSchema).mutation(async ({ ctx, input }) => {
    const board = await Board.findOneAndUpdate(
      { _id: input.id, ownerId: ctx.session.user.id },
      { $set: { title: input.title } },
      { returnDocument: "after" }
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

  setPublic: protectedProcedure.input(setBoardPublicSchema).mutation(async ({ ctx, input }) => {
    const board = await Board.findOneAndUpdate(
      { _id: input.id, ownerId: ctx.session.user.id },
      { $set: { isPublic: input.isPublic } },
      { returnDocument: "after" }
    ).lean();

    if (!board) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Board not found" });
    }

    return { id: board._id.toString(), isPublic: board.isPublic ?? false };
  }),

  setThumbnail: protectedProcedure.input(setThumbnailSchema).mutation(async ({ ctx, input }) => {
    const board = await Board.findOneAndUpdate(
      { _id: input.id, ownerId: ctx.session.user.id },
      { $set: { thumbnail: input.thumbnail } },
      { returnDocument: "after", timestamps: false }
    ).lean();

    if (!board) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Board not found" });
    }

    return { id: board._id.toString(), thumbnail: board.thumbnail ?? null };
  }),

  getShared: baseProcedure.input(boardIdSchema).query(async ({ input }) => {
    const board = await Board.findOne({ _id: input.id, isPublic: true })
      .select("title snapshot updatedAt")
      .lean();

    if (!board) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Board not found" });
    }

    return {
      title: board.title,
      snapshot: board.snapshot,
      updatedAt: board.updatedAt,
    };
  }),
});
