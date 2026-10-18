import { auth } from "@/lib/auth";

import { SignUpView } from "@/modules/auth/ui/views/sign-up-view";

export const metadata = {
  title: "Sign Up",
  description: "Create a Drawly account to sketch, write, and plan your ideas.",
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  await auth.protect({ guestOnly: true });

  const { redirect } = await searchParams;

  return <SignUpView redirectTo={redirect} />;
}
