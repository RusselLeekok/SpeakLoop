import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/Login" || pathname.startsWith("/Login/")) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.replace(/^\/Login/, "/login");
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/Login/:path*"],
};
