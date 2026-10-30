# Drawly

Drawly is a personal productivity workspace that brings visual thinking, planning, documentation, and focused work sessions into one place. It combines an infinite drawing canvas, Kanban boards, rich-text/Markdown documents, and timers in a single authenticated Next.js application.

## Highlights

- **Infinite boards** for sketches, diagrams, wireframes, and visual notes
- **Public board sharing** for publishing a board without exposing the rest of the workspace
- **Kanban boards** with drag-and-drop cards, columns, due dates, and card details
- **Rich documents** with a Tiptap editor, Markdown source mode, live preview, tables, images, code blocks, and optional Vim keybindings
- **Focus sessions** with simple timers and configurable Pomodoro cycles
- **Authentication** with email verification, password reset, and social sign-in
- **PWA support** for an installable app-like experience
- **Keyboard-friendly navigation**, dark mode, sound feedback, and responsive layouts

## Tech stack

- Next.js 16 and React 19
- TypeScript
- tRPC and TanStack Query
- MongoDB with Mongoose
- Better Auth
- Tiptap and CodeMirror
- QuickDraw and dnd-kit
- Tailwind CSS 4 and shadcn/ui
- Zod, React Hook Form, and Framer Motion

## Getting started

### Prerequisites

- Node.js 20 or newer
- [Bun](https://bun.sh/)
- A MongoDB database

### Installation

```bash
git clone https://github.com/iknevo/drawly.git
cd drawly
bun install
cp .env.example .env
```

Fill in the values in `.env`, then start the development server:

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

| Variable | Purpose |
| --- | --- |
| `BETTER_AUTH_SECRET` | Secret used to sign Better Auth sessions |
| `BETTER_AUTH_URL` | Public URL of the application |
| `MONGODB_USERNAME` | MongoDB username, when using separate connection fields |
| `MONGODB_PASSWORD` | MongoDB password, when using separate connection fields |
| `MONGODB_URI` | MongoDB connection URI |
| `MONGODB_NAME` | MongoDB database name |
| `GMAIL_USER` / `GMAIL_APP_PASSWORD` | SMTP credentials for email delivery |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | GitHub OAuth credentials |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth credentials |
| `NEXT_PUBLIC_APP_URL` | Client-visible application URL |

The exact authentication providers enabled depend on which provider credentials are configured.

## Available scripts

| Command | Description |
| --- | --- |
| `bun run dev` | Start the development server |
| `bun run build` | Create a production build |
| `bun run start` | Start the production server |
| `bun run lint` | Run ESLint |
| `bun run typecheck` | Run TypeScript checks |
| `bun run format` | Format TypeScript and TSX files |

## Project structure

```text
src/
├── app/                 # Routes, authentication pages, and API handlers
├── components/          # Shared UI and application shell components
├── lib/                 # Authentication, database, search, and sound utilities
├── modules/
│   ├── boards/          # Infinite canvas boards and sharing
│   ├── docs/            # Rich documents and Markdown editing
│   ├── kanban/          # Drag-and-drop project boards
│   └── sessions/        # Timers and Pomodoro sessions
└── trpc/                # Typed server procedures and query helpers
```

## Design notes

Drawly keeps each workspace feature in its own module while sharing the same authentication, database, validation, and query layers. Server procedures are protected at the tRPC boundary, and list views use URL-backed filters and pagination so they remain shareable and navigable.

## License

[MIT](./LICENSE)
