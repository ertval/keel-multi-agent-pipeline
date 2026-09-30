import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * DEMO STUB — THIS IS NOT AUTHENTICATION.
 *
 * The product has no user accounts: the PRD rule is "one analyst uploads the
 * other side's documents. No counterparty account." So there is no identity to
 * verify, and `DEMO_TOKEN` is a published constant, not a secret. Anyone can
 * mint the cookie with one line of devtools. The only thing this file
 * prevents is a visitor wandering into an analyst workspace by typing a URL.
 *
 * It also does not protect the data: the FastAPI backend is unauthenticated
 * by default, serves every voyage, and allows CORS from its configured origin
 * list (`KEEL_CORS_ORIGINS`, `http://localhost:3000` out of the box) rather
 * than a wildcard, so the API is the real trust boundary and it is open unless
 * `KEEL_API_TOKEN` is set. Real deployment needs server-side session
 * verification here *and* per-voyage authorisation on the API.
 *
 * Named `proxy.ts` rather than `middleware.ts`: middleware is deprecated in
 * Next.js 16 and renamed to this convention
 * (node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md).
 */
const DEMO_TOKEN = "keel-demo-session";
const COOKIE = "keel_demo_session";

const PROTECTED = [
  "/dashboard",
  "/voyages",
  "/reports",
  "/reconciliations",
  "/voyage",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!PROTECTED.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return NextResponse.next();
  }

  if (request.cookies.get(COOKIE)?.value === DEMO_TOKEN) {
    return NextResponse.next();
  }

  const login = new URL("/login", request.url);
  login.searchParams.set("next", pathname + request.nextUrl.search);
  const response = NextResponse.redirect(login);
  if (request.cookies.has(COOKIE)) {
    response.cookies.delete(COOKIE);
  }
  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/voyages/:path*",
    "/reports/:path*",
    "/reconciliations/:path*",
    "/voyage/:path*",
  ],
};
