"use client";

import { useBoardCamera } from "../hooks/use-board-camera";
import { type GridId, Quickdraw, type QuickdrawRef, Store, THEMES } from "@quickdrawjs/react";
import {
  DownloadIcon,
  Grid2x2Icon,
  MaximizeIcon,
  MinusIcon,
  MoonIcon,
  PlusIcon,
  SunIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

import { cn } from "@/lib/utils";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/toast";

const GRID_OPTIONS: { id: GridId; label: string }[] = [
  { id: "none", label: "None" },
  { id: "lines", label: "Lines" },
  { id: "ruled", label: "Ruled" },
  { id: "dots", label: "Dots" },
  { id: "crosses", label: "Crosses" },
  { id: "iso", label: "Isometric" },
];

type SharedBoardViewProps = {
  title: string;
  snapshot: unknown;
  signedIn: boolean;
};

export function SharedBoardView({ title, snapshot, signedIn }: SharedBoardViewProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const qdRef = useRef<QuickdrawRef>(null);
  const [grid, setGrid] = useState<GridId>("none");
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
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

        <div className="bg-background/90 absolute right-3 bottom-3 flex items-center gap-0.5 rounded-lg border p-1 shadow-sm backdrop-blur">
          <Button variant="ghost" size="icon-sm" aria-label="Zoom out" onClick={zoomOut}>
            <MinusIcon />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Zoom in" onClick={zoomIn}>
            <PlusIcon />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Fit to content" onClick={fit}>
            <MaximizeIcon />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon-sm" aria-label="Backdrop" />}
            >
              <Grid2x2Icon />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuRadioGroup
                value={grid}
                onValueChange={(value) => setGrid(value as GridId)}
              >
                <DropdownMenuLabel>Backdrop</DropdownMenuLabel>
                {GRID_OPTIONS.map((option) => (
                  <DropdownMenuRadioItem key={option.id} value={option.id}>
                    {option.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="icon-sm" aria-label="Download PNG" onClick={download}>
            <DownloadIcon />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Toggle theme"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {mounted && theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </Button>
        </div>
      </div>
    </div>
  );
}
