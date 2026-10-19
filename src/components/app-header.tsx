"use client";

import { UserIcon } from "lucide-react";
import { Poppins } from "next/font/google";
import Link from "next/link";

import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

import { SoundToggle } from "@/components/sound-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["700"],
});

export function AppHeader() {
  const { data } = authClient.useSession();

  return (
    <header className="mx-auto flex h-16 w-full max-w-6xl shrink-0 items-center gap-3 px-6">
      <Link href="/" className="shrink-0">
        <span className={cn("text-2xl font-semibold", poppins.className)}>Drawly</span>
      </Link>

      <div id="app-header-title" className="flex min-w-0 items-center gap-2" />

      <div className="ml-auto flex shrink-0 items-center gap-2">
        <div id="app-header-actions" className="flex items-center gap-2" />
        <SoundToggle />
        <ThemeToggle />
        {data?.user ? (
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
              <UserIcon />
              {data.user.name || data.user.email}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="truncate">{data.user.email}</DropdownMenuLabel>
                <DropdownMenuItem render={<Link href="/boards" />}>My boards</DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/docs" />}>My docs</DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/sessions" />}>My sessions</DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  authClient.signOut();
                }}
              >
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button nativeButton={false} render={<Link href="/auth/sign-in">Sign in</Link>} />
        )}
      </div>
    </header>
  );
}
