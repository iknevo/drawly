"use client";

import { resetPasswordSchema } from "../../validation";
import { AuthLayout } from "../components/auth-layout";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { authClient } from "@/lib/auth-client";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";

type ResetPasswordViewProps = {
  token?: string;
  error?: string;
};

export function ResetPasswordView({ token, error }: ResetPasswordViewProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const form = useForm<z.infer<typeof resetPasswordSchema>>({
    mode: "all",
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(data: z.infer<typeof resetPasswordSchema>) {
    if (!token) return;

    setIsPending(true);

    const { error: resetError } = await authClient.resetPassword({
      token,
      newPassword: data.password,
    });

    setIsPending(false);

    if (resetError) {
      toast.add({ type: "error", description: resetError.message });
      return;
    }

    toast.add({ type: "success", description: "Password updated — sign in with your new one" });
    router.push("/auth/sign-in");
    router.refresh();
  }

  if (error || !token) {
    return (
      <AuthLayout title="Link invalid or expired" switchHref="/auth/sign-in" switchLabel="Sign in">
        <p className="text-muted-foreground">
          This password reset link is invalid or has expired. Reset links are valid for 1 hour —
          request a fresh one.
        </p>
        <Button
          variant="outline"
          size="lg"
          nativeButton={false}
          render={<Link href="/auth/forgot-password">Request a new link</Link>}
        />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Choose a new password"
      switchHref="/auth/sign-in"
      switchLabel="Sign in"
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <Controller
        name="password"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel className="text-base" htmlFor="password-input">
              New password
            </FieldLabel>
            <Input
              {...field}
              id="password-input"
              aria-invalid={fieldState.invalid}
              placeholder="Enter a new password"
              type="password"
              autoComplete="new-password"
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name="confirmPassword"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel className="text-base" htmlFor="confirm-password-input">
              Confirm new password
            </FieldLabel>
            <Input
              {...field}
              id="confirm-password-input"
              aria-invalid={fieldState.invalid}
              placeholder="Repeat the new password"
              type="password"
              autoComplete="new-password"
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Button type="submit" size="lg" disabled={isPending}>
        {isPending ? "Saving…" : "Reset password"}
      </Button>
    </AuthLayout>
  );
}
