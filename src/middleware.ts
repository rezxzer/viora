import { NextResponse, type NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

type CookieSetOptions = {
  maxAge?: number
  path?: string
  domain?: string
  secure?: boolean
  httpOnly?: boolean
  sameSite?: "lax" | "strict" | "none"
};

export async function middleware(req: NextRequest) {
  const res = NextResponse.next({ request: { headers: req.headers } });

  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const protectedPaths = [
    "/feed",
    "/chat",
    "/profile",
    "/settings",
    "/premium",
  ];

  const { pathname } = req.nextUrl;
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

  if (isProtected && !session) {
    const url = req.nextUrl.clone();
    url.pathname = "/sign-in";
    url.searchParams.set("message", "Please sign in to continue.");
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};


