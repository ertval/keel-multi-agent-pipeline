# apps/web

The Keel analyst workspace: Next.js 16 App Router, React 19, Tailwind 4,
shadcn/ui, Playwright. It renders the dashboard, uploads voyage documents, shows
the side-by-side owner/charterer calculation with its audit trace, presents the
per-day weather verdicts and the reconciled total, and previews the settlement
letter.

Backend context, the canonical numbers, and the security posture live in the
root [README](../README.md) and [AGENTS.md](../AGENTS.md). Next 16 specifics are
in [AGENTS.md](AGENTS.md).

---

## Prerequisites

| Tool | Version |
|---|---|
| Node.js | 22.23.3 in CI (24.x works locally) |
| pnpm | 11.4.0 in CI |

**pnpm, not npm.** `apps/web/package-lock.json` was deleted;
`apps/web/pnpm-lock.yaml` is canonical. There is no `packageManager` field in
`package.json`, so CI pins pnpm itself (`.github/workflows/ci.yml:334-336`).

The install belongs in `apps/web/`. The root `pnpm-lock.yaml` has an empty
importer (`.: {}`) and there is no root `pnpm-workspace.yaml`, so a root
`pnpm install` resolves nothing for the app.

`apps/web/pnpm-workspace.yaml` is what governs that install, and it is
load-bearing — its `allowBuilds` map runs the postinstall hooks for `sharp` (Next
image optimisation) and `unrs-resolver` (without which `eslint` throws at require
time), explicitly denies `msw` and `core-js`, and sits alongside
`minimumReleaseAge: 0`. Nothing else in the tree names it. Delete it and
`pnpm run lint` stops working.

## Setup and run

```bash
cd apps/web
pnpm install
pnpm dev
```

The app serves on <http://localhost:3000>.

> **Navigate by name, not by address.** The API's CORS allowlist is a list of
> *origins* and defaults to `http://localhost:3000`. A browser on
> `127.0.0.1:3000` is a different origin, the API returns no
> `Access-Control-Allow-Origin`, and every data-backed page renders empty. Use
> `localhost`.

From the repo root, `pnpm dev` starts the frontend and the API together.

## Configuration

| Variable | Default | Notes |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://127.0.0.1:8000` | Set in `next.config.ts:12-15` and read in `lib/api.ts:20-21`. The backend binds `127.0.0.1`; `localhost` resolves to `::1` on some hosts. |
| `KEEL_CORS_ORIGINS` (API side) | `http://localhost:3000` | Comma-separated. Add the frontend origin here if you move the port. |

### `USE_MOCK`

`lib/api.ts:24` exports `USE_MOCK = false`, so every function in `lib/api.ts`
talks to the real API. The mock branches are unreachable while it is false.

What the mock data actually is:

- `MOCK_RECONCILIATION` — a verbatim capture of `GET /voyages/voyage_001` as the
  corrected API serves it, including every `null` the engine emits
  (`api.ts:39-405`). Re-record it if the pipeline output changes; do not hand-edit
  the figures.
- `MOCK_VOYAGES` — one row, `voyage_001`.
- `MOCK_RECONCILIATIONS` — `voyage_001` plus `voyage_002`…`voyage_007`. **Those
  six are sample rows that exist only to give the list pages something to draw
  when the API is unreachable. No voyage with those ids has been analysed**
  (`api.ts:422-427`).

## The nine routes

| Route | Purpose |
|---|---|
| `/` | Public landing page with the product summary, the demo explainer modal, and an explicit "no trial, no account" statement |
| `/login` | Sets the demo session cookie. **No credential check** — the page says "nothing is checked, no account is created, and this session grants no real access" |
| `/dashboard` | Stats, recent voyages, and the upload dialog |
| `/voyages` | Voyage list |
| `/reconciliations` | Paginated reconciliation list |
| `/reports` | Report builder. Exports **CSV only** |
| `/voyage/[id]` | Extracted terms, both parties' calculations, the audit trace |
| `/voyage/[id]/reconcile` | Per-day verdicts, weather readings, the math breakdown |
| `/voyage/[id]/letter` | Settlement-letter preview |

