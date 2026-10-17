"use client";

import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { markdown } from "@codemirror/lang-markdown";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { Compartment, EditorState } from "@codemirror/state";
import { EditorView, drawSelection, highlightActiveLine, keymap } from "@codemirror/view";
import { tags } from "@lezer/highlight";
import { vim } from "@replit/codemirror-vim";
import { useEffect, useRef } from "react";

const vimCompartment = new Compartment();

const highlightStyle = HighlightStyle.define([
  { tag: tags.heading, fontWeight: "600", color: "var(--foreground)" },
  { tag: tags.strong, fontWeight: "700" },
  { tag: tags.emphasis, fontStyle: "italic" },
  { tag: [tags.link, tags.url], color: "var(--primary)", textDecoration: "underline" },
  { tag: tags.monospace, color: "var(--muted-foreground)" },
  { tag: tags.quote, color: "var(--muted-foreground)", fontStyle: "italic" },
  {
    tag: [tags.processingInstruction, tags.punctuation, tags.contentSeparator],
    color: "var(--muted-foreground)",
  },
]);

const editorTheme = EditorView.theme({
  "&": {
    height: "100%",
    color: "var(--foreground)",
    backgroundColor: "transparent",
    fontSize: "0.875rem",
  },
  "&.cm-focused": { outline: "none" },
  ".cm-scroller": { fontFamily: "inherit", lineHeight: "1.5rem", overflow: "auto" },
  ".cm-content": {
    maxWidth: "48rem",
    margin: "0 auto",
    padding: "2.5rem 1.5rem",
    caretColor: "var(--foreground)",
  },
  ".cm-line": { padding: "0" },
  ".cm-gutters": { display: "none" },
  ".cm-activeLine": {
    backgroundColor: "color-mix(in oklab, var(--foreground) 4%, transparent)",
  },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground": {
    backgroundColor: "color-mix(in oklab, var(--primary) 25%, transparent)",
  },
  "& .cm-scroller.cm-vimMode .cm-selectionBackground": {
    backgroundColor: "color-mix(in oklab, var(--primary) 30%, transparent) !important",
  },
  ".cm-content ::selection": {
    backgroundColor: "color-mix(in oklab, var(--primary) 25%, transparent)",
  },
  ".cm-cursor, .cm-dropCursor": { borderLeftColor: "var(--foreground)" },
  ".cm-selectionMatch": {
    backgroundColor: "color-mix(in oklab, var(--primary) 20%, transparent)",
  },
  ".cm-vim-panel": {
    backgroundColor: "var(--popover)",
    color: "var(--popover-foreground)",
    borderTop: "1px solid var(--border)",
    padding: "0.375rem 0.75rem",
    fontFamily: "inherit",
    fontSize: "0.875rem",
  },
  ".cm-vim-panel input": {
    backgroundColor: "transparent",
    color: "var(--popover-foreground)",
    caretColor: "var(--foreground)",
    outline: "none",
    border: "0",
    fontFamily: "inherit",
    fontSize: "inherit",
    width: "100%",
  },
  ".cm-vim-message": {
    backgroundColor: "var(--popover)",
    color: "var(--popover-foreground)",
    borderTop: "1px solid var(--border)",
    padding: "0.375rem 0.75rem",
  },
  ".cm-tooltip": {
    backgroundColor: "var(--popover)",
    color: "var(--popover-foreground)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
  },
});

type MarkdownSourceEditorProps = {
  initialValue: string;
  vimEnabled: boolean;
  onChange: (value: string) => void;
};

export function MarkdownSourceEditor({
  initialValue,
  vimEnabled,
  onChange,
}: MarkdownSourceEditorProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const initialValueRef = useRef(initialValue);
  const initialVimRef = useRef(vimEnabled);

  useEffect(() => {
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const state = EditorState.create({
      doc: initialValueRef.current,
      extensions: [
        history(),
        drawSelection(),
        highlightActiveLine(),
        markdown(),
        EditorView.lineWrapping,
        vimCompartment.of(initialVimRef.current ? vim() : []),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        syntaxHighlighting(highlightStyle),
        editorTheme,
        EditorView.contentAttributes.of({ spellcheck: "false" }),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChangeRef.current(update.state.doc.toString());
          }
        }),
      ],
    });

    const view = new EditorView({
      state,
      parent: host,
    });
    viewRef.current = view;
    view.focus();

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  useEffect(() => {
    viewRef.current?.dispatch({
      effects: vimCompartment.reconfigure(vimEnabled ? vim() : []),
    });
  }, [vimEnabled]);

  return <div ref={hostRef} className="min-h-0 flex-1 overflow-hidden font-mono" />;
}
