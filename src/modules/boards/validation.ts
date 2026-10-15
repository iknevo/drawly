import { z } from "zod";

import { SORT_VALUES } from "@/modules/boards/lib/list-params";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@/modules/boards/lib/pagination";
import { TEMPLATE_IDS } from "@/modules/boards/lib/templates";

export const boardIdSchema = z.object({
  id: z.string().regex(/^[a-f0-9]{24}$/i, "Invalid board id"),
});

export const listBoardsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(Number(DEFAULT_PAGE_SIZE)),
  q: z.string().trim().max(100).default(""),
  sort: z.enum(SORT_VALUES).default("updated"),
});

const boardTitle = z.string().trim().min(1, "Title is required").max(120, "Title is too long");

export const createBoardSchema = z.object({
  title: boardTitle.optional(),
  template: z.enum(TEMPLATE_IDS).optional(),
});

export const renameBoardSchema = boardIdSchema.extend({
  title: boardTitle,
});

export const setBoardPublicSchema = boardIdSchema.extend({
  isPublic: z.boolean(),
});

export const setThumbnailSchema = boardIdSchema.extend({
  thumbnail: z.string().max(2_000_000).nullable(),
});

const MAX_SNAPSHOT_BYTES = 15_000_000;

const snapshotSchema = z.object({
  document: z.object({
    store: z.record(z.string(), z.unknown()),
  }),
});

export const saveBoardSchema = boardIdSchema.extend({
  snapshot: snapshotSchema.refine(
    (value) => JSON.stringify(value).length <= MAX_SNAPSHOT_BYTES,
    "Board is too large to save"
  ),
  rev: z.coerce.number().int().min(0),
});
