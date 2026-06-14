import { z } from "zod";
import type { ValidationResult } from "@/types";
import { PASSWORD_MIN_LEN, COMMON_PASSWORDS } from "./constants";

export const registerSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    password: z
      .string()
      .min(PASSWORD_MIN_LEN, `Password must be at least ${PASSWORD_MIN_LEN} characters`),
  })
  .strict();

export const loginSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
  })
  .strict();

export const passwordResetRequestSchema = z
  .object({
    email: z.string().email("Invalid email address"),
  })
  .strict();

export const passwordResetConfirmSchema = z
  .object({
    token: z.string().min(1, "Token is required"),
    new_password: z
      .string()
      .min(PASSWORD_MIN_LEN, `Password must be at least ${PASSWORD_MIN_LEN} characters`),
  })
  .strict();

export function checkPasswordPolicy(pw: string): ValidationResult {
  if (pw.length < PASSWORD_MIN_LEN) {
    return {
      ok: false,
      errors: [
        {
          field: "password",
          message: `Password must be at least ${PASSWORD_MIN_LEN} characters`,
        },
      ],
    };
  }
  if (COMMON_PASSWORDS.has(pw.toLowerCase())) {
    return {
      ok: false,
      errors: [
        {
          field: "password",
          message: "Password is too common. Please choose a stronger password.",
        },
      ],
    };
  }
  return { ok: true, errors: [] };
}
