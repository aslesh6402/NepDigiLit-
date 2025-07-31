import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

// Routes that require authentication
const protectedRoutes = [
  "/modules",
  "/dashboard",
  "/exams",
  "/chat",
  "/analytics",
];
// Routes that are only for unauthenticated users
const authRoutes = ["/login"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("auth-token")?.value;

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Check if the route is an auth route
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // If trying to access protected route without token
  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If has token, verify it
  if (token) {
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "your-secret-key"
      ) as { userId: string; email: string; role: string };

      // If user is authenticated and trying to access auth routes, redirect to appropriate dashboard
      if (isAuthRoute) {
        if (decoded.role === "STUDENT") {
          return NextResponse.redirect(new URL("/modules", request.url));
        } else if (decoded.role === "TEACHER") {
          return NextResponse.redirect(new URL("/dashboard", request.url));
        }
      }

      // Role-based route protection
      if (pathname.startsWith("/modules") && decoded.role !== "STUDENT") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }

      if (pathname.startsWith("/dashboard") && decoded.role !== "TEACHER") {
        return NextResponse.redirect(new URL("/modules", request.url));
      }

      if (pathname.startsWith("/analytics") && decoded.role !== "TEACHER") {
        return NextResponse.redirect(new URL("/modules", request.url));
      }
    } catch (error) {
      // Invalid token, redirect to login
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("auth-token");
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
};
