<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# `apps/web` — frontend agent context

Scope of this file: `apps/web/` only. For the backend, the pipeline, and the
product's legal sourcing, read the root [AGENTS.md](../AGENTS.md) — it is the
authoritative map. Do not restate it here; it goes stale.

**Read the traps at the bottom before you touch anything.**

## Stack, as installed

| Thing | Version / fact | Where |
|---|---|---|
| Next.js | **16.2.6**, App Router, **Turbopack by default** | `package.json:20` |
| React | 19.2.4 | `package.json:21-22` |
| Tailwind | 4, via `@tailwindcss/postcss` | `package.json:31` |
| UI primitives | shadcn/ui on `@base-ui/react` (`package.json:14`), plus `@radix-ui/react-collapsible` (`:15`) and `@radix-ui/react-dialog` (`:16`) for the sidebar and modal primitives, and `lucide-react` (`:19`) for icons | `components/ui/`, `components.json` |
| PDF | `react-pdf` 10, worker vendored to `public/pdf.worker.min.mjs` | `PdfViewer.tsx:14` |
| Package manager | **pnpm 11.4.0** | `apps/web/pnpm-lock.yaml` |
| Install governance | `apps/web/pnpm-workspace.yaml` | `allowBuilds`: `sharp`, `unrs-resolver` allowed; `msw`, `core-js` denied |
| `packageManager` field | **absent** — CI pins the version itself | `ci.yml:334-336` |
| TypeScript | strict, `noEmit`, `@/*` → `./*` | `tsconfig.json` |

`next.config.ts` sets a Turbopack `resolveAlias` for `canvas` (a pdf.js
optional peer) to `./empty-module.ts`, and pins `NEXT_PUBLIC_API_URL` to
`http://127.0.0.1:8000` by default.

### `pnpm-workspace.yaml` is load-bearing

Nothing else in the tree names it, and deleting it breaks the toolchain. Its
`allowBuilds` map runs the postinstall hooks for `sharp` (Next image
optimisation, and `unrs-resolver`, whose prebuilt native binding **must** be
linked or `eslint` throws at require time), and explicitly denies `msw` (its
postinstall is a no-op here; it is only a transitive dep of the `shadcn` CLI) and
`core-js` (not in the dependency graph at all). `minimumReleaseAge: 0` sits
alongside it. It lives in `apps/web/`, not the repo root.

## Next 16 specifics you will get wrong from memory

Each of these was verified against `node_modules/next/dist/docs/`.

### `middleware.ts` is `proxy.ts`

Next 16 **deprecated** the `middleware` file convention and renamed it to
`proxy`: "The `middleware` file convention is deprecated and has been renamed to
`proxy`." (`01-app/03-api-reference/03-file-conventions/proxy.md:11`)

- The file is `apps/web/proxy.ts`, at the project root, at the same level as
  `app/`.
- It must export a single function named `proxy` (or a default export) plus an
  optional `config` object carrying the `matcher`.
- `next build` prints `ƒ Proxy (Middleware)`. **That parenthetical is Next's own
  label, not a file.** There is no `middleware.ts` in this repo and you should
  not create one.
- Migration codename, for reference only: `npx @next/codemod@canary middleware-to-proxy .`
  (`proxy.md:751-762`)

`proxy.ts` here is a **demo stub, not authentication**, and says so in its own
first line (`proxy.ts:5-16`): the cookie value is a published constant, anyone
can mint it with one line of devtools, and the backend behind it is open by
default. Its only real behaviour is the redirect, and
`tests/e2e/proxy.spec.ts` exists because with the file deleted every guarded
route would render for an anonymous visitor and no other test would notice.

### `params` and `searchParams` are Promises

Next 16 types them as promises: `params: Promise<{ slug: string }>` and
`searchParams: Promise<{ [key: string]: string | string[] | undefined }>`
(`01-app/03-api-reference/03-file-conventions/page.md:13-14`).

The three dynamic routes here are `"use client"` components, so they use
`use(params)` rather than `await params`:

- `app/(dashboard)/voyage/[id]/page.tsx:139-143`
- `app/(dashboard)/voyage/[id]/reconcile/page.tsx:263-267`
- `app/(dashboard)/voyage/[id]/letter/page.tsx:20-24`

A server component would `const { slug } = await params`.

### `error.tsx` takes `unstable_retry`

