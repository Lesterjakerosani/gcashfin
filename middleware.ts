import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth|auth|api/health).*)"],
};

export default withAuth(
  function middleware(req) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        if (path.startsWith("/auth")) return true;
        if (path.startsWith("/api/auth")) return true;
        if (path === "/api/health") return true;
        return !!token;
      },
    },
  }
);
