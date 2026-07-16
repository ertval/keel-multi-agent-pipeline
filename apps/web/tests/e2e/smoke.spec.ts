import { expect, test } from "@playwright/test";

test("login reaches the dashboard", async ({ page }) => {
  await page.goto("/");

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
  await expect(page.getByText("Per-day verdicts")).toBeVisible();
  await expect(page.locator("#reconciled-total-display")).toHaveText("$112,000");
});

test("sidebar voyages link navigates to the voyages list", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: /Enter Demo Mode/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.getByRole("link", { name: "Voyages" }).click();
  await expect(page).toHaveURL(/\/voyages$/);
  await expect(page.getByText("Recent Voyages")).toBeVisible();
});