The segment error boundary receives `unstable_retry: () => void`, not the
pre-16 `reset` (`01-app/01-getting-started/10-error-handling.md:218-234`).
`app/(dashboard)/error.tsx:13-19` takes it.

### Route groups do not nest URL paths

`(auth)` and `(dashboard)` are organisational only. `app/(dashboard)/voyages/page.tsx`
serves `/voyages`.

## The twelve routes

| Route | File | Rendering |
|---|---|---|
| `/` | `app/page.tsx` → `app/landing/` | **server component** — public landing page. It renders one of **eleven** designs selected by `?v=<key>` (bare URL = `statement`) from a fixed set of keys, and resolves the key **on the server** from `searchParams`, so it must not use `useSearchParams()` — that would oblige the route to sit inside a Suspense boundary. An unrecognised key renders the default. `app/landing/VariantSwitcher.tsx` is the only `"use client"` file in the directory. The default variant also carries a "How Keel Works" modal whose `DialogTrigger` reaches the client through the RSC boundary, so `app/page.tsx` itself has no `"use client"` |
| `/login` | `app/(auth)/login/page.tsx` | `"use client"` — sets the demo cookie, no credential check |
| `/dashboard` | `app/(dashboard)/dashboard/page.tsx` | `"use client"` — stats, recent voyages, upload dialog |
| `/voyages` | `app/(dashboard)/voyages/page.tsx` | `"use client"` — list |
| `/reconciliations` | `app/(dashboard)/reconciliations/page.tsx` | `"use client"` — paginated list |
| `/reports` | `app/(dashboard)/reports/page.tsx` | `"use client"` — CSV export, **CSV only** |
| `/voyage/[id]` | `app/(dashboard)/voyage/[id]/page.tsx` | `"use client"` — terms, both calculations, audit trace |
| `/voyage/[id]/reconcile` | `app/(dashboard)/voyage/[id]/reconcile/page.tsx` | `"use client"` — per-day verdicts, math breakdown |
| `/voyage/[id]/letter` | `app/(dashboard)/voyage/[id]/letter/page.tsx` | `"use client"` — letter preview, sanitised before injection |
| `/modules/speed` | `app/(dashboard)/modules/speed/page.tsx` | **server component** — charterer-side speed/consumption claim. A `ModuleLedger` **scaffold**: columns and intended inputs are laid out, every figure is `—`, and the action is a `DisabledActionButton`. No computation is wired |
| `/modules/bunkers` | `app/(dashboard)/modules/bunkers/page.tsx` | as above — bunkers claim, same scaffold state |
| `/modules/disbursements` | `app/(dashboard)/modules/disbursements/page.tsx` | as above — two `EmptyColumn`s (tariff line, invoice line) |

The three `/modules/*` screens are **scaffolds, not features**: `ModuleLedger`
(`components/ModuleLedger.tsx`) renders the intended columns while every value is
an em dash, and `lib/settlements.ts` holds a `Settlement` type that nothing consumes.
Do not describe them as working. They are reached from the sidebar's second
group, "Modules" — see `NAV_GROUPS` in `components/AppSidebar.tsx`, where adding a
destination is one array entry. `isActiveRoute` matches `href` exactly or as a
prefix on a `/` boundary, so `/voyages` does not light up on `/voyage/[id]`;
`smoke.spec.ts` asserts both halves of that.

`app/layout.tsx` and `app/(dashboard)/layout.tsx` are server components.
`/register` and `/page1` were deleted. The build emits 12 routes plus
`/_not-found`.

The audit-trace tables and the day-verdict cards are **inline in the page
routes**, not separate components. Do not go looking for `AuditTrace.tsx`.

## `lib/api.ts` — the wire contract

- `API_BASE_URL` defaults to `http://127.0.0.1:8000` (`api.ts:20-21`), also set
  in `next.config.ts`.
- `USE_MOCK` is `false` (`:24`). The mock branch is unreachable while it is
  false; `MOCK_RECONCILIATION` is a verbatim capture of
  `GET /voyages/voyage_001`, and `MOCK_VOYAGES` / `MOCK_RECONCILIATIONS`
  (`voyage_002`…`voyage_007`) are fallback rows that exist only to draw the list
  pages when the API is down (`:422-427`).
