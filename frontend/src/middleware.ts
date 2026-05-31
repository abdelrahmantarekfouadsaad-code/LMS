import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

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
    "/parent-dashboard/:path*"
  ]
};
