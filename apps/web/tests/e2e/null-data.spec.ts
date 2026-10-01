import { expect, test, type Page, type Route } from "@playwright/test";

/**
 * The API emits `null` wherever it has no honest value. These specs rewrite the
 * live voyage_001 response to those shapes and assert the UI says so out loud
 * instead of rendering a blank or the literal text "null".
 */
const DETAIL = "**/voyages/voyage_001";

async function stubDetail(
  page: Page,
  mutate: (reconciliation: Record<string, unknown>) => void
) {
  await page.route(DETAIL, async (route: Route) => {
    const response = await route.fetch();
    const body = await response.json();
    mutate(body.reconciliation);
    await route.fulfill({ response, json: body });
  });
}

test.beforeEach(async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: /Enter Demo Mode/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
});

test("a null Beaufort force and precipitation render an explicit not-recorded state", async ({ page }) => {
  await stubDetail(page, (rec) => {
    const verdicts = rec.day_verdicts as {
      weather: Record<string, unknown>;
      bimco_clause: Record<string, unknown>;
    }[];
    verdicts[0].weather.wind_force_beaufort = null;
    verdicts[0].weather.precipitation_mm = null;
    verdicts[0].bimco_clause.clause_text = null;
    verdicts[0].bimco_clause.source_document = null;
    verdicts[0].bimco_clause.page_number = null;
  });

  await page.goto("/voyage/voyage_001/reconcile");
  const day = page.locator("#day-card-2026-06-14");
  await expect(day).toBeVisible();

  await expect(day.getByText("Wind force not recorded")).toBeVisible();
  await expect(day.getByText("Precipitation not recorded")).toBeVisible();
  await expect(
    day.getByText(/No weather reading was returned for part of this day/)
  ).toBeVisible();

  // The days that do have readings are untouched.
  await expect(page.locator("#day-card-2026-06-15")).toContainText("Bft 4");
  await expect(page.locator("#day-card-2026-06-16")).toContainText("Bft 7");

  // A matched clause with no text says so rather than showing an empty block.
  await page.locator("#clause-toggle-2026-06-14").click();
  await expect(
    day.getByText(/No charterparty clause text was matched to this day/)
  ).toBeVisible();
  await expect(
    day.getByText("source document not named · page not recorded")
  ).toBeVisible();

  // Nothing anywhere on the page may leak the raw sentinel.
  const body = await page.evaluate(() => document.body.innerText);
  expect(body).not.toMatch(/\bnull\b/i);
  expect(body).not.toMatch(/Bft\s*(?:·|undefined)/);
  expect(body).not.toContain("NaN");

  // The money figures still render from the same response.
  await expect(page.locator("#reconciled-total-display")).toHaveText("$112,000");
  await expect(page.getByRole("paragraph").filter({ hasText: "$187,000" }).first()).toBeVisible();
});

test("a citation with no source document keeps the honest no-preview state", async ({ page }) => {
  await stubDetail(page, (rec) => {
    const owner = rec.owner_calculation as {
      audit_trace: { citation: Record<string, unknown> | null }[];
    };
    owner.audit_trace[0].citation!.document = null;
  });

  const pdfRequests: string[] = [];
  page.on("request", (req) => {
    if (/\.pdf(\?|$)/.test(req.url())) pdfRequests.push(req.url());
  });

  await page.goto("/voyage/voyage_001");
  await expect(page.getByRole("heading", { name: "MV Hellenic Pioneer" })).toBeVisible();
  await page.getByText("p.1").first().click();

  const viewer = page.locator("#document-viewer");
  await expect(viewer).toBeVisible();
  await expect(viewer).toContainText(/Owner calculation . step 1/);
  await expect(viewer).toContainText("source document not named");
  await expect(viewer).toContainText("p.1");
  await expect(
    viewer.getByText(/does not name a source document, so there is nothing to preview/)
  ).toBeVisible();
  await expect(viewer.getByText("no source document named")).toBeVisible();

  // No PDF is fetched, because there is no URL to fetch.
  expect(pdfRequests).toEqual([]);

  const body = await page.evaluate(() => document.body.innerText);
  expect(body).not.toMatch(/\bnull\b/i);
  expect(body).not.toContain("undefined");
});

