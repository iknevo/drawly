"use client";

import Link from "next/link";

import { authClient } from "@/lib/auth-client";

import { PrettyStringify } from "@/components/dev/pretty-stringify";
import { Button } from "@/components/ui/button";

export default function Page() {
  const { data } = authClient.useSession();

  return (
    <div className="flex min-h-svh p-6">
      <div className="flex max-w-md min-w-0 flex-col gap-4 text-sm leading-loose">
        <div>
          <h1 className="font-medium">Project ready!</h1>
          <p>You may now add components and start building.</p>
          <p>We&apos;ve already added the button component for you.</p>
          <Button
            className="mt-2"
            nativeButton={false}
            render={<Link href="/boards">Go to boards</Link>}
          />
          <Button
            className="mt-2"
            onClick={() => {
              authClient.signUp.email({
                name: "nevo",
                email: "test@gmail.com",
                password: "demo1234",
                username: "nevo",
              });
            }}
          >
            Sign up
          </Button>
          <Button
            className="mt-2"
            onClick={() => {
              authClient.signIn.email({
                email: "test@gmail.com",
                password: "demo1234",
              });
            }}
          >
            Sign in
          </Button>

          <Button
            className="mt-2"
            onClick={() => {
              authClient.signOut();
            }}
          >
            Sign out
          </Button>
          <PrettyStringify data={data} />
        </div>
        <div className="text-muted-foreground font-mono text-xs">
          (Press <kbd>d</kbd> to toggle dark mode)
        </div>
      </div>
    </div>
  );
}
