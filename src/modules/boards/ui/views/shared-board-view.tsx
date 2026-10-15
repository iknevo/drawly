"use client";

import { CanvasControls } from "../components/canvas-controls";
import { useBoardCamera } from "../hooks/use-board-camera";
import { type GridId, Quickdraw, type QuickdrawRef, Store, THEMES } from "@quickdrawjs/react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import { buttonVariants } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";

type SharedBoardViewProps = {
  title: string;
  snapshot: unknown;
  signedIn: boolean;
};

export function SharedBoardView({ title, snapshot, signedIn }: SharedBoardViewProps) {
  const { resolvedTheme } = useTheme();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const qdRef = useRef<QuickdrawRef>(null);
  const [grid, setGrid] = useState<GridId>("none");

  const store = useMemo(() => {
    const next = new Store();
    if (snapshot) next.loadSnapshot(snapshot as Parameters<Store["loadSnapshot"]>[0], "remote");
    return next;
  }, [snapshot]);

  const theme = resolvedTheme === "dark" ? "dark" : "light";

  const { fit, zoomIn, zoomOut } = useBoardCamera({ wrapperRef, qdRef });

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

  const download = async () => {
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
  };

  return (
    <div className="flex h-svh flex-col">
      <header className="flex items-center gap-3 border-b px-3 py-2">
        <span className="truncate text-sm font-medium">{title}</span>
        <Link
          href={signedIn ? "/boards" : "/auth/sign-up"}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "ml-auto")}
        >
          Create your own
        </Link>
      </header>

      <div className="relative min-h-0 flex-1">
        <div ref={wrapperRef} className="relative h-full w-full overflow-hidden">
          <Quickdraw
            ref={qdRef}
            store={store}
            readonly
            autoFit
            theme={theme}
            grid={grid}
            watermark={false}
          />
        </div>

        <CanvasControls
          grid={grid}
          onGridChange={setGrid}
          onFit={fit}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onDownload={() => void download()}
        />
      </div>
    </div>
  );
}
