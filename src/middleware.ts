import { NextRequest, NextResponse } from "next/server";
import { createMiddlewareClient } from "@/lib/supabase/middleware";

// Security headers applied to every response (per contract).
const SECURITY_HEADERS: Record<string, string> = {
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://*.supabase.co; connect-src 'self' https://*.supabase.co",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "geolocation=(), camera=(), microphone=()",
};

// TODO: Implement the main middleware function:
// 1. Create response via NextResponse.next({ request }) to forward mutated cookies.
// 2. Call createMiddlewareClient(request, response) to build the Supabase client.
// 3. Call supabase.auth.getUser() — this triggers access-token refresh and updates cookies.
// 4. For /api/* routes that are not auth endpoints, enforce CORS: allow only same-origin
//    requests (check Origin header matches request host or is absent). Return 403 on mismatch.
// 5. For write methods (POST/PUT/DELETE) on /api/* non-auth routes, enforce Origin check
//    as CSRF defense (SameSite=Lax cookie is the primary defense; this is belt-and-suspenders).
// 6. Attach all SECURITY_HEADERS to the response.
// 7. Return the response (with updated Set-Cookie from Supabase refresh).
export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });

  // TODO: const supabase = createMiddlewareClient(request, response)
  // TODO: await supabase.auth.getUser()  — refreshes session cookies in-place

  // TODO: CORS enforcement for /api/* (same-origin only per contract)

  // Attach security headers
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }

  return response;
}

export const config = {
  matcher: [
    // Run on all routes except Next.js internals and static files
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
