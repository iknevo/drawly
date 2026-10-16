"use client";

import { useBoardCamera } from "../hooks/use-board-camera";
import {
  type Diff,
  type DiffSource,
  type GridId,
  Quickdraw,
  type QuickdrawRef,
  Store,
  THEMES,
} from "@quickdrawjs/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@teispace/next-themes";
import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";

import { toast } from "@/components/ui/toast";

import { CanvasControls } from "./canvas-controls";
import { useTRPC } from "@/trpc/client";

const SAVE_DELAY = 1000;
const THUMBNAIL_DELAY = 2000;
const THUMBNAIL_MAX_W = 400;
const THUMBNAIL_MAX_H = 300;
const THUMBNAIL_MARGIN = 48;
const ZOOM_K = 0.012;
const MAX_RETRY_DELAY = 30_000;

export type SaveStatus = "saved" | "dirty" | "saving" | "error" | "offline";

export type QuickdrawCanvasHandle = {
  flush: () => Promise<void>;
};

type QuickdrawCanvasProps = {
  boardId: string;
  snapshot: unknown;
  rev: number;
  title?: string;
  thumbnail?: string | null;
  onStatus?: (status: SaveStatus) => void;
  ref?: React.Ref<QuickdrawCanvasHandle>;
};

export function QuickdrawCanvas({
  boardId,
  snapshot,
  rev,
  title,
  thumbnail,
  onStatus,
  ref,
}: QuickdrawCanvasProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { resolvedTheme, setTheme } = useTheme();
  const [grid, setGrid] = useState<GridId>("none");
  const wrapRef = useRef<HTMLDivElement>(null);

  const store = useMemo(() => {
    const next = new Store();
    if (snapshot) next.loadSnapshot(snapshot as Parameters<Store["loadSnapshot"]>[0], "remote");
    return next;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId]);

  const save = useMutation(trpc.boards.save.mutationOptions());
  const setThumbnail = useMutation(
    trpc.boards.setThumbnail.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries(trpc.boards.list.queryFilter());
      },
    })
  );

  const onStatusRef = useRef(onStatus);
  useEffect(() => {
    onStatusRef.current = onStatus;
  });

  const qdRef = useRef<QuickdrawRef>(null);
  const { fit, zoomIn, zoomOut } = useBoardCamera({
    wrapperRef: wrapRef,
    qdRef,
    enabled: false,
  });

  const download = useCallback(async () => {
    const editor = qdRef.current?.editor;
    if (!editor) return;
    const blob = await editor.exportImage({ background: true, scale: 2 });
    if (!blob) {
      toast.add({ type: "error", description: "Nothing to download yet." });
      return;
    }
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${title || "board"}.png`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }, [title]);

  const revRef = useRef(rev);
  const statusRef = useRef<SaveStatus>("saved");
  const onlineRef = useRef(true);
  const attemptRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flushingRef = useRef(false);
  const dirtyRef = useRef(false);
  const unmountedRef = useRef(false);
  const thumbnailRef = useRef<string | null | undefined>(undefined);
  const thumbnailTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sendingThumbnailRef = useRef(false);
  const seededRef = useRef(false);
  const pendingConflictRef = useRef(false);
  const syncingRef = useRef(false);

  const reportStatus = useCallback((status: SaveStatus) => {
    statusRef.current = status;
    onStatusRef.current?.(status);
  }, []);

  const saveRef = useRef(save.mutateAsync);
  useEffect(() => {
    saveRef.current = save.mutateAsync;
  });

  const setThumbnailRef = useRef(setThumbnail.mutate);
  useEffect(() => {
    setThumbnailRef.current = setThumbnail.mutate;
  });

  const flushRef = useRef<() => Promise<void>>(async () => {});
  const syncIdleRef = useRef<() => Promise<void>>(async () => {});
  const resolveConflictRef = useRef<() => Promise<void>>(async () => {});

  const captureThumbnail = useCallback(async (): Promise<string | null | undefined> => {
    const editor = qdRef.current?.editor;
    if (!editor) return undefined;
    try {
      if (typeof document !== "undefined" && document.fonts) {
        await document.fonts.ready;
      }
      const bounds = editor.contentBounds();
      if (!bounds || bounds.w <= 0 || bounds.h <= 0) return null;
      const scale = Math.min(
        THUMBNAIL_MAX_W / (bounds.w + THUMBNAIL_MARGIN * 2),
        THUMBNAIL_MAX_H / (bounds.h + THUMBNAIL_MARGIN * 2)
      );
      if (!Number.isFinite(scale) || scale <= 0) return null;
      const blob = await editor.exportImage({ background: true, scale });
      if (!blob) return null;
      const bitmap = await createImageBitmap(blob);
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        bitmap.close();
        return undefined;
      }
      ctx.drawImage(bitmap, 0, 0);
      bitmap.close();
      const dataUrl = canvas.toDataURL("image/webp", 0.7);
      return dataUrl && dataUrl !== "data:," ? dataUrl : null;
    } catch {
      return undefined;
    }
  }, []);

  const sendThumbnail = useCallback(async () => {
    if (sendingThumbnailRef.current) return;
    sendingThumbnailRef.current = true;
    try {
      const captured = await captureThumbnail();
      if (!captured || captured === thumbnailRef.current) return;
      thumbnailRef.current = captured;
      setThumbnailRef.current({ id: boardId, thumbnail: captured });
    } finally {
      sendingThumbnailRef.current = false;
    }
  }, [boardId, captureThumbnail]);

  const sendThumbnailRef = useRef(sendThumbnail);
  useEffect(() => {
    sendThumbnailRef.current = sendThumbnail;
  }, [sendThumbnail]);

  const scheduleThumbnail = useCallback(() => {
    if (thumbnailTimerRef.current) clearTimeout(thumbnailTimerRef.current);
    thumbnailTimerRef.current = setTimeout(() => {
      void sendThumbnail();
    }, THUMBNAIL_DELAY);
  }, [sendThumbnail]);

  const scheduleSave = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      void flushRef.current();
    }, SAVE_DELAY);
  }, []);

  const scheduleRetry = useCallback(() => {
    if (unmountedRef.current || !onlineRef.current) return;
    const attempt = attemptRef.current;
    attemptRef.current = attempt + 1;
    const delay = Math.min(SAVE_DELAY * 2 ** attempt, MAX_RETRY_DELAY);
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    retryTimerRef.current = setTimeout(() => {
      void flushRef.current();
    }, delay);
  }, []);

  const reloadRemote = useCallback(async () => {
    try {
      const fresh = await queryClient.query({
        ...trpc.boards.get.queryOptions({ id: boardId }),
        staleTime: 0,
      });
      if (dirtyRef.current) return false;
      revRef.current = fresh.rev;
      store.loadSnapshot(fresh.snapshot as Parameters<Store["loadSnapshot"]>[0], "remote");
      dirtyRef.current = false;
      attemptRef.current = 0;
      reportStatus("saved");
      return true;
    } catch {
      reportStatus("error");
      return false;
    }
  }, [boardId, queryClient, reportStatus, store, trpc]);

  const syncIfIdle = useCallback(async () => {
    if (dirtyRef.current || flushingRef.current || pendingConflictRef.current || syncingRef.current)
      return;
    syncingRef.current = true;
    try {
      const fresh = await queryClient.query({
        ...trpc.boards.get.queryOptions({ id: boardId }),
        staleTime: 0,
      });
      if (dirtyRef.current || flushingRef.current || pendingConflictRef.current) return;
      if (fresh.rev === revRef.current) return;
      revRef.current = fresh.rev;
      store.loadSnapshot(fresh.snapshot as Parameters<Store["loadSnapshot"]>[0], "remote");
      reportStatus("saved");
    } catch {
      // stay on the local copy: we are clean, so nothing is lost; retried on next focus
    } finally {
      syncingRef.current = false;
    }
  }, [boardId, queryClient, reportStatus, store, trpc]);

  const resolvePendingConflict = useCallback(async () => {
    if (!pendingConflictRef.current) return;
    if (flushingRef.current) return;
    pendingConflictRef.current = false;
    dirtyRef.current = false;
    const reloaded = await reloadRemote();
    if (reloaded) {
      if (!unmountedRef.current) {
        toast.add({
          type: "info",
          description: "This board changed elsewhere. Reloaded the latest version.",
        });
      }
      return;
    }
    dirtyRef.current = true;
    reportStatus("error");
    if (!unmountedRef.current) {
      toast.add({
        type: "error",
        description: "Couldn't load the latest version. Your changes are still here.",
      });
    }
  }, [reloadRemote, reportStatus]);

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
        id: boardId,
        snapshot: store.getSnapshot(),
        rev: revRef.current,
      });

      revRef.current = result.rev;
      attemptRef.current = 0;
      reportStatus("saved");
    } catch (error) {
      const code = (error as { data?: { code?: string } } | null)?.data?.code;

      if (code === "CONFLICT") {
        if (document.visibilityState === "hidden") {
          pendingConflictRef.current = true;
          dirtyRef.current = true;
          reportStatus("error");
          return;
        }
        pendingConflictRef.current = false;
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
            description: "This board changed elsewhere. Reloaded the latest version.",
          });
        }
        return;
      }

      dirtyRef.current = true;
      reportStatus(onlineRef.current ? "error" : "offline");
      if (!unmountedRef.current) {
        toast.add({ type: "error", description: "Couldn't save your board. Retrying…" });
      }
      retry = true;
    } finally {
      flushingRef.current = false;
    }

    if (retry) scheduleRetry();
  }, [boardId, reloadRemote, reportStatus, scheduleRetry, store]);

  useEffect(() => {
    flushRef.current = flush;
  }, [flush]);

  useEffect(() => {
    syncIdleRef.current = syncIfIdle;
  }, [syncIfIdle]);

  useEffect(() => {
    resolveConflictRef.current = resolvePendingConflict;
  }, [resolvePendingConflict]);

  useImperativeHandle(ref, () => ({ flush }), [flush]);

  const handleChange = useCallback(
    (_diff: Diff, source: DiffSource) => {
      if (source !== "user") return;
      dirtyRef.current = true;
      reportStatus("dirty");
      scheduleSave();
      scheduleThumbnail();
    },
    [reportStatus, scheduleSave, scheduleThumbnail]
  );

  useEffect(() => {
    if (seededRef.current) return;
    seededRef.current = true;
    if (thumbnail == null) void sendThumbnailRef.current();
  }, [thumbnail]);

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
        void sendThumbnailRef.current();
        return;
      }
      if (pendingConflictRef.current) {
        void resolveConflictRef.current();
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
      if (thumbnailTimerRef.current) clearTimeout(thumbnailTimerRef.current);
      void flushRef.current();
      void sendThumbnailRef.current();
    };
  }, []);

  const theme = resolvedTheme === "dark" ? "dark" : "light";

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const pageFromClient = (
      editor: NonNullable<QuickdrawRef["editor"]>,
      clientX: number,
      clientY: number
    ) => {
      const rect = editor.container.getBoundingClientRect();
      const sx = clientX - rect.left;
      const sy = clientY - rect.top;
      return {
        x: Number.isFinite(sx) ? sx : rect.width / 2,
        y: Number.isFinite(sy) ? sy : rect.height / 2,
      };
    };

    const onWheel = (event: WheelEvent) => {
      const editor = qdRef.current?.editor;
      if (!editor) return;

      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
        event.stopPropagation();
        if (!Number.isFinite(event.deltaY)) return;
        const cam = editor.camera;
        if (
          !Number.isFinite(cam.x) ||
          !Number.isFinite(cam.y) ||
          !Number.isFinite(cam.z) ||
          cam.z <= 0
        ) {
          return;
        }
        const mult = Math.exp(-event.deltaY * ZOOM_K);
        if (!Number.isFinite(mult) || mult <= 0) return;
        const point = pageFromClient(editor, event.clientX, event.clientY);
        editor.zoomAt(point.x, point.y, mult);
        return;
      }

      if (!event.shiftKey) return;
      event.preventDefault();
      event.stopPropagation();
      const dx = event.deltaX !== 0 ? event.deltaX : event.deltaY;
      if (!Number.isFinite(dx)) return;
      editor.pan(-dx, 0);
    };

    wrap.addEventListener("wheel", onWheel, { capture: true, passive: false });
    return () => wrap.removeEventListener("wheel", onWheel, { capture: true });
  }, []);

  useEffect(() => {
    const editor = qdRef.current?.editor;
    if (!editor) return;
    const off = editor.on("camera", () => {
      const cam = editor.camera;
      if (
        !Number.isFinite(cam.x) ||
        !Number.isFinite(cam.y) ||
        !Number.isFinite(cam.z) ||
        cam.z <= 0
      ) {
        editor.setCamera({ x: 0, y: 0, z: 1 });
      }
    });
    return () => {
      off();
    };
  }, []);

  useEffect(() => {
    const editor = qdRef.current?.editor;
    const container = editor?.container;
    if (container) {
      container.focus({ preventScroll: true });
    }
  }, []);

  useEffect(() => {
    if (theme !== "dark") return;
    const editor = qdRef.current?.editor;
    if (!editor) return;
    const probe = document.createElement("div");
    probe.className = "dark";
    probe.style.display = "none";
    document.body.appendChild(probe);
    const background = getComputedStyle(probe).getPropertyValue("--background").trim();
    probe.remove();
    if (!background) return;
    THEMES.dark.background = background;
    editor.requestRender();
  }, [theme]);

  return (
    <div ref={wrapRef} className="relative h-full w-full overflow-hidden">
      <Quickdraw
        ref={qdRef}
        store={store}
        theme={theme}
        grid={grid}
        onChange={handleChange}
        onThemeChange={(next) => setTheme(next)}
        onGridChange={(next) => setGrid(next)}
        watermark={false}
        autoFit
      />
      <CanvasControls
        grid={grid}
        onGridChange={setGrid}
        onFit={fit}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onDownload={() => void download()}
      />
    </div>
  );
}
