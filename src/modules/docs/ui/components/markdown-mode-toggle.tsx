"use client";

import { setMarkdownMode } from "../lib/markdown-mode";

import { Button } from "@/components/ui/button";

export function MarkdownModeToggle({ enabled }: { enabled: boolean }) {
  return (
    <Button
      variant={enabled ? "secondary" : "ghost"}
      size="xs"
      aria-pressed={enabled}
      aria-label="Toggle markdown mode"
      title="Markdown mode"
      onClick={() => setMarkdownMode(!enabled)}
      className="font-mono tracking-wider"
    >
      MD
    </Button>
  );
}
