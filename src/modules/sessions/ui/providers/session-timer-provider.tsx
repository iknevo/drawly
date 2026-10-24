"use client";

import type {
  SessionDraft,
  SessionMode,
  SessionStatus,
  sessionGetOutput,
} from "../../types/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

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
import { STALE_RUNNING_MS } from "@/modules/sessions/lib/status";
import { formatDuration } from "@/modules/sessions/lib/time";
import { useSessionInvalidation } from "@/modules/sessions/ui/hooks/use-session-invalidation";
import { useTRPC } from "@/trpc/client";

const STORAGE_KEY = "drawly:session-timer:v1";
const HEARTBEAT_MS = 30 * 1000;

type PersistedTimer = {
  version: 1;
  mode: SessionMode;
  status: SessionStatus;
  sessionId: string | null;
  draft: SessionDraft;
  config: PomodoroConfig;
  elapsedMs: number;
  runningSince: number | null;
};

function readPersistedTimer(): PersistedTimer | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<PersistedTimer>;
    if (
      parsed.version !== 1 ||
      (parsed.mode !== "timer" && parsed.mode !== "pomodoro") ||
      !parsed.draft ||
      !parsed.config
    ) {
      return null;
    }

    return {
      version: 1,
      mode: parsed.mode,
      status:
        parsed.status === "running" || parsed.status === "paused" ? parsed.status : "idle",
      sessionId: typeof parsed.sessionId === "string" ? parsed.sessionId : null,
      draft: {
        name:
          typeof parsed.draft.name === "string" && parsed.draft.name.length > 0
            ? parsed.draft.name
            : "Anonymous",
        targetSeconds:
          typeof parsed.draft.targetSeconds === "number" ? parsed.draft.targetSeconds : 0,
      },
      config: {
        work: Number(parsed.config.work) || DEFAULT_POMODORO_CONFIG.work,
        shortBreak: Number(parsed.config.shortBreak) || DEFAULT_POMODORO_CONFIG.shortBreak,
        longBreak: Number(parsed.config.longBreak) || DEFAULT_POMODORO_CONFIG.longBreak,
        cycles: Number(parsed.config.cycles) || DEFAULT_POMODORO_CONFIG.cycles,
      },
      elapsedMs: Number(parsed.elapsedMs) || 0,
      runningSince: typeof parsed.runningSince === "number" ? parsed.runningSince : null,
    };
  } catch {
    return null;
  }
}

function writePersistedTimer(value: PersistedTimer) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // ignore storage failures (private mode, quota, etc.)
  }
}

function elapsedMsOf(
  baseMsRef: { current: number },
  startTimeRef: { current: number | null }
): number {
  return (
    baseMsRef.current + (startTimeRef.current !== null ? Date.now() - startTimeRef.current : 0)
  );
}

