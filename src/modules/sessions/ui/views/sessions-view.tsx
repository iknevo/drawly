"use client";

import { pageHref } from "../../lib/pagination";
import { SessionCard, SessionCardSkeleton } from "../components/session-card";
import { SessionStats } from "../components/session-stats";
import { SessionTimer } from "../components/session-timer";
import { SessionsToolbar } from "../components/sessions-toolbar";
import { useSessionListParams } from "../hooks/use-session-list-params";
import { useSessionTimer } from "../hooks/use-session-timer";
import { keepPreviousData, useSuspenseQuery } from "@tanstack/react-query";
import { cn } from "cn";
import { GhostIcon, SearchIcon } from "lucide-react";
import { Suspense, useEffect } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { getPageItems, getTotalPages } from "@/lib/pagination";

import { ErrorState } from "@/components/error-state";
import { SectionHeader } from "@/components/section-header";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

import { useTRPC } from "@/trpc/client";

function SessionsViewSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <SessionCardSkeleton key={index} />
      ))}
    </div>
  );
}

export function SessionsView() {
  const timer = useSessionTimer();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-6 lg:p-10">
      <SectionHeader title="Sessions" description="Track time with timers and Pomodoro sessions." />

      <SessionTimer timer={timer} />

      <SessionStats />

      <SessionsToolbar />

      <Suspense fallback={<SessionsViewSkeleton />}>
        <ErrorBoundary
          fallbackRender={({ resetErrorBoundary }) => <ErrorState onRetry={resetErrorBoundary} />}
        >
          <SessionsViewSuspense />
        </ErrorBoundary>
      </Suspense>
    </div>
  );
}

function SessionsViewSuspense() {
  const trpc = useTRPC();

  const [{ page, size, q, sort }, setParams] = useSessionListParams();
  const pageSize = Number(size);

  const { data } = useSuspenseQuery(
    trpc.sessions.list.queryOptions(
      { page, pageSize, q, sort },
      { placeholderData: keepPreviousData }
    )
  );

  const { items, total } = data;
  const totalPages = getTotalPages(total, pageSize);
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);
  const searching = q.trim().length > 0;
  const filters = { q, sort };

  useEffect(() => {
    if (total > 0 && page > totalPages) {
      void setParams({ page: totalPages }, { history: "replace" });
    }
  }, [page, total, totalPages, setParams]);

  const goToPage = (next: number) => {
    void setParams({ page: next });
  };

  const clearSearch = () => {
    void setParams({ q: "", page: 1 });
  };

  if (total === 0 && !searching) {
    return (
      <Empty className="flex flex-col items-center justify-center py-20">
        <EmptyHeader>
          <EmptyMedia>
            <GhostIcon className="size-10" />
          </EmptyMedia>
          <EmptyTitle>No sessions yet</EmptyTitle>
          <EmptyDescription>
            Set a name above and press start to track your first session.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  if (total === 0) {
    return (
      <Empty className="flex flex-col items-center justify-center py-20">
        <EmptyHeader>
          <EmptyMedia>
            <SearchIcon className="size-10" />
          </EmptyMedia>
          <EmptyTitle>No sessions match &ldquo;{q}&rdquo;</EmptyTitle>
          <EmptyDescription>Try a different search term.</EmptyDescription>
        </EmptyHeader>
        <Button variant="outline" onClick={clearSearch}>
          Clear search
        </Button>
      </Empty>
    );
  }

  return (
    <>
      <p className="text-muted-foreground text-sm">
        Showing {rangeStart}&ndash;{rangeEnd} of {total} {total === 1 ? "session" : "sessions"}
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {items.map((session) => (
          <SessionCard key={session.id} data={session} />
        ))}
      </div>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href={pageHref(page - 1, size, filters)}
                aria-disabled={page <= 1}
                className={cn(page <= 1 && "pointer-events-none opacity-50")}
                onClick={(event) => {
                  event.preventDefault();
                  if (page > 1) goToPage(page - 1);
                }}
              />
            </PaginationItem>

            {getPageItems(page, totalPages).map((item, index) =>
              typeof item === "number" ? (
                <PaginationItem key={item}>
                  <PaginationLink
                    href={pageHref(item, size, filters)}
                    isActive={item === page}
                    onClick={(event) => {
                      event.preventDefault();
                      goToPage(item);
                    }}
                  >
                    {item}
                  </PaginationLink>
                </PaginationItem>
              ) : (
                <PaginationItem key={`${item}-${index}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              )
            )}

            <PaginationItem>
              <PaginationNext
                href={pageHref(page + 1, size, filters)}
                aria-disabled={page >= totalPages}
                className={cn(page >= totalPages && "pointer-events-none opacity-50")}
                onClick={(event) => {
                  event.preventDefault();
                  if (page < totalPages) goToPage(page + 1);
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </>
  );
}
