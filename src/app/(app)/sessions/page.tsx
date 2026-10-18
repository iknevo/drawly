import { cache } from "react";

import { auth } from "@/lib/auth";

import { SessionsPage } from "@/components/session/sessions-page";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";
import { caller } from "@/trpc/server";

const getSessions = cache(async () => {
  try {
    return await caller.sessions.list({ page: 1, pageSize: 12 });
  } catch {
    return null;
  }
});

export default async function Page() {
  await auth.protect({ role: "user", redirectTo: "/sessions" });

  const sessions = await getSessions();

  prefetch(trpc.sessions.list.queryOptions({ page: 1, pageSize: 12 }));

  return (
    <HydrateClient>
      <SessionsPage initialSessions={sessions?.items ?? []} />
    </HydrateClient>
  );
}
