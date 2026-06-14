import { z } from "zod";
import type { RegisterRequest, LoginRequest, PasswordResetRequest, PasswordResetConfirm, ValidationResult } from "@/types";

// TODO: Load the top-10k common passwords list (bundled as a Set) for denylist check.
// The list should be imported as a static asset or inline constant — not fetched at runtime.
let COMMON_PASSWORDS: Set<string>;

// TODO: Define Zod schema for RegisterRequest (.strict()).
// password: min 12 chars. Email: valid email format.
export const registerSchema = z.object({
  // TODO: email: z.string().email(),
  // TODO: password: z.string().min(12, "Password must be at least 12 characters"),
}).strict();

// TODO: Define Zod schema for LoginRequest (.strict()).
export const loginSchema = z.object({
  // TODO: email: z.string().email(),
  // TODO: password: z.string().min(1),
}).strict();

// TODO: Define Zod schema for PasswordResetRequest (.strict()).
export const passwordResetRequestSchema = z.object({
  // TODO: email: z.string().email(),
}).strict();

// TODO: Define Zod schema for PasswordResetConfirm (.strict()).
export const passwordResetConfirmSchema = z.object({
  // TODO: token: z.string().min(1),
  // TODO: new_password: z.string().min(12, "Password must be at least 12 characters"),
}).strict();

// TODO: Check password against PasswordPolicy: min 12 chars AND not in common-passwords list.
// Return ValidationResult with { field: "password", message: "..." } on failure.
// Used server-side in register and password-reset/confirm handlers.
export function checkPasswordPolicy(pw: string): ValidationResult {
  // TODO: if (pw.length < 12) return { ok: false, errors: [{ field: "password", message: "Must be at least 12 characters" }] }
  // TODO: if (COMMON_PASSWORDS.has(pw.toLowerCase())) return { ok: false, errors: [{ field: "password", message: "Password is too common" }] }
  return { ok: true, errors: [] };
}
