import { NextResponse, type NextRequest } from "next/server";

const isDev = process.env.NODE_ENV !== "production";

// Storage and question PDFs redirect to the Supabase project, so allow its exact origin even
// when it is not a *.supabase.co host (custom domain or local stack).
function supabaseOrigins() {
  try {
    const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
    const ws = url.protocol === "https:" ? "wss:" : "ws:";
    return { http: ` ${url.origin}`, ws: ` ${ws}//${url.host}` };
  } catch {
    return { http: "", ws: "" };
  }
}

const supabase = supabaseOrigins();

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: https://*.supabase.co https://i.ytimg.com${supabase.http}`,
  "font-src 'self' data:",
  `connect-src 'self' https://*.supabase.co wss://*.supabase.co${supabase.http}${supabase.ws}`,
  `media-src 'self' blob: https://*.supabase.co${supabase.http}`,
  "worker-src 'self' blob:",
  "frame-src 'self' https://www.youtube-nocookie.com https://www.youtube.com https://www.desmos.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  ...(!isDev ? ["upgrade-insecure-requests"] : []),
].join("; ");

function hasSupabaseSessionCookie(request: NextRequest) {
  return request.cookies.getAll().some((cookie) => cookie.name.startsWith("sb-") && cookie.name.includes("auth-token"));
}

function withSecurityHeaders(response: NextResponse) {
  response.headers.set("Content-Security-Policy", contentSecurityPolicy);
  return response;
}

export function proxy(request: NextRequest) {
  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const { pathname } = request.nextUrl;
  if (!configured) return withSecurityHeaders(NextResponse.next());

  if (pathname === "/admin" || pathname.startsWith("/admin?")) return withSecurityHeaders(NextResponse.next());

  if (pathname.startsWith("/admin") && !hasSupabaseSessionCookie(request)) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    url.searchParams.set("next", pathname);
    return withSecurityHeaders(NextResponse.redirect(url));
  }

  return withSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\..*).*)"],
};
