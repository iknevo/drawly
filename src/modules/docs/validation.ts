import { z } from "zod";

import { SORT_VALUES } from "@/modules/docs/lib/list-params";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@/modules/docs/lib/pagination";

export const docIdSchema = z.object({
  id: z.string().regex(/^[a-f0-9]{24}$/i, "Invalid doc id"),
});

export const listDocsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(Number(DEFAULT_PAGE_SIZE)),
  q: z.string().trim().max(100).default(""),
  sort: z.enum(SORT_VALUES).default("updated"),
});

const docTitle = z.string().trim().min(1, "Title is required").max(120, "Title is too long");

export const createDocSchema = z.object({
  title: docTitle.optional(),
});

export const renameDocSchema = docIdSchema.extend({
  title: docTitle,
});

const MAX_CONTENT_BYTES = 5_000_000;

const contentSchema = z
  .unknown()
  .refine((value) => JSON.stringify(value).length <= MAX_CONTENT_BYTES, "Doc is too large to save");

export const saveDocSchema = docIdSchema.extend({
  content: contentSchema,
  excerpt: z.string().trim().max(500).default(""),
  rev: z.coerce.number().int().min(0),
});
