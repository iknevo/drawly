export const PAGE_SIZE_VALUES = ["8", "12", "24", "48"] as const;

export type PageSize = (typeof PAGE_SIZE_VALUES)[number];

export const DEFAULT_PAGE_SIZE: PageSize = "12";

export const MAX_PAGE_SIZE = Math.max(...PAGE_SIZE_VALUES.map(Number));

export function getTotalPages(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize));
}

export type PageItem = number | "ellipsis-start" | "ellipsis-end";

export function getPageItems(page: number, totalPages: number): PageItem[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const items: PageItem[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);

  if (start > 2) items.push("ellipsis-start");
  for (let current = start; current <= end; current++) items.push(current);
  if (end < totalPages - 1) items.push("ellipsis-end");
  items.push(totalPages);

  return items;
}
