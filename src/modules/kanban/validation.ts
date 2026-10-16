import { z } from "zod";

import { KANBAN_SORT_VALUES } from "@/modules/kanban/lib/list-params";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@/modules/kanban/lib/pagination";

export const kanbanBoardIdSchema = z.object({
  id: z.string().regex(/^[a-f0-9]{24}$/i, "Invalid board id"),
});

const cardIdSchema = z.string().regex(/^[a-f0-9]{24}$/i, "Invalid card id");
const columnIdSchema = z.string().min(1).max(64);
const cardTitleSchema = z.string().trim().min(1, "Title is required").max(140, "Title is too long");
const cardDescriptionSchema = z.string().max(5000, "Description is too long");

export const listKanbanSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(Number(DEFAULT_PAGE_SIZE)),
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
