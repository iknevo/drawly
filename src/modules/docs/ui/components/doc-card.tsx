"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { CopyIcon, FileTextIcon, MoreHorizontalIcon, PencilIcon, Trash2Icon } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";

import type { docsListItem } from "@/modules/docs/types/types";
import { useTRPC } from "@/trpc/client";

export function DocCardSkeleton() {
  return (
    <Card size="sm" className="gap-3">
      <div className="space-y-2 p-3">
        <div className="bg-muted h-4 w-2/3 animate-pulse rounded" />
        <div className="bg-muted h-3 w-full animate-pulse rounded" />
        <div className="bg-muted h-3 w-4/5 animate-pulse rounded" />
      </div>
    </Card>
  );
}

export function DocCard({ data }: { data: docsListItem }) {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [renameTarget, setRenameTarget] = useState<{ id: string; title: string } | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const renameDoc = useMutation(
    trpc.docs.rename.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpc.docs.list.queryFilter());
        setRenameTarget(null);
      },
      onError: (error) => toast.add({ type: "error", description: error.message }),
    })
  );

  const removeDoc = useMutation(
    trpc.docs.remove.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpc.docs.list.queryFilter());
        setDeleteOpen(false);
      },
      onError: (error) => toast.add({ type: "error", description: error.message }),
    })
  );

  const duplicateDoc = useMutation(
    trpc.docs.duplicate.mutationOptions({
      onSuccess: async ({ id }) => {
        await queryClient.invalidateQueries(trpc.docs.list.queryFilter());
        router.push(`/docs/${id}`);
      },
      onError: (error) => toast.add({ type: "error", description: error.message }),
    })
  );

  return (
    <>
      <Card size="sm" className="gap-0">
        <Link href={`/docs/${data.id}`} className="flex flex-col gap-2 p-3">
          <span className="flex items-center gap-2">
            <FileTextIcon className="text-muted-foreground size-4 shrink-0" />
            <span className="truncate font-medium">{data.title}</span>
          </span>
          <span className="text-muted-foreground line-clamp-3 min-h-10 text-sm">
            {data.excerpt || "Empty doc"}
          </span>
          <span className="text-muted-foreground text-xs">
            edited {formatDistanceToNow(new Date(data.updatedAt), { addSuffix: true })}
          </span>
        </Link>
        <div className="flex justify-end px-1.5 pb-1.5">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon-sm" aria-label="Doc actions" />}
            >
              <MoreHorizontalIcon />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setRenameTarget({ id: data.id, title: data.title })}>
                <PencilIcon />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={duplicateDoc.isPending}
                onClick={() => duplicateDoc.mutate({ id: data.id })}
              >
                <CopyIcon />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
                <Trash2Icon />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </Card>

      <Dialog
        open={renameTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRenameTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename doc</DialogTitle>
            <DialogDescription>Give your doc a new name.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="doc-name">Name</Label>
            <Input
              id="doc-name"
              value={renameTarget?.title ?? ""}
              autoFocus
              maxLength={120}
              onChange={(event) => {
                setRenameTarget((prev) => (prev ? { ...prev, title: event.target.value } : prev));
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && renameTarget?.title.trim() && !renameDoc.isPending) {
                  event.preventDefault();
                  renameDoc.mutate({ id: renameTarget.id, title: renameTarget.title.trim() });
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameTarget(null)}>
              Cancel
            </Button>
            <Button
              disabled={renameDoc.isPending || !renameTarget?.title.trim()}
              onClick={() => {
                if (renameTarget) {
                  renameDoc.mutate({ id: renameTarget.id, title: renameTarget.title.trim() });
                }
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete doc?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{data.title}&rdquo; will be permanently deleted. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={removeDoc.isPending}
              onClick={() => removeDoc.mutate({ id: data.id })}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
