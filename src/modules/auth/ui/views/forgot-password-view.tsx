"use client";

import { forgotPasswordSchema } from "../../validation";
import { AuthLayout } from "../components/auth-layout";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { authClient } from "@/lib/auth-client";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";

export function ForgotPasswordView() {
  const [isPending, setIsPending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const form = useForm<z.infer<typeof forgotPasswordSchema>>({
    mode: "all",
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(data: z.infer<typeof forgotPasswordSchema>) {
    setIsPending(true);

    const { error } = await authClient.requestPasswordReset({
      email: data.email,
      redirectTo: "/auth/reset-password",
    });

    setIsPending(false);

    if (error) {
      toast.add({ type: "error", description: error.message });
      return;
    }

    setSentTo(data.email);
  }

  if (sentTo) {
    return (
      <AuthLayout title="Check your email" switchHref="/auth/sign-in" switchLabel="Sign in">
        <p className="text-muted-foreground">
          If an account exists for <strong className="text-foreground">{sentTo}</strong>, we&apos;ve
          sent a link to reset its password. The link expires in 1 hour.
        </p>
        <Button
          variant="outline"
          size="lg"
          onClick={() => {
            setSentTo(null);
            form.reset();
          }}
        >
          Send to a different email
        </Button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Reset your password"
      switchHref="/auth/sign-in"
      switchLabel="Sign in"
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
      <p className="text-muted-foreground text-sm">
        Enter the email you signed up with and we&apos;ll send you a link to set a new password.
      </p>
      <Button type="submit" size="lg" disabled={isPending}>
        {isPending ? "Sending…" : "Send reset link"}
      </Button>
    </AuthLayout>
  );
}
