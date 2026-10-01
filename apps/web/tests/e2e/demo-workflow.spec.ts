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

  // The audit-trace page pill opens the viewer. Assert what only exists once
  // the panel is open: which party/step the citation came from and the cited
  // page. `p.1` alone appears in both tables, so it cannot identify the panel.
  const viewer = page.locator("#document-viewer");
  await expect(viewer).not.toBeVisible();
  await page.getByText("p.1").first().click();
  await expect(viewer).toBeVisible();
  await expect(viewer).toContainText(/Owner calculation . step 1/);
  await expect(viewer).toContainText(/p\.1/);
  // Step 1 is a NOR event, so the API sent `clause_citation: null` for it. The
  // panel has to say so rather than quote a clause it was not given.
  await expect(viewer).toContainText("cited no charterparty clause");
  await expect(viewer).not.toContainText("Time lost on account of weather");

  // The weather steps are the rows that do carry a clause, and their SOF row and
  // their charterparty clause are different documents — so the panel has to quote
  // the charterparty clause from charterparty.pdf, not the SOF row it opened on.
  const weatherStep = page.getByRole("row", { name: /WEATHER_PAUSE: Weather delay commenced/ }).first();
  await weatherStep.click();
  await expect(viewer).toContainText(/Charterer calculation . step 5/);
  await expect(viewer).toContainText(/sof_charterer\.pdf/);
  await expect(
    viewer.getByText(/Time lost on account of weather shall not count as laytime/)
  ).toBeVisible();
  await expect(viewer).toContainText("charterparty.pdf · p.3");
  await expect(viewer).not.toContainText("cited no charterparty clause");

  await page.locator("#view-reconciliation-btn").click();
  await expect(page).toHaveURL(/\/voyage\/voyage_001\/reconcile$/);
  // The header badge carries the scoped authority claim: the Laytime
  // Definitions supply the measurement basis, the charterparty supplies the
  // threshold. The rule id no longer names a source document, so this is the
  // only place the page states that split.
  await expect(
    page.getByText(/Measurement basis from the Laytime Definitions/)
  ).toBeVisible();
  await expect(page.getByText("Owner position").first()).toBeVisible();
  await expect(page.getByText("Charterer position").first()).toBeVisible();
  await expect(page.getByText("Per-day assessments")).toBeVisible();

  await expect(page.locator("#day-card-2026-06-14")).toContainText("Owner position better supported");
  await expect(page.locator("#day-card-2026-06-15")).toContainText("Owner position better supported");
  await expect(page.locator("#day-card-2026-06-16")).toContainText("Charterer position better supported");
  await expect(page.locator("#day-card-2026-06-14")).toContainText("Bft 5");
  await expect(page.locator("#day-card-2026-06-15")).toContainText("Bft 4");
  await expect(page.locator("#day-card-2026-06-16")).toContainText("Bft 7");

  // The source line `charterparty.pdf · p.3` is rendered only while the clause
  // panel is expanded, so this fails if the toggle stops working.
  const dayCard = page.locator("#day-card-2026-06-14");
  await expect(dayCard).not.toContainText("charterparty.pdf");
  await page.locator("#clause-toggle-2026-06-14").click();
  await expect(dayCard).toContainText("charterparty.pdf · p.3");
  // Three separate claims, in three separate blocks: the test the engine
  // applied, the charterparty wording it was read from, and the source that
  // fixes the measurement. The rule id names no document, so only the
  // measurement basis may name the framework.
  await expect(dayCard).toContainText("Test applied");
  await expect(dayCard).toContainText("CP_WEATHER.MAJORITY_OF_HOURS");
  await expect(dayCard).toContainText("Charterparty text quoted");
  await expect(dayCard).toContainText("Measurement basis");
  await expect(page.locator("#measurement-basis-2026-06-14")).toHaveText(
    "Laytime Definitions for Charter Parties 2013, definition 16"
  );
  await expect(dayCard).toContainText("not a quotation from the charterparty");
  await expect(dayCard).not.toContainText("LAYTIME_DEFS_2013");

  await expect(page.locator("#reconciled-total-display")).toHaveText("$112,000");
  await expect(page.getByText(/\$62,000.*\+.*\$50,000.*=.*\$112,000/)).toBeVisible();

  await page.locator("#generate-claim-letter-btn").click();
  await expect(page).toHaveURL(/\/voyage\/voyage_001\/letter$/);
  await expect(page.getByRole("heading", { name: "Claim Letter" })).toBeVisible();
  // The artifact a counterparty receives is the backend's own letter, not the
  // React fallback: the strings below exist only in `keel_api/letter/render.py`.
  // The React fallback's "Party Positions" / "Per-Day Assessment" wording is
  // deliberately absent from this assertion set.
  await expect(page.getByRole("heading", { name: "Demurrage Reconciliation Notice" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Party Positions" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Day-by-Day Assessment" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Reconciled Settlement" })).toBeVisible();
  await expect(page.getByText("Charterer base liability")).toBeVisible();
  await expect(page.getByText("Items favouring the owner’s position")).toBeVisible();
  await expect(page.getByText(/^Justification \(final disputed day\):/)).toBeVisible();
  await expect(page.getByText(/not a legal opinion, an arbitration/)).toBeVisible();
  await expect(
    page.getByText(/Reconciled Total[^$]*\$112,000/)
  ).toBeVisible();
  // Nothing the fallback would have rendered.
  await expect(page.getByText("Per-Day Assessment")).toHaveCount(0);
  await expect(page.getByText(/The Owner's total claimed:/)).toHaveCount(0);

  await page.getByRole("link", { name: "Dashboard" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  // The reconciled total now shows in both the "Reconciled Value" stat card and
  // the voyages table, so scope to the reconciled cell of the voyage_001 row.
  await expect(
    page
      .getByRole("row", { name: /voyage_001/ })
      .getByRole("cell", { name: "$112,000" })
  ).toBeVisible();
});
