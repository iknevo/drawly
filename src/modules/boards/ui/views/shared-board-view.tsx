"use client";

import { CanvasControls } from "../components/canvas-controls";
import { useBoardCamera } from "../hooks/use-board-camera";
import { type GridId, Quickdraw, type QuickdrawRef, Store, THEMES } from "@quickdrawjs/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Copy } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { authHref } from "@/lib/auth-redirect";
import { cn } from "@/lib/utils";

import { Button, buttonVariants } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";

import { useTRPC } from "@/trpc/client";

type SharedBoardViewProps = {
  boardId: string;
  title: string;
  snapshot: unknown;
  signedIn: boolean;
};

export function SharedBoardView({ boardId, title, snapshot, signedIn }: SharedBoardViewProps) {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { resolvedTheme } = useTheme();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const qdRef = useRef<QuickdrawRef>(null);
  const [grid, setGrid] = useState<GridId>("none");

  const cloneBoard = useMutation(
    trpc.boards.clone.mutationOptions({
      onSuccess: async ({ id }) => {
        await queryClient.invalidateQueries(trpc.boards.list.queryFilter());
        router.push(`/board/${id}`);
      },
      onError: (error) => toast.add({ type: "error", description: error.message }),
    })
  );

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

  const cloneHref = authHref("/auth/sign-up", `/s/${boardId}`);

  return (
    <div className="flex h-svh flex-col">
      <header className="flex items-center gap-3 border-b px-3 py-2">
        <span className="truncate text-sm font-medium">{title}</span>
        <div className="ml-auto flex items-center gap-2">
          <Link href="/boards" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
            Create your own
          </Link>
          {signedIn ? (
            <Button
              size="sm"
              disabled={cloneBoard.isPending}
              onClick={() => cloneBoard.mutate({ id: boardId })}
            >
              <Copy />
              Clone to my boards
            </Button>
          ) : (
            <Link href={cloneHref} className={cn(buttonVariants({ size: "sm" }))}>
              <Copy />
              Clone to my boards
            </Link>
          )}
        </div>
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
