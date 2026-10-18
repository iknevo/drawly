import { type SearchParams } from "nuqs/server";

import { auth } from "@/lib/auth";

import { loadSessionListParams } from "@/modules/sessions/server/search-params";
import { SessionsView } from "@/modules/sessions/ui/views/sessions-view";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Sessions",
  description: "Run focus sessions and pomodoro timers, and review your history.",
};

export default async function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await auth.protect({ role: "user", redirectTo: "/sessions" });

  const { page, size, q, sort } = loadSessionListParams(await searchParams);

  prefetch(trpc.sessions.list.queryOptions({ page, pageSize: Number(size), q, sort }));
  prefetch(trpc.sessions.stats.queryOptions());

  return (
    <HydrateClient>
      <SessionsView />
    </HydrateClient>
  );
}
