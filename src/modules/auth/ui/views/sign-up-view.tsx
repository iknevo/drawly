"use client";

import { signUpSchema } from "../../validation";
import { AuthLayout } from "../components/auth-layout";
import { Social } from "../components/social";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { authClient } from "@/lib/auth-client";
import { authHref, verifyEmailHref } from "@/lib/auth-redirect";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";

export function SignUpView({ redirectTo }: { redirectTo?: string }) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const form = useForm<z.infer<typeof signUpSchema>>({
    mode: "all",
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      username: "",
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: z.infer<typeof signUpSchema>) {
    setIsPending(true);

    const { error } = await authClient.signUp.email({
      name: data.name,
      email: data.email,
      password: data.password,
      username: data.username,
      callbackURL: verifyEmailHref(data.email, { verified: true, redirectTo }),
    });

    setIsPending(false);

    if (error) {
      toast.add({ type: "error", description: error.message });
      return;
    }

    router.push(verifyEmailHref(data.email, { redirectTo }));
  }

  const switchHref = authHref("/auth/sign-in", redirectTo);

  return (
    <AuthLayout
      title="Create your Drawly account"
      switchHref={switchHref}
      switchLabel="Sign in"
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <Controller
        name="name"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel className="text-base" htmlFor="name-input">
              Name
            </FieldLabel>
            <Input
              {...field}
              id="name-input"
              aria-invalid={fieldState.invalid}
              placeholder="Enter your name"
              autoComplete="name"
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name="username"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel className="text-base" htmlFor="username-input">
              Username
            </FieldLabel>
            <Input
              {...field}
              id="username-input"
              aria-invalid={fieldState.invalid}
              placeholder="Enter your username"
              autoComplete="username"
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

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
              placeholder="Create a password"
              type="password"
              autoComplete="new-password"
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Button type="submit" size="lg" disabled={isPending}>
        Create account
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background text-muted-foreground px-2">Or continue with</span>
        </div>
      </div>

      <Social redirectTo={redirectTo} />
    </AuthLayout>
  );
}
