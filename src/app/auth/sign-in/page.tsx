import { auth } from "@/lib/auth";

import { SignInView } from "@/modules/auth/ui/views/sign-in-view";

export const metadata = {
  title: "Sign In",
};

export default async function Page() {
  await auth.protect({ guestOnly: true });

  return <SignInView />;
}
