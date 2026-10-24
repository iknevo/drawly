"use client";

import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { useSound } from "@/components/sound-provider";
import { ErrorState } from "@/components/error-state";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress, ProgressLabel } from "@/components/ui/progress";
import { toast } from "@/components/ui/toast";

import { PHASE_LABEL } from "@/modules/sessions/lib/pomodoro";
import { formatClock, formatDuration, formatRelative } from "@/modules/sessions/lib/time";
import { PomodoroSummary } from "@/modules/sessions/ui/components/pomodoro-summary";
import { PomodoroTimeline } from "@/modules/sessions/ui/components/pomodoro-timeline";
import { SessionDeleteDialog } from "@/modules/sessions/ui/components/session-delete-dialog";
import { SessionDetailHeader } from "@/modules/sessions/ui/components/session-detail-header";
import { SessionInfoGrid } from "@/modules/sessions/ui/components/session-info-grid";
import { SessionRenameDialog } from "@/modules/sessions/ui/components/session-rename-dialog";
import { useSessionInvalidation } from "@/modules/sessions/ui/hooks/use-session-invalidation";
import { useSessionTimer } from "@/modules/sessions/ui/hooks/use-session-timer";
import { useTRPC } from "@/trpc/client";

type SessionDetailViewProps = {
  sessionId: string;
};

export function SessionDetailView({ sessionId }: SessionDetailViewProps) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 p-6 lg:p-10">
      <Suspense fallback={<SessionDetailViewSkeleton />}>
        <ErrorBoundary
          fallbackRender={({ resetErrorBoundary }) => <ErrorState onRetry={resetErrorBoundary} />}
        >
          <SessionDetailViewSuspense sessionId={sessionId} />
        </ErrorBoundary>
      </Suspense>
    </div>
  );
}

function SessionDetailViewSkeleton() {
  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-muted size-9 animate-pulse rounded-md" />
          <div className="bg-muted size-10 animate-pulse rounded-md" />
          <div className="space-y-2">
            <div className="bg-muted h-7 w-48 animate-pulse rounded" />
            <div className="bg-muted h-4 w-24 animate-pulse rounded" />
          </div>
        </div>
        <div className="bg-muted h-8 w-40 animate-pulse rounded-md" />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} size="sm" className="gap-2 px-3">
            <div className="bg-muted h-3 w-16 animate-pulse rounded" />
            <div className="bg-muted h-4 w-24 animate-pulse rounded" />
          </Card>
        ))}
      </div>

      <Card size="sm" className="gap-3 px-3">
        <div className="bg-muted h-4 w-24 animate-pulse rounded" />
        <div className="bg-muted h-1.5 w-full animate-pulse rounded" />
      </Card>

      <Card size="sm" className="gap-4 px-3">
        <div className="bg-muted h-4 w-32 animate-pulse rounded" />
        <div className="bg-muted h-2.5 w-full animate-pulse rounded-full" />
        <div className="bg-muted h-20 w-full animate-pulse rounded" />
      </Card>
    </>
  );
}

