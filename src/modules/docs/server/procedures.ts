import { TRPCError } from "@trpc/server";
import type { SortOrder } from "mongoose";

import { Doc } from "@/lib/models/doc";

import {
  createDocSchema,
  docIdSchema,
  listDocsSchema,
  renameDocSchema,
  saveDocSchema,
} from "@/modules/docs/validation";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const EMPTY_CONTENT = { type: "doc", content: [{ type: "paragraph" }] };

export const docsRouter = createTRPCRouter({
  list: protectedProcedure.input(listDocsSchema).query(async ({ ctx, input }) => {
    const { page, pageSize, q, sort } = input;

    const filter: { ownerId: string; title?: { $regex: string; $options: string } } = {
      ownerId: ctx.session.user.id,
    };

    if (q) {
      filter.title = { $regex: escapeRegExp(q), $options: "i" };
    }

    const sortSpec: Record<string, SortOrder> =
      sort === "title"
        ? { title: 1, updatedAt: -1 }
        : sort === "created"
          ? { createdAt: -1 }
          : { updatedAt: -1 };

    const [docs, total] = await Promise.all([
      Doc.find(filter)
        .sort(sortSpec)
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .select("title updatedAt")
        .lean(),
      Doc.countDocuments(filter),
    ]);

    return {
      items: docs.map((doc) => ({
        id: doc._id.toString(),
        title: doc.title,
        updatedAt: doc.updatedAt,
      })),
      total,
      page,
      pageSize,
    };
  }),

  create: protectedProcedure.input(createDocSchema).mutation(async ({ ctx, input }) => {
    const doc = await Doc.create({
      ownerId: ctx.session.user.id,
      ...(input.title ? { title: input.title } : {}),
    });

    return { id: doc._id.toString() };
  }),

  get: protectedProcedure.input(docIdSchema).query(async ({ ctx, input }) => {
    const doc = await Doc.findOne({
      _id: input.id,
      ownerId: ctx.session.user.id,
    }).lean();

    if (!doc) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Doc not found" });
    }

    return {
      id: doc._id.toString(),
      title: doc.title,
      content: doc.content ?? EMPTY_CONTENT,
      rev: doc.rev ?? 0,
    };
  }),

  save: protectedProcedure.input(saveDocSchema).mutation(async ({ ctx, input }) => {
    const doc = await Doc.findOneAndUpdate(
      {
        _id: input.id,
        ownerId: ctx.session.user.id,
        rev: input.rev === 0 ? { $in: [0, null] } : input.rev,
      },
      {
        $set: {
          content: input.content,
        },
        $inc: {
          rev: 1,
        },
      },
      { returnDocument: "after" }
    ).lean();

    if (!doc) {
      const exists = await Doc.exists({ _id: input.id, ownerId: ctx.session.user.id });

      if (!exists) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Doc not found" });
      }

      throw new TRPCError({
        code: "CONFLICT",
        message: "This doc was changed somewhere else",
      });
    }

    return { id: doc._id.toString(), rev: doc.rev ?? 0 };
  }),

  rename: protectedProcedure.input(renameDocSchema).mutation(async ({ ctx, input }) => {
    const doc = await Doc.findOneAndUpdate(
      { _id: input.id, ownerId: ctx.session.user.id },
      { $set: { title: input.title } },
      { returnDocument: "after" }
    ).lean();

    if (!doc) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Doc not found" });
    }

    return { id: doc._id.toString(), title: doc.title };
  }),

  duplicate: protectedProcedure.input(docIdSchema).mutation(async ({ ctx, input }) => {
    const source = await Doc.findOne({
      _id: input.id,
      ownerId: ctx.session.user.id,
    }).lean();

    if (!source) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Doc not found" });
    }

    const doc = await Doc.create({
      ownerId: ctx.session.user.id,
      title: `${source.title} (copy)`.slice(0, 120),
      content: source.content ?? EMPTY_CONTENT,
    });

    return { id: doc._id.toString() };
  }),

  remove: protectedProcedure.input(docIdSchema).mutation(async ({ ctx, input }) => {
    const doc = await Doc.findOneAndDelete({
      _id: input.id,
      ownerId: ctx.session.user.id,
    }).lean();

    if (!doc) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Doc not found" });
    }

    return { id: doc._id.toString() };
  }),
});
