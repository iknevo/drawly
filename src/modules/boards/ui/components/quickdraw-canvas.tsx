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
import { useTheme } from "next-themes";
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

export type SaveStatus = "saved" | "dirty" | "saving" | "error" | "conflict" | "offline";

export type QuickdrawCanvasHandle = {
  reloadRemote: () => Promise<void>;
  overwrite: () => Promise<void>;
};

type QuickdrawCanvasProps = {
  boardId: string;
  snapshot: unknown;
  rev: string;
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
        void queryClient.invalidateQueries(trpc.boards.list.queryOptions());
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

  const tabIdRef = useRef("");
  const channelRef = useRef<BroadcastChannel | null>(null);
  const revRef = useRef(rev);
  const statusRef = useRef<SaveStatus>("saved");
  const onlineRef = useRef(true);
  const attemptRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flushingRef = useRef(false);
  const dirtyRef = useRef(false);
  const conflictRef = useRef(false);
  const unmountedRef = useRef(false);
  const thumbnailRef = useRef<string | null | undefined>(undefined);
  const thumbnailTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sendingThumbnailRef = useRef(false);
  const seededRef = useRef(false);

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

  const flushRef = useRef<(options?: { forceRev?: boolean }) => Promise<void>>(async () => {});

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

  const flush = useCallback(
    async (options: { forceRev?: boolean } = {}) => {
      const forceRev = options.forceRev ?? false;

      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }

      if (flushingRef.current) return;
      if (conflictRef.current && !forceRev) {
        reportStatus("conflict");
        return;
      }
      if (!dirtyRef.current && !forceRev) return;
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
          ...(forceRev ? { force: true } : {}),
        });

        revRef.current = result.rev;
        attemptRef.current = 0;
        conflictRef.current = false;
        reportStatus("saved");
        channelRef.current?.postMessage({
          type: "saved",
          boardId,
          rev: result.rev,
          tabId: tabIdRef.current,
        });
      } catch (error) {
        const code = (error as { data?: { code?: string } } | null)?.data?.code;

        if (code === "CONFLICT") {
          dirtyRef.current = true;
          conflictRef.current = true;
          reportStatus("conflict");
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
    },
    [boardId, reportStatus, scheduleRetry, store]
  );

  useEffect(() => {
    flushRef.current = flush;
  }, [flush]);

  const reloadRemote = useCallback(async () => {
    try {
      const fresh = await queryClient.query(trpc.boards.get.queryOptions({ id: boardId }));
      revRef.current = fresh.rev;
      store.loadSnapshot(fresh.snapshot as Parameters<Store["loadSnapshot"]>[0], "remote");
      dirtyRef.current = false;
      conflictRef.current = false;
      attemptRef.current = 0;
      reportStatus("saved");
    } catch {
      reportStatus("error");
    }
  }, [boardId, queryClient, reportStatus, store, trpc]);

  const overwrite = useCallback(async () => {
    conflictRef.current = false;
    dirtyRef.current = true;
    await flushRef.current({ forceRev: true });
    void sendThumbnailRef.current();
  }, []);

  useImperativeHandle(ref, () => ({ reloadRemote, overwrite }), [reloadRemote, overwrite]);

  const handleChange = useCallback(
    (_diff: Diff, source: DiffSource) => {
      if (source !== "user") return;
      if (conflictRef.current) {
        reportStatus("conflict");
        return;
      }
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
    if (typeof BroadcastChannel === "undefined") return;
    const tabId =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2);
    tabIdRef.current = tabId;
    const channel = new BroadcastChannel(`drawly-board-${boardId}`);
    channelRef.current = channel;
    channel.onmessage = (event) => {
      const message = event.data as
        { type?: string; boardId?: string; rev?: string; tabId?: string } | undefined;
      if (
        !message ||
        message.type !== "saved" ||
        message.boardId !== boardId ||
        message.tabId === tabId ||
        message.rev === revRef.current
      ) {
        return;
      }
      if (dirtyRef.current) {
        conflictRef.current = true;
        reportStatus("conflict");
        return;
      }
      void reloadRemote();
    };
    return () => {
      channel.close();
      channelRef.current = null;
    };
  }, [boardId, reloadRemote, reportStatus]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState !== "hidden") return;
      void flushRef.current();
      void sendThumbnailRef.current();
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