function SessionDetailViewSuspense({ sessionId }: SessionDetailViewProps) {
  const trpc = useTRPC();
  const timer = useSessionTimer();
  const router = useRouter();
  const { play } = useSound();
  const invalidateSessions = useSessionInvalidation();

  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data } = useSuspenseQuery(trpc.sessions.get.queryOptions({ id: sessionId }));

  const isActive = timer.sessionId === data.id;
  const liveElapsed = isActive ? timer.elapsed : data.elapsedSeconds;
  const liveStatus = isActive ? timer.status : data.status;
  const isPomodoro = data.type === "pomodoro";
  const hasTarget = data.targetSeconds > 0;
  const progress = hasTarget
    ? Math.min(100, Math.round((liveElapsed / data.targetSeconds) * 100))
    : 0;

  const activePomodoro = isActive ? timer.pomodoro : null;
  const completedPhases = activePomodoro
    ? Math.max(0, activePomodoro.completedIndex + 1)
    : Math.min(data.cycles.length, data.pomodoroConfig.cycles * 2);

  const completeSession = useMutation(
    trpc.sessions.complete.mutationOptions({
      onSuccess: async () => {
        play("success");
        await invalidateSessions(data.id);
        toast.add({
          type: "success",
          title: "Session complete",
          description: `${data.name} · ${formatDuration(liveElapsed)}`,
        });
      },
      onError: (error) => toast.add({ type: "error", description: error.message }),
    })
  );

  const handleToggle = () => {
    if (isActive && timer.status === "running") {
      timer.pause();
      return;
    }
    void timer.resumeSession(data.id);
  };

  const handleComplete = () => {
    if (isActive) {
      timer.complete();
      return;
    }
    completeSession.mutate({ id: data.id, elapsedSeconds: data.elapsedSeconds });
  };

  return (
    <>
      <SessionDetailHeader
        type={data.type}
        name={data.name}
        status={liveStatus}
        isActive={isActive}
        isPending={timer.isPending || completeSession.isPending}
        onToggle={handleToggle}
        onComplete={handleComplete}
        onRename={() => setRenameOpen(true)}
        onDelete={() => setDeleteOpen(true)}
      />

      {isActive && liveStatus !== "completed" && (
        <Card size="sm" className="flex-row items-center justify-between gap-4 px-3">
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
              Live now
            </span>
            <span className="font-mono text-3xl font-light tabular-nums">
              {formatClock(liveElapsed)}
            </span>
          </div>
          {activePomodoro && !activePomodoro.done && (
            <div className="text-right">
              <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                {PHASE_LABEL[activePomodoro.phase]}
              </span>
              <div className="font-mono text-xl tabular-nums">
                {formatClock(activePomodoro.timeRemaining)}
              </div>
              <span className="text-muted-foreground text-xs">
                Cycle {activePomodoro.cycle}/{data.pomodoroConfig.cycles}
              </span>
            </div>
          )}
        </Card>
      )}

      <SessionInfoGrid
        createdAt={data.createdAt}
        startedAt={data.startedAt}
        completedAt={data.completedAt}
        elapsedSeconds={liveElapsed}
        targetSeconds={data.targetSeconds}
      />

      {hasTarget && (
        <Card size="sm" className="gap-3 px-3">
          <Progress value={progress}>
            <ProgressLabel>Progress</ProgressLabel>
            <span className="text-muted-foreground ml-auto text-sm tabular-nums">{progress}%</span>
          </Progress>
          <div className="text-muted-foreground flex items-center justify-between text-xs">
            <span className="tabular-nums">
              {formatDuration(liveElapsed)} / {formatDuration(data.targetSeconds)}
            </span>
            <span>
              {progress >= 100 ? "Target reached" : `${formatDuration(Math.max(0, data.targetSeconds - liveElapsed))} left`}
            </span>
          </div>
        </Card>
      )}

      {isPomodoro && (
        <section className="flex flex-col gap-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 className="text-sm font-medium">Pomodoro plan</h2>
            <span className="text-muted-foreground text-xs">
              {Math.round(data.pomodoroConfig.work / 60)}m work ·{" "}
              {Math.round(data.pomodoroConfig.shortBreak / 60)}m break ·{" "}
              {Math.round(data.pomodoroConfig.longBreak / 60)}m long · {data.pomodoroConfig.cycles}{" "}
              cycles
            </span>
          </div>

          <PomodoroSummary config={data.pomodoroConfig} cycles={data.cycles} />

          <Card size="sm" className="gap-4 px-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Timeline</span>
              <span className="text-muted-foreground text-xs tabular-nums">
                {completedPhases}/{data.pomodoroConfig.cycles * 2} phases
              </span>
            </div>

            <PomodoroTimeline config={data.pomodoroConfig} completedCount={completedPhases} />

            {data.cycles.length > 0 ? (
              <ul className="flex flex-col">
                {data.cycles.map((cycle) => (
                  <li
                    key={cycle.id}
                    className="border-border/50 grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b py-2 text-sm last:border-b-0 last:pb-0"
                  >
                    <Badge variant="outline" className="text-[0.65rem]">
                      Cycle {cycle.cycleIndex}
                    </Badge>
                    <span className="text-muted-foreground text-xs">
                      {PHASE_LABEL[cycle.phase]}
                    </span>
                    <span className="text-muted-foreground flex items-center gap-3 text-xs">
                      {cycle.completedAt && (
                        <span className="hidden sm:inline">
                          {formatRelative(cycle.completedAt)}
                        </span>
                      )}
                      <span className="text-foreground tabular-nums">
                        {formatClock(cycle.durationSeconds)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-sm">
                No completed phases yet. Completed phases appear here as the session runs.
              </p>
            )}
          </Card>
        </section>
      )}

      <SessionRenameDialog
        session={{ id: data.id, name: data.name }}
        open={renameOpen}
        onOpenChange={setRenameOpen}
      />

      <SessionDeleteDialog
        session={{ id: data.id, name: data.name }}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDeleted={() => {
          if (isActive) timer.clearSession();
          router.push("/sessions");
        }}
      />
    </>
  );
}
