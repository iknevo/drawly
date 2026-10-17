"use client";

import type { Editor } from "@tiptap/react";

import { Button } from "@/components/ui/button";

export function ToolbarButton({
  editor,
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  editor: Editor | null;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant={active ? "secondary" : "ghost"}
      size="icon-sm"
      aria-label={label}
      aria-pressed={active}
      disabled={!editor || disabled}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}
