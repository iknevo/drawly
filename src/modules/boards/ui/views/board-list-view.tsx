"use client";

import {
  TEMPLATE_CATEGORIES,
  TEMPLATE_DESCRIPTIONS,
  TEMPLATE_LABELS,
  type TemplateId,
} from "../../lib/templates";
import { BoardCard, BoardCardSkeleton } from "../components/board-card";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import {
  CalendarDaysIcon,
  Columns3Icon,
  GhostIcon,
  Grid2x2Icon,
  LayoutGridIcon,
  LayoutTemplateIcon,
  ListChecksIcon,
  type LucideIcon,
  MilestoneIcon,
  NetworkIcon,
  NotebookTextIcon,
  PlusIcon,
  Repeat2Icon,
  SquarePenIcon,
  WaypointsIcon,
  WorkflowIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { ErrorState } from "@/components/error-state";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { toast } from "@/components/ui/toast";

import { useTRPC } from "@/trpc/client";

const TEMPLATE_ICONS: Record<TemplateId, LucideIcon> = {
  checklist: ListChecksIcon,
  kanban: Columns3Icon,
  weekly: CalendarDaysIcon,
  roadmap: MilestoneIcon,
  retro: Repeat2Icon,
  eisenhower: Grid2x2Icon,
  swot: LayoutGridIcon,
  mindmap: NetworkIcon,
  flowchart: WorkflowIcon,
  bubblemap: WaypointsIcon,
  cornell: NotebookTextIcon,
  wireframe: LayoutTemplateIcon,
};

function NewBoardMenu({
  size,
  disabled,
  onCreate,
  align = "start",
}: {
  size?: "sm" | "default" | "lg";
  disabled: boolean;
  onCreate: (template?: TemplateId) => void;
  align?: "start" | "center" | "end";
}) {
  return (
    <NavigationMenu align={align} className="flex-none">
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger
            disabled={disabled}
            render={<Button size={size} variant="outline" disabled={disabled} />}
          >
            <PlusIcon />
            New board
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="w-140 p-3">
              <NavigationMenuLink
                closeOnClick
                render={
                  <button type="button" onClick={() => onCreate()} className="w-full gap-2.5" />
                }
              >
                <SquarePenIcon />
                <span className="flex flex-col items-start gap-0.5">
                  <span className="font-medium">Blank board</span>
                  <span className="text-muted-foreground text-xs">Start from an empty canvas</span>
                </span>
              </NavigationMenuLink>

              {TEMPLATE_CATEGORIES.map((category) => (
                <section key={category.id}>
                  <div className="text-muted-foreground px-2 pt-3 pb-1 text-xs font-medium">
                    {category.label}
                  </div>
                  <div className="grid grid-cols-2 gap-0.5">
                    {category.templates.map((id) => {
                      const Icon = TEMPLATE_ICONS[id];
                      return (
                        <NavigationMenuLink
                          key={id}
                          closeOnClick
                          render={
                            <button
                              type="button"
                              onClick={() => onCreate(id)}
                              className="gap-2.5"
                            />
                          }
                        >
                          <Icon />
                          <span className="flex flex-col items-start gap-0.5">
                            <span className="font-medium">{TEMPLATE_LABELS[id]}</span>
                            <span className="text-muted-foreground text-xs">
                              {TEMPLATE_DESCRIPTIONS[id]}
                            </span>
                          </span>
                        </NavigationMenuLink>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}

function BoardsListSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-6 lg:p-10">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="bg-muted h-8 w-48 animate-pulse rounded" />
          <div className="bg-muted h-4 w-64 animate-pulse rounded" />
        </div>
        <div className="bg-muted h-10 w-32 animate-pulse rounded-md" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <BoardCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}

export function BoardListView() {
  return (
    <Suspense fallback={<BoardsListSkeleton />}>
      <ErrorBoundary
        fallbackRender={({ resetErrorBoundary }) => <ErrorState onRetry={resetErrorBoundary} />}
      >
        <BoardListViewSuspense />
      </ErrorBoundary>
    </Suspense>
  );
}

function BoardListViewSuspense() {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: boards } = useSuspenseQuery(trpc.boards.list.queryOptions());

  const createBoard = useMutation(
    trpc.boards.create.mutationOptions({
      onSuccess: async ({ id }) => {
        router.push(`/board/${id}`);
        await queryClient.invalidateQueries(trpc.boards.list.queryOptions());
      },
      onError: (error) => toast.add({ type: "error", description: error.message }),
    })
  );

  const handleCreate = (template?: TemplateId) => {
    createBoard.mutate(template ? { template } : {});
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-6 lg:p-10">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-medium">Your boards</h1>
          <p className="text-muted-foreground text-sm">Sketch ideas on an infinite canvas.</p>
        </div>
        <NewBoardMenu
          size="lg"
          align="end"
          disabled={createBoard.isPending}
          onCreate={handleCreate}
        />
      </header>

      {boards.length === 0 ? (
        <Empty className="py-20">
          <EmptyHeader>
            <EmptyMedia>
              <GhostIcon className="size-10" />
            </EmptyMedia>
            <EmptyTitle>No boards yet</EmptyTitle>
            <EmptyDescription>Create your first board to start drawing.</EmptyDescription>
          </EmptyHeader>
          <NewBoardMenu disabled={createBoard.isPending} onCreate={handleCreate} />
        </Empty>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {boards.map((board) => (
            <BoardCard key={board.id} data={board} />
          ))}
        </div>
      )}
    </div>
  );
}
