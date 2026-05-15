import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { rateLimitMiddleware } from "./lib/Redis/rateLimiter";

const ROUTES = {
  PUBLIC: {
    LOGIN: ["/login"],
    REGISTER: ["/register"],
  },
  PROTECTED: {
    DASHBOARD: ["/dashboard"],
    ADMIN: ["/admin"],
  },
  API: {
    DASHBOARD: ["/api/dashboard"],
    ADMIN: ["/api/admin"],
    EXCLUDED_FROM_RATE_LIMIT: ["/api/auth/session"],
  },
} as const;

function matchesRoute(path: string, routes: readonly string[]): boolean {
  return routes.some((route) => path === route || path.startsWith(route + "/"));
}

function shouldRateLimit(path: string): boolean {
  return (
    path.startsWith("/api/") &&
    !ROUTES.API.EXCLUDED_FROM_RATE_LIMIT.some((route) => path.startsWith(route))
  );
}

export async function proxy(req: NextRequest) {
  const url = req.nextUrl.clone();
  const path = url.pathname;
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
  });

  const isLoggedIn = !!token;
  const isAdmin = token?.is_admin === 1 || token?.is_admin === true;

  /* ---------------- RATE LIMITING ---------------- */
  if (shouldRateLimit(path)) {
    const rateLimitResponse = await rateLimitMiddleware(req);
    if (rateLimitResponse) {
      return new NextResponse(rateLimitResponse.body, {
        status: rateLimitResponse.status,
        headers: rateLimitResponse.headers,
      });
    }
  }

  /* ---------------- LOGIN/REGISTER PAGE ---------------- */
  if (
    matchesRoute(path, ROUTES.PUBLIC.LOGIN) ||
    matchesRoute(path, ROUTES.PUBLIC.REGISTER)
  ) {
    if (isLoggedIn) {
      const redirectPath = isAdmin ? "/admin" : "/dashboard";
      url.pathname = redirectPath;
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  /* ---------------- DASHBOARD ---------------- */
  if (
    matchesRoute(path, ROUTES.PROTECTED.DASHBOARD) ||
    matchesRoute(path, ROUTES.API.DASHBOARD)
  ) {
    if (!isLoggedIn) {
      return handleUnauthorized(req, url, path);
    }
    return NextResponse.next();
  }

  /* ---------------- ADMIN ---------------- */
  if (
    matchesRoute(path, ROUTES.PROTECTED.ADMIN) ||
    matchesRoute(path, ROUTES.API.ADMIN)
  ) {
    if (!isLoggedIn) {
      return handleUnauthorized(req, url, path);
    }

    if (!isAdmin) {
      return handleForbidden(path, url);
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

function handleUnauthorized(
  req: NextRequest,
  url: URL,
  path: string
): NextResponse {
  if (path.startsWith("/api/")) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  url.pathname = "/login";
  url.searchParams.set("callbackUrl", req.url);
  return NextResponse.redirect(url);
}

function handleForbidden(path: string, url: URL): NextResponse {
  if (path.startsWith("/api/")) {
    return NextResponse.json(
      { error: "Admin access required" },
      { status: 403 }
    );
  }

  url.pathname = "/dashboard";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/login",
    "/register",
    "/dashboard/:path*",
    "/admin/:path*",
    "/api/dashboard/:path*",
    "/api/admin/:path*",
  ],
};
