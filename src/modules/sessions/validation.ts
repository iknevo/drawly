import { z } from "zod";

import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@/lib/pagination";

export const sessionIdSchema = z.object({
  id: z.string().regex(/^[a-f0-9]{24}$/i, "Invalid session id"),
});

export const listSessionsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(Number(DEFAULT_PAGE_SIZE)),
  q: z.string().trim().max(100).default(""),
  sort: z.enum(["updated", "created"]).default("updated"),
});

export const createSessionSchema = z.object({
  type: z.enum(["timer", "pomodoro"]),
  name: z.string().trim().min(1).max(120).default("Anonymous"),
  targetSeconds: z.coerce.number().int().min(0).default(0),
  pomodoroConfig: z
    .object({
      work: z.coerce.number().int().positive().default(1500),
      shortBreak: z.coerce.number().int().positive().default(300),
      longBreak: z.coerce.number().int().positive().default(900),
      cycles: z.coerce.number().int().positive().default(4),
    })
    .optional(),
});

export const updateSessionSchema = sessionIdSchema.extend({
  status: z.enum(["idle", "running", "paused", "completed"]).optional(),
  elapsedSeconds: z.coerce.number().int().min(0).optional(),
  targetSeconds: z.coerce.number().int().min(0).optional(),
  name: z.string().trim().min(1).max(120).optional(),
  currentCycle: z.coerce.number().int().positive().optional(),
  currentPhase: z.enum(["work", "shortBreak", "longBreak"]).optional(),
});

export const completeSessionSchema = sessionIdSchema;
