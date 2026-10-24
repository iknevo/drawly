import { notFound } from "next/navigation";
import { cache } from "react";

import { auth } from "@/lib/auth";

import { SessionDetailView } from "@/modules/sessions/ui/views/session-detail-view";
import { HydrateClient, caller, prefetch, trpc } from "@/trpc/server";

const getSession = cache(async (id: string) => {
  try {
    return await caller.sessions.get({ id });
  } catch {
    return null;
  }
});

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession(id);

  return {
    title: session ? `${session.name} • Sessions` : "Session",
    robots: { index: false, follow: false },
  };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  await auth.protect({ role: "user", redirectTo: `/sessions/${id}` });

  const session = await getSession(id);
  if (!session) notFound();

  prefetch(trpc.sessions.get.queryOptions({ id }));

  return (
    <HydrateClient>
      <SessionDetailView sessionId={id} />
    </HydrateClient>
  );
}
