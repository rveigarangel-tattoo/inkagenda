import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const { pathname } = req.nextUrl
    const role = (token as any)?.role

    if (pathname === "/") {
      const url = req.nextUrl.clone()
      url.pathname = role === "artist" ? "/artist" : "/dashboard"
      return NextResponse.redirect(url)
    }

    if (role === "artist" && pathname.startsWith("/dashboard")) {
      const url = req.nextUrl.clone()
      url.pathname = "/artist"
      return NextResponse.redirect(url)
    }

    if (role === "admin" && pathname.startsWith("/artist")) {
      const url = req.nextUrl.clone()
      url.pathname = "/dashboard"
      return NextResponse.redirect(url)
    }

    return NextResponse.next()
  },
  {
    callbacks: { authorized: ({ token }) => !!token },
    pages: { signIn: "/login" },
  }
)

export const config = {
  matcher: ["/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)"],
}
