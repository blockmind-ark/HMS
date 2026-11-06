import { withAuth } from "next-auth/middleware";
import { NextRequest, NextResponse } from "next/server";
import { checkPortalAccess, getPortalFromPath } from "@/lib/security/ip-restriction";

const authMiddleware = withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;
    const role = token?.role;

    // Admin routes protection
    if (path.startsWith("/admin")) {
      if (role !== "ADMIN") {
        if (role === "RECEPTIONIST") {
          return NextResponse.redirect(new URL("/receptionist", req.url));
        } else if (role === "PHARMACIST") {
          return NextResponse.redirect(new URL("/pharmacist", req.url));
        } else if (role === "DOCTOR") {
          return NextResponse.redirect(new URL("/doctor", req.url));
        }
        return NextResponse.redirect(new URL("/login", req.url));
      }
    }

    // Receptionist routes protection
    if (path.startsWith("/receptionist")) {
      if (role !== "RECEPTIONIST" && role !== "ADMIN") {
        if (role === "PHARMACIST") {
          return NextResponse.redirect(new URL("/pharmacist", req.url));
        } else if (role === "DOCTOR") {
          return NextResponse.redirect(new URL("/doctor", req.url));
        }
        return NextResponse.redirect(new URL("/login", req.url));
      }
    }

    // Pharmacist routes protection
    if (path.startsWith("/pharmacist")) {
      if (role !== "PHARMACIST" && role !== "ADMIN") {
        if (role === "RECEPTIONIST") {
          return NextResponse.redirect(new URL("/receptionist", req.url));
        } else if (role === "DOCTOR") {
          return NextResponse.redirect(new URL("/doctor", req.url));
        }
        return NextResponse.redirect(new URL("/login", req.url));
      }
    }

    // Doctor routes protection
    if (path.startsWith("/doctor")) {
      if (role !== "DOCTOR" && role !== "ADMIN") {
        if (role === "RECEPTIONIST") {
          return NextResponse.redirect(new URL("/receptionist", req.url));
        } else if (role === "PHARMACIST") {
          return NextResponse.redirect(new URL("/pharmacist", req.url));
        }
        return NextResponse.redirect(new URL("/login", req.url));
      }
    }

    return NextResponse.next();
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

export default async function middleware(req: NextRequest, event: any) {
  const path = req.nextUrl.pathname;
  const portal = getPortalFromPath(path);

  // 1. Workstation IP & Domain Authorization Check (runs before auth redirect)
  if (portal) {
    const access = checkPortalAccess(req, portal);
    if (!access.allowed) {
      if (path.startsWith("/api/")) {
        return NextResponse.json(
          {
            error: access.reason || "Workstation IP not authorized for this portal",
            clientIp: access.clientIp,
            portal,
          },
          { status: 403 }
        );
      }
      const deniedUrl = new URL("/access-denied", req.url);
      deniedUrl.searchParams.set("portal", portal);
      deniedUrl.searchParams.set("ip", access.clientIp);
      if (access.reason) {
        deniedUrl.searchParams.set("reason", access.reason);
      }
      return NextResponse.redirect(deniedUrl);
    }
  }

  // 2. Authentication & Role-based Routing Check
  return (authMiddleware as any)(req, event);
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/receptionist/:path*",
    "/pharmacist/:path*",
    "/doctor/:path*",
    "/api/admin/:path*",
    "/api/receptionist/:path*",
    "/api/pharmacist/:path*",
    "/api/doctor/:path*",
  ],
};
