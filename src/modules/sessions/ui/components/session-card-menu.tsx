"use client";

import type { sessionsListItem } from "../../types/types";
import {
  ArrowUpRightIcon,
  MoreHorizontalIcon,
  PauseIcon,
  PencilIcon,
  PlayIcon,
  Trash2Icon,
} from "lucide-react";
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
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { SessionDeleteDialog } from "@/modules/sessions/ui/components/session-delete-dialog";
import { SessionRenameDialog } from "@/modules/sessions/ui/components/session-rename-dialog";
import { useSessionTimer } from "@/modules/sessions/ui/hooks/use-session-timer";

type SessionCardMenuProps = {
  data: sessionsListItem;
};

export function SessionCardMenu({ data }: SessionCardMenuProps) {
  const router = useRouter();
  const timer = useSessionTimer();

  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [replaceOpen, setReplaceOpen] = useState(false);

  const isActive = timer.sessionId === data.id;
  const canResume = data.status !== "completed";
  const hasOtherSession =
    timer.sessionId !== null && timer.sessionId !== data.id && timer.status !== "idle";

  const resume = () => {
    if (hasOtherSession) {
      setReplaceOpen(true);
      return;
    }
    void timer.resumeSession(data.id);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" size="icon-sm" aria-label="Session actions" />}
        >
          <MoreHorizontalIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {canResume &&
            (isActive && timer.status === "running" ? (
              <DropdownMenuItem onClick={timer.pause}>
                <PauseIcon />
                Pause
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem disabled={timer.isPending} onClick={resume}>
                <PlayIcon />
                Resume
              </DropdownMenuItem>
            ))}
          <DropdownMenuItem onClick={() => router.push(`/sessions/${data.id}`)}>
            <ArrowUpRightIcon />
            Open
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setRenameOpen(true)}>
            <PencilIcon />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
            <Trash2Icon />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

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
        }}
      />

      <AlertDialog open={replaceOpen} onOpenChange={setReplaceOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resume this session?</AlertDialogTitle>
            <AlertDialogDescription>
              Another session is currently active. It will be paused before this one starts.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setReplaceOpen(false);
                void timer.resumeSession(data.id);
              }}
            >
              Resume
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
