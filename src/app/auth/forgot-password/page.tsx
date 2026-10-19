import { auth } from "@/lib/auth";

import { ForgotPasswordView } from "@/modules/auth/ui/views/forgot-password-view";

export const metadata = {
  title: "Forgot Password",
  description: "Request a link to reset the password of your Drawly account.",
};

export default async function Page() {
  await auth.protect({ guestOnly: true });

  return <ForgotPasswordView />;
}
