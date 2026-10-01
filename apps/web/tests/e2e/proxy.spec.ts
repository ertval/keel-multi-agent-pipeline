import { expect, test } from "@playwright/test";

/**
 * `proxy.ts` is the only thing standing between a typed URL and the analyst
 * workspace. It is a demo stub, not authentication, but the redirect it performs
 * is real behaviour and needs a test: with the file removed, every route below
 * renders for an anonymous visitor and no assertion here would notice.
 */

const ANONYMOUS_PATHS = [
  "/dashboard",
  "/voyages",
  "/reports",
  "/reconciliations",
  "/voyage/voyage_001",
  "/voyage/voyage_001/reconcile",
  "/voyage/voyage_001/letter",
];

for (const path of ANONYMOUS_PATHS) {
  test(`an unauthenticated deep link to ${path} redirects to /login with next=`, async ({
    page,
  }) => {
    await page.goto(path);

    await expect(page).toHaveURL(
      new RegExp(`\\/login\\?next=${path.replace(/\//g, "%2F")}$`)
    );
    await expect(page.getByRole("heading", { name: "Keel" })).toBeVisible();
  });
}

test("the query string of a deep link survives the redirect", async ({ page }) => {
  await page.goto("/reports?range=q2");

  await expect(page).toHaveURL(/\/login\?next=%2Freports%3Frange%3Dq2$/);
});

test("/ and /login stay public", async ({ page }) => {
  await page.goto("/");
  expect(page.url()).toMatch(/\/$/);
  await expect(
    page.getByRole("heading", { name: /Bringing Deterministic/i })
  ).toBeVisible();

  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Keel" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Enter Demo Mode/i })
  ).toBeVisible();
});

test("a stale demo cookie does not grant access and is cleared", async ({ page, baseURL }) => {
  // The origin the config's `use.baseURL` navigates by; a cookie set on
  // 127.0.0.1 is a different cookie as far as the browser is concerned. Read it
  // off the fixture instead of restating the literal, so a port change in
  // playwright.config.ts cannot leave this cookie aimed at an origin the app is
  // not served on. Cookies are not port-scoped today, so that would pass
  // silently rather than fail loudly.
  const origin = baseURL;
  if (!origin) throw new Error("playwright.config.ts must set use.baseURL");
  await page.context().addCookies([
    {
      name: "keel_demo_session",
      value: "not-the-demo-token",
      url: origin,
    },
  ]);

  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login\?next=%2Fdashboard$/);

  const cookies = await page.context().cookies(origin);
  expect(cookies.find((c) => c.name === "keel_demo_session")).toBeUndefined();
});

test("the demo session cookie grants access to the whole workspace", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: /Enter Demo Mode/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.goto("/reports");
  await expect(page.getByRole("heading", { name: /Maritime Reports/i })).toBeVisible();

  await page.goto("/voyage/voyage_001/reconcile");
  await expect(page.getByText("Per-day assessments")).toBeVisible();
});
