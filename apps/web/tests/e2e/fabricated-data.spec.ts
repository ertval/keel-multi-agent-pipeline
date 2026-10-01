import { expect, test, type Page, type Route } from "@playwright/test";

/**
 * Every one of these asserts a *negative*: that the UI refuses to invent a
 * figure it was not given, and that a hostile response body cannot execute.
 * They are the regression net for the class of bug where a fallback silently
 * substitutes sample data for a real (empty, null, or broken) response.
 */

const LIST = "**/reconciliations?*";
const DETAIL = "**/voyages/voyage_001";
const LETTER = "**/voyages/voyage_001/letter*";

/** Text no route may ever render, whatever the API answers. */
async function expectNoLeakedSentinels(page: Page) {
  const body = await page.evaluate(() => document.body.innerText);
  expect(body).not.toMatch(/\bnull\b/i);
  expect(body).not.toContain("undefined");
  expect(body).not.toContain("NaN");
  expect(body).not.toContain("[object Object]");
  expect(body).not.toContain("p.null");
  await expect(
    page.getByText(/This page couldn't load|Application error|couldn't be loaded/i)
  ).toHaveCount(0);
}

async function fulfilJson(page: Page, url: string, body: unknown) {
  await page.route(url, (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(body),
    })
  );
}

test.beforeEach(async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: /Enter Demo Mode/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
});

test("an empty reconciliation list renders an explicit empty state, not sample voyages", async ({
  page,
}) => {
  await fulfilJson(page, LIST, { items: [], total: 0, page: 1, per_page: 100, total_pages: 0 });

  await page.goto("/reports");

  await expect(
    page.getByText("No reconciliations have been produced yet, so there is nothing to report on.")
  ).toBeVisible();

  // The fabricated portfolio and its seven invented vessels must be gone.
  const body = await page.evaluate(() => document.body.innerText);
  for (const vessel of [
    "MV Aegean Star",
    "MV Baltic Dawn",
    "MV Caspian Voyager",
    "MV Diamond Spirit",
    "MV Emerald Bay",
    "MV Fjord Princess",
    "MV Golden Horizon",
  ]) {
    expect(body).not.toContain(vessel);
  }
  expect(body).not.toContain("$1,357,000");
  expect(body).not.toContain("Split / Conceded");
  expect(body).not.toContain("Total Assessments");

  // The archive starts empty and the export button is not offered.
  await expect(page.locator("#create-report-btn")).toBeDisabled();
  await expect(
    page.getByText(/The archive starts empty and is only populated by the export dialog/)
  ).toBeVisible();

  await expectNoLeakedSentinels(page);
});

test("a failed list request surfaces the error and never falls back to sample rows", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });

  await page.route(LIST, (route: Route) => route.fulfill({ status: 404, body: "not found" }));

  await page.goto("/reports");

  await expect(
    page.getByText("The reconciliation list could not be read, so there is nothing to report on.")
  ).toBeVisible();
  await expect(page.getByText(/The API said: Failed to fetch reconciliations: 404/)).toBeVisible();
  await expect(page.locator("#create-report-btn")).toBeDisabled();

  const body = await page.evaluate(() => document.body.innerText);
  expect(body).not.toContain("MV Baltic Dawn");
  expect(body).not.toContain("Total Audited Value");
  await expectNoLeakedSentinels(page);
});

test("a 500 HTML body from a list endpoint is not rendered as data", async ({ page }) => {
  await page.route(LIST, (route: Route) =>
    route.fulfill({
      status: 500,
      contentType: "text/html",
      body: "<html><body><h1>502 Bad Gateway</h1></body></html>",
    })
  );

  await page.goto("/reports");
  await expect(
    page.getByText("The reconciliation list could not be read, so there is nothing to report on.")
  ).toBeVisible();
  const body = await page.evaluate(() => document.body.innerText);
  expect(body).not.toContain("Bad Gateway");
  await expectNoLeakedSentinels(page);
});

