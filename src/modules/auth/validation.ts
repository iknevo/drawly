import { z } from "zod";

export const signUpSchema = z.object({
  email: z.email("Please enter a valid email address"),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(128, "Password must be at most 128 characters long"),

  name: z
    .string()
    .trim()
    .min(3, "Name must be at least 3 characters long")
    .max(63, "Name must be at most 63 characters long"),
});

export const signInSchema = z.object({
  email: z.email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});
