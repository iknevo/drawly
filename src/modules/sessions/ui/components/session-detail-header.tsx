"use client";

import {
  ArrowLeftIcon,
  CheckIcon,
  MoreHorizontalIcon,
  PauseIcon,
  PencilIcon,
  PlayIcon,
  Trash2Icon,
} from "lucide-react";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { SessionDisplayStatus } from "@/modules/sessions/lib/status";
import { SessionStatusBadge } from "@/modules/sessions/ui/components/session-status-badge";
import { SessionTypeIcon } from "@/modules/sessions/ui/components/session-type-icon";

type SessionDetailHeaderProps = {
  type: "timer" | "pomodoro";
  name: string;
  status: SessionDisplayStatus;
  isActive: boolean;
  isPending: boolean;
  onToggle: () => void;
  onComplete: () => void;
  onRename: () => void;
  onDelete: () => void;
};

export function SessionDetailHeader({
  type,
  name,
  status,
  isActive,
  isPending,
  onToggle,
  onComplete,
  onRename,
  onDelete,
}: SessionDetailHeaderProps) {
  const completed = status === "completed";
  const running = status === "running";

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <Link
          href="/sessions"
          aria-label="Back to sessions"
          className={buttonVariants({ variant: "ghost", size: "icon" })}
        >
          <ArrowLeftIcon />
        </Link>
        <SessionTypeIcon type={type} className="size-10" iconClassName="size-5" />
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-medium tracking-tight" title={name}>
            {name}
          </h1>
          <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
            <span className="capitalize">{type}</span>
            <SessionStatusBadge status={status} />
            {isActive && !completed && (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <span className="size-1.5 animate-pulse rounded-full bg-current" />
                Active now
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {!completed && (
          <>
            <Button size="sm" disabled={isPending} onClick={onToggle}>
              {running ? <PauseIcon /> : <PlayIcon />}
              {running ? "Pause" : "Resume"}
            </Button>
            <Button
              size="icon-sm"
              variant="outline"
              aria-label="Complete session"
              disabled={isPending}
              onClick={onComplete}
            >
              <CheckIcon />
            </Button>
          </>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" size="icon" aria-label="Session actions" />}
          >
            <MoreHorizontalIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onRename}>
              <PencilIcon />
              Rename
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={onDelete}>
              <Trash2Icon />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
