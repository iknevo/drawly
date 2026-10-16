"use client";

import { DocEditor, type DocEditorHandle, type DocSaveStatus } from "../components/doc-editor";
import { setVimEnabled, useVimEnabled } from "../lib/vim-mode";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeftIcon, MoreHorizontalIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { Mode } from "vim-prosemirror";

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
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";

import { useTRPC } from "@/trpc/client";

const STATUS_LABEL: Record<DocSaveStatus, string> = {
  saved: "Saved",
  dirty: "Unsaved changes",
  saving: "Saving…",
  error: "Couldn't save",
  offline: "Offline",
};

const MODE_LABEL: Record<Mode, string> = {
  normal: "NORMAL",
  insert: "INSERT",
  replace: "REPLACE",
  visual: "VISUAL",
  "visual-line": "V-LINE",
};

export function DocDetailView({ docId }: { docId: string }) {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();

  const doc = useQuery(trpc.docs.get.queryOptions({ id: docId }));
  const docKey = trpc.docs.get.queryKey({ id: docId });

  const editorRef = useRef<DocEditorHandle>(null);
  const [status, setStatus] = useState<DocSaveStatus>("saved");
  const vimEnabled = useVimEnabled();
  const [vimMode, setVimMode] = useState<Mode>("insert");
  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);

  const toggleVim = () => {
    setVimEnabled(!vimEnabled);
  };

  const renameDoc = useMutation(
    trpc.docs.rename.mutationOptions({
      onMutate: async (variables) => {
        await queryClient.cancelQueries({ queryKey: docKey });
        const previous = queryClient.getQueryData(docKey);
        queryClient.setQueryData(docKey, (current) =>
          current ? { ...current, title: variables.title } : current
        );
        return { previous };
      },
      onError: (error, _variables, context) => {
        if (context?.previous) queryClient.setQueryData(docKey, context.previous);
        toast.add({ type: "error", description: error.message });
      },
      onSettled: async () => {
        await queryClient.invalidateQueries(trpc.docs.list.queryFilter());
      },
    })
  );

  const removeDoc = useMutation(
    trpc.docs.remove.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpc.docs.list.queryFilter());
        router.push("/docs");
      },
      onError: (error) => toast.add({ type: "error", description: error.message }),
    })
  );

  if (doc.isPending) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <span className="border-muted border-t-foreground size-6 animate-spin rounded-full border-2" />
      </div>
    );
  }

  if (doc.isError) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground text-sm">{doc.error.message}</p>
        <Link href="/docs" className={buttonVariants({ variant: "outline" })}>
          Back to docs
        </Link>
      </div>
    );
  }

  const data = doc.data;

  const startEditing = () => {
    setDraftTitle(data.title);
    setEditing(true);
  };

  const commitRename = () => {
    if (!editing) return;
    const next = draftTitle.trim();
    setEditing(false);
    if (next && next !== data.title) renameDoc.mutate({ id: docId, title: next });
  };

  const goBack = () => {
    void editorRef.current?.flush().then(() => router.push("/docs"));
  };

  return (
    <div className="flex h-svh flex-col">
      <header className="flex items-center gap-3 border-b px-3 py-2">
        <Button variant="ghost" size="icon-sm" aria-label="Back to docs" onClick={goBack}>
          <ArrowLeftIcon />
        </Button>

        {editing ? (
          <div className="flex min-w-0 items-center">
            <Label htmlFor="doc-title" className="sr-only">
              Doc title
            </Label>
            <Input
              id="doc-title"
              value={draftTitle}
              autoFocus
              maxLength={120}
              onChange={(event) => setDraftTitle(event.target.value)}
              onBlur={commitRename}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  commitRename();
                } else if (event.key === "Escape") {
                  event.preventDefault();
                  setEditing(false);
                }
              }}
              className="h-7 max-w-xs text-sm font-medium"
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={startEditing}
            className="hover:bg-muted min-w-0 truncate rounded px-1.5 py-0.5 text-left text-sm font-medium"
            aria-label="Rename doc"
          >
            {data.title}
          </button>
        )}

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant={vimEnabled ? "secondary" : "ghost"}
            size="xs"
            aria-pressed={vimEnabled}
            aria-label="Toggle vim mode"
            title="Vim mode"
            onClick={toggleVim}
            className="font-mono tracking-wider"
          >
            VIM
          </Button>

          {vimEnabled ? (
            <span data-vim-mode={vimMode} className="text-muted-foreground font-mono text-xs">
              -- {MODE_LABEL[vimMode]} --
            </span>
          ) : null}

          <span className="text-muted-foreground text-xs">{STATUS_LABEL[status]}</span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" size="icon-sm" aria-label="Doc actions" />}
          >
            <MoreHorizontalIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
              <Trash2Icon />
              Delete doc
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <DocEditor
        key={data.id}
        ref={editorRef}
        docId={data.id}
        content={data.content}
        rev={data.rev}
        vimEnabled={vimEnabled}
        onStatus={setStatus}
        onMode={setVimMode}
      />

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
    </div>
  );
}
