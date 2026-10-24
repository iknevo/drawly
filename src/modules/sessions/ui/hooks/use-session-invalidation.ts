"use client";

import { useQueryClient } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";

export function useSessionInvalidation() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return async (id?: string) => {
    await Promise.all([
      queryClient.invalidateQueries(trpc.sessions.list.queryFilter()),
      queryClient.invalidateQueries(trpc.sessions.stats.queryFilter()),
      ...(id
        ? [queryClient.invalidateQueries(trpc.sessions.get.queryFilter({ id }))]
        : []),
    ]);
  };
}
