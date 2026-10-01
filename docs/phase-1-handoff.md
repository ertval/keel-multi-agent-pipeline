# Phase 1 handoff

Companion to [`docs/continuation-plan.md`](continuation-plan.md). The plan is the
roadmap and the reasoning; this file is **where the work stands** and what a new
session should pick up first. Read the plan for *why* an item is ordered where it
is — do not re-derive the ordering here.

Written at the end of the landing-page variant session. Nothing in this file is a
plan for the plan; it is a status report plus a short punch list.

---

## 1. Verified state at handoff

Every number below was produced by running the command, on this tree.

| Gate | Command | Result |
|---|---|---|
| Typecheck | `cd apps/web && pnpm exec tsc --noEmit` | **0 errors** |
| Lint | `cd apps/web && pnpm run lint` | **0 errors, 4 warnings** |
| Lint budget (CI form) | `cd apps/web && pnpm run lint --max-warnings 4` | **exit 0** |
| Build | `cd apps/web && pnpm exec next build` | **exit 0**, 9 routes + `/_not-found` |
| Backend suite | `cd apps/api && uv run pytest -q` | **16 failed, 338 passed, 1 skipped** |
| Canonical | `cd apps/api && uv run pytest -m canonical -q` | **15 passed, 340 deselected** |
| e2e | `cd apps/web && pnpm exec playwright test` | **40 passed** (7 spec files) |
| Layout sweep | 11 variants × 8 widths | **0 horizontal overflow, 0 content occluded** |

The 16 backend failures are the **absent source PDFs** — 3 in `test_extraction.py`,
5 `test_fixture_file_exists` parameters, 8 in `test_parsers.py`. The 1 skip is
`tests/test_extraction.py:136: OPENAI_API_KEY not set`, which is **not**
PDF-dependent and does not become a 17th quarantine when the PDFs return.

Do not treat 16/338/1 as a regression baseline to "fix". It is the documented
quarantine. See step 2.

---

## 2. What this session changed, so you do not re-investigate it

The landing page `/` became a **variant system**: eleven designs behind `?v=<key>`.

```
apps/web/app/page.tsx          38 lines: awaits searchParams, resolves the key on
                               the server, renders one variant + the switcher
apps/web/app/landing/
  content.ts                   single source of truth for every claim on the page
  registry.ts                  11 keys, VARIANT_OPTIONS, resolveVariant()
  VariantSwitcher.tsx          the only "use client" file in the directory
  v1-statement.tsx … v11-manifest.tsx
```

Four things a new session needs to know because they are **not** obvious:

1. **`content.ts` is load-bearing for honesty, not just for copy.** A variant that
   could edit its own strings could invent a figure. Every variant renders through
   it. Do not inline a copy string in a variant; add it to `content.ts`.
2. **`/` is now `ƒ` (dynamic), not a static prerender.** Reading `searchParams`
   opts the route into dynamic rendering. This is why `playwright.config.ts`'s
   `timeout` is 90s, and why a clean checkout no longer serves `/` from cache.
3. **Fonts are self-hosted via `next/font/google`** (`app/layout.tsx`), reached from
   `globals.css` as `var(--font-*)`. The previous remote `@import url(...)` at the
   top of `globals.css` was being **stripped by the CSS pipeline**: the built sheet
   had zero `@font-face` and `document.fonts.size === 0`, so every family silently
   fell back. Do not reintroduce a CSS `@import` for fonts.
4. **The variant set and CI's tracked-path gate are deliberately coupled.**
   `ci.yml` asserts both `expected=47` for the critical-path list **and** that the
   set of tracked `app/landing/*.tsx` equals the list's `app/landing/*` entries.
   Adding a twelfth variant without adding its gate entry fails CI on purpose.

### The trap that will bite you first: `outline-none` cancels `outline-2`

In Tailwind v4, `outline-none` sets `--tw-outline-style: none` on the element, and
`focus-visible:outline-2` reads that same variable back — so the two cancel and
**no focus ring is painted at all**. Measured as zero changed pixels. `outline-none`
and `outline-2` were paired in all eleven variants and in the switcher.

The fix is `focus-visible:outline-2 focus-visible:outline-solid`: `outline-solid`
sets the variable to `solid`, and it is **required**, because
`components/ui/button.tsx` also carries `outline-none` in the shadcn base — so a
`DialogTrigger`/`DialogClose` still paints nothing without it.

Do not write `outline-none focus-visible:outline-2` anywhere in this repo.

---

## 3. Phase 1 — what remains

Steps 1–3 of the plan plus the three §16 disclosures. Ordered by risk, not novelty.
Sizes are the plan's.

### Step 1 — Human sign-off gate (**S**)

The product's reason to exist, and the reason it is first: today `main.py:480`
writes `"In Review"` with the comment *"Require user approval before marking
'Reconciled'"*, and `PATCH /voyages/{id}/status` lets **any unauthenticated
caller** set `Reconciled | In Review | Pending | Closed`. The status vocabulary
names a gate that does not exist, so a reconciliation can reach a counterparty
reading as advice that no person approved.