function useSessionTimerState() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { play, stopAlarm } = useSound();
  const invalidateSessions = useSessionInvalidation();

  const [mode, setMode] = useState<SessionMode>("timer");
  const [draft, setDraft] = useState<SessionDraft>({ name: "Anonymous", targetSeconds: 0 });
  const [config, setConfig] = useState<PomodoroConfig>(DEFAULT_POMODORO_CONFIG);
  const [status, setStatus] = useState<SessionStatus>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [pendingModeSwitch, setPendingModeSwitch] = useState<SessionMode | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [isResuming, setIsResuming] = useState(false);

  const baseMsRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);
  const startingRef = useRef(false);
  const generationRef = useRef(0);
  const recordedIndexRef = useRef(-1);
  const restoredRef = useRef(false);
  const hydratedRef = useRef(false);

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
      onSuccess: async () => {
        await invalidateSessions();
      },
      onError: (error) => toast.add({ type: "error", description: error.message }),
    })
  );

  const recordCycle = useMutation(
    trpc.sessions.recordCycle.mutationOptions({
      onError: (error) => toast.add({ type: "error", description: error.message }),
    })
  );

  const completeSession = useMutation(
    trpc.sessions.complete.mutationOptions({
      onError: (error) => toast.add({ type: "error", description: error.message }),
    })
  );

  const updateSessionRef = useRef(updateSession);
  const persistRef = useRef<() => void>(() => {});

  function resetLocal() {
    generationRef.current += 1;
    baseMsRef.current = 0;
    startTimeRef.current = null;
    recordedIndexRef.current = -1;
    setElapsed(0);
    setStatus("idle");
    setSessionId(null);
  }

  function persistTimer() {
    if (!hydratedRef.current) return;

    writePersistedTimer({
      version: 1,
      mode,
      status,
      sessionId,
      draft,
      config,
      elapsedMs: baseMsRef.current,
      runningSince: startTimeRef.current,
    });
  }

  function saveProgress() {
    if (!sessionId) return;

    const exact = Math.floor(elapsedMsOf(baseMsRef, startTimeRef) / 1000);
    setElapsed(exact);
    updateSessionRef.current.mutate({ id: sessionId, elapsedSeconds: exact });
    persistRef.current();
  }

  useEffect(() => {
    hydratedRef.current = hydrated;
  }, [hydrated]);

  useEffect(() => {
    updateSessionRef.current = updateSession;
    persistRef.current = persistTimer;
  });

  useEffect(() => {
    setHydrated(true);
  }, []);

  // Restore the previous timer once, then validate it against the server.
  useEffect(() => {
    if (!hydrated) return;
    if (restoredRef.current) return;
    restoredRef.current = true;

    const stored = readPersistedTimer();
    if (!stored) {
      return;
    }

    let restoredStatus = stored.status;
    let elapsedMs = Math.max(0, stored.elapsedMs);

    if (restoredStatus === "running") {
      if (stored.runningSince !== null) {
        const delta = Date.now() - stored.runningSince;
        if (delta >= 0 && delta <= STALE_RUNNING_MS) elapsedMs += delta;
        else restoredStatus = "paused";
      } else {
        restoredStatus = "paused";
      }
    }

    if (!stored.sessionId) restoredStatus = "idle";

    baseMsRef.current = elapsedMs;
    startTimeRef.current = restoredStatus === "running" ? Date.now() : null;

    setMode(stored.mode);
    setDraft(stored.draft);
    setConfig(stored.config);
    setStatus(restoredStatus);
    setSessionId(stored.sessionId);
    setElapsed(Math.floor(elapsedMs / 1000));

    if (!stored.sessionId) return;

    let cancelled = false;
    void (async () => {
      try {
        const detail = await queryClient.fetchQuery(
          trpc.sessions.get.queryOptions({ id: stored.sessionId as string })
        );
        if (cancelled) return;

        if (detail.status === "completed") {
          resetLocal();
          return;
        }

        const serverMs = detail.elapsedSeconds * 1000;
        if (serverMs > baseMsRef.current) {
          baseMsRef.current = serverMs;
          startTimeRef.current = restoredStatus === "running" ? Date.now() : null;
          setElapsed(detail.elapsedSeconds);
        }
      } catch {
        if (!cancelled) resetLocal();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hydrated, queryClient, trpc]);

  useEffect(() => {
    if (!hydrated) return;
    persistRef.current();
  }, [hydrated, mode, status, sessionId, draft, config]);

  useEffect(() => {
    if (!hydrated || status !== "running" || !sessionId) return;

    const interval = setInterval(() => {
      saveProgress();
    }, HEARTBEAT_MS);
    return () => clearInterval(interval);
  }, [hydrated, status, sessionId]);

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

  useEffect(() => {
    const sync = () => {
      if (status !== "running" || !sessionId) {
        persistRef.current();
        return;
      }
      saveProgress();
    };

    const onVisibilityChange = () => {
      sync();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", sync);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", sync);
    };
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
      recordCycle.mutate(
        {
          id: sessionId,
          cycleIndex: segment.cycle,
          phase: segment.phase,
          durationSeconds: segment.duration,
        },
        {
          onSuccess: () => {
            void queryClient.invalidateQueries(trpc.sessions.get.queryFilter({ id: sessionId }));
          },
        }
      );
    }
    recordedIndexRef.current = target;
  }, [pomodoro, status, sessionId, config, recordCycle]);

  async function start() {
    if (!hydrated || status === "running" || startingRef.current) return;
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
        updateSession.mutate({
          id,
          status: "running",
          elapsedSeconds: Math.floor(baseMsRef.current / 1000),
        });
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
    if (created) void invalidateSessions(id);
  }

  function pause() {
    if (status !== "running") return;
    baseMsRef.current = elapsedMsOf(baseMsRef, startTimeRef);
    startTimeRef.current = null;
    const exact = Math.floor(baseMsRef.current / 1000);
    setElapsed(exact);
    setStatus("paused");
    if (sessionId) {
      updateSession.mutate({ id: sessionId, status: "paused", elapsedSeconds: exact });
      void invalidateSessions(sessionId);
    }
    stopAlarm();
    play("pause");
  }

  function reset() {
    const id = sessionId;
    resetLocal();
    if (id) removeSession.mutate({ id });
    stopAlarm();
    play("reset");
  }

  function clearSession() {
    resetLocal();
    stopAlarm();
  }

  function complete() {
    if (!sessionId) {
      resetLocal();
      return;
    }

    const id = sessionId;
    const completedName = draft.name;
    const exact = Math.floor(elapsedMsOf(baseMsRef, startTimeRef) / 1000);
    stopAlarm();
    completeSession.mutate(
      { id, elapsedSeconds: exact },
      {
        onSuccess: async () => {
          resetLocal();
          await invalidateSessions(id);
          play("success");
          toast.add({
            type: "success",
            title: "Session complete",
            description: `${completedName} · ${formatDuration(exact)}`,
          });
        },
      }
    );
  }

  function toggle() {
    if (status === "running") pause();
    else void start();
  }

  function requestModeChange(next: SessionMode) {
    if (next === mode) return;
    if (status === "idle") {
      setMode(next);
      return;
    }
    setPendingModeSwitch(next);
  }

  function confirmModeSwitch() {
    if (!pendingModeSwitch) return;
    reset();
    setMode(pendingModeSwitch);
    setPendingModeSwitch(null);
  }

  function setDraftName(name: string) {
    setDraft((prev) => ({ ...prev, name }));
  }

  function setDraftTarget(targetSeconds: number) {
    setDraft((prev) => ({ ...prev, targetSeconds }));
  }

  function applyConfig(next: PomodoroConfig) {
    setConfig(next);
  }

  function persistConfig(next: PomodoroConfig) {
    if (mode === "pomodoro" && sessionId) {
      updateSession.mutate({ id: sessionId, pomodoroConfig: next });
    }
  }

  async function resumeSession(id: string) {
    if (startingRef.current || isResuming) return;

    if (sessionId && sessionId !== id) {
      pause();
    }

    startingRef.current = true;
    setIsResuming(true);
    generationRef.current += 1;

    let detail: sessionGetOutput;
    try {
      detail = await queryClient.fetchQuery(trpc.sessions.get.queryOptions({ id }));
    } catch (error) {
      toast.add({
        type: "error",
        description: error instanceof Error ? error.message : "Couldn't load that session",
      });
      return;
    } finally {
      startingRef.current = false;
      setIsResuming(false);
    }

    if (detail.status === "completed") {
      toast.add({ type: "error", description: "That session is already completed" });
      return;
    }

    const generation = generationRef.current;
    baseMsRef.current = detail.elapsedSeconds * 1000;
    startTimeRef.current = Date.now();
    recordedIndexRef.current = detail.cycles.length - 1;

    setMode(detail.type);
    setDraft({ name: detail.name, targetSeconds: detail.targetSeconds });
    if (detail.type === "pomodoro") setConfig(detail.pomodoroConfig);
    setSessionId(id);
    setElapsed(detail.elapsedSeconds);
    setStatus("running");

    if (generation === generationRef.current) {
      updateSession.mutate({
        id,
        status: "running",
        elapsedSeconds: detail.elapsedSeconds,
      });
      stopAlarm();
      play("start");
      void invalidateSessions(id);
    }
  }

  const isPending =
    !hydrated ||
    isResuming ||
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
    hydrated,
    isPending,
    start,
    pause,
    reset,
    clearSession,
    complete,
    toggle,
    resumeSession,
    requestModeChange,
    confirmModeSwitch,
    cancelModeSwitch: () => setPendingModeSwitch(null),
    setDraftName,
    setDraftTarget,
    applyConfig,
    persistConfig,
  };
}

type SessionTimerContextValue = ReturnType<typeof useSessionTimerState>;

const SessionTimerContext = createContext<SessionTimerContextValue | null>(null);

export function SessionTimerProvider({ children }: { children: React.ReactNode }) {
  const value = useSessionTimerState();

  return <SessionTimerContext.Provider value={value}>{children}</SessionTimerContext.Provider>;
}

export function useSessionTimer(): SessionTimerContextValue {
  const context = useContext(SessionTimerContext);
  if (!context) {
    throw new Error("useSessionTimer must be used within a SessionTimerProvider");
  }
  return context;
}
