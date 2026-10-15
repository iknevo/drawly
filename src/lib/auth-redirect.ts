export function safeRedirect(value?: string): string | undefined {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return undefined;
  return value;
}

export function authHref(path: "/auth/sign-in" | "/auth/sign-up", redirectTo?: string): string {
  const target = safeRedirect(redirectTo);
  if (!target) return path;
  return `${path}?${new URLSearchParams({ redirect: target })}`;
}
