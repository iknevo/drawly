import { auth } from "@/lib/auth";

import { SignUpView } from "@/modules/auth/ui/views/sign-up-view";

export const metadata = {
  title: "Sign Up",
};

export default async function Page() {
  await auth.protect({ guestOnly: true });

  return <SignUpView />;
}
