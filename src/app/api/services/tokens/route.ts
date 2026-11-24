import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Read live from PostgreSQL without hardcoded static lists
    let services = await prisma.tokenService.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
    });

    // Auto-seed defaults if table is empty on first deployment
    if (services.length === 0) {
      const presets = [
        { name: "OPD Fees", fee: 300.0 },
        { name: "Sugar Test", fee: 100.0 },
        { name: "U P D", fee: 100.0 },
        { name: "BP", fee: 50.0 },
      ];
      for (const p of presets) {
        await prisma.tokenService.upsert({
          where: { name: p.name },
          update: {},
          create: { name: p.name, fee: p.fee, isActive: true },
        });
      }
      services = await prisma.tokenService.findMany({
        where: { isActive: true },
        orderBy: { createdAt: "asc" },
      });
    }

    return NextResponse.json({ services });
  } catch (error: any) {
    console.error("Failed to fetch active token services:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load token services" },
      { status: 500 }
    );
  }
}
