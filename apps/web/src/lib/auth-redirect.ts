const redirectBase = "https://focusx.invalid";

export const signupNextCookie = "focusx-signup-next";
export const confirmationPath = "/auth/confirm";

export function safeAuthNext(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/")) return "/rooms";

  try {
    const url = new URL(value, redirectBase);
    if (url.origin === redirectBase && !url.pathname.startsWith("//")) {
      return `${url.pathname}${url.search}${url.hash}`;
    }
  } catch {
    return "/rooms";
  }

  return "/rooms";
}
