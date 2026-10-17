"use client";

import { setPreviewEnabled } from "../lib/preview-mode";
import { EyeIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

export function PreviewToggle({ enabled }: { enabled: boolean }) {
  return (
    <Button
      variant={enabled ? "secondary" : "ghost"}
      size="xs"
      aria-pressed={enabled}
      aria-label="Toggle preview"
      title="Preview"
      onClick={() => setPreviewEnabled(!enabled)}
      className="gap-1.5 font-mono tracking-wider"
    >
      <EyeIcon className="size-3.5" />
      PREVIEW
    </Button>
  );
}
