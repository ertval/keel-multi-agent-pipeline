import { expect, test } from "@playwright/test";

test("hackathon demo workflow is recordable end to end", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });

  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Keel" })).toBeVisible();
  await expect(page.getByText("Demo credentials: demo@keel.io / any password")).toBeVisible();

  await page.getByRole("button", { name: /Enter Demo Mode/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByText("Recent Voyages")).toBeVisible();
  await expect(page.getByRole("link", { name: "Reports" })).toBeVisible();

  await page.getByRole("link", { name: "Reports" }).click();
  await expect(page).toHaveURL(/\/reports$/);
  await expect(page.getByRole("heading", { name: /Maritime Reports/i })).toBeVisible();

  await page.getByRole("link", { name: "Dashboard" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.locator("#new-voyage-btn").click();
  await expect(page.getByRole("heading", { name: "New Voyage Analysis" })).toBeVisible();
  for (const filename of [
    "charterparty.pdf",
    "sof_owner.pdf",
    "sof_charterer.pdf",
    "claim_owner.pdf",
    "claim_charterer.pdf",
    "weather_port_xyz.json",
  ]) {
    await expect(page.getByText(filename)).toBeVisible();
  }

  await page.locator("#demo-mode-btn").click();
  await expect(page).toHaveURL(/\/voyage\/voyage_001$/);
  await expect(page.getByRole("heading", { name: "MV Hellenic Pioneer" })).toBeVisible();
  await expect(page.getByText("Charterparty Terms")).toBeVisible();
  await expect(page.getByText("Owner Calculation")).toBeVisible();
  await expect(page.getByText("Charterer Calculation")).toBeVisible();
  // These totals now also appear (rounded) in the audit-trace table, so scope
  // to the summary headline paragraph to keep the locator unambiguous.
  await expect(page.getByRole("paragraph").filter({ hasText: "$187,000" })).toBeVisible();
  await expect(page.getByRole("paragraph").filter({ hasText: "$62,000" })).toBeVisible();

  await page.getByText("p.1").first().click();
  await expect(page.getByText("Document Viewer")).toBeVisible();

  await page.locator("#view-reconciliation-btn").click();
  await expect(page).toHaveURL(/\/voyage\/voyage_001\/reconcile$/);
  await expect(page.getByText("BIMCO 2013").first()).toBeVisible();
  await expect(page.getByText("Owner position").first()).toBeVisible();
  await expect(page.getByText("Charterer position").first()).toBeVisible();
  await expect(page.getByText("Per-day verdicts")).toBeVisible();

  await expect(page.locator("#day-card-2026-06-14")).toContainText("Owner wins");
  await expect(page.locator("#day-card-2026-06-15")).toContainText("Owner wins");
  await expect(page.locator("#day-card-2026-06-16")).toContainText("Charterer wins");
  await expect(page.locator("#day-card-2026-06-14")).toContainText("Bft 5");
  await expect(page.locator("#day-card-2026-06-15")).toContainText("Bft 4");
  await expect(page.locator("#day-card-2026-06-16")).toContainText("Bft 7");

  await page.locator("#clause-toggle-2026-06-14").click();
  await expect(page.locator("#day-card-2026-06-14")).toContainText("BIMCO");

  await expect(page.locator("#reconciled-total-display")).toHaveText("$112,000");
  await expect(page.getByText(/\$62,000.*\+.*\$50,000.*=.*\$112,000/)).toBeVisible();

  await page.locator("#generate-claim-letter-btn").click();
  await expect(page).toHaveURL(/\/voyage\/voyage_001\/letter$/);
  await expect(page.getByRole("heading", { name: "Claim Letter" })).toBeVisible();
  // The backend-rendered letter and the React fallback differ in headings,
  // so accept either set of section labels.
  await expect(
    page.getByText(/Party Positions|Owner's total claimed:/)
  ).toBeVisible();
  await expect(
    page.getByText(/Day-by-Day Adjudication|Per-Day Analysis/)
  ).toBeVisible();
  await expect(
    page.getByText(/Reconciled Total[^$]*\$112,000/)
  ).toBeVisible();

  await page.getByRole("link", { name: "Dashboard" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText("$112,000")).toBeVisible();
});
