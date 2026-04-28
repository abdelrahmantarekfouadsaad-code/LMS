import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Roles that skip onboarding entirely (staff/admin)
const STAFF_ROLES = ['SUPER_ADMIN', 'TECH_SUPPORT', 'SUPERVISOR', 'TEACHER'];

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    const isStaff = STAFF_ROLES.includes(token?.role as string);
    const isOnboarded = token?.isOnboarded === true;
    const isOnboardingPage = pathname === '/onboarding';

    // Staff roles always skip onboarding — redirect away if they land on it
    if (isStaff && isOnboardingPage) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // Non-staff, not yet onboarded → force to onboarding page
    if (!isStaff && !isOnboarded && !isOnboardingPage) {
      return NextResponse.redirect(new URL('/onboarding', req.url));
    }

    // Already onboarded but trying to access /onboarding → redirect to dashboard
    if (isOnboarded && isOnboardingPage) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/login',
    }
  }
);

// Protect all internal application routes + the onboarding page
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/learning/:path*",
    "/live/:path*",
    "/quizzes/:path*",
    "/community/:path*",
    "/chat/:path*",
    "/sessions/:path*",
    "/settings/:path*",
    "/payment/:path*",
    "/support/:path*",
    "/onboarding",
  ]
};
