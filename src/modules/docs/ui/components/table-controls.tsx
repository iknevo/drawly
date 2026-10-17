"use client";

import type { Editor } from "@tiptap/react";
import {
  ArrowDownToLineIcon,
  ArrowLeftToLineIcon,
  ArrowRightToLineIcon,
  ArrowUpToLineIcon,
  Columns3Icon,
  Rows3Icon,
  Table2Icon,
  Trash2Icon,
} from "lucide-react";

import { Separator } from "@/components/ui/separator";

import { ToolbarButton } from "./toolbar-button";

export function TableControls({ editor }: { editor: Editor }) {
  return (
    <div className="flex flex-wrap items-center gap-0.5">
      <ToolbarButton
        editor={editor}
        label="Add row above"
        onClick={() => editor.chain().focus().addRowBefore().run()}
      >
        <ArrowUpToLineIcon />
      </ToolbarButton>
      <ToolbarButton
        editor={editor}
        label="Add row below"
        onClick={() => editor.chain().focus().addRowAfter().run()}
      >
        <ArrowDownToLineIcon />
      </ToolbarButton>
      <ToolbarButton
        editor={editor}
        label="Delete row"
        onClick={() => editor.chain().focus().deleteRow().run()}
      >
        <Rows3Icon />
      </ToolbarButton>

      <Separator className="mx-1" orientation="vertical" />

      <ToolbarButton
        editor={editor}
        label="Add column left"
        onClick={() => editor.chain().focus().addColumnBefore().run()}
      >
        <ArrowLeftToLineIcon />
      </ToolbarButton>
      <ToolbarButton
        editor={editor}
        label="Add column right"
        onClick={() => editor.chain().focus().addColumnAfter().run()}
      >
        <ArrowRightToLineIcon />
      </ToolbarButton>
      <ToolbarButton
        editor={editor}
        label="Delete column"
        onClick={() => editor.chain().focus().deleteColumn().run()}
      >
        <Columns3Icon />
      </ToolbarButton>

      <Separator className="mx-1" orientation="vertical" />

      <ToolbarButton
        editor={editor}
        label="Toggle header row"
        onClick={() => editor.chain().focus().toggleHeaderRow().run()}
      >
        <Table2Icon />
      </ToolbarButton>
      <ToolbarButton
        editor={editor}
        label="Delete table"
        onClick={() => editor.chain().focus().deleteTable().run()}
      >
        <Trash2Icon />
      </ToolbarButton>
    </div>
  );
}
