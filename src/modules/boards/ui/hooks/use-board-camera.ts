"use client";

import type { Camera, QuickdrawRef } from "@quickdrawjs/react";
import { useCallback, useEffect, useRef } from "react";

const ZOOM_K = 0.012;
const ZOOM_STEP = 1.2;
const MIN_DIST = 1;

type Point = { x: number; y: number };

type UseBoardCameraOptions = {
  wrapperRef: React.RefObject<HTMLDivElement | null>;
  qdRef: React.RefObject<QuickdrawRef | null>;
  enabled?: boolean;
};

type PinchState = { dist: number; center: Point; cam: Camera };

function distance(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y) || MIN_DIST;
}

function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  );
}

/**
 * Camera controls for a `readonly` Quickdraw editor. The editor ignores all
 * pointer/wheel input in readonly mode, so pan/zoom is layered on top using
 * the public camera API (`pan`/`zoomAt`/`setCamera`/`fitContent`).
 */
export function useBoardCamera({ wrapperRef, qdRef, enabled = true }: UseBoardCameraOptions) {
  const pointersRef = useRef(new Map<number, Point>());
  const panRef = useRef<Point | null>(null);
  const pinchRef = useRef<PinchState | null>(null);

  const fit = useCallback(() => {
    qdRef.current?.editor?.fitContent({ animate: 200 });
  }, [qdRef]);

  const zoomBy = useCallback(
    (mult: number) => {
      const editor = qdRef.current?.editor;
      if (!editor) return;
      const { w, h } = editor.viewSize();
      editor.zoomAt(w / 2, h / 2, mult, { animate: 140 });
    },
    [qdRef]
  );

  const zoomIn = useCallback(() => zoomBy(ZOOM_STEP), [zoomBy]);
  const zoomOut = useCallback(() => zoomBy(1 / ZOOM_STEP), [zoomBy]);

  useEffect(() => {
    const wrap = wrapperRef.current;
    if (!wrap || !enabled) return;

    const editor = () => qdRef.current?.editor ?? null;
    const pointers = pointersRef.current;

    const localPoint = (clientX: number, clientY: number): Point => {
      const rect = wrap.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      return {
        x: Number.isFinite(x) ? x : rect.width / 2,
        y: Number.isFinite(y) ? y : rect.height / 2,
      };
    };

    const onWheel = (event: WheelEvent) => {
      const ed = editor();
      if (!ed) return;
      event.preventDefault();
      event.stopPropagation();

      if (event.ctrlKey || event.metaKey) {
        if (!Number.isFinite(event.deltaY)) return;
        const cam = ed.camera;
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
        const point = localPoint(event.clientX, event.clientY);
        ed.zoomAt(point.x, point.y, mult);
        return;
      }

      const dx = event.deltaX !== 0 ? event.deltaX : 0;
      const dy = event.deltaY;
      if (!Number.isFinite(dx) || !Number.isFinite(dy)) return;
      ed.pan(-dx, -dy);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey) return;
      if (!(event.ctrlKey || event.metaKey)) return;
      if (isTypingTarget(event.target)) return;

      const { key } = event;

      if (key === "+" || key === "=") {
        event.preventDefault();
        zoomIn();
      } else if (key === "-" || key === "_") {
        event.preventDefault();
        zoomOut();
      } else if (key === "0") {
        event.preventDefault();
        fit();
      }
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0 && event.button !== 1) return;
      const ed = editor();
      if (!ed) return;

      pointersRef.current.set(event.pointerId, localPoint(event.clientX, event.clientY));
      try {
        wrap.setPointerCapture(event.pointerId);
      } catch {}

      if (pointersRef.current.size === 1) {
        pinchRef.current = null;
        panRef.current = localPoint(event.clientX, event.clientY);
        wrap.style.cursor = "grabbing";
      } else if (pointersRef.current.size === 2) {
        const [a, b] = [...pointersRef.current.values()];
        pinchRef.current = { dist: distance(a, b), center: midpoint(a, b), cam: { ...ed.camera } };
        panRef.current = null;
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!pointersRef.current.has(event.pointerId)) return;
      const ed = editor();
      if (!ed) return;

      pointersRef.current.set(event.pointerId, localPoint(event.clientX, event.clientY));

      if (pointersRef.current.size >= 2) {
        const [a, b] = [...pointersRef.current.values()];
        const dist = distance(a, b);
        const center = midpoint(a, b);
        const start = pinchRef.current;
        if (start && start.dist > MIN_DIST && dist > MIN_DIST) {
          const z = start.cam.z * (dist / start.dist);
          if (Number.isFinite(z) && z > 0) {
            const p0 = {
              x: start.center.x / start.cam.z - start.cam.x,
              y: start.center.y / start.cam.z - start.cam.y,
            };
            ed.setCamera({ z, x: center.x / z - p0.x, y: center.y / z - p0.y });
          }
        }
        return;
      }

      const prev = panRef.current;
      if (!prev) return;
      const cur = localPoint(event.clientX, event.clientY);
      ed.pan(cur.x - prev.x, cur.y - prev.y);
      panRef.current = cur;
    };

    const onPointerUp = (event: PointerEvent) => {
      pointersRef.current.delete(event.pointerId);
      if (pointersRef.current.size < 2) pinchRef.current = null;
      if (pointersRef.current.size === 1) {
        panRef.current = [...pointersRef.current.values()][0];
      } else if (pointersRef.current.size === 0) {
        panRef.current = null;
        wrap.style.cursor = "grab";
      }
    };

    const previousCursor = wrap.style.cursor;
    const previousTouchAction = wrap.style.touchAction;
    wrap.style.cursor = "grab";
    wrap.style.touchAction = "none";

    wrap.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKeyDown, { capture: true });
    wrap.addEventListener("pointerdown", onPointerDown);
    wrap.addEventListener("pointermove", onPointerMove);
    wrap.addEventListener("pointerup", onPointerUp);
    wrap.addEventListener("pointercancel", onPointerUp);

    return () => {
      wrap.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKeyDown, { capture: true });
      wrap.removeEventListener("pointerdown", onPointerDown);
      wrap.removeEventListener("pointermove", onPointerMove);
      wrap.removeEventListener("pointerup", onPointerUp);
      wrap.removeEventListener("pointercancel", onPointerUp);
      wrap.style.cursor = previousCursor;
      wrap.style.touchAction = previousTouchAction;
      pointers.clear();
      panRef.current = null;
      pinchRef.current = null;
    };
  }, [enabled, fit, qdRef, wrapperRef, zoomIn, zoomOut]);

  return { fit, zoomIn, zoomOut };
}
