import { createSerializer, parseAsBoolean, parseAsString } from "nuqs/server";

export function safeRedirect(value?: string): string | undefined {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return undefined;
  return value;
}

const authHrefSerializer = createSerializer(
  { redirect: parseAsString.withDefault("") },
  { clearOnDefault: true }
);

export function authHref(path: "/auth/sign-in" | "/auth/sign-up", redirectTo?: string): string {
  const target = safeRedirect(redirectTo);
  if (!target) return path;
  return authHrefSerializer(path, { redirect: target });
}

const verifyEmailHrefSerializer = createSerializer(
  {
    email: parseAsString.withDefault(""),
    verified: parseAsBoolean.withDefault(false),
    redirect: parseAsString.withDefault(""),
  },
  { clearOnDefault: true }
);

export function verifyEmailHref(
  email?: string,
  { verified = false, redirectTo }: { verified?: boolean; redirectTo?: string } = {}
): string {
  const target = safeRedirect(redirectTo);
  const values: Record<string, string | boolean> = {
    email: email ?? "",
    verified: !!verified,
  };
  if (target) values.redirect = target;

  return verifyEmailHrefSerializer("/auth/verify-email", values);
}
