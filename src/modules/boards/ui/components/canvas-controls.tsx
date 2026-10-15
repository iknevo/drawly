"use client";

import type { GridId } from "@quickdrawjs/react";
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
import { type ReactNode, useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export const GRID_OPTIONS: { id: GridId; label: string }[] = [
  { id: "none", label: "None" },
  { id: "lines", label: "Lines" },
  { id: "ruled", label: "Ruled" },
  { id: "dots", label: "Dots" },
  { id: "crosses", label: "Crosses" },
  { id: "iso", label: "Isometric" },
];

function ControlButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={<Button variant="ghost" size="icon-sm" aria-label={label} onClick={onClick} />}
      >
        {children}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

interface CanvasControlsProps {
  grid: GridId;
  onGridChange: (grid: GridId) => void;
  onFit: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onDownload?: () => void;
}

export function CanvasControls({
  grid,
  onGridChange,
  onFit,
  onZoomIn,
  onZoomOut,
  onDownload,
}: CanvasControlsProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const theme = resolvedTheme === "dark" ? "dark" : "light";

  return (
    <div className="bg-background/90 absolute right-3 bottom-3 flex items-center gap-0.5 rounded-lg border p-1 shadow-sm backdrop-blur">
      <ControlButton label="Zoom out" onClick={onZoomOut}>
        <MinusIcon />
      </ControlButton>
      <ControlButton label="Zoom in" onClick={onZoomIn}>
        <PlusIcon />
      </ControlButton>
      <ControlButton label="Fit to content" onClick={onFit}>
        <MaximizeIcon />
      </ControlButton>

      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger
            render={
              <DropdownMenuTrigger
                render={<Button variant="ghost" size="icon-sm" aria-label="Grid" />}
              />
            }
          >
            <Grid2x2Icon />
          </TooltipTrigger>
          <TooltipContent>Board Grid</TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="end">
          <DropdownMenuRadioGroup
            value={grid}
            onValueChange={(value) => onGridChange(value as GridId)}
          >
            <DropdownMenuLabel>Grid</DropdownMenuLabel>
            {GRID_OPTIONS.map((option) => (
              <DropdownMenuRadioItem key={option.id} value={option.id}>
                {option.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {onDownload && (
        <ControlButton label="Download PNG" onClick={onDownload}>
          <DownloadIcon />
        </ControlButton>
      )}

      <ControlButton
        label="Toggle theme"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      >
        {mounted && theme === "dark" ? <SunIcon /> : <MoonIcon />}
      </ControlButton>
    </div>
  );
}
