import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { MyJWT } from "./types/User/JWT.type";
import { rateLimitMiddleware } from "./lib/Redis/rateLimiter";

export async function proxy(req: NextRequest) {
  const url = req.nextUrl.clone();
  const path = url.pathname;

  // Get authentication token
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
  });

  const isLoggedIn = Boolean(token);
  const user = token as MyJWT;

  // Apply rate limiting to all API routes (excluding auth session)
  if (path.startsWith("/api/") && !path.startsWith("/api/auth/session")) {
    const rateLimitResponse = await rateLimitMiddleware(req);
    if (rateLimitResponse) {
      return new NextResponse(rateLimitResponse.body, {
        status: rateLimitResponse.status,
        headers: rateLimitResponse.headers,
      });
    }
  }

  // 1. /login route protection
  if (path === "/login" || path.startsWith("/login/")) {
    if (isLoggedIn) {
      // Already logged in, redirect to dashboard
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // 2. /dashboard routes protection
  if (path.startsWith("/dashboard") || path.startsWith("/api/dashboard")) {
    if (!isLoggedIn) {
      // Not logged in, redirect to login
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
    return NextResponse.next();
  }

  // 3. /admin routes protection
  if (path.startsWith("/admin") || path.startsWith("/api/admin")) {
    if (!isLoggedIn) {
      // Not logged in, redirect to login
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

    // Check if user is admin
    const isAdmin = user?.is_admin === true;
    if (!isAdmin) {
      // Not admin, deny access
      if (path.startsWith("/api/")) {
        return NextResponse.json(
          { error: "Admin access required" },
          { status: 403 }
        );
      }
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Page routes
    "/login",
    "/dashboard/:path*",
    "/admin/:path*",

    // API routes
    "/api/dashboard/:path*",
    "/api/admin/:path*",
  ],
};
