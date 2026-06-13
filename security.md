# security.md — setup checklist

Code-level rules live in contract.md. This file is the stuff you do in dashboards
and CI that the code can't enforce by itself. Run through it once per
environment (dev, prod) and tick the boxes.

## Supabase dashboard

### Auth
- [ ] Providers: enable Email only.
- [ ] "Confirm email" ON; login blocked until confirmed.
- [ ] Minimum password length 12.
- [ ] Session refresh: enable refresh-token rotation (default). Inactivity
      timeout 30 days — matches the contract's "stay logged in across refresh".

### Database — tables
- [ ] `topics`: RLS ENABLED. 4 policies (SELECT/INSERT/UPDATE/DELETE), all
      `user_id = auth.uid()`. Unique index on `(user_id, lower(name))`.
- [ ] `concepts`: RLS ENABLED. 4 policies, all `user_id = auth.uid()`. FK
      `topic_id` references `topics(id)`. Unique index on
      `(user_id, topic_id, lower(title))` so duplicate-title-per-topic
      gives 409 at the DB level too.
- [ ] `comparisons`: RLS ENABLED. Policies join through concepts:
      `EXISTS (SELECT 1 FROM concepts WHERE concepts.id = comparisons.concept_id AND concepts.user_id = auth.uid())`.

### Storage — bucket
- [ ] Create bucket `concept-images`. Public READ (CDN URLs work without
      auth), authenticated WRITE/DELETE only.
- [ ] Storage RLS on the bucket:
        - INSERT/UPDATE/DELETE: `auth.uid()::text = (storage.foldername(name))[1]`
          (user can only touch objects whose first path segment is their UID).
        - SELECT (public read): allow — security comes from path being
          unguessable UUIDs, not from URL secrecy. If a card's image is
          sensitive, switch to signed URLs and remove public read.

### Backups & keys
- [ ] Backups: confirm point-in-time recovery is on (daily on free tier).
- [ ] Rotate keys once before going live. Note anon (public) vs service_role
      (secret).

## Environment variables

Vercel project -> Environment Variables:

- [ ] NEXT_PUBLIC_SUPABASE_URL          (public)
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY     (public — RLS does the work)
- [ ] SUPABASE_SERVICE_ROLE_KEY         (secret, server only)
- [ ] UPSTASH_REDIS_REST_URL            (secret)
- [ ] UPSTASH_REDIS_REST_TOKEN          (secret)

Rules:
- Anything starting NEXT_PUBLIC_ ships to the browser. Triple-check naming.
- Service role key: server-only, never NEXT_PUBLIC_, never logged.

## GitHub repo settings

- [ ] Secrets and variables -> Actions: mirror the env vars above for CI.
- [ ] Branches -> main: require PR, require status checks (typecheck, lint,
      test, secret-scan) to pass, no force pushes.
- [ ] Code security: enable Dependabot alerts + secret scanning.

## CI jobs (.github/workflows/ci.yml)

- [ ] typecheck:   `tsc --noEmit`
- [ ] lint:        `eslint .`
- [ ] test:        `vitest run` (includes the "anon key returns zero rows /
      zero storage objects" tests)
- [ ] secret-scan: fail if `SERVICE_ROLE` / `service_role` appears outside
      `app/api/`, `lib/server/`, or tests:
      `! grep -rE 'service_role|SERVICE_ROLE' --include='*.ts' --include='*.tsx' app components lib | grep -v '^app/api/' | grep -v '^lib/server/' | grep -v test`
- [ ] audit:       `npm audit --audit-level=high`.

## Code-level things easy to forget

- [ ] middleware.ts sets the security headers from the contract on every response.
- [ ] middleware.ts checks Origin header on POST/PUT/DELETE for /api/*.
- [ ] middleware.ts runs rate limit on /api/auth/* (and ONLY there).
- [ ] Every API route does `requireUser(session)` as line 1.
- [ ] No API route accepts `user_id` in the body. Zod schemas are `.strict()`.
- [ ] Auth endpoints take the SAME minimum time (~250ms floor) regardless of outcome.
- [ ] One `toApiError(e)` helper — no raw Supabase/Postgres error message ever reaches the client.
- [ ] Image upload endpoint:
        - Verify MIME on the server (don't trust the multipart Content-Type alone — sniff the magic bytes).
        - Sanitize filename (strip path separators, normalize unicode, ≤80 chars).
        - Always upload to `${user_id}/${concept_id_or_draft}/${sanitized}`.
- [ ] Draft images uploaded to `${user_id}/draft/...` are reaped by a daily Supabase scheduled function (objects older than 24h with no matching concept).
- [ ] @supabase/ssr is set up so cookies persist; client and server use the SAME `createServerClient` / `createBrowserClient` pattern. This is what makes "stay logged in on refresh" work.

## Pre-launch smoke test

Run these manually before sharing the URL:

1. Register user A. Confirm email. Create a topic "Kubernetes". Add a card under it. Upload an image.
2. Refresh the page. You stay logged in. The same card is open.
3. Close the tab, open a new one to the site root. Still logged in. Sidebar shows the topic.
4. Register user B. Log in.
        - A's topic NOT visible in sidebar.
        - GET /api/concepts returns only B's (empty) list.
        - Guessing A's card URL `/concepts/<A's id>` returns 404.
        - Try to fetch A's image URL directly — if you can't guess the path it's fine; if bucket is private, must 403.
5. From a terminal, hit Supabase REST with only the anon key:
      `curl "$SUPABASE_URL/rest/v1/concepts" -H "apikey: $ANON_KEY"`
      Result MUST be `[]`. Same for `/rest/v1/topics`.
6. Wrong password 10x on /api/auth/login from one IP. The 6th+ returns 429.
7. POST a .exe renamed to .png to /api/uploads/concept-image. Returns 415, not 500. (Server sniffs magic bytes.)
8. DevTools -> Application -> Cookies: HttpOnly, Secure, SameSite=Lax.
9. View page source / Network: no `service_role` string in shipped JS.
10. Toggle light/dark — preference survives reload. Collapse sidebar — survives reload.

If any fail, do not advertise the URL.
