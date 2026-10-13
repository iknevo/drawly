import "server-only";

import type { Account, Session } from "better-auth";

import { auth } from "@/lib/auth";

type SessionUser = typeof auth.$Infer.Session.user;

export async function getUserByEmail(email: string): Promise<SessionUser | null> {
  const ctx = await auth.$context;

  const result = await ctx.internalAdapter.findUserByEmail(email);

  return (result?.user as SessionUser | undefined) ?? null;
}

export async function getUserById(id: string): Promise<SessionUser | null> {
  const ctx = await auth.$context;

  return ((await ctx.internalAdapter.findUserById(id)) as SessionUser | null) ?? null;
}

export async function userExists(email: string): Promise<boolean> {
  return (await getUserByEmail(email)) !== null;
}

export async function getUserAccounts(userId: string): Promise<Account[]> {
  const ctx = await auth.$context;

  return await ctx.internalAdapter.findAccounts(userId);
}

export async function listUserSessions(
  userId: string,
  options?: { onlyActiveSessions?: boolean }
): Promise<Session[]> {
  const ctx = await auth.$context;

  return await ctx.internalAdapter.listSessions(userId, options);
}
