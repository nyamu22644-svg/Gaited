
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // 1. Check if user is logged in
  if (session) {
    // 2. Fetch Profile Completion Status
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_profile_complete, role')
      .eq('id', session.user.id)
      .single();

    // 3. Admin Route Protection
    if (req.nextUrl.pathname.startsWith('/admin')) {
        if (profile?.role !== 'admin') {
            return NextResponse.redirect(new URL('/', req.url));
        }
    }

    // 4. Onboarding Enforcement
    // If profile is NOT complete and user is NOT already on the onboarding page
    if (profile && !profile.is_profile_complete && !req.nextUrl.pathname.startsWith('/onboarding')) {
      return NextResponse.redirect(new URL('/onboarding', req.url));
    }

    // 5. Prevent completed users from re-visiting onboarding
    if (profile && profile.is_profile_complete && req.nextUrl.pathname.startsWith('/onboarding')) {
      return NextResponse.redirect(new URL('/', req.url));
    }
  } else {
    // Redirect to login if trying to access protected routes (optional logic)
    if (req.nextUrl.pathname.startsWith('/wallet') || req.nextUrl.pathname.startsWith('/onboarding')) {
        return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
