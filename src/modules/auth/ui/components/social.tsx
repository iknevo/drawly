"use client";

import { useState } from "react";
import { FaGithub } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";

import { authClient } from "@/lib/auth-client";
import { safeRedirect } from "@/lib/auth-redirect";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";

type Provider = "google" | "github";

export function Social({ redirectTo }: { redirectTo?: string }) {
  const [pending, setPending] = useState<Provider | null>(null);

  const onClick = async (provider: Provider) => {
    setPending(provider);

    const { error } = await authClient.signIn.social({
      provider,
      callbackURL: safeRedirect(redirectTo) ?? "/",
    });

    if (error) {
      setPending(null);
      toast.add({ type: "error", description: error.message });
    }
  };

  return (
    <div className="flex w-full items-center gap-2">
      <Button
        type="button"
        className="flex-1"
        size="lg"
        variant="outline"
        disabled={pending !== null}
        aria-label="Continue with Google"
        onClick={() => onClick("google")}
      >
        <FcGoogle className="h-5 w-5" />
      </Button>

      <Button
        type="button"
        className="flex-1"
        size="lg"
        variant="outline"
        disabled={pending !== null}
        aria-label="Continue with GitHub"
        onClick={() => onClick("github")}
      >
        <FaGithub className="h-5 w-5" />
      </Button>
    </div>
  );
}
