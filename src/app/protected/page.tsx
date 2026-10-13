import { auth } from "@/lib/auth";

export default async function Page() {
  await auth.protect({ role: "user" });

  return <div>protected</div>;
}
