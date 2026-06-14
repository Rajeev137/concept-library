import { describe, it, expect } from "vitest";
import {
  registerSchema,
  loginSchema,
  passwordResetRequestSchema,
  passwordResetConfirmSchema,
  checkPasswordPolicy,
} from "@/lib/validators/auth";
import { PASSWORD_MIN_LEN } from "@/lib/validators/constants";

// ─── checkPasswordPolicy ─────────────────────────────────────────

describe("checkPasswordPolicy", () => {
  it("rejects password shorter than 12 characters", () => {
    const result = checkPasswordPolicy("short1!");
    expect(result.ok).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].field).toBe("password");
    expect(result.errors[0].message).toMatch(/12/);
  });

  it("rejects password exactly 11 characters", () => {
    const result = checkPasswordPolicy("Abcdefghij1");
    expect(result.ok).toBe(false);
    expect(result.errors[0].field).toBe("password");
  });

  it("accepts password exactly at minimum length (12 chars) when not common", () => {
    const result = checkPasswordPolicy("Tr0ub4dor&3!");
    expect(result.ok).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("accepts a strong long password", () => {
    const result = checkPasswordPolicy("Correct-Horse-Battery-Staple-99!");
    expect(result.ok).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("rejects a common password that meets length (case-insensitive check)", () => {
    // "correcthorse" is exactly 12 chars and is in the common list
    const result = checkPasswordPolicy("correcthorse");
    expect(result.ok).toBe(false);
    expect(result.errors[0].field).toBe("password");
    expect(result.errors[0].message).toMatch(/common/i);
  });

  it("rejects a common password regardless of casing when it meets length", () => {
    // "CORRECTHORSE" lowercased → "correcthorse" which is in the common list
    const result = checkPasswordPolicy("CORRECTHORSE");
    expect(result.ok).toBe(false);
    expect(result.errors[0].field).toBe("password");
    expect(result.errors[0].message).toMatch(/common/i);
  });

  it("rejects 'iloveyou' (in common list) even though it is 8 chars — fails length first", () => {
    const result = checkPasswordPolicy("iloveyou");
    expect(result.ok).toBe(false);
    expect(result.errors[0].field).toBe("password");
    // length check fires before common-password check
    expect(result.errors[0].message).toMatch(/12/);
  });

  it("rejects 'iloveyou123' (11 chars, also common) — fails length", () => {
    const result = checkPasswordPolicy("iloveyou123");
    expect(result.ok).toBe(false);
    expect(result.errors[0].message).toMatch(/12/);
  });

  it(`PASSWORD_MIN_LEN constant is ${PASSWORD_MIN_LEN}`, () => {
    expect(PASSWORD_MIN_LEN).toBe(12);
  });
});

// ─── registerSchema ───────────────────────────────────────────────

describe("registerSchema", () => {
  const valid = { email: "user@example.com", password: "Tr0ub4dor&3!" };

  it("accepts valid email and password", () => {
    const result = registerSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("rejects missing email", () => {
    const result = registerSchema.safeParse({ password: "Tr0ub4dor&3!" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email format", () => {
    const result = registerSchema.safeParse({ ...valid, email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("rejects missing password", () => {
    const result = registerSchema.safeParse({ email: "user@example.com" });
    expect(result.success).toBe(false);
  });

  it("rejects password shorter than 12 chars", () => {
    const result = registerSchema.safeParse({ ...valid, password: "short" });
    expect(result.success).toBe(false);
  });

  it("rejects unknown extra field (strict mode)", () => {
    const result = registerSchema.safeParse({ ...valid, user_id: "injected" });
    expect(result.success).toBe(false);
  });

  it("rejects user_id injection attempt", () => {
    const result = registerSchema.safeParse({
      ...valid,
      user_id: "00000000-0000-0000-0000-000000000000",
    });
    expect(result.success).toBe(false);
  });
});

// ─── loginSchema ─────────────────────────────────────────────────

describe("loginSchema", () => {
  const valid = { email: "user@example.com", password: "anypassword" };

  it("accepts valid email and any non-empty password", () => {
    const result = loginSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("rejects missing email", () => {
    const result = loginSchema.safeParse({ password: "anypassword" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email format", () => {
    const result = loginSchema.safeParse({ ...valid, email: "bad" });
    expect(result.success).toBe(false);
  });

  it("rejects empty password", () => {
    const result = loginSchema.safeParse({ ...valid, password: "" });
    expect(result.success).toBe(false);
  });

  it("rejects unknown extra field (strict mode)", () => {
    const result = loginSchema.safeParse({ ...valid, user_id: "injected" });
    expect(result.success).toBe(false);
  });

  // Login schema does NOT enforce min-length — that is checkPasswordPolicy's job
  it("accepts short password (login schema does not enforce min length)", () => {
    const result = loginSchema.safeParse({ ...valid, password: "x" });
    expect(result.success).toBe(true);
  });
});

// ─── passwordResetRequestSchema ───────────────────────────────────

describe("passwordResetRequestSchema", () => {
  it("accepts valid email", () => {
    const result = passwordResetRequestSchema.safeParse({
      email: "user@example.com",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = passwordResetRequestSchema.safeParse({ email: "not-email" });
    expect(result.success).toBe(false);
  });

  it("rejects empty email", () => {
    const result = passwordResetRequestSchema.safeParse({ email: "" });
    expect(result.success).toBe(false);
  });

  it("rejects missing email", () => {
    const result = passwordResetRequestSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects extra fields (strict mode)", () => {
    const result = passwordResetRequestSchema.safeParse({
      email: "user@example.com",
      user_id: "injected",
    });
    expect(result.success).toBe(false);
  });
});

// ─── passwordResetConfirmSchema ───────────────────────────────────

describe("passwordResetConfirmSchema", () => {
  const valid = { token: "some-reset-token", new_password: "NewStr0ng!Pass" };

  it("accepts valid token and strong new_password", () => {
    const result = passwordResetConfirmSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("rejects missing token", () => {
    const result = passwordResetConfirmSchema.safeParse({
      new_password: "NewStr0ng!Pass",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty token", () => {
    const result = passwordResetConfirmSchema.safeParse({
      ...valid,
      token: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing new_password", () => {
    const result = passwordResetConfirmSchema.safeParse({
      token: "some-reset-token",
    });
    expect(result.success).toBe(false);
  });

  it("rejects new_password shorter than 12 chars", () => {
    const result = passwordResetConfirmSchema.safeParse({
      ...valid,
      new_password: "short",
    });
    expect(result.success).toBe(false);
  });

  it("rejects extra fields (strict mode)", () => {
    const result = passwordResetConfirmSchema.safeParse({
      ...valid,
      user_id: "injected",
    });
    expect(result.success).toBe(false);
  });
});
