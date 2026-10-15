import { auth } from "@/lib/auth";

import { SignInView } from "@/modules/auth/ui/views/sign-in-view";

export const metadata = {
  title: "Sign In",
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  await auth.protect({ guestOnly: true });

  const { redirect } = await searchParams;

  return <SignInView redirectTo={redirect} />;
}
