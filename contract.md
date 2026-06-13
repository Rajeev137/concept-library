# Concept Library — System Contract

## Service: Concept Library Web App
Multi-user personal knowledge base for interview-prep concept cards, grouped by parent topic for sidebar navigation. Each user has a private library; no card or topic is ever visible across users.

### Stack
- **Next.js (TypeScript, App Router) on Vercel.** Chosen over Vite+React because (a) server-only API routes are required to host the SUPABASE_SERVICE_ROLE_KEY off the browser, (b) middleware is needed for CSP/Origin/rate-limit enforcement from the contract, (c) one repo + one deploy + Supabase SSR helpers, (d) image optimization for uploaded diagrams.

### Inputs
- POST /api/auth/register: { email, password } → { session } | error
- POST /api/auth/login:    { email, password } → { session } | error
- POST /api/auth/logout:   {} → { ok: true }
- POST /api/auth/password-reset/request: { email } → { ok: true }   // always 200
- POST /api/auth/password-reset/confirm: { token, new_password } → { ok: true }

- GET    /api/topics:               (auth) → Topic[]                  // sidebar list
- POST   /api/topics:               (auth) TopicInput → Topic         // create-on-the-fly from card form
- PUT    /api/topics/:id:           (auth) TopicInput → Topic         // rename
- DELETE /api/topics/:id:           (auth) → { ok: true }             // only if empty; else 409
- GET    /api/topics/:id/concepts:  (auth) → Concept[]                // cards under a topic

- GET    /api/concepts:                       (auth) → Concept[]
- GET    /api/concepts/:id:                   (auth) → Concept
- POST   /api/concepts:                       (auth) ConceptInput → Concept
- PUT    /api/concepts/:id:                   (auth) ConceptInput → Concept
- DELETE /api/concepts/:id:                   (auth) → { ok: true }
- GET    /api/concepts/search?q=&tag=&topic=: (auth) → Concept[]

- POST   /api/uploads/concept-image:          (auth) multipart → { url, path }
- DELETE /api/uploads/concept-image:          (auth) { path } → { ok: true }

### Dependencies
- Supabase Auth — email + password, email confirmation required
- Supabase Postgres (`topics`, `concepts`, `comparisons`) — per-user via RLS
- Supabase Storage bucket `concept-images` — per-user via Storage RLS, CDN-served
- Vercel — Next.js app + API routes + middleware
- Upstash Redis (free tier) — rate-limit counters on auth endpoints only
- GitHub Actions — typecheck, lint, test, secret-leak scan on PR

### Invariants (data isolation)
- Every row in `topics`, `concepts`, `comparisons` has `user_id = auth.uid()`; enforced by RLS for SELECT, INSERT, UPDATE, DELETE.
- Storage objects in `concept-images` are pathed `{user_id}/{concept_id}/{filename}`; Storage RLS restricts access to objects whose first path segment matches `auth.uid()`.
- Anon API key returns ZERO rows from all three tables AND ZERO objects from the bucket. CI test asserts this.
- No endpoint accepts a `user_id` from the client; server reads it from the session only.
- Listing/search/get/update/delete are scoped to the session user — never `WHERE id = ?` alone, always `WHERE id = ? AND user_id = auth.uid()`.
- A concept's `topic_id` must reference a topic owned by the same user (FK + RLS).
- Deleting a topic with concepts under it → 409, never cascades. User must reassign or delete cards first.
- Service-role key only imported under `app/api/**`; never in components, never in middleware that serves HTML. CI greps for violations.

### Invariants (sessions — PERSISTENT)
- Sessions persist across browser refresh and across tabs. User stays logged in until they explicitly log out, or 30 days pass without activity (Supabase refresh-token rotation).
- Session token stored in HttpOnly cookies managed by @supabase/ssr; the access token is auto-refreshed in the background on each navigation.
- Page refresh restores the user to the same view (same topic, same card, same scroll position) via URL state + sessionStorage.
- Unsubmitted form drafts are auto-saved to localStorage every 1s under key `draft:concept:{topic_id|new}`; restored on form re-open, cleared on successful submit.
- Theme preference (dark/light) persisted in localStorage under `ui:theme`; defaults to system preference.
- Sidebar collapsed/expanded state persisted in localStorage under `ui:sidebar`.

### Invariants (auth + accounts)
- Passwords >= 12 chars; checked against a common-passwords denylist (top 10k).
- Password hashing handled by Supabase (bcrypt/argon2); app never sees a hash.
- Email confirmation required before first login succeeds.
- All auth cookies: HttpOnly, Secure, SameSite=Lax, signed by Supabase.
- Password reset tokens single-use, <= 30 min lifetime.
- Login, register, and password-reset responses do NOT distinguish "no such user" from "wrong password" — same generic error message, same minimum response time. Prevents email enumeration. Minimum response time: 250ms (lowered from the previous 400ms; still long enough to mask hash-compare timing).

### Invariants (abuse + availability)
- Rate limits, per IP, sliding window — AUTH ONLY:
    - /api/auth/login:    5 / 15 min, then 1 / min
    - /api/auth/register: 3 / hour
    - /api/auth/password-reset/request: 3 / hour
