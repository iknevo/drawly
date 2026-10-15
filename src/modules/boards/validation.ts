import { z } from "zod";

import { TEMPLATE_IDS } from "@/modules/boards/lib/templates";

export const boardIdSchema = z.object({
  id: z.string().regex(/^[a-f0-9]{24}$/i, "Invalid board id"),
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
  thumbnail: z.string().max(2_000_000).nullable().optional(),
  rev: z.string().min(1),
  force: z.boolean().optional(),
});
