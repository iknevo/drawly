"use client";

import { MoonIcon, SunIcon, UserIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { Poppins } from "next/font/google";
import Link from "next/link";

import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

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

import { DevMenu } from "./dev-menu";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["700"],
});

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Toggle theme"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <SunIcon className={cn(resolvedTheme === "dark" ? "block" : "hidden")} />
      <MoonIcon className={cn(resolvedTheme === "dark" ? "hidden" : "block")} />
    </Button>
  );
}

export function HomeHeader() {
  const { data } = authClient.useSession();

  return (
    <header className="flex h-16 items-center justify-between">
      <Link href="/">
        <span className={cn("text-2xl font-semibold", poppins.className)}>Drawly</span>
      </Link>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <DevMenu />
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