- `pollVoyageStatus` polls at 250 ms. Treat `onMessage` as "the latest thing the
  server said", **not** a progress stream: a warm run lands in ~30 ms and the
  backend overwrites its status row on every graph node, so the seven node
  messages are gone before a slower sampler sees a second one (`:624-631`).
- `types.ts` is the contract `apps/api/keel_api/adapters.py` targets. Changing a
  field name breaks one side or the other.
- `sanitize-html.ts` is an allowlist sanitiser that runs in the browser on the
  letter body before injection. The server template escapes every interpolation,
  so the letter is inert as served; the browser is the layer that actually parses
  the markup. Two facts to know before editing it: a `<style>` element survives
  **only** from the parsed `<head>` (`sanitizeLetterHtml` hoists it so the letter
  keeps its typography) and one in the body is dropped with its content by
  `DROP_WITH_CONTENT`, which is consulted before the element is looked at any
  further — there used to be an `if (tag === "style")` branch below that check
  which could never run; and `serializeStyleSheet`'s reject list is a token
  blacklist, so a head-level sheet using `image-set()` passes and can issue an
  off-document GET (recorded in the root README's security posture and in
  `docs/continuation-plan.md` §16).

### The CORS trap

The API's allowlist is a list of **origins**, defaulting to
`http://localhost:3000`. A browser on `127.0.0.1:3000` is a *different origin*
and the API answers its fetch with no `Access-Control-Allow-Origin`, so every
data-backed assertion sees an empty page. `playwright.config.ts:12-16` handles
this by binding and probing the server by address (`127.0.0.1`) while navigating
by name (`localhost`). Set `KEEL_CORS_ORIGINS` on the API if you change the
port.

## Commands

```bash
cd apps/web
pnpm install --frozen-lockfile   # the canonical lockfile lives here
pnpm exec tsc --noEmit
pnpm run lint
pnpm run build
pnpm exec playwright test        # needs an API on 127.0.0.1:8000
```

`pnpm run lint` exits 0 on warnings, which is why CI runs it as
`pnpm run lint --max-warnings 4`. Four warnings is the budget: three
`@next/next/no-img-element` (`app/(auth)/login/page.tsx:149`,
`app/(dashboard)/voyage/[id]/letter/page.tsx:195`, `components/AppSidebar.tsx:73`) and one
`@typescript-eslint/no-unused-vars` (`public/theme-init.js:9`).

`next build` uses Turbopack and starts with "Creating an optimized production
build". `tsc` and `eslint` both pass on code `next build` rejects — a
`useSearchParams()` outside a Suspense boundary is the classic example. Run the
build before you call a change done.

## Tests: 38 e2e, one project

`apps/web/tests/e2e/`, seven spec files, `chromium` only,
`playwright.config.ts` starts `next dev` itself:

| Spec | Covers |
|---|---|
| `smoke.spec.ts` | landing → login → dashboard; dashboard demo run shows the audited total; sidebar navigation; which list draws the analytics panels |
| `proxy.spec.ts` | every guarded deep link redirects to `/login` with `next=`; query string survives; `/` and `/login` stay public; a stale cookie is cleared; the demo cookie grants the workspace |
| `demo-workflow.spec.ts` | the whole hackathon demo path at 1280×800 |
| `fabricated-data.spec.ts` | **negatives**: an empty list renders an empty state, a failed request surfaces the error, a 500 HTML body is not rendered as data, missing fields render dashes, a hung request stays loading, a detail with no `reconciliation` says so, and injected markup in the letter does not execute |
| `null-data.spec.ts` | null weather readings render an explicit not-recorded state; a citation with no document keeps the honest no-preview state; no page number never prints `p.null`; the PDF viewer fetches its worker from this origin and names the real reason the preview is empty |
| `modals.spec.ts` | the letter delivery dialog, the landing "How Keel Works" explainer, and the clause-citation dialog each trap focus and close on Escape |
| `variants.spec.ts` | all eleven landing designs render the canonical figures, the bounded-build disclosure, `#ledger`/`#method`/`#build` and exactly one `h1`; no variant overflows at 375px or logs a console error; an unknown or hostile `?v=` falls back to the default; the switcher marks one design active, is keyboard-operable, and the skip link moves focus into `<main>` |

Every spec reads the seeded demo voyage, so **a backend on `127.0.0.1:8000` is
mandatory** and `voyage_001` must actually be seeded.

---

## Traps

1. **No `middleware.ts`.** The convention is `proxy.ts`. Writing a
   `middleware.ts` adds a file Next 16 will not use.