`/register` and `/page1` were deleted — the first as a fabrication, the second as
vestigial scaffolding. There is no sign-up, no account, and no sales process in
this build. There is also **no settings page**, and the sidebar carries no dead
link to one: `NAV_ITEMS` has four entries (`components/AppSidebar.tsx:35-40`).
A `Settings` row with `href: "#"` was removed rather than shipped.

`app/(auth)/` and `app/(dashboard)/` are **route groups**: they organise files
and add no URL segment.

### Route guard

`proxy.ts` is the guard. In Next 16 the `middleware` file convention is
deprecated and renamed to `proxy`, so there is no `middleware.ts` — and
`next build` printing `ƒ Proxy (Middleware)` is Next's own label, not a filename.

It redirects `/dashboard`, `/voyages`, `/reports`, `/reconciliations`, and
`/voyage/**` to `/login?next=…` when the demo cookie is absent or stale, and
leaves `/` and `/login` public.

**It is not authentication.** Its own first line says so (`proxy.ts:5-16`): the
cookie value `keel-demo-session` is a published constant that anyone can mint in
devtools, the product has no user accounts by design, and the FastAPI backend
behind it is open by default. Its only real function is stopping someone from
wandering into the workspace by typing a URL.

## What the UI deliberately does not do

- **No PDF preview.** `components/PdfViewer.tsx` renders PDF with bbox highlight
  overlays, and the citations it consumes carry real page numbers and anchors.
  But this checkout ships no source PDFs, so the viewer always falls to its
  unavailable state. `tests/e2e/null-data.spec.ts` asserts it names the real
  reason.
- **No letter delivery.** The page-level *Send to Other Party* button
  (`app/(dashboard)/voyage/[id]/letter/page.tsx:126`) opens a Delivery modal whose
  dialog reads "Not sent — no delivery service is connected" (`:383`). That
  string is **inside the modal** — `DialogTitle` is at `:348` — not on the page.
- **No PDF export.** *Download PDF* (`:135`) calls `?format=pdf` and handles the
  400 honestly (`:59-83`): the API serves HTML only and will not label HTML as a
  PDF. "Print / Save as PDF" (`:397`) is the modal's primary action, in
  `DialogFooter` (`:387`), not a page-level button — as is the plain *Print*
  button at `:143`.
- **No XLSX export.** The reports page writes a CSV file (`:466-473`).
- **No invented figures.** Where the API sends `null`, the UI says so. A `null`
  total prints as an em dash, never as `$0` (`formatUsd`, `lib/api.ts:777-785`).
  `tests/e2e/fabricated-data.spec.ts` and `null-data.spec.ts` exist to fail if a
  fallback ever substitutes a sample for a real value.

## Tests

```bash
cd apps/web
pnpm exec tsc --noEmit
pnpm run lint
pnpm run build
pnpm exec playwright test
```

Verified results on this tree:

| Command | Result |
|---|---|
| `pnpm exec tsc --noEmit` | exit 0, no output |
| `pnpm run lint` | `✖ 4 problems (0 errors, 4 warnings)` |
| `pnpm run build` | exit 0, 9 routes emitted |
| `pnpm exec playwright test` | `31 passed` |

`pnpm run lint` exits 0 on warnings, so CI runs it as
`pnpm run lint --max-warnings 4`. The four warnings are three
`@next/next/no-img-element` (`app/(auth)/login/page.tsx:149`,
`app/(dashboard)/voyage/[id]/letter/page.tsx:195`, `components/AppSidebar.tsx:73`) and one
`@typescript-eslint/no-unused-vars` (`public/theme-init.js:9`).

