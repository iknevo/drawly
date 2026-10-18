"use client";

import { useState } from "react";
import { useTRPC } from "@/trpc/client";
import { toast } from "@/components/ui/toast";
import { useMutation } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SessionForm({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: { type: "timer" | "pomodoro"; name: string; targetSeconds: number }) => void;
}) {
  const trpc = useTRPC();
  const [type, setType] = useState<"timer" | "pomodoro">("timer");
  const [name, setName] = useState("Anonymous");
  const [targetSeconds, setTargetSeconds] = useState(0);

  const createSession = useMutation(
    trpc.sessions.create.mutationOptions({
      onSuccess: async () => {
        onOpenChange(false);
        onCreate({ type, name, targetSeconds });
      },
      onError: (error) => toast.add({ type: "error", description: error.message }),
    }),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger>
        <Button variant="outline" size="sm" className="hidden">
          Open
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New session</DialogTitle>
          <DialogDescription>Create a timer or Pomodoro session.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 p-4">
          <div className="flex items-center gap-2">
            <Label>Type</Label>
            <button
              type="button"
              onClick={() => setType("timer")}
              className={cn("px-3 py-1 rounded text-sm transition-colors", type === "timer" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}
            >
              Timer
            </button>
            <button
              type="button"
              onClick={() => setType("pomodoro")}
              className={cn("px-3 py-1 rounded text-sm transition-colors", type === "pomodoro" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}
            >
              Pomodoro
            </button>
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="session-name">Name</Label>
            <Input
              id="session-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Anonymous"
            />
          </div>
          {type === "timer" && (
            <div className="flex flex-col gap-1">
              <Label htmlFor="target-seconds">Target time (seconds, 0 = stopwatch)</Label>
              <Input
                id="target-seconds"
                type="number"
                value={targetSeconds}
                onChange={(e) => setTargetSeconds(Number(e.target.value))}
                placeholder="0"
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => createSession.mutate({ type, name, targetSeconds })}
            disabled={createSession.isPending}
          >
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
