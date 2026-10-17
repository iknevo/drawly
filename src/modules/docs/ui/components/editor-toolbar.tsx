"use client";

import type { Editor } from "@tiptap/react";
import {
  BoldIcon,
  CodeIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  ImageIcon,
  ItalicIcon,
  LinkIcon,
  ListIcon,
  ListOrderedIcon,
  ListTodoIcon,
  QuoteIcon,
  Redo2Icon,
  SquareCodeIcon,
  StrikethroughIcon,
  TableIcon,
  Undo2Icon,
} from "lucide-react";

import { Separator } from "@/components/ui/separator";

import { TableControls } from "./table-controls";
import { ToolbarButton } from "./toolbar-button";

type EditorToolbarProps = {
  editor: Editor | null;
};

export function EditorToolbar({ editor }: EditorToolbarProps) {
  if (!editor) return null;

  const setLink = () => {
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", previous ?? "https://");

    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const setImage = () => {
    const previous = editor.getAttributes("image").src as string | undefined;
    const url = window.prompt("Image URL", previous ?? "https://");

    if (!url) return;
    editor.chain().focus().setImage({ src: url }).run();
  };

  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-0.5">
        <ToolbarButton
          editor={editor}
          label="Undo"
          disabled={!editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo2Icon />
        </ToolbarButton>
        <ToolbarButton
          editor={editor}
          label="Redo"
          disabled={!editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo2Icon />
        </ToolbarButton>

        <Separator orientation="vertical" className="mx-1 h-5" />

        <ToolbarButton
          editor={editor}
          label="Heading 1"
          active={editor.isActive("heading", { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          <Heading1Icon />
        </ToolbarButton>
        <ToolbarButton
          editor={editor}
          label="Heading 2"
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2Icon />
        </ToolbarButton>
        <ToolbarButton
          editor={editor}
          label="Heading 3"
          active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3Icon />
        </ToolbarButton>

        <Separator className="mx-1" orientation="vertical" />

        <ToolbarButton
          editor={editor}
          label="Bold"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <BoldIcon />
        </ToolbarButton>
        <ToolbarButton
          editor={editor}
          label="Italic"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <ItalicIcon />
        </ToolbarButton>
        <ToolbarButton
          editor={editor}
          label="Underline"
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <span className="text-sm font-semibold">U</span>
        </ToolbarButton>
        <ToolbarButton
          editor={editor}
          label="Strikethrough"
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <StrikethroughIcon />
        </ToolbarButton>
        <ToolbarButton
          editor={editor}
          label="Inline code"
          active={editor.isActive("code")}
          onClick={() => editor.chain().focus().toggleCode().run()}
        >
          <CodeIcon />
        </ToolbarButton>
        <ToolbarButton
          editor={editor}
          label="Link"
          active={editor.isActive("link")}
          onClick={setLink}
        >
          <LinkIcon />
        </ToolbarButton>

        <Separator className="mx-1" orientation="vertical" />

        <ToolbarButton
          editor={editor}
          label="Bullet list"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <ListIcon />
        </ToolbarButton>
        <ToolbarButton
          editor={editor}
          label="Numbered list"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrderedIcon />
        </ToolbarButton>
        <ToolbarButton
          editor={editor}
          label="Task list"
          active={editor.isActive("taskList")}
          onClick={() => editor.chain().focus().toggleTaskList().run()}
        >
          <ListTodoIcon />
        </ToolbarButton>
        <ToolbarButton
          editor={editor}
          label="Blockquote"
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <QuoteIcon />
        </ToolbarButton>
        <ToolbarButton
          editor={editor}
          label="Code block"
          active={editor.isActive("codeBlock")}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          <SquareCodeIcon />
        </ToolbarButton>

        <Separator className="mx-1" orientation="vertical" />

        <ToolbarButton
          editor={editor}
          label="Insert table"
          active={editor.isActive("table")}
          onClick={insertTable}
        >
          <TableIcon />
        </ToolbarButton>
        <ToolbarButton editor={editor} label="Insert image" onClick={setImage}>
          <ImageIcon />
        </ToolbarButton>
      </div>

      {editor.isActive("table") ? (
        <div className="border-border border-t pt-1">
          <TableControls editor={editor} />
        </div>
      ) : null}
    </div>
  );
}
