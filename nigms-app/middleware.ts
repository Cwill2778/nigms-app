import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

// Routes that require no authentication
const PUBLIC_ROUTES = ['/', '/login', '/signup', '/book', '/projects'];
const PUBLIC_PREFIXES = ['/legal/', '/api/newsletter', '/api/promo/', '/api/booking', '/api/webhooks/', '/api/auth/signup', '/api/auth/login'];

// Routes that require an authenticated client (non-admin)
const CLIENT_ROUTES = ['/dashboard', '/update-password'];
const CLIENT_PREFIXES = ['/work-orders/', '/payments/'];

// Admin route prefixes (both URL forms)
const ADMIN_PREFIXES = ['/admin-dashboard', '/clients', '/payments', '/work-orders'];

function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_ROUTES.includes(pathname)) return true;
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isAdminRoute(pathname: string): boolean {
  return ADMIN_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isClientRoute(pathname: string): boolean {
  if (CLIENT_ROUTES.includes(pathname)) return true;
  return CLIENT_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isProtectedRoute(pathname: string): boolean {
  return isAdminRoute(pathname) || isClientRoute(pathname);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Build a response we can mutate (for cookie refresh)
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  // Create Supabase client using request/response cookies (no next/headers)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
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

  // Get the current session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // ── Rule 1 & 2: No session ──────────────────────────────────────────────────
  if (!session) {
    if (isProtectedRoute(pathname)) {
      // Rule 1: No session + protected route → redirect to /login
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/login';
      return NextResponse.redirect(loginUrl);
    }
    // Rule 2: No session + public route → allow through
    return response;
  }

  // ── Authenticated: fetch profile from public.users ──────────────────────────
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('role, requires_password_reset')
    .eq('id', session.user.id)
    .single();

  console.log('[middleware] user:', session.user.id, 'profile:', profile, 'error:', profileError);

  // Graceful handling: user exists in auth but not yet in public.users
  // Treat as a client with reset required so they can't access anything sensitive
  const role = profile?.role ?? 'client';
  const requiresPasswordReset = profile?.requires_password_reset ?? true;

  // ── Rules 3 & 4: Admin session ─────────────────────────────────────────────
  if (role === 'admin') {
    // Allow admins who need to reset their password to reach /update-password
    if (requiresPasswordReset && pathname === '/update-password') {
      return response;
    }
    if (isAdminRoute(pathname)) {
      // Rule 3: Admin session + admin route → allow
      return response;
    }
    // Rule 4: Admin session + non-admin route → redirect to /admin-dashboard
    const adminDashUrl = request.nextUrl.clone();
    adminDashUrl.pathname = '/admin-dashboard';
    return NextResponse.redirect(adminDashUrl);
  }

  // ── Rules 5–9: Client session ──────────────────────────────────────────────

  // Rule 9: Authenticated client accessing admin route → 403
  if (isAdminRoute(pathname)) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  if (requiresPasswordReset) {
    if (pathname === '/update-password') {
      // Rule 5: Client with reset=true + /update-password → allow
      return response;
    }
    // Rule 6: Client with reset=true + any other route → redirect to /update-password
    const updatePwUrl = request.nextUrl.clone();
    updatePwUrl.pathname = '/update-password';
    return NextResponse.redirect(updatePwUrl);
  }

  // requiresPasswordReset === false from here on
  if (pathname === '/update-password') {
    // Rule 7: Client with reset=false + /update-password → redirect to /dashboard
    const dashUrl = request.nextUrl.clone();
    dashUrl.pathname = '/dashboard';
    return NextResponse.redirect(dashUrl);
  }

  // Rule 8: Client with reset=false + client route → allow
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static  (static files)
     * - _next/image   (image optimisation)
     * - favicon.ico
     * - Any file with an extension (e.g. .png, .svg, .js, .css)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?)$).*)',
  ],
};
