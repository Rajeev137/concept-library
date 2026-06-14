import { test, expect } from "@playwright/test";

test("unauthenticated / redirects to /login", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login/);
});

test("unauthenticated /api/concepts returns 401", async ({ request }) => {
  const res = await request.get("/api/concepts");
  expect(res.status()).toBe(401);
});
