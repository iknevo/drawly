"use client";

import {
  type Diff,
  type DiffSource,
  type GridId,
  Quickdraw,
  type QuickdrawRef,
  Store,
  THEMES,
} from "@quickdrawjs/react";
import { useMutation } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { toast } from "@/components/ui/toast";

import { useTRPC } from "@/trpc/client";

const SAVE_DELAY = 1000;
const THUMBNAIL_INTERVAL = 2000;

type QuickdrawCanvasProps = {
  boardId: string;
  snapshot: unknown;
};

async function blobToDataURL(blob: Blob): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export function QuickdrawCanvas({ boardId, snapshot }: QuickdrawCanvasProps) {
  const trpc = useTRPC();
  const { resolvedTheme, setTheme } = useTheme();
  const [grid, setGrid] = useState<GridId>("dots");

  const store = useMemo(() => {
    const next = new Store();
    if (snapshot) next.loadSnapshot(snapshot as Parameters<Store["loadSnapshot"]>[0], "remote");
    return next;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId]);

  const save = useMutation(trpc.boards.save.mutationOptions());

  const saveRef = useRef(save.mutateAsync);
  useEffect(() => {
    saveRef.current = save.mutateAsync;
  });

  const qdRef = useRef<QuickdrawRef>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flushingRef = useRef(false);
  const dirtyRef = useRef(false);
  const unmountedRef = useRef(false);
  const thumbnailRef = useRef<string | null | undefined>(undefined);
  const lastThumbnailAtRef = useRef(0);
  const flushRef = useRef<(force?: boolean) => Promise<void>>(async () => {});

  const captureThumbnail = useCallback(async (): Promise<string | null | undefined> => {
    const editor = qdRef.current?.editor;
    if (!editor) return undefined;
    try {
      const blob = await editor.exportImage({ background: true, scale: 0.25 });
      return blob ? await blobToDataURL(blob) : null;
    } catch {
      return undefined;
    }
  }, []);

  const scheduleSave = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      void flushRef.current();
    }, SAVE_DELAY);
  }, []);

  const flush = useCallback(
    async (force = false) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (flushingRef.current || !dirtyRef.current) return;

      dirtyRef.current = false;
      flushingRef.current = true;

      try {
        if (force || Date.now() - lastThumbnailAtRef.current >= THUMBNAIL_INTERVAL) {
          const captured = await captureThumbnail();
          if (captured !== undefined) {
            thumbnailRef.current = captured;
            lastThumbnailAtRef.current = Date.now();
          }
        }

        await saveRef.current({
          id: boardId,
          snapshot: store.getSnapshot(),
          thumbnail: thumbnailRef.current,
        });
      } catch {
        dirtyRef.current = true;
        if (!unmountedRef.current) {
          toast.add({ type: "error", description: "Couldn't save your board. Retrying…" });
        }
      } finally {
        flushingRef.current = false;
        if (dirtyRef.current && !unmountedRef.current) scheduleSave();
      }
    },
    [boardId, captureThumbnail, scheduleSave, store]
  );

  useEffect(() => {
    flushRef.current = flush;
  }, [flush]);

  const handleChange = useCallback(
    (_diff: Diff, source: DiffSource) => {
      if (source !== "user") return;
      dirtyRef.current = true;
      scheduleSave();
    },
    [scheduleSave]
  );

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden") void flushRef.current(true);
    };
    window.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onVisibility);

    return () => {
      window.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onVisibility);
      unmountedRef.current = true;
      if (timerRef.current) clearTimeout(timerRef.current);
      void flushRef.current(true);
    };
  }, []);

  const theme = resolvedTheme === "dark" ? "dark" : "light";

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
    <div className="relative h-full w-full overflow-hidden">
      <Quickdraw
        ref={qdRef}
        store={store}
        theme={theme}
        grid={grid}
        onChange={handleChange}
        onThemeChange={(next) => setTheme(next)}
        onGridChange={(next) => setGrid(next)}
        watermark={false}
      />
    </div>
  );
}
