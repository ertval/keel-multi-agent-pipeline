# Person B — Frontend / Enterprise SaaS UX

Owner of: Next.js app, enterprise SaaS shell (sidebar + topbar), login page, dashboard, upload flow, extraction display, audit-trace UI, reconciliation page with per-day verdict cards, demo polish.

The single deliverable: by hour 9, the reconciliation page renders three day-cards (June 14, 15, 16) with verdict badges and a `$112,000` reconciled total in 64pt type — **all wrapped in a professional enterprise SaaS shell** with persistent sidebar navigation, login flow, and a dashboard overview.

The app must feel like a premium enterprise platform — not a drag-and-drop hackathon project. shadcn/ui components are mandatory for all UI elements.

Tickets are listed in execution order. Don't skip ahead; the dependencies matter.

---

## B-01 — shadcn/ui setup + design system

**Estimate**: 60 min · **Hour**: 1 → 2
**Blocked by**: [J-01](README.md#j-01--pre-flight-schemas--fixture-hour-0--1)
**Blocks**: B-02, B-03

- `pnpm create next-app@latest apps/web --typescript --tailwind --app --no-src-dir`.
- Initialize shadcn/ui: `npx shadcn@latest init`.
- Install shadcn components: `Button`, `Card`, `Badge`, `Dialog`, `Table`, `Input`, `Avatar`, `DropdownMenu`, `Separator`, `Sheet`, `Tooltip`, `Sidebar`, `Label`.
- Install: `react-pdf`, `react-dropzone`, `lucide-react`.
- Establish the enterprise design system in `globals.css`:
  - Replace default fonts with a distinctive pairing (display + body).
  - Define dark enterprise theme tokens: deep navy backgrounds, jewel-tone accents.
  - Define app shell layout tokens (sidebar width, topbar height, content padding).
- Pull the Pydantic schemas from J-01 into matching TypeScript types in `apps/web/lib/types.ts`.
- Define an API base URL in `apps/web/lib/api.ts` pointing at `http://localhost:8000`.

**Done when**: `pnpm dev` renders a blank shadcn-styled page at `localhost:3000` with the enterprise theme applied.

---

## B-02 — Login page

**Estimate**: 45 min · **Hour**: 2 → 2.75
**Blocked by**: B-01
**Blocks**: B-03

- `apps/web/app/(auth)/login/page.tsx`: full-screen login page with enterprise aesthetics.
  - Centered login card with shadcn `Input` + `Button` + `Label` components.
  - Brand mark: Keel anchor icon + "Maritime Intelligence Platform" tagline.
  - Subtle background gradient or pattern for visual depth.
  - Mock auth: on submit, redirect to `/dashboard`. No real backend auth.
  - "Demo credentials" hint: `demo@keel.io` / any password.
- Root `app/page.tsx` redirects to `/login`.

**Done when**: visiting `localhost:3000` shows an enterprise login page; submitting redirects to `/dashboard`.

> **Security note**: This is a visual mock only. No credentials are stored or transmitted. TODO(security): Replace with real OAuth 2.0 / JWT auth before production.

---

## B-03 — App shell (sidebar + topbar)

**Estimate**: 90 min · **Hour**: 2.75 → 4.25
**Blocked by**: B-01, B-02
**Blocks**: B-04, B-05

- `apps/web/app/(dashboard)/layout.tsx`: persistent app shell wrapping all authenticated routes.
  - **Left sidebar** (collapsible):
    - Top: Keel logo + brand name
    - Nav items with icons: Dashboard, Voyages, Reconciliations, Reports, Settings
    - Only Dashboard and Voyages are functional; others show "Coming Soon" tooltips.
    - Bottom: user avatar + name + role + logout dropdown.
    - Collapses to icon-only on narrow viewports.
  - **Top bar** (sticky):
    - Breadcrumb trail (auto-generated from route).
    - Right side: notification bell icon, user avatar dropdown.
  - Uses shadcn `Sidebar`, `Avatar`, `DropdownMenu`, `Tooltip`, `Separator`, `Sheet` components.
  - Mobile: sidebar collapses entirely, opens as `Sheet` on hamburger tap.

**Done when**: navigating to `/dashboard` shows the full app shell with sidebar and topbar; nav items highlight based on current route.

---

## B-04 — Dashboard page

**Estimate**: 90 min · **Hour**: 4.25 → 5.75
**Blocked by**: B-03
**Blocks**: B-05, J-02

- `apps/web/app/(dashboard)/dashboard/page.tsx`: enterprise dashboard overview.
  - **Stats row** (4 cards): Total Voyages, Active Disputes, Reconciled Value, Avg Resolution Time.
    - Each card has an icon, value, and trend indicator.
    - Use shadcn `Card` component.
  - **Recent voyages table**: columns = Voyage ID, Vessel, Status (badge), Owner Claim, Charterer Claim, Reconciled, Actions.
    - Voyage `voyage_001` links to its detail page.
    - 2–3 additional mock voyages with various statuses (Pending, In Review, Reconciled).
    - Use shadcn `Table` + `Badge` components.
  - **Quick action**: "New Voyage Analysis" button → opens upload dialog (see B-05).
  - Staggered card entry animations for polish.

**Done when**: dashboard renders stats cards + voyages table; clicking `voyage_001` navigates to `/voyage/voyage_001`.

---

## B-05 — Upload flow (modal in dashboard)

**Estimate**: 60 min · **Hour**: 5.75 → 6.75
**Blocked by**: B-04
**Blocks**: B-06

- Upload flow moved from standalone page into a `Dialog` modal triggered from dashboard.
- `apps/web/components/UploadDialog.tsx`: drag-and-drop zone accepting 6 fixture files.
  - Uses `react-dropzone` for drop zone.
  - File checklist with shadcn `Card` items and check icons.
  - "Analyse Voyage" button posts to `/api/voyages`.
  - Loading spinner during upload.
  - On success, close dialog and navigate to `/voyage/{id}`.
- "Demo Mode" button: bypasses upload, routes directly to `/voyage/voyage_001`.

**Done when**: clicking "New Voyage Analysis" on dashboard opens upload dialog; completing upload navigates to voyage detail.

---

## ⛳ Checkpoint: [J-02 — API contract sync](README.md#j-02--api-contract-checkpoint-hour-5--55) (hour 5)

Switch `apps/web/lib/api.ts` from mock to real fetch against the FastAPI backend. Resolve any schema drift with Person A — **Pydantic wins**.

---

## B-06 — Voyage detail page (redesigned)

**Estimate**: 120 min · **Hour**: 6.75 → 8.75
**Blocked by**: B-05, J-02
**Blocks**: B-07

- `apps/web/app/(dashboard)/voyage/[id]/page.tsx`: voyage detail within the app shell.
  - Breadcrumb: Dashboard > Voyages > {vessel_name}.
  - Left column: charterparty terms as a shadcn `Card`. Each value has a citation icon → opens shadcn `Dialog`.
  - Center column: side-by-side **Owner** and **Charterer** calculation cards with totals in large type + collapsible audit-trace tables (shadcn `Table`).
  - "View Reconciliation" button → navigates to reconcile sub-page.
- PDF viewer integration when clicking audit-trace rows (scrolls to cited page).

**Done when**: page renders both calculations from the API within the app shell; clicking a citation opens a dialog.

---

## B-07 — PDF viewer

**Estimate**: 60 min · **Hour**: 8.75 → 9.75
**Blocked by**: B-06
**Blocks**: B-08

- `apps/web/components/PdfViewer.tsx`: thin wrapper over `react-pdf`.
  - Takes a PDF URL and optional `page` prop.
  - Renders with prev/next controls.
  - Clicking an audit-trace row scrolls the PDF viewer to the cited page.
  - **No bbox overlay** — that's stretch goal B-11.

**Done when**: clicking any audit-trace row navigates the PDF viewer to the correct page.

---

## B-08 — Reconciliation page (the demo centerpiece)

**Estimate**: 180 min · **Hour**: 6.75 → 9.75
**Blocked by**: B-06, A-08 (real reconciliation API)
**Blocks**: B-09, J-03

- `apps/web/app/(dashboard)/voyage/[id]/reconcile/page.tsx`: reconciliation within app shell.
  - Top: voyage summary, owner total `$187,000` and charterer total `$62,000` side-by-side in shadcn `Card` components.
  - Middle: three **day-verdict cards** (June 14, 15, 16) using shadcn `Card` + `Badge`:
    - Date header
    - Owner position quote (italic)
    - Charterer position quote (italic)
    - Weather record card: wind force, precipitation, hours
    - BIMCO 2013 clause citation (expandable)
    - Verdict badge: green "Owner wins" / red "Charterer wins" + dollars credited
    - Justification line
  - This is the screenshot judges will remember — polished with enterprise feel.

**Done when**: `/voyage/voyage_001/reconcile` renders three day-cards with correct verdicts from the real API.

---

## B-09 — Reconciled total display

**Estimate**: 60 min · **Hour**: 9.75 → 10.75
**Blocked by**: B-08, J-03
**Blocks**: J-04

- Below the three day-cards, a full-width band:
  - Left: math breakdown — `$62,000 (charterer baseline) + $50,000 (June 14+15 wins) = $112,000`.
  - Right: **`$112,000`** in 64pt bold type with gradient glow. This is the demo's money shot.
- "Generate Claim Letter" button. If A-09 is done, it opens the letter; otherwise tooltip.

**Done when**: the reconciliation page ends with a prominent `$112,000` and the math is auditable at a glance.

---

## ⛳ Checkpoint: [J-03 — Canonical assertion green](README.md#j-03--canonical-assertion-green-hour-8) (hour 8)

At hour 8, the canonical scenario must render `$112,000` in the browser end-to-end. If it doesn't, **drop all stretch work** and join Person A on fix-mode.

---

## B-10 — Claim letter preview (STRETCH)

**Estimate**: 60 min · **Hour**: 10.75 → 11.75
**Blocked by**: A-09, J-03
**Blocks**: nothing critical

- `apps/web/app/(dashboard)/voyage/[id]/letter/page.tsx`: styled, printable letter within app shell.
- "Download" button → opens `?format=pdf` if available, otherwise `window.print()`.

**Done when**: clicking "Generate Claim Letter" opens a styled, printable letter page.

---

## B-11 — Bbox overlay on PDF (STRETCH)

**Estimate**: 90+ min · **Hour**: 10.75 → 12
**Blocked by**: J-03
**Blocks**: nothing — pure polish

- Draw translucent highlight rectangles over PDF bboxes from `ClauseCitation` / `SourceCitation`.
- **Hard rule**: if not working in 90 minutes, revert.

**Done when**: clicking an audit-trace row highlights both the row and the matching PDF region.

---

## B-12 — Demo polish

**Estimate**: 60 min · **Hour**: 11 → 12
**Blocked by**: B-09

- Pre-load demo user session so login is instant in demo mode.
- "Demo mode" button on login page → skips to dashboard with pre-loaded data.
- Tighten loading states — skeleton loaders for all async content (shadcn patterns).
- Browser zoom check: page should look right at 125% zoom.
- Run [J-04 demo rehearsal](README.md#j-04--demo-rehearsal-hour-11--12) twice with Person A.

**Done when**: two clean run-throughs under 100 seconds each.
