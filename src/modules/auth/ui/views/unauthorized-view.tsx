import { AuthLayout } from "../components/auth-layout";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export function UnauthorizedView() {
  return (
    <AuthLayout title="Not authorized" switchHref="/" switchLabel="Home">
      <p className="text-muted-foreground">
        Your account doesn&apos;t have permission to view this page.
      </p>
      <Button size="lg" nativeButton={false} render={<Link href="/">Back to Drawly</Link>} />
    </AuthLayout>
  );
}
