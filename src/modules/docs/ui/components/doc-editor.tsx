"use client";

import { createDocVimExtension, forceInsertMode } from "../lib/vim-mode";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CodeBlockLowlight } from "@tiptap/extension-code-block-lowlight";
import { Image } from "@tiptap/extension-image";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { TableKit } from "@tiptap/extension-table";
import { Placeholder } from "@tiptap/extensions";
import { Markdown } from "@tiptap/markdown";
import { type Content, EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { common, createLowlight } from "lowlight";
import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import type { Mode } from "vim-prosemirror";
import { getVimMode } from "vim-prosemirror/tiptap";

import { cn } from "@/lib/utils";

import { toast } from "@/components/ui/toast";

import { EditorToolbar } from "./editor-toolbar";
import { MarkdownSourceEditor } from "./markdown-source-editor-lazy";
import { useTRPC } from "@/trpc/client";

const SAVE_DELAY = 800;
const PREVIEW_DELAY = 200;
const MAX_RETRY_DELAY = 30_000;

const lowlight = createLowlight(common);

export type DocSaveStatus = "saved" | "dirty" | "saving" | "error" | "offline";

export type DocEditorHandle = {
  flush: () => Promise<void>;
};

type DocEditorProps = {
  docId: string;
  content: unknown;
  rev: number;
  vimEnabled?: boolean;
  markdownMode?: boolean;
  previewEnabled?: boolean;
  onStatus?: (status: DocSaveStatus) => void;
  onMode?: (mode: Mode) => void;
  ref?: React.Ref<DocEditorHandle>;
};

export function DocEditor({
  docId,
  content,
  rev,
  vimEnabled = false,
  markdownMode = false,
  previewEnabled = false,
  onStatus,
  onMode,
  ref,
}: DocEditorProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const save = useMutation(
    trpc.docs.save.mutationOptions({
      onSuccess: (_result, variables) => {
        void queryClient.invalidateQueries(trpc.docs.list.queryFilter());
        void queryClient.invalidateQueries(trpc.docs.get.queryFilter({ id: variables.id }));
      },
    })
  );

  const onStatusRef = useRef(onStatus);
  useEffect(() => {
    onStatusRef.current = onStatus;
  });

  const onModeRef = useRef(onMode);
  useEffect(() => {
    onModeRef.current = onMode;
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

  const markdownRef = useRef("");
  const markdownDirtyRef = useRef(false);
  const [sourceEpoch, setSourceEpoch] = useState(0);

  const richScrollRef = useRef<HTMLDivElement>(null);
  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previewEnabledRef = useRef(previewEnabled);
  useEffect(() => {
    previewEnabledRef.current = previewEnabled;
  });

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
  const syncMarkdownRef = useRef<() => void>(() => {});

  const scheduleSave = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      void flushRef.current();
    }, SAVE_DELAY);
  }, []);

  useEffect(() => {
    scheduleSaveRef.current = scheduleSave;
  }, [scheduleSave]);

  const onMarkdownChange = useCallback(
    (value: string) => {
      markdownRef.current = value;
      markdownDirtyRef.current = true;
      dirtyRef.current = true;
      reportStatus("dirty");
      scheduleSaveRef.current();
      if (previewEnabledRef.current) {
        if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
        previewTimerRef.current = setTimeout(() => {
          syncMarkdownRef.current();
        }, PREVIEW_DELAY);
      }
    },
    [reportStatus]
  );

  const extensions = useMemo(
    () => [
      StarterKit.configure({ codeBlock: false }),
      Placeholder.configure({ placeholder: "Start writing…" }),
      TaskList,
      TaskItem.configure({ nested: true }),
      TableKit,
      Image,
      CodeBlockLowlight.configure({ lowlight }),
      Markdown.configure({ markedOptions: { gfm: true }, indentation: { size: 2 } }),
      createDocVimExtension(),
    ],
    []
  );

  const editor = useEditor({
    immediatelyRender: false,
    extensions,
    content: content as Content,
    onUpdate: () => {
      dirtyRef.current = true;
      reportStatus("dirty");
      scheduleSaveRef.current();
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (vimEnabled) forceInsertMode(editor);
    editor.view.dispatch(editor.state.tr);
  }, [editor, vimEnabled]);

  useEffect(() => {
    if (!editor) return;
    if (markdownMode) return;
    if (!markdownDirtyRef.current) return;
    editor.commands.setContent(markdownRef.current, { contentType: "markdown", emitUpdate: false });
    markdownDirtyRef.current = false;
  }, [editor, markdownMode]);

  const syncMarkdown = useCallback(() => {
    if (!editor) return;
    const container = richScrollRef.current;
    const scrollTop = container?.scrollTop ?? 0;
    editor.commands.setContent(markdownRef.current, { contentType: "markdown", emitUpdate: false });
    markdownDirtyRef.current = false;
    if (container) {
      requestAnimationFrame(() => {
        container.scrollTop = scrollTop;
      });
    }
  }, [editor]);

  useEffect(() => {
    syncMarkdownRef.current = syncMarkdown;
  }, [syncMarkdown]);

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!markdownMode, false);
  }, [editor, markdownMode]);

  useEffect(() => {
    if (!editor) return;
    if (!markdownMode || !previewEnabled) return;
    if (!markdownDirtyRef.current) return;
    if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
    syncMarkdownRef.current();
  }, [editor, markdownMode, previewEnabled]);

  const lastModeRef = useRef<Mode | null>(null);
  useEffect(() => {
    if (!editor) return;
    const report = () => {
      const mode = getVimMode(editor);
      if (mode === lastModeRef.current) return;
      lastModeRef.current = mode;
      onModeRef.current?.(mode);
    };
    editor.on("transaction", report);
    return () => {
      editor.off("transaction", report);
    };
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
      markdownDirtyRef.current = false;
      setSourceEpoch((epoch) => epoch + 1);
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
      markdownDirtyRef.current = false;
      setSourceEpoch((epoch) => epoch + 1);
      reportStatus("saved");
    } catch {
      // stay on the local copy: we are clean, so nothing is lost
    }
  }, [docId, editor, queryClient, reportStatus, trpc]);

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

    if (markdownDirtyRef.current) {
      editor.commands.setContent(markdownRef.current, {
        contentType: "markdown",
        emitUpdate: false,
      });
      markdownDirtyRef.current = false;
    }

    dirtyRef.current = false;
    flushingRef.current = true;
    reportStatus("saving");

    let retry = false;

    try {
      const result = await saveRef.current({
        id: docId,
        content: editor.getJSON(),
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
      if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
      void flushRef.current();
    };
  }, []);

  return (
    <div className="doc-editor flex min-h-0 flex-1 flex-col">
      {markdownMode ? null : (
        <div className="bg-background/95 sticky top-0 z-10 border-b px-3 py-2 backdrop-blur">
          <EditorToolbar editor={editor} />
        </div>
      )}
      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col",
          markdownMode && previewEnabled && "md:flex-row"
        )}
      >
        {markdownMode && editor ? (
          <MarkdownSourceEditor
            key={sourceEpoch}
            initialValue={editor.getMarkdown()}
            vimEnabled={vimEnabled}
            onChange={onMarkdownChange}
          />
        ) : null}
        <div
          ref={richScrollRef}
          className={cn(
            "min-h-0 flex-1 overflow-y-auto",
            markdownMode && !previewEnabled && "hidden",
            markdownMode &&
              previewEnabled &&
              "doc-preview border-border border-t md:border-t-0 md:border-l"
          )}
        >
          <div className="mx-auto w-full max-w-3xl px-6 py-10">
            <EditorContent editor={editor} spellCheck={false} />
          </div>
        </div>
      </div>
    </div>
  );
}
