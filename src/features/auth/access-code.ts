/** Pure access-code helpers — shared by the login form and the auth service. */
export const ACCESS_CODE_PATTERN = /^ASTRA-\d{4}-[A-Z]{3}$/;

export function normalizeAccessCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

export type CodeFormatError = "empty" | "format";

export function checkAccessCodeFormat(raw: string): CodeFormatError | null {
  const code = normalizeAccessCode(raw);
  if (code.length === 0) return "empty";
  if (!ACCESS_CODE_PATTERN.test(code)) return "format";
  return null;
}

export const AUTH_ERROR_MESSAGES = {
  empty: "Enter your astronaut access code.",
  format: "Access codes look like ASTRA-0000-XXX.",
  unknown: "This access code isn't recognised. Check it and try again.",
  locked: "Too many attempts. Wait a moment before trying again.",
} as const;

export type AuthErrorCode = keyof typeof AUTH_ERROR_MESSAGES;
