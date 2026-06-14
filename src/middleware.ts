import { NextRequest, NextResponse } from "next/server";
import { createMiddlewareClient } from "@/lib/supabase/middleware";

const SECURITY_HEADERS: Record<string, string> = {
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://*.supabase.co; connect-src 'self' https://*.supabase.co",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "geolocation=(), camera=(), microphone=()",
};

const WRITE_METHODS = new Set(["POST", "PUT", "DELETE"]);

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });

  const supabase = createMiddlewareClient(request, response);
  await supabase.auth.getUser();

  response.headers.set("x-pathname", request.nextUrl.pathname);

  if (
    WRITE_METHODS.has(request.method) &&
    request.nextUrl.pathname.startsWith("/api/")
  ) {
    const origin = request.headers.get("origin");
    if (origin !== null) {
      const requestHost = request.nextUrl.host;
      let originHost: string;
      try {
        originHost = new URL(origin).host;
      } catch {
        return new NextResponse("Forbidden", { status: 403 });
      }
      if (originHost !== requestHost) {
        return new NextResponse("Forbidden", { status: 403 });
      }
    }
  }

  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
