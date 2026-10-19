"use client";

import { useSearchParams } from "next/navigation";

import { authClient } from "@/lib/auth-client";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";

export default function VerifyEmailPage() {
  const email = useSearchParams().get("email") ?? "";

  async function resend() {
    const { error } = await authClient.sendVerificationEmail({
      email,
      callbackURL: "/",
    });
    toast.add(
      error
        ? { type: "error", description: error.message }
        : { type: "success", description: "Verification email sent" }
    );
  }

  return (
    <div className="mx-auto max-w-sm space-y-4 py-24 text-center">
      <h1 className="text-2xl font-semibold">Check your inbox</h1>
      <p className="text-muted-foreground">
        We sent a verification link to <strong>{email}</strong>.
      </p>
      <Button variant="outline" onClick={resend}>
        Resend email
      </Button>
    </div>
  );
}
