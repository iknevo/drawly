import { TRPCError } from "@trpc/server";
import mongoose from "mongoose";
import type { SortOrder } from "mongoose";

import { KanbanBoard } from "@/lib/models/kanban-board";

import {
  createCardSchema,
  createKanbanBoardSchema,
  deleteCardSchema,
  kanbanBoardIdSchema,
  listKanbanSchema,
  renameKanbanBoardSchema,
  reorderCardsSchema,
  updateCardSchema,
} from "@/modules/kanban/validation";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

type CardShape = { id: string; title: string; description: string };
type ColumnShape = { id: string; title: string; cards: CardShape[] };

type BoardLike = {
  _id: unknown;
  title: string;
  updatedAt: Date;
  columns: ColumnShape[];
};

function toDto(board: BoardLike) {
  return {
    id: String(board._id),
    title: board.title,
    updatedAt: board.updatedAt,
    columns: board.columns.map((column) => ({
      id: column.id,
      title: column.title,
      cards: column.cards.map((card) => ({
        id: card.id,
        title: card.title,
        description: card.description,
      })),
    })),
  };
}

export const kanbanRouter = createTRPCRouter({
  list: protectedProcedure.input(listKanbanSchema).query(async ({ ctx, input }) => {
    const filter: { ownerId: string; title?: { $regex: string; $options: string } } = {
      ownerId: ctx.session.user.id,
    };

    if (input.q) {
      filter.title = { $regex: escapeRegExp(input.q), $options: "i" };
    }

    const sortSpec: Record<string, SortOrder> =
      input.sort === "title"
        ? { title: 1, updatedAt: -1 }
        : input.sort === "created"
          ? { createdAt: -1 }
          : { updatedAt: -1 };

    const boards = await KanbanBoard.find(filter)
      .sort(sortSpec)
      .limit(200)
      .select("title columns updatedAt")
      .lean();

    return {
      items: boards.map((board) => ({
        id: board._id.toString(),
        title: board.title,
        cardCount: board.columns.reduce((total, column) => total + column.cards.length, 0),
        columns: board.columns.map((column) => ({
          id: column.id,
          title: column.title,
          cardCount: column.cards.length,
        })),
        updatedAt: board.updatedAt,
      })),
      total: boards.length,
    };
  }),

  create: protectedProcedure.input(createKanbanBoardSchema).mutation(async ({ ctx, input }) => {
    const board = await KanbanBoard.create({
      ownerId: ctx.session.user.id,
      ...(input.title ? { title: input.title } : {}),
    });

    return { id: board._id.toString() };
  }),

  rename: protectedProcedure.input(renameKanbanBoardSchema).mutation(async ({ ctx, input }) => {
    const board = await KanbanBoard.findOneAndUpdate(
      { _id: input.id, ownerId: ctx.session.user.id },
      { $set: { title: input.title } },
      { returnDocument: "after" }
    ).lean();

    if (!board) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Board not found" });
    }

    return { id: board._id.toString(), title: board.title };
  }),

  duplicate: protectedProcedure.input(kanbanBoardIdSchema).mutation(async ({ ctx, input }) => {
    const source = await KanbanBoard.findOne({
      _id: input.id,
      ownerId: ctx.session.user.id,
    }).lean();

    if (!source) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Board not found" });
    }

    const board = await KanbanBoard.create({
      ownerId: ctx.session.user.id,
      title: `${source.title} (copy)`.slice(0, 120),
      columns: source.columns.map((column) => ({
        id: column.id,
        title: column.title,
        cards: column.cards.map((card) => ({
          title: card.title,
          description: card.description,
        })),
      })),
    });

    return { id: board._id.toString() };
  }),

  remove: protectedProcedure.input(kanbanBoardIdSchema).mutation(async ({ ctx, input }) => {
    const result = await KanbanBoard.deleteOne({
      _id: input.id,
      ownerId: ctx.session.user.id,
    });

    if (result.deletedCount === 0) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Board not found" });
    }

    return { id: input.id };
  }),

  get: protectedProcedure.input(kanbanBoardIdSchema).query(async ({ ctx, input }) => {
    const board = await KanbanBoard.findOne({
      _id: input.id,
      ownerId: ctx.session.user.id,
    }).lean();

    if (!board) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Board not found" });
    }

    return toDto(board as unknown as BoardLike);
  }),

  createCard: protectedProcedure.input(createCardSchema).mutation(async ({ ctx, input }) => {
    const board = await KanbanBoard.findOne({ _id: input.id, ownerId: ctx.session.user.id });

    if (!board) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Board not found" });
    }

    const column = board.columns.find((item) => item.id === input.columnId);

    if (!column) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Column not found" });
    }

    const id = new mongoose.Types.ObjectId().toString();
    column.cards.push({ id, title: input.title ?? "New card", description: "" });
    await board.save();

    return { card: { id, title: input.title ?? "New card", description: "" } };
  }),

  updateCard: protectedProcedure.input(updateCardSchema).mutation(async ({ ctx, input }) => {
    const board = await KanbanBoard.findOne({ _id: input.id, ownerId: ctx.session.user.id });

    if (!board) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Board not found" });
    }

    let card: { id: string; title: string; description: string } | undefined;

    for (const column of board.columns) {
      const found = column.cards.find((item) => item.id === input.cardId);
      if (found) {
        card = found;
        break;
      }
    }

    if (!card) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Card not found" });
    }

    if (input.title !== undefined) card.title = input.title;
    if (input.description !== undefined) card.description = input.description;

    await board.save();

    return { card: { id: card.id, title: card.title, description: card.description } };
  }),

  deleteCard: protectedProcedure.input(deleteCardSchema).mutation(async ({ ctx, input }) => {
    const board = await KanbanBoard.findOne({ _id: input.id, ownerId: ctx.session.user.id });

    if (!board) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Board not found" });
    }

    let found = false;

    for (const column of board.columns) {
      const index = column.cards.findIndex((item) => item.id === input.cardId);
      if (index !== -1) {
        column.cards.splice(index, 1);
        found = true;
        break;
      }
    }

    if (!found) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Card not found" });
    }

    await board.save();

    return { cardId: input.cardId };
  }),

  reorderCards: protectedProcedure.input(reorderCardsSchema).mutation(async ({ ctx, input }) => {
    const board = await KanbanBoard.findOne({ _id: input.id, ownerId: ctx.session.user.id });

    if (!board) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Board not found" });
    }

    const byId = new Map<string, CardShape>();

    for (const column of board.columns) {
      for (const card of column.cards) {
        byId.set(card.id, { id: card.id, title: card.title, description: card.description });
      }
    }

    const placed = new Set<string>();
    const columns: ColumnShape[] = board.columns.map((column) => {
      const incoming = input.columns.find((item) => item.columnId === column.id);

      const cards: CardShape[] = [];

      if (!incoming) {
        for (const card of column.cards) {
          cards.push({ id: card.id, title: card.title, description: card.description });
          placed.add(card.id);
        }
      } else {
        for (const cardId of incoming.cardIds) {
          const card = byId.get(cardId);
          if (card && !placed.has(cardId)) {
            cards.push(card);
            placed.add(cardId);
          }
        }
      }

      return { id: column.id, title: column.title, cards };
    });

    board.columns.forEach((column, index) => {
      for (const card of column.cards) {
        if (!placed.has(card.id)) {
          columns[index].cards.push({
            id: card.id,
            title: card.title,
            description: card.description,
          });
          placed.add(card.id);
        }
      }
    });

    board.set("columns", columns);
    await board.save();

    return { columns };
  }),
});
