# Concept Library — Task Checklist

Legend: `[ ]` todo · `[x]` done · `[~]` current phase

---

## Phase 0 — Repo, deploy, Supabase project, RLS test in CI
> Goal: a live Vercel URL that returns a hello page, with CI enforcing the anon-key isolation invariant.

- [~] **`.github/workflows/ci.yml`** — wire up typecheck (`tsc --noEmit`), lint (`eslint .`), test (`npm test`), and a `grep` job that fails if `SUPABASE_SERVICE_ROLE_KEY` appears outside `src/app/api/` or `src/lib/`
- [~] **`src/app/layout.tsx`** — root layout: set `<html lang="en">`, import `globals.css`, no auth logic yet
- [~] **`src/app/(app)/page.tsx`** — placeholder hello page ("Concept Library — coming soon") so Vercel deploy succeeds
- [~] **`src/lib/supabase/client.ts`** — browser Supabase client using `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` via `createBrowserClient` from `@supabase/ssr`
- [~] **`src/lib/supabase/server.ts`** — server Supabase client (service-role) using `createServerClient` from `@supabase/ssr`; reads cookies from Next.js headers
- [~] **`src/lib/supabase/middleware.ts`** — middleware Supabase client (anon key only) for session cookie refresh
- [~] **`src/types/index.ts`** — re-export everything from `interfaces.ts`; no new types
- [~] **`tests/anon-key-isolation.test.ts`** — implement: connect with anon key, assert `topics`, `concepts`, `comparisons` return 0 rows and `concept-images` bucket returns 0 objects; this test must always pass
- [~] **Supabase project** (manual, out-of-band) — create project, apply SQL for `topics`/`concepts`/`comparisons` tables with RLS policies, create `concept-images` bucket with Storage RLS, copy keys to `.env.local`
- [~] **Vercel project** (manual, out-of-band) — connect GitHub repo, add env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`), confirm deploy green

---

## Phase 1 — Auth: login, register, session, protected route
> Goal: deployable. You can register, confirm email, and log in. Unauthenticated users are redirected.

- [ ] **`src/lib/errors.ts`** — implement `ApiRouteError` class, `apiHandler()` wrapper, `toApiError()` helper; all API routes wrap with this
- [ ] **`src/lib/validators/constants.ts`** — export `COMMON_PASSWORDS` denylist (top 10k list), `PASSWORD_MIN_LEN = 12`
- [ ] **`src/lib/validators/auth.ts`** — implement Zod schemas (`.strict()`) for `RegisterRequest`, `LoginRequest`, `PasswordResetRequest`, `PasswordResetConfirm`; implement `checkPasswordPolicy()`
- [ ] **`src/lib/rate-limit/index.ts`** — implement `checkRateLimit()` using Upstash Redis sliding-window; rules: login 5/15min then 1/min, register 3/hr, password-reset 3/hr
- [ ] **`src/app/api/auth/register/route.ts`** — POST: validate with auth schema, check password policy, call `supabase.auth.signUp()`; 250ms minimum response floor; generic error message regardless of failure type
- [ ] **`src/app/api/auth/login/route.ts`** — POST: rate-limit check first, then validate, then `supabase.auth.signInWithPassword()`; 250ms floor; generic error
- [ ] **`src/app/api/auth/logout/route.ts`** — POST: `supabase.auth.signOut()`; clear session cookies
- [ ] **`src/app/api/auth/password-reset/request/route.ts`** — POST: rate-limit, validate email, call `supabase.auth.resetPasswordForEmail()`; always returns `{ ok: true }` (never reveals email existence); 250ms floor
- [ ] **`src/app/api/auth/password-reset/confirm/route.ts`** — POST: validate token + new_password, check password policy, call `supabase.auth.updateUser()`
- [ ] **`src/middleware.ts`** — implement: refresh session cookies via middleware Supabase client; set all security headers (CSP, HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy); enforce Origin header check on POST/PUT/DELETE to `/api/*`
- [ ] **`src/app/(auth)/layout.tsx`** — auth route group layout: no app shell; redirect to `/` if session already exists
- [ ] **`src/app/(auth)/login/page.tsx`** — login form: email + password fields, submit calls `POST /api/auth/login`, shows generic error, redirects to `returnUrl` or `/` on success
- [ ] **`src/app/(auth)/register/page.tsx`** — register form: email + password, calls `POST /api/auth/register`, shows "check your email" after success
- [ ] **`src/app/(auth)/reset-password/page.tsx`** — request-reset form: email field, calls `/api/auth/password-reset/request`
- [ ] **`src/app/(auth)/reset-password/confirm/page.tsx`** — confirm-reset form: reads token from URL, new_password field, calls `/api/auth/password-reset/confirm`
- [ ] **`src/app/(app)/layout.tsx`** — protected layout: call `getSession()`; redirect to `/login?returnUrl=…` if null; render `AppShell` around `{children}`
- [ ] **`src/hooks/useSession.ts`** — implement: read session from Supabase browser client; expose `{ session, loading }`
- [ ] **`tests/unit/validators-auth.test.ts`** — unit tests for `checkPasswordPolicy()`: min length, common-password rejection, valid password passes
- [ ] **`tests/unit/rate-limit.test.ts`** — unit tests for `checkRateLimit()`: allowed on first hit, denied after limit, Retry-After set

---

## Phase 2 — Schema, create-concept form, POST endpoint
> Goal: deployable. You can add one concept card (with a new or existing topic).

- [ ] **`src/lib/validators/topic.ts`** — implement Zod schema (`.strict()`) for `TopicInput`; name non-empty, trimmed, max 80 chars
- [ ] **`src/lib/validators/concept.ts`** — implement Zod schema (`.strict()`) for `ConceptInput`; all `REQUIRED_STRINGS` non-empty; comparisons array min 1 entry; each comparison `alternative`+`difference` non-empty; `topic_id` or `topic_name_new` required; `user_id` must NOT be present (`.strict()` rejects it)
- [ ] **`src/lib/repos/topics.ts`** — implement `TopicRepo`: `list`, `get`, `findByName`, `create`, `rename`, `remove` (409 if concepts exist), `listConcepts`; every query filters by `session.user_id`
- [ ] **`src/lib/repos/concepts.ts`** — implement `ConceptRepo`: `list` (with optional `q`/`tag`/`topic_id` filters), `get`, `create`, `update`, `remove`; every query filters by `session.user_id`; `create` handles `topic_name_new` — calls `topics.findByName` first (409 if duplicate name), else creates topic then concept
- [ ] **`src/app/api/topics/route.ts`** — GET: `requireUser`, call `topicRepo.list()`; POST: validate `TopicInput`, call `topicRepo.create()`, 409 on duplicate name returning existing topic
- [ ] **`src/app/api/topics/[id]/route.ts`** — PUT: validate `TopicInput`, call `topicRepo.rename()`; DELETE: call `topicRepo.remove()`, 409 if non-empty with concept count
- [ ] **`src/app/api/topics/[id]/concepts/route.ts`** — GET: `requireUser`, call `topicRepo.listConcepts()`
- [ ] **`src/app/api/concepts/route.ts`** — GET: `requireUser`, call `conceptRepo.list()`; POST: validate `ConceptInput`, call `conceptRepo.create()`, 409 on duplicate title under same topic
- [ ] **`src/lib/upload/index.ts`** — implement `uploadConceptImage()` and `deleteConceptImage()`; validate MIME against `IMAGE_POLICY.ALLOWED_MIME` AND sniff magic bytes; sanitize filename (strip path separators, NFC normalize, truncate to 80 chars); storage path `{user_id}/{concept_id}/{filename}`
- [ ] **`src/app/api/uploads/concept-image/route.ts`** — POST: `requireUser`, parse multipart, call `uploadConceptImage()`; return `{ url, path }`; 415 on bad MIME; DELETE: validate `{ path }`, verify path starts with `session.user_id`, call `deleteConceptImage()`
- [ ] **`src/components/layout/ThemeProvider.tsx`** — implement: read `ui:theme` from localStorage on mount, apply `dark` class to `<html>`, listen to `prefers-color-scheme` when value is `system`
- [ ] **`src/hooks/useLocalStorage.ts`** — implement generic `useLocalStorage<T>(key, defaultValue)` hook with SSR-safe read
- [ ] **`src/components/layout/AppShell.tsx`** — implement layout: sidebar on left, main panel on right; pass sidebar collapsed state down; render `<OfflineBanner />` at top
- [ ] **`src/components/sidebar/Sidebar.tsx`** — implement: topic list from `GET /api/topics`, search box filtering titles, collapse/expand per topic (persisted via `ui:expanded-topics`), collapse-to-rail toggle (persisted via `ui:sidebar`), theme toggle at footer
- [ ] **`src/components/sidebar/TopicRow.tsx`** — implement: topic name + concept count chip; expand/collapse to show concept titles; click concept title triggers URL update
- [ ] **`src/components/ui/ThemeToggle.tsx`** — implement: cycle light→dark→system, write to `ui:theme`
- [ ] **`src/components/ui/OfflineBanner.tsx`** — implement: listen to `window.online/offline`, show banner when offline; hide when online
- [ ] **`src/components/card/ConceptForm.tsx`** — implement full form: all `ConceptInput` fields, repeatable comparisons section (add/remove/reorder rows), topic combobox (search existing or type new name), optional image section (drag-drop + thumbnail preview), auto-save draft every 1s to `draft:concept:{topic_id|new}`, clear on submit, submit calls `POST /api/concepts`
- [ ] **`src/components/card/AddCardButton.tsx`** — implement: floating action button fixed bottom-left, opens `ConceptForm`
- [ ] **`src/hooks/useDraftConcept.ts`** — implement: read/write `DraftConcept` from localStorage key `draft:concept:{topic_id|"new"}` debounced at 1s; expose `{ draft, save, clear }`
- [ ] **`tests/unit/validators-concept.test.ts`** — tests matching contract error boundaries: empty required string rejected, whitespace-only rejected, "N.A." accepted, comparisons min-1 enforced, `user_id` in body rejected by `.strict()`
- [ ] **`tests/unit/validators-topic.test.ts`** — tests: name required, max 80 chars, whitespace trimmed
- [ ] **`tests/unit/repos-topics.test.ts`** — unit tests for `TopicRepo`: 409 on duplicate name, 409 on delete with concepts, `user_id` scoping
- [ ] **`tests/unit/repos-concepts.test.ts`** — unit tests for `ConceptRepo`: 409 on duplicate title+topic, `user_id` always scoped, auto-creates topic from `topic_name_new`

---

## Phase 3 — List and detail view
> Goal: deployable. You can browse all cards, click a topic to see its cards, click a card to read it.

- [ ] **`src/app/api/concepts/[id]/route.ts`** — GET: `requireUser`, call `conceptRepo.get()`, 404 if null (never 403); PUT: validate `ConceptInput`, call `conceptRepo.update()`; DELETE: call `conceptRepo.remove()`
- [ ] **`src/app/api/concepts/search/route.ts`** — GET: parse `?q=&tag=&topic=` from URL, `requireUser`, call `conceptRepo.list({ q, tag, topic_id })`
- [ ] **`src/app/(app)/page.tsx`** — implement: read `?topic=&concept=` URL params; render `ConceptList` (topic view or all-cards) in main panel; render `ConceptDetail` when `concept` param is set; restore scroll position from `sessionStorage` key `scroll:topic:{topicId}`
- [ ] **`src/components/card/ConceptList.tsx`** — implement: fetch from `GET /api/topics/:id/concepts` or `GET /api/concepts`; render card title rows; click updates URL param `?concept=`; show loading skeleton; show empty state
- [ ] **`src/components/card/ConceptDetail.tsx`** — implement: fetch `GET /api/concepts/:id`; render all fields read-only (title, what_it_does, comparisons table, when_it_breaks, explain_in_30s, where_i_used_it, tags, image full-size); edit + delete buttons in header
- [ ] **`tests/unit/concept-detail.test.ts`** — tests: 404 returns null (not 403), RLS denial surfaces as 404, detail renders all fields

---

## Phase 4 — Edit, delete, search, tags
> Goal: deployable. Full CRUD. Search works. Tags filter.

- [ ] **`src/components/card/ConceptForm.tsx`** (edit mode) — extend existing form: accept optional `concept` prop; pre-fill all fields from existing `Concept`; on submit call `PUT /api/concepts/:id`; clear draft on success
- [ ] **`src/components/card/ConceptDetail.tsx`** (delete flow) — wire delete button: call `DELETE /api/concepts/:id`, on success remove from URL and refresh topic list; show confirmation before delete
- [ ] **`src/components/sidebar/Sidebar.tsx`** (search) — wire search box to `GET /api/concepts/search?q=`; debounce 300ms; highlight matching titles; clear on empty
- [ ] **`src/components/ui/TagInput.tsx`** — new component: comma or enter to add tag, backspace to remove last, renders tag chips; used in `ConceptForm`
- [ ] **Tag filter in sidebar/search** — clicking a tag chip in `ConceptDetail` updates URL and triggers `GET /api/concepts/search?tag=`
- [ ] **Topic rename + delete** — wire PUT/DELETE topic from sidebar context menu (right-click or ellipsis); 409 with concept count shown as toast
- [ ] **`tests/unit/search.test.ts`** — tests: `q` param filters by title substring, `tag` param filters by exact tag, `topic` param scopes to topic; all scoped to `user_id`

---

## Phase 5 — Polish: mobile layout, keyboard shortcuts, offline draft
> Goal: production-ready. Mobile-usable. Keyboard-navigable. Offline draft preserved.

- [ ] **Mobile sidebar drawer** — on viewport < 768px, sidebar becomes overlay drawer; toggle via hamburger button; close on outside click or Escape
- [ ] **Keyboard shortcuts** — `N` opens new card form, `E` opens edit for focused card, `Delete`/`Backspace` triggers delete confirmation, `Escape` closes form/drawer, `/` focuses sidebar search; document shortcuts in a help modal (`?`)
- [ ] **Offline draft resilience** — `OfflineBanner` already shows; add logic in `ConceptForm` to detect 503/network failure and keep draft alive; auto-retry submit on reconnect
- [ ] **`src/components/card/ConceptForm.tsx`** (large file upload) — for files > 4MB, switch to signed-URL direct upload: call `/api/uploads/concept-image` with `concept_id=draft`, receive signed URL, upload directly from browser to Supabase Storage; claim path on concept save
- [ ] **Scroll restoration** — on concept/topic navigation, save `window.scrollY` to `sessionStorage` key `scroll:topic:{topicId}`; restore on back-navigation
- [ ] **`tests/e2e/`** — Playwright: register → confirm email (via Supabase test hook) → login → create topic + card → view card → edit → delete → logout; assert anon redirect to `/login`
- [ ] **Pre-launch smoke tests** — from `security.md`: verify HSTS header present, CSP present, service-role key not in client bundle (`grep` on `.next/`), anon key isolation test passes in CI against production Supabase
