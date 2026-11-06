import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getClientIp, getPortalConfig } from "@/lib/security/ip-restriction";
import os from "os";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientIp = getClientIp(req);

  // Discover server network IPv4 addresses
  const networkInterfaces = os.networkInterfaces();
  const lanIps: string[] = [];

  for (const name of Object.keys(networkInterfaces)) {
    const interfaces = networkInterfaces[name];
    if (interfaces) {
      for (const iface of interfaces) {
        if (iface.family === "IPv4" && !iface.internal) {
          lanIps.push(iface.address);
        }
      }
    }
  }

  // Primary LAN IP
  const primaryLanIp = lanIps[0] || "192.168.1.34";
  const port = process.env.PORT || "3000";
  const lanBaseUrl = `http://${primaryLanIp}:${port}`;

  const adminConfig = getPortalConfig("admin");
  const receptionistConfig = getPortalConfig("receptionist");
  const doctorConfig = getPortalConfig("doctor");
  const pharmacistConfig = getPortalConfig("pharmacist");

  return NextResponse.json({
    clientIp,
    primaryLanIp,
    lanIps,
    port,
    lanBaseUrl,
    localhostUrl: `http://localhost:${port}`,
    restrictionsEnabled: adminConfig.enabled,
    portals: {
      admin: {
        name: "Admin Control Center",
        path: "/admin",
        lanUrl: `${lanBaseUrl}/admin`,
        allowedIps: adminConfig.allowedIps,
        allowedDomains: adminConfig.allowedDomains,
      },
      receptionist: {
        name: "Reception Desk Portal",
        path: "/receptionist",
        lanUrl: `${lanBaseUrl}/receptionist`,
        allowedIps: receptionistConfig.allowedIps,
        allowedDomains: receptionistConfig.allowedDomains,
      },
      doctor: {
        name: "Doctor Consultation Portal",
        path: "/doctor",
        lanUrl: `${lanBaseUrl}/doctor`,
        allowedIps: doctorConfig.allowedIps,
        allowedDomains: doctorConfig.allowedDomains,
      },
      pharmacist: {
        name: "Pharmacy POS Portal",
        path: "/pharmacist",
        lanUrl: `${lanBaseUrl}/pharmacist`,
        allowedIps: pharmacistConfig.allowedIps,
        allowedDomains: pharmacistConfig.allowedDomains,
      },
    },
    database: {
      host: primaryLanIp,
      port: 5432,
      database: "hms",
    },
  });
}

