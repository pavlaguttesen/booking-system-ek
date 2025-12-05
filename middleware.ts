import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const supabaseToken = req.cookies.get("sb-access-token")?.value;

  const isLoggedIn = Boolean(supabaseToken);

  const { pathname } = req.nextUrl;

  // Public routes
  const publicRoutes = ["/login"];

  // If not logged in and not on a public route → redirect to /login
  if (!isLoggedIn && !publicRoutes.includes(pathname)) {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  // If logged in and tries to visit login → redirect to mypage
  if (isLoggedIn && pathname === "/login") {
    const myPageUrl = new URL("/mypage", req.url);
    return NextResponse.redirect(myPageUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api|static|favicon.ico).*)"],
};
