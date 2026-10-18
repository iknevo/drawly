"use client";

import type { sessionGetOutput } from "../../types/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow, formatDistanceToNowStrict } from "date-fns";
import {
  ArrowLeftIcon,
  MoreHorizontalIcon,
  PencilIcon,
  TimerIcon,
  Trash2Icon,
  WatchIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress, ProgressLabel } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import { useSound } from "@/components/sound-provider";

import { PHASE_LABEL } from "@/modules/sessions/lib/pomodoro";
import { formatClock, formatDuration } from "@/modules/sessions/lib/time";
import { useTRPC } from "@/trpc/client";

type SessionDetailViewProps = {
  sessionId: string;
};

const STATUS_BADGE: Record<
  sessionGetOutput["status"],
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  idle: { label: "Idle", variant: "outline" },
  running: { label: "Running", variant: "default" },
  paused: { label: "Paused", variant: "secondary" },
  completed: { label: "Completed", variant: "outline" },
};

export function SessionDetailView({ sessionId }: SessionDetailViewProps) {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { play } = useSound();

  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [draftName, setDraftName] = useState("");

  const session = useQuery(trpc.sessions.get.queryOptions({ id: sessionId }));

  const renameSession = useMutation(
    trpc.sessions.update.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpc.sessions.list.queryFilter());
        setRenameOpen(false);
      },
      onError: (error) => toast.add({ type: "error", description: error.message }),
    })
  );

  const removeSession = useMutation(
    trpc.sessions.remove.mutationOptions({
      onSuccess: async () => {
        play("delete");
        await queryClient.invalidateQueries(trpc.sessions.list.queryFilter());
        router.push("/sessions");
      },
      onError: (error) => toast.add({ type: "error", description: error.message }),
    })
  );

  if (session.isPending) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <span className="border-muted border-t-foreground size-6 animate-spin rounded-full border-2" />
      </div>
    );
  }

  if (session.isError) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground text-sm">{session.error.message}</p>
        <Link href="/sessions" className={buttonVariants({ variant: "outline" })}>
          Back to sessions
        </Link>
      </div>
    );
  }

  const data = session.data;
  const badge = STATUS_BADGE[data.status];
  const isPomodoro = data.type === "pomodoro";
  const hasTarget = data.targetSeconds > 0;
  const progress = hasTarget
    ? Math.min(100, Math.round((data.elapsedSeconds / data.targetSeconds) * 100))
    : 0;

  const submitRename = () => {
    const next = draftName.trim();
    if (!next || next === data.name) {
      setRenameOpen(false);
      return;
    }
    renameSession.mutate({ id: sessionId, name: next });
  };

  const openRename = () => {
    setDraftName(data.name);
    setRenameOpen(true);
  };

  const infoRows: { label: string; value: string }[] = [
    { label: "Created", value: formatDistanceToNow(new Date(data.createdAt), { addSuffix: true }) },
    ...(data.startedAt
      ? [
          {
            label: "Started",
            value: formatDistanceToNowStrict(new Date(data.startedAt), { addSuffix: true }),
          },
        ]
      : []),
    ...(data.completedAt
      ? [
          {
            label: "Completed",
            value: formatDistanceToNow(new Date(data.completedAt), { addSuffix: true }),
          },
        ]
      : []),
    { label: "Elapsed", value: formatDuration(data.elapsedSeconds) },
    ...(hasTarget ? [{ label: "Target", value: formatDuration(data.targetSeconds) }] : []),
  ];

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 p-6 lg:p-10">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/sessions"
            aria-label="Back to sessions"
            className={buttonVariants({ variant: "ghost", size: "icon" })}
          >
            <ArrowLeftIcon />
          </Link>
          <div className="flex min-w-0 items-center gap-2">
            <span className="bg-muted/60 flex size-9 shrink-0 items-center justify-center rounded-md">
              {isPomodoro ? (
                <WatchIcon className="text-muted-foreground size-4.5" />
              ) : (
                <TimerIcon className="text-muted-foreground size-4.5" />
              )}
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-medium tracking-tight" title={data.name}>
                {data.name}
              </h1>
              <div className="text-muted-foreground flex items-center gap-2 text-xs">
                <span className="capitalize">{data.type}</span>
                <Badge variant={badge.variant} className="text-[0.65rem]">
                  {badge.label}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" size="icon" aria-label="Session actions" />}
          >
            <MoreHorizontalIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={openRename}>
              <PencilIcon />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
              <Trash2Icon />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {infoRows.map((row) => (
          <Card key={row.label} size="sm" className="gap-1 px-3">
            <span className="text-muted-foreground text-xs">{row.label}</span>
            <span className="truncate text-sm font-medium tabular-nums" title={row.value}>
              {row.value}
            </span>
          </Card>
        ))}
      </div>

      {hasTarget && (
        <Card size="sm" className="gap-3 px-3">
          <Progress value={progress}>
            <ProgressLabel>Progress</ProgressLabel>
            <span className="text-muted-foreground ml-auto text-sm tabular-nums">{progress}%</span>
          </Progress>
        </Card>
      )}

      {isPomodoro && (
        <Card size="sm" className="gap-4 px-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Pomodoro plan</span>
            <span className="text-muted-foreground text-xs">
              {Math.round(data.pomodoroConfig.work / 60)}m work •{" "}
              {Math.round(data.pomodoroConfig.shortBreak / 60)}m break •{" "}
              {Math.round(data.pomodoroConfig.longBreak / 60)}m long • {data.pomodoroConfig.cycles}{" "}
              cycles
            </span>
          </div>

          {data.cycles.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {data.cycles.map((cycle, index) => (
                <li
                  key={cycle.id}
                  className="border-border/50 flex items-center justify-between border-b pb-2 text-sm last:border-b-0 last:pb-0"
                >
                  <span className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[0.65rem]">
                      Cycle {cycle.cycleIndex}
                    </Badge>
                    <span className="text-muted-foreground">{PHASE_LABEL[cycle.phase]}</span>
                  </span>
                  <span className="text-muted-foreground flex items-center gap-3 text-xs">
                    {cycle.completedAt &&
                      formatDistanceToNow(new Date(cycle.completedAt), { addSuffix: true })}
                    <span className="tabular-nums">{formatClock(cycle.durationSeconds)}</span>
                  </span>
                  <span className="sr-only">segment {index + 1}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-sm">
              No completed cycles yet. Completed phases appear here as the session runs.
            </p>
          )}
        </Card>
      )}

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename session</DialogTitle>
            <DialogDescription>Give your session a new name.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="session-rename">Name</Label>
            <Input
              id="session-rename"
              value={draftName}
              autoFocus
              maxLength={120}
              onChange={(event) => setDraftName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  submitRename();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameOpen(false)}>
              Cancel
            </Button>
            <Button disabled={renameSession.isPending} onClick={submitRename}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete session?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{data.name}&rdquo; will be permanently deleted. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={removeSession.isPending}
              onClick={() => removeSession.mutate({ id: sessionId })}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