`pnpm run build` is a gate, not a formality — `tsc` and `eslint` both pass on
code `next build` rejects.

### The e2e suite

**31 tests, 6 spec files, one `chromium` project.** `playwright.config.ts` starts
`next dev` itself on `127.0.0.1:3000` and reuses an existing server outside CI.

**A backend is mandatory.** Every spec reads the seeded demo voyage, so:

```bash
rm -f ../api/keel.db ../api/keel.db-wal ../api/keel.db-shm
cd ../api && uv run uvicorn keel_api.main:app --host 127.0.0.1 --port 8000 &
cd ../web && pnpm exec playwright test
```

Confirm the seed first — a stale SQLite WAL left by a previous API process makes
seeding fail silently and every spec then reports a missing element:

```bash
curl -s http://127.0.0.1:8000/voyages | grep -o '"voyage_id":"voyage_001"'
```

It should print **exactly one** line. More than one means the demo database is
polluted: `apps/api/tests/conftest.py` points `KEEL_DB` at a per-session
throwaway file whose name carries the pytest process id and deletes it on exit,
so the suite cannot write into `apps/api/keel.db` — but a run predating that file
left ~50 `voyage_*` rows there. `rm -f ../api/keel.db*` and restart the API.

| Spec | What it asserts |
|---|---|
| `smoke.spec.ts` | Landing → login → dashboard; a dashboard demo run shows the audited total; the sidebar voyages link navigates; the dashboard is the only list drawing the analytics panels |
| `proxy.spec.ts` | Each guarded deep link redirects to `/login` carrying `next=`; the query string survives; `/` and `/login` stay public; a stale demo cookie is cleared rather than honoured; the demo cookie grants the whole workspace |
| `demo-workflow.spec.ts` | The hackathon demo path end to end at 1280×800 |
| `fabricated-data.spec.ts` | **Negative assertions, all of them**: an empty reconciliation list renders an explicit empty state rather than sample voyages; a failed list request surfaces the error and never falls back to sample rows; a 500 HTML body is not rendered as data; a row missing every total renders dashes and does not crash; a request that never answers leaves the page loading rather than crashing; a detail response with no `reconciliation` key says so plainly; injected markup in the letter does not execute; the sanitised real letter keeps its content and its stylesheet |
| `null-data.spec.ts` | A null Beaufort force and precipitation render an explicit not-recorded state; a citation with no source document keeps the honest no-preview state; a citation with no page number never prints `p.null`; the PDF viewer fetches its worker from this origin and names the real reason the preview is empty |
| `modals.spec.ts` | The claim letter's delivery dialog, the landing page's demo explainer, and the clause-citation dialog are real modals: focus moves in, is contained, and Escape closes |

## Track your dependencies

`apps/web/lib/` is **entirely untracked** in the current working tree and **20**
tracked `.ts`/`.tsx` files import from it. A clean checkout cannot typecheck or
build. It is one of 25 untracked build-critical paths CI's tracked-path gate
checks:

```bash
git ls-files apps/web | grep -E '\.tsx?$' | xargs grep -l '@/lib' | wc -l   # 20
git add -- apps/web/lib/
```

A 21st hit appears if you drop the extension filter: `apps/web/components.json`
carries `@/lib/utils` and `@/lib` in its alias config, and it is neither `.ts`
nor `.tsx`.

The full 25-path list is in `.github/workflows/ci.yml:38-64`, with its length
asserted at `ci.yml:68`. Two suite-critical paths were missing from that list
until the last pass and are now in it: `apps/api/tests/conftest.py` (without it
the test suite writes into `apps/api/keel.db`) and
`apps/api/tests/test_parsing_sandbox.py` (23 tests, and the only coverage of the
parser address-space, wall-clock and character ceilings).

## Learn more

- [Next.js documentation](https://nextjs.org/docs)
- The bundled docs for this exact version, which take precedence over the site:
  `node_modules/next/dist/docs/`
