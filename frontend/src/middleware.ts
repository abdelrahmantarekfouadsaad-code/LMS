export { default } from "next-auth/middleware"

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/projects/:path*",
    "/certificates/:path*",
    "/resources/:path*",
    "/schedule/:path*",
    "/weekly-schedule/:path*",
    "/self-learning/:path*",
    "/exams/:path*",
    "/payment/:path*",
    "/community/:path*",
    "/chat/:path*"
  ]
}
