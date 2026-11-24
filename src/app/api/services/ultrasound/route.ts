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
    let services = await prisma.ultrasoundService.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
    });

    // Auto-seed defaults if table is empty on first deployment
    if (services.length === 0) {
      const presets = [
        { name: "Ultrasound Abdomen", price: 700.0 },
        { name: "Ultrasound TVS", price: 1200.0 },
        { name: "Ultrasound Liver, Kidney & Stomach", price: 1200.0 },
      ];
      for (const p of presets) {
        await prisma.ultrasoundService.upsert({
          where: { name: p.name },
          update: {},
          create: { name: p.name, price: p.price, isActive: true },
        });
      }
      services = await prisma.ultrasoundService.findMany({
        where: { isActive: true },
        orderBy: { createdAt: "asc" },
      });
    }

    return NextResponse.json({ services });
  } catch (error: any) {
    console.error("Failed to fetch active ultrasound services:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load ultrasound services" },
      { status: 500 }
    );
  }
}
