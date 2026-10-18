"use client";

import { useState } from "react";
import { useTRPC } from "@/trpc/client";
import { toast } from "@/components/ui/toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

import { SessionView } from "./session-view";
import { SessionForm } from "./session-form";
import { SessionList } from "./session-list";
import { SessionEmptyState } from "./session-empty-state";

export function SessionsPage({ initialSessions }: { initialSessions: any[] }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [sessions] = useState(initialSessions);
  const [creating, setCreating] = useState(false);

  const createSession = useMutation(
    trpc.sessions.create.mutationOptions({
      onSuccess: async () => {
        setCreating(false);
        await queryClient.invalidateQueries(trpc.sessions.list.queryFilter());
      },
      onError: (error) => toast.add({ type: "error", description: error.message }),
    }),
  );

  const handleCreate = (data: { type: "timer" | "pomodoro"; name: string; targetSeconds: number }) => {
    createSession.mutate(data);
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-6 lg:p-10">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-medium tracking-tight">Sessions</h1>
        <p className="text-muted-foreground text-sm">
          Track time with timers and Pomodoro sessions.
        </p>
      </div>

      <div className="flex gap-4">
        <Button size="sm" onClick={() => setCreating(true)} disabled={creating}>
          <PlusIcon />
          New session
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="col-span-1 lg:col-span-2">
          <SessionView />
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold">History</h2>
          {sessions.length === 0 ? (
            <SessionEmptyState />
          ) : (
            <SessionList sessions={sessions} />
          )}
        </div>
      </div>

      <SessionForm open={creating} onOpenChange={setCreating} onCreate={handleCreate} />
    </div>
  );
}
