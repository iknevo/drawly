"use client";

import { authClient } from "@/lib/auth-client";

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

export function DevMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="sm" className="text-muted-foreground" />}
      >
        Dev
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Dev tools — remove before deploy</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => {
              authClient.signUp.email({
                name: "nevo",
                email: "test@gmail.com",
                password: "demo1234",
                username: "nevo",
              });
            }}
          >
            Create test account
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              authClient.signIn.email({
                email: "test@gmail.com",
                password: "demo1234",
              });
            }}
          >
            Sign in as test user
          </DropdownMenuItem>
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
  );
}
