import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login"];

function getSessionToken(request: NextRequest): string | undefined {
  return (
    request.cookies.get("authjs.session-token")?.value ??
    request.cookies.get("__Secure-authjs.session-token")?.value
  );
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionToken = getSessionToken(request);
  const isAuthenticated = Boolean(sessionToken);
  const isPublicPath = PUBLIC_PATHS.includes(pathname);

  if (!isAuthenticated && !isPublicPath) {
    const loginUrl = new URL("/login", request.nextUrl);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthenticated && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$).*)",
  ],
};
