import { type SearchParams } from "nuqs/server";

import { auth } from "@/lib/auth";

import { loadDocListParams } from "@/modules/docs/server/search-params";
import { DocListView } from "@/modules/docs/ui/views/doc-list-view";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Docs",
};

export default async function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await auth.protect({ role: "user", redirectTo: "/docs" });

  const { page, size, q, sort } = loadDocListParams(await searchParams);

  prefetch(trpc.docs.list.queryOptions({ page, pageSize: Number(size), q, sort }));

  return (
    <HydrateClient>
      <DocListView />
    </HydrateClient>
  );
}
