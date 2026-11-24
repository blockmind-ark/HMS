import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UltrasoundServiceInputSchema } from "@/lib/validation/services";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 401 });
    }

    const services = await prisma.ultrasoundService.findMany({
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ services });
  } catch (error: any) {
    console.error("Failed to fetch ultrasound services (Admin):", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load ultrasound services" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 401 });
    }

    const body = await req.json();
    const parseResult = UltrasoundServiceInputSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, price, isActive } = parseResult.data;

    // Check uniqueness
    const existing = await prisma.ultrasoundService.findUnique({
      where: { name },
    });
    if (existing) {
      return NextResponse.json(
        { error: `An ultrasound service named "${name}" already exists.` },
        { status: 409 }
      );
    }

    const newService = await prisma.ultrasoundService.create({
      data: {
        name,
        price,
        isActive,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "ULTRASOUND_SERVICE_CREATED",
        details: `Created ultrasound service "${name}" with price Rs. ${price} (Active: ${isActive})`,
      },
    });

    return NextResponse.json({
      success: true,
      service: newService,
      message: `Ultrasound service "${name}" successfully added.`,
    });
  } catch (error: any) {
    console.error("Failed to create ultrasound service:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create ultrasound service" },
      { status: 500 }
    );
  }
}
