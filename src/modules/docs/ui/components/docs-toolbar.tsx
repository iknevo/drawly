"use client";

import { SearchIcon, XIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { PAGE_SIZE_VALUES, type PageSize } from "@/lib/pagination";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { DocSort } from "@/modules/docs/lib/list-params";
import { useDocListParams } from "@/modules/docs/ui/hooks/use-doc-list-params";

export function DocsToolbar() {
  const [{ size, q, sort }, setParams] = useDocListParams();

  const [search, setSearch] = useState(q);
  const [syncedQ, setSyncedQ] = useState(q);

  if (q !== syncedQ) {
    setSyncedQ(q);
    setSearch(q);
  }

  useEffect(() => {
    if (search === q) return;
    const timer = setTimeout(() => {
      void setParams({ q: search.trim(), page: 1 });
    }, 300);
    return () => clearTimeout(timer);
  }, [search, q, setParams]);

  const clearSearch = () => {
    setSearch("");
    void setParams({ q: "", page: 1 });
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="relative w-full max-w-xs">
        <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search docs…"
          aria-label="Search docs"
          className="pl-8"
        />
        {search.length > 0 && (
          <button
            type="button"
            onClick={clearSearch}
            aria-label="Clear search"
            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2"
          >
            <XIcon className="size-4" />
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground text-sm">Sort</span>
        <Select
          value={sort}
          onValueChange={(value) => {
            void setParams({ sort: value as DocSort, page: 1 });
          }}
        >
          <SelectTrigger size="sm" aria-label="Sort docs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false} align="end">
            <SelectItem value="updated">Last edited</SelectItem>
            <SelectItem value="created">Recently created</SelectItem>
            <SelectItem value="title">Title (A–Z)</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-muted-foreground text-sm">Per page</span>
        <Select
          value={size}
          onValueChange={(value) => {
            void setParams({ size: value as PageSize, page: 1 });
          }}
        >
          <SelectTrigger size="sm" aria-label="Docs per page">
            <SelectValue />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false} align="end">
            {PAGE_SIZE_VALUES.map((value) => (
              <SelectItem key={value} value={value}>
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
