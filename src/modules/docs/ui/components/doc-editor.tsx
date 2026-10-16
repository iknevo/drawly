"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { TaskItem } from "@tiptap/extension-task-item";
import { TaskList } from "@tiptap/extension-task-list";
import { Placeholder } from "@tiptap/extensions";
import { type Content, EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useCallback, useEffect, useImperativeHandle, useRef } from "react";

import { toast } from "@/components/ui/toast";

import { EditorToolbar } from "./editor-toolbar";
import { useTRPC } from "@/trpc/client";

const SAVE_DELAY = 800;
const MAX_RETRY_DELAY = 30_000;

export type DocSaveStatus = "saved" | "dirty" | "saving" | "error" | "offline";

export type DocEditorHandle = {
  flush: () => Promise<void>;
};

type DocEditorProps = {
  docId: string;
  content: unknown;
  rev: number;
  onStatus?: (status: DocSaveStatus) => void;
  ref?: React.Ref<DocEditorHandle>;
};

export function DocEditor({ docId, content, rev, onStatus, ref }: DocEditorProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const save = useMutation(
    trpc.docs.save.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries(trpc.docs.list.queryFilter());
      },
    })
  );

  const onStatusRef = useRef(onStatus);
  useEffect(() => {
    onStatusRef.current = onStatus;
  });

  const revRef = useRef(rev);
  const statusRef = useRef<DocSaveStatus>("saved");
  const onlineRef = useRef(true);
  const attemptRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flushingRef = useRef(false);
  const dirtyRef = useRef(false);
  const unmountedRef = useRef(false);

  const reportStatus = useCallback((status: DocSaveStatus) => {
    statusRef.current = status;
    onStatusRef.current?.(status);
  }, []);

  const saveRef = useRef(save.mutateAsync);
  useEffect(() => {
    saveRef.current = save.mutateAsync;
  });

  const flushRef = useRef<() => Promise<void>>(async () => {});
  const scheduleSaveRef = useRef<() => void>(() => {});

  const scheduleSave = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      void flushRef.current();
    }, SAVE_DELAY);
  }, []);

  useEffect(() => {
    scheduleSaveRef.current = scheduleSave;
  }, [scheduleSave]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "Start writing…" }),
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    content: content as Content,
    onUpdate: () => {
      dirtyRef.current = true;
      reportStatus("dirty");
      scheduleSaveRef.current();
    },
  });

  const getExcerpt = useCallback((): string => {
    const text = editor?.getText() ?? "";
    return text.replace(/\s+/g, " ").trim().slice(0, 300);
  }, [editor]);

  const scheduleRetry = useCallback(() => {
    if (unmountedRef.current || !onlineRef.current) return;
    const attempt = attemptRef.current;
    attemptRef.current = attempt + 1;
    const delay = Math.min(1000 * 2 ** attempt, MAX_RETRY_DELAY);
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    retryTimerRef.current = setTimeout(() => {
      void flushRef.current();
    }, delay);
  }, []);

  const reloadRemote = useCallback(async () => {
    if (!editor) return false;
    try {
      const fresh = await queryClient.query({
        ...trpc.docs.get.queryOptions({ id: docId }),
        staleTime: 0,
      });
      if (dirtyRef.current) return false;
      revRef.current = fresh.rev;
      editor.commands.setContent(fresh.content as Content, { emitUpdate: false });
      dirtyRef.current = false;
      attemptRef.current = 0;
      reportStatus("saved");
      return true;
    } catch {
      reportStatus("error");
      return false;
    }
  }, [docId, editor, queryClient, reportStatus, trpc]);

  const syncIfIdle = useCallback(async () => {
    if (dirtyRef.current || flushingRef.current || !editor) return;
    try {
      const fresh = await queryClient.query({
        ...trpc.docs.get.queryOptions({ id: docId }),
        staleTime: 0,
      });
      if (dirtyRef.current || flushingRef.current) return;
      if (fresh.rev === revRef.current) return;
      revRef.current = fresh.rev;
      editor.commands.setContent(fresh.content as Content, { emitUpdate: false });
      reportStatus("saved");
    } catch {
      // stay on the local copy: we are clean, so nothing is lost
    }
  }, [docId, editor, queryClient, reportStatus, trpc]);

  const getExcerptRef = useRef(getExcerpt);
  useEffect(() => {
    getExcerptRef.current = getExcerpt;
  });

  const flush = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }

    if (flushingRef.current) return;
    if (!dirtyRef.current) return;
    if (!editor) return;
    if (!onlineRef.current) {
      reportStatus("offline");
      return;
    }

    dirtyRef.current = false;
    flushingRef.current = true;
    reportStatus("saving");

    let retry = false;

    try {
      const result = await saveRef.current({
        id: docId,
        content: editor.getJSON(),
        excerpt: getExcerptRef.current(),
        rev: revRef.current,
      });

      revRef.current = result.rev;
      attemptRef.current = 0;
      reportStatus("saved");
    } catch (error) {
      const code = (error as { data?: { code?: string } } | null)?.data?.code;

      if (code === "CONFLICT") {
        const reloaded = await reloadRemote();
        if (!reloaded) {
          dirtyRef.current = true;
          reportStatus("error");
          if (!unmountedRef.current) {
            toast.add({
              type: "error",
              description: "Couldn't load the latest version. Your changes are still here.",
            });
          }
          return;
        }
        if (!unmountedRef.current) {
          toast.add({
            type: "info",
            description: "This doc changed elsewhere. Reloaded the latest version.",
          });
        }
        return;
      }

      dirtyRef.current = true;
      reportStatus(onlineRef.current ? "error" : "offline");
      if (!unmountedRef.current) {
        toast.add({ type: "error", description: "Couldn't save your doc. Retrying…" });
      }
      retry = true;
    } finally {
      flushingRef.current = false;
    }

    if (retry) scheduleRetry();
  }, [docId, editor, reloadRemote, reportStatus, scheduleRetry]);

  useEffect(() => {
    flushRef.current = flush;
  }, [flush]);

  const syncIdleRef = useRef(syncIfIdle);
  useEffect(() => {
    syncIdleRef.current = syncIfIdle;
  }, [syncIfIdle]);

  useImperativeHandle(ref, () => ({ flush }), [flush]);

  useEffect(() => {
    onlineRef.current = navigator.onLine;
    const onOnline = () => {
      onlineRef.current = true;
      if (dirtyRef.current) {
        reportStatus("dirty");
        void flushRef.current();
      } else if (statusRef.current === "offline") {
        reportStatus("saved");
      }
    };
    const onOffline = () => {
      onlineRef.current = false;
      if (dirtyRef.current || statusRef.current === "saving" || statusRef.current === "error") {
        reportStatus("offline");
      }
    };
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [reportStatus]);

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (dirtyRef.current || flushingRef.current) {
        event.preventDefault();
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  useEffect(() => {
    unmountedRef.current = false;
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        void flushRef.current();
        return;
      }
      void syncIdleRef.current();
    };
    window.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onVisibility);

    return () => {
      window.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onVisibility);
      unmountedRef.current = true;
      if (timerRef.current) clearTimeout(timerRef.current);
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      void flushRef.current();
    };
  }, []);

  return (
    <div className="doc-editor flex min-h-0 flex-1 flex-col">
      <div className="bg-background/95 sticky top-0 z-10 border-b px-3 py-2 backdrop-blur">
        <EditorToolbar editor={editor} />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-6 py-10">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}
