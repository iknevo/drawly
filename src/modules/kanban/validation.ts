import { z } from "zod";

export const kanbanBoardIdSchema = z.object({
  id: z.string().regex(/^[a-f0-9]{24}$/i, "Invalid board id"),
});

const cardIdSchema = z.string().regex(/^[a-f0-9]{24}$/i, "Invalid card id");
const columnIdSchema = z.string().min(1).max(64);
const cardTitleSchema = z.string().trim().min(1, "Title is required").max(140, "Title is too long");
const cardDescriptionSchema = z.string().max(5000, "Description is too long");

export const KANBAN_SORT_VALUES = ["updated", "created", "title"] as const;

export const listKanbanSchema = z.object({
  q: z.string().trim().max(100).default(""),
  sort: z.enum(KANBAN_SORT_VALUES).default("updated"),
});

export const createKanbanBoardSchema = z.object({
  title: z.string().trim().max(120).optional(),
});

export const renameKanbanBoardSchema = kanbanBoardIdSchema.extend({
  title: z.string().trim().min(1, "Title is required").max(120, "Title is too long"),
});

export const createCardSchema = kanbanBoardIdSchema.extend({
  columnId: columnIdSchema,
  title: cardTitleSchema.optional(),
});

export const updateCardSchema = kanbanBoardIdSchema.extend({
  cardId: cardIdSchema,
  title: cardTitleSchema.optional(),
  description: cardDescriptionSchema.optional(),
});

export const deleteCardSchema = kanbanBoardIdSchema.extend({
  cardId: cardIdSchema,
});

export const reorderCardsSchema = kanbanBoardIdSchema.extend({
  columns: z
    .array(
      z.object({
        columnId: columnIdSchema,
        cardIds: z.array(cardIdSchema),
      })
    )
    .min(1)
    .max(50),
});
