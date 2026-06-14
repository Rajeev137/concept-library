# Pre-launch security smoke tests

Run these manually before sharing the URL. Do not advertise the URL until all pass.

- [ ] Register user A, confirm email, create a topic, add a card, upload an image
- [ ] Register user B, verify A's topic is not visible in sidebar and A's card URL returns 404
- [ ] `curl "$SUPABASE_URL/rest/v1/concepts" -H "apikey: $ANON_KEY"` returns `[]`
- [ ] 10× wrong password on `/api/auth/login` from one IP — 6th+ attempt returns 429
- [ ] POST a `.exe` renamed to `.png` to `/api/uploads/concept-image` — returns 415, not 500
- [ ] DevTools → Application → Cookies: HttpOnly, Secure, SameSite=Lax
- [ ] View page source / Network tab: no `service_role` string in shipped JS
- [ ] Theme toggle (light/dark) survives page reload
- [ ] Sidebar collapse state survives page reload
- [ ] Mobile drawer opens and closes correctly
