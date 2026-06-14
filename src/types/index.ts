// Re-export all domain types from the canonical interfaces file.
// This module is the single import point for types inside /src.

export type UUID = string;
export type ISO8601String = string;
export type Email = string;

export interface Topic {
  id: UUID;
  user_id: UUID;
  name: string;
  concept_count: number;
  created_at: ISO8601String;
  updated_at: ISO8601String;
}

export interface TopicInput {
  name: string;
}

export interface Comparison {
  id: UUID;
  concept_id: UUID;
  alternative: string;
  difference: string;
  position: number;
}

export interface ComparisonInput {
  alternative: string;
  difference: string;
  position: number;
}

export interface ConceptImage {
  url: string;
  path: string;
  width?: number;
  height?: number;
  uploaded_at: ISO8601String;
}

export interface Concept {
  id: UUID;
  user_id: UUID;
  topic_id: UUID;
  title: string;
  what_it_does: string;
  comparisons: Comparison[];
  when_it_breaks: string;
  explain_in_30s: string;
  where_i_used_it: string;
  tags: string[];
  image: ConceptImage | null;
  created_at: ISO8601String;
  updated_at: ISO8601String;
}

export interface ConceptInput {
  topic_id: UUID | null;
  topic_name_new?: string;
  title: string;
  what_it_does: string;
  comparisons: ComparisonInput[];
  when_it_breaks: string;
  explain_in_30s: string;
  where_i_used_it: string;
  tags: string[];
  image: ConceptImage | null;
}

export interface FieldError {
  field: string;
  message: string;
}

export interface ValidationResult {
  ok: boolean;
  errors: FieldError[];
}

export interface Session {
  user_id: UUID;
  email: Email;
  access_token: string;
  expires_at: ISO8601String;
}

export interface RegisterRequest {
  email: Email;
  password: string;
}

export interface LoginRequest {
  email: Email;
  password: string;
}

export interface PasswordResetRequest {
  email: Email;
}

export interface PasswordResetConfirm {
  token: string;
  new_password: string;
}

export interface AuthError {
  code: "AUTH_FAILED" | "RATE_LIMITED" | "EMAIL_NOT_CONFIRMED" | "WEAK_PASSWORD";
  message: string;
}

export interface RateLimitRule {
  key: "login" | "register" | "password_reset";
  window_seconds: number;
  max_hits: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  reset_at: ISO8601String;
}

export interface UploadRequest {
  concept_id: UUID | "draft";
  file: File | Blob;
}

export interface UploadResponse {
  url: string;
  path: string;
}

export interface UiPrefs {
  theme: "light" | "dark" | "system";
  sidebar_collapsed: boolean;
  expanded_topic_ids: UUID[];
}

export interface DraftConcept {
  topic_id: UUID | null;
  topic_name_new?: string;
  partial: Partial<ConceptInput>;
  updated_at: ISO8601String;
}

export type ErrorCode =
  | "VALIDATION"
  | "AUTH_FAILED"
  | "UNAUTHENTICATED"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "UNSUPPORTED_MEDIA_TYPE"
  | "UPSTREAM_UNAVAILABLE"
  | "INTERNAL";

export type ApiSuccess<T> = { ok: true; data: T };
export type ApiError = {
  ok: false;
  error: {
    code: ErrorCode;
    message: string;
    fields?: FieldError[];
    trace_id?: string;
  };
};
export type ApiResult<T> = ApiSuccess<T> | ApiError;

export const IMAGE_POLICY = {
  ALLOWED_MIME: ["image/png", "image/jpeg", "image/webp", "image/gif"] as const,
  MAX_FILENAME_CHARS: 80,
} as const;

export type AllowedMimeType = typeof IMAGE_POLICY.ALLOWED_MIME[number];

export const TOPIC_POLICY = {
  NAME_MAX_LEN: 80,
  CASE_INSENSITIVE_UNIQUE: true,
} as const;
