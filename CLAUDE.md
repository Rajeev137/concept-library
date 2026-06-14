# Concept Library — Claude Code Context

## What this project is

Multi-user interview-prep concept card app. Next.js (TypeScript, App Router) +
Supabase (Auth, Postgres, Storage) + Vercel. One user = one private library of
concept cards grouped under topics.

## Source of truth

Read these before implementing anything. Do not invent fields or behaviour not 
described here.

- `contract.md` — all API endpoints, invariants, error boundaries, UI requirements
- `interfaces.ts` — every type and function signature; import via `@/types`, never directly
- `security.md` — Supabase dashboard config, CI job requirements, pre-launch smoke tests
- `tasks.md` — current phase checklist; update when a module is done

## Commands

```bash
npm run dev        # start Next.js dev server
npm run build      # production build
npm run typecheck  # tsc --noEmit
npm run lint       # eslint .
npm test           # vitest run — one-shot, use before committing
npm run coverage   # vitest run --coverage — full report; check before merging
```

To run a single test file: `npx vitest run tests/unit/rate-limit.test.ts`

## Agent roles

Invoke one role per prompt. Do not mix.

- **Scaffolder** — creates file structure, function signatures, and TODO comments only. No logic, no import resolution, no implementation.
- **Implementer** — implements exactly the module named in the prompt plus its test file. Does not touch any other file, does not scaffold new files.
- **Verifier** — read-only. Lists issues with `file:line` references. Never edits code.

## Architecture

All types come from `interfaces.ts` (re-exported at `src/types/index.ts`). Do not invent new fields.
TypeScript strict mode is on: no `any`, no `as unknown as X`.

### Request path

```
Browser → src/middleware.ts
           ├── refreshes Supabase session cookies (auth.getUser())
           ├── sets security headers (CSP, HSTS, etc.)
           └── enforces Origin check on POST/PUT/DELETE for /api/*

API call → src/app/api/**/route.ts
             ├── apiHandler() wrapper (src/lib/errors.ts) — catches all errors, serializes to ApiResult<T>
             ├── getSession() + requireUser() — every authenticated route, line 1
             ├── Zod schema .strict() parse — rejects unknown keys
             └── lib/repos/ — all DB queries, always scoped to session.user_id
```

### Supabase client split — critical

Three separate clients; never mix them:

| File | Key used | Where imported |
|---|---|---|
| `src/lib/supabase/client.ts` | anon (`NEXT_PUBLIC`) | Client components, hooks |
| `src/lib/supabase/server.ts` | anon + service role | `app/api/**` only |
| `src/lib/supabase/middleware.ts` | anon (`NEXT_PUBLIC`) | `src/middleware.ts` only |

**`SUPABASE_SERVICE_ROLE_KEY` must never appear outside `app/api/**`, `lib/server/**`, and `lib/supabase/**`.** CI has a grep that fails the build if it does.

### Data isolation

Every query in `src/lib/repos/` must filter by `user_id` — never `WHERE id = ?` alone, always `WHERE id = ? AND user_id = session.user_id`. RLS enforces this at the DB level too; the app layer must be explicit as defence-in-depth. `user_id` is never accepted from the client; it is always read from the server session. Zod schemas use `.strict()` to reject any attempt to pass it.

### Error handling

All API routes are wrapped in `apiHandler()` from `src/lib/errors.ts`. Throw `ApiRouteError(code, message, httpStatus)` anywhere in the call stack; the wrapper catches it and returns `ApiResult<T>`. Unknown errors produce a 500 with an opaque `trace_id` — the real error is only logged server-side, never in the response.

Auth endpoints (`/api/auth/login`, `/api/auth/register`, `/api/auth/password-reset/request`) have two additional constraints: responses must use a **generic error message** (same text whether email is unknown or password is wrong), and must enforce a **250ms minimum response time** to prevent timing-based email enumeration. Rate limiting on these three endpoints is via Upstash Redis sliding window (`src/lib/rate-limit/index.ts`); no rate limits on any other endpoint.

### UI state persistence

| Data | Storage | Key |
|---|---|---|
| Theme | `localStorage` | `ui:theme` |
| Sidebar collapsed | `localStorage` | `ui:sidebar` |
| Expanded topic IDs | `localStorage` | `ui:expanded-topics` |
| Form draft | `localStorage` | `draft:concept:{topic_id\|"new"}` |
| Active view (topic+card) | URL params | `?topic=&concept=` |
| Scroll position | `sessionStorage` | `scroll:topic:{topicId}` |

Draft auto-saves every 1s; cleared on successful submit. Use `useLocalStorage` (`src/hooks/useLocalStorage.ts`) for all localStorage reads/writes from components.

### Image uploads

Storage path is always `{user_id}/{concept_id}/{sanitized_filename}`. The first path segment being the user's UID is how Storage RLS restricts cross-user access. Server-side requirements: validate MIME against `IMAGE_POLICY.ALLOWED_MIME` **and** sniff magic bytes (do not trust the multipart `Content-Type` alone); sanitize filename (strip path separators, NFC normalize, ≤80 chars). Implementation in `src/lib/upload/index.ts`.

### Route groups

- `(auth)` — login, register, reset-password pages; no app shell; redirects to `/` if session already exists
- `(app)` — all authenticated pages; layout performs session check and redirects to `/login?returnUrl=…` if unauthenticated; renders `AppShell` (sidebar + main panel)

## Hard invariants

These are the things most likely to cause a cross-user data leak if broken. Check them whenever something feels wrong.

1. `user_id` is always from `session`, never from the request body
2. **Anon API key must return zero rows** from `concepts`, `topics`, `comparisons` and zero objects from the `concept-images` bucket — `tests/anon-key-isolation.test.ts` asserts this
3. Storage paths always start with `user_id` as first segment
4. Every authenticated API route calls `requireUser(session)` as its first statement
5. No stack traces or env values ever appear in API responses

## Testing

- Test files live in `tests/unit/<module>.test.ts` (unit) and `tests/integration/` (integration).
- Test names should correspond to the error boundaries listed in `contract.md`.
- `tests/anon-key-isolation.test.ts` must always pass — do not stub or skip it.
- Run `npm test` before committing.

## Git

- Branch naming: `feat/<thing>`, `fix/<thing>`, `chore/<thing>`
- One branch = one module = one PR; never commit directly to `main`
- Commit format: `feat: <what it does` / `fix: <what it fixes>`
- Run `npm test && npm run typecheck` before pushing

## Progress

| Phase | Status |
|---|---|
| Phase 0 — Repo, deploy, Supabase, RLS CI | Done (Vercel deploy pending manual step) |
| Phase 1 — Auth (login, register, session, protected routes) | Done |
| Phase 2 — Schema, create-concept form, POST endpoint | Done |
| Phase 3 — List and detail view | Partial — `ConceptList` + `ConceptDetail` done; API routes + page wiring pending |
| Phase 4 — Edit, delete, search, tags | Not started |
| Phase 5 — Polish, mobile, keyboard, offline | Not started |

### Completed in Phase 3 (branch `feat/concept-views`, PR open)
- `src/components/card/ConceptList.tsx` — fetches topic concepts, skeleton, empty state, scroll restore, active highlight
- `src/components/card/ConceptDetail.tsx` — full read-only render, edit via `ConceptForm`, delete with confirm, 401/404 handling
