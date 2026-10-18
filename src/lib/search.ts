import type { SortOrder } from "mongoose";

export type SortKey = "title" | "created" | "updated";

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function buildSortSpec(sort: SortKey): Record<string, SortOrder> {
  return sort === "title"
    ? { title: 1, updatedAt: -1 }
    : sort === "created"
      ? { createdAt: -1 }
      : { updatedAt: -1 };
}
