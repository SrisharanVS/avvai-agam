import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

const ADMIN_COOKIE = "avvai_admin_token";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect admin dashboard routes
  const isAdminDashboard = pathname.startsWith("/admin/dashboard");

  // Publicly accessible paths under matched API routes
  const isPublicApi =
    (request.method === "POST" && pathname === "/api/orders") ||
    (request.method === "GET" &&
      pathname.startsWith("/api/invoices/by-order/") &&
      pathname.endsWith("/download"));

  // Protect admin API routes
  const isAdminApi =
    pathname.startsWith("/api/") &&
    !pathname.startsWith("/api/auth") &&
    !pathname.startsWith("/api/products") &&
    !pathname.startsWith("/api/categories") &&
    !pathname.startsWith("/api/newsletter") &&
    !isPublicApi;

  if (isAdminDashboard || isAdminApi) {
    const token = request.cookies.get(ADMIN_COOKIE)?.value;

    if (!token) {
      if (isAdminDashboard) {
        return NextResponse.redirect(new URL("/admin/login", request.url));
      }
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const payload = await verifyToken(token);
    if (!payload) {
      if (isAdminDashboard) {
        return NextResponse.redirect(new URL("/admin/login", request.url));
      }
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 401 }
      );
    }

    // Attach admin info to headers for downstream use
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-admin-id", payload.id);
    requestHeaders.set("x-admin-email", payload.email);
    requestHeaders.set("x-admin-role", payload.role);

    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // Redirect logged-in admin away from login page
  if (pathname === "/admin/login") {
    const token = request.cookies.get(ADMIN_COOKIE)?.value;
    if (token) {
      const payload = await verifyToken(token);
      if (payload) {
        return NextResponse.redirect(
          new URL("/admin/dashboard", request.url)
        );
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/api/invoices/:path*", "/api/orders/:path*", "/api/upload/:path*"],
};
