"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";

import { useSessionInvalidation } from "@/modules/sessions/ui/hooks/use-session-invalidation";
import { useTRPC } from "@/trpc/client";

type SessionRenameDialogProps = {
  session: { id: string; name: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function SessionRenameDialog({ session, open, onOpenChange }: SessionRenameDialogProps) {
  const trpc = useTRPC();
  const invalidateSessions = useSessionInvalidation();
  const [name, setName] = useState(session.name);
  const [syncedId, setSyncedId] = useState(session.id);
  const [syncedOpen, setSyncedOpen] = useState(open);

  if (open !== syncedOpen || session.id !== syncedId) {
    setSyncedOpen(open);
    setSyncedId(session.id);
    if (open) setName(session.name);
  }

  const renameSession = useMutation(
    trpc.sessions.update.mutationOptions({
      onSuccess: async () => {
        await invalidateSessions(session.id);
        onOpenChange(false);
      },
      onError: (error) => toast.add({ type: "error", description: error.message }),
    })
  );

  const submit = () => {
    const next = name.trim();
    if (!next || next === session.name) {
      onOpenChange(false);
      return;
    }
    renameSession.mutate({ id: session.id, name: next });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename session</DialogTitle>
          <DialogDescription>Give your session a new name.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Label htmlFor="session-rename">Name</Label>
          <Input
            id="session-rename"
            value={name}
            autoFocus
            maxLength={120}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                submit();
              }
            }}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={renameSession.isPending || name.trim().length === 0}
            onClick={submit}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
