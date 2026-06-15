import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    if (token) {
      const isOnboarded = token.isOnboarded;
      const role = token.role;

      // 1. Force non-onboarded users to the onboarding page
      if ((!isOnboarded || !role) && pathname !== "/onboarding") {
        return NextResponse.redirect(new URL("/onboarding", req.url));
      }

      // 2. Prevent already onboarded users from going back to the onboarding flow
      if (isOnboarded && role && pathname === "/onboarding") {
        if (role === "PARENT") {
          return NextResponse.redirect(new URL("/parent-dashboard", req.url));
        }
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }

      // 3. Strict Role-Based Route Protection
      if (pathname.startsWith('/teacher') && role !== 'TEACHER' && role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
      
      if (pathname.startsWith('/super-admin') && role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/learning/:path*",
    "/projects/:path*",
    "/certificates/:path*",
    "/resources/:path*",
    "/schedule/:path*",
    "/weekly-schedule/:path*",
    "/self-learning/:path*",
    "/exams/:path*",
    "/payment/:path*",
    "/community/:path*",
    "/chat/:path*",
    "/quizzes/:path*",
    "/sessions/:path*",
    "/settings/:path*",
    "/support/:path*",
    "/parent-dashboard/:path*",
    "/parent/:path*",
    "/onboarding",
    "/teacher/:path*",
    "/super-admin/:path*"
  ]
};
