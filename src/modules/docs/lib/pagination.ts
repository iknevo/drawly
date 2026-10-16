export const PAGE_SIZE_VALUES = ["12", "24", "48", "96"] as const;

export const DEFAULT_PAGE_SIZE = "24";

export const MAX_PAGE_SIZE = 96;

export type PageSize = (typeof PAGE_SIZE_VALUES)[number];

export function getTotalPages(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize));
}

export function getPageItems(page: number, totalPages: number): (number | "gap")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const items: (number | "gap")[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);

  if (start > 2) items.push("gap");
  for (let current = start; current <= end; current++) items.push(current);
  if (end < totalPages - 1) items.push("gap");
  items.push(totalPages);

  return items;
}

export type DocListFilters = {
  q?: string;
  sort?: string;
};

export function pageHref(page: number, size: PageSize, filters: DocListFilters = {}): string {
  const params = new URLSearchParams();

  if (page > 1) params.set("page", String(page));
  if (size !== DEFAULT_PAGE_SIZE) params.set("size", size);
  if (filters.q) params.set("q", filters.q);
  if (filters.sort && filters.sort !== "updated") params.set("sort", filters.sort);

  const query = params.toString();

  return query ? `/docs?${query}` : "/docs";
}
