// ─── Domain ─────────────────────────────────────────────────────

type UUID = string;
type ISO8601String = string;
type Email = string;

interface Topic {
  id: UUID;
  user_id: UUID;
  name: string;                       // "Kubernetes"
  concept_count: number;              // denormalized for sidebar render
  created_at: ISO8601String;
  updated_at: ISO8601String;
}

interface TopicInput {
  name: string;                       // unique per user (case-insensitive); whitespace trimmed
}

interface Comparison {
  id: UUID;
  concept_id: UUID;
  alternative: string;
  difference: string;
  position: number;
}

interface ComparisonInput {
  alternative: string;
  difference: string;
  position: number;
}

interface ConceptImage {
  url: string;                        // public CDN URL from Supabase Storage
  path: string;                       // storage path: "{user_id}/{concept_id}/{filename}"
  width?: number;
  height?: number;
  uploaded_at: ISO8601String;
}

interface Concept {
  id: UUID;
  user_id: UUID;                      // server-set from session, never client-set
  topic_id: UUID;                     // FK to topics; topic must belong to same user
  title: string;
  what_it_does: string;
  comparisons: Comparison[];
  when_it_breaks: string;
  explain_in_30s: string;
  where_i_used_it: string;
  tags: string[];
  image: ConceptImage | null;         // optional, collapsible UI section
  created_at: ISO8601String;
  updated_at: ISO8601String;
}

interface ConceptInput {
  // user_id intentionally absent — server reads it from session
  topic_id: UUID | null;              // null means "create from topic_name_new"
  topic_name_new?: string;            // if topic_id is null, server creates a topic with this name
  title: string;
  what_it_does: string;
  comparisons: ComparisonInput[];
  when_it_breaks: string;
  explain_in_30s: string;
  where_i_used_it: string;
  tags: string[];
  image: ConceptImage | null;         // client uploads via /api/uploads, then submits the returned { url, path }
}

// ─── Validation ─────────────────────────────────────────────────
// Every required string must be non-empty (whitespace-only rejected).
// "N.A." is a valid value — rule is "type something," not "type a lot."

interface FieldError {
  field: string;                      // dotted: "comparisons[0].difference"
  message: string;
}

interface ValidationResult {
  ok: boolean;
  errors: FieldError[];
}

const REQUIRED_STRINGS: (keyof ConceptInput)[] = [
  "title",
  "what_it_does",
  "when_it_breaks",
  "explain_in_30s",
  "where_i_used_it",
];

// Image policy
const IMAGE_POLICY = {
  ALLOWED_MIME: ["image/png", "image/jpeg", "image/webp", "image/gif"] as const,
  MAX_FILENAME_CHARS: 80,
  // No size cap enforced by us; platform default (~4.5MB Vercel body) applies.
  // For larger files, use signed-upload-URL flow direct to Supabase Storage.
} as const;

const TOPIC_POLICY = {
  NAME_MAX_LEN: 80,
  CASE_INSENSITIVE_UNIQUE: true,      // "Kubernetes" == "kubernetes"
} as const;

function validateConcept(input: ConceptInput): ValidationResult;
function validateTopic(input: TopicInput): ValidationResult;

// ─── Auth ───────────────────────────────────────────────────────

interface Session {
  user_id: UUID;
  email: Email;
  access_token: string;
  expires_at: ISO8601String;
}

interface RegisterRequest      { email: Email; password: string; }
interface LoginRequest         { email: Email; password: string; }
interface PasswordResetRequest { email: Email; }
interface PasswordResetConfirm { token: string; new_password: string; }

interface PasswordPolicy {
  min_length: 12;
  must_not_be_in_common_list: true;
}
function checkPasswordPolicy(pw: string): ValidationResult;

interface AuthError {
  code: "AUTH_FAILED" | "RATE_LIMITED" | "EMAIL_NOT_CONFIRMED" | "WEAK_PASSWORD";
  message: string;                    // generic — UI does not branch on email-vs-password
}

function register(req: RegisterRequest): Promise<{ session: Session } | AuthError>;
function login(req: LoginRequest):       Promise<{ session: Session } | AuthError>;
function logout(): Promise<{ ok: true }>;
function requestPasswordReset(req: PasswordResetRequest): Promise<{ ok: true }>;
function confirmPasswordReset(req: PasswordResetConfirm): Promise<{ ok: true } | AuthError>;

// Session is restored from Supabase SSR cookies on every request — survives refresh + tabs.
function getSession(): Promise<Session | null>;
function requireUser(s: Session | null): asserts s is Session;

// ─── Rate limiting (AUTH ENDPOINTS ONLY) ────────────────────────

interface RateLimitRule {
  key: "login" | "register" | "password_reset";
  window_seconds: number;
  max_hits: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  reset_at: ISO8601String;
}

function checkRateLimit(rule: RateLimitRule, identifier: string): Promise<RateLimitResult>;

// ─── Repos (server-side; all queries auto-scoped to session.user_id) ────

interface TopicRepo {
  list(session: Session): Promise<Topic[]>;
  get(session: Session, id: UUID): Promise<Topic | null>;
  findByName(session: Session, name: string): Promise<Topic | null>;
  create(session: Session, input: TopicInput): Promise<Topic>;
  rename(session: Session, id: UUID, name: string): Promise<Topic>;
  remove(session: Session, id: UUID): Promise<{ ok: true }>;   // 409 if non-empty
  listConcepts(session: Session, id: UUID): Promise<Concept[]>;
}

interface ConceptRepo {
  list(session: Session, opts?: { q?: string; tag?: string; topic_id?: UUID }): Promise<Concept[]>;
  get(session: Session, id: UUID): Promise<Concept | null>;
  create(session: Session, input: ConceptInput): Promise<Concept>;
  update(session: Session, id: UUID, input: ConceptInput): Promise<Concept>;
  remove(session: Session, id: UUID): Promise<{ ok: true }>;
}

// ─── Image upload ───────────────────────────────────────────────

interface UploadRequest {
  concept_id: UUID | "draft";         // "draft" allowed before card is saved; client must claim it on submit
  file: File | Blob;                  // browser-side type; server receives multipart
}
interface UploadResponse {
  url: string;
  path: string;
}

function uploadConceptImage(session: Session, req: UploadRequest): Promise<UploadResponse>;
function deleteConceptImage(session: Session, path: string): Promise<{ ok: true }>;

// ─── UI state (persisted in localStorage / sessionStorage) ──────

interface UiPrefs {
  theme: "light" | "dark" | "system";   // localStorage key: ui:theme
  sidebar_collapsed: boolean;           // localStorage key: ui:sidebar
  expanded_topic_ids: UUID[];           // localStorage key: ui:expanded-topics
}

interface DraftConcept {
  topic_id: UUID | null;
  topic_name_new?: string;
  partial: Partial<ConceptInput>;
  updated_at: ISO8601String;
}
// localStorage key: draft:concept:{topic_id|"new"}; auto-save every 1s; cleared on submit.

// ─── API envelopes ──────────────────────────────────────────────

type ErrorCode =
  | "VALIDATION"
  | "AUTH_FAILED"
  | "UNAUTHENTICATED"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "UNSUPPORTED_MEDIA_TYPE"
  | "UPSTREAM_UNAVAILABLE"
  | "INTERNAL";

type ApiSuccess<T> = { ok: true; data: T };
type ApiError      = {
  ok: false;
  error: {
    code: ErrorCode;
    message: string;
    fields?: FieldError[];            // only for VALIDATION
    trace_id?: string;                // only for INTERNAL
  };
};
type ApiResult<T>  = ApiSuccess<T> | ApiError;