2. **Do not untrack a build-critical path.** `apps/web/lib/` used to be entirely
   untracked while **20** tracked `.ts`/`.tsx` files import from it, which is a
   clean checkout that cannot typecheck or build. All four files —
   `api.ts`, `sanitize-html.ts`, `types.ts`, `utils.ts` — **are** tracked now
   (`git ls-files apps/web/lib/` lists exactly those four), and so is every other
   path the build needs. The trap is the next untracked import, not the current
   state: CI's tracked-path gate is the only thing that can see it, because
   `git diff --exit-code` and `git add -A --dry-run` report nothing for a file
   that was simply never committed. The list is `ci.yml:38-86` and its length is
   asserted at `:90` as `expected=47`. Six load-bearing tracked inputs were
   missing from it until the last pass: `app/layout.tsx`, `app/globals.css`,
   `components/AppSidebar.tsx`, `tests/e2e/smoke.spec.ts`,
   `tests/e2e/demo-workflow.spec.ts` and `playwright.config.ts`.
   `git rm --cached apps/web/app/layout.tsx` still left the gate printing
   `All 41 build-critical paths are tracked` and exiting 0, and `next build` then
   failed. The step now also compares the tracked set of `app/landing/*.tsx`
   against its list (`ci.yml:113-129`), so a twelfth variant cannot land without
   a gate entry. A 21st hit appears if you drop the extension filter:
   `apps/web/components.json` carries `@/lib/utils` and `@/lib` in its alias
   config, and it is neither `.ts` nor `.tsx`.
3. **pnpm, not npm.** `apps/web/package-lock.json` was deleted; the root
   `pnpm-lock.yaml` has an empty importer. Install in `apps/web/`.
4. **`next build` is a gate.** `tsc` and `eslint` passing is not evidence.
5. **There are no source PDFs in this checkout.** `PdfViewer` therefore always
   renders its unavailable state. Do not write or claim a working PDF highlight.
   The `highlightBbox` prop and the `p<page>L<line>` anchors behind it are real;
   the bytes they would point at are not in this repo.
6. **No authentication.** `/login` performs no credential check and
   `proxy.ts` is a UI convenience. Do not describe either as a security control.
7. **The letter page cannot send anything and cannot export a PDF.** The
   page-level *Send to Other Party* button (`:126`) opens a Delivery modal
   (`DialogTitle` `:348`); "Not sent — no delivery service is connected" (`:383`)
   and "Print / Save as PDF" (`:397`, inside `DialogFooter` `:387`) are **both
   inside that modal**, not page-level buttons. The page already calls
   `?format=pdf` from *Download PDF* (`:135`) and handles the 400 honestly
   (`:59-83`).
8. **The reports page exports CSV only** (`app/(dashboard)/reports/page.tsx:466-473`). There is
   no XLSX and no PDF export path.
9. **There is no settings page and no dead link to one.** `NAV_GROUPS`
   (`components/AppSidebar.tsx`) has seven entries in two groups — "Navigation":
   Dashboard, Voyages, Reconciliations, Reports; "Modules": Speed & consumption,
   Bunkers, Disbursements. A `Settings` row with `href: "#"` was removed. Adding a
   destination is one array entry: `active: false` renders a non-navigable "Coming
   soon" tooltip, and `isActiveRoute` derives the highlight from `href`.
10. **Never introduce a fallback that invents a figure.** `fabricated-data.spec.ts`
    exists specifically to fail if one appears. A `null` prints as an em dash
    (`formatUsd`, `api.ts:777-785`), never as `$0`.
11. **`measurement_basis` is a separate field from `bimco_clause.clause_id`.**
    `clause_id` carries the rule id the product applied
    (`CP_WEATHER.MAJORITY_OF_HOURS`), not a BIMCO definition number. Tests
    assert "bimco" never appears in it (`tests/test_adapters.py:211-212`).
12. **`Clause N` labels are positional, not the charterparty's numbering.**
    `adapters._parse_clause_id` falls back to `Clause {index + 1}` and the
    fixture's clause bodies do not carry a number, so the UI's `Clause 3` /
    `Clause 4` / `Clause 5` are the charterparty's 3.1 / 3.2 / 4.1. The page and
    the letter still name the right document and page. Do not quote a `Clause N`
    label as though the document contained it.
