"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";

import { useSound } from "@/components/sound-provider";
import { toast } from "@/components/ui/toast";

import {
  DEFAULT_POMODORO_CONFIG,
  type PomodoroConfig,
  buildSegments,
  nextBoundarySeconds,
  resolvePomodoro,
  totalDuration,
} from "@/modules/sessions/lib/pomodoro";
import { useTRPC } from "@/trpc/client";

export type SessionMode = "timer" | "pomodoro";
export type SessionStatus = "idle" | "running" | "paused";
export type SessionDraft = { name: string; targetSeconds: number };

function elapsedMsOf(
  baseMsRef: { current: number },
  startTimeRef: { current: number | null }
): number {
  return (
    baseMsRef.current + (startTimeRef.current !== null ? Date.now() - startTimeRef.current : 0)
  );
}

export function useSessionTimer() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { play, stopAlarm } = useSound();

  const [mode, setMode] = useState<SessionMode>("timer");
  const [draft, setDraft] = useState<SessionDraft>({ name: "Anonymous", targetSeconds: 0 });
  const [config, setConfig] = useState<PomodoroConfig>(DEFAULT_POMODORO_CONFIG);
  const [status, setStatus] = useState<SessionStatus>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [pendingModeSwitch, setPendingModeSwitch] = useState<SessionMode | null>(null);

  const baseMsRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);
  const startingRef = useRef(false);
  const generationRef = useRef(0);
  const recordedIndexRef = useRef(-1);

  const createSession = useMutation(
    trpc.sessions.create.mutationOptions({
      onError: (error) => toast.add({ type: "error", description: error.message }),
    })
  );

  const updateSession = useMutation(
    trpc.sessions.update.mutationOptions({
      onError: (error) => toast.add({ type: "error", description: error.message }),
    })
  );

  const removeSession = useMutation(
    trpc.sessions.remove.mutationOptions({
      onError: (error) => toast.add({ type: "error", description: error.message }),
    })
  );

  const recordCycle = useMutation(
    trpc.sessions.recordCycle.mutationOptions({
      onError: (error) => toast.add({ type: "error", description: error.message }),
    })
  );

  const invalidateHistory = async () => {
    await Promise.all([
      queryClient.invalidateQueries(trpc.sessions.list.queryFilter()),
      queryClient.invalidateQueries(trpc.sessions.stats.queryFilter()),
    ]);
  };

  const completeSession = useMutation(
    trpc.sessions.complete.mutationOptions({
      onError: (error) => toast.add({ type: "error", description: error.message }),
    })
  );

  function resetLocal() {
    generationRef.current += 1;
    baseMsRef.current = 0;
    startTimeRef.current = null;
    recordedIndexRef.current = -1;
    setElapsed(0);
    setStatus("idle");
    setSessionId(null);
  }

  useEffect(() => {
    if (status !== "running") return;
    const interval = setInterval(() => {
      const ms = elapsedMsOf(baseMsRef, startTimeRef);
      if (mode === "pomodoro") {
        const boundary = nextBoundarySeconds(baseMsRef.current / 1000, config);
        const limit = (boundary ?? totalDuration(config)) * 1000;
        if (ms >= limit) {
          baseMsRef.current = limit;
          startTimeRef.current = null;
          setElapsed(Math.floor(limit / 1000));
          setStatus("paused");
          play("alarm");
          return;
        }
      }
      setElapsed(Math.floor(ms / 1000));
    }, 250);
    return () => clearInterval(interval);
  }, [status, mode, config, play]);

  const updateSessionRef = useRef(updateSession);
  useEffect(() => {
    updateSessionRef.current = updateSession;
  });

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState !== "hidden") return;
      if (status === "running" && sessionId) {
        const exact = Math.floor(elapsedMsOf(baseMsRef, startTimeRef) / 1000);
        setElapsed(exact);
        updateSessionRef.current.mutate({ id: sessionId, elapsedSeconds: exact });
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [status, sessionId]);

  useEffect(
    () => () => {
      generationRef.current += 1;
    },
    []
  );

  const pomodoro = useMemo(
    () => (mode === "pomodoro" ? resolvePomodoro(elapsed, config) : null),
    [mode, elapsed, config]
  );

  useEffect(() => {
    if (!pomodoro || status === "idle" || !sessionId) return;
    const target = pomodoro.completedIndex;
    if (target < 0 || target <= recordedIndexRef.current) return;

    const segments = buildSegments(config);
    for (let index = recordedIndexRef.current + 1; index <= target; index++) {
      const segment = segments[index];
      if (!segment) break;
      recordCycle.mutate({
        id: sessionId,
        cycleIndex: segment.cycle,
        phase: segment.phase,
        durationSeconds: segment.duration,
      });
    }
    recordedIndexRef.current = target;
  }, [pomodoro, status, sessionId, config, recordCycle]);

  const start = async () => {
    if (status === "running" || startingRef.current) return;
    startingRef.current = true;
    const generation = generationRef.current;
    let id = sessionId;
    let created = false;
    try {
      if (!id) {
        const result = await createSession.mutateAsync({
          type: mode,
          name: draft.name,
          targetSeconds: draft.targetSeconds,
          ...(mode === "pomodoro" ? { pomodoroConfig: config } : {}),
        });
        id = result.id;
        created = true;
      } else {
        updateSession.mutate({ id, status: "running" });
      }
    } catch {
      return;
    } finally {
      startingRef.current = false;
    }

    if (generation !== generationRef.current) {
      if (created) removeSession.mutate({ id });
      return;
    }

    if (created) {
      setSessionId(id);
      recordedIndexRef.current = -1;
    }
    startTimeRef.current = Date.now();
    setStatus("running");
    stopAlarm();
    play("start");
  };

  const pause = () => {
    if (status !== "running") return;
    baseMsRef.current = elapsedMsOf(baseMsRef, startTimeRef);
    startTimeRef.current = null;
    const exact = Math.floor(baseMsRef.current / 1000);
    setElapsed(exact);
    setStatus("paused");
    if (sessionId) {
      updateSession.mutate({ id: sessionId, status: "paused", elapsedSeconds: exact });
    }
    stopAlarm();
    play("pause");
  };

  const reset = () => {
    const id = sessionId;
    resetLocal();
    if (id) removeSession.mutate({ id });
    stopAlarm();
    play("reset");
  };

  const complete = () => {
    if (!sessionId) {
      resetLocal();
      return;
    }
    const exact = Math.floor(elapsedMsOf(baseMsRef, startTimeRef) / 1000);
    stopAlarm();
    completeSession.mutate(
      { id: sessionId, elapsedSeconds: exact },
      {
        onSuccess: async () => {
          resetLocal();
          await invalidateHistory();
          play("success");
        },
      }
    );
  };

  const toggle = () => {
    if (status === "running") pause();
    else void start();
  };

  const requestModeChange = (next: SessionMode) => {
    if (next === mode) return;
    if (status === "idle") {
      setMode(next);
      return;
    }
    setPendingModeSwitch(next);
  };

  const confirmModeSwitch = () => {
    if (!pendingModeSwitch) return;
    reset();
    setMode(pendingModeSwitch);
    setPendingModeSwitch(null);
  };

  const setDraftName = (name: string) => {
    setDraft((prev) => ({ ...prev, name }));
  };

  const setDraftTarget = (targetSeconds: number) => {
    setDraft((prev) => ({ ...prev, targetSeconds }));
  };

  const applyConfig = (next: PomodoroConfig) => {
    setConfig(next);
  };

  const persistConfig = (next: PomodoroConfig) => {
    if (mode === "pomodoro" && sessionId) {
      updateSession.mutate({ id: sessionId, pomodoroConfig: next });
    }
  };

  const isPending =
    createSession.isPending ||
    updateSession.isPending ||
    completeSession.isPending ||
    removeSession.isPending;

  return {
    mode,
    status,
    elapsed,
    sessionId,
    draft,
    config,
    pomodoro,
    pendingModeSwitch,
    isPending,
    start,
    pause,
    reset,
    complete,
    toggle,
    requestModeChange,
    confirmModeSwitch,
    cancelModeSwitch: () => setPendingModeSwitch(null),
    setDraftName,
    setDraftTarget,
    applyConfig,
    persistConfig,
  };
}
