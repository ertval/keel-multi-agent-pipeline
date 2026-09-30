import { expect, test } from "@playwright/test";

/**
 * The modal contract, asserted rather than assumed. A dialog that declares
 * `aria-modal` has to behave modally: focus in, focus contained, Escape out.
 */

test.beforeEach(async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: /Enter Demo Mode/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
});

const probe = (page: import("@playwright/test").Page) =>
  page.evaluate(() => {
    const popup = document.querySelector('[data-slot="dialog-content"]');
    const active = document.activeElement;
    return {
      present: !!popup,
      role: popup?.getAttribute("role") ?? null,
      ariaModal: popup?.getAttribute("aria-modal") ?? null,
      hasTitle: !!popup?.querySelector('[data-slot="dialog-title"]'),
      focusInside: !!popup && !!active && popup.contains(active),
      activeLabel: (active?.textContent ?? "").trim().slice(0, 30),
    };
  });

test("the claim letter's delivery dialog is a real modal", async ({ page }) => {
  await page.goto("/voyage/voyage_001/letter");
  await page.getByRole("button", { name: /Send to Other Party/i }).click();
  await expect(page.locator('[data-slot="dialog-content"]')).toBeVisible();
  await page.waitForTimeout(400);

  const opened = await probe(page);
  expect(opened.role).toBe("dialog");
  expect(opened.ariaModal).toBe("true");
  expect(opened.hasTitle).toBe(true);
  expect(opened.focusInside).toBe(true);

  // Tab and Shift+Tab cycle inside; they never reach the page behind.
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press("Tab");
    expect((await probe(page)).focusInside).toBe(true);
  }
  for (let i = 0; i < 4; i++) {
    await page.keyboard.press("Shift+Tab");
    expect((await probe(page)).focusInside).toBe(true);
  }

  // Nothing behind the dialog is reachable. The primitive marks background
  // content inert, so the page underneath is not focusable or exposed.
  const behindIsUnreachable = await page.evaluate(() => {
    const popup = document.querySelector('[data-slot="dialog-content"]');
    const behind = document.querySelector("#download-letter-pdf-btn");
    if (!popup || !behind) return null;
    const active = document.activeElement;
    return {
      activeInside: popup.contains(active),
      behindInert:
        behind.closest("[inert]") !== null ||
        behind.closest("[data-base-ui-inert]") !== null,
      behindHidden:
        behind.getAttribute("aria-hidden") === "true" ||
        behind.closest('[aria-hidden="true"]') !== null,
    };
  });
  expect(behindIsUnreachable?.activeInside).toBe(true);
  expect(
    (behindIsUnreachable?.behindInert ?? false) ||
      (behindIsUnreachable?.behindHidden ?? false)
  ).toBe(true);

  await page.keyboard.press("Escape");
  await expect(page.locator('[data-slot="dialog-content"]')).toHaveCount(0);
});

test("the landing page's demo explainer is a real modal", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /How the Demo Works/i }).click();
  await expect(page.locator('[data-slot="dialog-content"]')).toBeVisible();
  await page.waitForTimeout(400);

  const opened = await probe(page);
  expect(opened.role).toBe("dialog");
  expect(opened.ariaModal).toBe("true");
  expect(opened.hasTitle).toBe(true);
  expect(opened.focusInside).toBe(true);

  for (let i = 0; i < 6; i++) {
    await page.keyboard.press("Tab");
    expect((await probe(page)).focusInside).toBe(true);
  }

  await page.keyboard.press("Escape");
  await expect(page.locator('[data-slot="dialog-content"]')).toHaveCount(0);
});

test("the clause citation dialog opens, traps focus and closes on Escape", async ({
  page,
}) => {
  await page.goto("/voyage/voyage_001");
  await page.getByRole("button", { name: /^Clause 3$/ }).click();
  await expect(page.locator('[data-slot="dialog-content"]')).toBeVisible();
  await expect(
    page.getByText("Time lost on account of weather shall not count as laytime")
  ).toBeVisible();

  const opened = await probe(page);
  expect(opened.role).toBe("dialog");
  expect(opened.ariaModal).toBe("true");
  expect(opened.focusInside).toBe(true);

  for (let i = 0; i < 6; i++) {
    await page.keyboard.press("Tab");
    expect((await probe(page)).focusInside).toBe(true);
  }

  await page.keyboard.press("Escape");
  await expect(page.locator('[data-slot="dialog-content"]')).toHaveCount(0);
});
