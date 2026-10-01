import { expect, test } from "@playwright/test";

/**
 * The landing page renders eleven designs, selected by `?v=`.
 *
 * This spec deliberately asserts **invariants, not styling**. An earlier
 * version pinned each variant's decorative heading ("SYS // TELEMETRY",
 * "KL-2026-V001-REV3"), which meant renaming a heading broke the suite while a
 * variant could quietly invent a figure and stay green. `app/landing/content.ts`
 * is the single source of truth and states that a variant able to restate or
 * round a claim is the design risk; these assertions are the net for that.
 *
 * Adding a design means adding its key to `VARIANTS` below — the same
 * deliberate-two-places rule as the tracked-path gate in `ci.yml`.
 */
const VARIANTS = [
  "statement",
  "telemetry",
  "gazette",
  "blueprint",
  "swiss",
  "stateflow",
  "carbon",
  "dusk",
  "pleading",
  "radar",
  "manifest",
] as const;

/** The canonical `voyage_001` result. Never derive these in the design. */
const FIGURES = ["$187,000", "$62,000", "$112,000"];
const DISPUTED_DAYS = ["14 Jun 2026", "15 Jun 2026", "16 Jun 2026"];

/** Every variant must carry the disclosure that the build is bounded. */
const HONESTY_HEADING = /what runs here, and what does not/i;
const HONESTY_ITEM = /nothing is checked and no account exists|no account is created/i;

/**
 * Several designs set `text-transform: uppercase`, and `innerText` returns the
 * transformed string, so text assertions here are case-insensitive by design.
 * The underlying DOM still holds the mixed-case canonical values.
 */
async function readBody(page: import("@playwright/test").Page) {
  return (await page.locator("body").innerText()).toUpperCase();
}

test.describe("Landing page variants", () => {
  test("renders the default variant and the switcher at the bare URL", async ({
    page,
  }) => {
    await page.goto("/");

    // `smoke.spec.ts` already pins the heading; this asserts the route is the
    // default variant rather than a redirect.
    await expect(page).toHaveURL(/\/$/);
    await expect(
      page.getByRole("heading", { name: /Bringing Deterministic/i })
    ).toBeVisible();
    await expect(page.locator('[data-slot="variant-switcher"]')).toBeVisible();
    await expect(
      page.locator('[data-slot="variant-switcher"] button')
    ).toHaveCount(VARIANTS.length);
  });

  test("every variant publishes the canonical reconciliation and the disclosure", async ({
    page,
  }) => {
    for (const variant of VARIANTS) {
      const response = await page.goto(`/?v=${variant}`);
      expect(response?.status(), `?v=${variant} status`).toBe(200);

      const body = await readBody(page);

      for (const figure of FIGURES) {
        expect(body, `${variant} must render ${figure}`).toContain(figure);
      }
      for (const day of DISPUTED_DAYS) {
        expect(body, `${variant} must render ${day}`).toContain(day.toUpperCase());
      }

      // The bounded-build disclosure is the product's whole honesty contract.
      await expect(
        page.getByText(HONESTY_HEADING).first(),
        `${variant} must carry the "what runs here" disclosure`
      ).toBeVisible();
      expect(body, `${variant} must say no account exists`).toMatch(
        HONESTY_ITEM
      );

      // Structural invariants.
      await expect(page.locator("h1"), `${variant} needs exactly one h1`).toHaveCount(1);
      for (const anchor of ["ledger", "method", "build"]) {
        await expect(
          page.locator(`#${anchor}`),
          `${variant} must expose #${anchor} for the footer nav`
        ).toHaveCount(1);
      }
      await expect(
        page.locator('a[href="/login"]').first(),
        `${variant} must link into the app`
      ).toBeVisible();
    }
  });

  test("every variant lays out without horizontal overflow or console errors", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => consoleErrors.push(String(error)));

    for (const variant of VARIANTS) {
      await page.setViewportSize({ width: 375, height: 900 });
      await page.goto(`/?v=${variant}`, { waitUntil: "networkidle" });

      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth
      );
      expect(overflow, `${variant} overflows at 375px`).toBe(0);
    }

    expect(consoleErrors, "variants must render without console errors").toEqual(
      []
    );
  });

  test("an unknown or hostile ?v= falls back to the default instead of failing", async ({
    page,
  }) => {
    for (const hostile of ["bogus", "", "STATEMENT", "../../etc/passwd"]) {
      const response = await page.goto(`/?v=${hostile}`);
      expect(response?.status(), `?v=${hostile} status`).toBe(200);
      await expect(
        page.getByRole("heading", { name: /Bringing Deterministic/i })
      ).toBeVisible();
      await expect(
        page.locator('[data-slot="variant-switcher"] button[aria-pressed="true"]')
      ).toHaveCount(1);
    }
  });
});

test.describe("Variant switcher", () => {
  test("marks exactly one design active and navigates to each in turn", async ({
    page,
  }) => {
    await page.goto("/");
    const switcher = page.locator('[data-slot="variant-switcher"]');

    // Start at `statement` (the default at the bare URL) and walk forward.
    // Clicking the already-active design is deliberately a no-op, so
    // `statement` is asserted as the default above rather than as a navigation.
    await expect(
      switcher.locator('button[aria-pressed="true"]')
    ).toHaveCount(1);

    for (const variant of VARIANTS.slice(1)) {
      await switcher
        .getByRole("button", { name: new RegExp(variant, "i") })
        .click();
      await expect(page).toHaveURL(new RegExp(`\\?v=${variant}`));
      await expect(
        switcher.locator('button[aria-pressed="true"]')
      ).toHaveCount(1);
    }

    // Clicking the active design must not navigate.
    const active = switcher.locator('button[aria-pressed="true"]');
    await active.click();
    await expect(page).toHaveURL(new RegExp(`\\?v=${VARIANTS.at(-1)}`));
  });

  test("is operable from the keyboard", async ({ page }) => {
    await page.goto("/?v=statement");
    const target = page
      .locator('[data-slot="variant-switcher"]')
      .getByRole("button", { name: /carbon/i });

    await target.focus();
    await expect(target).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\?v=carbon/);
  });

  test("the skip link moves focus into the main landmark", async ({ page }) => {
    await page.goto("/?v=radar");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: /skip to content/i });
    await expect(skip).toBeFocused();
    await page.keyboard.press("Enter");
    // Regression guard: `<main>` needs tabindex={-1} or focus stays on <body>
    // and the next Tab restarts from the header.
    await expect(page.locator("main")).toBeFocused();
  });
});
