import { DEFAULT_PAGE_SIZE, type PageSize } from "@/lib/pagination";

export type SessionListFilters = {
  q?: string;
  sort?: string;
  type?: string;
  status?: string;
};

export function pageHref(page: number, size: PageSize, filters: SessionListFilters = {}): string {
  const params = new URLSearchParams();

  if (page > 1) params.set("page", String(page));
  if (size !== DEFAULT_PAGE_SIZE) params.set("size", size);
  if (filters.q) params.set("q", filters.q);
  if (filters.sort && filters.sort !== "updated") params.set("sort", filters.sort);
  if (filters.type && filters.type !== "all") params.set("type", filters.type);
  if (filters.status && filters.status !== "all") params.set("status", filters.status);

  const query = params.toString();

  return query ? `/sessions?${query}` : "/sessions";
}
