import { expect, test } from "@playwright/test";

test("landing page reaches the login flow and then the dashboard", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveURL(/\/$/);
  await expect(
    page.getByRole("heading", { name: /Bringing Deterministic/i })
  ).toBeVisible();

  await page.getByRole("banner").getByRole("link", { name: "Client Portal" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Keel" })).toBeVisible();
  await page.getByRole("button", { name: /Enter Demo Mode/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByText("Recent Voyages")).toBeVisible();
});

test("dashboard can start a demo voyage and show the audited total", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: /Enter Demo Mode/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.locator("#new-voyage-btn").click();
  await expect(page.getByRole("heading", { name: /New Voyage Analysis/i })).toBeVisible();
  await expect(page.getByText("Required documents")).toBeVisible();
  await expect(page.getByText("charterparty.pdf")).toBeVisible();
  await expect(page.getByRole("button", { name: /Analyse Voyage/i })).toBeDisabled();

  await page.locator("#demo-mode-btn").click();
  await expect(page).toHaveURL(/\/voyage\/voyage_001$/);
  await expect(page.getByRole("heading", { name: "MV Hellenic Pioneer" })).toBeVisible();
  await expect(page.getByRole("link", { name: /View Reconciliation/i })).toBeVisible();

  await page.getByRole("link", { name: /View Reconciliation/i }).click();
  await expect(page).toHaveURL(/\/voyage\/voyage_001\/reconcile$/);
  await expect(page.getByText("Per-day assessments")).toBeVisible();
  await expect(page.locator("#reconciled-total-display")).toHaveText("$112,000");
});

test("sidebar voyages link navigates to the voyages list", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: /Enter Demo Mode/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.getByRole("link", { name: "Voyages" }).click();
  await expect(page).toHaveURL(/\/voyages$/);
  // `/voyages` and `/dashboard` render the same component, so the heading is the
  // only thing that tells them apart. "Recent Voyages" appears on both.
  await expect(page.getByRole("heading", { name: "Voyages", level: 1 })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Dashboard", level: 1 })
  ).toHaveCount(0);
  await expect(page.getByText("Recent Voyages")).toBeVisible();
});

test("the sidebar exposes every module and highlights the current route", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByRole("button", { name: /Enter Demo Mode/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  // The modules arrived with their routes and no navigation, so they were only
  // reachable by typing the URL. This asserts each one is linked and lands.
  const sidebar = page.locator('[data-slot="sidebar"]');
  for (const [label, path] of [
    ["Speed & consumption", "/modules/speed"],
    ["Bunkers", "/modules/bunkers"],
    ["Disbursements", "/modules/disbursements"],
  ] as const) {
    const link = sidebar.getByRole("link", { name: label, exact: true });
    await expect(link, `${label} must be linked from the sidebar`).toBeVisible();
    await link.click();
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    // The active row is what tells a reader where they are, so it is asserted
    // rather than assumed: `data-active=""` marks the current route.
    await expect(
      sidebar.locator(`a[href="${path}"][data-active]`),
      `${label} must highlight on its own route`
    ).toHaveCount(1);
  }
});

test("a detail route under /voyage does not light up the /voyages row", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByRole("button", { name: /Enter Demo Mode/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.goto("/voyage/voyage_001");
  await expect(page).toHaveURL(/\/voyage\/voyage_001$/);
  // Guards the prefix matcher in `isActiveRoute`: `/voyages` must not match
  // `/voyage/...`, or the wrong row is highlighted on every detail page.
  await expect(
    page.locator('[data-slot="sidebar"] a[href="/voyages"][data-active]')
  ).toHaveCount(0);
});

test("the dashboard is the only list that draws the analytics panels", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: /Enter Demo Mode/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await expect(page.getByText("Voyage Claims Comparison").first()).toBeVisible();
  await expect(page.getByText("Fleet Audit Status")).toBeVisible();

  await page.getByRole("link", { name: "Voyages" }).click();
  await expect(page).toHaveURL(/\/voyages$/);
  await expect(page.getByText("Fleet Audit Status")).toHaveCount(0);
});