- No rate limits on other /api/* endpoints. Reads and writes from authenticated users are unconstrained.
- Rate-limit breach -> 429 with Retry-After.
- No per-user storage caps. No request body size cap beyond what Next.js / Vercel impose by default. Image uploads accepted up to platform default (~4.5 MB Vercel body limit); larger files use direct-to-Supabase upload with signed URL.
- Image MIME allowlist: image/png, image/jpeg, image/webp, image/gif. Other types rejected at the upload endpoint regardless of size.
- All write endpoints reject requests without a valid CSRF defense (SameSite cookie + Origin header check on POST/PUT/DELETE).

### Invariants (input + output)
- Every input validated server-side with Zod schemas (`.strict()` — unknown keys rejected). Client-side validation is UX only, never trusted.
- All user text rendered as text, never as HTML. If markdown rendering is added, uses `rehype-sanitize` with default schema; raw <script>, <iframe>, on* attributes, javascript: URLs stripped.
- Image filenames sanitized server-side (strip path separators, normalize unicode, max 80 chars) before storage upload.
- Image URLs returned to client are public CDN URLs from the user's own folder; signed URLs used for any non-public bucket access.
- No user input ever interpolated into SQL strings; only parameterized queries via Supabase client.
- API responses never include other users' data, internal IDs from auth.users, stack traces, or env values. Errors return { code, message }, nothing else.

### Invariants (transport + headers)
- HTTPS only; HTTP redirects to HTTPS (Vercel default).
- Response headers set globally via middleware:
    - Strict-Transport-Security: max-age=31536000; includeSubDomains
    - Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://*.supabase.co; connect-src 'self' https://*.supabase.co
    - X-Content-Type-Options: nosniff
    - Referrer-Policy: strict-origin-when-cross-origin
    - Permissions-Policy: geolocation=(), camera=(), microphone=()
- CORS: only same-origin allowed for /api/*.

### UI requirements
- Visual language follows Claude web UI: neutral surfaces, subtle borders, sentence-case labels, calm spacing, no decorative gradients.
- Layout: collapsible left sidebar (topics) + main panel (card list / card detail / card form).
- Sidebar:
    - Lists Topics (parent), each expandable to show Concept titles underneath.
    - Each topic row shows count of concepts. Click topic to expand/collapse; click concept to load it into main panel.
    - Search box at top of sidebar filters topics + concepts by title.
    - Collapsible to icon-only rail; state persisted.
- Theme toggle (dark/light/system) accessible from sidebar footer or top bar; persisted; respects `prefers-color-scheme` on first visit.
- "Add card" button: floating action button, bottom-LEFT of viewport (per user spec), always visible. Opens card form.
- Card form:
    - All concept fields required (non-empty; whitespace rejected; "N.A." accepted).
    - `comparisons` is a repeatable section: each row has `alternative` + `difference`; at least one row required; "Add comparison" adds another row; rows reorderable.
    - Parent topic field: combobox — type to search existing topics, or type a new name and create-on-submit. Required.
    - Image field: collapsible section, collapsed by default. When expanded, accepts drag-drop or click-to-upload. Shows thumbnail + remove button after upload. Image is optional.
- Card detail view: read-only render of the same fields, image expanded to full size if present, edit + delete buttons.
- Mobile-usable; sidebar becomes overlay drawer on narrow viewports.

### Error Boundaries
- Supabase unreachable -> 503; UI shows offline banner; draft preserved in localStorage.
- Auth expired or refresh-token invalidated -> 401 -> redirect /login with return URL.
- RLS denial -> empty result or 404 (never 403 with "you don't own this" — that leaks existence).
- Validation failure -> 422 with per-field error map; form highlights offending fields.
- Duplicate concept title under same topic -> 409, suggest edit.
- Duplicate topic name -> 409, return the existing topic so client can pick it instead of creating.
- Topic delete with concepts under it -> 409 with concept count in message.
- Rate-limit hit (auth endpoints) -> 429 + Retry-After.
- Image upload: wrong MIME -> 415; storage failure -> 502 with retry hint.
- Unhandled exception -> 500 with opaque trace_id; real error logged server-side only.

### Threat model (what the invariants defend against)
- Cross-user data leak              -> RLS on tables + Storage RLS on bucket + server-side user_id from session + CI test on anon key
- Cross-user image access           -> Storage path includes user_id as first segment; Storage RLS matches auth.uid()
- Email enumeration                 -> uniform responses + 250ms floor on auth endpoints
- Credential stuffing / brute force -> rate limit on /login, generic errors
- Registration abuse / spam         -> rate limit on /register, email confirmation
- DB key leak                       -> service-role key isolated to app/api/**, CI grep
- XSS                               -> CSP + no raw HTML + sanitized markdown + sanitized filenames
- CSRF                              -> SameSite cookies + Origin check on writes
- Malicious file upload             -> MIME allowlist + extension check + filename sanitization
- SQL injection                     -> parameterized queries only (Supabase client)
- Stack-trace info leak             -> opaque error envelope, real errors server-side
- Session theft                     -> HttpOnly+Secure cookies, HTTPS-only, refresh-token rotation

### Non-functional
- p95 page load < 1.5s on 4G; mobile-usable.
- Free-tier safe: < 500 MB Supabase DB, < 1 GB Supabase Storage, < 100 GB Vercel bandwidth/mo, < 10k Upstash commands/day.
- Secrets only in Vercel env + GH Actions secrets.
