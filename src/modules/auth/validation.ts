import { z } from "zod";

const passwordField = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .max(128, "Password must be at most 128 characters long");

export const signUpSchema = z.object({
  email: z.email("Please enter a valid email address"),
  password: passwordField,

  name: z
    .string()
    .trim()
    .min(3, "Name must be at least 3 characters long")
    .max(63, "Name must be at most 63 characters long"),

  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(63, "Username must be less than 63 characters")
    .regex(
      /^[a-z0-9][a-z0-9-]*[a-z0-9]$/,
      "Username can only contain lowercase letters, numbers, and hyphens. It must start and end with a letter or a number"
    )
    .refine((val) => !val.includes("--"), "Username cannot contain consecutive hyphens")
    .transform((val) => val.toLowerCase()),
});

export const signInSchema = z.object({
  email: z.email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.email("Please enter a valid email address"),
});

export const resetPasswordSchema = z
  .object({
    password: passwordField,
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