test("a row missing vessel_name and every total renders dashes, never a crash", async ({
  page,
  baseURL,
}) => {
  const appBase = baseURL;
  if (!appBase) throw new Error("playwright.config.ts must set use.baseURL");
  await fulfilJson(page, LIST, {
    items: [
      {
        voyage_id: "voyage_junk",
        created_at: "2026-06-20T10:00:00Z",
        status: "In Review",
        disputed_count: null,
      },
      {
        voyage_id: "voyage_002",
        created_at: "2026-06-18T10:00:00Z",
        vessel_name: "MV Test Vessel",
        owner_name: null,
        charterer_name: null,
        status: "Reconciled",
        owner_total_usd: null,
        charterer_total_usd: null,
        reconciled_total_usd: null,
        disputed_count: 2,
      },
    ],
    total: 2,
    page: 1,
    per_page: 100,
    total_pages: 1,
  });

  await page.goto("/reports");
  await expect(page.getByText("MV Test Vessel")).toBeVisible();
  await expect(page.getByText("2 Disputed Days")).toBeVisible();
  await expect(
    page.getByText("Voyages reporting no disputed-day count")
  ).toBeVisible();
  await expectNoLeakedSentinels(page);

  await page.goto("/reconciliations");
  await expect(page.getByText("MV Test Vessel")).toBeVisible();
  const row = page.getByRole("row", { name: /voyage_002/ });
  await expect(row).toBeVisible();
  // Every money cell is an em dash, never "$0".
  await expect(row.getByText("—")).toHaveCount(5);
  const body = await page.evaluate(() => document.body.innerText);
  expect(body).not.toContain("$0");
  await expectNoLeakedSentinels(page);

  // The dashboard's bar chart must not draw an empty bar on the $0 baseline
  // for a voyage the API returned no figures for. The matcher excludes the app's
  // own port, or the glob would swallow the /voyages page navigation. The port
  // comes from the config's `use.baseURL` rather than from a literal: hardcoding
  // "3000" makes the exclusion false on any other port, the matcher then claims
  // the app's own page request, and it renders as raw JSON — so the assertions
  // below would fail for a reason that has nothing to do with a $0 baseline.
  const appPort = new URL(appBase).port;
  await page.route(
    (url) => url.pathname === "/voyages" && url.port !== appPort,
    (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            voyage_id: "voyage_002",
            created_at: "2026-06-18T10:00:00Z",
            vessel_name: "MV Test Vessel",
            status: "Reconciled",
            owner_total_usd: null,
            charterer_total_usd: null,
            reconciled_total_usd: null,
            disputed_count: 2,
          },
        ]),
      })
  );

  // /dashboard draws the chart; it must decline to plot the voyage.
  await page.goto("/dashboard");
  await expect(
    page.getByText("No voyage returned a claim figure, so there is nothing to chart.")
  ).toBeVisible();
  await expect(page.locator('rect[fill^="url(#bar-"]')).toHaveCount(0);
  await expect(page.getByText("No voyage returned a reconciled figure")).toBeVisible();
  expect(await page.evaluate(() => document.body.innerText)).not.toContain("$0");
  await expectNoLeakedSentinels(page);

  // /voyages draws no chart at all, but the stat card and the row must still
  // read as unmeasured rather than $0.
  await page.goto("/voyages");
  await expect(page.getByText("No voyage returned a reconciled figure")).toBeVisible();
  const voyageRow = page.getByRole("row", { name: /voyage_002/ });
  await expect(voyageRow).toBeVisible();
  // owner name + owner claim + charterer claim + reconciled
  await expect(voyageRow.getByText("—")).toHaveCount(4);
  expect(await page.evaluate(() => document.body.innerText)).not.toContain("$0");
  await expectNoLeakedSentinels(page);
});

