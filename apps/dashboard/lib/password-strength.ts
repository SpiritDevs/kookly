import { msg } from "gt-next";

/** 0 = empty, 1–4 = weak → strong */
export type PasswordStrengthLevel = 0 | 1 | 2 | 3 | 4;
export const MIN_PASSWORD_LENGTH = 8;

/**
 * Passwords below the auth minimum stay in the weak/fair range so the
 * strength meter never overstates what the server will accept.
 */
export function getPasswordStrength(password: string): PasswordStrengthLevel {
  if (!password) return 0;

  const lower = /[a-z]/.test(password);
  const upper = /[A-Z]/.test(password);
  const digit = /\d/.test(password);
  const symbol = /[^a-zA-Z0-9]/.test(password);
  const types = [lower, upper, digit, symbol].filter(Boolean).length;
  const len = password.length;

  if (len < 9) return 1;
  if (len < MIN_PASSWORD_LENGTH) return 2;
  if (types >= 4) return 4;
  if (types >= 3) return 3;
  if (types >= 2) return 2;
  return 2;
}

export const PASSWORD_STRENGTH_LABELS: Record<Exclude<PasswordStrengthLevel, 0>, string> = {
  1: msg("Weak"),
  2: msg("Fair"),
  3: msg("Good"),
  4: msg("Strong"),
};
