"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useSound } from "@/components/sound-provider";
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
import { toast } from "@/components/ui/toast";

import { useSessionInvalidation } from "@/modules/sessions/ui/hooks/use-session-invalidation";
import { useTRPC } from "@/trpc/client";

type SessionDeleteDialogProps = {
  session: { id: string; name: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
};

export function SessionDeleteDialog({
  session,
  open,
  onOpenChange,
  onDeleted,
}: SessionDeleteDialogProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { play } = useSound();
  const invalidateSessions = useSessionInvalidation();

  const removeSession = useMutation(
    trpc.sessions.remove.mutationOptions({
      onSuccess: async () => {
        play("delete");
        queryClient.removeQueries(trpc.sessions.get.queryFilter({ id: session.id }));
        await invalidateSessions();
        onOpenChange(false);
        toast.add({ type: "success", description: `"${session.name}" deleted` });
        onDeleted?.();
      },
      onError: (error) => toast.add({ type: "error", description: error.message }),
    })
  );

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete session?</AlertDialogTitle>
          <AlertDialogDescription>
            &ldquo;{session.name}&rdquo; will be permanently deleted. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={removeSession.isPending}
            onClick={() => removeSession.mutate({ id: session.id })}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
