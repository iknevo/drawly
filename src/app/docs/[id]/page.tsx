import { cache } from "react";

import { auth } from "@/lib/auth";

import { DocDetailView } from "@/modules/docs/ui/views/doc-detail-view";
import { HydrateClient, caller, prefetch, trpc } from "@/trpc/server";

const getDoc = cache(async (id: string) => {
  try {
    return await caller.docs.get({ id });
  } catch {
    return null;
  }
});

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const doc = await getDoc(id);

  return {
    title: doc ? doc.title : "Doc",
    robots: { index: false, follow: false },
  };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  await auth.protect({ role: "user", redirectTo: `/docs/${id}` });

  prefetch(trpc.docs.get.queryOptions({ id }));

  return (
    <HydrateClient>
      <DocDetailView docId={id} />
    </HydrateClient>
  );
}
