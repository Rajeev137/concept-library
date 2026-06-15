# Concept Library — Task Checklist

Legend: `[ ]` todo · `[x]` done · `[~]` current phase

---

## Phase 0 — Repo, deploy, Supabase project, RLS test in CI
> Goal: a live Vercel URL that returns a hello page, with CI enforcing the anon-key isolation invariant.

- [x] **`.github/workflows/ci.yml`** — wire up typecheck (`tsc --noEmit`), lint (`eslint .`), test (`npm test`), and a `grep` job that fails if `SUPABASE_SERVICE_ROLE_KEY` appears outside `src/app/api/` or `src/lib/`
- [x] **`src/app/layout.tsx`** — root layout: set `<html lang="en">`, import `globals.css`, no auth logic yet
- [x] **`src/app/(app)/page.tsx`** — placeholder hello page ("Concept Library — coming soon") so Vercel deploy succeeds
- [x] **`src/lib/supabase/client.ts`** — browser Supabase client using `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` via `createBrowserClient` from `@supabase/ssr`
- [x] **`src/lib/supabase/server.ts`** — server Supabase client (anon key + user session cookies) using `createServerClient` from `@supabase/ssr`; reads cookies from Next.js headers so RLS sees `auth.uid()`
- [x] **`src/lib/supabase/middleware.ts`** — middleware Supabase client (anon key only) for session cookie refresh
- [x] **`src/types/index.ts`** — re-export everything from `interfaces.ts`; no new types
- [x] **`tests/unit/supabase.test.ts`** — unit tests for all three Supabase clients (browser, server, middleware); mocks env vars and cookie store
- [x] **`tests/anon-key-isolation.test.ts`** — connect with anon key, assert `topics`, `concepts`, `comparisons` return 0 rows (or 42501) and `concept-images` bucket returns 0 objects; passing against live Supabase
- [x] **Supabase project** (manual, out-of-band) — create project, apply SQL for `topics`/`concepts`/`comparisons` tables with RLS policies, create `concept-images` bucket (private) with Storage RLS restricting SELECT to `auth.uid() = foldername[1]`, copy keys to `.env.local`
- [ ] **Vercel project** (manual, out-of-band) — connect GitHub repo, add env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`), confirm deploy green

---

## Phase 1 — Auth: login, register, session, protected route
> Goal: deployable. You can register, confirm email, and log in. Unauthenticated users are redirected.

- [x] **`src/lib/errors.ts`** — `ApiRouteError` class, `apiHandler()` + `authHandler()` wrappers, `errorResponse()` with opaque 500 trace_id; 250ms floor built in
- [x] **`src/lib/validators/constants.ts`** — `PASSWORD_MIN_LEN = 12`, `COMMON_PASSWORDS` Set (~200 entries; TODO full 10k)
- [x] **`src/lib/validators/auth.ts`** — Zod `.strict()` schemas for all four auth request types; `checkPasswordPolicy()` enforcing length + denylist
- [x] **`src/lib/rate-limit/index.ts`** — `checkRateLimit()` with Upstash Redis sliding-window; fail-open on Redis error; login 5/15min, register 3/hr, password-reset 3/hr
- [x] **`src/app/api/auth/register/route.ts`** — rate-limit, validate, password policy, `signUp()`, generic error, 250ms floor via `authHandler`
- [x] **`src/app/api/auth/login/route.ts`** — rate-limit, validate, `signInWithPassword()`, email-confirmation check, generic error, 250ms floor
- [x] **`src/app/api/auth/logout/route.ts`** — `signOut()`, returns `{ ok: true }`
- [x] **`src/app/api/auth/password-reset/request/route.ts`** — rate-limit, validate, fire-and-forget `resetPasswordForEmail()`, always `{ ok: true }`, 250ms floor
- [x] **`src/app/api/auth/password-reset/confirm/route.ts`** — validate, password policy, `exchangeCodeForSession()`, `updateUser()`, generic error
- [x] **`src/middleware.ts`** — session refresh, all security headers (CSP/HSTS/etc.), Origin CSRF check on POST/PUT/DELETE to `/api/*`
- [x] **`src/app/(auth)/layout.tsx`** — auth route group layout: no app shell; redirect to `/` if session already exists
- [x] **`src/app/(auth)/login/page.tsx`** — login form: email + password fields, submit calls `POST /api/auth/login`, shows generic error, redirects to `returnUrl` or `/` on success
- [x] **`src/app/(auth)/register/page.tsx`** — register form: email + password, calls `POST /api/auth/register`, shows "check your email" after success
- [x] **`src/app/(auth)/reset-password/page.tsx`** — request-reset form: email field, calls `/api/auth/password-reset/request`
- [x] **`src/app/(auth)/reset-password/confirm/page.tsx`** — confirm-reset form: reads token from URL, new_password field, calls `/api/auth/password-reset/confirm`
- [x] **`src/app/(app)/layout.tsx`** — protected layout: call `getSession()`; redirect to `/login?returnUrl=…` if null; render `AppShell` around `{children}`
- [x] **`src/hooks/useSession.ts`** — implement: read session from Supabase browser client; expose `{ session, loading, error }`
- [x] **`tests/unit/validators-auth.test.ts`** — 33 tests: min length, common-password rejection, valid password, all four schema strict-mode checks, user_id injection rejection
- [x] **`tests/unit/rate-limit.test.ts`** — 18 tests: allowed on first hit, denied after limit, fail-open on Redis error

---

## Phase 2 — Schema, create-concept form, POST endpoint
> Goal: deployable. You can add one concept card (with a new or existing topic).

- [x] **`src/lib/validators/topic.ts`** — implement Zod schema (`.strict()`) for `TopicInput`; name non-empty, trimmed, max 80 chars
- [x] **`src/lib/validators/concept.ts`** — implement Zod schema (`.strict()`) for `ConceptInput`; all `REQUIRED_STRINGS` non-empty; comparisons array min 1 entry; each comparison `alternative`+`difference` non-empty; `topic_id` or `topic_name_new` required; `user_id` must NOT be present (`.strict()` rejects it)
- [x] **`src/lib/repos/topics.ts`** — implement `TopicRepo`: `list`, `get`, `findByName`, `create`, `rename`, `remove` (409 if concepts exist), `listConcepts`; every query filters by `session.user_id`
- [x] **`src/lib/repos/concepts.ts`** — implement `ConceptRepo`: `list` (with optional `q`/`tag`/`topic_id` filters), `get`, `create`, `update`, `remove`; every query filters by `session.user_id`; `create` handles `topic_name_new` — calls `topics.findByName` first (409 if duplicate name), else creates topic then concept
- [x] **`src/app/api/topics/route.ts`** — GET: `requireUser`, call `topicRepo.list()`; POST: validate `TopicInput`, call `topicRepo.create()`, 409 on duplicate name returning existing topic
- [x] **`src/app/api/topics/[id]/route.ts`** — PUT: validate `TopicInput`, call `topicRepo.rename()`; DELETE: call `topicRepo.remove()`, 409 if non-empty with concept count
- [x] **`src/app/api/topics/[id]/concepts/route.ts`** — GET: `requireUser`, call `topicRepo.listConcepts()`
- [x] **`src/app/api/concepts/route.ts`** — GET: `requireUser`, call `conceptRepo.list()`; POST: validate `ConceptInput`, call `conceptRepo.create()`, 409 on duplicate title under same topic
- [x] **`src/lib/upload/index.ts`** — implement `uploadConceptImage()` and `deleteConceptImage()`; validate MIME against `IMAGE_POLICY.ALLOWED_MIME` AND sniff magic bytes; sanitize filename (strip path separators, NFC normalize, truncate to 80 chars); storage path `{user_id}/{concept_id}/{filename}`
- [x] **`src/app/api/uploads/concept-image/route.ts`** — POST: `requireUser`, parse multipart, call `uploadConceptImage()`; return `{ url, path }`; 415 on bad MIME; DELETE: validate `{ path }`, verify path starts with `session.user_id`, call `deleteConceptImage()`
- [x] **`src/components/layout/ThemeProvider.tsx`** — implement: read `ui:theme` from localStorage on mount, apply `dark` class to `<html>`, listen to `prefers-color-scheme` when value is `system`
- [x] **`src/hooks/useLocalStorage.ts`** — implement generic `useLocalStorage<T>(key, defaultValue)` hook with SSR-safe read
- [x] **`src/components/layout/AppShell.tsx`** — implement layout: sidebar on left, main panel on right; pass sidebar collapsed state down; render `<OfflineBanner />` at top; mobile drawer wired up
- [x] **`src/components/sidebar/Sidebar.tsx`** — implement: topic list from `GET /api/topics`, search box filtering titles, collapse/expand per topic (persisted via `ui:expanded-topics`), collapse-to-rail toggle (persisted via `ui:sidebar`), theme toggle at footer
- [x] **`src/components/sidebar/TopicRow.tsx`** — implement: topic name + concept count chip; expand/collapse to show concept titles; click concept title triggers URL update
- [x] **`src/components/ui/ThemeToggle.tsx`** — implement: cycle light→dark→system, write to `ui:theme`
- [x] **`src/components/ui/OfflineBanner.tsx`** — implement: listen to `window.online/offline`, show banner when offline; hide when online
- [x] **`src/components/card/ConceptForm.tsx`** — implement full form: all `ConceptInput` fields, repeatable comparisons section (add/remove/reorder rows), topic combobox (search existing or type new name), optional image section (drag-drop + thumbnail preview), auto-save draft every 1s to `draft:concept:{topic_id|new}`, clear on submit, submit calls `POST /api/concepts`
- [x] **`src/components/card/AddCardButton.tsx`** — implement: floating action button fixed bottom-left, opens `ConceptForm`
- [x] **`src/hooks/useDraftConcept.ts`** — implement: read/write `DraftConcept` from localStorage key `draft:concept:{topic_id|"new"}` debounced at 1s; expose `{ draft, save, clear }`
- [x] **`tests/unit/validators-concept.test.ts`** — tests matching contract error boundaries: empty required string rejected, whitespace-only rejected, "N.A." accepted, comparisons min-1 enforced, `user_id` in body rejected by `.strict()`
- [x] **`tests/unit/validators-topic.test.ts`** — tests: name required, max 80 chars, whitespace trimmed
- [x] **`tests/unit/repos-topics.test.ts`** — unit tests for `TopicRepo`: 409 on duplicate name, 409 on delete with concepts, `user_id` scoping
- [x] **`tests/unit/repos-concepts.test.ts`** — unit tests for `ConceptRepo`: 409 on duplicate title+topic, `user_id` always scoped, auto-creates topic from `topic_name_new`

---

## Phase 3 — List and detail view
> Goal: deployable. You can browse all cards, click a topic to see its cards, click a card to read it.

- [x] **`src/app/api/concepts/[id]/route.ts`** — GET: `requireUser`, call `conceptRepo.get()`, 404 if null (never 403); PUT: validate `ConceptInput`, call `conceptRepo.update()`; DELETE: call `conceptRepo.remove()`
- [x] **`src/app/api/concepts/search/route.ts`** — GET: parse `?q=&tag=&topic=` from URL, `requireUser`, call `conceptRepo.list({ q, tag, topic_id })`
- [x] **`src/app/(app)/page.tsx`** — implement: read `?topic=&concept=` URL params; render `ConceptList` (topic view or all-cards) in main panel; render `ConceptDetail` when `concept` param is set; mobile/desktop master-detail layout with panel switching
- [x] **`src/components/card/ConceptList.tsx`** — implement: fetch from `GET /api/topics/:id/concepts` or `GET /api/concepts`; render card title rows; click updates URL param `?concept=`; show loading skeleton; show empty state
- [x] **`src/components/card/ConceptDetail.tsx`** — implement: fetch `GET /api/concepts/:id`; render all fields read-only (title, what_it_does, comparisons table, when_it_breaks, explain_in_30s, where_i_used_it, tags, image full-size); edit + delete buttons in header
- [x] **`tests/unit/concept-detail.test.ts`** — tests: 404 returns null (not 403), RLS denial surfaces as 404, detail renders all fields

---

## Phase 4 — Edit, delete, search, tags
> Goal: deployable. Full CRUD. Search works. Tags filter.

- [x] **`src/components/card/ConceptForm.tsx`** (edit mode) — extend existing form: accept optional `concept` prop; pre-fill all fields from existing `Concept`; on submit call `PUT /api/concepts/:id`; clear draft on success
- [x] **`src/components/card/ConceptDetail.tsx`** (delete flow) — wire delete button: call `DELETE /api/concepts/:id`, on success remove from URL and refresh topic list; show confirmation before delete
- [x] **`src/components/sidebar/Sidebar.tsx`** (search) — wire search box to `GET /api/concepts/search?q=`; debounce 300ms; highlight matching titles; clear on empty
- [x] **`src/components/ui/TagInput.tsx`** — new component: comma or enter to add tag, backspace to remove last, renders tag chips; used in `ConceptForm`
- [x] **Tag filter in sidebar/search** — clicking a tag chip in `ConceptDetail` updates URL and triggers `GET /api/concepts/search?tag=`
- [x] **Topic rename + delete** — wire PUT/DELETE topic from sidebar context menu (right-click or ellipsis); 409 with concept count shown as toast
- [x] **`tests/unit/search.test.ts`** — tests: `q` param filters by title substring, `tag` param filters by exact tag, `topic` param scopes to topic; all scoped to `user_id`
- [x] **`tests/unit/concept-crud-api.test.ts`** — tests for GET/PUT/DELETE `/api/concepts/:id`

---

## Phase 5 — Polish: mobile layout, keyboard shortcuts, offline draft
> Goal: production-ready. Mobile-usable. Keyboard-navigable. Offline draft preserved.

- [x] **Mobile sidebar drawer** — on viewport < 768px, sidebar becomes overlay drawer (`AppShell.tsx`); hamburger button in top header; `Sidebar` accepts `isMobileDrawer` + `onClose` props; Escape closes drawer
- [x] **Keyboard shortcuts** — `useKeyboardShortcuts` hook (`src/hooks/useKeyboardShortcuts.ts`): N new card, E edit, Delete/Backspace delete confirm, Escape close, `/` focus search, `?` open help modal; `KeyboardShortcutsHelp` modal (`src/components/ui/KeyboardShortcutsHelp.tsx`); wired in `page.tsx`
- [x] **Offline draft resilience** — `ConceptForm` detects 503/network failure, keeps draft alive, shows "Back online — tap to retry" toast; auto-retry on reconnect
- [x] **`src/components/card/ConceptForm.tsx`** (large file upload) — files > 4MB use signed-URL direct upload: call `/api/uploads/concept-image` with `action=create-signed-url`, receive signed URL, PUT directly to Supabase Storage from browser
- [x] **`src/hooks/useScrollRestoration.ts`** — hook implemented: saves `scrollY` to `sessionStorage` key `scroll:{key}` on scroll (debounced 200ms) and on unmount; restores on mount via `requestAnimationFrame`
- [ ] **Scroll restoration wired** — `useScrollRestoration` is not yet called anywhere in `ConceptList` or `page.tsx`; needs to be added with key `topic:{topicId}`
- [x] **`tests/e2e/full-flow.spec.ts`** — Playwright: creates test user via admin API, login → create topic + card → view → edit → delete → logout; asserts anon redirect to `/login`
- [x] **`tests/e2e/anon-access.spec.ts`** — Playwright: unauthenticated `/` redirects to `/login`; unauthenticated `GET /api/concepts` returns 401
- [ ] **Pre-launch smoke tests** — from `security.md`: verify HSTS header present, CSP present, service-role key not in client bundle (`grep` on `.next/`), anon key isolation test passes in CI against production Supabase