Plan detail, file list and acceptance criteria: [`continuation-plan.md` §4](continuation-plan.md#4-step-1--human-sign-off-gate-and-the-audit-log-a-reviewer-needs).

Watch for these three, which ride along in the same screen and are easy to miss:

- `PipelineState.validation_errors` must **block** issuing. `run_voyage_pipeline`
  already hands them to `on_validation_errors` and `main._run_pipeline_task`
  already persists them — but the graph still *calculates* after three failed
  validations, so a voyage can currently be issued carrying errors.
- Surface `_threshold_source` returning `None` (`pipeline_agents.py:354-366`) as a
  must-fix-before-issuing condition, not a footnote.
- Surface `_cited_rule_authority` (`pipeline_agents.py:333-343`) as a fact the
  reviewer sees, not something they find in a payload.

### Step 2 — Restore the source PDFs (**S**, mechanical)

`fixtures/voyage_001/` has eight JSON files and no PDFs, so the checkout cannot
parse or extract anything. This is what makes the 16 red tests red.

**CI will turn red on purpose when you commit the PDFs**, and that is the designed
path: `ci.yml` holds `KNOWN_MISSING_PDF_TESTS` as a literal 16-entry list, fails if
the count is not 16, and emits a remediation message naming the exact lines to
delete and both literal `16`s to update. Read that message rather than guessing.

If the originals cannot be recovered, `scripts/generate_fixtures.py` produces
equivalents — and say so in the commit message.

Plan detail: [§5](continuation-plan.md#5-step-2--restore-the-source-pdfs-un-quarantine-16-tests).

### Step 3 — Real authentication + per-voyage authorisation (**L**, 1.5–3 weeks)

Follows step 1 rather than preceding it, because step 1 writes an approval signed by
somebody and today that name would be an unauthenticated string.

`AdmissionGuard` enforces `KEEL_API_TOKEN` **only when the variable is set**, and
when set it is one shared secret with no identity, no expiry, no rotation and no
per-voyage check. `apps/web/proxy.ts` mints a published constant cookie and its own
first line says it is not authentication.

**Pick one provider and commit to it.** Designing for three is the failure mode the
plan warns about. Multi-tenancy as a data model is out of scope — authentication
plus per-voyage authorisation closes the hole; RLS is later and only makes sense
once the database is no longer SQLite.

Plan detail: [§6](continuation-plan.md#6-step-3--real-authentication-and-per-voyage-authorisation).

### Also owed, not steps (§16)

Two are one-line backend changes and one is a sanitiser fix. None blocks another,
and each is a fact the tree currently computes and then does nothing useful with.

| §16 | What |
|---|---|
| [16.1](continuation-plan.md#161-reconciliationrule_authority-never-reaches-the-wire) | `Reconciliation.rule_authority` is derived by `_cited_rule_authority` and never reaches the wire. For `voyage_001` it is `BIMCO_2013` because the fixture's clause 3.1 incorporates the 2013 definitions by name. |
| [16.2](continuation-plan.md#162-docsredoc-and-openapijson-are-unauthenticated) | `/docs`, `/redoc` and `/openapi.json` are served unauthenticated — and the guard is off by default. |
| [16.3](continuation-plan.md#163-the-letter-sanitisers-stylesheet-reject-list-is-a-blacklist) | `serializeStyleSheet` rejects by token blacklist, so a head-level sheet using `image-set()` passes and can issue an off-document GET. |

---

## 4. The module routes and how they are reached

Three charterer-side claim modules arrived with this work and are **now linked from
the workspace sidebar**, under a second group called **Modules**:

| Route | Sidebar label | State |
|---|---|---|
| `/modules/speed` | Speed & consumption | Ledger shell, rows all `—`, "Compare warranty" disabled |
| `/modules/bunkers` | Bunkers | Ledger shell, rows all `—`, action disabled |
| `/modules/disbursements` | Disbursements | Two empty columns: tariff line, invoice line |

They are **scaffolds, not features**. Each renders `ModuleLedger` with the intended
columns and inputs, but no computation is wired and every figure is an em dash. Do not
describe them as working; `lib/settlements.ts` currently holds a `Settlement` type and
nothing consumes it.

**The nav is data-driven so adding a fourth is one array entry** —
`NAV_GROUPS` in `apps/web/components/AppSidebar.tsx`. Each entry is
`{ label, href, icon, active }`:

- `active: false` renders the row as a non-navigable "Coming soon" tooltip instead of
  a link. That affordance existed before and is preserved; it is the extension point
  for a route that exists but is not ready to enter.
- `href` is matched exactly, or as a prefix on a `/` boundary. That boundary is
  load-bearing: `/voyages` must not light up on `/voyage/voyage_001`, and
  `smoke.spec.ts` asserts it.

**The landing page does not link to them.** That is deliberate, not an oversight:
`/` is a public marketing surface and these are workspace screens behind the demo
cookie. If you want them discoverable before login, that is a marketing decision, and
the place to make it is a section in `app/landing/content.ts` so all eleven variants
pick it up at once rather than eleven separate edits.

## 5. Carried-forward decisions — do not silently "fix" these

A deliberate editorial decision was made to **remove "demo" and "hackathon" framing**
from the frontend to reposition the product as post-MVP. That is settled. Four files
retain copy that the code does not support, and the owner has chosen to **leave them
for now**:

| File | The claim | What the code says |
|---|---|---|
| `app/(auth)/login/page.tsx:302` | "Deployment preview — preloaded with audited voyage records and deterministic reconciliation models" | There is no deployment; nothing is audited; the app's own comment says it is a visual mock. |
| `app/(dashboard)/reports/page.tsx:596` and `:461` | "calculations reflect deterministic reference fixtures" / "were generated for portfolio preview" | `lib/api.ts:426` says those rows were **never analysed by the engine** and are hand-typed literals. Unreachable today — `USE_MOCK` is `false`. |
| `components/AppSidebar.tsx:169-177` | "Operations Analyst / analyst@keel.io" | An asserted signed-in identity. The build has no accounts, and `login` names a *different* identity. |
| `app/(dashboard)/dashboard/page.tsx:271` | "load the audited reference voyage" | Repeats "audited". |

**These contradict the landing page**, which discloses the same limits honestly in
`content.ts`'s `DOES_NOT_RUN`. That is the real cost: the marketing surface says
one thing and the product's own front page says another.

Either fix the copy to match the code, or build the backing feature so the copy
becomes true. Do not leave it unremarked. Note that `content.ts:173-174` was already
corrected in the landing work ("audited voyage" → "reconciled voyage"; "ready for
commercial execution" → "shows the arithmetic behind every figure") because it is
the shared module all eleven variants render.

---

## 6. Fragilities worth knowing before you touch the toolchain

| Thing | Why it matters |
|---|---|
| **`next/font/google` fetches at build time.** | A `next build` failed once on a transient Google Fonts fetch (`Can't resolve '@vercel/turbopack-next/internal/font/google/font'`). Retry, but if your CI has no egress to `fonts.googleapis.com`, **the build will fail**. The vendored `.woff2` files under `.next/static/media` are a build artifact, not a committed input — there is no offline fallback today. |
| **Three specs used to hardcode port 3000.** | Fixed in this session — `null-data.spec.ts`, `fabricated-data.spec.ts` and `proxy.spec.ts` now derive the port from `baseURL`. One of them (`fabricated-data.spec.ts`) had a *negative* exclusion `url.port !== "3000"` that, on any other port, intercepted the app's own `/voyages` navigation and fulfilled it with JSON. **Do not reintroduce a literal port.** |
| **An unrelated project may hold port 3000.** | `playwright.config.ts` starts `next dev` on 3000 itself; anything squatting it makes the suite unrunnable. In this session `zone-modules/crud-master`'s API gateway held it, so the suite was run against a production server on another port with a temporary config. |
| **`playwright.config.ts` timeout is 90s / expect 15s.** | Set because `demo-workflow` measured ~47s under `next dev` + full parallelism while CI runs `--fail-on-flaky-tests`. It is ~5× the observed worst case against a **production** server (17.8s). If you see it masking a latency problem, prefer per-test `test.setTimeout` over a global ceiling. |
| **`Fraunces`, `Syne` and `Bricolage_Grotesque` load but no variant paints them.** | Verified loadable and resolvable, but unused. They are dead weight in `app/layout.tsx` and `globals.css` — prune them, or use them. |
| **Adapter contrast is not verified in dark mode for all designs.** | Each variant sets its own theme-invariant palette, but a few carry residual `dark:` overrides. A `html.dark` pass across all eleven has not been run since the last contrast round. |

---

## 7. Start here

1. Read [`docs/continuation-plan.md`](continuation-plan.md) §1–§3 for the ordering
   and the three facts that force it.
2. Run the gate table in §1 above. Anything other than the stated numbers means the
   tree moved under you.
3. Read §4 if you are extending the modules — the nav is one array entry, and the
   three screens are scaffolds with no figures wired.
4. **Step 2 is the cheapest and unblocks the most** (16 red tests → green, and the
   checkout becomes able to parse at all). Do it first even though the plan orders
   step 1 first — step 1 is riskier to get wrong, not riskier to leave undone, and
   step 2 costs nothing.
5. Then step 1, then step 3.

**Do not** reintroduce a CSS `@import` for fonts, pair `outline-none` with
`outline-2`, hardcode port 3000, or inline a claim string in a variant instead of
`content.ts`. Those four are the ways this session's work silently regresses.
