"use client";

import { AuthLayout } from "../components/auth-layout";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { authClient } from "@/lib/auth-client";
import { verifyEmailHref } from "@/lib/auth-redirect";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";

type VerifyEmailViewProps = {
  email?: string;
  error?: string;
  verified: boolean;
  redirect?: string;
};

export function VerifyEmailView({ email, error, verified, redirect }: VerifyEmailViewProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function resend() {
    if (!email) return;

    setIsPending(true);
    const { error: resendError } = await authClient.sendVerificationEmail({
      email,
      callbackURL: verifyEmailHref(email, { verified: true, redirectTo: redirect }),
    });
    setIsPending(false);

    toast.add(
      resendError
        ? { type: "error", description: resendError.message }
        : { type: "success", description: "Verification email sent" }
    );
  }

  function continueToApp() {
    router.push(redirect ?? "/");
    router.refresh();
  }

  if (error) {
    return (
      <AuthLayout title="That link didn't work" switchHref="/auth/sign-in" switchLabel="Sign in">
        <p className="text-muted-foreground">
          {error === "TOKEN_EXPIRED"
            ? "This verification link has expired. Links are valid for 1 hour — send a fresh one below."
            : "This verification link is invalid or has already been used. Send a fresh one below."}
        </p>
        {email && (
          <Button variant="outline" size="lg" onClick={resend} disabled={isPending}>
            {isPending ? "Sending…" : "Send a new email"}
          </Button>
        )}
      </AuthLayout>
    );
  }

  if (verified) {
    return (
      <AuthLayout title="You're all set">
        <p className="text-muted-foreground">
          {email ? (
            <>
              <strong className="text-foreground">{email}</strong> has been verified.
            </>
          ) : (
            "Your email has been verified."
          )}{" "}
          You&apos;re signed in — jump back in where you left off.
        </p>
        <Button size="lg" onClick={continueToApp}>
          Continue to Drawly
        </Button>
      </AuthLayout>
    );
  }

  if (!email) {
    return (
      <AuthLayout title="Verify your email" switchHref="/auth/sign-in" switchLabel="Sign in">
        <p className="text-muted-foreground">
          This page opens from the verification link in your email. Sign up to get one, or sign in
          if you already have an account.
        </p>
        <Button
          variant="outline"
          size="lg"
          nativeButton={false}
          render={<Link href="/auth/sign-up">Create an account</Link>}
        />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Check your inbox" switchHref="/auth/sign-in" switchLabel="Sign in">
      <p className="text-muted-foreground">
        We sent a verification link to <strong className="text-foreground">{email}</strong>. Click
        it to activate your account.
      </p>
      <Button variant="outline" size="lg" onClick={resend} disabled={isPending}>
        {isPending ? "Sending…" : "Resend email"}
      </Button>
      <p className="text-muted-foreground text-sm">
        The link expires in 1 hour. If it&apos;s not in your inbox, check your spam folder.
      </p>
    </AuthLayout>
  );
}
