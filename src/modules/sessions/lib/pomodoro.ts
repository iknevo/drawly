export type PomodoroPhase = "work" | "shortBreak" | "longBreak";

export type PomodoroConfig = {
  work: number;
  shortBreak: number;
  longBreak: number;
  cycles: number;
};

export const DEFAULT_POMODORO_CONFIG: PomodoroConfig = {
  work: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
  cycles: 4,
};

export const PHASE_LABEL: Record<PomodoroPhase, string> = {
  work: "Work",
  shortBreak: "Short Break",
  longBreak: "Long Break",
};

type Segment = {
  phase: PomodoroPhase;
  cycle: number;
  duration: number;
  index: number;
};

export function buildSegments(config: PomodoroConfig): Segment[] {
  const segments: Segment[] = [];
  for (let cycle = 1; cycle <= config.cycles; cycle++) {
    segments.push({ phase: "work", cycle, duration: config.work, index: segments.length });
    segments.push({
      phase: cycle < config.cycles ? "shortBreak" : "longBreak",
      cycle,
      duration: cycle < config.cycles ? config.shortBreak : config.longBreak,
      index: segments.length,
    });
  }
  return segments;
}

export function totalDuration(config: PomodoroConfig): number {
  return buildSegments(config).reduce((sum, segment) => sum + segment.duration, 0);
}

export function nextBoundarySeconds(elapsed: number, config: PomodoroConfig): number | null {
  let cursor = 0;
  for (const segment of buildSegments(config)) {
    cursor += segment.duration;
    if (cursor > elapsed) return cursor;
  }
  return null;
}

export type ResolvedPomodoro = {
  phase: PomodoroPhase;
  cycle: number;
  timeRemaining: number;
  phaseElapsed: number;
  phaseIndex: number;
  completedIndex: number;
  done: boolean;
};

export function resolvePomodoro(elapsed: number, config: PomodoroConfig): ResolvedPomodoro {
  const segments = buildSegments(config);
  const total = segments.reduce((sum, segment) => sum + segment.duration, 0);

  if (elapsed >= total) {
    const last = segments[segments.length - 1];
    return {
      phase: last.phase,
      cycle: last.cycle,
      timeRemaining: 0,
      phaseElapsed: last.duration,
      phaseIndex: last.index,
      completedIndex: last.index,
      done: true,
    };
  }

  let cursor = 0;
  for (const segment of segments) {
    if (elapsed < cursor + segment.duration) {
      const phaseElapsed = elapsed - cursor;
      return {
        phase: segment.phase,
        cycle: segment.cycle,
        timeRemaining: segment.duration - phaseElapsed,
        phaseElapsed,
        phaseIndex: segment.index,
        completedIndex: segment.index - 1,
        done: false,
      };
    }
    cursor += segment.duration;
  }

  const last = segments[segments.length - 1];
  return {
    phase: last.phase,
    cycle: last.cycle,
    timeRemaining: 0,
    phaseElapsed: last.duration,
    phaseIndex: last.index,
    completedIndex: last.index,
    done: true,
  };
}
