"use client";

import { signInSchema } from "../../validation";
import { AuthLayout } from "../components/auth-layout";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { authClient } from "@/lib/auth-client";
import { authHref, safeRedirect } from "@/lib/auth-redirect";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";

export function SignInView({ redirectTo }: { redirectTo?: string }) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const form = useForm<z.infer<typeof signInSchema>>({
    mode: "all",
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: z.infer<typeof signInSchema>) {
    setIsPending(true);

    const { error } = await authClient.signIn.email({
      email: data.email,
      password: data.password,
    });

    setIsPending(false);

    if (error) {
      toast.add({ type: "error", description: error.message });
      return;
    }

    router.push(safeRedirect(redirectTo) ?? "/");
    router.refresh();
  }

  const switchHref = authHref("/auth/sign-up", redirectTo);

  return (
    <AuthLayout
      title="Welcome back to Drawly"
      switchHref={switchHref}
      switchLabel="Sign up"
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <Controller
        name="email"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel className="text-base" htmlFor="email-input">
              Email
            </FieldLabel>
            <Input
              {...field}
              id="email-input"
              aria-invalid={fieldState.invalid}
              placeholder="Enter your email"
              autoComplete="email"
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name="password"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel className="text-base" htmlFor="password-input">
              Password
            </FieldLabel>
            <Input
              {...field}
              id="password-input"
              aria-invalid={fieldState.invalid}
              placeholder="Enter your password"
              type="password"
              autoComplete="current-password"
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Button type="submit" size="lg" disabled={isPending}>
        Login
      </Button>
    </AuthLayout>
  );
}
