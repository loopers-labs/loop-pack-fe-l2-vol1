import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/app/api/_data/auth-cookies";
import { normalizeLoginRedirectPath } from "@/_pages/login/model/redirect";

const protectedPathnames = ["/order", "/orders", "/wishlist"];

const isProtectedPathname = (pathname: string) =>
  protectedPathnames.some((protectedPathname) => pathname === protectedPathname);

const isPublicAssetPathname = (pathname: string) =>
  pathname.startsWith("/api/") || pathname.startsWith("/_next/");

const createCurrentPath = (request: NextRequest) =>
  `${request.nextUrl.pathname}${request.nextUrl.search}`;

export function proxy(request: NextRequest) {
  const hasSession = request.cookies.has(SESSION_COOKIE);
  const { pathname } = request.nextUrl;

  if (isPublicAssetPathname(pathname)) {
    return NextResponse.next();
  }

  if (pathname === "/login") {
    if (!hasSession) {
      return NextResponse.next();
    }

    const redirectTo = normalizeLoginRedirectPath(request.nextUrl.searchParams.get("redirectTo"));
    return NextResponse.redirect(new URL(redirectTo, request.url));
  }

  if (!hasSession && isProtectedPathname(pathname)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", createCurrentPath(request));
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}