test("a citation with no page number never prints p.null", async ({ page }) => {
  await stubDetail(page, (rec) => {
    const owner = rec.owner_calculation as {
      audit_trace: { citation: Record<string, unknown> | null }[];
    };
    for (const entry of owner.audit_trace) {
      if (entry.citation) entry.citation.page_number = null;
    }
    const charterer = rec.charterer_calculation as {
      audit_trace: { citation: Record<string, unknown> | null }[];
    };
    for (const entry of charterer.audit_trace) {
      if (entry.citation) entry.citation.page_number = null;
    }
  });

  await page.goto("/voyage/voyage_001");
  await expect(page.getByRole("heading", { name: "MV Hellenic Pioneer" })).toBeVisible();

  // The audit-trace pill.
  await expect(page.getByText("page not recorded").first()).toBeVisible();

  // The document viewer, opened from a row whose citation has no page either.
  await page.getByText("BEFORE_NOR: NOR tendered").first().click();
  const viewer = page.locator("#document-viewer");
  await expect(viewer).toBeVisible();
  await expect(viewer).toContainText("page not recorded");
  await expect(viewer).not.toContainText("p.null");
  await expect(
    viewer.getByText(/This build ships no source PDF, so the preview cannot load/)
  ).toBeVisible();

  const body = await page.evaluate(() => document.body.innerText);
  expect(body).not.toContain("p.null");
  expect(body).not.toMatch(/\bnull\b/i);
  expect(body).not.toContain("undefined");
  expect(body).not.toContain("NaN");
  expect(body).not.toContain("[object Object]");

  // The figures are unaffected by the missing page numbers.
  await expect(page.getByRole("paragraph").filter({ hasText: "$187,000" })).toBeVisible();
  await expect(page.getByRole("paragraph").filter({ hasText: "$62,000" })).toBeVisible();
});

test("the PDF viewer fetches its worker from this origin, and names the real reason the preview is empty", async ({
  page,
  baseURL,
}) => {
  const appOrigin = baseURL;
  if (!appOrigin) throw new Error("playwright.config.ts must set use.baseURL");
  const workerRequests: string[] = [];
  const foreignRequests: string[] = [];
  page.on("request", (req) => {
    const url = req.url();
    if (url.includes("pdf.worker")) workerRequests.push(url);
    const host = new URL(url).hostname;
    if (host !== "localhost" && host !== "127.0.0.1" && !host.endsWith("127.0.0.1")) {
      foreignRequests.push(url);
    }
  });

  await page.goto("/voyage/voyage_001");
  await page.getByText("p.1").first().click();
  const viewer = page.locator("#document-viewer");
  await expect(viewer).toBeVisible();
  // pdf.js resolves its worker against the page origin. A CDN here means the
  // viewer silently degrades to a fake worker on an offline host and never
  // requests the PDF at all, which is indistinguishable from "no source file".
  await expect
    .poll(() => workerRequests.length, { timeout: 15_000 })
    .toBeGreaterThan(0);
  expect(workerRequests.every((u) => u.startsWith(`${new URL(appOrigin).origin}/`))).toBe(true);
  expect(foreignRequests.filter((u) => u.includes("pdf.worker"))).toEqual([]);

  // The repo ships no source PDFs, so the preview cannot load. The copy must
  // say that, not blame a document server that answered correctly.
  await expect(
    viewer.getByText(/This build ships no source PDF, so the preview cannot load/)
  ).toBeVisible();
  await expect(viewer.getByText(/could not be loaded from its cited location/)).toHaveCount(0);
});
