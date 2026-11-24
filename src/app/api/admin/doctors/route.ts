import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DoctorInputSchema } from "@/lib/validation/doctor";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { specialization: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    const doctors = await prisma.doctor.findMany({
      where,
      orderBy: { createdAt: "asc" },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: {
            visits: true,
            tokenLogs: true,
            attendances: true,
            leaves: true,
          },
        },
      },
    });

    return NextResponse.json({ doctors });
  } catch (error: any) {
    console.error("Failed to fetch doctors (Admin):", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load doctors" },
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
    const parseResult = DoctorInputSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parseResult.data;

    const doctor = await prisma.doctor.create({
      data: {
        name: data.name,
        specialization: data.specialization,
        phone: data.phone || null,
        email: data.email || null,
        baseSalary: data.baseSalary,
        payType: data.payType,
        perPatientShare: data.perPatientShare,
        userId: data.userId || null,
        isActive: data.isActive,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "DOCTOR_CREATED",
        details: `Created doctor profile "${doctor.name}" (${doctor.specialization}) with base pay Rs. ${doctor.baseSalary}`,
      },
    });

    return NextResponse.json({
      success: true,
      doctor,
      message: `Doctor "${doctor.name}" added successfully.`,
    });
  } catch (error: any) {
    console.error("Failed to create doctor:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create doctor" },
      { status: 500 }
    );
  }
}
