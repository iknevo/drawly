import { ResetPasswordView } from "@/modules/auth/ui/views/reset-password-view";

export const metadata = {
  title: "Reset Password",
  description: "Choose a new password for your Drawly account.",
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const { token, error } = await searchParams;

  return <ResetPasswordView token={token} error={error} />;
}
