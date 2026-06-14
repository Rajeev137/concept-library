import { test, expect, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const TEST_EMAIL = `e2e-${Date.now()}@test.example`;
const TEST_PASSWORD = "TestPassword123!";

let testUserId: string;

function adminClient() {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

test.beforeAll(async () => {
  const admin = adminClient();

  const { data, error } = await admin.auth.admin.createUser({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    email_confirm: true,
  });

  if (error || !data.user) throw new Error(`Failed to create test user: ${error?.message}`);
  testUserId = data.user.id;
});

test.afterAll(async () => {
  if (!testUserId) return;
  const admin = adminClient();
  await admin.auth.admin.deleteUser(testUserId);
});

async function login(page: Page) {
  await page.goto("/login");
  await page.fill("#email", TEST_EMAIL);
  await page.fill("#password", TEST_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL("/");
}

test("full concept card flow", async ({ page }) => {
  // Unauthenticated redirect
  await page.goto("/");
  await expect(page).toHaveURL(/\/login/);

  // Login
  await login(page);
  await expect(page).toHaveURL("/");

  // Open create form
  await page.click('button:has-text("+ Add card")');

  // Fill topic (new topic via combobox)
  await page.fill("#topic-input", "E2E Test Topic");
  // Wait for the "Create" option to appear and click it
  await page.click('[role="listbox"] [role="option"]:has-text("Create")');

  // Fill required fields
  await page.fill("#title", "E2E Test Concept");
  await page.fill("#what_it_does", "This concept is used for end-to-end testing.");

  // Comparison 1 fields
  await page.fill('input[placeholder="e.g. useMemo"]', "Manual testing");
  await page.fill('textarea[placeholder="How is this different?"]', "E2E is automated, manual is not.");

  await page.fill("#when_it_breaks", "When the app is too complex to cover manually.");
  await page.fill("#explain_in_30s", "A test that drives the browser like a real user.");
  await page.fill("#where_i_used_it", "Concept Library project.");

  // Tag — type and press Enter
  await page.fill('input[placeholder="Add a tag…"]', "testing");
  await page.keyboard.press("Enter");

  // Submit
  await page.click('button[type="submit"]:has-text("Add concept")');

  // Wait for the detail view to appear (form submission navigates to detail)
  await expect(page.locator("article h1")).toContainText("E2E Test Concept", { timeout: 10_000 });

  // Topic appears in sidebar
  await expect(page.locator('nav[aria-label="Topics"]')).toContainText("E2E Test Topic");

  // Detail shows all submitted fields
  const article = page.locator("article");
  await expect(article).toContainText("This concept is used for end-to-end testing.");
  await expect(article).toContainText("Manual testing");
  await expect(article).toContainText("E2E is automated, manual is not.");
  await expect(article).toContainText("When the app is too complex to cover manually.");
  await expect(article).toContainText("A test that drives the browser like a real user.");
  await expect(article).toContainText("Concept Library project.");

  // Edit — click Edit button in the detail header, change title, save
  await page.click('article button:has-text("Edit")');
  await page.fill("#title", "E2E Test Concept — Updated");
  await page.click('button[type="submit"]:has-text("Save changes")');

  // Updated title visible in detail view
  await expect(page.locator("article h1")).toContainText("E2E Test Concept — Updated", { timeout: 10_000 });

  // Delete — click Delete, confirm in dialog
  await page.click('article button:has-text("Delete")');
  await page.click('[role="dialog"] button:has-text("Delete")');

  // Concept gone — article with h1 no longer visible
  await expect(page.locator("article h1")).not.toBeVisible({ timeout: 10_000 });

  // Logout
  await page.click('button[aria-label="Log out"]');
  await expect(page).toHaveURL(/\/login/);

  // Navigating to / unauthenticated → redirected to /login
  await page.goto("/");
  await expect(page).toHaveURL(/\/login/);
});
