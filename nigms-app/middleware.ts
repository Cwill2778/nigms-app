import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

// ── Route classification ────────────────────────────────────────────────────

/**
 * Public routes — accessible without authentication.
 * Exact matches and prefix matches are handled separately below.
 */
const PUBLIC_ROUTES = new Set([
  '/',
  '/login',
  '/signup',
  '/book',
  '/projects',
  '/update-password',
]);

const PUBLIC_PREFIXES = [
  '/legal/',
  '/api/auth/signup',
  '/api/auth/login',
  '/api/newsletter',
  '/api/promo/',
  '/api/booking',
  '/api/webhooks/',
];

/**
 * Admin routes — only accessible to users with role = 'admin'.
 *
 * Includes:
 * - /admin-dashboard        (main admin page)
 * - /clients, /payments     (admin route-group pages, no /admin/ prefix in URL)
 * - /work-orders            (shared path — admin sees all, client sees own)
 * - /api/admin/* (all admin API endpoints)
 *
 * NOTE: /work-orders is listed here so that the middleware can distinguish
 * between an admin visiting /work-orders (allowed) and a client visiting
 * /work-orders (also allowed via the client route check below). The order of
 * checks in the middleware function handles this correctly.
 */
const ADMIN_EXACT = new Set(['/admin-dashboard', '/clients', '/payments']);
const ADMIN_PREFIXES = ['/api/admin/'];

/**
 * Client routes — accessible to authenticated clients (role = 'client' | 'vip_client').
 */
const CLIENT_ROUTES = new Set(['/dashboard', '/messages']);
const CLIENT_PREFIXES = ['/work-orders/', '/onboarding/', '/assurance/', '/property/'];

// ── Route classification helpers ────────────────────────────────────────────

function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_ROUTES.has(pathname)) return true;
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

/**
 * Returns true if the pathname is an admin-only route.
 * /work-orders itself is NOT classified as admin-only here — it is accessible
 * to both roles (admin sees all orders, client sees their own).
 */
function isAdminOnlyRoute(pathname: string): boolean {
  if (ADMIN_EXACT.has(pathname)) return true;
  return ADMIN_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isClientRoute(pathname: string): boolean {
  if (CLIENT_ROUTES.has(pathname)) return true;
  return CLIENT_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isProtectedRoute(pathname: string): boolean {
  return isAdminOnlyRoute(pathname) || isClientRoute(pathname);
}

// ── Middleware ───────────────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Build a mutable response so we can refresh session cookies.
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  // Middleware must use createServerClient directly (not the next/headers
  // wrapper in lib/supabase.ts) because cookies() is not available here.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          // Write cookies to the request so the server sees them immediately.
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          // Rebuild the response so the refreshed cookies are sent to the browser.
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Retrieve the current session (also refreshes the session cookie if needed).
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // ── Unauthenticated ────────────────────────────────────────────────────────
  // Requirement 10.3: unauthenticated → /login for any protected route.
  if (!session) {
    if (!isPublicRoute(pathname) && isProtectedRoute(pathname)) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/login';
      return NextResponse.redirect(loginUrl);
    }
    return response;
  }

  // ── Authenticated: read data directly from the JWT (Instant!) ──
  const userMeta = session.user.user_metadata || {};
  
  // Extract role and state directly from the token, bypassing database queries
  const role = userMeta.role ?? 'client';
  const requiresPasswordReset = userMeta.requires_password_reset === true;

  // ── Admin ──────────────────────────────────────────────────────────────────
  // Requirement 10.5: admin → /admin-dashboard when accessing non-admin routes.
  if (role === 'admin') {
    // Allow admins to reach /update-password if they need to reset.
    if (requiresPasswordReset && pathname === '/update-password') {
      return response;
    }

    if (isAdminOnlyRoute(pathname)) {
      // Admin accessing an admin route → allow.
      return response;
    }

    if (isPublicRoute(pathname)) {
      // Admin accessing a public route (e.g. /login after sign-in) → redirect
      // to admin dashboard so they don't land on the wrong page.
      const adminDashUrl = request.nextUrl.clone();
      adminDashUrl.pathname = '/admin-dashboard';
      return NextResponse.redirect(adminDashUrl);
    }

    // Admin accessing any other route (client routes, /work-orders, etc.)
    // → redirect to admin dashboard.
    const adminDashUrl = request.nextUrl.clone();
    adminDashUrl.pathname = '/admin-dashboard';
    return NextResponse.redirect(adminDashUrl);
  }

  // ── Client (role = 'client' | 'vip_client') ────────────────────────────────

  // Requirement 10.7: client accessing admin-only routes → redirect to /dashboard.
  // This is the "403-equivalent" redirect described in the spec.
  if (isAdminOnlyRoute(pathname)) {
    const dashUrl = request.nextUrl.clone();
    dashUrl.pathname = '/dashboard';
    return NextResponse.redirect(dashUrl);
  }

  // Requirement 10.6: client with requires_password_reset=true → /update-password.
  if (requiresPasswordReset) {
    if (pathname === '/update-password') {
      // Already on the correct page — allow.
      return response;
    }
    const updatePwUrl = request.nextUrl.clone();
    updatePwUrl.pathname = '/update-password';
    return NextResponse.redirect(updatePwUrl);
  }

  // requiresPasswordReset === false from here on.

  // Prevent clients who have already reset their password from revisiting
  // /update-password unnecessarily.
  if (pathname === '/update-password') {
    const dashUrl = request.nextUrl.clone();
    dashUrl.pathname = '/dashboard';
    return NextResponse.redirect(dashUrl);
  }

  // ── Onboarding gate ────────────────────────────────────────────────────────
  // Requirement 2.1: clients who haven't completed onboarding must finish it
  // before accessing the main dashboard or other client routes.
  // Onboarding routes (/property, /assurance) and the API are always allowed.
  const isOnboardingRoute =
    pathname.startsWith('/property') ||
    pathname.startsWith('/assurance') ||
    pathname.startsWith('/api/client/onboarding') ||
    pathname.startsWith('/api/client/properties') ||
    pathname.startsWith('/api/promo/');

  if (!isOnboardingRoute) {
    // Read directly from JWT metadata instead of querying the 'onboarding_states' table
    const onboardingComplete = userMeta.onboarding_complete === true;

    if (!onboardingComplete) {
      const propertyUrl = request.nextUrl.clone();
      propertyUrl.pathname = '/property';
      return NextResponse.redirect(propertyUrl);
    }
  }

  // Client accessing a public or client route → allow.
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static  (static files)
     * - _next/image   (image optimisation)
     * - favicon.ico
     * - Files with a recognised static extension
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?)$).*)',
  ],
};