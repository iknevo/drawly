import { safeRedirect } from "@/lib/auth-redirect";

import { VerifyEmailView } from "@/modules/auth/ui/views/verify-email-view";

export const metadata = {
  title: "Verify Email",
  description:
    "Confirm your Drawly email address to activate your account and start creating boards, docs, and sessions.",
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; error?: string; verified?: string; redirect?: string }>;
}) {
  const { email, error, verified, redirect } = await searchParams;

  return (
    <VerifyEmailView
      email={email}
      error={error}
      verified={verified === "true"}
      redirect={safeRedirect(redirect)}
    />
  );
}
