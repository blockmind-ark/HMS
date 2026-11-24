import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TokenServiceInputSchema } from "@/lib/validation/services";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 401 });
    }

    const services = await prisma.tokenService.findMany({
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ services });
  } catch (error: any) {
    console.error("Failed to fetch token services (Admin):", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load token services" },
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
    const parseResult = TokenServiceInputSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, fee, isActive } = parseResult.data;

    const existing = await prisma.tokenService.findUnique({
      where: { name },
    });
    if (existing) {
      return NextResponse.json(
        { error: `A token service named "${name}" already exists.` },
        { status: 409 }
      );
    }

    const newService = await prisma.tokenService.create({
      data: {
        name,
        fee,
        isActive,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "TOKEN_SERVICE_CREATED",
        details: `Created token service "${name}" with fee Rs. ${fee} (Active: ${isActive})`,
      },
    });

    return NextResponse.json({
      success: true,
      service: newService,
      message: `Token service "${name}" successfully added.`,
    });
  } catch (error: any) {
    console.error("Failed to create token service:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create token service" },
      { status: 500 }
    );
  }
}
