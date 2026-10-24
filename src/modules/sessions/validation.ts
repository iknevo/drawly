import { z } from "zod";

import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@/lib/pagination";

const MAX_TARGET_SECONDS = 86400;
const MAX_PHASE_SECONDS = 14400;
const MAX_CYCLES = 12;

export const sessionIdSchema = z.object({
  id: z.string().regex(/^[a-f0-9]{24}$/i, "Invalid session id"),
});

export const listSessionsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(Number(DEFAULT_PAGE_SIZE)),
  q: z.string().trim().max(100).default(""),
  sort: z.enum(["updated", "created"]).default("updated"),
  type: z.enum(["all", "timer", "pomodoro"]).default("all"),
  status: z.enum(["all", "ongoing", "completed"]).default("all"),
});

const pomodoroConfigSchema = z.object({
  work: z.coerce.number().int().min(1).max(MAX_PHASE_SECONDS),
  shortBreak: z.coerce.number().int().min(1).max(MAX_PHASE_SECONDS),
  longBreak: z.coerce.number().int().min(1).max(MAX_PHASE_SECONDS),
  cycles: z.coerce.number().int().min(1).max(MAX_CYCLES),
});

export const createSessionSchema = z.object({
  type: z.enum(["timer", "pomodoro"]),
  name: z
    .string()
    .trim()
    .max(120)
    .optional()
    .default("Anonymous")
    .transform((value) => (value && value.length > 0 ? value : "Anonymous")),
  targetSeconds: z.coerce.number().int().min(0).max(MAX_TARGET_SECONDS).default(0),
  pomodoroConfig: pomodoroConfigSchema.optional(),
});

export const updateSessionSchema = sessionIdSchema
  .extend({
    status: z.enum(["idle", "running", "paused"]).optional(),
    elapsedSeconds: z.coerce.number().int().min(0).max(MAX_TARGET_SECONDS).optional(),
    targetSeconds: z.coerce.number().int().min(0).max(MAX_TARGET_SECONDS).optional(),
    name: z.string().trim().min(1).max(120).optional(),
    currentCycle: z.coerce.number().int().min(1).optional(),
    currentPhase: z.enum(["work", "shortBreak", "longBreak"]).optional(),
    pomodoroConfig: pomodoroConfigSchema.optional(),
  })
  .superRefine((value, ctx) => {
    const hasField = Object.keys(value).some((key) => key !== "id");
    if (!hasField) {
      ctx.addIssue({
        code: "custom",
        message: "At least one field is required",
        path: [],
      });
    }
    if (
      value.currentCycle !== undefined &&
      value.pomodoroConfig !== undefined &&
      value.currentCycle > value.pomodoroConfig.cycles
    ) {
      ctx.addIssue({
        code: "custom",
        message: "currentCycle cannot exceed the configured number of cycles",
        path: ["currentCycle"],
      });
    }
  });

export const completeSessionSchema = sessionIdSchema.extend({
  elapsedSeconds: z.coerce.number().int().min(0).max(MAX_TARGET_SECONDS),
});

export const recordCycleSchema = sessionIdSchema.extend({
  cycleIndex: z.coerce.number().int().min(1).max(MAX_CYCLES),
  phase: z.enum(["work", "shortBreak", "longBreak"]),
  durationSeconds: z.coerce.number().int().min(0).max(MAX_PHASE_SECONDS),
});
