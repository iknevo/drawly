<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Component files

One component per file. A file may define at most **two** components only when the second is the base component's skeleton (e.g. `DocCard` + `DocCardSkeleton`). The Suspense pattern is limited to **three**: `XView` (entry) + `XViewSuspense` (the suspended content) + `XViewSkeleton` (the fallback). Everything else — toolbars, buttons, menus, badges, shells, thumbnails — gets its own file under the module's `ui/components/`.

Non-component helpers stay in the component file when used only there; move them out only when shared across multiple places. Applies to module and app code, not the shadcn primitives in `src/components/ui/`.