test("a list request that never answers leaves the page in a loading state, not a crash", async ({
  page,
}) => {
  await page.route(LIST, async (route: Route) => {
    await new Promise((resolve) => setTimeout(resolve, 60_000));
    await route.abort();
  });

  await page.goto("/reports");
  await expect(page.getByRole("heading", { name: /Maritime Reports/i })).toBeVisible();
  await expect(page.locator("#create-report-btn")).toBeDisabled();
  await expectNoLeakedSentinels(page);
});

test("a detail response with no reconciliation key states that plainly", async ({ page }) => {
  await page.route(DETAIL, (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ pdf_urls: {} }),
    })
  );

  for (const path of ["/voyage/voyage_001", "/voyage/voyage_001/reconcile"]) {
    await page.goto(path);
    await expect(
      page.getByRole("heading", { name: "No reconciliation for voyage voyage_001" })
    ).toBeVisible();
    await expect(
      page.getByText(/No figures have been substituted for the missing ones/)
    ).toBeVisible();
    await expectNoLeakedSentinels(page);
  }
});

test("the letter page refuses to execute injected markup", async ({ page }) => {
  await page.route(LETTER, (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: "text/html",
      body: [
        "<!DOCTYPE html><html><head><style>p{color:red}</style></head><body>",
        "<img src=x onerror=\"window.__XSS=['img-onerror']\">",
        "<svg onload=\"window.__XSS=['svg-onload']\"></svg>",
        "<script>window.__XSS=['script-tag']</script>",
        "<iframe src=\"javascript:window.__XSS=['iframe']\"></iframe>",
        "<a href=\"javascript:window.__XSS=['js-href']\">click</a>",
        "<div onmouseover=\"window.__XSS=['onmouseover']\" style=\"background:url(javascript:1)\">hover</div>",
        "<form action=\"javascript:window.__XSS=['form']\"><button formaction=\"javascript:window.__XSS=['formaction']\">go</button></form>",
        "<p>Real paragraph</p><table><tr><th>Head</th><td>Cell</td></tr></table>",
        "</body></html>",
      ].join(""),
    })
  );

  await page.goto("/voyage/voyage_001/letter");
  await expect(page.getByRole("heading", { name: "Claim Letter" })).toBeVisible();
  await page.waitForTimeout(1500);

  const xss = await page.evaluate(
    () => (window as unknown as { __XSS?: string[] }).__XSS ?? []
  );
  expect(xss).toEqual([]);

  // The sanitiser must not simply blank the document: real letter markup that
  // the template uses has to survive.
  const body = await page.evaluate(() => document.body.innerText);
  expect(body).toContain("Real paragraph");
  expect(body).toContain("Head");
  expect(body).toContain("Cell");

  // No executable surface survived. Scoped to the letter container: Next puts
  // its own hydration <script> tags in <body>.
  const markup = await page.evaluate(
    () => document.getElementById("letter-document")?.innerHTML ?? ""
  );
  expect(markup).not.toMatch(/onerror/i);
  expect(markup).not.toMatch(/onload/i);
  expect(markup).not.toMatch(/onmouseover/i);
  expect(markup).not.toMatch(/<script/i);
  expect(markup).not.toMatch(/<iframe/i);
  expect(markup).not.toMatch(/javascript:/i);
  expect(markup).not.toMatch(/<img/i);
  expect(markup).not.toMatch(/<svg/i);
  expect(markup).not.toMatch(/<form/i);
  await expectNoLeakedSentinels(page);
});

test("the sanitised real letter keeps its content and its stylesheet", async ({ page }) => {
  await page.goto("/voyage/voyage_001/letter");
  await expect(
    page.getByRole("heading", { name: "Demurrage Reconciliation Notice" })
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Day-by-Day Assessment" })).toBeVisible();
  await expect(page.getByText("Charterer base liability")).toBeVisible();

  const markup = await page.evaluate(
    () => document.getElementById("letter-document")?.innerHTML ?? ""
  );
  expect(markup).toContain("<style>");
  expect(markup).toContain("letter-container");
  await expectNoLeakedSentinels(page);
});
