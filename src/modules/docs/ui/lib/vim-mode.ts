import { type Editor, Extension } from "@tiptap/core";
import type { EditorState } from "@tiptap/pm/state";
import type { EditorProps, EditorView } from "@tiptap/pm/view";
import { DecorationSet } from "@tiptap/pm/view";
import { useSyncExternalStore } from "react";
import { createVimPlugin, getVimStateFromEditorState } from "vim-prosemirror";

const VIM_STORAGE_KEY = "drawly.docs.vim-enabled";

let current = false;
let initialized = false;
const listeners = new Set<() => void>();

function init() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  try {
    current = window.localStorage.getItem(VIM_STORAGE_KEY) === "true";
  } catch {
    current = false;
  }
}

function subscribe(listener: () => void) {
  init();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  init();
  return current;
}

function getServerSnapshot() {
  return false;
}

export function setVimEnabled(enabled: boolean) {
  init();
  current = enabled;
  try {
    window.localStorage.setItem(VIM_STORAGE_KEY, String(enabled));
  } catch {
    // storage unavailable (private mode, quota) — keep the in-memory value
  }
  for (const listener of listeners) listener();
}

export function useVimEnabled() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Reset the editor to insert mode. Used to establish the insert default when
 * vim is enabled, since the underlying plugin always starts in normal mode.
 */
export function forceInsertMode(editor: Editor): void {
  const vimState = getVimStateFromEditorState(editor.state);
  if (!vimState || vimState.mode === "insert") return;
  vimState.mode = "insert";
}

type KeyDown = (view: EditorView, event: KeyboardEvent) => boolean | void;
type MouseUp = (view: EditorView, event: Event) => boolean | void;
type TextInput = (view: EditorView, from: number, to: number, text: string) => boolean | void;
type Attributes = (state: EditorState) => Record<string, string>;
type Decorations = (state: EditorState) => DecorationSet;

/**
 * Vim keybindings behind a runtime toggle.
 *
 * Tiptap v3's `editor.setOptions` does not rebuild the plugin set, and
 * remounting the editor would discard unsaved autosave state, so instead we
 * always register the vim plugin and gate every behavior behind the enabled
 * store. When disabled the editor behaves exactly like a plain editor.
 */
export function createDocVimExtension() {
  return Extension.create({
    name: "docVim",
    addProseMirrorPlugins() {
      const editor = this.editor;
      const plugin = createVimPlugin({
        undo: () => editor.commands.undo(),
        redo: () => editor.commands.redo(),
        indent: () => {
          try {
            return editor.commands.sinkListItem("listItem");
          } catch {
            return false;
          }
        },
        outdent: () => {
          try {
            return editor.commands.liftListItem("listItem");
          } catch {
            return false;
          }
        },
      });

      const enabled = () => getSnapshot();
      const props = plugin.props as EditorProps;

      const handleKeyDown = props.handleKeyDown as unknown as KeyDown | undefined;
      const handleTextInput = props.handleTextInput as unknown as TextInput | undefined;
      const handleMouseUp = props.handleDOMEvents?.mouseup as unknown as MouseUp | undefined;
      const attributes = props.attributes as unknown as Attributes | undefined;
      const decorations = props.decorations as unknown as Decorations | undefined;

      props.handleKeyDown = (view, event) =>
        enabled() && handleKeyDown ? (handleKeyDown(view, event) ?? false) : false;
      props.handleTextInput = (view, from, to, text) =>
        enabled() && handleTextInput ? (handleTextInput(view, from, to, text) ?? false) : false;
      props.handleDOMEvents = {
        ...props.handleDOMEvents,
        mouseup: (view, event) =>
          enabled() && handleMouseUp ? (handleMouseUp(view, event) ?? false) : false,
      };
      props.attributes = (state) => (enabled() ? (attributes?.(state) ?? {}) : {});
      props.decorations = (state) =>
        enabled() ? (decorations?.(state) ?? DecorationSet.empty) : DecorationSet.empty;

      return [plugin];
    },
  });
}
