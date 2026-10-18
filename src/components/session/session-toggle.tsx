"use client";

import { useState, useEffect, useRef } from "react";
import { useTRPC } from "@/trpc/client";
import { cn } from "@/lib/utils";
import { Play, Pause, RefreshCw } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "@/components/ui/toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function SessionToggle() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<"idle" | "running" | "paused">("idle");
  const [elapsed, setElapsed] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const pausedTimeRef = useRef<number>(0);

  const createSession = useMutation(
    trpc.sessions.create.mutationOptions({
      onSuccess: ({ id }) => {
        setSessionId(id);
      },
      onError: (error) => toast.add({ type: "error", description: error.message }),
    }),
  );

  const updateSession = useMutation(
    trpc.sessions.update.mutationOptions({
      onError: (error) => toast.add({ type: "error", description: error.message }),
    }),
  );

  const completeSession = useMutation(
    trpc.sessions.complete.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpc.sessions.list.queryFilter());
      },
      onError: (error) => toast.add({ type: "error", description: error.message }),
    }),
  );

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return h > 0
      ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
      : `${m}:${String(s).padStart(2, "0")}`;
  };

  const start = () => {
    if (!sessionId && !createSession.isPending) {
      createSession.mutate({
        type: "timer",
        name: "Anonymous",
        targetSeconds: 0,
      });
    }
    setStatus("running");
    startTimeRef.current = Date.now() - pausedTimeRef.current;
    intervalRef.current = setInterval(() => {
      if (startTimeRef.current) {
        setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }
    }, 1000);
  };

  const pause = () => {
    setStatus("paused");
    if (startTimeRef.current) {
      pausedTimeRef.current = Date.now() - startTimeRef.current;
    }
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (sessionId) {
      void updateSession.mutateAsync({
        id: sessionId,
        status: "paused",
        elapsedSeconds: elapsed,
      });
    }
  };

  const reset = () => {
    setStatus("idle");
    setElapsed(0);
    setSessionId(null);
    startTimeRef.current = null;
    pausedTimeRef.current = 0;
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const complete = () => {
    if (sessionId) {
      void completeSession.mutate({ id: sessionId });
    }
    reset();
  };

  const toggle = () => {
    if (status === "running") pause();
    else start();
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const progress = elapsed > 0 ? Math.min(elapsed / 3600, 1) : 0;

  return (
    <div className="relative">
      <motion.circle
        animate={{ strokeDashoffset: 283 - progress * 283 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="absolute inset-0 w-20 h-20"
        stroke="currentColor"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        style={{ strokeDasharray: 283 }}
      />
      <motion.button
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.05 }}
        onClick={toggle}
        className={cn(
          "relative w-20 h-20 rounded-full flex items-center justify-center transition-colors duration-200",
          status === "running"
            ? "bg-black text-white shadow-lg"
            : "bg-white text-black border border-border",
        )}
        aria-label={status === "running" ? "Pause timer" : "Start timer"}
        disabled={createSession.isPending}
      >
        {status === "running" ? <Pause className="size-5" /> : <Play className="size-5" />}
      </motion.button>
      <div className="absolute inset-0 flex items-center justify-center text-xs font-mono text-muted-foreground">
        {formatTime(elapsed)}
      </div>
      {status !== "idle" && (
        <>
          <button
            type="button"
            onClick={complete}
            className="absolute -top-3 -right-3 text-muted-foreground hover:text-destructive"
            aria-label="Complete session"
          >
            <RefreshCw className="size-4" />
          </button>
          <button
            type="button"
            onClick={reset}
            className="absolute -bottom-3 -right-3 text-muted-foreground hover:text-destructive"
            aria-label="Reset"
          >
            <RefreshCw className="size-4" />
          </button>
        </>
      )}
    </div>
  );
}
