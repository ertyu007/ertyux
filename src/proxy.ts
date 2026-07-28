import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { scanForThreats } from "@/lib/sanitizer";
import { logSecurityEvent } from "@/lib/audit-logger";

// In-Memory Rate Limiting for Middleware (Sliding Window per IP)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 60; // 60 requests per minute for sensitive endpoints
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  record.count += 1;
  if (record.count > RATE_LIMIT_MAX) {
    return true;
  }
  return false;
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "127.0.0.1";
  const userAgent = request.headers.get("user-agent") || "unknown";
  const method = request.method;

  // 1. Threat Pattern Scanner (Query Parameters & URL path)
  const fullUrl = `${pathname}${search}`;
  const threatScan = scanForThreats(fullUrl);

  if (!threatScan.isSafe) {
    await logSecurityEvent({
      eventType: "SUSPICIOUS_PAYLOAD",
      severity: "CRITICAL",
      ipAddress: ip,
      userAgent,
      path: pathname,
      method,
      details: {
        matchedPattern: threatScan.matchedPattern,
        fullUrl,
      },
    });

    return new NextResponse(
      JSON.stringify({ error: "Malicious payload or suspicious pattern detected." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // 2. Rate Limiting on sensitive routes (/admin, /api)
  if (pathname.startsWith("/admin") || pathname.startsWith("/api")) {
    if (isRateLimited(ip)) {
      await logSecurityEvent({
        eventType: "RATE_LIMIT_EXCEEDED",
        severity: "WARN",
        ipAddress: ip,
        userAgent,
        path: pathname,
        method,
      });

      return new NextResponse(
        JSON.stringify({ error: "Too many requests. Please slow down." }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  // 3. Admin Access Audit
  if (pathname.startsWith("/admin")) {
    const adminSession = request.cookies.get("admin_session")?.value;
    if (!adminSession) {
      await logSecurityEvent({
        eventType: "UNAUTHORIZED_ACCESS",
        severity: "WARN",
        ipAddress: ip,
        userAgent,
        path: pathname,
        method,
        details: { message: "Attempted unauthenticated access to admin portal" },
      });
    }
  }

  // 4. Construct Security Headers Response
  const response = NextResponse.next();

  // Security Headers
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=()"
  );
  response.headers.set("X-XSS-Protection", "1; mode=block");

  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }

  // Content-Security-Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Needed for Next.js & React Three Fiber
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https://images.unsplash.com https://*.supabase.co",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.emailjs.com",
    "frame-ancestors 'none'",
  ].join("; ");

  response.headers.set("Content-Security-Policy", csp);

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static files, _next internal routes, and favicon
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
