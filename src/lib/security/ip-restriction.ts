import type { NextRequest } from "next/server";

export type PortalKey = "admin" | "receptionist" | "doctor" | "pharmacist";

export interface IpCheckResult {
  allowed: boolean;
  clientIp: string;
  portal: PortalKey;
  host: string;
  reason?: string;
}

/**
 * Extracts the real client IP from Next.js request headers
 */
export function getClientIp(req: NextRequest): string {
  // 1. Check standard reverse proxy headers
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    // If multiple IPs are chained (client, proxy1, proxy2), the first one is the client
    const firstIp = forwardedFor.split(",")[0]?.trim();
    if (firstIp) return normalizeIp(firstIp);
  }

  const realIp = req.headers.get("x-real-ip");
  if (realIp) return normalizeIp(realIp.trim());

  const clientIp = req.headers.get("x-client-ip") || req.headers.get("cf-connecting-ip");
  if (clientIp) return normalizeIp(clientIp.trim());

  // 2. Fall back to Next.js req.ip if available
  if (req.ip) return normalizeIp(req.ip.trim());

  return "127.0.0.1";
}

/**
 * Normalize IPv4-mapped IPv6 or localhost strings
 */
export function normalizeIp(ip: string): string {
  let clean = ip.trim();
  // Strip IPv6-mapped IPv4 prefix (e.g. ::ffff:192.168.1.34 -> 192.168.1.34)
  if (clean.startsWith("::ffff:")) {
    clean = clean.substring(7);
  }
  // Normalize IPv6 loopback
  if (clean === "::1") {
    clean = "127.0.0.1";
  }
  return clean;
}

/**
 * Converts an IPv4 string to a 32-bit integer for CIDR calculations
 */
function ipToLong(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  let num = 0;
  for (let i = 0; i < 4; i++) {
    const octet = parseInt(parts[i], 10);
    if (isNaN(octet) || octet < 0 || octet > 255) return null;
    num = (num << 8) + octet;
  }
  return num >>> 0;
}

/**
 * Checks whether clientIp matches an allowed pattern:
 * - '*' allows everything
 * - 'localhost' or '127.0.0.1' matches local loopback
 * - Exact IP match: '192.168.1.50'
 * - CIDR subnet match: '192.168.1.0/24'
 */
export function isIpAllowed(clientIp: string, allowedPattern: string): boolean {
  const pattern = allowedPattern.trim();
  if (!pattern || pattern === "*") return true;

  const normClient = normalizeIp(clientIp);

  // Localhost aliases
  if (pattern.toLowerCase() === "localhost") {
    return normClient === "127.0.0.1";
  }

  // Exact match
  if (normClient === pattern) {
    return true;
  }

  // CIDR match (e.g. 192.168.1.0/24)
  if (pattern.includes("/")) {
    const [network, maskStr] = pattern.split("/");
    const maskBits = parseInt(maskStr, 10);
    if (!isNaN(maskBits) && maskBits >= 0 && maskBits <= 32) {
      const clientLong = ipToLong(normClient);
      const networkLong = ipToLong(network);
      if (clientLong !== null && networkLong !== null) {
        if (maskBits === 0) return true;
        const mask = ((0xffffffff << (32 - maskBits)) >>> 0);
        return ((clientLong & mask) >>> 0) === ((networkLong & mask) >>> 0);
      }
    }
  }

  return false;
}

/**
 * Checks if a domain/hostname is allowed
 */
export function isDomainAllowed(hostHeader: string, allowedPattern: string): boolean {
  const pattern = allowedPattern.trim().toLowerCase();
  if (!pattern || pattern === "*") return true;

  // Strip port from host header (e.g. 'hospital.local:3000' -> 'hospital.local')
  const host = hostHeader.split(":")[0]?.trim().toLowerCase() || "";
  
  const allowedList = pattern.split(",").map((d) => d.trim().toLowerCase());
  return allowedList.some((allowed) => allowed === "*" || allowed === host);
}

/**
 * Reads portal restriction settings from environment variables
 */
export function getPortalConfig(portal: PortalKey): {
  enabled: boolean;
  allowedIps: string[];
  allowedDomains: string[];
} {
  const globalEnabled =
    process.env.PORTAL_IP_RESTRICTIONS_ENABLED === "true" ||
    process.env.PORTAL_RESTRICTIONS_ENABLED === "true";

  const keyUpper = portal.toUpperCase();

  // Allowed IPs from env, comma-separated (e.g. ALLOWED_IPS_ADMIN="127.0.0.1, 192.168.1.34")
  const rawIps = process.env[`ALLOWED_IPS_${keyUpper}`] || "*";
  const allowedIps = rawIps.split(",").map((s) => s.trim()).filter(Boolean);

  // Allowed domains from env (e.g. ALLOWED_DOMAINS_ADMIN="admin.hospital.local")
  const rawDomains = process.env[`ALLOWED_DOMAINS_${keyUpper}`] || "*";
  const allowedDomains = rawDomains.split(",").map((s) => s.trim()).filter(Boolean);

  return {
    enabled: globalEnabled,
    allowedIps: allowedIps.length > 0 ? allowedIps : ["*"],
    allowedDomains: allowedDomains.length > 0 ? allowedDomains : ["*"],
  };
}

/**
 * Detects which portal a URL path belongs to (if any)
 */
export function getPortalFromPath(path: string): PortalKey | null {
  if (path.startsWith("/admin") || path.startsWith("/api/admin")) return "admin";
  if (path.startsWith("/receptionist") || path.startsWith("/api/receptionist")) return "receptionist";
  if (path.startsWith("/doctor") || path.startsWith("/api/doctor")) return "doctor";
  if (path.startsWith("/pharmacist") || path.startsWith("/api/pharmacist")) return "pharmacist";
  return null;
}

/**
 * Validates whether the incoming request is allowed to access the specified portal
 */
export function checkPortalAccess(req: NextRequest, portal: PortalKey): IpCheckResult {
  const clientIp = getClientIp(req);
  const host = req.headers.get("host") || "";
  const config = getPortalConfig(portal);

  // If restrictions are disabled, access is granted
  if (!config.enabled) {
    return { allowed: true, clientIp, portal, host };
  }

  // 1. Always allow localhost / host machine on the server itself to prevent admin lockouts
  const isLoopback =
    clientIp === "127.0.0.1" ||
    clientIp === "localhost" ||
    clientIp === "172.18.0.1" ||
    clientIp === "172.17.0.1";
  if (isLoopback) {
    return { allowed: true, clientIp, portal, host };
  }

  // 2. Validate Domain / Host Header
  const domainAllowed = config.allowedDomains.some((pattern) => isDomainAllowed(host, pattern));
  if (!domainAllowed) {
    return {
      allowed: false,
      clientIp,
      portal,
      host,
      reason: `Domain '${host}' is not authorized for the ${portal.toUpperCase()} portal. Allowed: ${config.allowedDomains.join(", ")}`,
    };
  }

  // 3. Validate Workstation Client IP
  const ipAllowed = config.allowedIps.some((pattern) => isIpAllowed(clientIp, pattern));
  if (!ipAllowed) {
    return {
      allowed: false,
      clientIp,
      portal,
      host,
      reason: `Workstation IP ${clientIp} is not authorized for the ${portal.toUpperCase()} portal.`,
    };
  }

  return { allowed: true, clientIp, portal, host };
}
