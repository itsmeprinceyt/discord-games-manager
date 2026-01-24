import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { rateLimitMiddleware } from "./lib/Redis/rateLimiter";

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
  if (path.startsWith("/api/") && !path.startsWith("/api/auth/session")) {
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
    path === "/login" ||
    path.startsWith("/login/") ||
    path === "/register" ||
    path.startsWith("/register/")
  ) {
    if (isLoggedIn) {
      const redirectPath = isAdmin ? "/admin" : "/dashboard";
      url.pathname = redirectPath;
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  /* ---------------- DASHBOARD ---------------- */
  if (path.startsWith("/dashboard") || path.startsWith("/api/dashboard")) {
    if (!isLoggedIn) {
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

  /* ---------------- ADMIN ---------------- */
  if (path.startsWith("/admin") || path.startsWith("/api/admin")) {
    if (!isLoggedIn) {
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

    if (!isAdmin) {
      if (path.startsWith("/api/")) {
        return NextResponse.json(
          { error: "Admin access required" },
          { status: 403 }
        );
      }

      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  }
  return NextResponse.next();
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
