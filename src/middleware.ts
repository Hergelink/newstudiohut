import createIntlMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";

import { routing } from "@/i18n/routing";
import { refreshSupabaseSession } from "@/lib/supabase/middleware";

const intlMiddleware = createIntlMiddleware(routing);

export async function middleware(request: NextRequest) {
  const isAuthVerificationRoute =
    request.nextUrl.pathname === "/auth/callback" ||
    request.nextUrl.pathname === "/auth/confirm";
  const response =
    isAuthVerificationRoute
      ? NextResponse.next()
      : intlMiddleware(request);

  return refreshSupabaseSession(request, response);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
